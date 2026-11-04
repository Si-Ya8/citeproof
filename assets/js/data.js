/* ============================================================
 * 明鉴引文 CiteProof — 预置题录与核验结果数据
 * 20 条中英文混合示例清单：17 条真实可查文献 + 3 条预埋问题
 *   E18 不存在（虚构文献，多库零命中）
 *   E19 张冠李戴（标题与 DOI 正确，作者错配到另一篇代表作）
 *   E20 DOI 错指（DOI 解析到另一篇 Nature 论文）
 * ============================================================ */
window.CP_DATA = (function () {
  'use strict';

  /* 五类判定的元数据：文字标签 + 色标 + 图标，三者同时出现 */
  var VERDICTS = {
    pass:   { key: 'pass',   label: '通过',       tone: 'pass',   icon: 'check-circle',
              desc: '题录字段与数据库登记记录一致，引用可直接使用' },
    missing:{ key: 'missing',label: '不存在',     tone: 'missing',icon: 'x-circle',
              desc: '多个文献库检索均无匹配记录，疑为虚构文献' },
    wrong:  { key: 'wrong',  label: '张冠李戴',   tone: 'wrong',  icon: 'alert-triangle',
              desc: '文献真实存在，但作者 / 来源 / 年份等字段错配' },
    doi:    { key: 'doi',    label: 'DOI 错指',   tone: 'doi',    icon: 'link',
              desc: 'DOI 可解析，但指向另一篇文献' },
    manual: { key: 'manual', label: '待人工确认', tone: 'manual', icon: 'user-round',
              desc: '自动核验无法闭合，需人工比对原文' }
  };

  var FIELD_LABELS = {
    authors: '作者', title: '标题', venue: '期刊 / 来源', year: '年份', doi: 'DOI', lang: '语种'
  };

  /* ---------------------------------------------------------
   * 判定规则说明（E-6）：帮助弹层与结果页共用，避免两处文案漂移
   * --------------------------------------------------------- */
  var RULES_HTML =
    '<div class="rule-row"><b>通过</b><p>标题、作者、来源、年份、DOI 与数据库登记记录一致：标题高度相似，引用作者中多数能在数据库作者列表中找到，年份相同，DOI 相同。</p></div>' +
    '<div class="rule-row"><b>不存在</b><p>Crossref、OpenAlex 等多个文献库检索均无匹配记录，且 DOI 无法解析——多个库一致无果才下此判定。</p></div>' +
    '<div class="rule-row"><b>张冠李戴</b><p>标题与数据库记录一致，但作者或年份字段对不上——文献真实存在，引用字段写错了。</p></div>' +
    '<div class="rule-row"><b>DOI 错指</b><p>DOI 可以解析，但指向另一篇文献——DOI 与本条题录不符。</p></div>' +
    '<div class="rule-row"><b>待人工确认</b><p>检索服务暂时不可用、或字段无法自动闭合时，转为人工确认，绝不难为用户猜一个结论。</p></div>' +
    '<div class="rule-row"><b>宁漏报原则</b><p>网络异常或服务不可用时，系统不会把「查不到」误判为「不存在」，只会标为待人工确认并支持重试——核验工具自己不能制造假结论。</p></div>' +
    '<div class="rule-row"><b>预印本豁免</b><p>arXiv 等预印本与正式发表版的年份、来源差异属正常现象，不算错误；正式版上线后以正式发表记录为准。</p></div>';

  /* ---------------------------------------------------------
   * 查库清单（E-5）：数据库名 → 库内检索链接模板
   * query 为 DOI 时跳 doi.org；本地快照无外链
   * --------------------------------------------------------- */
  var DB_SEARCH_LINKS = {
    'Crossref': 'https://search.crossref.org/?q={q}',
    'Crossref 题录检索': 'https://search.crossref.org/?q={q}',
    'Crossref DOI 解析': 'https://doi.org/{q}',
    'OpenAlex': 'https://openalex.org/works?search={q}',
    'OpenAlex 题录检索': 'https://openalex.org/works?search={q}',
    'DataCite': 'https://doi.org/{q}',
    'DataCite DOI 解析': 'https://doi.org/{q}',
    'Semantic Scholar': 'https://www.semanticscholar.org/search?q={q}',
    'CNKI 题录快照': null,
    '本地题录快照': null
  };
  function dbSearchUrl(db, query) {
    if (DB_SEARCH_LINKS.hasOwnProperty(db)) return DB_SEARCH_LINKS[db] ? DB_SEARCH_LINKS[db].replace('{q}', encodeURIComponent(query)) : null;
    if (/^10\.\d{4,9}\//.test(query)) return 'https://doi.org/' + encodeURIComponent(query);
    return null;
  }
  function isLocalDb(db) { return /本地|快照/.test(db); }

  /* ---------------------------------------------------------
   * 示例清单：20 条原始引用文本（顺序即演示顺序）
   * --------------------------------------------------------- */
  var SAMPLE = [
    'Vaswani A, Shazeer N, Parmar N, et al. Attention is all you need[C]//Advances in Neural Information Processing Systems 30. Long Beach: NeurIPS, 2017: 5998-6008. DOI: 10.48550/arXiv.1706.03762.',
    'Devlin J, Chang M W, Lee K, et al. BERT: pre-training of deep bidirectional transformers for language understanding[C]//Proceedings of NAACL-HLT. Minneapolis, 2019: 4171-4186. DOI: 10.18653/v1/N19-1423.',
    'He K, Zhang X, Ren S, et al. Deep residual learning for image recognition[C]//Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition. Las Vegas, 2016: 770-778. DOI: 10.1109/CVPR.2016.90.',
    'LeCun Y, Bengio Y, Hinton G. Deep learning[J]. Nature, 2015, 521(7553): 436-444. DOI: 10.1038/nature14539.',
    'Kingma D P, Ba J. Adam: a method for stochastic optimization[C]//International Conference on Learning Representations. San Diego, 2015. DOI: 10.48550/arXiv.1412.6980.',
    'Goodfellow I, Pouget-Abadie J, Mirza M, et al. Generative adversarial nets[C]//Advances in Neural Information Processing Systems 27. Montreal, 2014: 2672-2680. DOI: 10.48550/arXiv.1406.2661.',
    'Mnih V, Kavukcuoglu K, Silver D, et al. Human-level control through deep reinforcement learning[J]. Nature, 2015, 518(7540): 529-533. DOI: 10.1038/nature14236.',
    'Sutskever I, Vinyals O, Le Q V. Sequence to sequence learning with neural networks[C]//Advances in Neural Information Processing Systems 27. Montreal, 2014: 3104-3112. DOI: 10.48550/arXiv.1409.3215.',
    'Hochreiter S, Schmidhuber J. Long short-term memory[J]. Neural Computation, 1997, 9(8): 1735-1780. DOI: 10.1162/neco.1997.9.8.1735.',
    'Chen T, Guestrin C. XGBoost: a scalable tree boosting system[C]//Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining. San Francisco, 2016: 785-794. DOI: 10.1145/2939672.2939785.',
    'Pennington J, Socher R, Manning C D. GloVe: global vectors for word representation[C]//Proceedings of the 2014 Conference on Empirical Methods in Natural Language Processing. Doha, 2014: 1532-1543. DOI: 10.3115/v1/D14-1162.',
    'Xie S, Girshick R, Dollar P, et al. Aggregated residual transformations for deep neural networks[C]//Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition. Honolulu, 2017: 5987-5995. DOI: 10.1109/CVPR.2017.634.',
    'Brown T B, Mann B, Ryder N, et al. Language models are few-shot learners[C]//Advances in Neural Information Processing Systems 33. Virtual, 2020: 1877-1901. DOI: 10.48550/arXiv.2005.14165.',
    'Ioffe S, Szegedy C. Batch normalization: accelerating deep network training by reducing internal covariate shift[C]//Proceedings of the 32nd International Conference on Machine Learning. Lille, 2015: 448-456. DOI: 10.48550/arXiv.1502.03167.',
    '周志华. 机器学习[M]. 北京: 清华大学出版社, 2016.',
    '李航. 统计学习方法[M]. 北京: 清华大学出版社, 2012.',
    '孙志军, 薛磊, 许阳明, 等. 深度学习研究综述[J]. 计算机应用研究, 2012, 29(8): 2806-2810.',
    'Zhang Y, Liu H, Wang X, et al. A comprehensive survey of cross-modal affective computing: datasets, methods and open challenges[J]. IEEE Transactions on Affective Computing, 2023, 14(3): 412-431. DOI: 10.1109/TAFFC.2023.3291547.',
    'Devlin J, Chang M W, Lee K, et al. Attention is all you need[C]//Advances in Neural Information Processing Systems 30. Long Beach: NeurIPS, 2017: 5998-6008. DOI: 10.48550/arXiv.1706.03762.',
    'Silver D, Huang A, Maddison C J, et al. Mastering the game of Go with deep neural networks and tree search[J]. Nature, 2016, 529(7587): 484-489. DOI: 10.1038/nature14236.'
  ];

  /* ---------------------------------------------------------
   * 每条引用的预置核验结果（判定 / 证据一句话 / 字段对照 / 检索记录）
   * cited = 引用文本中的字段；db = 权威数据库登记字段
   * --------------------------------------------------------- */
  var RESULTS = [
    {
      id: 'E01', verdict: 'pass', lang: 'en',
      cited: { authors: 'Vaswani A., Shazeer N., Parmar N., Uszkoreit J., Jones L., Gomez A. N., 等', title: 'Attention is all you need', venue: 'Advances in Neural Information Processing Systems 30 (NeurIPS)', year: '2017', doi: '10.48550/arXiv.1706.03762' },
      db: { source: 'Crossref', authors: 'Vaswani A., Shazeer N., Parmar N., Uszkoreit J., Jones L., Gomez A. N., Kaiser Ł., Polosukhin I.', title: 'Attention is all you need', venue: 'Advances in Neural Information Processing Systems 30 (NeurIPS)', year: '2017', doi: '10.48550/arXiv.1706.03762' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: '与 Crossref 登记记录完全一致：作者、标题、来源、年份、DOI 五项全部匹配。',
      searches: [{ db: 'Crossref', query: 'Attention is all you need · Vaswani', hits: 1 }, { db: 'OpenAlex', query: 'Attention is all you need', hits: 1 }],
      url: 'https://doi.org/10.48550/arXiv.1706.03762'
    },
    {
      id: 'E02', verdict: 'pass', lang: 'en',
      cited: { authors: 'Devlin J., Chang M.-W., Lee K., Toutanova K.', title: 'BERT: pre-training of deep bidirectional transformers for language understanding', venue: 'Proceedings of NAACL-HLT', year: '2019', doi: '10.18653/v1/N19-1423' },
      db: { source: 'Crossref', authors: 'Devlin J., Chang M.-W., Lee K., Toutanova K.', title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', venue: 'Proceedings of NAACL-HLT 2019', year: '2019', doi: '10.18653/v1/N19-1423' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: '标题、作者、会议来源、年份与 DOI 均与 Crossref 记录吻合，页码区间在 ACL Anthology 可查。',
      searches: [{ db: 'Crossref', query: 'BERT pre-training deep bidirectional transformers', hits: 1 }, { db: 'OpenAlex', query: 'BERT pre-training of deep bidirectional transformers', hits: 1 }],
      url: 'https://doi.org/10.18653/v1/N19-1423'
    },
    {
      id: 'E03', verdict: 'pass', lang: 'en',
      cited: { authors: 'He K., Zhang X., Ren S., Sun J.', title: 'Deep residual learning for image recognition', venue: 'Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition', year: '2016', doi: '10.1109/CVPR.2016.90' },
      db: { source: 'Crossref', authors: 'He K., Zhang X., Ren S., Sun J.', title: 'Deep Residual Learning for Image Recognition', venue: '2016 IEEE Conference on Computer Vision and Pattern Recognition (CVPR)', year: '2016', doi: '10.1109/CVPR.2016.90' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: '五项字段全部匹配，DOI 10.1109/CVPR.2016.90 解析结果与本条题录一致。',
      searches: [{ db: 'Crossref', query: 'Deep residual learning for image recognition', hits: 1 }, { db: 'OpenAlex', query: 'Deep residual learning for image recognition', hits: 1 }],
      url: 'https://doi.org/10.1109/CVPR.2016.90'
    },
    {
      id: 'E04', verdict: 'pass', lang: 'en',
      cited: { authors: 'LeCun Y., Bengio Y., Hinton G.', title: 'Deep learning', venue: 'Nature, 521(7553)', year: '2015', doi: '10.1038/nature14539' },
      db: { source: 'Crossref', authors: 'LeCun Y., Bengio Y., Hinton G.', title: 'Deep learning', venue: 'Nature 521(7553)', year: '2015', doi: '10.1038/nature14539' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: '与 Nature 官网记录一致：卷期页码 436-444 与登记信息吻合，属高被引综述。',
      searches: [{ db: 'Crossref', query: 'Deep learning · LeCun · Bengio · Hinton', hits: 1 }, { db: 'OpenAlex', query: 'Deep learning LeCun Bengio Hinton', hits: 1 }],
      url: 'https://doi.org/10.1038/nature14539'
    },
    {
      id: 'E05', verdict: 'pass', lang: 'en',
      cited: { authors: 'Kingma D. P., Ba J.', title: 'Adam: a method for stochastic optimization', venue: 'International Conference on Learning Representations (ICLR)', year: '2015', doi: '10.48550/arXiv.1412.6980' },
      db: { source: 'Crossref', authors: 'Kingma D. P., Ba J.', title: 'Adam: A Method for Stochastic Optimization', venue: 'International Conference on Learning Representations (ICLR) 2015', year: '2015', doi: '10.48550/arXiv.1412.6980' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: '作者、标题、会议与年份均匹配；arXiv DOI 可正常解析至预印本记录。',
      searches: [{ db: 'Crossref', query: 'Adam a method for stochastic optimization', hits: 1 }, { db: 'OpenAlex', query: 'Adam method for stochastic optimization Kingma', hits: 1 }],
      url: 'https://doi.org/10.48550/arXiv.1412.6980'
    },
    {
      id: 'E06', verdict: 'pass', lang: 'en',
      cited: { authors: 'Goodfellow I., Pouget-Abadie J., Mirza M., 等', title: 'Generative adversarial nets', venue: 'Advances in Neural Information Processing Systems 27 (NeurIPS)', year: '2014', doi: '10.48550/arXiv.1406.2661' },
      db: { source: 'Crossref', authors: 'Goodfellow I. J., Pouget-Abadie J., Mirza M., Xu B., Warde-Farley D., Ozair S., 等', title: 'Generative Adversarial Nets', venue: 'Advances in Neural Information Processing Systems 27 (NeurIPS)', year: '2014', doi: '10.48550/arXiv.1406.2661' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: '题录与 NeurIPS 论文集合登记记录一致，作者列表以「等」省略部分属正常简写。',
      searches: [{ db: 'Crossref', query: 'Generative adversarial nets Goodfellow', hits: 1 }, { db: 'OpenAlex', query: 'Generative adversarial nets', hits: 1 }],
      url: 'https://doi.org/10.48550/arXiv.1406.2661'
    },
    {
      id: 'E07', verdict: 'pass', lang: 'en',
      cited: { authors: 'Mnih V., Kavukcuoglu K., Silver D., 等', title: 'Human-level control through deep reinforcement learning', venue: 'Nature, 518(7540)', year: '2015', doi: '10.1038/nature14236' },
      db: { source: 'Crossref', authors: 'Mnih V., Kavukcuoglu K., Silver D., Rusu A. A., Veness J., Bellemare M. G., 等', title: 'Human-level control through deep reinforcement learning', venue: 'Nature 518(7540)', year: '2015', doi: '10.1038/nature14236' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: '卷期页（529-533）与 Nature 登记信息一致，DOI 解析标题与本条完全相同。',
      searches: [{ db: 'Crossref', query: 'Human-level control through deep reinforcement learning', hits: 1 }, { db: 'OpenAlex', query: 'Human-level control through deep reinforcement learning', hits: 1 }],
      url: 'https://doi.org/10.1038/nature14236'
    },
    {
      id: 'E08', verdict: 'pass', lang: 'en',
      cited: { authors: 'Sutskever I., Vinyals O., Le Q. V.', title: 'Sequence to sequence learning with neural networks', venue: 'Advances in Neural Information Processing Systems 27 (NeurIPS)', year: '2014', doi: '10.48550/arXiv.1409.3215' },
      db: { source: 'Crossref', authors: 'Sutskever I., Vinyals O., Le Q. V.', title: 'Sequence to Sequence Learning with Neural Networks', venue: 'Advances in Neural Information Processing Systems 27 (NeurIPS)', year: '2014', doi: '10.48550/arXiv.1409.3215' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: '三位作者与标题、会议、年份完全匹配，DOI 指向的 arXiv 预印本即该会议论文。',
      searches: [{ db: 'Crossref', query: 'Sequence to sequence learning with neural networks', hits: 1 }, { db: 'OpenAlex', query: 'Sequence to sequence learning neural networks Sutskever', hits: 1 }],
      url: 'https://doi.org/10.48550/arXiv.1409.3215'
    },
    {
      id: 'E09', verdict: 'pass', lang: 'en',
      cited: { authors: 'Hochreiter S., Schmidhuber J.', title: 'Long short-term memory', venue: 'Neural Computation, 9(8)', year: '1997', doi: '10.1162/neco.1997.9.8.1735' },
      db: { source: 'Crossref', authors: 'Hochreiter S., Schmidhuber J.', title: 'Long Short-Term Memory', venue: 'Neural Computation 9(8)', year: '1997', doi: '10.1162/neco.1997.9.8.1735' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: 'MIT Press 登记记录一致，页码 1735-1780 与题录吻合，属 LSTM 原始文献。',
      searches: [{ db: 'Crossref', query: 'Long short-term memory Hochreiter Schmidhuber', hits: 1 }, { db: 'OpenAlex', query: 'Long short-term memory', hits: 1 }],
      url: 'https://doi.org/10.1162/neco.1997.9.8.1735'
    },
    {
      id: 'E10', verdict: 'pass', lang: 'en',
      cited: { authors: 'Chen T., Guestrin C.', title: 'XGBoost: a scalable tree boosting system', venue: 'Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining', year: '2016', doi: '10.1145/2939672.2939785' },
      db: { source: 'Crossref', authors: 'Chen T., Guestrin C.', title: 'XGBoost: A Scalable Tree Boosting System', venue: 'Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining', year: '2016', doi: '10.1145/2939672.2939785' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: 'KDD 2016 会议记录匹配，作者与标题一致，该文获 KDD 2016 最佳论文。',
      searches: [{ db: 'Crossref', query: 'XGBoost scalable tree boosting system', hits: 1 }, { db: 'OpenAlex', query: 'XGBoost scalable tree boosting system', hits: 1 }],
      url: 'https://doi.org/10.1145/2939672.2939785'
    },
    {
      id: 'E11', verdict: 'pass', lang: 'en',
      cited: { authors: 'Pennington J., Socher R., Manning C. D.', title: 'GloVe: global vectors for word representation', venue: 'Proceedings of the 2014 Conference on Empirical Methods in Natural Language Processing (EMNLP)', year: '2014', doi: '10.3115/v1/D14-1162' },
      db: { source: 'Crossref', authors: 'Pennington J., Socher R., Manning C. D.', title: "GloVe: Global Vectors for Word Representation", venue: 'Proceedings of the 2014 Conference on Empirical Methods in Natural Language Processing (EMNLP)', year: '2014', doi: '10.3115/v1/D14-1162' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: 'ACL Anthology 记录匹配，DOI 前缀 10.3115 解析正常，页码 1532-1543 可查。',
      searches: [{ db: 'Crossref', query: 'GloVe global vectors for word representation', hits: 1 }, { db: 'OpenAlex', query: 'GloVe global vectors word representation', hits: 1 }],
      url: 'https://doi.org/10.3115/v1/D14-1162'
    },
    {
      id: 'E12', verdict: 'pass', lang: 'en',
      cited: { authors: 'Xie S., Girshick R., Dollar P., 等', title: 'Aggregated residual transformations for deep neural networks', venue: 'Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition', year: '2017', doi: '10.1109/CVPR.2017.634' },
      db: { source: 'Crossref', authors: 'Xie S., Girshick R., Dollár P., Tu Z., He K.', title: 'Aggregated Residual Transformations for Deep Neural Networks', venue: '2017 IEEE Conference on Computer Vision and Pattern Recognition (CVPR)', year: '2017', doi: '10.1109/CVPR.2017.634' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: 'ResNeXt 原始文献，题录与 CVPR 2017 登记记录一致（ Dollars 带变音符，属同一作者）。',
      searches: [{ db: 'Crossref', query: 'Aggregated residual transformations for deep neural networks', hits: 1 }, { db: 'OpenAlex', query: 'Aggregated residual transformations deep neural networks', hits: 1 }],
      url: 'https://doi.org/10.1109/CVPR.2017.634'
    },
    {
      id: 'E13', verdict: 'pass', lang: 'en',
      cited: { authors: 'Brown T. B., Mann B., Ryder N., 等', title: 'Language models are few-shot learners', venue: 'Advances in Neural Information Processing Systems 33 (NeurIPS)', year: '2020', doi: '10.48550/arXiv.2005.14165' },
      db: { source: 'Crossref', authors: 'Brown T. B., Mann B., Ryder N., Subbiah M., Kaplan J., Dhariwal P., 等', title: 'Language Models are Few-Shot Learners', venue: 'Advances in Neural Information Processing Systems 33 (NeurIPS)', year: '2020', doi: '10.48550/arXiv.2005.14165' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: 'GPT-3 论文，作者、标题、会议与年份均匹配，页码 1877-1901 与论文集一致。',
      searches: [{ db: 'Crossref', query: 'Language models are few-shot learners', hits: 1 }, { db: 'OpenAlex', query: 'Language models are few-shot learners', hits: 1 }],
      url: 'https://doi.org/10.48550/arXiv.2005.14165'
    },
    {
      id: 'E14', verdict: 'pass', lang: 'en',
      cited: { authors: 'Ioffe S., Szegedy C.', title: 'Batch normalization: accelerating deep network training by reducing internal covariate shift', venue: 'Proceedings of the 32nd International Conference on Machine Learning (ICML)', year: '2015', doi: '10.48550/arXiv.1502.03167' },
      db: { source: 'Crossref', authors: 'Ioffe S., Szegedy C.', title: 'Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift', venue: 'Proceedings of the 32nd International Conference on Machine Learning (ICML)', year: '2015', doi: '10.48550/arXiv.1502.03167' },
      matched: ['authors', 'title', 'venue', 'year', 'doi'],
      evidence: 'ICML 2015 论文，题录与 PMLR 第 37 卷登记记录一致，DOI 可解析。',
      searches: [{ db: 'Crossref', query: 'Batch normalization accelerating deep network training', hits: 1 }, { db: 'OpenAlex', query: 'Batch normalization internal covariate shift', hits: 1 }],
      url: 'https://doi.org/10.48550/arXiv.1502.03167'
    },
    {
      id: 'E15', verdict: 'pass', lang: 'zh',
      cited: { authors: '周志华', title: '机器学习', venue: '专著（清华大学出版社）', year: '2016', doi: '—' },
      db: { source: '本地题录快照 · 出版社书目', authors: '周志华', title: '机器学习', venue: '北京: 清华大学出版社', year: '2016', doi: '—' },
      matched: ['authors', 'title', 'venue', 'year'],
      evidence: '与出版社书目快照一致：作者、书名、出版社、版次年份四项匹配（专著无 DOI，以书目元数据比对）。',
      searches: [{ db: '本地题录快照', query: '机器学习 · 周志华 · 2016', hits: 1 }, { db: 'OpenAlex', query: '机器学习 周志华', hits: 0 }],
      url: 'https://kns.cnki.net/kns8/defaultresult/index?kw=' + encodeURIComponent('机器学习 周志华')
    },
    {
      id: 'E16', verdict: 'pass', lang: 'zh',
      cited: { authors: '李航', title: '统计学习方法', venue: '专著（清华大学出版社）', year: '2012', doi: '—' },
      db: { source: '本地题录快照 · 出版社书目', authors: '李航', title: '统计学习方法', venue: '北京: 清华大学出版社', year: '2012', doi: '—' },
      matched: ['authors', 'title', 'venue', 'year'],
      evidence: '书目快照比对一致：作者、书名、出版社、年份四项匹配（专著无 DOI）。',
      searches: [{ db: '本地题录快照', query: '统计学习方法 · 李航 · 2012', hits: 1 }, { db: 'OpenAlex', query: '统计学习方法 李航', hits: 0 }],
      url: 'https://kns.cnki.net/kns8/defaultresult/index?kw=' + encodeURIComponent('统计学习方法 李航')
    },
    {
      id: 'E17', verdict: 'pass', lang: 'zh',
      cited: { authors: '孙志军, 薛磊, 许阳明, 等', title: '深度学习研究综述', venue: '计算机应用研究, 29(8)', year: '2012', doi: '—' },
      db: { source: '本地题录快照 · CNKI 题录', authors: '孙志军, 薛磊, 许阳明, 王正', title: '深度学习研究综述', venue: '计算机应用研究 29(8)', year: '2012', doi: '—' },
      matched: ['authors', 'title', 'venue', 'year'],
      evidence: 'CNKI 题录快照一致：作者、篇名、期刊卷期、年份四项匹配，页码 2806-2810 吻合。',
      searches: [{ db: '本地题录快照', query: '深度学习研究综述 · 孙志军', hits: 1 }, { db: 'OpenAlex', query: '深度学习研究综述', hits: 0 }],
      url: 'https://kns.cnki.net/kns8/defaultresult/index?kw=' + encodeURIComponent('深度学习研究综述 孙志军')
    },
    {
      id: 'E18', verdict: 'missing', lang: 'en',
      cited: { authors: 'Zhang Y., Liu H., Wang X., 等', title: 'A comprehensive survey of cross-modal affective computing: datasets, methods and open challenges', venue: 'IEEE Transactions on Affective Computing, 14(3)', year: '2023', doi: '10.1109/TAFFC.2023.3291547' },
      db: null,
      matched: [],
      evidence: 'Crossref、OpenAlex、本地题录快照三库检索均无匹配记录，DOI 亦无法解析——判定为不存在的引用。',
      searches: [
        { db: 'Crossref', query: 'cross-modal affective computing datasets methods open challenges', hits: 0 },
        { db: 'OpenAlex', query: 'A comprehensive survey of cross-modal affective computing', hits: 0 },
        { db: '本地题录快照', query: 'Zhang Y. · IEEE TAFFC · 2023', hits: 0 }
      ],
      url: 'https://search.crossref.org/?q=' + encodeURIComponent('A comprehensive survey of cross-modal affective computing')
    },
    {
      id: 'E19', verdict: 'wrong', lang: 'en',
      cited: { authors: 'Devlin J., Chang M.-W., Lee K., Toutanova K.', title: 'Attention is all you need', venue: 'Advances in Neural Information Processing Systems 30 (NeurIPS)', year: '2017', doi: '10.48550/arXiv.1706.03762' },
      db: { source: 'Crossref', authors: 'Vaswani A., Shazeer N., Parmar N., Uszkoreit J., Jones L., Gomez A. N., Kaiser Ł., Polosukhin I.', title: 'Attention is all you need', venue: 'Advances in Neural Information Processing Systems 30 (NeurIPS)', year: '2017', doi: '10.48550/arXiv.1706.03762' },
      matched: ['title', 'venue', 'year', 'doi'],
      mismatch: ['authors'],
      evidence: '标题与 DOI 均指向 Vaswani 等人 2017 年的《Attention is all you need》，但引用文本把作者写成了 Devlin J. 等 4 人——作者张冠李戴。',
      searches: [{ db: 'Crossref', query: 'Attention is all you need', hits: 1 }, { db: 'OpenAlex', query: 'Attention is all you need Devlin', hits: 0 }],
      url: 'https://doi.org/10.48550/arXiv.1706.03762'
    },
    {
      id: 'E20', verdict: 'doi', lang: 'en',
      cited: { authors: 'Silver D., Huang A., Maddison C. J., 等', title: 'Mastering the game of Go with deep neural networks and tree search', venue: 'Nature, 529(7587)', year: '2016', doi: '10.1038/nature14236' },
      db: { source: 'Crossref', authors: 'Silver D., Huang A., Maddison C. J., Guez A., Sifre L., 等', title: 'Mastering the game of Go with deep neural networks and tree search', venue: 'Nature 529(7587)', year: '2016', doi: '10.1038/nature16961' },
      matched: ['authors', 'title', 'venue', 'year'],
      mismatch: ['doi'],
      doiResolvesTo: { title: 'Human-level control through deep reinforcement learning', authors: 'Mnih V., Kavukcuoglu K., Silver D., Rusu A. A., Veness J., 等', venue: 'Nature 518(7540)', year: '2015', doi: '10.1038/nature14236', url: 'https://doi.org/10.1038/nature14236' },
      evidence: '题录四字段与 Nature 记录一致，但 DOI 10.1038/nature14236 解析到 Mnih 等人 2015 年的 DQN 论文——DOI 错指，本条正确 DOI 应为 10.1038/nature16961。',
      searches: [{ db: 'Crossref', query: 'Mastering the game of Go deep neural networks tree search', hits: 1 }, { db: 'Crossref DOI 解析', query: '10.1038/nature14236', hits: 1 }],
      url: 'https://doi.org/10.1038/nature16961'
    }
  ];

  /* ---------------------------------------------------------
   * 上传文档示例（正文含行内引用 + 文末清单，预埋两类不一致）
   * --------------------------------------------------------- */
  function buildSampleDoc() {
    var body = [
      '附件示例：课程论文《深度学习发展综述》（节选）',
      '',
      '一、研究背景',
      '近年来，深度学习在自然语言处理与计算机视觉领域取得了突破性进展[1,2]。Transformer 架构摒弃了循环结构与卷积结构，完全依靠自注意力机制建模序列依赖[1]。在此基础上，预训练语言模型进一步证明了大规模无监督学习的有效性[2,13]。',
      '二、方法进展',
      '在视觉任务中，残差网络通过恒等映射缓解了深层网络的退化问题[3]；批量归一化显著加快了训练收敛速度[14]。集成树方法方面，XGBoost 在结构化数据任务上长期保持竞争力[10]。词向量表示则经历了从 GloVe 到上下文化表示的发展[11,12]。',
      '三、智能决策',
      '强化学习方面，深度 Q 网络在 Atari 游戏上达到了人类水平[7]；AlphaGo 结合深度神经网络与树搜索击败了人类冠军[20]。优化方法上，Adam 及其变体仍是深度网络训练的主流选择[5]。',
      '四、小结',
      '国内学者对机器学习和统计学习的基本方法已有系统梳理[15,16]。此外，一些综述性工作对跨模态情感计算的数据集与方法进行了全面回顾[21]，值得进一步关注。',
      '',
      '参考文献',
      '[1] ' + SAMPLE[0],
      '[2] ' + SAMPLE[1],
      '[3] ' + SAMPLE[2],
      '[4] ' + SAMPLE[3],
      '[5] ' + SAMPLE[4],
      '[6] ' + SAMPLE[5],
      '[7] ' + SAMPLE[6],
      '[8] ' + SAMPLE[7],
      '[9] ' + SAMPLE[8],
      '[10] ' + SAMPLE[9],
      '[11] ' + SAMPLE[10],
      '[12] ' + SAMPLE[11],
      '[13] ' + SAMPLE[12],
      '[14] ' + SAMPLE[13],
      '[15] ' + SAMPLE[14],
      '[16] ' + SAMPLE[15],
      '[17] ' + SAMPLE[16],
      '[18] ' + SAMPLE[17],
      '[19] ' + SAMPLE[18],
      '[20] ' + SAMPLE[19]
    ];
    return body.join('\n');
  }

  return {
    VERDICTS: VERDICTS,
    FIELD_LABELS: FIELD_LABELS,
    SAMPLE: SAMPLE,
    RESULTS: RESULTS,
    RULES_HTML: RULES_HTML,
    dbSearchUrl: dbSearchUrl,
    isLocalDb: isLocalDb,
    buildSampleDoc: buildSampleDoc
  };
})();
