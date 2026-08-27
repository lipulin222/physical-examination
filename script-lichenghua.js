// 体检报告解读 · 交互脚本（李承华 · 66 岁 · 老年男性）
window.REPORT_PROFILE = 'lichenghua';

const SYS_INFO = {
  endo: {
    name: '内分泌代谢', status: '需关注', warn: true,
    overall: { text: '血糖明显升高，需尽快专科就诊', color: 'warn' },
    cta: '预约内分泌检查',
    metricsTitle: '血糖相关指标',
    metrics: [
      { name: '空腹血糖', value: '8.30 mmol/L', flag: '↑↑', normal: '正常值 3.6–6.11' },
      { name: 'HbA1c', tip: '糖化血红蛋白', value: '8.5%', flag: '↑↑', normal: '正常值 4.0–6.0%' },
      { name: '尿葡萄糖', value: '2+', flag: '↑', normal: '正常值 阴性' },
      { name: 'BMI', value: '24.6 kg/m²', flag: '超重', normal: '正常值 18.5–23.9' }
    ],
    extraDesc: [
      '甲状腺：右侧叶实性结节，约 11.4×8.4 mm，TI-RADS 3 级（良性可能性大），建议甲乳专科随诊。'
    ],
    interpretTitle: '解读',
    paragraphs: [
      '这次最需要重视的就是血糖：空腹血糖 8.3、糖化血红蛋白 8.5%、尿里也有葡萄糖，**三项指标一起指向糖尿病，而且最近三个月血糖控制得不理想**。建议尽快到内分泌专科就诊，规范降糖。',
      '把血糖管住，心脑血管、肾脏等并发症的风险才会跟着降下来。甲状腺结节评级 TI-RADS 3 类，良性可能性大，按医嘱定期复查即可，不必紧张。'
    ],
    // 供 AI 深度解析使用的结构化血糖指标块
    lab: {
      title: '血糖指标',
      indicators: [
        { name: '空腹血糖', value: '8.30 mmol/L', flag: '↑↑', normal: '正常值 3.6–6.11' },
        { name: '糖化血红蛋白', value: '8.5%', flag: '↑↑', normal: '正常值 4.0–6.0%' },
        { name: '尿葡萄糖', value: '2+', flag: '↑', normal: '正常值 阴性' }
      ],
      analysisText: '空腹血糖 8.3、糖化血红蛋白 8.5%、尿糖 2+，三项指标一起指向糖尿病，且近三个月血糖控制不理想。建议尽快内分泌专科就诊规范降糖，同时控制体重和饮食，把血糖管住可明显降低心脑血管和肾脏并发症风险。'
    }
  },
  heart: {
    name: '心血管系统', status: '需关注', warn: true,
    overall: { text: '颈动脉多发软斑，心脑血管风险需重视', color: 'warn' },
    cta: '预约心血管检查',
    desc: [
      '心脏装有起搏器（心室起搏心律，起搏器植入术后），本次血压 122/74 mmHg 正常，血脂四项均在正常范围。但双侧颈动脉见多发弱回声"软斑"，左侧较大 2.1 mm、右侧较大 2.5 mm；同型半胱氨酸 27.0 μmol/L 明显偏高。'
    ],
    metricsTitle: '主要指标',
    metrics: [
      { name: '血压', value: '122/74 mmHg', flag: '正常', normal: '正常值 <140/90' },
      { name: '同型半胱氨酸（Hcy）', tip: '同型半胱氨酸', value: '27.0 μmol/L', flag: '↑', normal: '正常值 3–15 μmol/L' },
      { name: '总胆固醇', value: '3.42 mmol/L', flag: '正常', normal: '正常值 3.1–5.2' },
      { name: 'LDL-C', value: '1.75 mmol/L', flag: '正常', normal: '正常值 <3.4' },
      { name: '颈动脉超声', value: '双侧多发软斑', flag: '软斑', normal: '左侧 2.1mm / 右侧 2.5mm' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '血管里已经长了不少"软斑"，就像水管内壁结了不牢固的水垢。软斑性质不稳定，脱落可能堵住血管、引发脑梗等严重后果，加上同型半胱氨酸偏高，**心脑血管的风险要提高警惕**。',
      '好在血压、血脂目前都正常。建议尽早到心血管或神经内科就诊，评估是否需要用药稳定斑块、降低同型半胱氨酸；平时避免猛然回头和剧烈活动。'
    ],
    // 供 AI 深度解析使用的结构化心血管指标块
    lab: {
      title: '心血管相关指标',
      indicators: [
        { name: '血压', value: '122/74 mmHg', flag: '正常', normal: '正常值 <140/90' },
        { name: '同型半胱氨酸', value: '27.0 μmol/L', flag: '↑', normal: '正常值 3–15 μmol/L' },
        { name: '总胆固醇', value: '3.42 mmol/L', flag: '正常', normal: '正常值 3.1–5.2' },
        { name: 'LDL-C', value: '1.75 mmol/L', flag: '正常', normal: '正常值 <3.4' }
      ],
      analysisText: '双侧颈动脉多发软斑（左 2.1mm、右 2.5mm），同型半胱氨酸 27 明显偏高，叠加心脏起搏器术后，心脑血管风险需要重视。血压血脂目前正常。建议尽早心血管/神经内科就诊评估稳定斑块用药，避免猛然回头和剧烈活动。'
    }
  },
  kidney: {
    name: '肾与泌尿', status: '需关注', warn: true,
    overall: { text: '肾小球滤过率偏低，需定期复查趋势', color: 'warn' },
    cta: '预约肾功能检查',
    metricsTitle: '肾功能指标',
    metrics: [
      { name: '肌酐', value: '122 μmol/L', flag: '临界', normal: '正常值 53–123 μmol/L' },
      { name: 'eGFR', tip: '估算肾小球滤过率', value: '55.47 mL/min/1.73m²', flag: '↓', normal: '正常值 >90' },
      { name: '尿素氮', value: '7.23 mmol/L', flag: '正常', normal: '正常值 3.6–9.5 mmol/L' },
      { name: '尿蛋白', value: '弱阳性', flag: '↑', normal: '正常值 阴性' },
      { name: '双肾囊肿', value: '左 0.8cm / 右 1.2cm', flag: '良性', normal: '一般无需处理，定期复查' }
    ],
    extraDesc: [
      '前列腺：切面约 4.6×3.9×2.9 cm，体积增大，考虑前列腺增生。'
    ],
    interpretTitle: '解读',
    paragraphs: [
      '肾脏是身体的"过滤器"，这次显示**过滤功能（eGFR 55.5）明显低于正常，尿里还查到一点蛋白，肌酐也到了上限**，需要认真对待。单看一次还不能下结论，建议近期复查肾功能和尿蛋白、看趋势。',
      '双肾囊肿是常见良性变化，一般不用处理，超过 5 cm 或出现症状再看泌尿外科。前列腺增生是老年常见问题，若出现排尿费力、夜尿多等症状要及时就诊。'
    ],
    // 供 AI 深度解析使用的结构化肾功能指标块
    lab: {
      title: '肾功能指标',
      indicators: [
        { name: '肌酐', value: '122 μmol/L', flag: '临界', normal: '正常值 53–123 μmol/L' },
        { name: 'eGFR', value: '55.47 mL/min/1.73m²', flag: '↓', normal: '正常值 >90' },
        { name: '尿蛋白', value: '弱阳性', flag: '↑', normal: '正常值 阴性' }
      ],
      analysisText: '肾小球滤过率（eGFR 55.5）明显低于正常，尿蛋白弱阳性，肌酐接近上限，提示肾脏过滤功能偏弱。建议近期复查肾功能和尿蛋白看趋势，同时控制血糖血压、避免乱用伤肾药物，尤其止痛药。'
    }
  },
  liver: {
    name: '消化系统', status: '需关注', warn: true,
    overall: { text: '有脂肪肝，肝酶正常', color: 'warn' },
    cta: '预约肝脏检查',
    desc: [
      '腹部超声提示脂肪肝（肝脏回声增强、呈"毛玻璃"样改变），胆囊已切除。'
    ],
    metricsTitle: '主要肝功能指标',
    metrics: [
      { name: 'ALT', tip: '丙氨酸氨基转移酶 / 谷丙转氨酶', value: '21.6 U/L', flag: '正常', normal: '正常值 0–40 U/L' },
      { name: 'AST', tip: '天冬氨酸氨基转移酶 / 谷草转氨酶', value: '16.6 U/L', flag: '正常', normal: '正常值 0–45 U/L' },
      { name: '总胆红素（TBIL）', value: '10.7 μmol/L', flag: '正常', normal: '正常值 2–25 μmol/L' },
      { name: '总蛋白', value: '74.3 g/L', flag: '正常', normal: '正常值 60–87 g/L' }
    ],
    extraDesc: ['胆囊切除术后，消化功能基本不受影响。'],
    interpretTitle: '解读',
    paragraphs: [
      '肝脏里"油"堆得偏多（脂肪肝），好在**肝酶都还正常，说明肝细胞没有明显受损**。结合体重偏重，最可能的还是代谢相关的脂肪肝。',
      '这个阶段完全可逆，重点是控制体重、少油少糖、规律作息，把脂肪肝"喂回去"。胆囊虽然切除了，但对消化影响不大。'
    ],
    // 供 AI 深度解析使用的结构化肝功能指标块
    lab: {
      title: '肝功能指标',
      indicators: [
        { name: 'ALT', value: '21.6 U/L', flag: '正常', normal: '正常值 0–40 U/L' },
        { name: 'AST', value: '16.6 U/L', flag: '正常', normal: '正常值 0–45 U/L' },
        { name: '总胆红素', value: '10.7 μmol/L', flag: '正常', normal: '正常值 2–25 μmol/L' }
      ],
      analysisText: '腹部超声提示脂肪肝，但肝功能指标（ALT、AST、胆红素）均正常，说明肝细胞尚未明显受损。此阶段完全可逆，重点控制体重、少油少糖、规律作息。胆囊切除术后对消化影响不大。'
    }
  },
  blood: {
    name: '血液与营养', status: '需关注', warn: true,
    overall: { text: '血常规基本正常，红细胞压积略高', color: 'warn' },
    metricsTitle: '血常规指标',
    metrics: [
      { name: '红细胞压积（HCT）', tip: '红细胞压积', value: '0.506 L/L', flag: '轻度偏高', normal: '正常值 0.335–0.5' },
      { name: '血红蛋白', value: '162 g/L', flag: '正常', normal: '正常值 110–172 g/L' },
      { name: '红细胞', value: '5.62 ×10¹²/L', flag: '正常', normal: '正常值 4.09–5.74' },
      { name: '白细胞', value: '7.58 ×10⁹/L', flag: '正常', normal: '正常值 3.7–10' },
      { name: '血小板', value: '245 ×10⁹/L', flag: '正常', normal: '正常值 85–320' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '血常规总体在正常范围，只有**红细胞压积比上限略高一点点**。这种情况最常见的原因是血液轻度浓缩（喝水少、出汗多、天气热等），一般没有大问题，注意正常喝水、过段时间复查即可，不必担心。'
    ]
  },
  bone: {
    name: '骨骼肌肉', status: '良好', warn: false,
    overall: { text: '骨密度正常', color: 'good' },
    metricsTitle: '骨密度',
    metrics: [
      { name: 'T 值', value: '0.14', flag: '正常', normal: '≥ -1.0 为正常' },
      { name: 'Z 值', value: '1.37', flag: '正常', normal: '同年龄段参考' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '骨密度检查正常，没有骨量减少或骨质疏松。**66 岁能保持这个水平很不容易**，继续保持适量运动和均衡饮食，平时注意防跌倒就行。'
    ]
  },
  lung: {
    name: '呼吸系统', status: '良好', warn: false,
    overall: { text: '未见明显实质性病变', color: 'good' },
    desc: [
      '胸部正位片提示：双肺纹理增强，未见明显实质性病变；心脏起搏器植入术后改变。'
    ],
    metrics: [],
    interpretTitle: '解读',
    paragraphs: [
      '肺部没有发现明确病灶。双肺纹理增强在老年人中比较常见，一般没有特别的临床意义，无需紧张。'
    ]
  }
};

initReport(SYS_INFO, 'endo');
