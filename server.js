/* ============================================================
 * 明鉴引文 CiteProof — 本地服务（静态托管 + 翻译代理）
 * 零依赖 Node 服务（Node >= 18）：
 *   1. 静态托管 index.html / results.html / assets
 *   2. POST /api/translate  证据翻译代理（E-4）
 *
 * 翻译 Provider 链（按优先级自动选择，密钥走环境变量，不进前端）：
 *   ① 有道智云翻译 API   —— 设置 YOUDAO_APP_KEY + YOUDAO_APP_SECRET 后启用
 *   ② 百度翻译通用 API   —— 设置 BAIDU_APP_ID + BAIDU_SECRET_KEY 后启用
 *   ③ MyMemory 兜底通道  —— 免密钥，开箱即用（正式版建议配置 ① 或 ②）
 *
 * 配额保护：内存缓存（同句不重复请求）+ 单 IP 限流 + 长文本自动分段
 * ============================================================ */
'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

/* ---------------- 配置 ---------------- */
const CONFIG = {
  youdao: {
    appKey: process.env.YOUDAO_APP_KEY || '',
    appSecret: process.env.YOUDAO_APP_SECRET || '',
    url: 'https://open-api.youdao.com/api'
  },
  baidu: {
    appId: process.env.BAIDU_APP_ID || '',
    secretKey: process.env.BAIDU_SECRET_KEY || '',
    url: 'https://fanyi-api.baidu.com/api/trans/vip/translate'
  },
  mymemory: { url: 'https://api.mymemory.translated.net/get' },
  cacheTtlMs: 60 * 60 * 1000,      // 缓存 1 小时
  cacheMax: 500,                    // 最多缓存 500 条
  rateLimitPerMin: 30               // 单 IP 每分钟最多 30 次翻译请求
};

/* ---------------- 内存缓存（同句不重复请求，省配额） ---------------- */
const cache = new Map();
function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CONFIG.cacheTtlMs) { cache.delete(key); return null; }
  return hit.text;
}
function cacheSet(key, text) {
  if (cache.size >= CONFIG.cacheMax) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { text: text, at: Date.now() });
}

/* ---------------- 单 IP 限流 ---------------- */
const rateBuckets = new Map();
function rateOk(ip) {
  const now = Date.now();
  let b = rateBuckets.get(ip);
  if (!b || now - b.start > 60000) { b = { start: now, n: 0 }; rateBuckets.set(ip, b); }
  b.n++;
  return b.n <= CONFIG.rateLimitPerMin;
}

/* ---------------- 工具 ---------------- */
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function httpsRequest(url, options, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: options.method || 'POST',
      headers: options.headers || {},
      timeout: timeoutMs || 10000
    }, (resp) => {
      let data = '';
      resp.setEncoding('utf8');
      resp.on('data', (c) => { data += c; });
      resp.on('end', () => {
        try { resolve({ status: resp.statusCode, json: data ? JSON.parse(data) : null }); }
        catch (e) { reject(new Error('invalid JSON from ' + u.hostname)); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function formBody(obj) {
  return Object.keys(obj).map((k) =>
    encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');
}

/* ---------------- Provider ①：有道智云 ---------------- */
function truncateForSign(q) {
  return q.length > 20 ? q.slice(0, 10) + q.length + q.slice(-10) : q;
}
async function translateYoudao(text, from, to) {
  const { appKey, appSecret, url } = CONFIG.youdao;
  const salt = crypto.randomUUID();
  const curtime = Math.floor(Date.now() / 1000) + '';
  const sign = crypto.createHash('sha256')
    .update(appKey + truncateForSign(text) + salt + curtime + appSecret).digest('hex');
  const r = await httpsRequest(url, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, formBody({
    q: text, from: from, to: to, appKey: appKey, salt: salt,
    sign: sign, signType: 'v3', curtime: curtime
  }));
  if (r.json && r.json.errorCode === '0' && Array.isArray(r.json.translation)) {
    return { text: r.json.translation.join('\n'), provider: '有道智云' };
  }
  throw new Error('youdao errorCode=' + (r.json && r.json.errorCode));
}

/* ---------------- Provider ②：百度翻译 ---------------- */
async function translateBaidu(text, from, to) {
  const { appId, secretKey, url } = CONFIG.baidu;
  const salt = String(crypto.randomInt(32768, 65536));
  const sign = crypto.createHash('md5').update(appId + text + salt + secretKey).digest('hex');
  const r = await httpsRequest(url, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, formBody({ q: text, from: from, to: to, appid: appId, salt: salt, sign: sign }));
  if (r.json && r.json.trans_result && r.json.trans_result.length) {
    return { text: r.json.trans_result.map((x) => x.dst).join('\n'), provider: '百度翻译' };
  }
  throw new Error('baidu error_code=' + (r.json && r.json.error_code));
}

/* ---------------- Provider ③：MyMemory 兜底（免密钥，按句分段） ---------------- */
function splitChunks(text, maxLen) {
  const parts = text.split(/(?<=[.!?;。！？；])\s+/);
  const chunks = [];
  let cur = '';
  parts.forEach((p) => {
    if ((cur + ' ' + p).trim().length > maxLen && cur) { chunks.push(cur.trim()); cur = p; }
    else { cur = cur ? cur + ' ' + p : p; }
  });
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [text];
}
async function translateMyMemory(text, from, to) {
  const langpair = (from === 'zh' ? 'zh-CN' : from) + '|' + (to === 'zh' ? 'zh-CN' : to);
  const chunks = splitChunks(text, 450); // MyMemory 单次约 500 字节上限
  const out = [];
  for (const c of chunks) {
    const r = await httpsRequest(CONFIG.mymemory.url + '?' +
      formBody({ q: c, langpair: langpair, de: 'citeproof@example.com' }), { method: 'GET' }, null, 12000);
    if (r.json && r.json.responseData && r.json.responseData.translatedText) {
      out.push(r.json.responseData.translatedText);
    } else { throw new Error('mymemory no result'); }
  }
  return { text: out.join(' '), provider: 'MyMemory' };
}

/* ---------------- 翻译入口（Provider 链 + 缓存） ---------------- */
async function doTranslate(text, from, to) {
  const key = from + '>' + to + '>' + text;
  const cached = cacheGet(key);
  if (cached) return { text: cached, provider: '缓存' };

  const errors = [];
  if (CONFIG.youdao.appKey && CONFIG.youdao.appSecret) {
    try { const r = await translateYoudao(text, from, to); cacheSet(key, r.text); return r; }
    catch (e) { errors.push('youdao: ' + e.message); }
  }
  if (CONFIG.baidu.appId && CONFIG.baidu.secretKey) {
    try { const r = await translateBaidu(text, from, to); cacheSet(key, r.text); return r; }
    catch (e) { errors.push('baidu: ' + e.message); }
  }
  try {
    const r = await translateMyMemory(text, from, to);
    cacheSet(key, r.text);
    return r;
  } catch (e) { errors.push('mymemory: ' + e.message); }
  throw new Error('all providers failed -> ' + errors.join(' | '));
}

/* ---------------- 静态文件 ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};
/* 禁止对外暴露的文件：服务源码 / 配置 / 隐藏目录 */
const DENY = new Set(['server.js', 'package.json', 'package-lock.json', '.env']);
function serveStatic(req, res, pathname) {
  let p = decodeURIComponent(pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  const rel = path.relative(ROOT, file);
  if (DENY.has(rel) || rel.split(path.sep).some((s) => s.startsWith('.'))) {
    res.writeHead(404); res.end('not found'); return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ---------------- 路由 ---------------- */
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const ip = req.socket.remoteAddress || 'unknown';

  if (u.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, providers: activeProviders() });
    return;
  }

  if (u.pathname === '/api/translate') {
    if (req.method !== 'POST') { sendJson(res, 405, { ok: false, error: 'POST only' }); return; }
    if (!rateOk(ip)) { sendJson(res, 429, { ok: false, error: '请求太频繁，请稍后再试' }); return; }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const text = String(payload.text || '').trim();
        const from = String(payload.from || 'en');
        const to = String(payload.to || 'zh-CN');
        if (!text) { sendJson(res, 400, { ok: false, error: 'empty text' }); return; }
        if (text.length > 4000) { sendJson(res, 400, { ok: false, error: 'text too long' }); return; }
        const r = await doTranslate(text, from, to === 'zh-CN' || to === 'zh' ? 'zh' : to);
        sendJson(res, 200, { ok: true, text: r.text, provider: r.provider });
      } catch (e) {
        sendJson(res, 200, { ok: false, error: e.message || 'translate failed' });
      }
    });
    return;
  }

  if (req.method === 'GET') { serveStatic(req, res, u.pathname); return; }
  res.writeHead(405); res.end('method not allowed');
});

function activeProviders() {
  const list = [];
  if (CONFIG.youdao.appKey && CONFIG.youdao.appSecret) list.push('youdao');
  if (CONFIG.baidu.appId && CONFIG.baidu.secretKey) list.push('baidu');
  list.push('mymemory(fallback)');
  return list;
}

server.listen(PORT, () => {
  console.log('[CiteProof] listening on :' + PORT);
  console.log('[CiteProof] translate providers: ' + activeProviders().join(' -> '));
  if (!CONFIG.youdao.appKey && !CONFIG.baidu.appId) {
    console.log('[CiteProof] 提示：未配置有道/百度密钥，当前使用 MyMemory 兜底通道。');
    console.log('[CiteProof] 配置方法：set YOUDAO_APP_KEY=xxx && set YOUDAO_APP_SECRET=xxx（百度为 BAIDU_APP_ID / BAIDU_SECRET_KEY）');
  }
});
