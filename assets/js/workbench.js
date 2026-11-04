/* ============================================================
 * 明鉴引文 CiteProof — 核验工作台（首页）
 * ============================================================ */
(function () {
  'use strict';
  var C = window.CP_CORE, D = window.CP_DATA;

  /* ---------------- 静态内容装配 ---------------- */
  document.getElementById('btn-help').innerHTML = C.icon('info', 15) + '<span>使用说明</span>';
  document.getElementById('btn-help').onclick = openHelp;

  document.getElementById('hero-eyebrow').innerHTML =
    C.icon('scan', 14) + '引用真伪核验 · 为 AI 生成内容兜底';

  var points = [
    { i: 'list', t: '逐条判定，结论可追溯', s: '每条附字段对照或检索记录，证据可自行核对' },
    { i: 'shield', t: '五类判定，语义清晰', s: '通过 / 不存在 / 张冠李戴 / DOI 错指 / 待人工确认' },
    { i: 'database', t: '实时检索权威文献库', s: 'Crossref 与 OpenAlex 实时比对，20 条约一分钟' }
  ];
  document.getElementById('hero-points').innerHTML = points.map(function (p) {
    return '<li><span class="hp-ic">' + C.icon(p.i, 18) + '</span><span class="hp-t"><b>' + p.t + '</b><span>' + p.s + '</span></span></li>';
  }).join('');

  var seg = document.getElementById('seg');
  seg.querySelector('[data-tab="paste"]').innerHTML = C.icon('clipboard', 15) + '粘贴参考文献清单';
  seg.querySelector('[data-tab="upload"]').innerHTML = C.icon('upload', 15) + '上传 docx / txt 文档';

  document.getElementById('btn-sample').innerHTML = C.icon('sparkles', 15) + '一键填入示例清单（20 条）';
  document.getElementById('btn-start').innerHTML = '开始核验' + C.icon('arrow-right', 17);
  document.getElementById('drop-ic').innerHTML = C.icon('file-text', 22);
  document.getElementById('file-ic').innerHTML = C.icon('file-check', 19);
  document.getElementById('file-remove').innerHTML = C.icon('x', 15);
  document.getElementById('btn-sample-doc').innerHTML = C.icon('download', 14) + '下载示例文档（.txt）';
  document.getElementById('paste-err').innerHTML = C.icon('alert-circle', 16) + '<span></span>';

  /* 数据来源：如实区分「自动实时检索」与「人工核实入口」——
     核验引擎实际自动检索 Crossref / OpenAlex（+ DOI 解析走 DataCite）；
     知网 / 万方 / 百度学术无公开 API，仅作中文文献的人工核实跳转入口 */
  var srcs = [
    { name: 'Crossref', kind: 'auto', url: 'https://search.crossref.org/' },
    { name: 'OpenAlex', kind: 'auto', url: 'https://openalex.org/' },
    { name: '知网', kind: 'manual', url: 'https://search.cnki.com.cn/' },
    { name: '万方', kind: 'manual', url: 'https://s.wanfangdata.com.cn/' },
    { name: '百度学术', kind: 'manual', url: 'https://xueshu.baidu.com/' }
  ];
  document.getElementById('sources').innerHTML =
    '<span class="src-label">数据来源</span>' +
    srcs.map(function (s) {
      var tag = s.kind === 'auto' ? '<span class="src-kind k-auto">实时检索</span>' : '<span class="src-kind k-manual">人工核实</span>';
      return '<a class="src-item" href="' + s.url + '" target="_blank" rel="noopener noreferrer" title="打开' + C.esc(s.name) + '">' + C.icon('database', 13) + C.esc(s.name) + tag + '</a>';
    }).join('');

  document.getElementById('scope-note').innerHTML =
    C.icon('info', 15) + '<span>明鉴引文只核验<b>参考文献题录的真实性</b>（作者、标题、来源、年份、DOI 是否对得上），不做查重、不做 AIGC 检测、不代写论文、不自动修改论文正文。核验结论以数据库登记记录为准，最终引用请以原文为准。</span>';

  /* ---------------- 弹层：使用说明 ---------------- */
  function openHelp() {
    var legend = Object.keys(D.VERDICTS).map(function (k) {
      var v = D.VERDICTS[k];
      return '<div class="legend-row"><span class="badge b-' + v.tone + '">' + C.icon(v.icon, 13) + v.label + '</span><p>' + v.desc + '</p></div>';
    }).join('');
    C.openModal(
      '<div class="md-title">' + C.icon('info', 22) + '使用说明</div>' +
      '<p class="md-sub">明鉴引文帮你在几分钟内把整份 AI 生成的参考文献清单逐条验完真伪。打开即用，无需登录，证据全部公开可查。</p>' +
      '<div class="md-sec"><h4>三步完成核验</h4><div class="md-steps">' +
      '<div class="md-step"><span class="md-num">1</span><div><b>粘贴或上传清单</b><p>直接粘贴 AI 生成的参考文献（每行一条，中英文混排均可），或上传 docx / txt 文档——上传后会自动提取文末参考文献部分，并比对你正文里的引用标记。</p></div></div>' +
      '<div class="md-step"><span class="md-num">2</span><div><b>逐条核验，即时出结果</b><p>点「开始核验」后逐条进行，每条验完立即出现在列表里并更新进度，不用等整单跑完。汇总栏实时给出通过数与问题数。</p></div></div>' +
      '<div class="md-step"><span class="md-num">3</span><div><b>点开证据，自行核对</b><p>每条结果都可以展开证据面板：通过项看字段对照卡，不存在项看检索证据卡，最后一键打开数据库原始页面复核。</p></div></div>' +
      '</div></div>' +
      '<div class="md-sec"><h4>五类判定</h4><div class="legend">' + legend + '</div></div>' +
      '<div class="md-sec"><h4>判定规则</h4><div class="rules">' + D.RULES_HTML + '</div></div>' +
      '<div class="md-sec"><h4>打开即用</h4>' +
      '<p class="md-sub" style="margin-top:0">无需登录、不限条数。参考文献清单只在你自己的浏览器里处理和保存，不上传到任何服务器；核验进度自动存在本机，刷新页面会从中断处继续，不会丢已验结果。</p></div>' +
      '<div class="md-note">' + C.icon('alert-circle', 14) + ' 明鉴引文只做引用核验：不做查重、不做 AIGC 检测、不代写论文、不自动修改论文正文。</div>'
    );
  }

  /* ---------------- 标签切换 ---------------- */
  var segInd = document.getElementById('seg-ind');
  var segBtns = seg.querySelectorAll('button');
  function moveInd(btn) {
    segInd.style.width = btn.offsetWidth + 'px';
    segInd.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
  }
  var currentTab = 'paste';
  segBtns.forEach(function (b) {
    b.onclick = function () {
      if (b.classList.contains('on')) return;
      segBtns.forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      moveInd(b);
      currentTab = b.dataset.tab;
      document.querySelectorAll('.tabpane').forEach(function (p) { p.classList.remove('on'); });
      document.getElementById('pane-' + currentTab).classList.add('on');
      hideErr(currentTab === 'paste' ? 'paste-err' : 'upload-err');
      updateCount();
    };
  });
  setTimeout(function () { moveInd(seg.querySelector('.on')); }, 60);
  window.addEventListener('resize', function () { moveInd(seg.querySelector('.on')); });

  /* ---------------- 粘贴清单 ---------------- */
  var ta = document.getElementById('ref-input');
  var taCount = document.getElementById('ta-count');

  function parseLines() {
    return ta.value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 3; });
  }
  function updateCount() {
    var n = parseLines().length;
    taCount.textContent = '已识别 ' + n + ' 条';
    taCount.classList.toggle('ok', n > 0);
  }
  ta.addEventListener('input', function () { updateCount(); hideErr('paste-err'); });

  document.getElementById('btn-sample').onclick = function () {
    ta.value = D.SAMPLE.join('\n');
    updateCount();
    C.toast('已填入示例清单：20 条（含 3 条预埋问题）');
    ta.focus();
    ta.setSelectionRange(0, 0);
    ta.scrollTop = 0;
  };

  function showErr(id, msg) {
    var e = document.getElementById(id);
    e.querySelector('span').textContent = msg;
    e.classList.add('on');
    e.style.animation = 'none'; void e.offsetWidth; e.style.animation = '';
  }
  function hideErr(id) { document.getElementById(id).classList.remove('on'); }

  /* ---------------- 上传文档 ---------------- */
  var fileInput = document.getElementById('file-input');
  var drop = document.getElementById('drop');
  var fileCard = document.getElementById('file-card');
  var parsed = null; // { entries, body, fileName, size }

  drop.onclick = function () { fileInput.click(); };
  drop.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } };
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
  fileInput.onchange = function () { if (fileInput.files[0]) handleFile(fileInput.files[0]); };

  document.getElementById('file-remove').onclick = function () {
    parsed = null; fileCard.classList.remove('on'); fileInput.value = '';
    hideErr('upload-err');
  };

  /* 最小 ZIP 读取（用于 docx 内的 word/document.xml） */
  function readZipEntry(buf, entryName) {
    var u8 = new Uint8Array(buf), dv = new DataView(buf);
    var eocd = -1;
    for (var i = u8.length - 22; i >= 0; i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error('不是有效的 docx 文件');
    var cdCount = dv.getUint16(eocd + 10, true), cdOff = dv.getUint32(eocd + 16, true);
    var p = cdOff;
    for (var n = 0; n < cdCount; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      var nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), cmtLen = dv.getUint16(p + 32, true);
      var method = dv.getUint16(p + 10, true), compSize = dv.getUint32(p + 20, true), lho = dv.getUint32(p + 42, true);
      var name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nameLen));
      if (name === entryName) {
        var lnl = dv.getUint16(lho + 26, true), lel = dv.getUint16(lho + 28, true);
        var start = lho + 30 + lnl + lel;
        var raw = u8.subarray(start, start + compSize);
        if (method === 0) return Promise.resolve(raw);
        if (method === 8) {
          return new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw')))
            .arrayBuffer().then(function (b) { return new Uint8Array(b); });
        }
        throw new Error('不支持的压缩方式');
      }
      p += 46 + nameLen + extraLen + cmtLen;
    }
    throw new Error('docx 内未找到文档内容');
  }

  /* XML → 纯文本（保留段落换行） */
  function docxXmlToText(xml) {
    return xml
      .replace(/<w:tab\b[^>]*\/>/g, '\t')
      .replace(/<w:br\b[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n');
  }

  function handleFile(file) {
    hideErr('upload-err');
    var isDocx = /\.docx$/i.test(file.name), isTxt = /\.txt$/i.test(file.name);
    if (!isDocx && !isTxt) { showErr('upload-err', '只支持 .docx 与 .txt 文件，请重新选择。'); return; }
    if (file.size > 5 * 1024 * 1024) { showErr('upload-err', '文件超过 5 MB，请压缩或拆分后重试。'); return; }

    var reader = new FileReader();
    reader.onerror = function () { showErr('upload-err', '文件读取失败，请重试或换用粘贴方式。'); };
    reader.onload = function () {
      if (/\.docx$/i.test(file.name)) {
        readZipEntry(reader.result, 'word/document.xml')
          .then(function (bytes) { finishDoc(file, docxXmlToText(new TextDecoder().decode(bytes))); })
          .catch(function () { showErr('upload-err', '无法解析该 docx 文件（可能已损坏或非标准格式），请另存为 .txt 后重试。'); });
      } else {
        try { finishDoc(file, new TextDecoder().decode(new Uint8Array(reader.result))); }
        catch (e) { showErr('upload-err', '文件解码失败，请确认是 UTF-8 编码的纯文本，或改用粘贴方式。'); }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function finishDoc(file, text) {
    if (!text || !text.trim()) { showErr('upload-err', '未能从文档中提取到文字内容，请检查文件或改用粘贴方式。'); return; }
    var sp = C.splitRefSection(text);
    var entries = C.parseRefEntries(sp.refs);
    var inline = C.extractInlineCitations(sp.body);
    if (!entries.length) { showErr('upload-err', '未在文档中找到「参考文献」区块。请确认文末包含「参考文献」或「References」标题，或改用粘贴方式。'); return; }

    parsed = { entries: entries, body: sp.body, inline: inline, fileName: file.name, size: file.size };
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-meta').textContent =
      '提取到 ' + entries.length + ' 条参考文献 · 正文引用标记 ' + inline.length + ' 处 · ' + (file.size / 1024).toFixed(0) + ' KB';
    fileCard.classList.add('on');
    C.toast('已提取 ' + entries.length + ' 条参考文献');
  }

  document.getElementById('btn-sample-doc').onclick = function () {
    var blob = new Blob([D.buildSampleDoc()], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CiteProof-示例文档-课程论文节选.txt';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    C.toast('示例文档已开始下载');
  };

  /* ---------------- 开始核验 ---------------- */
  document.getElementById('btn-start').onclick = startVerify;

  function collectItems() {
    if (currentTab === 'paste') {
      var lines = parseLines();
      if (!lines.length) { showErr('paste-err', '清单还是空的——请粘贴参考文献（每行一条），或点「一键填入示例清单」先体验完整流程。'); ta.focus(); return null; }
      return lines.map(function (raw) {
        return {
          raw: raw,
          doi: C.extractDoi(raw),
          title: C.extractTitle(raw),
          authors: C.extractAuthors(raw),
          year: C.extractYear(raw),
          lang: /[\u4e00-\u9fa5]/.test(raw) ? 'zh' : 'en'
        };
      });
    }
    if (!parsed) { showErr('upload-err', '还没有选择文档——请上传 .docx 或 .txt 文件，系统会自动提取文末参考文献部分。'); return null; }
    return parsed.entries.map(function (raw) {
      return {
        raw: raw,
        doi: C.extractDoi(raw),
        title: C.extractTitle(raw),
        authors: C.extractAuthors(raw),
        year: C.extractYear(raw),
        lang: /[\u4e00-\u9fa5]/.test(raw) ? 'zh' : 'en'
      };
    });
  }

  function startVerify() {
    var items = collectItems();
    if (!items) return;

    /* 打开即用：无登录、无试用限制，直接进入结果页 */
    var session = {
      items: items,
      source: currentTab,
      fileName: parsed ? parsed.fileName : null,
      doc: parsed ? {
        inline: parsed.inline,
        listedCount: parsed.entries.length
      } : null,
      orderId: 'CP-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9000) + 1000),
      startedAt: Date.now()
    };
    C.store.set('session', session);
    C.store.del('results');
    C.store.del('ui');
    location.href = 'results.html' + C.shareQuery();
  }

  updateCount();
})();
