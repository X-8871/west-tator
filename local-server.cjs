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
