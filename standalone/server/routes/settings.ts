import { Hono } from 'hono';
import sql from '../db';

const settingsRouter = new Hono();

// 1. Settings 조회
settingsRouter.get('/settings', async (c) => {
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

// 2. Settings 저장/업데이트
settingsRouter.post('/settings', async (c) => {
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

// 3. 외부 LLM 프록시 API (CORS 방지용)
settingsRouter.post('/proxy/models', async (c) => {
  try {
    const { llm_type, llm_url } = await c.req.json();
    if (!llm_url) {
      return c.json({ success: false, error: 'llm_url 파라미터가 누락되었습니다.' }, 400);
    }

    let targetUrl = `${llm_url}/api/tags`;
    if (llm_type === 'lmstudio' || llm_type === 'vllm' || llm_type === 'llamacpp') {
      let cleanUrl = llm_url.replace(/\/+$/, "");
      if (!cleanUrl.endsWith("/v1")) {
        cleanUrl = `${cleanUrl}/v1`;
      }
      targetUrl = `${cleanUrl}/models`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      let models: string[] = [];

      if (llm_type === 'ollama') {
        models = data.models ? data.models.map((m: any) => m.name || m.model || '') : [];
      } else if (llm_type === 'lmstudio' || llm_type === 'vllm' || llm_type === 'llamacpp') {
        models = data.data ? data.data.map((m: any) => m.id) : [];
      }

      return c.json({ success: true, models });
    } else {
      return c.json({ success: false, error: `LLM 서버 응답 에러 (Status: ${response.status})` }, 400);
    }
  } catch (err) {
    return c.json({ success: false, error: `LLM 연결 통신 실패: ${(err as Error).message}` }, 500);
  }
});

export default settingsRouter;
