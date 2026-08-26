// 体检报告解读 · 交互脚本（女性版）
window.REPORT_PROFILE = 'female36';

const SYS_INFO = {
  endo: {
    name: '内分泌系统', status: '需关注', warn: true,
    overall: { text: '甲状腺功能正常，左叶发现小结节', color: 'warn' },
    cta: '预约内分泌检查',
    metricsTitle: '甲状腺功能',
    metrics: [
      { name: 'TSH', tip: '促甲状腺激素', value: '2.34 μIU/mL', flag: '正常', normal: '正常值 0.27–4.2 μIU/mL' },
      { name: 'FT4', tip: '游离甲状腺素', value: '15.8 pmol/L', flag: '正常', normal: '正常值 12–22 pmol/L' },
      { name: 'FT3', tip: '游离三碘甲状腺原氨酸', value: '4.6 pmol/L', flag: '正常', normal: '正常值 3.1–6.8 pmol/L' }
    ],
    extraDesc: ['甲状腺超声提示：'],
    metrics2: [
      { name: '左叶结节', value: '5×4 mm', flag: 'TI-RADS 3 类', normal: '良性可能性大，建议定期复查' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '甲状腺功能指标都在正常范围，功能没有问题。',
      '超声发现左叶有一枚约 5×4 毫米的小结节，分级 3 类，绝大多数是良性的，不用紧张。按医生建议定期复查超声、看它有没有变化就行。'
    ]
  },
  heart: {
    name: '心血管系统', status: '需关注', warn: true,
    overall: { text: '血压正常，血脂轻度偏高', color: 'warn' },
    cta: '预约心血管检查',
    desc: [
      '本次血压 118/76 mmHg，心电图未见明显异常。血脂方面：'
    ],
    metricsTitle: '血脂指标',
    metrics: [
      { name: '总胆固醇', value: '5.46 mmol/L', flag: '↑', normal: '正常值 <5.20' },
      { name: 'LDL-C', value: '3.42 mmol/L', flag: '临界', normal: '正常值 <3.40' },
      { name: '甘油三酯', value: '1.46 mmol/L', flag: '正常', normal: '正常值 <1.70' },
      { name: 'HDL-C', value: '1.42 mmol/L', flag: '正常', normal: '正常值 ≥1.3' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '心血管本身没查出问题，主要是血脂轻度偏高。这个阶段完全不用紧张，但值得认真对待——**调整饮食结构、每周规律运动几次**，血脂大多能回到正常，也是给以后的血管健康提前打基础。'
    ]
  },
  blood: {
    name: '血液与营养', status: '需关注', warn: true,
    overall: { text: '存在缺铁性贫血', color: 'warn' },
    cta: '预约血液检查',
    metricsTitle: '血常规与铁代谢',
    metrics: [
      { name: '血红蛋白', value: '112 g/L', flag: '↓', normal: '正常值 115–150 g/L' },
      { name: '红细胞', value: '3.78×10¹²/L', flag: '↓', normal: '正常值 3.8–5.1×10¹²/L' },
      { name: 'MCV', tip: '平均红细胞体积', value: '82 fL', flag: '正常下限', normal: '正常值 82–100 fL' },
      { name: '铁蛋白', value: '14 ng/mL', flag: '↓', normal: '正常值 15–150 ng/mL' },
      { name: '血清铁', value: '10.2 μmol/L', flag: '正常', normal: '正常值 7.5–26 μmol/L' },
      { name: '转铁蛋白饱和度', value: '16%', flag: '正常低值', normal: '正常值 15–45%' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '血红蛋白和铁蛋白都偏低，说明身体里的"铁储备"已经见底，造血的原料不够用了。这和吃进来的铁不够、以及每月月经流失铁都有关系。好在程度不算重，**优先通过红肉、动物肝脏、蛋黄和深绿色蔬菜补铁，3 个月后复查**，多数能明显改善。'
    ],
    // 供 AI 深度解析使用的结构化血液/营养指标块
    lab: {
      indicators: [
        { name: '血红蛋白 Hb', value: '112 g/L', flag: '↓', normal: '115–150 g/L' },
        { name: '红细胞计数', value: '3.78×10¹²/L', flag: '↓', normal: '3.8–5.1×10¹²/L' },
        { name: 'MCV', value: '82 fL', flag: '正常下限', normal: '82–100 fL' },
        { name: '铁蛋白 Ferritin', value: '14 ng/mL', flag: '↓', normal: '15–150 ng/mL' },
        { name: '血清铁', value: '10.2 μmol/L', flag: '正常', normal: '7.5–26 μmol/L' },
        { name: '转铁蛋白饱和度', value: '16%', flag: '正常低值', normal: '15–45%' }
      ],
      analysisText: '血红蛋白和铁蛋白都偏低，说明身体里的"铁储备"已经见底，造血的原料不够用了。这和吃进来的铁不够、以及每月月经流失铁都有关系。好在程度不算重，优先通过红肉、动物肝脏、蛋黄和深绿色蔬菜补铁，3 个月后复查，多数能明显改善。'
    }
  },
  kidney: {
    name: '肾与泌尿', status: '良好', warn: false,
    overall: { text: '肾功能正常', color: 'good' },
    metricsTitle: '主要指标',
    metrics: [
      { name: '肌酐', value: '61 μmol/L', flag: '正常', normal: '正常值 45–84 μmol/L' },
      { name: 'eGFR', tip: '估算肾小球滤过率', value: '112 mL/min/1.73m²', flag: '正常', normal: '正常值 >90 mL/min/1.73m²' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '肾功能指标均在正常范围。'
    ]
  },
  lung: {
    name: '呼吸系统', status: '良好', warn: false,
    overall: { text: '未见明显异常', color: 'good' },
    metrics: [],
    interpretTitle: '解读',
    paragraphs: [
      '本次未见需要特别关注的呼吸系统问题。'
    ]
  },
  liver: {
    name: '消化系统', status: '良好', warn: false,
    overall: { text: '肝功能正常', color: 'good' },
    metricsTitle: '肝功能指标',
    metrics: [
      { name: 'ALT', tip: '丙氨酸氨基转移酶 / 谷丙转氨酶', value: '22 U/L', flag: '正常', normal: '正常值 7–40 U/L' },
      { name: 'AST', tip: '天冬氨酸氨基转移酶 / 谷草转氨酶', value: '21 U/L', flag: '正常', normal: '正常值 13–35 U/L' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '肝功能指标均在正常范围，腹部超声未见脂肪肝。'
    ]
  },
  meta: {
    name: '基础代谢', status: '需关注', warn: true,
    cta: '预约代谢相关检查',
    metricsTitle: '主要指标',
    metrics: [
      { name: 'BMI', value: '23.6 kg/m²', flag: '正常高值', normal: '正常值 18.5–23.9' },
      { name: '体重', value: '62 kg', flag: '偏高', normal: '—' },
      { name: '腰围', value: '80 cm', flag: '正常', normal: '女性 <85 cm' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      'BMI 处于正常高值，体重略偏高，暂未达到超重；结合血脂轻度升高，建议控制体重增长速度，保持规律运动与均衡饮食。'
    ]
  },
  repro: {
    name: '生殖系统', status: '良好', warn: false, tone: 'good',
    overall: { text: '妇科超声未见明显异常', color: 'good' },
    desc: [
      '妇科超声提示：子宫大小形态正常，双侧卵巢未见明显异常，盆腔未见明显积液。'
    ],
    metrics: [],
    interpretTitle: '解读',
    paragraphs: [
      '这次妇科超声一切正常，可以放心。保持一年一次的常规妇科检查即可。'
    ]
  }
};

initReport(SYS_INFO, 'meta');
