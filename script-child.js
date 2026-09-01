// 体检报告解读 · 交互脚本（儿童版）
window.REPORT_PROFILE = 'child8';

const SYS_INFO = {
  growth: {
    name: '生长发育', status: '需关注', warn: true,
    recheck: [
      { time: '3 个月后', items: ['儿科/儿保复查身高体重，看 BMI 百分位是否回落'], note: '' }
    ],
    overall: { text: '身高发育正常，体重增长偏快', color: 'warn' },
    cta: '预约生长发育评估',
    metricsTitle: '生长发育指标',
    metrics: [
      { name: '身高', value: '132 cm', flag: '中上', normal: '同龄男孩约 P70' },
      { name: '体重', value: '35 kg', flag: '偏高', normal: '—' },
      { name: 'BMI', value: '20.1 kg/m²', flag: '偏高', normal: '同龄男孩约 P95，接近肥胖' },
      { name: '生长速度', value: '6.5 cm/年', flag: '正常', normal: '目前基本正常' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '身高位于同龄男孩中上水平，发育正常；问题主要是体重增长相对较快，而不是身高发育异常。需要控制体重增长趋势，避免发展为肥胖。'
    ]
  },
  eye: {
    name: '视力与眼', status: '需关注', warn: true,
    recheck: [
      { time: '尽快（1 个月内）', items: ['眼科散瞳验光，明确近视度数，按医生建议配镜或防控'], note: '' }
    ],
    overall: { text: '裸眼视力下降，疑似近视', color: 'warn' },
    cta: '预约眼科检查',
    doctor: true,
    metricsTitle: '视力检查',
    metrics: [
      { name: '右眼裸眼视力', value: '0.5', flag: '偏低', normal: '—' },
      { name: '左眼裸眼视力', value: '0.4', flag: '偏低', normal: '—' },
      { name: '右眼球镜', value: '-1.25D', flag: '近视', normal: '—' },
      { name: '左眼球镜', value: '-1.50D', flag: '近视', normal: '—' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '双眼屈光不正，提示近视可能。结合父亲近视及每天约 2 小时屏幕时间，建议尽快到眼科做散瞳验光，明确近视程度，尽早干预。'
    ]
  },
  oral: {
    name: '口腔健康', status: '需关注', warn: true,
    recheck: [
      { time: '尽快（1 个月内）', items: ['口腔科补牙 + 窝沟封闭'], note: '' }
    ],
    overall: { text: '存在龋齿，口腔清洁需改善', color: 'warn' },
    cta: '预约口腔检查',
    doctor: true,
    desc: [
      '右下第一恒磨牙窝沟可见龋坏，左上第一恒磨牙疑似早期龋，牙龈轻度充血，每日刷牙约 1 次。'
    ],
    metrics: [],
    interpretTitle: '解读',
    paragraphs: [
      '恒磨牙要使用一生，龋坏不会自行恢复，建议尽快到口腔科补牙，并做窝沟封闭；同时把刷牙习惯调整为早晚各 1 次。'
    ]
  },
  digest: {
    name: '消化代谢', status: '需关注', warn: true,
    recheck: [
      { time: '3 个月后', items: ['复查甘油三酯'], note: '' }
    ],
    overall: { text: '肝功能正常，甘油三酯接近偏高', color: 'warn' },
    cta: '预约消化代谢检查',
    metricsTitle: '主要指标',
    metrics: [
      { name: '甘油三酯', value: '1.42 mmol/L', flag: '接近偏高', normal: '正常值 <1.70' },
      { name: '空腹血糖', value: '4.9 mmol/L', flag: '正常', normal: '正常值 3.9–6.1' },
      { name: 'ALT', tip: '丙氨酸氨基转移酶 / 谷丙转氨酶', value: '24 U/L', flag: '正常', normal: '正常值 7–40 U/L' },
      { name: 'AST', tip: '天冬氨酸氨基转移酶 / 谷草转氨酶', value: '25 U/L', flag: '正常', normal: '正常值 13–35 U/L' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '肝功能正常，腹部超声未见脂肪肝；但甘油三酯已接近偏高水平，与含糖饮料摄入较多、体重偏重有关，建议开始调整饮食和增加运动。'
    ],
    // 供 AI 深度解析使用的结构化消化代谢指标块
    lab: {
      title: '消化代谢指标',
      indicators: [
        { name: '甘油三酯', value: '1.42 mmol/L', flag: '接近偏高', normal: '正常值 <1.70' },
        { name: '空腹血糖', value: '4.9 mmol/L', flag: '正常', normal: '正常值 3.9–6.1' },
        { name: 'ALT', tip: '丙氨酸氨基转移酶 / 谷丙转氨酶', value: '24 U/L', flag: '正常', normal: '正常值 7–40 U/L' },
        { name: 'AST', tip: '天冬氨酸氨基转移酶 / 谷草转氨酶', value: '25 U/L', flag: '正常', normal: '正常值 13–35 U/L' }
      ],
      analysisText: '孩子出现甘油三酯接近偏高，属于典型的"吃出来的信号"，多半是含糖饮料、油炸零食和运动太少叠加的结果。肝功能正常，腹部超声未见脂肪肝。调整饮食习惯后几个月内就能回到正常。'
    }
  },
  blood: {
    name: '血液与营养', status: '良好', warn: false,
    overall: { text: '血常规正常，无明显贫血', color: 'good' },
    metricsTitle: '重点指标',
    metrics: [
      { name: '血红蛋白', value: '128 g/L', flag: '正常', normal: '正常' },
      { name: '白细胞', value: '6.8×10⁹/L', flag: '正常', normal: '正常' },
      { name: '血小板', value: '285×10⁹/L', flag: '正常', normal: '正常' }
    ],
    interpretTitle: '解读',
    paragraphs: [
      '血常规主要指标均在正常范围，未见明显贫血或感染相关异常。'
    ]
  },
  heart: {
    name: '心肺功能', status: '良好', warn: false,
    overall: { text: '心电图未见明显异常', color: 'good' },
    metrics: [],
    interpretTitle: '解读',
    paragraphs: [
      '心电图示窦性心律，未见明显异常。'
    ]
  },
  bone: {
    name: '骨骼脊柱', status: '良好', warn: false,
    overall: { text: '脊柱生理曲度正常', color: 'good' },
    desc: [
      '脊柱检查提示：生理曲度基本正常，未见明显侧弯。'
    ],
    metrics: [],
    interpretTitle: '解读',
    paragraphs: [
      '骨骼脊柱未见明显异常。建议继续保持良好坐姿和户外活动，预防脊柱侧弯。'
    ]
  }
};

initReport(SYS_INFO, 'growth');
