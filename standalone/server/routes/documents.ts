import { Hono } from 'hono';
import sql from '../db';

const documentsRouter = new Hono();

// 1. 지식 리스트 조회
documentsRouter.get('/documents', async (c) => {
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

// 2. 지식 노드 주입
documentsRouter.post('/documents', async (c) => {
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

// 3. 지식 노드 영구 파쇄
documentsRouter.delete('/documents/:id', async (c) => {
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

export default documentsRouter;
