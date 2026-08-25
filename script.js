// 体检报告解读 · 交互脚本

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
  const SYS_INFO = {
    endo: {
      name: '内分泌系统', status: '需关注', warn: true,
      overall: { text: '代谢方面需要关注，甲状腺功能正常', color: 'warn' },
      metricsTitle: '血糖相关指标',
      metrics: [
        { name: '空腹血糖', value: '6.0 mmol/L', flag: '临界', normal: '正常值 3.9–6.1' },
        { name: 'HbA1c', value: '5.7%', flag: '临界', normal: '正常值 4.0–6.0%' }
      ],
      extraDesc: [
        '甲状腺功能：'
      ],
      metrics2: [
        { name: 'TSH', tip: '促甲状腺激素', value: '2.16 μIU/mL', flag: '正常', normal: '正常值 0.27–4.20 μIU/mL' },
        { name: 'FT3', tip: '游离三碘甲状腺原氨酸', value: '4.8 pmol/L', flag: '正常', normal: '正常值 3.1–6.8 pmol/L' },
        { name: 'FT4', tip: '游离甲状腺素', value: '16.2 pmol/L', flag: '正常', normal: '正常值 12–22 pmol/L' }
      ],
      interpretTitle: '解读',
      paragraphs: [
        '目前没有明确糖尿病证据，甲状腺功能也正常。',
        '但结合 BMI、腰围和血脂异常，已经出现一定的代谢风险聚集。需要控制体重和改善生活方式，降低未来糖代谢进一步异常的风险。'
      ]
    },
    heart: {
      name: '心血管系统', status: '需关注', warn: true,
      overall: { text: '存在代谢相关风险，需要关注', color: 'warn' },
      desc: [
        '本次心电图未见明显异常，血压 132/86 mmHg，没有发现明确的心血管疾病证据。',
        '但血脂方面存在一定异常：'
      ],
      metrics: [
        { name: '总胆固醇', value: '5.72 mmol/L', flag: '↑', normal: '正常值 <5.20' },
        { name: 'LDL-C', value: '3.56 mmol/L', flag: '↑', normal: '正常值 <3.40' },
        { name: '甘油三酯', value: '2.38 mmol/L', flag: '↑', normal: '正常值 <1.70' },
        { name: 'HDL-C', value: '1.08 mmol/L', flag: '正常', normal: '正常值 男 ≥1.0，偏低对心血管保护作用减弱' }
      ],
      interpretTitle: '解读',
      paragraphs: [
        '本次体检虽未发现明确的心血管疾病证据，但血脂谱多项指标超标或处于临界水平，提示动脉粥样硬化风险升高；长期血脂异常可促进脂质在动脉壁沉积及粥样硬化斑块形成，进而增加心肌梗死、缺血性脑卒中等心血管事件风险。血脂异常与超重、腹型肥胖并存，建议通过调整生活方式、控制体重以改善血脂水平。'
      ]
    },
    blood: {
      name: '血液与营养', status: '良好', warn: false,
      overall: { text: '基本正常', color: 'good' },
      metricsTitle: '重点指标',
      metrics: [
        { name: '血红蛋白', value: '正常', flag: '正常', normal: '—' },
        { name: '红细胞', value: '正常', flag: '正常', normal: '—' },
        { name: '白细胞', value: '正常', flag: '正常', normal: '—' },
        { name: '血小板', value: '正常', flag: '正常', normal: '—' }
      ],
      interpretTitle: '解读',
      paragraphs: [
        '血常规主要指标均在参考范围内，没有明确证据提示贫血或明显血液系统异常。'
      ]
    },
    kidney: {
      name: '肾功能与泌尿', status: '良好', warn: false,
      overall: { text: '肾功能正常，尿酸偏高需要关注', color: 'good' },
      metricsTitle: '主要指标',
      metrics: [
        { name: '肌酐', value: '82 μmol/L', flag: '正常', normal: '正常值 男 57–97 μmol/L' },
        { name: 'eGFR', tip: '估算肾小球滤过率', value: '103 mL/min/1.73m²', flag: '正常', normal: '正常值 ≥90 mL/min/1.73m²' },
        { name: '尿素氮', value: '5.6 mmol/L', flag: '正常', normal: '正常值 2.9–7.5 mmol/L' },
        { name: '尿酸（UA）', value: '468 μmol/L', flag: '↑', normal: '正常值 男 208–428 μmol/L' }
      ],
      interpretTitle: '解读',
      paragraphs: [
        '目前肾小球滤过功能正常，未见明显肾功能减退。但血尿酸已处于升高水平，结合超重、饮酒及高嘌呤饮食等因素，未来存在持续升高风险；长期血尿酸升高可诱发痛风急性发作等尿酸盐相关疾病。'
      ]
    },
    lung: {
      name: '呼吸系统', status: '良好', warn: false,
      overall: { text: '未见明显异常', color: 'good' },
      desc: [
        '胸部 CT 提示：双肺未见明显活动性病变，未见明显肺部结节。'
      ],
      metrics: [],
      interpretTitle: '解读',
      paragraphs: [
        '结合目前不吸烟的情况，暂未发现需要特别处理的呼吸系统问题。'
      ]
    },
    liver: {
      name: '肝胆胰与消化', status: '需关注', warn: true,
      overall: { text: '重点关注', color: 'danger' },
      desc: [
        '腹部超声提示：肝脏轻度脂肪浸润。'
      ],
      metricsTitle: '主要肝功能指标',
      metrics: [
        { name: 'ALT', tip: '丙氨酸氨基转移酶 / 谷丙转氨酶', value: '68 U/L', flag: '↑', normal: '正常值 5–40 U/L' },
        { name: 'GGT', tip: 'γ-谷氨酰转移酶 / 谷氨酰转肽酶', value: '86 U/L', flag: '↑', normal: '正常值 10–60 U/L' },
        { name: 'AST', tip: '天冬氨酸氨基转移酶 / 谷草转氨酶', value: '38 U/L', flag: '正常', normal: '正常值 8–40 U/L' },
        { name: '总胆红素（TBIL）', value: '正常', flag: '正常', normal: '正常值 3.4–20.5 μmol/L' }
      ],
      extraDesc: ['胆囊、胰腺、脾脏目前未见明显异常。'],
      interpretTitle: '综合解读',
      paragraphs: [
        '目前存在影像学脂肪肝 + 肝酶升高。结合您超重、血脂异常的情况，需要重点考虑代谢相关脂肪性肝病等可能。',
        '不过，单凭本次体检不能确定肝酶升高的具体原因。如果持续升高，还需要排除病毒性肝炎、药物、酒精等其他因素。'
      ]
    },
    meta: {
      name: '基础代谢', status: '需关注', warn: true,
      metrics: [
        { name: 'BMI', value: '27.4 kg/m²', flag: '↑', normal: '正常值 18.5–23.9' },
        { name: '腰围', value: '96 cm', flag: '↑', normal: '正常值 男 < 90' },
        { name: '甘油三酯', value: '2.38 mmol/L', flag: '↑', normal: '正常值 < 1.70' },
        { name: '总胆固醇', value: '5.72 mmol/L', flag: '↑', normal: '正常值 < 5.20' },
        { name: 'LDL-C', value: '3.56 mmol/L', flag: '↑', normal: '正常值 < 3.40' },
        { name: '尿酸', value: '468 μmol/L', flag: '↑', normal: '正常值 男 208–428' },
        { name: 'HbA1c', value: '5.7%', flag: '临界', normal: '正常值 4.0–6.0%' },
        { name: '空腹血糖', value: '6.0 mmol/L', flag: '临界', normal: '正常值 3.9–6.1' }
      ],
      paragraphs: [
        '本次体检显示，您目前存在超重、腹型肥胖，并伴随血脂、尿酸及糖代谢指标的轻度异常，这些异常并不是孤立的。结合近 3 年体重由 76kg 增加至 84kg、以及您的职业（程序员，久坐）和生活习惯（运动少，偶尔吃宵夜），目前更符合**以体重增加为核心的代谢风险聚集**。',
        '目前空腹血糖仍在正常范围，尚不能认为已经发生糖尿病，但已经到了需要主动干预的阶段。'
      ]
    },
    repro: {
      name: '生殖系统', status: '无数据', warn: false, tone: 'none',
      overall: { text: '本次资料未见明显异常', color: 'none' },
      desc: [
        '本次提供的体检结果中，未包含前列腺超声、前列腺特异性抗原（PSA）或其他男性生殖系统专项检查结果。'
      ],
      metrics: [],
      interpretTitle: '解读',
      paragraphs: [],
      cta: '预约专项检查'
    }
  };

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

    // 第二组指标（可选，如内分泌的甲状腺功能）
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

    // 系统级 CTA 按钮（按 info.cta 决定）
    if (info.cta) {
      sysDetailCtaBlock.hidden = false;
      sysDetailCta.textContent = info.cta;
    } else {
      sysDetailCtaBlock.hidden = true;
    }

    detailBox.hidden = false;
    if (scroll) detailBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  zones.forEach((zone) => {
    zone.addEventListener('click', () => openDetail(zone.dataset.key));
  });

  // 详情卡底部 CTA 按钮：跳转到专项检查预约
  sysDetailCta.addEventListener('click', () => {
    alert('已为您生成专项检查预约意向，请确认预约信息。');
  });

  // 页面加载时默认打开基础代谢（不滚动）
  openDetail('meta', false);

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
