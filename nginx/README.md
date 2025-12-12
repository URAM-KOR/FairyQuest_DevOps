# Nginx Reverse Proxy 설정

## 서브도메인 구성

| 서브도메인 | 대상 | 포트 |
|-----------|------|------|
| grafana.fairyquest.click | Grafana | 3000 |
| prometheus.fairyquest.click | Prometheus | 9090 |

## 설치 방법

```bash
# 1. Nginx 설치
sudo apt install -y nginx

# 2. 설정 파일 복사
sudo cp nginx/grafana.fairyquest.click /etc/nginx/sites-available/
sudo cp nginx/prometheus.fairyquest.click /etc/nginx/sites-available/

# 3. 심볼릭 링크 생성
sudo ln -sf /etc/nginx/sites-available/grafana.fairyquest.click /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/prometheus.fairyquest.click /etc/nginx/sites-enabled/

# 4. 설정 테스트 및 재시작
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS 적용 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급 (DNS 설정 완료 후)
sudo certbot --nginx -d grafana.fairyquest.click -d prometheus.fairyquest.click
```

## DNS 설정

도메인 관리 사이트에서 A 레코드 추가:

| 타입 | 이름 | 값 |
|------|------|-----|
| A | grafana | 서버 IP |
| A | prometheus | 서버 IP |

