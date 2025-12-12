/**
 * 공용 Prometheus 메트릭 모듈
 * 각 앱에서 이 모듈을 import하여 일관된 메트릭 수집
 */

const client = require('prom-client');

// ============================================
// 기본 설정
// ============================================
const METRIC_PREFIX = 'app_';
const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

// ============================================
// 기본 Node.js 메트릭 수집 활성화
// ============================================
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ============================================
// HTTP 메트릭
// ============================================
const httpRequestDuration = new client.Histogram({
  name: `${METRIC_PREFIX}http_request_duration_seconds`,
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: DEFAULT_BUCKETS,
});

const httpRequestTotal = new client.Counter({
  name: `${METRIC_PREFIX}http_requests_total`,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

const httpRequestsInProgress = new client.Gauge({
  name: `${METRIC_PREFIX}http_requests_in_progress`,
  help: 'Number of HTTP requests currently in progress',
  labelNames: ['service'],
});

// ============================================
// 데이터베이스 메트릭
// ============================================
const dbQueryDuration = new client.Histogram({
  name: `${METRIC_PREFIX}db_query_duration_seconds`,
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model', 'service'],
  buckets: DEFAULT_BUCKETS,
});

const dbQueryTotal = new client.Counter({
  name: `${METRIC_PREFIX}db_queries_total`,
  help: 'Total number of database queries',
  labelNames: ['operation', 'model', 'status', 'service'],
});

const dbConnectionPool = new client.Gauge({
  name: `${METRIC_PREFIX}db_connection_pool`,
  help: 'Database connection pool status',
  labelNames: ['state', 'service'],
});

// ============================================
// 비즈니스 메트릭 (예시)
// ============================================
const businessEventsTotal = new client.Counter({
  name: `${METRIC_PREFIX}business_events_total`,
  help: 'Total number of business events',
  labelNames: ['event_type', 'service'],
});

// ============================================
// Express 미들웨어
// ============================================
function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    // 메트릭 엔드포인트는 제외
    if (req.path === '/metrics') {
      return next();
    }

    const end = httpRequestDuration.startTimer();
    httpRequestsInProgress.inc({ service: serviceName });

    res.on('finish', () => {
      const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
        service: serviceName,
      };
      end(labels);
      httpRequestTotal.inc(labels);
      httpRequestsInProgress.dec({ service: serviceName });
    });

    next();
  };
}

// ============================================
// Express 라우터 설정
// ============================================
function setupMetricsEndpoint(app) {
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (error) {
      res.status(500).end(error.message);
    }
  });
}

// ============================================
// Prisma 미들웨어 (쿼리 메트릭)
// ============================================
function prismaMetricsMiddleware(serviceName) {
  return async (params, next) => {
    const end = dbQueryDuration.startTimer({
      operation: params.action,
      model: params.model || 'unknown',
      service: serviceName,
    });

    try {
      const result = await next(params);
      dbQueryTotal.inc({
        operation: params.action,
        model: params.model || 'unknown',
        status: 'success',
        service: serviceName,
      });
      end();
      return result;
    } catch (error) {
      dbQueryTotal.inc({
        operation: params.action,
        model: params.model || 'unknown',
        status: 'error',
        service: serviceName,
      });
      end();
      throw error;
    }
  };
}

// ============================================
// 내보내기
// ============================================
module.exports = {
  client,
  register: client.register,
  // HTTP 메트릭
  httpRequestDuration,
  httpRequestTotal,
  httpRequestsInProgress,
  // DB 메트릭
  dbQueryDuration,
  dbQueryTotal,
  dbConnectionPool,
  // 비즈니스 메트릭
  businessEventsTotal,
  // 미들웨어 & 헬퍼
  metricsMiddleware,
  setupMetricsEndpoint,
  prismaMetricsMiddleware,
};

