# Project Root

모노레포 구조의 Node.js 앱 + Prometheus + Grafana 모니터링 시스템

## 📁 프로젝트 구조

```
project-root/
├─ apps/
│   ├─ app1/              # 앱1 (포트: 3001)
│   ├─ app2/              # 앱2 (포트: 3002)
│   └─ app3/              # 앱3 (포트: 3003)
├─ common/                # 공용 라이브러리
│   ├─ lib/               # Prisma 공용 클라이언트, utils
│   └─ components/        # 공용 UI 컴포넌트
├─ prometheus/            # Prometheus 설정
│   ├─ prometheus.yml     # 메트릭 수집 설정
│   └─ data/              # 시계열 데이터 저장
├─ grafana/               # Grafana 설정
│   ├─ provisioning/      # 자동 프로비저닝
│   │   ├─ datasources/   # 데이터소스 설정
│   │   └─ dashboards/    # 대시보드 설정
│   └─ data/              # Grafana 데이터
└─ docker-compose.yml     # 컨테이너 오케스트레이션
```

## 🚀 빠른 시작

### 1. 전체 스택 실행

```bash
# 모든 서비스 시작
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d prometheus grafana
```

### 2. 접속 정보

| 서비스 | URL | 기본 계정 |
|--------|-----|----------|
| App1 | http://localhost:3001 | - |
| App2 | http://localhost:3002 | - |
| App3 | http://localhost:3003 | - |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3000 | admin / admin123 |

### 3. 서비스 상태 확인

```bash
# 모든 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

## 📊 모니터링 설정

### Prometheus 메트릭 수집

각 앱에서 `/metrics` 엔드포인트를 통해 메트릭을 노출해야 합니다.

#### Node.js 앱에 prom-client 설치

```bash
npm install prom-client
```

#### 메트릭 엔드포인트 설정 (Express 예시)

```javascript
// src/metrics.js
const client = require('prom-client');

// 기본 메트릭 수집 활성화
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'nodejs_' });

// 커스텀 메트릭 정의
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

module.exports = { client, httpRequestDuration, httpRequestTotal };
```

```javascript
// src/app.js
const express = require('express');
const { client, httpRequestDuration, httpRequestTotal } = require('./metrics');

const app = express();

// 메트릭 미들웨어
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };
    end(labels);
    httpRequestTotal.inc(labels);
  });
  next();
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 메트릭 엔드포인트
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

module.exports = app;
```

### Grafana 대시보드

기본 대시보드가 자동으로 프로비저닝됩니다:
- **Apps Overview**: 전체 앱 상태, HTTP 요청률, 응답 시간, 메모리 사용량

커스텀 대시보드 추가:
1. Grafana UI에서 대시보드 생성
2. JSON 파일로 내보내기
3. `grafana/provisioning/dashboards/` 폴더에 저장

## 🔧 주요 명령어

```bash
# 서비스 시작
docker-compose up -d

# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart prometheus grafana

# 볼륨 포함 완전 삭제
docker-compose down -v

# Prometheus 설정 리로드 (핫 리로드)
curl -X POST http://localhost:9090/-/reload

# 로그 실시간 확인
docker-compose logs -f --tail=100
```

## 📈 주요 PromQL 쿼리

```promql
# 서비스 상태
up

# HTTP 요청률 (초당)
rate(http_requests_total[5m])

# HTTP 응답 시간 P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# HTTP 응답 시간 P50
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# 메모리 사용량
nodejs_heap_size_used_bytes

# 에러율
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

## ⚠️ 주의사항

1. **데이터 영속성**: `prometheus/data`와 `grafana/data` 폴더는 컨테이너 볼륨으로 마운트됩니다. 삭제 시 데이터가 손실됩니다.

2. **보안**: 프로덕션 환경에서는 반드시 `GF_SECURITY_ADMIN_PASSWORD`를 변경하세요.

3. **리소스**: Prometheus 데이터 보존 기간은 15일로 설정되어 있습니다. 필요에 따라 조정하세요.

## 📝 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `GF_SECURITY_ADMIN_USER` | Grafana 관리자 ID | admin |
| `GF_SECURITY_ADMIN_PASSWORD` | Grafana 관리자 비밀번호 | admin123 |
| `NODE_ENV` | Node.js 환경 | development |

## 🔗 참고 자료

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prom-client (Node.js)](https://github.com/siimon/prom-client)

