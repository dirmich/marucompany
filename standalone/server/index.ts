import { Hono } from 'hono';
import { cors } from 'hono/cors';
import sql, { initializeDatabase } from './db';

const app = new Hono();

// 1. CORS 정책 허용 (Vite React Client: http://localhost:3000 연동)
app.use(
  '/api/*',
  cors({
    origin: '*', // 개발의 편의성을 위해 모든 origin 허용
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

// 2. 헬스 체크 엔드포인트
app.get('/ping', (c) => c.json({ status: 'ok', message: 'Maru Company Standalone Server is Alive! 🧠' }));

// 3. Settings API
app.get('/api/settings', async (c) => {
  try {
    const settings = await sql`
      SELECT * FROM settings 
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    if (settings.length > 0) {
      return c.json(settings[0]);
    }
    return c.json({ message: 'No settings found' }, 404);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post('/api/settings', async (c) => {
  try {
    const body = await c.req.json();
    const { llm_type, llm_url, llm_model, telegram_token, chat_id, calendar_linked, brain_path } = body;

    // 기존 설정 유무 검증 후 최신 행 업데이트 또는 인서트
    const existing = await sql`SELECT id FROM settings ORDER BY id DESC LIMIT 1`;

    if (existing.length > 0) {
      const updated = await sql`
        UPDATE settings
        SET llm_type = ${llm_type},
            llm_url = ${llm_url},
            llm_model = ${llm_model},
            telegram_token = ${telegram_token},
            chat_id = ${chat_id},
            calendar_linked = ${calendar_linked},
            brain_path = ${brain_path},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
      return c.json({ success: true, data: updated[0] });
    } else {
      const inserted = await sql`
        INSERT INTO settings (llm_type, llm_url, llm_model, telegram_token, chat_id, calendar_linked, brain_path)
        VALUES (${llm_type}, ${llm_url}, ${llm_model}, ${telegram_token}, ${chat_id}, ${calendar_linked}, ${brain_path})
        RETURNING *
      `;
      return c.json({ success: true, data: inserted[0] });
    }
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// 4. Chat Messages API
app.get('/api/chat/messages', async (c) => {
  try {
    const messages = await sql`
      SELECT * FROM chat_messages 
      ORDER BY id ASC
    `;
    return c.json(messages);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post('/api/chat/messages', async (c) => {
  try {
    const body = await c.req.json();
    const { id, sender, sender_name, text, timestamp } = body;

    const inserted = await sql`
      INSERT INTO chat_messages (id, sender, sender_name, text, timestamp)
      VALUES (${id}, ${sender}, ${sender_name}, ${text}, ${timestamp})
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `;
    return c.json({ success: true, data: inserted[0] });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// 5. Transactions API
app.get('/api/transactions', async (c) => {
  try {
    const txns = await sql`
      SELECT * FROM transactions 
      ORDER BY id DESC
      LIMIT 30
    `;
    return c.json(txns);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post('/api/transactions', async (c) => {
  try {
    const body = await c.req.json();
    const { id, item, amount, time, status } = body;

    const inserted = await sql`
      INSERT INTO transactions (id, item, amount, time, status)
      VALUES (${id}, ${item}, ${amount}, ${time}, ${status})
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `;
    return c.json({ success: true, data: inserted[0] });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// 6. Activity Logs API
app.get('/api/logs', async (c) => {
  try {
    const logs = await sql`
      SELECT * FROM activity_logs 
      ORDER BY id DESC
      LIMIT 50
    `;
    return c.json(logs.map(log => log.message));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post('/api/logs', async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;

    const inserted = await sql`
      INSERT INTO activity_logs (message)
      VALUES (${message})
      RETURNING *
    `;
    return c.json({ success: true, data: inserted[0] });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// 7. 서버 기동 및 스키마 초기화
const port = 8000;
console.log(`🚀 Maru Company Hono.js API Server가 기동 중입니다... (Port: ${port})`);

initializeDatabase().then(() => {
  Bun.serve({
    fetch: app.fetch,
    port: port,
  });
  console.log(`🌐 백엔드 인스턴스가 http://localhost:${port} 에서 안전하게 바인딩 완료되었습니다.`);
});
