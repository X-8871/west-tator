const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT_DIR = __dirname;
loadDotEnv(path.join(ROOT_DIR, '.env'));

const PORT = Number(process.env.PORT || 3000);
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && url.pathname === '/api/tarot-reading') {
      await handleTarotReading(req, res);
      return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      await serveStatic(url.pathname, req, res);
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('[Server Error]', err);
    sendJson(res, 500, { error: '服务器暂时无法回应，请稍后再试。' });
  }
});

server.listen(PORT, () => {
  console.log(`Tarot site running at http://localhost:${PORT}`);
});

async function handleTarotReading(req, res) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: 'Missing DEEPSEEK_API_KEY on the server.' });
    return;
  }

  const body = await readJsonBody(req, 8 * 1024);
  const payload = buildDeepSeekPayload(body);

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

  try {
    const reading = JSON.parse(match[0]);
    sendJson(res, 200, normalizeReading(reading));
  } catch (err) {
    console.error('[Parse Error]', err);
    sendJson(res, 502, { error: 'AI 返回内容格式异常。' });
  }
}

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
  const themeTxt = themeMap[theme] || theme || '综合';
  
  // body.cards should be an array of 3 cards: [past, present, future]
  const cards = (body.cards || []).map(normalizeCard);

  const systemPrompt = `你是「紫夜魔谕」的首席塔罗占卜师，精通韦特（Rider-Waite）塔罗体系与荣格原型心理学。
你的语言风格：神秘、诗意、温柔而有力量，像维多利亚时代烛光下的低语。

## 解读规则
1. 你将收到一个「时间之流」三牌阵：分别代表过去、现在、未来。
2. 分析这3张牌之间的能量流动、元素生克关系和时间线上的因果演变。
3. 将牌面信息与用户的具体问题和主题深度关联。
4. 核心启示应提炼这3张牌所讲述的完整故事，直击用户潜意识。
5. 建议必须具体、可操作，基于牌阵的整体趋势给出指引。
6. 警示要温和但诚实，指出未来可能遇到的阻碍或当下忽视的盲点。
7. 命运格言要有哲学深度，令人回味。

## 输出格式
请严格按照以下JSON格式回复，不要输出JSON之外的任何内容：
{
  "core": "核心启示，3-5句，150字以内。综合3张牌讲述的故事，揭示因果链条。",
  "advice": "塔罗建议，2-3句，100字以内。给出具体的行动建议或心态调整。",
  "warning": "需要注意，1-2句，80字以内。温和指出潜在盲点或风险。",
  "quote": "命运格言，1句话，25字以内。诗意、哲理。"
}`;

  const cardsText = cards.map((c, i) => {
    const posName = ['过去', '现在', '未来'][i];
    return `[${posName}]：${c.name}
状态：${c.reversed ? '逆位 — 能量受阻/内在演变' : '正位 — 能量顺畅'}
关键词：${c.keywords}`;
  }).join('\n\n');

  const userPrompt = `【占卜档案】
占卜对象：${userName}
咨询领域：${themeTxt}

【求问者的心声】
${question}

【牌面信息：时间之流】
${cardsText}

请综合这三张牌的因果与能量，为求问者提供一份有深度、有温度的塔罗解读。`;

  return {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 1000,
    stream: false,
  };
}

function normalizeCard(card = {}) {
  return {
    name: clampText(card.name, 80) || '未知塔罗牌',
    keywords: clampText(card.keywords, 120) || '指引',
    reversed: Boolean(card.reversed),
    img: clampText(card.img, 80),
    energy: Number(card.energy) || 78
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

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(urlPath, req, res) {
  const safePath = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = safePath === '/' ? 'index.html' : safePath.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT_DIR, relativePath);

  if (!filePath.startsWith(ROOT_DIR + path.sep) && filePath !== ROOT_DIR) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  let stat;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (stat.isDirectory()) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;

    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}
