(() => {
  // ===== 读取参数：?g=female|male&t=0|1|2&gyn=0|1 =====
  const params = new URLSearchParams(window.location.search);
  const gender = params.get('g') === 'male' ? 'male' : 'female';
  const tierIdx = Math.min(2, Math.max(0, parseInt(params.get('t') || '0', 10) || 0));
  const gyn = params.get('gyn') !== '0';

  const body = document.getElementById('detailBody');
  // 数据/档位缺失时给出可读提示，避免整页白屏
  const DATA = (window.PKG_DATA || {})[gender];
  if (!DATA || !DATA.gyn) {
    body.innerHTML = '<p class="pkg-tip">套餐数据未加载成功，请返回后重试。</p>';
    return;
  }
  const priceRows = DATA.gyn[gyn ? 'true' : 'false'] || DATA.gyn.false || [];
  const curPrice = priceRows[tierIdx];
  if (!curPrice) {
    body.innerHTML = '<p class="pkg-tip">未找到对应的套餐档位，请返回后重试。</p>';
    return;
  }
  const info = (DATA.tierInfo || [])[tierIdx] || {};
  const tierNames = ['基础', '标准', '全面'];
  const showName = curPrice.name; // priceRows 名称已含档位

  const fmt = (n) => (Math.round(n * 10) / 10).toString();
  const coverEmoji = gender === 'female' ? '👩‍⚕️' : '👨‍⚕️';

  // ===== 生成矩阵行值 → 单元格 =====
  function cell(v) {
    if (v === 1) return '<span class="cell">✓</span>';
    if (v === 0) return '<span class="cell cell--off">—</span>';
    if (v === 2) return '<span class="cell cell--2">2选1</span>';
    return '<span class="cell cell--add">加购</span>'; // 'a'
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // 组装详情
  let html = '';

  // 主视觉
  const save = (curPrice.orig && curPrice.member) ? fmt(curPrice.orig - curPrice.member) : '';
  html += '<div class="pkg-hero">' +
    '<div class="pkg-hero__cover">' + coverEmoji + '</div>' +
    '<div class="pkg-hero__main">' +
      '<div class="pkg-hero__title">' + esc(showName) + '</div>' +
      '<div class="pkg-hero__meta">' + esc(info.meta) + '</div>' +
      '<div class="pkg-hero__tags">' +
        (info.tags && info.tags.length ? info.tags.map((t, i) => '<span class="pkg-hero__tag' + (i === 0 ? ' pkg-hero__tag--hot' : '') + '">' + esc(t) + '</span>').join('') : '') +
      '</div>' +
      '<div class="pkg-hero__price">' +
        '<b>¥' + fmt(curPrice.member) + '</b>' +
        (curPrice.orig ? '<em>原价 ¥' + fmt(curPrice.orig) + '</em>' : '') +
        (save ? '<span class="save">立省 ¥' + save + '</span>' : '') +
      '</div>' +
    '</div>' +
  '</div>';

  // 基础档案建立
  html += '<div class="sec"><div class="sec__title">基础档案建立</div>' +
    '<div class="profile-card">' +
      '<div class="profile-row"><span class="profile-row__k">性别</span><span class="profile-row__v">' + (gender === 'female' ? '女' : '男') + '</span></div>' +
      '<div class="profile-row"><span class="profile-row__k">地区</span><span class="profile-row__v">' + (gender === 'female' ? '上海' : '深圳') + '</span></div>' +
      '<div class="profile-row"><span class="profile-row__k">版本</span><span class="profile-row__v">' + tierNames[tierIdx] + (gender === 'female' && gyn ? '（含妇科）' : '') + '</span></div>' +
      (gender === 'female' && !gyn ? '<div class="profile-row"><span class="profile-row__k">妇科</span><span class="profile-row__v">不含妇科档</span></div>' : '') +
    '</div></div>';

  // 各章节分组（含全量项目对照）
  html += '<div class="sec"><div class="sec__title">套餐包含项 <span class="note">当前档整列高亮</span></div>';
  const groups = DATA.groups || [];
  groups.forEach((g) => {
    // 不含妇科档时，"含妇科档专属"的三项属于需加购专项：保留分组并整列标为加购，而不是整组消失
    const isFemaleAddon = g.name === '女性加购（含妇科档专属）';
    const title = isFemaleAddon && gender === 'female' && !gyn ? '女性专项（需加购）' : g.name;
    html += '<div class="grp"><div class="grp__title">' + esc(title) + '</div><table>' +
      '<thead><tr><th>项目</th>' + ['基础', '标准', '全面'].map((name, i) =>
        '<th class="' + (i === tierIdx ? 'col-hl' : '') + '">' + name + '</th>').join('') + '</tr></thead><tbody>';
    g.rows.forEach((row) => {
      // 不含妇科档：不展示妇科查体，女性专项三项视为加购
      let vals = [row[1], row[2], row[3]];
      if (gender === 'female' && !gyn) {
        if (row[0] === '妇科咨询及查体') return;
        if (isFemaleAddon) vals = vals.map(() => 'a');
      }
      html += '<tr><td>' + esc(row[0]) + '</td>' +
        vals.map((v, i) => '<td class="' + (i === tierIdx ? 'col-hl' : '') + '">' + cell(v) + '</td>').join('') +
        '</tr>';
    });
    html += '</tbody></table></div>';
  });
  html += '</div>';

  // 价格对比
  html += '<div class="sec"><div class="sec__title">价格对比</div><div class="price-card"><table class="price-tbl">' +
    '<thead><tr><th>套餐</th><th>会员价</th><th>原价</th></tr></thead><tbody>';
  priceRows.forEach((p, i) => {
    html += '<tr class="' + (i === tierIdx ? 'cur' : '') + '"><td>' + esc(p.name) +
      (i === tierIdx ? '<span class="badge">您当前</span>' : '') + '</td>' +
      '<td><b>¥' + fmt(p.member) + '</b></td>' +
      '<td><s>¥' + fmt(p.orig) + '</s></td></tr>';
  });
  html += '</tbody></table></div>' +
    '<p class="pkg-tip">' + esc(DATA.priceNote) + '<br>以上项目与价格以卓正门店实时为准，具体预约与加项请以官方渠道确认为准。</p></div>';

  body.innerHTML = html;

  // ===== 交互 =====
  const toast = document.getElementById('toast');
  let timer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }

  document.getElementById('backBtn').addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'index.html';
  });
  document.getElementById('consultBtn').addEventListener('click', () => showToast('已为您接通卓正健康顾问，请稍候…'));
  document.getElementById('bookBtn').addEventListener('click', () => showToast('正在为您打开预约与购买页…'));
})();
