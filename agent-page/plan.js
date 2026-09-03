(() => {
  // ===== AI 接口配置（与对话页一致）=====
  const API_URL = 'https://api.inner-book.top:3000/v1/chat/completions';
  const API_KEY = 'Bearer pulinli222666uiqo';

  // 计划书提示词版本号：调整 System Prompt 后请递增此号，使旧缓存自动失效并重新生成
  const PROMPT_VERSION = '9';


  // ===== DOM =====
  const planLoading = document.getElementById('planLoading');
  const planContent = document.getElementById('planContent');
  const planHero = document.getElementById('planHero');
  const toast = document.getElementById('toast');

  // ===== 工具函数 =====
  function showToast(message, duration = 2200) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), duration);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== 计划书渲染器（设计稿风格组件） =====
  // 将 AI 输出的结构化 markdown 渲染为设计稿组件：
  //   # 0N｜章节 → 章节头（含目录锚点与导航）
  //   ## 核心健康目标 → 目标卡片（### 目标N｜）
  //   ## A. 饮食 → 行动模块（问题卡 / 行动卡 / Plan B）
  //   ## 第N阶段｜ → 阶段时间线卡片
  //   ### 当前3个主要攻克点 → 关键词 chips
  //   其余 → 优雅的正文排版（段落/引用/列表/表格）
  const metaStore = { owner: '', period: '' };

  // 行内 Markdown：转义 + 加粗/斜体/行内代码
  function inlineMd(s) {
    return String(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function renderPlan(text) {
    if (!text) return '';
    // 1) 提取元信息（计划书主人 / 计划周期）。兼容带/不带 ** 加粗（星号数量 0~2）、带/不带 - 前缀的格式
    let cleaned = text.replace(/^-?\s*(?:\*\*)?\s*计划书主人\s*\*{0,2}\s*[：:]\s*([^\n（【]+)/gm, (m, v) => { metaStore.owner = v.trim(); return ''; });
    cleaned = cleaned.replace(/^-?\s*(?:\*\*)?\s*计划周期\s*\*{0,2}\s*[：:]\s*([^\n（【]+)/gm, (m, v) => { metaStore.period = v.trim(); return ''; });

    // 2) 按章节切分：# 01｜xxx 或 ## 01｜xxx
    const parts = cleaned.split(/^#{1,2}\s+(0?\d{1,2})\s*[｜|]\s*(.+)$/m);
    let html = '';
    const toc = [];
    let aiIdx = 0; // AI 输出的章节顺序号（1 起）
    for (let i = 1; i < parts.length; i += 3) {
      aiIdx++;
      const aiNum = String(parseInt(parts[i], 10) || 0).padStart(2, '0');
      const title = parts[i + 1].trim();
      const body = parts[i + 2] || '';
      const isFollowup = aiNum === '04';
      // 04 编号预留给「让计划成为行动」，AI 第 4 章起顺延编号（原 04 → 05）
      let num = aiNum;
      if (aiIdx >= 4) num = String((parseInt(aiNum, 10) || 0) + 1).padStart(2, '0');
      toc.push({ num, title });
      const tinted = isFollowup;
      // 随访计划：按时间节点分块渲染，并注入导流组件
      const bodyHtml = isFollowup ? renderFollowupSection(body) : renderSectionBody(body);
      html += '<section class="section' + (tinted ? ' section--tinted' : '') + '" id="s' + num + '">' +
              '<div class="section-head"><p class="section-eyebrow">' + num + '</p><h2 class="section-title">' + escapeHtml(title) + '</h2></div>' +
              bodyHtml + '</section>';
      // AI 第 3 章（原 03）之后插入正式的第 04 章「让计划成为行动」
      if (aiIdx === 3) html += renderLaunchSection(toc);
    }
    if (parts[0] && parts[0].trim()) html = renderProse(parts[0]) + html;
    buildToc(toc);
    buildSectionNav(toc);
    return html;
  }

  // 章节内部：统一的块路由器，兼容 AI 输出 ## 或 ### 两种标题层级
  //   目标N｜ → 目标卡集合；A. 饮食 → 模块；第N阶段｜ → 阶段卡
  //   当前3个主要攻克点 → 关键词 chips；其余 → 子标题 + 正文
  function renderSectionBody(body) {
    // 0) 规范化：AI 可能用加粗文本代替标题，统一转为 ### 标题以便块识别
    body = body
      .replace(/^\s*\*\*当前3个主要攻克点\*\*\s*$/gm, '### 当前3个主要攻克点')
      .replace(/^\s*\*\*你现在的问题是什么[？?:：\s]*\*\*\s*$/gm, '### 你现在的问题是什么？')
      .replace(/^\s*\*\*接下来具体怎么做[？?:：\s]*\*\*\s*$/gm, '### 接下来具体怎么做')
      .replace(/^\s*\*\*做什么运动\*\*\s*$/gm, '### 做什么运动')
      .replace(/^\s*\*\*做到什么强度\*\*\s*$/gm, '### 做到什么强度')
      // 加粗形式的模块标题（**A. 饮食** / **B、运动**）也转成 ### 标题
      .replace(/^\s*\*\*([A-Ha-h])\s*[.、)）]\s*(.+?)\*\*\s*$/gm, '### $1. $2');
    // 1) 解析为有序块列表
    const list = [];
    let cur = { title: '', lines: [] };
    const pushLine = (raw) => { const t = raw.trim(); if (t) cur.lines.push(raw); };
    for (const raw of body.split('\n')) {
      const m = raw.trim().match(/^#{2,4}\s+(.+)$/);
      if (m) { list.push(cur); cur = { title: m[1].trim(), lines: [] }; }
      else pushLine(raw);
    }
    list.push(cur);
    const blocks = list.filter((b) => b.title || b.lines.length);

    let html = '';
    let i = 0;
    while (i < blocks.length) {
      const b = blocks[i];
      // 目标卡集合（可连续多个目标块）
      const goalM = b.title.match(/^目标\s*\d+\s*[｜|]\s*(.+)$/);
      if (goalM) {
        const goalBlocks = [];
        while (i < blocks.length) {
          const gm = blocks[i].title.match(/^目标\s*\d+\s*[｜|]\s*(.+)$/);
          if (!gm) break;
          goalBlocks.push(blocks[i]);
          i++;
        }
        html += '<div class="goals">' + goalBlocks.map((gb, idx) =>
          renderGoalCard(String(idx + 1), gb.title.replace(/^目标\s*\d+\s*[｜|]\s*/, '').trim(), gb.lines.join('\n'))
        ).join('') + '</div>';
        continue;
      }
      // 关键词 chips 块
      const kwM = b.title.match(/^(?:当前3个主要攻克点|当前3个关键词|你的\s*3个关键词|你的3个关键词)$/);
      if (kwM) {
        const chipTexts = [];
        for (const ln of b.lines) {
          let t = ln.trim();
          if (/^```/.test(t)) continue; // 跳过代码块围栏
          const cu = t.match(/^[-*]\s+(.+)$/);
          const cq = t.match(/^>\s?(.+)$/);
          const item = cu ? cu[1] : (cq ? cq[1] : t);
          item.split(/[｜|]/).forEach((s) => { const v = s.trim(); if (v) chipTexts.push(v); });
        }
        html += '<p class="section-caption">' + escapeHtml(kwM[1]) + '</p>';
        if (chipTexts.length) html += '<div class="chips">' + chipTexts.map((c) => '<span class="chip">' + inlineMd(c) + '</span>').join('') + '</div>';
        i++;
        continue;
      }
      // 行动模块 A. 饮食（收集其内部子块）
      const modM = b.title.match(/^([A-Ha-h])\s*[.、]\s*(.+)$/);
      if (modM) {
        const innerTitles = /你现在的问题是什么|接下来具体怎么做|做什么运动|做到什么强度|每次多久|每周几次|每周\/每日|30天|本阶段目标|你要做的|完成标准|没做到|怎么测/;
        let j = i + 1;
        let bodyLines = b.lines.slice();
        while (j < blocks.length) {
          const nb = blocks[j];
          const isInner = nb.title && innerTitles.test(nb.title) && !/^[A-Ha-h]\s*[.、]\s/.test(nb.title);
          if (!isInner) break;
          bodyLines = bodyLines.concat(['### ' + nb.title], nb.lines);
          j++;
        }
        html += renderModule(modM[1].toUpperCase(), modM[2].trim(), bodyLines.join('\n'));
        i = j;
        continue;
      }
      // 阶段卡
      const phM = b.title.match(/^第(\d+)阶段\s*[｜|]\s*(.+)$/);
      if (phM) {
        html += renderPhase(phM[1], phM[2].trim(), b.lines.join('\n'));
        i++;
        continue;
      }
      // 普通子标题块
      if (b.title) html += '<h3 class="sub-title">' + escapeHtml(b.title) + '</h3>';
      html += renderProse(b.lines.join('\n'));
      i++;
    }
    return html;
  }

  // ===== 04 随访计划：按时间节点分块，并注入导流组件（设备导入 / 线上随访提醒 / 预约复查） =====
  function renderFollowupSection(body) {
    // 解析为块列表（与 renderSectionBody 一致）
    const list = [];
    let cur = { title: '', lines: [] };
    for (const raw of body.split('\n')) {
      const m = raw.trim().match(/^#{2,4}\s+(.+)$/);
      if (m) { list.push(cur); cur = { title: m[1].trim(), lines: [] }; }
      else { const t = raw.trim(); if (t) cur.lines.push(raw); }
    }
    list.push(cur);
    const blocks = list.filter((b) => b.title || b.lines.length);

    const BELL_SVG = '<span class="fu-check__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span>';

    let html = '';
    for (const b of blocks) {
      const t = b.title || '';
      const isDaily = /每周|每日|日常数据/.test(t);
      const isQ1 = /1\s*个月后|线上问卷/.test(t);
      const isQ3 = /3\s*个月后/.test(t);
      const isQ6 = /6\s*个月后/.test(t);

      // 标签：从标题中提取时间部分（如"每周/每日"、"1 个月后"）
      let tag = '';
      let label = t;
      const tm = t.match(/^((?:每周|每日|每周\/每日|日常数据记录|[\d一二三四五六七八九十]+\s*个月?后|[\d]+\s*个月后)[^：:]*)[·・\s]*(.*)$/);
      if (tm) {
        tag = tm[1].trim();
        if (tm[2]) label = tm[2].trim();
      }
      if (isDaily && !tag) { tag = '每周/每日'; label = '日常数据记录'; }

      html += '<div class="followup-block">';
      html += '<h3 class="followup-title">' +
        (tag ? '<span class="followup-tag">' + escapeHtml(tag) + '</span>' : '') +
        escapeHtml(label) + '</h3>';
      html += renderProse(b.lines.join('\n'));

      // 导流组件
      if (isDaily) {
        html += '<button type="button" class="fu-btn fu-btn--outline" data-fu-device>从设备导入数据</button>';
      } else if (isQ1) {
        html += '<label class="fu-check"><span class="fu-check__text">1 个月后提醒我线上随访</span>' + BELL_SVG + '<span class="fu-check__box"></span><input type="checkbox" data-fu-remind /></label>';
      } else if (isQ3 || isQ6) {
        html += '<button type="button" class="fu-btn" data-fu-appt>预约线下复查</button>';
      }
      html += '</div>';
    }
    return html;
  }

  // ===== 正式的第 04 章「让计划成为行动」（健康辅助功能勾选启动） =====
  function renderLaunchSection(toc) {
    const launcher = renderActionLauncher();
    if (toc) toc.push({ num: '04', title: '让计划成为行动' });
    return '<section class="section section--launch" id="s04">' +
      '<div class="section-head">' +
        '<p class="section-eyebrow">04</p>' +
        '<h2 class="section-title">让计划成为行动</h2>' +
      '</div>' +
      launcher +
    '</section>';
  }

  // ===== 04 内容：健康辅助功能（功能名 → 标题 → 说明 → 示例卡片） =====
  const HM_NAMES = { recipe: '定制食谱', daily: '每日健康打卡', weekly: '每周健康回顾' };

  function renderActionLauncher() {
    // 说明文案
    const intro =
      '<p class="launch-text">' +
        '这套改善计划基于你的体检结果、生活习惯、客观情况量身定制，但"知易行难"，我们深知迈出第一步并不容易。' +
        '为了更好的帮助你适应生活方式的变化，卓正将提供一系列配套功能，让改善健康的行为真正开始。' +
        '现在点击「确认启动健康辅助功能」，开启你的健康行动吧！' +
      '</p>';

    const head = (key, name) =>
      '<label class="hm-f__head">' +
        '<span class="hm-check"><input type="checkbox" checked data-hm-item="' + key + '" /><span class="hm-check__box"></span></span>' +
        '<span class="hm-f__name">' + name + '</span>' +
      '</label>';

    // —— 定制食谱（暖橙示例卡）——
    const recipe =
      '<div class="hm-f hm-f--recipe">' +
        head('recipe', '定制食谱') +
        '<p class="hm-f__title">减重食谱 · 35岁 · 男性</p>' +
        '<p class="hm-f__desc">1分钟问卷，根据健康状况和饮食习惯，生成切实可行的营养食谱，<strong>适合有饮食管理需求的用户</strong>。</p>' +
        '<div class="hm-f__card">' +
          '<p class="hm-recipe-day"><b>第一周</b></p>' +
          '<p class="hm-recipe-line"><em>早餐</em><span>全麦燕麦30g 配 无糖酸奶100g</span></p>' +
          '<p class="hm-recipe-line"><em>午餐</em><span>杂粮饭100g · 清蒸鱼100g · 时蔬200g</span></p>' +
          '<p class="hm-recipe-line"><em>晚餐</em><span>鸡胸沙拉 · 少量坚果 · 无糖茶</span></p>' +
        '</div>' +
      '</div>';

    // —— 每日健康打卡（沿用早先 widget 卡片观感）——
    const daily =
      '<div class="hm-f">' +
        head('daily', '每日健康打卡') +
        '<p class="hm-f__title">今日 · 健康打卡</p>' +
        '<p class="hm-f__desc">设置桌面widget，提醒并记录每日健康行为，促进好习惯快速养成，<strong>适合有运动/睡眠/戒烟/戒酒管理需求的用户</strong>。</p>' +
        '<div class="hm-f__card hm-f__card--widget">' +
          '<p class="memo-widget__eyebrow">今日健康 MEMO</p>' +
          '<p class="memo-widget__tagline">每天一件事，见证健康改善</p>' +
          '<hr class="memo-widget__divider">' +
          '<p class="memo-widget__task">' +
            '<span class="memo-widget__emoji" aria-hidden="true">🚶</span>' +
            '<span class="memo-widget__task-title">晚饭后步行 20 分钟</span>' +
          '</p>' +
          '<p class="memo-widget__benefit">改善：餐后血糖 · 体重管理</p>' +
          '<div class="memo-widget__done"><span class="memo-widget__check" aria-hidden="true">✓</span>今天已完成</div>' +
        '</div>' +
      '</div>';

    // —— 每周健康回顾（充实：标题 + 副标题 + 进度条 + 三格 + 下周重点 pill）——
    const weekly =
      '<div class="hm-f">' +
        head('weekly', '每周健康回顾') +
        '<p class="hm-f__title">上周回顾 · 8.25 – 8.31</p>' +
        '<p class="hm-f__desc">授权手机健康数据，每周回顾您的健康情况，针对性调整方案细节，<strong>适合有健康状况改善需求的用户</strong>。</p>' +
        '<div class="hm-f__card hm-f__card--widget">' +
          '<p class="memo-widget__eyebrow">本周健康 REVIEW</p>' +
          '<p class="memo-widget__tagline">上周做了 5 / 7 天，本周继续保持</p>' +
          '<hr class="memo-widget__divider">' +
          '<div class="memo-weekly__progress" aria-label="本周达标率 71%">' +
            '<span class="memo-weekly__progress-bar" style="width:71%"></span>' +
            '<span class="memo-weekly__progress-value">71%</span>' +
          '</div>' +
          '<div class="hm-weekly-stats">' +
            '<span class="hm-stat"><b>5</b><i>天</i><small>本周达标</small></span>' +
            '<span class="hm-stat"><b>-0.6</b><i>kg</i><small>体重变化</small></span>' +
            '<span class="hm-stat"><b>3</b><i>次</i><small>快走完成</small></span>' +
          '</div>' +
          '<div class="memo-weekly__hint">' +
            '<span class="memo-weekly__hint-tag">下周重点</span>' +
            '<span class="memo-weekly__hint-text">晚餐提前到 20 点前</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    return '<div class="hm-panel">' +
      intro +
      '<div class="hm-fs">' + recipe + daily + weekly + '</div>' +
      '<button type="button" class="fu-btn hm-confirm" data-hm-confirm>确认启动健康辅助功能</button>' +
    '</div>';
  }

  // 绑定 04 章节内的导流组件事件（设备导入 / 提醒 / 预约）
  function bindFollowupActions() {
    const scope = document.getElementById('planContent') || document;
    scope.querySelectorAll('[data-fu-device]').forEach((b) => {
      b.addEventListener('click', () => showToast('正在从设备同步您的日常健康数据…'));
    });
    scope.querySelectorAll('[data-fu-remind]').forEach((c) => {
      c.addEventListener('change', () => {
        showToast(c.checked ? '已为您开启 1 个月后线上随访提醒' : '已取消线上随访提醒');
      });
    });
    scope.querySelectorAll('[data-fu-appt]').forEach((b) => {
      b.addEventListener('click', () => showToast('已为您生成线下复查预约意向，请确认预约时间与科室。'));
    });
    // 04 健康辅助功能选择：确认时汇总勾选的功能
    scope.querySelectorAll('[data-hm-confirm]').forEach((b) => {
      b.addEventListener('click', () => {
        const names = [];
        scope.querySelectorAll('[data-hm-item]:checked').forEach((it) => {
          const n = HM_NAMES[it.getAttribute('data-hm-item')];
          if (n) names.push(n);
        });
        showToast(names.length ? '已为您开启' + names.join('、') + '健康辅助' : '未选择任何健康辅助功能，可随时在后续调整');
      });
    });
  }

  // ===== 02 目标卡片 =====
  function renderGoalCard(num, title, body) {
    const fields = [];
    for (const raw of body.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      const m = line.match(/^[-*]\s*\*\*(.+?)\*\*\s*[：:]\s*([\s\S]*)$/);
      if (m) fields.push({ label: m[1].trim(), value: m[2].trim() });
    }
    const headIcon = '<svg class="goal-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
    let quantHtml = '';
    let rowHtml = '';
    for (const f of fields) {
      if (/天目标|月目标/.test(f.label)) {
        quantHtml = '<div class="goal-quant"><p class="goal-quant-label">' + escapeHtml(f.label) + '</p><p class="goal-quant-value">' + inlineMd(f.value) + '</p></div>';
      } else {
        rowHtml += '<div class="goal-row"><p class="goal-row-label">' + escapeHtml(f.label) + '</p><p class="goal-row-value">' + inlineMd(f.value) + '</p></div>';
      }
    }
    return '<article class="goal-card"><div class="goal-head">' + headIcon +
      '<div><p class="goal-tag">目标 ' + num + '</p><h3 class="goal-title">' + escapeHtml(title) + '</h3></div></div>' +
      '<div class="goal-body">' + quantHtml + rowHtml + '</div></article>';
  }

  // ===== 03 行动模块 =====
  function renderModule(letter, title, body) {
    let html = '<div class="module-head"><span class="module-letter">' + letter + '</span><h3 class="module-title">' + escapeHtml(title) + '</h3></div>';
    const blocks = body.split(/^###\s+(.*)$/m);
    if (blocks[0] && blocks[0].trim()) html += renderProse(blocks[0]);
    for (let i = 1; i < blocks.length; i += 2) {
      const h = (blocks[i] || '').trim();
      const hb = blocks[i + 1] || '';
      if (/你现在的问题是什么/.test(h)) {
        html += '<p class="section-caption">你现在的问题是什么</p>' + renderProse(hb);
      } else if (/接下来具体怎么做/.test(h)) {
        html += '<p class="section-caption">接下来具体怎么做</p>' + renderActions(hb);
      } else {
        html += '<h4 class="h4">' + escapeHtml(h) + '</h4>' + renderProse(hb);
      }
    }
    return html;
  }

  // 行动项 + Plan B
  function renderActions(text) {
    const lines = text.split('\n');
    const cards = [];
    let cur = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      // Plan B 行（挂到上一个行动卡）。** / 【】 都可选，兼容 - Plan B：xxx / - **Plan B**：xxx / - **【Plan B】**：xxx 等
      const planb = line.match(/^[-*]\s*\**\s*【?\s*Plan\s*B\s*】?\s*\**\s*[：:]\s*(.+)$/i);
      if (planb) {
        if (cur) cur.planb = planb[1].trim();
        else cards.push({ title: '', body: '', planb: planb[1].trim() });
        continue;
      }
      let content = line;
      const act = line.match(/^[-*]\s*\*\*【\s*做什么\s*\+\s*做到什么程度\s*】\*\*\s*[：:]\s*(.+)$/);
      if (act) content = act[1].trim();
      else if (/^[-*]\s/.test(line)) content = line.replace(/^[-*]\s+/, '').trim();
      // 拆"标题：说明"：优先按【】结尾的标题解析（处理 AI 用 - **【xxx】**：yyy 的形式），
      // 否则按第一个中文冒号或英文冒号分隔
      let colon = null;
      const bracketEnd = content.indexOf('】');
      if (bracketEnd >= 0) {
        const tail = content.slice(bracketEnd + 1);
        const m = tail.match(/^[：:]\s*([\s\S]+)$/);
        if (m) colon = [content, content.slice(0, bracketEnd + 1), m[1].trim(), m[1]];
      }
      if (!colon) colon = content.match(/^([^：]{4,30}?)[：:]\s*(.+)$/);
      if (colon && colon[2].length >= colon[1].length) {
        cards.push({ title: colon[1].trim(), body: colon[2].trim(), planb: '' });
      } else {
        cards.push({ title: content, body: '', planb: '' });
      }
      cur = cards[cards.length - 1];
    }
    // 行内 Plan B 拆分：把正文中 "**Plan B**：xxx" 提取为独立 Plan B 副卡
    for (const c of cards) {
      if (c.planb || !c.body) continue;
      const idx = c.body.indexOf('Plan B');
      if (idx > 0) {
        const head = c.body.slice(0, idx)
          .replace(/\*\*[【（]?\s*$/, '')
          .replace(/。+\s*$/, '');
        const tail = c.body.slice(idx + 'Plan B'.length);
        const m2 = tail.match(/^[】)）]?\s*\**\s*[：:]\s*([\s\S]+)$/);
        if (m2) {
          c.body = head.trim();
          c.planb = m2[1].trim();
        }
      }
    }
    let html = '<div class="action-list">';
    for (const c of cards) {
      // 过滤空卡片：标题、正文、Plan B 至少要有正文/Plan B 才渲染，避免出现只有标题（甚至只有'—'）的空卡片
      const hasRealContent = c.body || c.planb;
      if (!hasRealContent) continue;
      html += '<div class="action-card">';
      if (c.title) html += '<h4 class="action-title">' + inlineMd(c.title) + '</h4>';
      if (c.body) html += '<p class="action-text">' + inlineMd(c.body) + '</p>';
      if (c.planb) html += '<p class="planb"><strong>Plan B</strong> ' + inlineMd(c.planb) + '</p>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // ===== 04 阶段时间线 =====
  function renderPhase(num, title, body) {
    let label = title;
    let days = '';
    const dm = title.match(/^([\d\-–~至]+天)\s*[：:]\s*(.+)$/);
    if (dm) { days = dm[1]; label = dm[2]; }
    const fields = {};
    const todoList = [];
    let mode = '';
    for (const raw of body.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      const fm = line.match(/^[-*]\s*\*\*(.+?)\*\*\s*[：:]\s*([\s\S]*)$/);
      if (fm) {
        const lb = fm[1].trim();
        const val = fm[2].trim();
        if (/你要做的/.test(lb)) {
          mode = 'todo';
          if (val) splitTodo(val).forEach((t) => todoList.push(t));
        } else if (/本阶段目标/.test(lb)) { mode = 'goal'; fields.goal = val; }
        else if (/完成标准/.test(lb)) { mode = 'done'; fields.done = val; }
        else if (/没做到|没达成/.test(lb)) { mode = 'miss'; fields.miss = val; }
        else mode = '';
        continue;
      }
      const ol = line.match(/^\d+[.、)]\s+(.+)$/);
      if (ol) { todoList.push(ol[1].trim()); continue; }
      const ul = line.match(/^[-*]\s+(.+)$/);
      if (ul) { if (mode === 'todo') todoList.push(ul[1].trim()); continue; }
      if (mode === 'goal') fields.goal = (fields.goal ? fields.goal + ' ' : '') + line;
    }

    let html = '<div class="timeline-item"><span class="timeline-num">' + num + '</span><div class="phase-card">';
    html += '<div class="phase-head"><h3 class="phase-title">第 ' + num + ' 阶段｜' + escapeHtml(label) + '</h3>' +
      (days ? '<span class="phase-days">' + escapeHtml(days) + '</span>' : '') + '</div>';
    if (fields.goal) html += '<p class="phase-goal"><strong>本阶段目标：</strong>' + inlineMd(fields.goal) + '</p>';
    if (todoList.length) {
      html += '<p class="phase-list-label">你要做的 3 件事</p><ul class="phase-list">';
      todoList.forEach((t, idx) => {
        html += '<li><span class="phase-num">' + (idx + 1) + '</span><span class="phase-list-item">' + inlineMd(t) + '</span></li>';
      });
      html += '</ul>';
    }
    if (fields.done || fields.miss) {
      html += '<div class="phase-foot">';
      if (fields.done) html += '<p class="phase-complete"><strong>完成标准：</strong>' + inlineMd(fields.done) + '</p>';
      if (fields.miss) html += '<p class="phase-miss"><strong>没做到怎么办：</strong>' + inlineMd(fields.miss) + '</p>';
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function splitTodo(val) {
    const m = val.match(/^[一二三123]\s*[.、)]\s*(.+)$/);
    const v = m ? m[1] : val;
    // 条目间用「；/;」分隔；若没有分号则整条视为一项（保留「｜类别」前缀）
    if (/；|;/.test(v)) return v.split(/；|;/).map((s) => s.trim()).filter(Boolean);
    return [v.trim()];
  }

  // ===== 通用正文 =====
  function renderProse(text) {
    const lines = text.split('\n');
    let html = '<div class="prose">';
    let listOpen = false;
    let listType = '';
    const closeList = () => { if (listOpen) { html += '</' + listType + '>'; listOpen = false; } };
    const flushChips = () => {
      if (chips.length) {
        html += '<div class="chips">' + chips.map((c) => '<span class="chip">' + inlineMd(c) + '</span>').join('') + '</div>';
        chips = [];
      }
    };
    let chips = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { closeList(); flushChips(); i++; continue; }
      // 表格
      if (line.startsWith('|')) {
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; }
        closeList(); flushChips();
        html += renderTable(rows);
        continue;
      }
      // 引用（强调卡）
      if (line.startsWith('>')) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) { quoteLines.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
        closeList(); flushChips();
        html += '<blockquote class="quote-card">' + quoteLines.map((q) => '<p>' + inlineMd(q) + '</p>').join('') + '</blockquote>';
        continue;
      }
      // 关键词 chips（可跳过 ### 与列表间的空行）
      const kw = line.match(/^###\s*((?:当前3个主要攻克点|当前3个关键词|你的\s*3个关键词|你的3个关键词))\s*$/);
      if (kw) {
        closeList(); flushChips();
        html += '<p class="section-caption">' + escapeHtml(kw[1]) + '</p>';
        const chipLines = [];
        let j = i + 1;
        while (j < lines.length) {
          const n = lines[j].trim();
          if (!n) { j++; continue; }
          let item = null;
          const cu = n.match(/^[-*]\s+(.+)$/);
          if (cu) item = cu[1];
          else {
            const cq = n.match(/^>\s?(.+)$/);
            if (cq) item = cq[1];
          }
          if (item === null) break;
          item.split(/[｜|]/).forEach((s) => { const t = s.trim(); if (t) chipLines.push(t); });
          j++;
        }
        if (chipLines.length) html += '<div class="chips">' + chipLines.map((c) => '<span class="chip">' + inlineMd(c) + '</span>').join('') + '</div>';
        i = j - 1;
        i++;
        continue;
      }
      // 一级标题（无编号的文档主标题，由 hero 统一渲染，此处跳过避免重复）
      const h1 = line.match(/^#\s+(.+)$/);
      if (h1) { i++; continue; }
      // 三级标题
      const h3 = line.match(/^###\s+(.+)$/);
      if (h3) { closeList(); flushChips(); html += '<h4 class="h4">' + inlineMd(h3[1]) + '</h4>'; i++; continue; }
      // 无序列表
      const ul = line.match(/^[-*]\s+(.+)$/);
      if (ul) {
        if (!listOpen || listType !== 'ul') { closeList(); html += '<ul class="plain-list">'; listOpen = true; listType = 'ul'; }
        html += '<li>' + inlineMd(ul[1]) + '</li>';
        i++; continue;
      }
      // 有序列表
      const ol = line.match(/^\d+[.、)]\s+(.+)$/);
      if (ol) {
        if (!listOpen || listType !== 'ol') { closeList(); html += '<ol>'; listOpen = true; listType = 'ol'; }
        html += '<li>' + inlineMd(ol[1]) + '</li>';
        i++; continue;
      }
      // 分隔线
      if (/^(-{3,}|\*{3,})$/.test(line)) { closeList(); flushChips(); i++; continue; }
      // 段落
      closeList(); flushChips();
      html += '<p>' + inlineMd(line) + '</p>';
      i++;
    }
    closeList(); flushChips();
    html += '</div>';
    return html;
  }

  // markdown 表格 → 设计稿表格
  function renderTable(rows) {
    const parse = (r) => r.replace(/^\||\|$/g, '').split('|').map((s) => s.trim());
    const headers = parse(rows[0] || '');
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const cells = parse(rows[i]);
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      data.push(cells);
    }
    let html = '<div class="table-wrap"><table class="plan-table"><thead><tr>';
    headers.forEach((h) => { html += '<th>' + inlineMd(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    data.forEach((row) => {
      html += '<tr>';
      row.forEach((c) => { html += '<td>' + inlineMd(c) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  // ===== 目录 & 导航 & 元信息 =====
  function buildToc(toc) {
    const list = document.getElementById('tocList');
    if (!list) return;
    list.innerHTML = '';
    if (!toc.length) {
      list.innerHTML = '<li class="toc-empty">—</li>';
      return;
    }
    toc.forEach((t) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'toc-link';
      a.href = '#s' + t.num;
      a.innerHTML = '<span class="toc-link-inner"><span class="toc-num">' + t.num + '</span><span class="toc-title">' + escapeHtml(t.title) + '</span></span>' +
        '<svg class="toc-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function buildSectionNav(toc) {
    const nav = document.getElementById('sectionNav');
    if (!nav) return;
    nav.innerHTML = '';
    toc.forEach((t) => {
      const a = document.createElement('a');
      a.href = '#s' + t.num;
      a.textContent = t.num;
      nav.appendChild(a);
    });
  }

  function fillMeta() {
    const o = document.getElementById('metaOwner');
    const p = document.getElementById('metaPeriod');
    if (metaStore.owner && o) o.textContent = metaStore.owner;
    if (metaStore.period && p) p.textContent = metaStore.period;
    // 若 AI 未输出"计划书主人"，尝试从体检报告摘要中提取姓名作为兜底
    if (!metaStore.owner && o) {
      try {
        const raw = localStorage.getItem('reportPlanCtx') || sessionStorage.getItem('reportPlanCtx');
        if (raw) {
          const c = JSON.parse(raw);
          const m = String(c.reportSummary || '').match(/姓名[：:]\s*([^\s，,。、]+)/);
          if (m && m[1] && m[1] !== '--') o.textContent = m[1];
        }
      } catch (e) { /* 忽略 */ }
    }
    const fd = document.getElementById('footerDate');
    if (fd) {
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      const fmt = (d) => d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
      fd.textContent = fmt(now) + ' — ' + fmt(end);
    }
  }

  // ===== 离线演示：用本地预置计划书渲染 =====
  function renderOfflinePlan(version) {
    const data = window.PLAN_OFFLINE && window.PLAN_OFFLINE[version];
    if (!data) return false;
    const now = new Date();
    const fmt = (d) => d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    const finalContent = data
      .replace(/\{\{PLAN_START\}\}/g, fmt(now))
      .replace(/\{\{PLAN_END\}\}/g, fmt(end))
      .replace(/\{\{[A-Z_]+\}\}/g, '');
    planContent.innerHTML = renderPlan(finalContent);
    planLoading.hidden = true;
    planContent.hidden = false;
    if (planHero) planHero.hidden = false;
    bindFollowupActions();
    fillMeta();
    scrollToTop();
    showToast('当前为离线演示，展示本地预置计划书');
    return true;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // ===== 加载态切换工具 =====
  // 统一所有"非内容展示"路径（生成中、异常提示、重试）的 UI：
  // 隐藏顶部 Hero，只保留中间的 loading 区块与说明/重试按钮
  function showLoadingState(text, sub) {
    if (planHero) planHero.hidden = true;
    planLoading.hidden = false;
    planContent.hidden = true;
    planLoading.querySelector('.loading-text').textContent = text || '';
    planLoading.querySelector('.loading-sub').textContent = sub || '';
  }

  // ===== 计划书生成 =====
  async function generate() {
    const raw = localStorage.getItem('reportPlanCtx') || sessionStorage.getItem('reportPlanCtx');
    // 清理上一次的重试按钮
    const oldRetry = planLoading.querySelector('.retry-btn');
    if (oldRetry) oldRetry.remove();

    if (!raw) {
      showLoadingState('未找到您的信息采集记录，请回到对话完成信息收集后再生成。', '');
      return;
    }

    let ctx;
    try { ctx = JSON.parse(raw); } catch (e) {
      showLoadingState('数据异常，请回到对话重新收集信息。', '');
      return;
    }

    const report = ctx.reportSummary || '（未提供）';
    const answers = ctx.answers || '（未提供）';
    // 儿童档案（child 开头的版本标识）或病症含儿童相关词时，使用面向家长的提示词与口吻
    const isChild = /^child/i.test(ctx.version || '') || /儿童|男童|女童|孩子/.test(ctx.disease || '');
    // 提示词来源为独立的 plan-prompt.js（已移除内置旧模板，单一来源避免失步）
    const planPrompt = isChild ? window.PLAN_PROMPT_TEMPLATE_CHILD : window.PLAN_PROMPT_TEMPLATE;
    if (!planPrompt) {
      showLoadingState('提示词配置加载失败，请刷新页面重试。', '');
      return;
    }
    const system = '【用户体检报告解读结果】\n' + report + '\n\n【前置健康信息采集结果】\n' + answers + '\n\n' + planPrompt;
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: isChild ? '请根据以上信息，为我的孩子制定一份专属的《个人健康改善计划书-第一个月》。' : '请根据以上信息，为我制定专属的《个人健康改善计划书-第一个月》。' }
    ];

    planContent.innerHTML = '';
    showLoadingState('正在结合您的体检结果与回答，生成专属计划书…', '生成内容较长，约需 30–60 秒，请耐心等待');
    scrollToTop();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': API_KEY },
        body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 6000 })
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('认证失败，请检查接口密钥');
        throw new Error('服务返回异常（HTTP ' + res.status + '）');
      }
      const data = await res.json();
      const content = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '';
      if (!content) throw new Error('未收到有效回复，请重试');

      // 填充计划周期占位符：{{PLAN_START}} / {{PLAN_END}}（生成时间 ~ +1 个月）
      const now = new Date();
      const fmt = (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      const finalContent = content
        .replace(/\{\{PLAN_START\}\}/g, fmt(now))
        .replace(/\{\{PLAN_END\}\}/g, fmt(end))
        .replace(/\{\{[A-Z_]+\}\}/g, '');

      planContent.innerHTML = renderPlan(finalContent);
      planLoading.hidden = true;
      planContent.hidden = false;
      if (planHero) planHero.hidden = false;
      fillMeta();
      // 回到顶部，直接呈现计划书内容（loading 态完全消失）
      scrollToTop();
      // 缓存计划书内容（已填日期），方便后续从 agent 卡片 / 报告页按钮直接重复查看
      try {
        const cachedCtx = (() => { try { return JSON.parse(localStorage.getItem('reportPlanCtx')); } catch (e) { return null; } })();
        localStorage.setItem('reportPlan', JSON.stringify({
          version: (cachedCtx && cachedCtx.version) || '',
          promptVersion: PROMPT_VERSION,
          content: finalContent,
          time: Date.now()
        }));
      } catch (e) { /* 忽略 */ }
      showToast('计划书已生成');
    } catch (err) {
      // 离线/接口失败时回退到本地预置计划书
      const offlineVer = (() => {
        try { return (JSON.parse(localStorage.getItem('reportPlanCtx')) || {}).version || ''; } catch (e) { return ''; }
      })();
      if (offlineVer && renderOfflinePlan(offlineVer)) return;
      // 失败态也保持 hero 隐藏，只展示 loading 区块（错误信息 + 重试按钮）
      const isNetErr = err && (err instanceof TypeError || /failed to fetch|networkerror/i.test(String(err.message)));
      showLoadingState(
        isNetErr
          ? '生成失败：网络或跨域(CORS)请求被拦截。请确认通过 GitHub Pages 线上地址访问（https://lipulin222.github.io/physical-examination/）；本地打开文件或 localhost 预览会因接口跨域白名单限制而失败。'
          : '生成失败：' + err.message,
        ''
      );
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'retry-btn';
      retry.textContent = '重新生成';
      retry.addEventListener('click', generate);
      planLoading.appendChild(retry);
    }
  }

  // ===== 交互 =====
  document.getElementById('backBtn').addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'index.html';
  });
  document.getElementById('refreshBtn').addEventListener('click', () => {
    if (!(localStorage.getItem('reportPlanCtx') || sessionStorage.getItem('reportPlanCtx'))) {
      showToast('无采集记录，无需重新生成');
      return;
    }
    generate();
  });

  // 初始：优先展示已缓存的计划书（避免重复生成）；无缓存或版本不匹配时才调用生成
  (function initPlan() {
    // 演示模式：?demo=male38 直接展示本地预置计划书（无网可用）
    const demoVer = new URLSearchParams(window.location.search).get('demo');
    if (demoVer && window.PLAN_OFFLINE && window.PLAN_OFFLINE[demoVer]) {
      renderOfflinePlan(demoVer);
      return;
    }
    let currentVersion = '';
    try {
      const raw = localStorage.getItem('reportPlanCtx') || sessionStorage.getItem('reportPlanCtx');
      if (raw) { const c = JSON.parse(raw); currentVersion = c.version || ''; }
    } catch (e) { /* 忽略 */ }
    let cached = null;
    try {
      const rawPlan = localStorage.getItem('reportPlan');
      if (rawPlan) cached = JSON.parse(rawPlan);
    } catch (e) { /* 忽略 */ }
    if (cached && cached.content && cached.promptVersion === PROMPT_VERSION && (!cached.version || !currentVersion || cached.version === currentVersion)) {
      planContent.innerHTML = renderPlan(cached.content);
      planLoading.hidden = true;
      planContent.hidden = false;
      if (planHero) planHero.hidden = false;
      bindFollowupActions();
      fillMeta();
      scrollToTop();
    } else {
      // 缓存过期（提示词已升级或版本不匹配），清掉旧缓存并重新生成
      if (cached) {
        try { localStorage.removeItem('reportPlan'); } catch (e) { /* 忽略 */ }
      }
      generate();
    }
  })();
})();
