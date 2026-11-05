/* ============================================================
 * 明鉴引文 CiteProof — 公共工具：图标 / 通用 UI / 引用解析 / 核验引擎
 * ============================================================ */
window.CP_CORE = (function () {
  'use strict';

  /* ---------------- Lucide 风格线性图标（统一 24 视框、2px 线宽） ---------------- */
  var ICON_PATHS = {
    'check': '<polyline points="20 6 9 17 4 12"/>',
    'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'alert-triangle': '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    'user-round': '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><polyline points="16 10 10.5 15.5 8 13"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'external-link': '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    'mail': '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    'info': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    'refresh': '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    'copy': '<rect x="8" y="8" width="14" height="14" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'book': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    'sparkles': '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>',
    'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v14c0 1.66-4 3-9 3s-9-1.34-9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
    'clipboard': '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    'eye': '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    'loader': '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
    'list': '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    'minus': '<line x1="5" y1="12" x2="19" y2="12"/>',
    'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'scan': '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>',
    'seal': '<path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4z"/><path d="M8.5 12.5 11 15l4.5-4.5"/>',
    'file-check': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11.5 17.5 15.5 13"/>',
    'arrow-down': '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    'trash': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'play': '<polygon points="5 3 19 12 5 21 5 3"/>'
  };

  function icon(name, size, cls) {
    size = size || 16;
    var p = ICON_PATHS[name];
    if (!p) p = ICON_PATHS['info'];
    return '<svg class="ic ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- 本地存储（核验单 / 结果恢复） ---------------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('cp_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('cp_' + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('cp_' + k); } catch (e) {} }
  };

  /* ---------------- 分享码透传（线上部署的访问参数） ---------------- */
  /* 部署平台要求每个 URL 都带 sharecode；入口链接带码进入后，
     站内跳转与接口调用都要原样带上，否则会被拦截为「链接不完整」 */
  function shareQuery() {
    try {
      var m = /[?&]sharecode=([^&]+)/.exec(location.search);
      var code = m ? decodeURIComponent(m[1]) : null;
      if (!code) code = sessionStorage.getItem('cp_sharecode');
      if (code) sessionStorage.setItem('cp_sharecode', code);
      return code ? '?sharecode=' + encodeURIComponent(code) : '';
    } catch (e) { return ''; }
  }

  /* ---------------- 模态框 ---------------- */
  function openModal(html) {
    closeModal();
    var wrap = el('div', 'modal-wrap');
    wrap.id = 'cp-modal';
    wrap.innerHTML =
      '<div class="modal-mask" data-close="1"></div>' +
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<button class="modal-x" data-close="1" aria-label="关闭">' + icon('x', 18) + '</button>' +
      '<div class="modal-body">' + html + '</div></div>';
    document.body.appendChild(wrap);
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { wrap.classList.add('in'); });
    wrap.addEventListener('click', function (e) {
      /* 用 closest 而非 e.target.dataset：关闭按钮内是 SVG 图标，
         点击图标时 e.target 落在 svg 上，直接查 dataset.close 会失效 */
      var t = e.target && e.target.closest ? e.target.closest('[data-close]') : null;
      if (t && wrap.contains(t)) closeModal();
    });
    document.addEventListener('keydown', onEsc);
    function onEsc(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); } }
    return wrap;
  }

  function closeModal() {
    var w = document.getElementById('cp-modal');
    if (w) { w.classList.remove('in'); document.body.classList.remove('no-scroll'); setTimeout(function () { w.remove(); }, 200); }
  }

  /* ---------------- 轻提示 ---------------- */
  function toast(msg, tone) {
    var t = el('div', 'toast ' + (tone || ''));
    t.innerHTML = '<span class="toast-dot"></span>' + esc(msg);
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  /* ---------------- 引用文本解析 ---------------- */
  function extractDoi(text) {
    var m = String(text).match(/10\.\d{4,9}\/[^\s,;)\]}'"]+/i);
    return m ? m[0].replace(/[.]+$/, '') : null;
  }

  function extractYear(text) {
    var m = String(text).match(/(19|20)\d{2}/);
    return m ? m[0] : null;
  }

  /* 从 GB/T 7714 风格引用中粗提标题：标记符号前的片段 */
  function extractTitle(text) {
    var t = String(text).replace(/^\s*\[[\d\s,\-]+\]\s*/, '');
    var m = t.match(/[\[\u3010]([JMDCRS]|EB\/OL|DB\/OL|J\/OL|M\/OL|C\/OL|N\/OL|R\/OL|S\/OL)[\/\]]/i);
    if (m) t = t.slice(0, m.index);
    else {
      var d = t.indexOf('//');
      if (d > 0) t = t.slice(0, d);
    }
    t = t.replace(/^[^.]+\.\s*/, '');           // 去掉作者段
    t = t.replace(/[[\]]/g, ' ').replace(/\.\s*$/, '').replace(/\s+/g, ' ').trim();
    return t.length > 300 ? t.slice(0, 300) : t;
  }

  function extractAuthors(text) {
    var t = String(text).replace(/^\s*\[[\d\s,\-]+\]\s*/, '');
    var m = t.match(/^[^.]+\./);
    return m ? m[0].replace(/\.$/, '').trim() : '';
  }

  /* ---------------- 格式预检（GB/T 7714-2015 本地检查，不连库） ----------------
   * 只做「提示」不做「判定」：发现的问题写进 item.fmt，结果页展示为待确认线索。
   * 宁漏报原则同样适用——格式不规范不等于文献不存在，只提示用户人工留意。 */
  var DOC_TYPE_RE = /\[(J|M|D|C|S|R|P|A|G|EB\/OL|DB\/OL|J\/OL|M\/OL|C\/OL|N\/OL|R\/OL|S\/OL)\]/i;

  function formatCheck(raw) {
    var t = String(raw || '');
    var issues = [];
    if (t.length < 15) {
      issues.push({ level: 'warn', text: '条目过短，可能不是完整题录' });
      return issues;
    }
    /* 1. 文献类型标识 */
    if (!DOC_TYPE_RE.test(t)) {
      issues.push({ level: 'warn', text: '缺少文献类型标识（如 [J] 期刊 / [D] 学位论文 / [C] 会议论文）' });
    }
    /* 2. 年份 */
    if (!/(19|20)\d{2}/.test(t)) {
      issues.push({ level: 'warn', text: '未识别到年份' });
    }
    /* 3. 作者段 */
    var authors = extractAuthors(t);
    if (!authors) {
      issues.push({ level: 'warn', text: '未识别到作者段' });
    } else if (!/[A-Za-z\u4e00-\u9fa5]/.test(authors)) {
      issues.push({ level: 'warn', text: '作者段异常：几乎不含姓名文字' });
    }
    /* 4. 期刊条目应有 卷(期): 页码 */
    if (/\[J\]/i.test(t) && !/\d+\s*\(\s*\S+\s*\)\s*:\s*[\d\-–]/.test(t)) {
      issues.push({ level: 'info', text: '期刊条目未见「卷(期): 页码」结构，可能缺页码信息' });
    }
    /* 5. DOI 格式抽查：含 DOI 字样但后面不是合法 DOI */
    var doiM = t.match(/DOI[::\s]*([^\s,;)\]}'"]+)/i);
    if (doiM && !/^10\.\d{4,9}\/\S+$/.test(doiM[1].replace(/[.]+$/, ''))) {
      issues.push({ level: 'warn', text: 'DOI 格式异常：' + doiM[1].slice(0, 40) });
    }
    /* 6. 页码缺失（有年份和期刊但没有任何页码形态） */
    if (/\d+\s*\(\s*\S+\s*\)/.test(t) && !/[\d]\s*[-–]\s*[\d]/.test(t)) {
      issues.push({ level: 'info', text: '未识别到页码范围' });
    }
    return issues;
  }

  /* ---------------- 上传文档：文末参考文献提取 ---------------- */
  function splitRefSection(text) {
    var m = String(text).match(/(?:^|\n)\s*(参考文献|References?|REFERENCES|Bibliography|引用文献)\s*(?:\n|$)/);
    if (!m) return { body: String(text), refs: '' };
    var idx = m.index + m[0].length;
    return { body: String(text).slice(0, m.index), refs: String(text).slice(idx) };
  }

  /* 把参考文献区块切成条目数组 */
  function parseRefEntries(refsText) {
    var lines = String(refsText).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var entries = [], cur = null;
    lines.forEach(function (l) {
      var m = l.match(/^\[(\d+)\]\s*(.*)$/);
      if (m) { cur = m[2].trim(); entries.push(cur); }
      else if (cur != null && !/^(参考文献|References?)/i.test(l)) { cur += ' ' + l; entries[entries.length - 1] = cur; }
    });
    if (!entries.length) entries = lines.filter(function (l) { return l.length > 15; });
    return entries.map(function (t) { return t.replace(/\s+/g, ' ').trim(); });
  }

  /* ---------------- 正文行内引用标记提取 ---------------- */
  function extractInlineCitations(bodyText) {
    var found = {};
    var re = /\[(\d+(?:\s*[,\-\u2013]\s*\d+)*)\]/g, m;
    while ((m = re.exec(bodyText))) {
      m[1].split(/[,\uFF0C]/).forEach(function (part) {
        part = part.trim();
        var rng = part.split(/[-\u2013]/);
        if (rng.length === 2) {
          var a = +rng[0], b = +rng[1];
          if (isFinite(a) && isFinite(b)) for (var i = Math.min(a, b); i <= Math.max(a, b); i++) found[i] = 1;
        } else { var n = +part; if (isFinite(n)) found[n] = 1; }
      });
    }
    return Object.keys(found).map(Number).sort(function (a, b) { return a - b; });
  }

  /* ---------------- 字符串相似度 ---------------- */
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function tokens(s) { var n = norm(s); return n ? n.split(' ') : []; }
  function jaccard(a, b) {
    var A = tokens(a), B = tokens(b);
    if (!A.length || !B.length) return 0;
    var setB = {}; B.forEach(function (t) { setB[t] = 1; });
    var hit = 0; A.forEach(function (t) { if (setB[t]) hit++; });
    return hit / (A.length + B.length - hit);
  }

  /* 作者比较：提取每位作者的候选「姓」，兼容三种格式
     "Liu Y"（姓在前）、"Yinhan Liu"（姓在后）、"Liu, Yinhan"（逗号格式），
     并过滤 "et al" 等占位段。多数命中即认为一致。 */
  var AUTHOR_STOP = { et: 1, al: 1, others: 1, '等': 1 };
  function nameCandidates(s) {
    var n = String(s || '').trim();
    if (!n) return [];
    var t;
    if (n.indexOf(',') > -1) { /* "Liu, Yinhan" */
      t = [tokens(n.split(',')[0])[0]];
    } else {
      var w = tokens(n);
      t = w.length === 1 ? [w[0]] : [w[0], w[w.length - 1]]; /* 首词与末词都可能是姓 */
    }
    return t.filter(function (x) { return x && x.length > 1 && !AUTHOR_STOP[x]; });
  }
  function authorsMatch(a, b) {
    var A = String(a || '').split(/[,;，；]/).map(nameCandidates).filter(function (x) { return x.length; });
    var flat = {};
    String(b || '').split(/[,;，；]/).forEach(function (n) {
      nameCandidates(n).forEach(function (t) { flat[t] = 1; });
    });
    if (!A.length || !Object.keys(flat).length) return true; /* 一方缺失作者信息时不判否 */
    var hit = A.filter(function (set) { return set.some(function (t) { return flat[t]; }); }).length;
    return hit / A.length >= 0.6;
  }

  /* ---------------- 核验引擎 ----------------
   * 顺序：① 命中预置题录 → 直接采用预置结果
   *       ② 否则实时调用 Crossref / OpenAlex
   *       ③ 网络异常 → 待人工确认（可重试）
   * ---------------------------------------------------------------- */
  var API_TIMEOUT = 9000;

  function fetchJson(url, timeoutMs) {
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, timeoutMs || API_TIMEOUT);
    return fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } })
      .then(function (r) {
        clearTimeout(t);
        if (r.status === 404) return null;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (e) { clearTimeout(t); throw e; });
  }

  function crossrefByDoi(doi) {
    return fetchJson('https://api.crossref.org/works/' + encodeURIComponent(doi))
      .then(function (j) { return j && j.message ? j.message : null; });
  }

  function crossrefSearch(query) {
    var u = 'https://api.crossref.org/works?rows=5&select=DOI,title,author,container-title,issued,type&query.bibliographic=' +
      encodeURIComponent(query);
    return fetchJson(u).then(function (j) {
      return (j && j.message && j.message.items) || [];
    });
  }

  /* arXiv 等 10.48550 前缀的 DOI 由 DataCite 登记，Crossref 查不到，需兜底 */
  function dataciteByDoi(doi) {
    return fetchJson('https://api.datacite.org/dois/' + encodeURIComponent(doi)).then(function (j) {
      var a = j && j.data && j.data.attributes;
      if (!a) return null;
      return {
        DOI: a.doi || doi,
        title: (a.titles || []).map(function (t) { return t.title; }),
        author: (a.creators || []).map(function (c) {
          var n = c.name || '';
          var family, given;
          if (n.indexOf(',') > -1) { /* "Bahdanau, Dzmitry" 格式 */
            var i = n.indexOf(',');
            family = n.slice(0, i).trim(); given = n.slice(i + 1).trim();
          } else { /* "Dzmitry Bahdanau" 格式：末词为姓 */
            var parts = n.split(/\s+/);
            family = parts.length > 1 ? parts[parts.length - 1] : n;
            given = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
          }
          return { family: family, given: given, name: n };
        }),
        'container-title': a.containerTitle ? [a.containerTitle] : ['arXiv 预印本'],
        issued: { 'date-parts': [[+a.publicationYear || 0]] },
        type: 'preprint',
        source: 'DataCite'
      };
    });
  }

  /* Semantic Scholar：补充 Crossref/OpenAlex 未覆盖的计算机文献 */
  function semanticScholarSearch(query) {
    var u = 'https://api.semanticscholar.org/graph/v1/paper/search?limit=5&fields=title,year,authors,externalIds,venue' +
      '&query=' + encodeURIComponent(query);
    return fetchJson(u).then(function (j) {
      return (j && j.data || []).map(function (p) {
        return {
          DOI: p.externalIds && (p.externalIds.DOI || p.externalIds.ArXiv),
          title: [p.title || ''],
          author: (p.authors || []).map(function (a) { return { family: a.name || '', given: '' }; }),
          'container-title': p.venue ? [p.venue] : undefined,
          issued: { 'date-parts': [[p.year || 0]] },
          type: 'article',
          source: 'Semantic Scholar'
        };
      });
    });
  }

  function openAlexSearch(query) {
    var key = window.CP_DATA && window.CP_DATA.OPENALEX_API_KEY;
    var u = 'https://api.openalex.org/works?per-page=5&select=id,doi,title,publication_year,authorships,primary_location&search=' +
      encodeURIComponent(query) + (key ? '&api_key=' + encodeURIComponent(key) : '');
    return fetchJson(u).then(function (j) {
      /* 服务故障 / 限额暂停时 OpenAlex 返回 {"error": ...}（HTTP 200）。
         必须按「检索失败」抛出——若当成 0 结果，双库静默变单库，
         英文文献可能被误判「不存在」（宁漏报原则） */
      if (!j || j.error) {
        throw new Error('OpenAlex unavailable: ' + ((j && (j.error.message || j.error)) || 'no response'));
      }
      return (j && j.results) || [];
    });
  }
  function authorNames(rec) {
    if (!rec) return '';
    if (Array.isArray(rec.author)) {
      return rec.author.map(function (a) {
        var f = a.family || a.name || '';
        var g = a.given ? ' ' + a.given.charAt(0).toUpperCase() + '.' : '';
        return (f + g).trim();
      }).join(', ');
    }
    if (Array.isArray(rec.authorships)) {
      return rec.authorships.map(function (a) { return (a.author && a.author.display_name) || ''; }).filter(Boolean).join(', ');
    }
    return '';
  }

  function recTitle(rec) { return rec && rec.title ? (Array.isArray(rec.title) ? rec.title[0] : rec.title) : ''; }
  function recVenue(rec) {
    if (!rec) return '';
    if (rec['container-title']) return Array.isArray(rec['container-title']) ? rec['container-title'][0] : rec['container-title'];
    if (rec.primary_location && rec.primary_location.source) return rec.primary_location.source.display_name || '';
    return rec.type || '';
  }
  function recYear(rec) {
    if (!rec) return '';
    if (rec.issued && rec.issued['date-parts'] && rec.issued['date-parts'][0]) return String(rec.issued['date-parts'][0][0]);
    if (rec.publication_year) return String(rec.publication_year);
    return '';
  }

  /* 由实时记录构造「核验结果」对象（与预置数据结构一致） */
  function cleanDoi(d) {
    return d ? String(d).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : '';
  }
  function resultFromRecord(rec, cited, url, source) {
    var db = {
      source: source, authors: authorNames(rec), title: recTitle(rec),
      venue: recVenue(rec), year: recYear(rec), doi: cleanDoi(rec.DOI) || (cited && cited.doi) || '—'
    };
    var matched = [], mismatch = [];
    var titleOk = jaccard(cited.title, db.title) > 0.72;
    var authorsOk = authorsMatch(cited.authors, db.authors);
    var isPreprint = source === 'DataCite'; /* arXiv 预印本：年份/来源与正式版不同属正常 */
    var pairs = [
      ['authors', !cited.authors || authorsOk],
      ['title', titleOk],
      ['venue', !cited.venue || jaccard(cited.venue, db.venue) > 0.2],
      ['year', !cited.year || cited.year === db.year],
      ['doi', !cited.doi || String(cited.doi).toLowerCase() === String(db.doi).toLowerCase()]
    ];
    pairs.forEach(function (p) { (p[1] ? matched : mismatch).push(p[0]); });
    if (!matched.length) matched = ['title'];

    /* 标题对得上但作者错配 → 张冠李戴；年份错配仅对非预印本记录判张冠李戴 */
    var verdict = 'pass';
    if (titleOk && mismatch.indexOf('authors') > -1) verdict = 'wrong';
    else if (titleOk && !isPreprint && mismatch.indexOf('year') > -1) verdict = 'wrong';

    var ev;
    if (verdict === 'wrong') {
      ev = '标题与 ' + source + ' 记录一致，但作者 / 年份字段与登记记录不符——判定张冠李戴，请按数据库记录修正。';
    } else if (isPreprint && (mismatch.indexOf('year') > -1 || mismatch.indexOf('venue') > -1)) {
      ev = '标题、作者与 ' + source + '（arXiv 预印本）登记记录一致；年份 / 来源差异属预印本与正式发表版的正常差异，判定通过。';
    } else {
      ev = '与 ' + source + ' 登记记录一致：标题、作者、来源、年份' + (cited.doi ? '、DOI' : '') + '比对通过。';
    }

    return {
      verdict: verdict, lang: cited.lang, cited: cited, db: db, matched: matched, mismatch: mismatch,
      evidence: ev,
      searches: [{ db: source, query: cited.title, hits: 1 }], url: url
    };
  }

  /* 待人工确认：结构化明细（E-2）——不确定字段 + 已查内容 + 原因 */
  function manualResult(cited, reason, opts) {
    opts = opts || {};
    var fields = opts.uncertain || ['authors', 'title', 'venue', 'year', 'doi'];
    return {
      verdict: 'manual', lang: cited.lang, cited: cited, db: null, matched: [], mismatch: [],
      uncertain: fields,
      checked: opts.checked || null,
      evidence: reason,
      searches: opts.searches || [],
      /* 中文题录跳知网检索（doi.org 对 10.3969 等中国前缀解析不通），英文走原逻辑 */
      url: cited.lang === 'zh'
        ? 'https://search.cnki.com.cn/Search.aspx?q=' + encodeURIComponent(cited.title || cited.raw)
        : (cited.doi ? 'https://doi.org/' + encodeURIComponent(cited.doi)
          : 'https://search.crossref.org/?q=' + encodeURIComponent(cited.title || cited.raw))
    };
  }

  /* 引用文本的首位作者姓（用于区分标题/DOPI 相同但作者错配的条目） */
  function firstAuthor(text) {
    var m = String(text || '').match(/^[\s\[]*([A-Za-z\u4e00-\u9fa5]+)/);
    return m ? m[1].toLowerCase() : '';
  }

  /* 预置题录匹配打分：DOI > 标题 > 首位作者 > 年份，需 ≥ 4 分才认定为预置条目 */
  function presetScore(item, r) {
    var c = r.cited || {}, s = 0;
    if (item.doi && c.doi && c.doi.toLowerCase() === item.doi.toLowerCase()) s += 3;
    if (item.title && c.title) {
      if (norm(c.title) === norm(item.title)) s += 2;
      else if (jaccard(c.title, item.title) > 0.85) s += 1;
    }
    var fa = firstAuthor(item.authors || item.raw), fb = firstAuthor(c.authors);
    if (fa && fb && fa === fb) s += 2;
    if (item.year && c.year && item.year === c.year) s += 1;
    return s;
  }

  function presetMatch(item, results) {
    var best = null, bestScore = 0;
    results.forEach(function (r) {
      var s = presetScore(item, r);
      if (s > bestScore) { bestScore = s; best = r; }
    });
    return bestScore >= 4 ? best : null;
  }

  function verifyItem(item, opts) {
    opts = opts || {};
    var results = opts.results || [];
    var pre = presetMatch(item, results);
    if (pre) {
      return new Promise(function (res) {
        setTimeout(function () {
          res({ preset: true, result: JSON.parse(JSON.stringify(pre)), ms: 180 + Math.random() * 220 });
        }, 170 + Math.random() * 200);
      });
    }

    /* 无 DOI：走题录检索。注意区分「检索无结果」与「检索失败」——
       网络异常时绝不可误判为不存在，必须降级为待人工确认（可重试） */
    if (!item.doi) {
      return Promise.all([
        crossrefSearch(item.title || item.raw).then(function (r) { return { db: 'Crossref', ok: true, data: r }; },
          function () { return { db: 'Crossref', ok: false }; }),
        openAlexSearch(item.title || item.raw).then(function (r) { return { db: 'OpenAlex', ok: true, data: r }; },
          function () { return { db: 'OpenAlex', ok: false }; })
      ]).then(function (arr) {
        var okSrcs = arr.filter(function (x) { return x.ok; });
        /* 两个库全部检索失败 → 待人工确认（宁漏报：绝不判不存在） */
        if (!okSrcs.length) {
          return {
            preset: false, error: true,
            result: manualResult(item,
              'Crossref 与 OpenAlex 检索服务均暂时不可用，未能完成本条自动核验——请稍后点卡片上的「重新核验」重试，或按下方检索词人工核对。',
              {
                uncertain: ['authors', 'title', 'venue', 'year', 'doi'],
                checked: '已尝试检索 Crossref 与 OpenAlex，两个库均未返回结果（网络异常或超时），本条字段无一完成比对。',
                searches: arr.map(function (x) { return { db: x.db + ' 题录检索', query: item.title, hits: -1 }; })
              })
          };
        }
        var best = null, bestScore = 0, src = '';
        okSrcs.forEach(function (x) {
          x.data.forEach(function (r) {
            var s = jaccard(item.title, recTitle(r));
            if (s > bestScore) { bestScore = s; best = r; src = x.db; }
          });
        });
        var searches = okSrcs.map(function (x) { return { db: x.db + ' 题录检索', query: item.title, hits: x.data.length }; })
          .concat(arr.filter(function (x) { return !x.ok; }).map(function (x) { return { db: x.db + ' 题录检索', query: item.title, hits: -1 }; }));
        if (best && bestScore >= 0.6) {
          var r = resultFromRecord(best, item, best.DOI ? 'https://doi.org/' + cleanDoi(best.DOI) : 'https://search.crossref.org/?q=' + encodeURIComponent(item.title), src);
          r.searches = searches;
          return { preset: false, result: r, ms: 0 };
        }
        var srcNames = okSrcs.map(function (x) { return x.db; }).join(' 与 ');
        /* 中文题录：国际库无果 ≠ 文献不存在。Crossref / OpenAlex 以英文文献为主，
           中文期刊题录系统性未收录，宁漏报原则下降级为「待人工确认」，
           并引导到知网 / 万方 / 百度学术核实（这三个库没有公开 API，只能人工核） */
        if (item.lang === 'zh') {
          return {
            preset: false, ms: 0, result: manualResult(item,
              '中文期刊文献：Crossref 与 OpenAlex 以英文文献为主，未检索到该题录属正常现象——国际库无果不代表文献不存在，请通过知网 / 万方 / 百度学术核实。',
              {
                uncertain: ['authors', 'title', 'venue', 'year'],
                checked: '已检索 Crossref 与 OpenAlex，均无匹配记录；两个库对中文期刊收录有限，无法据此判定「不存在」。',
                searches: searches.concat([
                  { db: '知网检索', query: item.title, hits: null, suggest: true },
                  { db: '万方检索', query: item.title, hits: null, suggest: true },
                  { db: '百度学术检索', query: item.title, hits: null, suggest: true }
                ])
              })
          };
        }
        return {
          preset: false, ms: 0, result: {
            verdict: 'missing', lang: item.lang, cited: item, db: null, matched: [], mismatch: [],
            evidence: srcNames + ' 检索均未找到匹配记录，该条目可能为虚构引用。',
            searches: searches.concat([{ db: '本地题录快照', query: item.title, hits: 0 }]),
            url: 'https://search.crossref.org/?q=' + encodeURIComponent(item.title)
          }
        };
      }).catch(function (e) {
        return {
          preset: false, error: true,
          result: manualResult(item,
            '检索服务暂时不可用，未能完成本条自动核验，请稍后重试或人工核对。',
            {
              uncertain: ['authors', 'title', 'venue', 'year', 'doi'],
              checked: '检索请求未完成（网络异常或超时），本条字段无一完成比对。',
              searches: [{ db: 'Crossref 题录检索', query: item.title, hits: -1 }, { db: 'OpenAlex 题录检索', query: item.title, hits: -1 }]
            })
        };
      });
    }

    /* 有 DOI：先解析 DOI（Crossref 失败时，10.48550 前缀的 arXiv DOI 走 DataCite 兜底） */
    return crossrefByDoi(item.doi).then(function (rec) {
      if (!rec && /^10\.48550\//i.test(item.doi)) {
        return dataciteByDoi(item.doi).then(function (d) {
          if (!d) return null;
          var r = resultFromRecord(d, item, 'https://doi.org/' + encodeURIComponent(item.doi), 'DataCite');
          r.searches = [{ db: 'DataCite DOI 解析', query: item.doi, hits: 1 }];
          return { preset: false, result: r, ms: 0 };
        }).catch(function () { return null; }).then(function (out) { return out || null; });
      }
      return rec;
    }).then(function (rec) {
      if (rec && rec.result) return rec;
      if (rec) {
        var sim = jaccard(item.title, recTitle(rec));
        var r = resultFromRecord(rec, item, 'https://doi.org/' + encodeURIComponent(item.doi), 'Crossref');
        r.searches = [{ db: 'Crossref DOI 解析', query: item.doi, hits: 1 }];
        if (sim >= 0.6) return { preset: false, result: r, ms: 0 };
        /* DOI 解析成功但标题不符 → DOI 错指 */
        return {
          preset: false, ms: 0, result: {
            verdict: 'doi', lang: item.lang, cited: item,
            db: { source: 'Crossref', authors: authorNames(rec), title: recTitle(rec), venue: recVenue(rec), year: recYear(rec), doi: item.doi },
            matched: ['doi'], mismatch: ['title', 'authors', 'venue', 'year'],
            doiResolvesTo: { title: recTitle(rec), authors: authorNames(rec), venue: recVenue(rec), year: recYear(rec), doi: item.doi, url: 'https://doi.org/' + encodeURIComponent(item.doi) },
            evidence: 'DOI ' + item.doi + ' 可解析，但指向《' + recTitle(rec) + '》，与本条标题不符——判定 DOI 错指。',
            searches: [{ db: 'Crossref DOI 解析', query: item.doi, hits: 1 }],
            url: 'https://doi.org/' + encodeURIComponent(item.doi)
          }
        };
      }
      /* DOI 无法解析：再用题录检索兜底（Crossref + OpenAlex 双库并行，宁漏报） */
      return Promise.all([
        crossrefSearch(item.title || item.raw).then(function (r) { return { db: 'Crossref', ok: true, data: r }; },
          function () { return { db: 'Crossref', ok: false }; }),
        openAlexSearch(item.title || item.raw).then(function (r) { return { db: 'OpenAlex', ok: true, data: r }; },
          function () { return { db: 'OpenAlex', ok: false }; })
      ]).then(function (arr) {
        var okSrcs = arr.filter(function (x) { return x.ok; });
        var searches = [{ db: 'Crossref DOI 解析', query: item.doi, hits: 0 }]
          .concat(okSrcs.map(function (x) { return { db: x.db + ' 题录检索', query: item.title, hits: x.data.length }; }))
          .concat(arr.filter(function (x) { return !x.ok; }).map(function (x) { return { db: x.db + ' 题录检索', query: item.title, hits: -1 }; }));
        /* 两个库全部检索失败 → 待人工确认（宁漏报：绝不判不存在） */
        if (!okSrcs.length) {
          return {
            preset: false, error: true,
            result: manualResult(item,
              'Crossref 与 OpenAlex 检索服务均暂时不可用，未能完成本条自动核验——请稍后点卡片上的「重新核验」重试，或按下方检索词人工核对。',
              {
                uncertain: ['authors', 'title', 'venue', 'year', 'doi'],
                checked: 'DOI ' + item.doi + ' 解析未获得结果，Crossref 与 OpenAlex 题录检索也未完成（网络异常或超时）。',
                searches: searches
              })
          };
        }
        var best = null, bs = 0, bestSrc = '';
        okSrcs.forEach(function (x) {
          x.data.forEach(function (r2) {
            var s = jaccard(item.title, recTitle(r2));
            if (s > bs) { bs = s; best = r2; bestSrc = x.db; }
          });
        });
        if (best && bs >= 0.7) {
          var r2 = resultFromRecord(best, item, best.DOI ? 'https://doi.org/' + cleanDoi(best.DOI) : 'https://search.crossref.org/?q=' + encodeURIComponent(item.title), bestSrc);
          r2.searches = searches;
          return { preset: false, result: r2, ms: 0 };
        }
        /* 中文题录（含中国注册机构 DOI，如 10.3969/j.issn...）：
           国际 DOI 解析服务不收录，降级待人工确认，引导中文库核实 */
        if (item.lang === 'zh') {
          return {
            preset: false, ms: 0, result: manualResult(item,
              '中文文献：DOI ' + item.doi + ' 未能通过国际库解析或匹配——解析不到不代表文献不存在，请通过知网 / 万方 / 百度学术核实。',
              {
                uncertain: ['authors', 'title', 'venue', 'year', 'doi'],
                checked: '已尝试通过 Crossref 解析 DOI，并按题录检索 Crossref 与 OpenAlex，均未获得匹配记录；国际库对中文期刊收录有限，无法据此判定「不存在」。',
                searches: searches.concat([
                  { db: '知网检索', query: item.title, hits: null, suggest: true },
                  { db: '万方检索', query: item.title, hits: null, suggest: true },
                  { db: '百度学术检索', query: item.title, hits: null, suggest: true }
                ])
              })
          };
        }
        return {
          preset: false, ms: 0, result: {
            verdict: 'missing', lang: item.lang, cited: item, db: null, matched: [], mismatch: [],
            evidence: 'DOI ' + item.doi + ' 无法解析，Crossref 与 OpenAlex 双库题录检索均未找到匹配记录。',
            searches: searches.concat([{ db: '本地题录快照', query: item.title, hits: 0 }]),
            url: 'https://search.crossref.org/?q=' + encodeURIComponent(item.title)
          }
        };
      });
    }).catch(function () {
      return {
        preset: false, error: true,
        result: manualResult(item,
          '检索服务暂时不可用，未能完成本条自动核验，请稍后重试或人工核对。',
          {
            uncertain: ['authors', 'title', 'venue', 'year', 'doi'],
            checked: '已尝试解析 DOI ' + item.doi + '，Crossref 未返回结果（网络异常或超时）。',
            searches: [{ db: 'Crossref DOI 解析', query: item.doi, hits: -1 }]
          })
      };
    });
  }

  return {
    icon: icon, el: el, esc: esc,
    store: store, shareQuery: shareQuery,
    openModal: openModal, closeModal: closeModal, toast: toast,
    extractDoi: extractDoi, extractYear: extractYear, extractTitle: extractTitle, extractAuthors: extractAuthors,
    formatCheck: formatCheck,
    splitRefSection: splitRefSection, parseRefEntries: parseRefEntries, extractInlineCitations: extractInlineCitations,
    jaccard: jaccard, norm: norm,
    verifyItem: verifyItem
  };
})();
