import { Hono } from 'hono';
import sql from '../db';

const transactionsRouter = new Hono();

// 1. 최근 트랜잭션 조회
transactionsRouter.get('/transactions', async (c) => {
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

// 2. 트랜잭션 저장
transactionsRouter.post('/transactions', async (c) => {
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

export default transactionsRouter;
