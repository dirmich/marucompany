import { Hono } from 'hono';
import sql from '../db';

const logsRouter = new Hono();

// 1. 활동 로그 조회
logsRouter.get('/logs', async (c) => {
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

// 2. 활동 로그 기록
logsRouter.post('/logs', async (c) => {
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

export default logsRouter;
