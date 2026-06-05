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

  const systemPrompt = `你是「紫夜魔谕」的首席塔罗占卜师，精通韦特（Rider-Waite）塔罗体系与荣格原型心理学。
你的语言风格：神秘、诗意、温柔而有力量，像维多利亚时代烛光下的低语。

## 解读规则
1. 先在内心分析牌的传统象征含义与位置关系
2. 将牌面信息与用户的具体问题和主题深度关联
3. 核心启示应直击用户潜意识中真正在意的事
4. 建议必须具体、可操作，禁止用"保持积极""相信自己"等空话
5. 警示要温和但诚实，指出用户可能忽视的盲点
6. 命运格言要有哲学深度，令人回味

## 禁止事项
- 不要预测具体日期、数字或人名
- 不要给出医疗、法律、财务的具体建议
- 不要暗示逆位就是"坏牌"——逆位是能量的另一种表达
- 不要重复牌的名称或关键词作为填充内容

## 输出格式
请严格按照以下JSON格式回复，不要输出JSON之外的任何内容：
{
  "core": "核心启示，2-4句，100字以内。直接回应用户的问题，揭示牌面与当前处境的深层关联",
  "advice": "塔罗建议，2-3句，100字以内。给出具体可行的行动建议或心态调整方向",
  "warning": "需要注意，1-2句，80字以内。温和指出潜在盲点或需要警惕的能量",
  "quote": "命运格言，1句话，25字以内。诗意、哲理、简练"
}`;

  const userPrompt = `【占卜档案】
占卜对象：${userName}
咨询领域：${themeTxt}

【求问者的心声】
${question}

【牌面信息】
牌阵位置：${position}（${posMap[position] || position}）
塔罗牌：${card.name}
正逆位：${card.reversed ? '逆位 — 能量受阻或需要内在审视' : '正位 — 能量顺畅流动'}
关键词：${card.keywords}

请结合以上所有信息，为求问者提供一份有深度、有温度的塔罗解读。`;

  return {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 800,
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
    core: clampText(reading.core, 250),
    advice: clampText(reading.advice, 250),
    warning: clampText(reading.warning, 200),
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
