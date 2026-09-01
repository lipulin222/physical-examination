// 体检报告解读 · 公共交互逻辑
// 各版本页面脚本只需：定义 SYS_INFO，再调用 initReport(SYS_INFO, '默认系统key')
function initReport(SYS_INFO, defaultKey) {
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
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
    // 轻提示 Toast（替代原生 alert，体验更友好）
    let toastEl = null;
    const showToast = (msg) => {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'rc-toast';
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = msg;
      toastEl.classList.add('is-visible');
      clearTimeout(toastEl._t);
      toastEl._t = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
    };

    document.querySelectorAll('.issue').forEach((card) => {
      const link = card.querySelector('.issue__link');
      if (!link || !link.dataset.key || !SYS_INFO[link.dataset.key]) return;
      const info = SYS_INFO[link.dataset.key];
      if (!info.doctor || card.querySelector('.issue__doctor-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'issue__doctor-btn';
      btn.textContent = typeof info.doctor === 'string' ? info.doctor : '预约医生面诊';
      btn.addEventListener('click', () => showToast('已为您生成医生面诊预约意向，请确认预约时间与科室。'));
      card.appendChild(btn);
    });

    // 详情卡底部 CTA 按钮：跳转到专项检查预约
    sysDetailCta.addEventListener('click', () => {
      showToast('已为您生成专项检查预约意向，请确认预约信息。');
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

    // 05 部分：计划书按钮——未生成计划书时显示"AI深度建议/深度定制"（进入 agent 采集），
    // 已生成计划书时自动切换为"查看健康计划书/查看完整版"（直接查看）
    const btnBig = document.querySelector('.lifestyle__deep-cta[data-plan]');
    const btnSmall = document.querySelector('.module__head-btn[data-plan]');
    const hasPlan = () => {
      try { return !!localStorage.getItem('reportPlan'); } catch (e) { return false; }
    };

    const openPlanView = () => {
      if (hasPlan()) {
        window.location.href = 'agent-page/plan.html';
      } else {
        saveReportCtx(defaultKey, '健康管理');
        window.location.href = 'agent-page/index.html';
      }
    };

    // 点击监听只绑定一次；文案在页面加载与切回时动态同步
    const bindPlanButtons = () => {
      if (btnBig) btnBig.addEventListener('click', openPlanView);
      if (btnSmall) btnSmall.addEventListener('click', openPlanView);
    };
    const syncPlanText = () => {
      const plan = hasPlan();
      if (btnBig) btnBig.textContent = plan ? '查看健康计划书' : 'AI深度建议';
      if (btnSmall) btnSmall.textContent = plan ? '查看完整版' : '深度定制';
    };
    bindPlanButtons();
    syncPlanText();
    // 从 agent / 计划书页切回本页时，自动同步按钮文案（无需刷新）
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncPlanText();
    });
    window.addEventListener('focus', syncPlanText);

    // 05 生活干预方向卡片内的"制定个人健康改善计划"按钮：进入 agent 并直接呼起计划书制作流程
    const planOfferBtn = document.querySelector('#planOfferBtn');
    if (planOfferBtn) {
      planOfferBtn.addEventListener('click', () => {
        saveReportCtx(defaultKey, '健康管理');
        window.location.href = 'agent-page/index.html?plan=1';
      });
    }

    // 06 随访计划：根据 SYS_INFO 各系统的 recheck 配置动态生成（按体检实际情况）
    // 06 随访计划：按 4 个结构化部分动态生成
    //   01 日常数据记录｜02 1个月后线上问卷随访｜03 3个月后线下复查｜04 6个月后线下复查
    const buildFollowup = () => {
      const wrap = document.querySelector('#followupWrap');
      if (!wrap || !SYS_INFO) return;
      // 收集各系统的 recheck，并按时间归类到四个部分
      const buckets = { daily: [], quick: [], q3m: [], q6m: [] };
      Object.keys(SYS_INFO).forEach((key) => {
        const info = SYS_INFO[key];
        if (!info || !info.recheck) return;
        (Array.isArray(info.recheck) ? info.recheck : [info.recheck]).forEach((r) => {
          const t = r.time || '';
          let group;
          if (/每周|每天|每日/.test(t)) group = 'daily';
          else if (/尽快/.test(t)) group = 'quick';
          else if (/3[–-]6 个月/.test(t)) group = 'q3m';
          else if (/6|1 年|1年/.test(t)) group = 'q6m';
          else group = 'q3m';
          buckets[group].push({ items: r.items || [], note: r.note || '' });
        });
      });
      const flatItems = (arr) => { const out = []; arr.forEach((p) => { out.push(...p.items); }); return out; };
      const flatNote = (arr) => arr.map((p) => p.note).filter(Boolean).join(' ');

      let html = '';

      // 01 日常数据记录
      const dailyItems = flatItems(buckets.daily);
      html += '<div class="fu-block">' +
        '<h3 class="fu-block__title"><span class="fu-num">01</span>日常数据记录</h3>' +
        '<p class="lifestyle__p">每周固定时间记录体重、腰围等指标，养成持续关注自身健康状况的习惯，及时掌握变化趋势。</p>';
      if (dailyItems.length) {
        html += '<ul class="lifestyle__list">' + dailyItems.map((i) => '<li>' + escapeHtml(i) + '</li>').join('') + '</ul>';
      }
      if (flatNote(buckets.daily)) html += '<p class="lifestyle__p">' + escapeHtml(flatNote(buckets.daily)) + '</p>';
      html += '<button type="button" class="fu-btn fu-btn--outline" data-fu-device>从设备导入数据</button>' +
      '</div>';

      // 02 1 个月后 · 线上问卷随访
      html += '<div class="fu-block">' +
        '<h3 class="fu-block__title"><span class="fu-num">02</span>1 个月后 · 线上问卷随访</h3>' +
        '<p class="lifestyle__p">通过线上健康问卷，评估您在生活干预后健康状态是否有提升，并了解您的感受与心理状态，判断当前方案是否适合您、是否需要调整。</p>' +
        '<label class="fu-check"><span class="fu-check__text">1 个月后提醒我线上随访</span><span class="fu-check__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span><span class="fu-check__box"></span><input type="checkbox" data-fu-remind /></label>' +
      '</div>';

      // 03 3 个月后 · 线下指标复查
      const q3Items = flatItems(buckets.q3m);
      html += '<div class="fu-block">' +
        '<h3 class="fu-block__title"><span class="fu-num">03</span>3 个月后 · 线下指标复查</h3>';
      if (buckets.quick.length) {
        html += '<p class="fu-block__warn"><b>尽快完成：</b>' + escapeHtml(flatItems(buckets.quick).join('；')) + '</p>';
      }
      if (q3Items.length) {
        // 把每项复查对应的「重点观察」说明直接拼到对应项目后面，避免每项重复前缀
        const q3ByItem = {};
        buckets.q3m.forEach((p) => (p.items || []).forEach((it) => { if (p.note && !q3ByItem[it]) q3ByItem[it] = p.note; }));
        html += '<ul class="lifestyle__list">' + q3Items.map((i) => {
          const note = q3ByItem[i] ? q3ByItem[i].replace(/^重点观察[：:]\s*/, '').trim() : '';
          return '<li>' + escapeHtml(i) + (note ? '<span class="fu-item__note">（关注：' + escapeHtml(note) + '）</span>' : '') + '</li>';
        }).join('') + '</ul>';
      } else {
        html += '<p class="lifestyle__p">按医生建议安排复查，评估干预后的改善情况。</p>';
      }
      html += '<button type="button" class="fu-btn" data-fu-appt>预约线下复查</button>' +
      '</div>';

      // 04 6 个月后 · 线下指标复查
      const q6Items = flatItems(buckets.q6m);
      html += '<div class="fu-block">' +
        '<h3 class="fu-block__title"><span class="fu-num">04</span>6 个月后 · 线下指标复查</h3>';
      if (q6Items.length) {
        const q6ByItem = {};
        buckets.q6m.forEach((p) => (p.items || []).forEach((it) => { if (p.note && !q6ByItem[it]) q6ByItem[it] = p.note; }));
        html += '<ul class="lifestyle__list">' + q6Items.map((i) => {
          const note = q6ByItem[i] ? q6ByItem[i].replace(/^重点观察[：:]\s*/, '').trim() : '';
          return '<li>' + escapeHtml(i) + (note ? '<span class="fu-item__note">（关注：' + escapeHtml(note) + '）</span>' : '') + '</li>';
        }).join('') + '</ul>';
      } else {
        html += '<p class="lifestyle__p">视干预效果与医生建议安排后续复查。</p>';
      }
      html += '<button type="button" class="fu-btn" data-fu-appt>预约线下复查</button>' +
      '</div>';

      wrap.innerHTML = html;

      // 交互绑定
      wrap.querySelectorAll('[data-fu-device]').forEach((b) => {
        b.addEventListener('click', () => showToast('正在从设备同步您的日常健康数据…'));
      });
      wrap.querySelectorAll('[data-fu-remind]').forEach((c) => {
        c.addEventListener('change', () => {
          showToast(c.checked ? '已为您开启 1 个月后线上随访提醒' : '已取消线上随访提醒');
        });
      });
      wrap.querySelectorAll('[data-fu-appt]').forEach((b) => {
        b.addEventListener('click', () => showToast('已为您生成线下复查预约意向，请确认预约时间与科室。'));
      });
    };
    buildFollowup();

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
