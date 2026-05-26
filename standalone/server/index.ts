import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initializeDatabase } from './db';

// 5대 라우터 모듈 임포트 ([NEW])
import settingsRouter from './routes/settings';
import documentsRouter from './routes/documents';
import chatRouter from './routes/chat';
import transactionsRouter from './routes/transactions';
import logsRouter from './routes/logs';

const app = new Hono();

// 1. CORS 정책 허용 (Vite React Client: http://localhost:3000 연동)
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

// 2. 헬스 체크 엔드포인트
app.get('/ping', (c) => c.json({ status: 'ok', message: 'Maru Company Standalone Server is Alive! 🧠' }));

// 3. 모듈화된 라우터 안전하게 마운트 (API Router Mount - [NEW])
app.route('/api', settingsRouter);
app.route('/api', documentsRouter);
app.route('/api', chatRouter);
app.route('/api', transactionsRouter);
app.route('/api', logsRouter);

// 4. 서버 기동 및 스키마 초기화
const port = 8000;
console.log(`🚀 Maru Company Hono.js API Server가 기동 중입니다... (Port: ${port})`);

initializeDatabase().then(() => {
  Bun.serve({
    fetch: app.fetch,
    port: port,
  });
  console.log(`🌐 백엔드 인스턴스가 http://localhost:${port} 에서 안전하게 바인딩 완료되었습니다. (모듈화 완료 🚀)`);
});
