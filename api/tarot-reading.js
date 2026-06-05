const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: 'Missing DEEPSEEK_API_KEY on the server.' });
    return;
  }

  try {
    const payload = buildDeepSeekPayload(req.body || {});
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let upstream;
    try {
      upstream = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error('[DeepSeek Error]', upstream.status, text.slice(0, 500));
      sendJson(res, 502, { error: 'AI 解读服务暂时不可用，请稍后再试。' });
      return;
    }

    const json = await upstream.json();
    const raw = json.choices?.[0]?.message?.content ?? '{}';
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      sendJson(res, 502, { error: 'AI 返回内容无法解析。' });
      return;
    }

    const reading = JSON.parse(match[0]);
    sendJson(res, 200, normalizeReading(reading));
  } catch (err) {
    console.error('[Tarot API Error]', err);
    sendJson(res, 500, { error: '服务器暂时无法回应，请稍后再试。' });
  }
};

function buildDeepSeekPayload(body) {
  const themeMap = {
    love: '感情关系',
    career: '事业发展',
    wealth: '财富机会',
    future: '未来趋势',
    growth: '内在成长',
    decision: '重要决定',
  };
  const posMap = {
    过去: '过去的影响力',
    现在: '当下的核心能量',
    未来: '未来的走向',
  };

  const userName = clampText(body.userName, 40) || '寻问者';
  const question = clampText(body.question, 240) || '关于当下的迷惘';
  const theme = clampText(body.theme, 30);
  const position = ['过去', '现在', '未来'].includes(body.position) ? body.position : '现在';
  const card = normalizeCard(body.card);
  const themeTxt = themeMap[theme] || theme || '综合';

  const systemPrompt = `你是一位精通西方神秘学的维多利亚时代塔罗牌占卜师，语言风格神秘、诗意、充满仪式感。
你的解读总是充满洞见、直击内心，既有古典占卜师的庄重，又温柔如烛光。
请严格按照以下JSON格式回复，不要输出任何JSON之外的内容：
{
  "core": "（核心启示，2-3句，80字以内）",
  "advice": "（塔罗建议，2-3句，80字以内）",
  "warning": "（注意事项，2-3句，60字以内）",
  "quote": "（命运格言，1句话，30字以内，诗意简练）"
}`;

  const userPrompt = `占卜对象：${userName}
咨询主题：${themeTxt}
内心之问：${question}
牌阵位置：${position}（${posMap[position] || position}）
抽到的牌：${card.name}（${card.reversed ? '逆位' : '正位'}）
关键词：${card.keywords}

请为这张塔罗牌在这个位置和问题下，给出深度解读。`;

  return {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 600,
    stream: false,
  };
}

function normalizeCard(card = {}) {
  return {
    name: clampText(card.name, 80) || '未知塔罗牌',
    keywords: clampText(card.keywords, 120) || '指引',
    reversed: Boolean(card.reversed),
  };
}

function normalizeReading(reading = {}) {
  return {
    core: clampText(reading.core, 180),
    advice: clampText(reading.advice, 180),
    warning: clampText(reading.warning, 140),
    quote: clampText(reading.quote, 80),
  };
}

function clampText(value, maxLength) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}
