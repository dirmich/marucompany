import { Hono } from 'hono';
import { cors } from 'hono/cors';
import sql, { initializeDatabase } from './db';

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
    const { llm_type, llm_url, llm_model, telegram_token, chat_id, calendar_linked } = body;

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
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
      return c.json({ success: true, data: updated[0] });
    } else {
      const inserted = await sql`
        INSERT INTO settings (llm_type, llm_url, llm_model, telegram_token, chat_id, calendar_linked)
        VALUES (${llm_type}, ${llm_url}, ${llm_model}, ${telegram_token}, ${chat_id}, ${calendar_linked})
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

// 7. Brain Documents API (PostgreSQL 지식 라이브러리 CRUD - [NEW])
app.get('/api/documents', async (c) => {
  try {
    const docs = await sql`
      SELECT * FROM brain_documents 
      ORDER BY id DESC
    `;
    return c.json(docs);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post('/api/documents', async (c) => {
  try {
    const body = await c.req.json();
    const { title, content, category } = body;

    const inserted = await sql`
      INSERT INTO brain_documents (title, content, category)
      VALUES (${title}, ${content}, ${category || 'Wiki'})
      RETURNING *
    `;
    return c.json({ success: true, data: inserted[0] });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.delete('/api/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await sql`
      DELETE FROM brain_documents 
      WHERE id = ${id}
    `;
    return c.json({ success: true, message: `지식 노드가 정상 파쇄되었습니다. (ID: ${id})` });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// 8. 서버 기동 및 스키마 초기화
const port = 8000;
console.log(`🚀 Maru Company Hono.js API Server가 기동 중입니다... (Port: ${port})`);

initializeDatabase().then(() => {
  Bun.serve({
    fetch: app.fetch,
    port: port,
  });
  console.log(`🌐 백엔드 인스턴스가 http://localhost:${port} 에서 안전하게 바인딩 완료되었습니다.`);
});
