/* ============================================================
 * 明鉴引文 CiteProof — 核验结果页（含内嵌证据面板）
 * V0.2：刷新状态恢复（I-1）/ 待确认明细（E-2）/ 证据翻译（E-4）
 *       查库清单（E-5）/ 判定规则入口（E-6）
 * V0.3：格式预检 / 三库检索 / 人工标记 / 报告导出（E-7）
 * ============================================================ */
(function () {
  'use strict';
  var C = window.CP_CORE, D = window.CP_DATA;

  var session = C.store.get('session', null);
  var state = {
    items: [], results: [], filter: 'all', running: false,
    hidden: 0, doc: null, fileName: null, source: 'paste',
    openPanels: [], recovered: 0, marks: {}
  };

  /* 旧版本缓存检测：data.js 未带 OpenAlex key（旧缓存 / 旧版本）时，
     OpenAlex 只能匿名调用，大概率被官方限流——Crossref 核验不受影响，
     但提前告知用户刷新页面，避免「OpenAlex 一直检索失败」的困惑 */
  if (!D.OPENALEX_API_KEY) {
    setTimeout(function () {
      C.toast('检测到旧版本代码（' + (D.CP_VERSION || '未知版本') + '，当前应为 v0.3.3）：OpenAlex 密钥未加载，OpenAlex 检索将受限（Crossref 核验不受影响）——请强制刷新（Ctrl+Shift+R），或打开 diagnostic.html 诊断页查因', 10000);
    }, 600);
  }

  /* 数据源健康状态：探测 Crossref / OpenAlex 连通性并显示状态灯，
     让用户一眼分清「库/网络问题」与「文献问题」——库不可达时不影响
     Crossref 已完成的核验，仅未覆盖条目需人工确认 */
  function renderSrcHealth() {
    var box = document.getElementById('src-health');
    if (!box) return;
    box.innerHTML = '<span class="src-dot probing"></span>数据源状态检测中…';
    C.probeSources().then(function (s) {
      function dot(st, name) {
        if (st === 'ok') return '<span class="src-dot ok"></span>' + name + ' 正常';
        return '<span class="src-dot bad"></span>' + name + ' 暂不可达';
      }
      var html = '<span class="src-health-label">数据源状态：</span>' +
        dot(s.crossref, 'Crossref') + ' · ' + dot(s.openalex, 'OpenAlex');
      if (s.openalex === 'fail') {
        html += '<span class="src-health-note">（OpenAlex 不可达不影响 Crossref 已完成的核验；仅双库均无记录的条目会转人工确认）</span>';
      }
      box.innerHTML = html;
    });
  }
  renderSrcHealth();

  /* ---------------- 本地持久化（I-1） ---------------- */
  function persistResults() {
    var arr = [];
    for (var i = 0; i < state.items.length; i++) arr.push(state.results[i] || null);
    C.store.set('results', arr);
  }
  function persistUi() {
    C.store.set('ui', { filter: state.filter, open: state.openPanels });
  }

  /* ---------------- 人工结论标记（工作台闭环） ----------------
   * 用户在知网/万方等库人工核实后，在产品内记录结论；
   * 结论以题录文本哈希为键存本地，同一文献再现时自动带出。 */
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return 'h' + (h >>> 0).toString(36);
  }
  function loadMarks() {
    var m = C.store.get('marks', null);
    return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
  }
  function saveMarks() { C.store.set('marks', state.marks); }
  function getMark(item) { return state.marks[hashStr(item.raw)] || null; }
  function setMark(item, status) {
    if (!D.MARK_STATUS[status]) return;
    var k = hashStr(item.raw);
    if (state.marks[k] && state.marks[k].status === status) delete state.marks[k]; /* 再点一次取消 */
    else state.marks[k] = { status: status, at: Date.now() };
    saveMarks();
  }
  function doneCount() {
    var n = 0;
    for (var i = 0; i < state.items.length; i++) if (state.results[i]) n++;
    return n;
  }
  /* 读取已存结果：条数必须与当前核验单一致，逐条校验结构 */
  function loadPersisted() {
    var saved = C.store.get('results', null);
    if (!Array.isArray(saved) || saved.length !== state.items.length) return 0;
    var n = 0;
    for (var i = 0; i < saved.length; i++) {
      var e = saved[i];
      if (e && e.result && e.result.verdict && D.VERDICTS[e.result.verdict]) { state.results[i] = e; n++; }
    }
    return n;
  }

  /* ---------------- 顶栏 ---------------- */
  document.getElementById('btn-back').innerHTML = C.icon('arrow-left', 15) + '返回工作台';
  document.getElementById('btn-restart').innerHTML = C.icon('refresh', 14) + '重新核验';
  document.getElementById('btn-copy-summary').innerHTML = C.icon('copy', 14) + '复制汇总';
  document.getElementById('btn-export').innerHTML = C.icon('download', 14) + '导出报告';
  document.getElementById('btn-rules').innerHTML = C.icon('info', 14) + '判定规则';
  document.getElementById('btn-restart').onclick = function () {
    C.store.del('session'); C.store.del('results'); C.store.del('ui');
    location.href = 'index.html' + C.shareQuery();
  };
  document.getElementById('btn-export').onclick = function () { exportReport(); };
  document.getElementById('btn-rules').onclick = function () {
    C.openModal(
      '<div class="md-title">' + C.icon('shield', 22) + '判定规则</div>' +
      '<p class="md-sub">明鉴引文怎么下结论，全部写在这里——看到任何一条判定，都可以按下面的规则自行复核。</p>' +
      '<div class="rules">' + D.RULES_HTML + '</div>' +
      '<div class="md-note">' + C.icon('alert-circle', 14) + ' 核验结论以数据库登记记录为准，最终引用请以原文为准。</div>'
    );
  };
  document.getElementById('btn-copy-summary').onclick = function () {
    var t = summaryText();
    var done = function () { C.toast('汇总结论已复制到剪贴板'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done, function () { fallbackCopy(t); done(); });
    } else { fallbackCopy(t); done(); }
  };
  function fallbackCopy(t) {
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  /* ---------------- 空态 ---------------- */
  function renderEmpty() {
    C.store.del('results'); C.store.del('ui');
    document.getElementById('summary').style.display = 'none';
    document.getElementById('doc-compare').innerHTML = '';
    document.getElementById('list-title').innerHTML = '';
    document.getElementById('cards').innerHTML =
      '<div class="empty">' +
      '<div class="empty-ic">' + C.icon('clipboard', 30) + '</div>' +
      '<h3>还没有核验单</h3>' +
      '<p>回到核验工作台，粘贴 AI 生成的参考文献清单，或上传 docx / txt 文档，即可开始逐条核验。</p>' +
      '<a class="btn btn-primary btn-lg" href="index.html">回到核验工作台' + C.icon('arrow-right', 16) + '</a>' +
      '</div>';
  }

  /* ---------------- E-7 核验报告导出（Markdown，本地生成下载） ---------------- */
  function pad2(n) { return String(n).length < 2 ? '0' + n : String(n); }
  function fmtTime(ts) {
    var d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  /* Markdown 表格单元格：竖线转义、换行压平 */
  function mdCell(s) { return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim(); }
  function cut(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; }

  /* 单条明细（E-2 不确定点文案与 E-7 报告共用，避免两处漂移） */
  var MANUAL_REASONS = {
    authors: '作者字段未能与数据库记录比对',
    title: '标题未能与数据库记录比对',
    venue: '来源字段未能与数据库记录比对',
    year: '年份未能与数据库记录比对',
    doi: 'DOI 未能解析或未能比对'
  };

  function detailText(idx, res) {
    var it = state.items[idx];
    var v = D.VERDICTS[res.verdict];
    var mk = getMark(it);
    var L = [];
    L.push('### ' + pad2(idx + 1) + ' · ' + v.label + '（' + (it.lang === 'zh' ? '中文' : 'EN') + '）');
    L.push('');
    L.push('- **题录**：' + it.raw);
    L.push('- **判定依据**：' + (res.evidence || '—'));
    var fmt = it.fmt || [];
    L.push('- **格式预检**：' + (fmt.length
      ? fmt.map(function (f) { return f.text; }).join('；')
      : '未发现明显格式问题（本地 GB/T 7714 预检，仅供参考，不作为判定依据）'));
    if (res.db && (res.verdict === 'pass' || res.verdict === 'wrong' || res.verdict === 'doi')) {
      L.push('- **字段核对**（你的引用 → 数据库记录，来源：' + (res.db.source || '—') + '）：');
      ['authors', 'title', 'venue', 'year', 'doi'].forEach(function (k) {
        var cv = (res.cited || {})[k], dv = (res.db || {})[k];
        var bad = (res.mismatch || []).indexOf(k) > -1;
        L.push('  - ' + (D.FIELD_LABELS[k] || k) + '：' + (cv == null || cv === '' ? '—' : cv) +
          ' → ' + (dv == null || dv === '' ? '—' : dv) + (bad ? '（**不一致**）' : '（一致）'));
      });
    }
    if (res.verdict === 'doi' && res.doiResolvesTo) {
      L.push('- **DOI 实际解析到**：《' + res.doiResolvesTo.title + '》，' + res.doiResolvesTo.authors +
        '，' + res.doiResolvesTo.venue + '，' + res.doiResolvesTo.year + '（DOI: ' + res.doiResolvesTo.doi + '）');
    }
    if (res.verdict === 'manual') {
      var unc = (res.uncertain && res.uncertain.length) ? res.uncertain : ['authors', 'title', 'venue', 'year', 'doi'];
      L.push('- **不确定点**：' + unc.map(function (f) {
        return (D.FIELD_LABELS[f] || f) + '（' + (MANUAL_REASONS[f] || '未能自动核对') + '）';
      }).join('；'));
      if (res.checked) L.push('- **已查内容**：' + res.checked);
      L.push('- **下一步建议**：点卡片上的「重新核验」重试；或按下方查库清单中的检索词到数据库人工比对；中文文献可点知网 / 万方 / 百度学术按钮一键检索（检索词已自动填好）。');
    }
    var ss = res.searches || [];
    if (ss.length) {
      L.push('- **查库清单**：');
      ss.forEach(function (s) {
        var line = '  - ' + s.db + '：检索词「' + s.query + '」→ ' +
          (s.suggest ? '建议人工核实（该库无公开接口）'
            : (s.hits === -1 || s.hits == null ? '检索失败' : s.hits + ' 条结果'));
        if (D.isLocalDb(s.db)) line += '（本地快照，非实时检索）';
        L.push(line);
      });
    } else {
      L.push('- **查库清单**：本条未产生检索记录——检索服务在发起请求前即不可用。');
    }
    if (res.url) L.push('- **来源页面**：' + res.url);
    L.push('- **人工结论**：' + (mk
      ? D.MARK_STATUS[mk.status].label + '（标记于 ' + fmtTime(mk.at) + '，在产品内记录，可随时更改）'
      : '未标记'));
    return L;
  }

  function docCompareText() {
    if (!state.doc) return [];
    var listed = state.items.length;
    var inline = state.doc.inline || [];
    var citedNotListed = inline.filter(function (x) { return x < 1 || x > listed; });
    var listedNotCited = [];
    for (var i = 1; i <= listed; i++) if (inline.indexOf(i) === -1) listedNotCited.push(i);
    var L = ['## 三、正文引用与文末清单比对', '',
      '文档：' + (state.fileName || '上传文档') + '；正文引用标记 ' + inline.length + ' 处，文末清单 ' + listed + ' 条。', ''];
    if (!citedNotListed.length && !listedNotCited.length) {
      L.push('正文引用与文末清单完全一致，未发现「引了没列」或「列了没引」。');
    } else {
      L.push('- **引了没列**（' + citedNotListed.length + ' 处）：' + (citedNotListed.length
        ? citedNotListed.map(function (x) { return '[' + x + ']'; }).join('、') + '——正文出现该引用标记，但文末参考文献清单中没有对应条目。'
        : '无'));
      L.push('- **列了没引**（' + listedNotCited.length + ' 条）：' + (listedNotCited.length
        ? listedNotCited.map(function (x) {
            return '[' + x + '] ' + cut(state.items[x - 1] ? state.items[x - 1].raw : '', 40);
          }).join('；')
        : '无'));
    }
    return L;
  }

  function boundaryText() {
    return [
      '## ' + (state.doc ? '四' : '三') + '、能力边界与使用说明', '',
      '1. **英文文献**：引擎实时检索 Crossref 与 OpenAlex 双库，字段一致判「通过」，多库一致无果才判「不存在」；',
      '2. **中文文献**：国际文献库对中文期刊题录系统性未收录，国际库查不到时**不会判「不存在」**，只标「待人工确认」，并提供知网 / 万方 / 百度学术一键检索入口，请人工核实后回产品标记结论；',
      '3. **宁漏报原则**：检索服务不可用时不把「查不到」当「不存在」，一律转「待人工确认」；',
      '4. 标注「本地快照」的为演示数据，非实时检索；格式预检按 GB/T 7714 本地规则执行，仅供参考，不作为判定依据；',
      '5. 核验结论以数据库登记记录为准，最终引用请以原文为准；',
      '6. 本报告由浏览器本地生成，核验数据仅存储于本机，不会上传。'
    ];
  }

  function reportText() {
    var c = counts(), n = state.items.length, done = doneCount();
    var m = markCounts();
    var L = [];
    L.push('# 明鉴引文 CiteProof · 核验报告', '');
    L.push('- 核验单号：' + (document.getElementById('order-id').textContent || '—'));
    L.push('- 导出时间：' + fmtTime());
    L.push('- 核验方式：' + (state.doc
      ? '上传文档' + (state.fileName ? '（' + state.fileName + '）' : '')
      : '粘贴文献清单'));
    L.push('- 核验状态：' + (done === n
      ? '已完成（' + done + ' / ' + n + ' 条）'
      : '进行中（已验 ' + done + ' / ' + n + ' 条，本报告仅含已验条目）'));
    L.push('', '## 一、结论汇总', '', summaryText(), '');
    L.push(m.marked
      ? '人工核实：共标记 ' + m.marked + ' 条（已核实存在 ' + m.confirmed + '、查无此文 ' + m.notfound + '、待复查 ' + m.recheck + '），还有 ' + (n - m.marked) + ' 条未标记。'
      : '人工核实：本单尚未做任何人工结论标记。');
    L.push('', '| # | 判定 | 语种 | 人工结论 | 题录 |', '|---|------|------|----------|------|');
    for (var i = 0; i < n; i++) {
      var r = state.results[i];
      if (!r) continue;
      var mk = getMark(state.items[i]);
      L.push('| ' + pad2(i + 1) + ' | ' + D.VERDICTS[r.result.verdict].label + ' | ' +
        (state.items[i].lang === 'zh' ? '中文' : 'EN') + ' | ' +
        (mk ? D.MARK_STATUS[mk.status].label : '—') + ' | ' + mdCell(cut(state.items[i].raw, 50)) + ' |');
    }
    L.push('', '## 二、逐条明细', '');
    for (var j = 0; j < n; j++) {
      if (!state.results[j]) continue;
      L.push(detailText(j, state.results[j].result).join('\n'), '');
    }
    var doc = docCompareText();
    if (doc.length) L.push(doc.join('\n'), '');
    L.push(boundaryText().join('\n'));
    return L;
  }

  function exportReport() {
    var done = doneCount(), n = state.items.length;
    var text = reportText().join('\n') + '\n';
    var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '核验报告_' + (document.getElementById('order-id').textContent || 'CP') + '.md';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    C.toast(done === n ? '核验报告已导出（Markdown 格式）' : '报告已导出——核验尚未完成，仅含已验 ' + done + ' 条', done === n ? '' : 'warn');
  }

  /* ---------------- 汇总栏 ---------------- */
  function counts() {
    var c = { pass: 0, missing: 0, wrong: 0, doi: 0, manual: 0 };
    for (var i = 0; i < state.items.length; i++) {
      var r = state.results[i];
      if (r && c[r.result.verdict] != null) c[r.result.verdict]++;
    }
    c.issue = c.missing + c.wrong + c.doi;
    return c;
  }

  /* 人工结论标记统计（与自动判定分开报，不混入「存在问题」计数） */
  function markCounts() {
    var m = { confirmed: 0, notfound: 0, recheck: 0, marked: 0 };
    for (var i = 0; i < state.items.length; i++) {
      var mk = getMark(state.items[i]);
      if (mk && m[mk.status] != null) { m[mk.status]++; m.marked++; }
    }
    return m;
  }

  function summaryText() {
    var c = counts(), n = state.items.length;
    var m = markCounts();
    var t = '本单共 ' + n + ' 条，检测到 ' + c.issue + ' 条存在问题，其中不存在 ' + c.missing +
      ' 条、张冠李戴 ' + c.wrong + ' 条、DOI 错指 ' + c.doi + ' 条、待人工确认 ' + c.manual + ' 条，通过 ' + c.pass + ' 条。';
    if (m.marked) {
      t += '人工核实结论：已核实存在 ' + m.confirmed + ' 条、查无此文 ' + m.notfound + ' 条、待复查 ' + m.recheck + ' 条。';
    }
    return t;
  }

  function renderSummary() {
    var c = counts(), n = state.items.length, done = doneCount();
    var runPill = state.running
      ? '<span class="run-pill"><span class="spin"></span>核验中 · 已验 ' + done + '</span>'
      : (done === n && n > 0 ? '<span class="run-pill" style="background:var(--pass-soft);border-color:var(--pass-line);color:var(--pass)">' + C.icon('check-circle', 12) + '核验完成</span>' : '');

    document.getElementById('sum-line').innerHTML =
      '本单共 <b class="n-total">' + n + '</b> 条，检测到 <b class="n-issue">' + c.issue + '</b> 条存在问题，' +
      '其中不存在 <b class="n-missing">' + c.missing + '</b> 条、张冠李戴 <b class="n-wrong">' + c.wrong + '</b> 条、' +
      'DOI 错指 <b class="n-doi">' + c.doi + '</b> 条、待人工确认 <b class="n-manual">' + c.manual + '</b> 条' +
      runPill +
      '<span style="color:var(--ink-300);font-size:.82em;font-family:var(--font-sans)"> · 通过 <b class="n-pass">' + c.pass + '</b> 条</span>';

    document.getElementById('prog-cur').textContent = done;
    document.getElementById('prog-total').textContent = n;
    document.getElementById('prog-fill').style.width = (n ? (done / n * 100) : 0) + '%';

    /* 人工核实结论行（有标记才出现） */
    var m = markCounts();
    var marksBox = document.getElementById('sum-marks');
    if (marksBox) {
      marksBox.innerHTML = m.marked
        ? '<span class="sm-label">' + C.icon('check-circle', 13) + '人工核实</span>' +
          '<span class="sm-item sm-ok">已核实存在 <b>' + m.confirmed + '</b></span>' +
          '<span class="sm-item sm-bad">查无此文 <b>' + m.notfound + '</b></span>' +
          '<span class="sm-item sm-warn">待复查 <b>' + m.recheck + '</b></span>' +
          '<span class="sm-left">还有 <b>' + (n - m.marked) + '</b> 条未标记</span>'
        : '';
      marksBox.style.display = m.marked ? '' : 'none';
    }

    var order = [
      { k: 'all', label: '全部', cls: 'c-all', num: n },
      { k: 'missing', label: '不存在', cls: 'c-missing', num: c.missing },
      { k: 'wrong', label: '张冠李戴', cls: 'c-wrong', num: c.wrong },
      { k: 'doi', label: 'DOI 错指', cls: 'c-doi', num: c.doi },
      { k: 'manual', label: '待人工确认', cls: 'c-manual', num: c.manual },
      { k: 'pass', label: '通过', cls: 'c-pass', num: c.pass }
    ];
    document.getElementById('chips').innerHTML = order.map(function (o) {
      var on = state.filter === o.k ? ' on' : '';
      var dot = o.k === 'all' ? '' : '<span class="cdot" style="color:var(--' + o.k + ')"></span>';
      return '<button class="chip ' + o.cls + on + '" data-k="' + o.k + '" aria-pressed="' + (state.filter === o.k) + '">' +
        dot + o.label + '<span class="cnum">' + o.num + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (b) {
      b.onclick = function () { setFilter(b.dataset.k); };
    });
    document.getElementById('list-title').innerHTML = C.icon('list', 13) + ' ' + listTitle();
  }

  function listTitle() {
    var base = '全部 ' + state.items.length + ' 条核验结果';
    if (state.filter === 'all') return base;
    var v = D.VERDICTS[state.filter];
    return v.label + ' · ' + counts()[state.filter] + ' 条';
  }

  function setFilter(k) {
    state.filter = (state.filter === k && k !== 'all') ? 'all' : k;
    if (state.filter === 'all') state.hidden = 0;
    persistUi();
    applyFilter();
    renderSummary();
    document.getElementById('list-title').innerHTML = C.icon('list', 13) + ' ' + listTitle();
  }

  function applyFilter() {
    var shown = 0, total = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.res-card'), function (card) {
      total++;
      var ok = state.filter === 'all' || card.dataset.verdict === state.filter;
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    var tip = document.getElementById('hidden-tip');
    var hiddenN = total - shown;
    if (state.filter !== 'all' && hiddenN > 0) {
      tip.className = 'filter-hidden-tip on';
      tip.innerHTML = '当前筛选下还有 <b>' + hiddenN + '</b> 条未显示 <button id="btn-show-all">查看全部</button>';
      document.getElementById('btn-show-all').onclick = function () { state.filter = 'all'; state.hidden = 0; persistUi(); applyFilter(); renderSummary(); };
    } else {
      tip.className = 'filter-hidden-tip';
      tip.innerHTML = '';
    }
  }

  /* ---------------- 正文引用 vs 文末清单 ---------------- */
  function renderDocCompare() {
    var box = document.getElementById('doc-compare');
    if (!state.doc) { box.innerHTML = ''; return; }
    var listed = state.items.length;
    var inline = state.doc.inline || [];
    var citedNotListed = inline.filter(function (n) { return n < 1 || n > listed; });
    var listedNotCited = [];
    for (var i = 1; i <= listed; i++) if (inline.indexOf(i) === -1) listedNotCited.push(i);

    var html =
      '<div class="compare">' +
      '<div class="compare-head">' + C.icon('file-text', 17) +
      '<b>正文引用与文末清单比对</b>' +
      '<span>' + C.esc(state.fileName || '上传文档') + ' · 正文引用标记 ' + inline.length + ' 处，文末清单 ' + listed + ' 条</span></div>';

    if (!citedNotListed.length && !listedNotCited.length) {
      html += '<div class="compare-ok">' + C.icon('check-circle', 15) + '正文引用与文末清单完全一致，未发现「引了没列」或「列了没引」。</div>';
    } else {
      html += '<div class="compare-grid">';
      html += '<div class="compare-col cc-cited"><div class="cc-head">' + C.icon('alert-circle', 14) + '引了没列<span class="tag">' + citedNotListed.length + '</span></div>';
      html += citedNotListed.length
        ? citedNotListed.map(function (n) { return '<div class="cc-item"><span class="mk">[' + n + ']</span><span>正文出现该引用标记，但文末参考文献清单中没有对应条目。</span></div>'; }).join('')
        : '<div class="cc-empty">未发现此类问题</div>';
      html += '</div>';
      html += '<div class="compare-col cc-listed"><div class="cc-head">' + C.icon('alert-circle', 14) + '列了没引<span class="tag">' + listedNotCited.length + '</span></div>';
      html += listedNotCited.length
        ? listedNotCited.map(function (n) {
            var it = state.items[n - 1];
            return '<div class="cc-item"><span class="mk">[' + n + ']</span><span>' + C.esc(it ? it.raw : '') + '</span></div>';
          }).join('')
        : '<div class="cc-empty">未发现此类问题</div>';
      html += '</div></div>';
    }
    html += '</div>';
    box.innerHTML = html;
  }

  /* ---------------- 证据面板 ---------------- */
  function fieldRow(key, cited, db, matched, mismatch, langLabel) {
    var label = langLabel ? '语种' : (D.FIELD_LABELS[key] || key);
    var cv = cited[key], dv = db[key];
    var isMiss = mismatch.indexOf(key) > -1;
    var cls = isMiss ? (key === 'doi' ? 'miss miss-doi' : (key === 'authors' ? 'miss miss-wrong' : 'miss')) : 'match';
    var st = isMiss ? C.icon('x', 15) : C.icon('check', 15);
    return '<div class="fc-row ' + cls + '">' +
      '<div class="f-label">' + label + '</div>' +
      '<div class="f-cited"><span class="f-val trg">' + C.esc(cv == null || cv === '' ? '—' : cv) + '</span></div>' +
      '<div class="f-db"><span class="src">' + C.esc(db.source || '') + '</span><span class="f-val trg">' + C.esc(dv == null || dv === '' ? '—' : dv) + '</span></div>' +
      '<div class="f-st">' + st + '</div></div>';
  }

  function buildFieldCompare(res) {
    var cited = res.cited || {}, db = res.db || {};
    var matched = res.matched || [], mismatch = res.mismatch || [];
    var rows = '';
    ['authors', 'title', 'venue', 'year', 'doi'].forEach(function (k) { rows += fieldRow(k, cited, db, matched, mismatch, false); });
    var langCited = cited.lang === 'zh' ? '中文' : '英文';
    var langDb = res.lang === 'zh' ? '中文' : '英文';
    rows += fieldRow('lang', { lang: langCited }, { lang: langDb, source: db.source || '' }, matched, mismatch, true);

    return '<div class="fc">' +
      '<div class="fc-head"><div>字段</div><div>你的引用</div><div>数据库记录</div><div style="justify-content:center">核对</div></div>' +
      rows + '</div>';
  }

  /* E-5 查库清单：所有判定类型都展示「查了哪些库、检索词、命中情况」 */
  function buildQueryList(res) {
    var searches = res.searches || [];
    var rows = searches.map(function (s) {
      /* suggest=true：中文库无公开 API，未自动检索，仅作人工核实入口 */
      var suggest = !!s.suggest;
      var failed = suggest ? false : (s.hits === -1 || s.hits == null);
      var cls = suggest ? 'suggest' : (failed ? 'fail' : (s.hits === 0 ? 'zero' : 'hit'));
      var txt = suggest ? '建议人工核实' : (failed ? '检索失败' : (s.hits === 0 ? '0 条结果' : s.hits + ' 条结果'));
      var local = D.isLocalDb(s.db);
      var url = local ? null : D.dbSearchUrl(s.db, s.query);
      var link = local
        ? '<span class="sr-local" title="本地演示快照，非实时检索">本地快照</span>'
        : (url ? '<a class="sr-link" href="' + C.esc(url) + '" target="_blank" rel="noopener noreferrer" title="跳到该库检索页">' + C.icon('external-link', 13) + '库内检索</a>' : '');
      return '<div class="sr-row">' +
        '<span class="sr-db">' + C.icon('database', 14) + C.esc(s.db) + '</span>' +
        '<span class="sr-q" title="' + C.esc(s.query) + '">' + C.esc(s.query) + '</span>' +
        '<span class="sr-hits ' + cls + '">' + txt + '</span>' +
        '<button class="btn-ev" style="height:26px;padding:0 8px" data-copy="' + C.esc(s.query) + '" title="复制检索词">' + C.icon('copy', 13) + '</button>' +
        link + '</div>';
    }).join('');
    var empty = searches.length ? '' : '<div class="sr-row sr-empty">本条未产生检索记录——检索服务在发起请求前即不可用。</div>';
    return '<div class="sr qlist">' +
      '<div class="qlist-head">' + C.icon('database', 15) + '<b>查库清单</b><span>本次实际查询的数据库、检索词与返回情况</span></div>' +
      rows + empty +
      '<div class="sr-note">' + C.icon('search', 14) + '<span>检索词可复制后自行到对应数据库复核；点「库内检索」一键跳到该库检索页；标注「本地快照」的为演示数据，非实时检索；标注「建议人工核实」的中文库没有公开接口，需人工点开核对。</span></div></div>';
  }

  /* E-2 待人工确认明细：不确定点 + 已查内容 + 下一步 */
  function buildManualDetail(res) {
    var unc = (res.uncertain && res.uncertain.length) ? res.uncertain : ['authors', 'title', 'venue', 'year', 'doi'];
    var rows = unc.map(function (f) {
      return '<div class="mu-row"><span class="mu-f">' + (D.FIELD_LABELS[f] || f) + '</span><span class="mu-r">' + (MANUAL_REASONS[f] || '未能自动核对') + '</span></div>';
    }).join('');
    var checked = res.checked
      ? '<div class="mu-checked">' + C.icon('search', 14) + '<span>' + C.esc(res.checked) + '</span></div>'
      : '';
    return '<div class="manual-box">' +
      '<div class="mu-sec"><h5>' + C.icon('alert-circle', 14) + '不确定点</h5><div class="mu-rows">' + rows + '</div></div>' +
      (checked ? '<div class="mu-sec"><h5>' + C.icon('database', 14) + '已查内容</h5>' + checked + '</div>' : '') +
      '<div class="mu-sec"><h5>' + C.icon('info', 14) + '下一步建议</h5><div class="mu-next">点卡片上的「重新核验」重试；或复制下方查库清单中的检索词，到数据库自行比对；也可以点「打开原页面」在来源库中检索确认。</div></div>' +
      '</div>';
  }

  /* ---------------- E-4 翻译（服务端代理） ---------------- */
  /* 【功能已下线 · 2026-11-04】免费兜底通道翻译质量不达标，用户要求暂时取消。
     UI 入口（卡片「译」按钮 / 面板「面板译为中文」按钮）已从 buildEvidence 与
     cardEl 移除；本文件函数与服务端 server.js（有道智云→百度→MyMemory 三级链）
     完整保留。恢复方式：拿到有道智云或百度翻译 API key 后，在上方两个渲染函数中
     还原按钮 HTML（见 git 历史），并在服务端配置 YOUDAO_APP_KEY/YOUDAO_APP_SECRET
     或 BAIDU_APP_ID/BAIDU_SECRET_KEY 环境变量即可，前端零改动。 */
  function translateText(text) {
    return fetch('api/translate' + C.shareQuery(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, from: 'en', to: 'zh-CN' })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'translate failed');
      return j.text;
    });
  }

  function toggleTranslate(btn, node) {
    var on = btn.classList.toggle('on');
    if (on) {
      if (!node.dataset.orig) node.dataset.orig = node.textContent;
      btn.innerHTML = '译…'; btn.disabled = true;
      translateText(node.dataset.orig).then(function (t) {
        node.textContent = t;
        btn.innerHTML = '原'; btn.disabled = false;
        C.toast('已译为中文');
      }).catch(function () {
        btn.classList.remove('on'); btn.innerHTML = '译'; btn.disabled = false;
        btn.classList.add('tr-fail');
        setTimeout(function () { btn.classList.remove('tr-fail'); }, 2400);
        C.toast('翻译服务暂时不可用，已保留原文', 'warn');
      });
    } else {
      if (node.dataset.orig) node.textContent = node.dataset.orig;
      btn.innerHTML = '译';
    }
  }

  function togglePanelTranslate(btn, root) {
    var on = btn.classList.toggle('on');
    var nodes = Array.prototype.slice.call(root.querySelectorAll('.trg'));
    nodes.forEach(function (n) { if (!n.dataset.orig) n.dataset.orig = n.textContent; });
    if (!on) {
      nodes.forEach(function (n) { if (n.dataset.orig) n.textContent = n.dataset.orig; });
      btn.innerHTML = '面板译为中文';
      return;
    }
    btn.innerHTML = '翻译中…'; btn.disabled = true;
    var keys = {};
    nodes.forEach(function (n) { keys[n.dataset.orig] = 1; });
    var list = Object.keys(keys), cache = {}, idx = 0, fails = 0;
    function next() {
      if (idx >= list.length) {
        nodes.forEach(function (n) { n.textContent = cache[n.dataset.orig] || n.dataset.orig; });
        btn.disabled = false;
        if (list.length && fails === list.length) {
          /* 全部失败：按钮给出醒目错误态，不谎报成功 */
          btn.innerHTML = '翻译失败'; btn.classList.add('tr-fail');
          setTimeout(function () { btn.classList.remove('tr-fail'); btn.classList.remove('on'); btn.innerHTML = '面板译为中文'; }, 2400);
          C.toast('翻译服务暂时不可用，已保留原文', 'warn');
        } else if (fails) {
          btn.innerHTML = '显示原文';
          C.toast('已译 ' + (list.length - fails) + ' 条，' + fails + ' 条失败保留原文', 'warn');
        } else {
          btn.innerHTML = '显示原文';
          C.toast('面板内英文已译为中文');
        }
        return;
      }
      var k = list[idx++];
      translateText(k).then(function (t) { cache[k] = t; next(); })
        .catch(function () { fails++; cache[k] = k; next(); });
    }
    next();
  }

  function bindTranslate(card) {
    var btn = card.querySelector('[data-tr-card]');
    var span = card.querySelector('.rc-ev .trg');
    if (btn && span) btn.onclick = function () { toggleTranslate(btn, span); };
    var pbtn = card.querySelector('[data-tr-panel]');
    if (pbtn) pbtn.onclick = function () { togglePanelTranslate(pbtn, card.querySelector('.ev-inner')); };
  }

  function buildEvidence(res) {
    var v = D.VERDICTS[res.verdict];
    var noteCls = { pass: 'vn-pass', missing: 'vn-missing', wrong: 'vn-wrong', doi: 'vn-doi', manual: 'vn-manual' }[res.verdict];
    var head = '<div class="verdict-note ' + noteCls + '">' + C.icon(v.icon, 15) + '<span><b>' + v.label + '</b> · ' + C.esc(res.evidence || '') + '</span></div>';

    var body = '';
    if (res.verdict === 'pass') {
      body = buildFieldCompare(res);
    } else if (res.verdict === 'missing') {
      body = '<div class="sr-note" style="border:1px solid var(--missing-line);border-radius:var(--r-m);background:var(--missing-soft)">' +
        C.icon('x-circle', 14) + '<span>多个文献库检索均无匹配记录，详见下方查库清单——每个库的检索词都可以复制后自行复核。</span></div>';
    } else if (res.verdict === 'wrong') {
      body = buildFieldCompare(res) +
        '<div class="sr-note" style="border:1px solid var(--wrong-line);border-radius:var(--r-m);margin-top:12px;background:var(--wrong-soft)">' +
        C.icon('alert-triangle', 14) + '<span>高亮行为不一致字段：文献本身真实存在，但引用文本把作者写成了别人。引用时请改用右侧数据库记录中的作者列表。</span></div>';
    } else if (res.verdict === 'doi') {
      body = (res.doiResolvesTo
        ? '<div class="doi-box"><div class="db-t">' + C.icon('link', 14) + 'DOI 实际解析到</div>' +
          '<p class="trg"><b>' + C.esc(res.doiResolvesTo.title) + '</b><br>' + C.esc(res.doiResolvesTo.authors) + ' · ' +
          C.esc(res.doiResolvesTo.venue) + ' · ' + C.esc(res.doiResolvesTo.year) + '<br>' +
          '<span class="mono">DOI: ' + C.esc(res.doiResolvesTo.doi) + '</span></p></div>'
        : '') + buildFieldCompare(res);
    } else {
      body = buildManualDetail(res);
    }
    body += buildQueryList(res);

    var foot = '<div class="ev-foot">' +
      '<span class="ev-src">数据来源：<b>' + C.esc((res.db && res.db.source) || 'Crossref / OpenAlex 实时检索') + '</b>' +
      (res.searches && res.searches.length ? ' · 检索 ' + res.searches.length + ' 次' : '') + '</span>' +
      '<span class="grow"></span>' +
      (res.url ? '<a class="btn btn-ghost btn-sm" href="' + C.esc(res.url) + '" target="_blank" rel="noopener noreferrer">' + C.icon('external-link', 14) + '打开原页面</a>' : '') +
      '</div>';

    return '<div class="ev-clip"><div class="ev-inner">' +
      '<div class="ev-label">' + C.icon('eye', 13) + '证据面板 · ' + v.label +
      '</div>' + head + body + foot + '</div></div>';
  }

  /* 格式预检提示（本地 GB/T 7714 检查，提示而非判定） */
  function buildFmtHtml(issues) {
    if (!issues || !issues.length) return '';
    var rows = issues.map(function (i) {
      return '<div class="fmt-item fmt-' + i.level + '">' + C.icon('alert-circle', 12) + '<span>' + C.esc(i.text) + '</span></div>';
    }).join('');
    return '<div class="fmt-box"><span class="fmt-label">' + C.icon('clipboard', 12) + '格式预检</span>' + rows + '</div>';
  }

  /* 一键三库检索按钮组（中文题录：知网 / 万方 / 百度学术）
     注意：浏览器对「一次点击内多个 window.open」只放行第一个，
     因此做成三个独立按钮——每次点击都是独立用户手势，不会被拦截。 */
  function buildSearchBtns(item) {
    if (item.lang !== 'zh') return '';
    var urls = D.manualSearchUrls(item);
    if (!urls.length) return '';
    return '<span class="search-group" title="中文文献库没有公开 API，引擎无法自动检索——点开去库里人工核实，检索词已按本条题录自动填好">' +
      urls.map(function (x) {
        return '<button class="btn-search" data-search-url="' + C.esc(x.url) + '" data-search-db="' + C.esc(x.label) + '">' +
          C.icon('search', 12) + '<span>' + C.esc(x.label) + '</span></button>';
      }).join('') + '</span>';
  }

  /* 人工结论标记按钮组 */
  function buildMarkHtml(item) {
    var cur = getMark(item);
    var btns = Object.keys(D.MARK_STATUS).map(function (k) {
      var s = D.MARK_STATUS[k];
      var on = cur && cur.status === k ? ' on' : '';
      return '<button class="btn-mark' + on + '" data-mark="' + k + '" title="在外部库人工核实后标记：' + s.label + '">' + C.icon(s.icon, 12) + s.short + '</button>';
    }).join('');
    return '<span class="mark-acts">' + btns + '</span>';
  }

  /* ---------------- 结果卡片 ---------------- */
  function cardEl(item, res, idx, animate) {
    var v = D.VERDICTS[res.verdict];
    var wasOpen = state.openPanels.indexOf(idx) > -1;
    var card = C.el('article', 'res-card v-' + res.verdict + (animate ? ' flash' : '') + (wasOpen ? ' open' : ''));
    card.dataset.verdict = res.verdict;
    card.dataset.idx = idx;

    var doiTxt = item.doi ? '<span class="rc-doi">DOI ' + C.esc(item.doi) + '</span>' : '';
    var retry = res.verdict === 'manual'
      ? '<button class="btn-retry" data-retry="' + idx + '">' + C.icon('refresh', 13) + '重新核验</button>' : '';
    var mark = getMark(item);
    var markBadge = mark
      ? '<span class="rc-mark mk-' + D.MARK_STATUS[mark.status].tone + '">' + C.icon(D.MARK_STATUS[mark.status].icon, 12) + D.MARK_STATUS[mark.status].short + '</span>'
      : '';

    card.innerHTML =
      '<div class="rc-rail"></div>' +
      '<div class="rc-main">' +
      '<div class="rc-head">' +
      '<span class="badge b-' + v.tone + '">' + C.icon(v.icon, 13) + v.label + '</span>' +
      '<span class="rc-idx">#' + String(idx + 1).padStart(2, '0') + '</span>' +
      '<span class="rc-lang">' + (item.lang === 'zh' ? '中文' : 'EN') + '</span>' +
      doiTxt + markBadge +
      '</div>' +
      '<p class="rc-raw">' + C.esc(item.raw) + '</p>' +
      buildFmtHtml(item.fmt) +
      '<p class="rc-ev ev-tone-' + v.tone + '">' + C.icon(v.icon, 15) + '<span class="trg">' + C.esc(res.evidence || '') + '</span></p>' +
      '<div class="rc-actions">' +
      '<button class="btn-ev" aria-expanded="' + (wasOpen ? 'true' : 'false') + '">' + C.icon('eye', 14) + '<span>' + (wasOpen ? '收起证据' : '查看证据') + '</span>' + C.icon('chevron-down', 14) + '</button>' +
      buildSearchBtns(item) +
      retry +
      '<span class="grow"></span>' +
      buildMarkHtml(item) +
      '</div>' +
      '<div class="ev" id="ev-' + idx + '">' + buildEvidence(res) + '</div>' +
      '</div>';

    var btn = card.querySelector('.btn-ev');
    btn.onclick = function () {
      var open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('span').textContent = open ? '收起证据' : '查看证据';
      var k = state.openPanels.indexOf(idx);
      if (open && k === -1) state.openPanels.push(idx);
      if (!open && k > -1) state.openPanels.splice(k, 1);
      persistUi();
    };

    card.querySelectorAll('[data-search-url]').forEach(function (sb) {
      sb.onclick = function () {
        window.open(sb.getAttribute('data-search-url'), '_blank', 'noopener');
        C.toast('已打开' + sb.getAttribute('data-search-db') + '检索页——检索词已按本条题录填好，在库里确认后可回本页标记结论');
      };
    });

    var rb = card.querySelector('[data-retry]');
    if (rb) rb.onclick = function () { retryOne(idx, card); };

    card.querySelectorAll('[data-mark]').forEach(function (b) {
      b.onclick = function () {
        setMark(item, b.dataset.mark);
        var mk = getMark(item);
        var head = card.querySelector('.rc-head');
        var old = head.querySelector('.rc-mark');
        if (old) old.remove();
        if (mk) {
          var s = D.MARK_STATUS[mk.status];
          head.insertAdjacentHTML('beforeend',
            '<span class="rc-mark mk-' + s.tone + '">' + C.icon(s.icon, 12) + s.short + '</span>');
        }
        card.querySelectorAll('[data-mark]').forEach(function (x) { x.classList.remove('on'); });
        if (mk) {
          var on = card.querySelector('[data-mark="' + mk.status + '"]');
          if (on) on.classList.add('on');
        }
        renderSummary();
        C.toast(mk ? '已标记：' + D.MARK_STATUS[mk.status].label + '（再点一次可取消）' : '已取消该条标记');
      };
    });

    card.querySelectorAll('[data-copy]').forEach(function (b) {
      b.onclick = function () {
        var t = b.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t);
        else fallbackCopy(t);
        C.toast('检索词已复制');
      };
    });

    bindTranslate(card);
    return card;
  }

  function appendCard(i, animate) {
    var box = document.getElementById('cards');
    box.appendChild(cardEl(state.items[i], state.results[i].result, i, animate));
    applyFilter();
    if (state.filter !== 'all') {
      var card = box.lastChild;
      if (card.style.display === 'none') {
        state.hidden++;
        var tip = document.getElementById('hidden-tip');
        tip.className = 'filter-hidden-tip on';
        tip.innerHTML = '已新验出 <b>' + state.hidden + '</b> 条不在当前筛选中的结果 <button id="btn-show-all">查看全部</button>';
        document.getElementById('btn-show-all').onclick = function () { state.filter = 'all'; state.hidden = 0; persistUi(); applyFilter(); renderSummary(); };
      }
    }
  }

  /* ---------------- 核验中占位 ---------------- */
  function showRunning(i) {
    var box = document.getElementById('cards');
    var r = C.el('div', 'running');
    r.id = 'running-card';
    r.innerHTML =
      '<span class="r-txt"><span class="spin"></span>正在核验第 ' + (i + 1) + ' / ' + state.items.length + ' 条</span>' +
      '<div class="bars"><div class="sk"></div><div class="sk"></div></div>' +
      '<span class="r-stage">检索 Crossref / OpenAlex</span>';
    box.appendChild(r);
    r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function hideRunning() { var r = document.getElementById('running-card'); if (r) r.remove(); }

  /* ---------------- 单条重试 ---------------- */
  function retryOne(i, card) {
    var btn = card.querySelector('[data-retry]');
    btn.innerHTML = C.icon('loader', 13) + '核验中…';
    C.verifyItem(state.items[i], { results: D.RESULTS }).then(function (out) {
      state.results[i] = { item: state.items[i], result: out.result, ms: out.ms, error: !!out.error };
      var fresh = cardEl(state.items[i], out.result, i, false);
      card.replaceWith(fresh);
      var k = state.openPanels.indexOf(i);
      if (k > -1) { state.openPanels.splice(k, 1); persistUi(); }
      persistResults();
      renderSummary();
      applyFilter();
      C.toast(out.preset ? '已重新核验（命中预置题录）' : '已重新核验');
    }).catch(function () {
      btn.innerHTML = C.icon('refresh', 13) + '重试';
      C.toast('核验服务暂时不可用，请稍后再试', 'warn');
    });
  }

  /* ---------------- 核验主循环（I-1：跳过已恢复条目） ---------------- */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function run() {
    state.running = true;
    renderSummary();
    for (var i = 0; i < state.items.length; i++) {
      if (state.results[i]) continue;
      showRunning(i);
      var out;
      try {
        out = await C.verifyItem(state.items[i], { results: D.RESULTS });
      } catch (e) {
        /* 兜底：核验流程整体异常时也给出可操作的检索记录，不留空证据 */
        var it0 = state.items[i];
        out = {
          error: true,
          result: {
            verdict: 'manual', lang: it0.lang, cited: it0, db: null, matched: [], mismatch: [],
            uncertain: ['authors', 'title', 'venue', 'year', 'doi'],
            checked: '核验流程异常中断，本条未能完成自动核验。',
            evidence: '核验服务异常，未能完成本条自动核验，请重试或人工核对。',
            searches: [{ db: 'Crossref 题录检索', query: it0.title, hits: -1 }, { db: 'OpenAlex 题录检索', query: it0.title, hits: -1 }]
              .concat(it0.lang === 'zh' ? [
                { db: '知网检索', query: it0.title, hits: null, suggest: true },
                { db: '万方检索', query: it0.title, hits: null, suggest: true },
                { db: '百度学术检索', query: it0.title, hits: null, suggest: true }
              ] : []),
            url: null
          }
        };
      }
      hideRunning();
      state.results[i] = { item: state.items[i], result: out.result, ms: out.ms, error: !!out.error };
      appendCard(i, true);
      persistResults();
      renderSummary();
      await sleep(out.preset ? 90 : 240);
    }
    state.running = false;
    renderSummary();
    finishRun();
  }

  function finishRun() {
    var c = counts();
    C.toast('核验完成：通过 ' + c.pass + ' 条，问题 ' + c.issue + ' 条，待人工确认 ' + c.manual + ' 条');
    document.getElementById('list-title').innerHTML = C.icon('list', 13) + ' ' + listTitle();
  }

  /* ---------------- I-1 恢复提示 ---------------- */
  function showRecoverTip(remaining) {
    var tip = document.getElementById('recover-tip');
    tip.hidden = false;
    tip.innerHTML = C.icon('refresh', 15) +
      '<span>已恢复中断前的核验进度（<b>' + state.recovered + '</b> / ' + state.items.length + ' 条），继续核验剩余 <b>' + remaining + '</b> 条——已验结果与判定不会丢失。</span>' +
      '<button class="btn-quiet btn-sm" id="btn-recover-close">知道了</button>';
    document.getElementById('btn-recover-close').onclick = function () { tip.hidden = true; };
  }

  /* ---------------- 启动 ---------------- */
  if (!session || !session.items || !session.items.length) {
    renderEmpty();
  } else {
    state.items = session.items;
    state.doc = session.doc || null;
    state.fileName = session.fileName || null;
    state.source = session.source || 'paste';
    state.marks = loadMarks();

    document.getElementById('order-id').textContent = session.orderId ||
      ('CP-' + new Date(session.startedAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '') +
        '-' + String(Math.floor(Math.random() * 9000) + 1000));
    document.getElementById('list-title').innerHTML = C.icon('list', 13) + '核验进行中…';

    /* 恢复用户标记：筛选条件 + 展开的证据面板 */
    var ui = C.store.get('ui', null);
    if (ui && typeof ui.filter === 'string' && D.VERDICTS[ui.filter]) state.filter = ui.filter;
    if (ui && Array.isArray(ui.open)) {
      state.openPanels = ui.open.filter(function (i) { return typeof i === 'number' && i >= 0 && i < state.items.length; });
    }

    renderDocCompare();

    /* 恢复进度与判定：已验条目直接渲染，不重新核验 */
    state.recovered = loadPersisted();
    for (var i = 0; i < state.items.length; i++) {
      if (state.results[i]) appendCard(i, false);
    }
    renderSummary();

    if (state.recovered > 0 && state.recovered < state.items.length) {
      showRecoverTip(state.items.length - state.recovered);
    }
    if (state.recovered < state.items.length) {
      run();
    } else {
      state.running = false;
      renderSummary();
      finishRun();
    }
  }
})();
