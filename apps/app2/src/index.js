/**
 * App2 Entry Point
 */
require('dotenv').config();
const express = require('express');
const {
  metricsMiddleware,
  setupMetricsEndpoint,
} = require('../../../common/lib/metrics');

// ============================================
// 상수 정의
// ============================================
const APP_NAME = process.env.APP_NAME || 'app2';
const PORT = parseInt(process.env.PORT, 10) || 3002;

// ============================================
// Express 앱 설정
// ============================================
const app = express();

// JSON 파싱
app.use(express.json());

// 메트릭 미들웨어 적용
app.use(metricsMiddleware(APP_NAME));

// 메트릭 엔드포인트 설정
setupMetricsEndpoint(app);

// ============================================
// 라우트
// ============================================

// 헬스체크
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: APP_NAME,
    timestamp: new Date().toISOString(),
  });
});

// 루트
app.get('/', (req, res) => {
  res.json({
    message: `Welcome to ${APP_NAME}`,
    version: '1.0.0',
  });
});

// 예시 API
app.get('/api/example', async (req, res) => {
  // 랜덤 지연 시뮬레이션
  const delay = Math.random() * 100;
  await new Promise((resolve) => setTimeout(resolve, delay));

  res.json({
    data: 'example response',
    processingTime: `${delay.toFixed(2)}ms`,
  });
});

// ============================================
// 서버 시작
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 ${APP_NAME} is running on port ${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});

module.exports = app;

