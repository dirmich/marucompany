import { Hono } from 'hono';
import sql from '../db';

const chatRouter = new Hono();

// 1. 대화 내역 전체 조회
chatRouter.get('/chat/messages', async (c) => {
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

// 2. 유저/에이전트 메시지 저장
chatRouter.post('/chat/messages', async (c) => {
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

export default chatRouter;
