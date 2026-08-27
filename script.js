// 体检报告解读 · 交互脚本（男性版）
window.REPORT_PROFILE = 'male38';

const SYS_INFO = {
  endo: {
    name: '内分泌系统', status: '需关注', warn: true,
    overall: { text: '代谢方面需要关注，甲状腺功能正常', color: 'warn' },
    cta: '预约内分泌检查',
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
      '好消息是：目前还没有糖尿病的证据，甲状腺功能也正常。',
      '但要提醒您：结合偏高的 BMI、腰围和血脂，身体已经出现"代谢风险扎堆"的信号——它们往往来自同一个根子：体重和生活方式。现在把体重控制住，未来血糖出问题的风险就能明显下降。'
    ]
  },
  heart: {
    name: '心血管系统', status: '需关注', warn: true,
    overall: { text: '存在代谢相关风险，需要关注', color: 'warn' },
    cta: '预约心血管检查',
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
      '这次心电图、血压都没查出明确问题，但血脂多项超标，相当于给血管壁持续"浇油"——时间长了会结出斑块，心梗、脑梗的风险就是这样一步步升高的。血脂高和超重、肚子大往往是一起来的。好在这些都和生活习惯强相关，**控制体重、管住嘴，血脂是最容易改善的指标之一**。'
    ],
    // 供 AI 深度解析使用的结构化血脂指标块
    lab: {
      title: '血脂指标',
      indicators: [
        { name: '总胆固醇', value: '5.72 mmol/L', flag: '↑', normal: '正常值 <5.20' },
        { name: 'LDL-C', value: '3.56 mmol/L', flag: '↑', normal: '正常值 <3.40' },
        { name: '甘油三酯', value: '2.38 mmol/L', flag: '↑', normal: '正常值 <1.70' },
        { name: 'HDL-C', value: '1.08 mmol/L', flag: '正常', normal: '正常值 男 ≥1.0，偏低对心血管保护作用减弱' }
      ],
      analysisText: '血脂多项超标，相当于给血管壁持续"浇油"，时间长了会结出斑块，心梗、脑梗的风险就是这样一步步升高的。好在这些都和生活习惯强相关，控制体重、管住嘴，血脂是最容易改善的指标之一。'
    }
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
    cta: '预约肝脏检查',
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
      '现在的情况是"影像学脂肪肝 + 肝酶升高"一起出现，结合超重和血脂偏高，最可能的是代谢相关的脂肪性肝病——简单说，就是**油太多，肝脏加班加点也处理不过来**。',
      '不过单凭一次体检还不能完全下定论，如果肝酶持续升高，医生还会帮您排除病毒性肝炎、药物、酒精等其他原因。'
    ],
    // 供 AI 深度解析使用的结构化肝功能指标块
    lab: {
      title: '肝功能指标',
      indicators: [
        { name: 'ALT', tip: '丙氨酸氨基转移酶 / 谷丙转氨酶', value: '68 U/L', flag: '↑', normal: '正常值 5–40 U/L' },
        { name: 'GGT', tip: 'γ-谷氨酰转移酶 / 谷氨酰转肽酶', value: '86 U/L', flag: '↑', normal: '正常值 10–60 U/L' },
        { name: 'AST', tip: '天冬氨酸氨基转移酶 / 谷草转氨酶', value: '38 U/L', flag: '正常', normal: '正常值 8–40 U/L' },
        { name: '总胆红素（TBIL）', value: '正常', flag: '正常', normal: '正常值 3.4–20.5 μmol/L' }
      ],
      analysisText: '腹部超声提示轻度脂肪肝，同时 ALT、GGT 两项肝酶升高，说明肝细胞有轻度损伤。这个阶段完全可逆，重点在减重、少喝酒、规律作息，让肝酶逐渐回落。'
    }
  },
  meta: {
    name: '基础代谢', status: '需关注', warn: true,
    cta: '预约代谢相关检查',
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
      '这次体检显示，您的问题其实可以归到一句话：**以体重增加为核心的一串代谢异常**。超重、肚子大、血脂尿酸偏高、血糖临界，这些都不是孤立的——近 3 年体重从 76 涨到 84kg，加上程序员久坐、运动少、偶尔吃宵夜，根子都在体重和生活方式上。',
      '目前空腹血糖还在正常范围，还没到糖尿病，但已经站在需要主动干预的门口了。'
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

initReport(SYS_INFO, 'meta');
