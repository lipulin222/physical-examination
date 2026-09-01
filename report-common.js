// 体检报告解读 · 公共交互逻辑
// 各版本页面脚本只需：定义 SYS_INFO，再调用 initReport(SYS_INFO, '默认系统key')
function initReport(SYS_INFO, defaultKey) {
  // 05 生活方式卡片 → 关联 03 系统 key（用于取该系统的 lab 指标等上下文；病症名从卡片"针对"行动态读取）
  const LIFESTYLE_SYSTEM = {
    male38: {
      'lifestyle-diet': 'heart',
      'lifestyle-exercise': 'heart',
      'lifestyle-alcohol': 'liver'
    },
    female36: {
      'lifestyle-diet': 'blood',
      'lifestyle-exercise': 'heart',
      'lifestyle-iron': 'blood'
    },
    child8: {
      'lifestyle-diet': 'growth',
      'lifestyle-exercise': 'growth',
      'lifestyle-oral': 'oral'
    },
    elder68: {
      'lifestyle-exercise': 'bone',
      'lifestyle-diet': 'heart',
      'lifestyle-kidney': 'kidney'
    },
    lichenghua: {
      'lifestyle-diet': 'endo',
      'lifestyle-exercise': 'endo',
      'lifestyle-heart': 'heart',
      'lifestyle-kidney': 'kidney'
    },
    lipulin: {
      'lifestyle-diet': 'bone',
      'lifestyle-exercise': 'bone',
      'lifestyle-heart': 'heart'
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // 04 模块：趋势图标切换
    const trendTabs = document.querySelectorAll('.trend__tab');
    const trendPanels = document.querySelectorAll('.trend__panel');
    trendTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.trend;
        trendTabs.forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        trendPanels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === key));
      });
    });

    // 03 模块：图片热区 → 显示系统详情解读
    const zones = document.querySelectorAll('.sysmap__zone');
    const detailBox = document.getElementById('sysDetail');
    const detailName = document.getElementById('sysDetailName');
    const detailBadge = document.getElementById('sysDetailBadge');
    const detailMetrics = document.getElementById('sysDetailMetrics');
    const detailNote = document.getElementById('sysDetailNote');
    const overallBlock = document.getElementById('overallBlock');
    const overallDot = document.getElementById('overallDot');
    const sysDetailOverall = document.getElementById('sysDetailOverall');
    const descBlock = document.getElementById('descBlock');
    const sysDetailDesc = document.getElementById('sysDetailDesc');
    const extraDescBlock = document.getElementById('extraDescBlock');
    const sysDetailExtra = document.getElementById('sysDetailExtra');
    const metricsTitle = document.getElementById('metricsTitle');
    const interpretTitle = document.getElementById('interpretTitle');
    const sysDetailCtaBlock = document.getElementById('sysDetailCtaBlock');
    const sysDetailCta = document.getElementById('sysDetailCta');
    const sysDetailAiCta = document.getElementById('sysDetailAiCta');

    // 当前打开的 03 系统 key（供 AI深度解析跳转携带上下文）
    let currentKey = defaultKey;

    // 渲染段落（支持 **粗体** 标记）
    const renderParas = (container, paras) => {
      container.innerHTML = '';
      paras.forEach((p) => {
        const para = document.createElement('p');
        para.innerHTML = p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        container.appendChild(para);
      });
    };

    // 移除所有正在显示的指标问号气泡
    const clearTipPops = () => {
      document.querySelectorAll('.sysmap__metric-tip-pop').forEach((t) => t.remove());
    };

    // 指标 flag 的语义化颜色分类：正常→绿、临界/接近→黄、异常→橙红
    const flagTone = (flag) => {
      if (/正常|—|无异常|良好|未见明显/.test(flag)) return 'is-good';
      if (/临界|接近|高值|低值|尚可|中上|边缘|轻微|轻度/.test(flag)) return 'is-mid';
      return 'is-warn';
    };

    // 渲染一组指标
    const renderMetrics = (list, container) => {
      container.innerHTML = '';
      list.forEach((m) => {
        const li = document.createElement('li');
        li.className = 'sysmap__metric';

        const name = document.createElement('span');
        name.className = 'sysmap__metric-name';
        if (m.tip) {
          name.innerHTML = '<span>' + m.name + '</span><button type="button" class="sysmap__metric-tip" data-tip="' + m.tip + '" title="' + m.tip + '" aria-label="解释缩写">?</button>';
        } else {
          name.textContent = m.name;
        }

        const val = document.createElement('span');
        val.className = 'sysmap__metric-val';
        val.textContent = m.value;

        const flag = document.createElement('span');
        flag.className = 'sysmap__metric-flag ' + flagTone(m.flag);
        flag.textContent = m.flag;

        const normal = document.createElement('span');
        normal.className = 'sysmap__metric-normal';
        normal.textContent = m.normal;

        li.appendChild(name);
        li.appendChild(val);
        li.appendChild(flag);
        li.appendChild(normal);
        container.appendChild(li);
      });
    };

    // 打开某个系统的详情解读（scroll=true 时滚动到详情区）
    const openDetail = (key, scroll = true) => {
      const info = SYS_INFO[key];
      if (!info) return;
      currentKey = key;
      zones.forEach((z) => z.classList.remove('is-active'));
      document.querySelector(`.sysmap__zone[data-key="${key}"]`)?.classList.add('is-active');
      clearTipPops();

      detailName.textContent = info.name;
      detailBadge.textContent = info.status;
      const tone = info.tone || (info.warn ? 'warn' : 'good');
      detailBadge.className = 'sysmap__detail-badge is-' + tone;

      // 整体状态（可选）
      if (info.overall) {
        overallBlock.hidden = false;
        overallDot.className = 'sysmap__overall-dot is-' + info.overall.color;
        sysDetailOverall.textContent = info.overall.text;
      } else {
        overallBlock.hidden = true;
      }

      // 指标前描述（可选）
      if (info.desc && info.desc.length) {
        descBlock.hidden = false;
        renderParas(sysDetailDesc, info.desc);
      } else {
        descBlock.hidden = true;
      }

      // 重置块可见性
      const metricsWrap = metricsTitle.closest('.sysmap__detail-block');
      const noteWrap = interpretTitle.closest('.sysmap__detail-block');
      metricsWrap.hidden = false;
      noteWrap.hidden = false;
      extraDescBlock.hidden = true;
      extraDescBlock.querySelectorAll('.sysmap__metrics').forEach((el) => el.remove());

      // 第一组指标
      if (info.metrics && info.metrics.length) {
        if (info.metricsTitle) {
          metricsTitle.textContent = info.metricsTitle;
          metricsTitle.style.display = '';
        } else {
          metricsTitle.style.display = 'none';
        }
        renderMetrics(info.metrics, detailMetrics);
      } else {
        metricsWrap.hidden = true;
      }

      // 指标后补充描述（可选，作为第二组的标题/分隔）
      if (info.extraDesc && info.extraDesc.length) {
        extraDescBlock.hidden = false;
        renderParas(sysDetailExtra, info.extraDesc);
      }

      // 第二组指标（可选，如内分泌的甲状腺功能/甲状腺结节）
      if (info.metrics2 && info.metrics2.length) {
        const list = document.createElement('ul');
        list.className = 'sysmap__metrics';
        renderMetrics(info.metrics2, list);
        extraDescBlock.appendChild(list);
      }

      // 解读标题 + 段落
      if (info.paragraphs && info.paragraphs.length) {
        interpretTitle.textContent = info.interpretTitle || '解读';
        renderParas(detailNote, info.paragraphs);
      } else {
        noteWrap.hidden = true;
      }

      // 系统级 CTA 按钮组（按 info.cta 决定显隐，两个按钮文案固定）
      if (info.cta) {
        sysDetailCtaBlock.hidden = false;
      } else {
        sysDetailCtaBlock.hidden = true;
      }

      detailBox.hidden = false;
      if (scroll) detailBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    zones.forEach((zone) => {
      zone.addEventListener('click', () => openDetail(zone.dataset.key));
    });

    // 02 重点问题卡：查看详情 → 打开 03 对应系统详情并直接滚动到详情卡
    document.querySelectorAll('.issue__link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openDetail(link.dataset.key, false);
        // 等 DOM 更新后再滚动，详情卡置于视口顶部，总览图留在上方
        requestAnimationFrame(() => {
          detailBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    });

    // 需求：按实际情况判断是否需要面诊——SYS_INFO 中配置了 doctor 的系统（如儿童龋齿应立刻看牙、贫血应就医评估、颈动脉斑块应就诊评估等），
    // 在 02 重点问题对应卡片增加"预约医生面诊"按钮；未配置 doctor 的系统保留原逻辑，不出现该按钮
    document.querySelectorAll('.issue').forEach((card) => {
      const link = card.querySelector('.issue__link');
      if (!link || !link.dataset.key || !SYS_INFO[link.dataset.key]) return;
      const info = SYS_INFO[link.dataset.key];
      if (!info.doctor || card.querySelector('.issue__doctor-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'issue__doctor-btn';
      btn.textContent = typeof info.doctor === 'string' ? info.doctor : '预约医生面诊';
      btn.addEventListener('click', () => alert('已为您生成医生面诊预约意向，请确认预约时间与科室。'));
      card.appendChild(btn);
    });

    // 详情卡底部 CTA 按钮：跳转到专项检查预约
    sysDetailCta.addEventListener('click', () => {
      alert('已为您生成专项检查预约意向，请确认预约信息。');
    });

    // 从 02 卡片标题取病症名（03 详情卡没有独立标题时使用）
    const getIssueTitle = (key) => {
      const link = document.querySelector(`.issue__link[data-key="${key}"]`);
      if (!link) return '';
      const card = link.closest('.issue');
      const title = card && card.querySelector('.issue__summary');
      return title ? title.textContent.trim() : '';
    };

    // 保存跳转上下文到 localStorage（跨标签页、关闭后仍保留），供 agent 页构建 System Prompt
    const saveReportCtx = (key, diseaseOverride) => {
      const info = SYS_INFO[key];
      const disease = diseaseOverride || getIssueTitle(key) || (info && info.name) || '健康问题';
      const payload = JSON.stringify({
        profile: window.REPORT_PROFILE || '',
        disease,
        key,
        lab: (info && info.lab) || null
      });
      localStorage.setItem('reportCtx', payload);
      // 兼容旧逻辑：同时写 sessionStorage
      try { sessionStorage.setItem('reportCtx', payload); } catch (e) { /* 忽略 */ }
    };

    // 详情卡底部 AI 深度解析按钮：携带当前系统上下文跳转到智能体对话页
    sysDetailAiCta.addEventListener('click', () => {
      saveReportCtx(currentKey);
      window.location.href = 'agent-page/index.html';
    });

    // 05 部分：健康改善计划——用"计划书摘要"替代旧的生活方式卡片
    // 摘要取计划书前 300 字，点击"查看详情"进入计划书页；无计划书时引导定制
    const buildPlanSummary = () => {
      const sec05 = Array.from(document.querySelectorAll('section.module')).find((s) => {
        const num = s.querySelector('.module__num');
        return num && num.textContent.trim() === '05';
      });
      if (!sec05 || sec05.querySelector('.plan-summary')) return;
      // 隐藏旧的生活方式卡片与旧按钮（内容已由计划书摘要替代）
      sec05.querySelectorAll('.lifestyle, .lifestyle__deep-cta, .module__head-btn').forEach((el) => { el.style.display = 'none'; });

      const card = document.createElement('article');
      card.className = 'lifestyle plan-summary';
      card.innerHTML =
        '<header class="lifestyle__head">' +
          '<span class="lifestyle__ico">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 8v13H3V8"/><path d="M12 8v5"/><path d="M9 13h6"/><path d="M7 16h10"/></svg>' +
          '</span>' +
          '<h3 class="lifestyle__title">您的专属健康改善计划</h3>' +
        '</header>' +
        '<p class="lifestyle__p" id="planSummaryText">正在读取您的健康改善计划…</p>' +
        '<div class="plan-summary__actions">' +
          '<button type="button" class="lifestyle__cta" id="planDetailBtn">查看详情</button>' +
          '<button type="button" class="lifestyle__cta" id="planGenBtn" style="display:none">开始定制计划</button>' +
        '</div>';
      sec05.appendChild(card);

      const planSummaryText = card.querySelector('#planSummaryText');
      const planDetailBtn = card.querySelector('#planDetailBtn');
      const planGenBtn = card.querySelector('#planGenBtn');

      const getPlanContent = () => {
        try {
          const raw = localStorage.getItem('reportPlan');
          if (raw) { const c = JSON.parse(raw); if (c && c.content) return c.content; }
        } catch (e) { /* 忽略 */ }
        if (window.PLAN_OFFLINE && window.PLAN_OFFLINE[window.REPORT_PROFILE]) {
          return window.PLAN_OFFLINE[window.REPORT_PROFILE];
        }
        return '';
      };
      const toPlainText = (md) => String(md)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\{\{[A-Z_]+\}\}/g, ' ')
        .replace(/^#{1,4}\s+/gm, '')
        .replace(/^>+\s?/gm, '')
        .replace(/^[-*]\s+/gm, '')
        .replace(/^\d+[.、)]\s+/gm, '')
        .replace(/\|/g, ' ')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\s*\n\s*\n\s*/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();
      const fillSummary = () => {
        const content = getPlanContent();
        if (!content) {
          planSummaryText.textContent = '您的专属健康改善计划尚未生成，点击下方按钮开始定制。';
          planDetailBtn.style.display = 'none';
          planGenBtn.style.display = '';
          return;
        }
        const plain = toPlainText(content);
        // 从"结合本次体检"（健康画像正文）开始展示，而不是从头复制计划书
        const startIdx = plain.indexOf('结合本次体检');
        const body = startIdx > 0 ? plain.slice(startIdx) : plain;
        planSummaryText.textContent = body.length > 300 ? body.slice(0, 300) + '…' : body;
        planDetailBtn.style.display = '';
        planGenBtn.style.display = 'none';
      };
      planDetailBtn.addEventListener('click', () => { window.location.href = 'agent-page/plan.html'; });
      planGenBtn.addEventListener('click', () => {
        saveReportCtx(defaultKey, '健康管理');
        window.location.href = 'agent-page/index.html';
      });
      fillSummary();
    };

    // 从计划书页生成后切回本页时，自动刷新摘要
    const refreshPlanSummary = () => {
      const text = document.getElementById('planSummaryText');
      if (!text) return;
      let content = '';
      try {
        const raw = localStorage.getItem('reportPlan');
        if (raw) { const c = JSON.parse(raw); if (c && c.content) content = c.content; }
      } catch (e) { /* 忽略 */ }
      if (!content && window.PLAN_OFFLINE && window.PLAN_OFFLINE[window.REPORT_PROFILE]) {
        content = window.PLAN_OFFLINE[window.REPORT_PROFILE];
      }
      const detail = document.getElementById('planDetailBtn');
      const gen = document.getElementById('planGenBtn');
      if (!content) {
        text.textContent = '您的专属健康改善计划尚未生成，点击下方按钮开始定制。';
        if (detail) detail.style.display = 'none';
        if (gen) gen.style.display = '';
        return;
      }
      const plain = String(content)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\{\{[A-Z_]+\}\}/g, ' ')
        .replace(/^#{1,4}\s+/gm, '')
        .replace(/^>+\s?/gm, '')
        .replace(/^[-*]\s+/gm, '')
        .replace(/^\d+[.、)]\s+/gm, '')
        .replace(/\|/g, ' ')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\s*\n\s*\n\s*/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();
      // 从"结合本次体检"（健康画像正文）开始展示
      const startIdx = plain.indexOf('结合本次体检');
      const body = startIdx > 0 ? plain.slice(startIdx) : plain;
      text.textContent = body.length > 300 ? body.slice(0, 300) + '…' : body;
      if (detail) detail.style.display = '';
      if (gen) gen.style.display = 'none';
    };
    buildPlanSummary();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshPlanSummary();
    });
    window.addEventListener('focus', refreshPlanSummary);

    // 05 部分：卡片内"AI深度建议"按钮（李璞璘/李承华等旧版页面保留）
    // 病症从卡片"针对"行动态读取，系统 key 由映射表提供
    document.querySelectorAll('.lifestyle__more').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.lifestyle');
        const key = (LIFESTYLE_SYSTEM[window.REPORT_PROFILE] || {})[card ? card.id : ''] || currentKey;
        const targetEl = card ? card.querySelector('.lifestyle__target') : null;
        const targetText = targetEl ? targetEl.textContent.replace(/^针对[：:]\s*/, '').trim() : '';
        saveReportCtx(key, targetText);
        window.location.href = 'agent-page/index.html';
      });
    });

    // 页面加载时默认打开指定系统（不滚动）
    openDetail(defaultKey, false);

    // 指标缩写问号：点击弹出全称气泡
    document.addEventListener('click', (e) => {
      const tipBtn = e.target.closest('.sysmap__metric-tip');
      if (tipBtn) {
        clearTipPops();
        const pop = document.createElement('span');
        pop.className = 'sysmap__metric-tip-pop';
        pop.textContent = tipBtn.dataset.tip;
        tipBtn.appendChild(pop);
      } else {
        clearTipPops();
      }
    });
  });
}
