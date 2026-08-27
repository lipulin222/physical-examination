// 体检报告解读 · 交互脚本（老年版）
window.REPORT_PROFILE = 'elder68';

const SYS_INFO = {
  heart: {
    name: '心血管系统', status: '需关注', warn: true,
    overall: { text: '血管已出现斑块，需继续管理血压血脂', color: 'warn' },
    cta: '预约心血管检查',
    desc: [
      '高血压 8 年、高血脂 5 年，长期服用降压药和降脂药。颈动脉超声发现右侧分叉处一枚斑块（约 8×2.1 毫米），管腔未见明显狭窄。'
    ],
    metricsTitle: '主要指标',
    metrics: [
      { name: '血压', value: '136/78 mmHg', flag: '控制尚可', normal: '正常值 <140/90' },
      { name: '总胆固醇', value: '5.18 mmol/L', flag: '正常', normal: '正常值 <5.2' },
      { name: 'LDL-C', value: '2.86 mmol/L', flag: '正常', normal: '正常值 <3.4' },
      { name: 'HDL-C', value: '1.28 mmol/L', flag: '↓', normal: '正常值 ≥1.3' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '血管里已经长了“斑块”（像水管内壁的水垢），目前水管还没堵、也没发生过心脑血管事件。重点是继续管好血压、血脂和体重，别再让它长大；不要自行停药，必要时请医生评估降脂目标。'
    ],
    // 供 AI 深度解析使用的结构化心血管指标块
    lab: {
      title: '血压血脂指标',
      indicators: [
        { name: '血压', value: '136/78 mmHg', flag: '控制尚可', normal: '正常值 <140/90' },
        { name: '总胆固醇', value: '5.18 mmol/L', flag: '正常', normal: '正常值 <5.2' },
        { name: 'LDL-C', value: '2.86 mmol/L', flag: '正常', normal: '正常值 <3.4' },
        { name: 'HDL-C', value: '1.28 mmol/L', flag: '↓', normal: '正常值 ≥1.3' }
      ],
      analysisText: '颈动脉超声发现右侧分叉处一枚斑块（约 8×2.1 毫米），管腔未见明显狭窄。血压控制尚可，血脂基本达标，但"好胆固醇"略低。重点是继续管好血压、血脂和体重，别再让斑块长大；不要自行停药，必要时请医生评估降脂目标。'
    }
  },
  bone: {
    name: '骨骼肌肉', status: '需关注', warn: true,
    overall: { text: '骨量减少，跌倒风险升高', color: 'warn' },
    cta: '预约骨科检查',
    metricsTitle: '骨密度',
    metrics: [
      { name: '腰椎 T 值', value: '-1.9', flag: '骨量减少', normal: '骨量减少，未到骨质疏松' },
      { name: '股骨颈 T 值', value: '-2.1', flag: '骨量减少', normal: '骨量减少，未到骨质疏松' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '骨头比年轻时“脆”了一些，属于骨量减少，还没到骨质疏松。加上腿劲不如从前，摔倒的风险在增加。现在开始每天走动、做点力量锻炼、注意补钙和维生素 D，并做好防跌倒，比“躺着静养”更护骨头。'
    ]
  },
  kidney: {
    name: '肾与泌尿', status: '需关注', warn: true,
    overall: { text: '过滤功能略下降，需复查趋势', color: 'warn' },
    cta: '预约肾功能检查',
    metricsTitle: '肾功能指标',
    metrics: [
      { name: '肌酐', value: '91 μmol/L', flag: '↑', normal: '正常值 45–84 μmol/L' },
      { name: 'eGFR', tip: '估算肾小球滤过率', value: '57 mL/min/1.73m²', flag: '↓', normal: '正常值 >90' },
      { name: '尿素氮', value: '7.2 mmol/L', flag: '轻度↑', normal: '正常值 3.2–7.1 mmol/L' },
      { name: '尿常规', value: '正常', flag: '正常', normal: '—' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '肾脏是身体的“过滤器”，这次显示过滤功能比从前弱了一点。单看一次还不能说得了肾病，年纪大、血压高、喝水少都可能影响它。重点是过一阵再复查一次、看趋势，同时别乱吃伤肾的药，尤其止痛药。'
    ]
  },
  lung: {
    name: '呼吸系统', status: '需关注', warn: true,
    overall: { text: '肺部小结节，定期复查', color: 'warn' },
    cta: '预约呼吸科检查',
    desc: [
      '胸部 CT 提示：右肺上叶见实性微小结节，约 5×4 毫米，边界尚清，双肺未见明显活动性炎症。'
    ],
    metrics: [],
    interpretTitle: '解读',
    paragraphs: [
      '肺里发现一个约 5 毫米的小点，边界清楚、没有明显坏迹象，绝大多数这样的结节是良性的，不等于肺癌。不需要紧张，建议带片子到呼吸科让医生看一眼，按要求过段时间再拍一次，看它有没有变化。'
    ]
  },
  endo: {
    name: '内分泌代谢', status: '需关注', warn: true,
    overall: { text: '体重偏重、血糖临界', color: 'warn' },
    cta: '预约内分泌检查',
    metricsTitle: '主要指标',
    metrics: [
      { name: 'BMI', value: '25.6 kg/m²', flag: '超重', normal: '正常值 18.5–23.9' },
      { name: '腰围', value: '88 cm', flag: '偏高', normal: '女性 <85 cm' },
      { name: '空腹血糖', value: '5.92 mmol/L', flag: '正常高值', normal: '正常值 3.9–6.1' },
      { name: 'HbA1c', tip: '糖化血红蛋白', value: '5.8%', flag: '正常', normal: '正常值 <6.0%' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '体重和腰围偏高，血糖虽还没到糖尿病范围，但已接近上限。继续坚持饮食和体重管理，就能把血糖风险控制住。'
    ]
  },
  liver: {
    name: '消化系统', status: '良好', warn: false,
    overall: { text: '肝功能正常、无脂肪肝', color: 'good' },
    metricsTitle: '肝功能指标',
    metrics: [
      { name: 'ALT', tip: '丙氨酸氨基转移酶 / 谷丙转氨酶', value: '24 U/L', flag: '正常', normal: '正常值 7–40 U/L' },
      { name: 'AST', tip: '天冬氨酸氨基转移酶 / 谷草转氨酶', value: '25 U/L', flag: '正常', normal: '正常值 13–35 U/L' },
      { name: 'GGT', tip: 'γ-谷氨酰转移酶 / 谷氨酰转肽酶', value: '31 U/L', flag: '正常', normal: '正常值 7–45 U/L' },
      { name: '白蛋白', value: '43 g/L', flag: '正常', normal: '正常值 40–55 g/L' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '肝功能指标正常，腹部超声未见脂肪肝。'
    ]
  },
  blood: {
    name: '血液与营养', status: '良好', warn: false,
    overall: { text: '血常规正常、无贫血', color: 'good' },
    metricsTitle: '重点指标',
    metrics: [
      { name: '血红蛋白', value: '126 g/L', flag: '正常', normal: '无明显贫血' },
      { name: '血常规', value: '正常', flag: '正常', normal: '—' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '血常规主要指标均在正常范围，没有发现明显贫血或感染相关异常。'
    ]
  }
};

initReport(SYS_INFO, 'heart');
