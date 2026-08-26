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
        flag.className = 'sysmap__metric-flag ' + (m.flag === '正常' ? 'is-good' : (m.flag === '临界' ? 'is-mid' : 'is-warn'));
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

    // 保存跳转上下文到 sessionStorage，供 agent 页构建 System Prompt
    const saveReportCtx = (key, diseaseOverride) => {
      const info = SYS_INFO[key];
      const disease = diseaseOverride || getIssueTitle(key) || (info && info.name) || '健康问题';
      sessionStorage.setItem('reportCtx', JSON.stringify({
        profile: window.REPORT_PROFILE || '',
        disease,
        key,
        lab: (info && info.lab) || null
      }));
    };

    // 详情卡底部 AI 深度解析按钮：携带当前系统上下文跳转到智能体对话页
    sysDetailAiCta.addEventListener('click', () => {
      saveReportCtx(currentKey);
      window.location.href = 'agent-page/index.html';
    });

    // 05 部分 AI深度建议按钮：病症从卡片"针对"行动态读取，系统 key 由映射表提供
    document.querySelectorAll('.lifestyle__more').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.lifestyle');
        const key = (LIFESTYLE_SYSTEM[window.REPORT_PROFILE] || {})[card ? card.id : ''] || currentKey;
        const targetEl = card ? card.querySelector('.lifestyle__target') : null;
        const targetText = targetEl ? targetEl.textContent.replace(/^针对[：:]\s*/, '').trim() : '';
        // disease 传动态读取的"针对"内容；为空时 saveReportCtx 内部自动回退到 02 标题/系统名
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
