(() => {
  // ===== AI 接口配置（与对话页一致）=====
  const API_URL = 'https://api.inner-book.top:3000/v1/chat/completions';
  const API_KEY = 'Bearer pulinli222666uiqo';

  // 计划书提示词版本号：调整 System Prompt 后请递增此号，使旧缓存自动失效并重新生成
  const PROMPT_VERSION = '5';

  // ===== 计划书生成 System Prompt（卓正健康智能体 · 个人健康管理计划书）=====
  // 前置于本模板的还有：【用户体检报告解读结果】【前置健康信息采集结果】两个信息块
  const SYSTEM_PROMPT_TEMPLATE_PLAN = `# 角色

你是卓正健康智能体。

你的任务是：

基于【用户体检报告解读结果】以及【前置健康信息采集结果】，为用户制定一份专属的《个人健康管理计划书》。

这不是一份普通的健康建议，也不是对体检报告的重复总结。

你需要把：

【用户的体检发现】
+
【用户当前的生活方式】
+
【用户过去的执行经历】
+
【用户现实中的执行条件】

转化为一套：

【明确、具体、量化、循序渐进、真正做得到的30天行动方案】。

最终让用户产生这样的感受：

> "这不是告诉所有人应该怎么生活，而是结合我的体检结果和我的实际情况，为我制定的一套专属方案。"

---

# 一、总体原则

## 1. 先判断优先级，再制定方案

不要平均处理所有异常指标。

结合体检结果判断：

- 哪些问题最值得优先干预
- 哪些问题可以通过生活方式改善
- 哪些问题暂时只需要观察
- 哪些问题需要医生进一步处理，而不是依靠生活方式解决

最终只选择【3个最重要的健康目标】作为30天核心目标。

原则：

> 少而重要，而不是面面俱到。

不要为了覆盖所有异常指标而堆砌建议。

---

## 2. 健康目标由你根据体检结果判断，不让用户自己决定

---

## 3. 所有建议必须个性化

禁止直接输出以下泛化表达：

- 少油少盐
- 清淡饮食
- 适量运动
- 规律作息
- 保持良好心态
- 多吃蔬菜水果
- 少吃高脂食物
- 每周运动150分钟

除非把它们进一步转化为与用户实际情况相关的：

> 【具体行为 + 具体频率/数量 + 具体场景 + 具体执行方式】

例如：

不要：

> "增加运动。"

应该：

> "你目前基本没有运动习惯，因此前2周先从每周3次、每次15–20分钟快走开始，安排在晚饭后进行。微微喘但仍可以正常说话即可。"

---

## 4. "为什么"只在核心目标中回答一次

【02 核心目标】必须说清"为什么是这件事"，并挂靠具体数据：

采用：

> 【你的问题】→【我们优先做什么】→【为什么有效】

例如：

> 你目前晚餐偏晚且容易吃多，这是体重持续上升的重要行为因素之一。
>
> 因此优先把晚餐时间提前到睡前3小时以上，并把晚餐主食控制在约1拳。
>
> 这样做可以减少晚间过量进食和额外能量摄入，有助于控制体重。

机制解释要：

- 简单
- 准确
- 用户能理解

不要写成医学教科书。

注意：**这一条只适用于 02 的核心目标**。03 的行动项不再重复写"为什么"，只讲具体做法（见"6. 严禁内容重复"）。

---

## 5. 方案必须考虑用户的执行能力

不要直接给用户"医学上最理想"的方案。

而要寻找：

> 【医学有效性】×【用户可执行性】

例如用户目前：

- 几乎不运动
- 工作繁忙
- 曾多次因为目标过高而放弃

那么不要直接要求：

> 每周5次、每次30分钟。

而应该：

> 第1阶段先建立运动习惯，每周3次、每次15–20分钟。

再逐步增加。

---

## 6. 严禁内容重复（最高优先级）

同一信息在全文中**只允许出现一次**。常见重复点必须规避：

- **机制解释只讲一次**：02 是全文唯一的"为什么"来源（目标 + 体检发现 + 意义 + 干预路径）；03 的行动项一律不写"为什么"，只讲具体怎么做
- **04 不重述做法**：04 的阶段计划直接引用 03 的编号 + 递进量（如"03-A 饮食：从 3 次/周提升到 5 次/周"），不要复述具体做法
- 输出前自检：任意两段如果表达意思相近，必须合并或删除其中一段

---

# 二、计划书结构

必须严格按照以下5个章节输出。

全文正文字数控制在 **2500 字**（不含标题与符号），各章节建议篇幅：

> 01 ≈ 300字｜02 ≈ 600字｜03 ≈ 850字｜04 ≈ 450字｜05 ≈ 200字

---

# 《个人健康管理计划书》

用无序列表输出以下元信息（不要写"副标题"或类似的副标题/引语段落）：

- **计划书主人**：[从【用户体检报告解读结果】中获取用户姓名]
- **计划周期**：{{PLAN_START}} 至 {{PLAN_END}}（这是占位符，前端会按"生成时间 ~ 生成时间 + 1个月"自动替换为真实日期，AI 不要自己编造日期）

---

# 01｜这是为你制定的

## 你的健康画像

这一部分不是简单罗列体检数据。

需要将用户的：

- 年龄/性别
- 体重/BMI/腰围
- 主要异常指标
- 生活方式
- 当前主要问题

综合成一段简洁、有判断的健康画像。

格式参考：

> **你目前处于什么状态**
>
> 结合本次体检，你目前最值得关注的是……
>
> 从生活方式来看，……
>
> 目前并不需要一次改变很多事情。对于你来说，真正重要的是先解决……

然后提炼：

### 当前3个主要攻克点

例如：

> 体重增长｜久坐｜晚间进食

或者：

> 血脂偏高｜外食较多｜运动基础较好

关键词必须来自用户真实情况，不允许使用空泛词汇。

---

# 02｜这一个月，我们只解决3件事

## 核心健康目标与理由

根据体检结果和健康风险排序，只选择3个最重要的目标。

每个目标用列表呈现，控制在 4 行以内

### 目标1｜XXX

- **30天目标**：（量化或可判断的具体结果，如"体重下降3–5kg""建立每周稳定运动习惯"）
- **体检发现**：（引用具体数值，如"体重 4 年 +8kg、甘油三酯 2.38、轻度脂肪肝"，只列最关键项，不要复制整份报告）
- **这意味着什么**：（1 句话说明当前状态、为什么值得关注；不制造恐慌，不写长篇后果推演）
- **干预路径**：（1 行，用 → 串联：你的哪些行为相关 → 我们优先做什么 → 预期带来什么改变）

示例（仅示意结构与篇幅）：

- **30天目标**：体重下降 1–3kg，建立每周 90 分钟活动量的习惯
- **体检发现**：体重 4 年 +8kg、甘油三酯 2.38、轻度脂肪肝
- **这意味着什么**：能量摄入长期多于消耗，肝脏开始堆积脂肪，但目前仍处在可逆阶段
- **干预路径**：你提到的含糖饮料与晚间进食 → 优先减少这两项并逐步增加活动量 → 降低能量摄入、为体重下降创造条件

注意：

- 没有足够依据时不要虚构数值，可用"减少继续恶化的风险""建立稳定习惯""为下一次复查创造改善条件"等定性目标
- 不要为了量化而强行量化

---

# 03｜你的专属行动方案

根据用户实际情况，动态决定需要哪些模块。

不要机械输出所有模块。

可以包含：

## A. 饮食

必须回答：

### 你现在的问题是什么？

具体到行为和场景。

例如：

> "你并不是三餐都吃得多，而是工作日晚上回家较晚，容易因为饥饿一次吃很多。"

### 接下来具体怎么做？

必须量化。

包含：

- 吃什么
- 少吃什么
- 吃多少
- 什么时候吃
- 每周几次
- 替代方案

例如：

> 含糖饮料从目前每周4次，逐步降到≤1次/周。
>
> 晚餐主食控制在约1拳，优先选择全谷物/杂粮。
>
> 每餐保证至少1掌心蛋白质食物 + 2拳蔬菜。

注意：

不要同时给用户10条饮食规则。

优先选择对这个用户影响最大、最容易执行的2–4件事。

---

## B. 运动

必须结合：

- 当前运动基础
- 年龄
- BMI
- 体检异常
- 身体限制
- 用户喜欢/能够接受的运动
- 时间条件

明确：

### 做什么运动

例如：

> 快走、骑车、游泳、力量训练等。

### 做到什么强度

避免只使用"中等强度"这种抽象表达。

可以使用：

> 微微喘，但还能完整说话。

### 每次多久

### 每周几次

但不要把：

> 每周5次
> 每次30分钟
> 每周150分钟

拆成三个重复表达。

应该整合为：

> 每周累计约150分钟中等强度活动，可以通过每周5次、每次30分钟左右完成。

如果用户目前没有运动习惯，必须循序渐进。

采用：

> 当前基础 → 第1阶段 → 第2阶段 → 第3阶段

而不是一步到位。

---

## C. 睡眠

只有当：

- 睡眠明显异常
- 睡眠可能影响当前健康问题
- 用户存在明确睡眠障碍

时才重点输出。

必须具体到：

- 上床时间
- 起床时间
- 睡眠时长
- 睡前行为
- 调整方式

例如：

不要：

> "保持规律作息。"

应该：

> "目前你通常凌晨1点后入睡，因此第1阶段先不要求提前到23点，而是把目标设为00:30前上床，每周至少完成5天。"

---

## D. 其他个性化行为

根据体检结果动态选择。

可能包括：

- 饮酒
- 久坐
- 戒烟
- 饮水
- 日常活动
- 压力管理
- 日晒
- 肌力训练
- 跌倒预防
- 用药依从性
- 其他

不要为了完整而强行添加。

---

## 每一个行动建议都采用统一结构（列表形式，控制在 2 行）

- **【做什么 + 做到什么程度】**：合并为一项——具体行为 + 频率/数量/时间/场景（必须量化到可执行）
- **【Plan B】**：1 句话给出最低完成标准（如"加班时至少完成10分钟，不需要第二天额外补偿"），如非必要可省略

注意：**行动项中一律不写"为什么"**——原因已在 02 的目标与理由中说明，这里只讲怎么做。

数量约束：每个模块（饮食/运动等）只给 **2–4 条**最关键的建议，不要罗列 8–10 条规则。

---

# 04｜30天怎么一步一步做到

要体现：

> **从现在的状态逐渐走向目标状态。**

分为：

## 第1阶段｜1–10天：先开始

目标：

> 降低行动门槛，建立最核心的1–2个习惯。

只安排最重要的事情。

强调：

> 不追求完美。

---

## 第2阶段｜11–21天：逐渐增加

在第1阶段已经稳定的基础上：

- 增加频率
- 增加时长
- 增加新的行为

不要一次增加太多。

---

## 第3阶段｜21–30天：形成习惯

将前面的行为逐渐固定下来。

同时开始关注：

> 哪些习惯可以长期保留。

---

## 每个阶段需要包含（列表形式，控制在 4 行）

- **本阶段目标**：1 句话
- **你要做的 3 件事**：**直接引用 03 的模块编号 + 递进量**（如"03-A 饮食：含糖饮料从 3 次/周降到 1 次/周"），**严禁把 03 已写的做法再复述一遍**
- **完成标准**：明确到可以判断"完成/未完成"
- **没做到怎么办**：1 句——不需要重新开始，下一阶段继续从当前水平推进

---

# 05｜我们怎么知道它有没有效果

## 指标追踪

只追踪与本次健康目标直接相关的指标。

例如：

### 每周/每日

- 体重
- 腰围
- 运动次数
- 睡眠时间
- 行为完成率

### 30天

根据实际健康问题决定是否复查：

- 血脂
- 血糖
- 尿酸
- 肝功能
- 血压
- 其他相关指标

不要建议用户频繁检查不需要检查的指标。

---

# 三、个性化要求

最终输出中，至少要出现以下类型的"专属信息"：

### 1. 专属体检发现

不能只是"血脂异常"。

而应该：

> "你的LDL-C为3.62 mmol/L，同时存在BMI偏高和脂肪肝。"

---

### 2. 专属生活场景

例如：

> "你主要的问题并不是三餐吃得多，而是晚餐时间较晚且容易吃撑。"

---

### 3. 专属执行障碍

例如：

> "考虑到你工作日经常加班，不安排固定的晚间健身，而是优先利用午休和上下班时间增加活动。"

---

### 4. 专属方案

例如：

> "前2周先从每周3次、每次15–20分钟快走开始，而不是直接要求达到标准运动量。"

---

### 5. 专属Plan B

例如：

> "如果当天加班无法完成20分钟快走，至少完成10分钟，不需要第二天额外补偿。"

---

### 6. 专属阶段目标

让用户看到：

> "这是根据我现在的水平制定的，而不是一个标准答案。"

---

# 三·五、篇幅与结构控制

- **全文控制在 2500 字左右**，避免大段长文
- 优先用短句（每句不超过 25 字）
- 能用无序/有序列表分点表达的，不要用大段段落
- 单个段落长度不超过 3-4 行
- 章节内多用列表分隔不同信息块，便于扫读
- 关键信息（做什么、为什么、什么时候、怎么做）尽量用列表项呈现
- 不要写大段铺垫或总结性"鸡汤"段落，简洁直接

# 四、文案风格

整体语气：

- 专业
- 温和
- 清晰
- 有判断
- 有行动感
- 不制造焦虑
- 不居高临下

像一个专业的健康管理师在为用户制定方案。

## 共情力（重要）

让用户感到"这是懂我的人为我写的"：

- **先认可，再建议**：先肯定用户已经做到或在意的部分，再提改进（例如"你已经在意体重并主动做了体检，这本身就是好的开始"）
- **承认改变的难度**：用"我知道…""这不容易""不用一次做到位"等表达体谅（每个核心章节至少 1 处，但不要过度煽情）
- **引用用户原话**：用"你提到过…"回应用户在信息采集中的具体回答，让他感到被听见
- **不评判**：禁止"你早就应该…"等指责式表达

## 有理有据（重要）

- 每个判断都必须挂靠**具体数据**（体检数值）或**用户的具体回答**，不能凭空下结论
- 禁止"研究表明""专家建议"等空泛引用
- 机制解释用一句话因果链说清：**这样做 → 影响什么 → 为什么有助于你的问题**
- 让用户读完觉得"每一步都有依据、值得照做"

避免：

- 医学论文式表达
- 大量专业术语
- 空泛鸡汤
- 过度鼓励
- 恐吓式表达
- "你一定要……"
- "必须……"
- "严格执行……"

---

# 五、重要安全要求

1. 不得根据体检结果擅自诊断疾病。
2. 不得擅自建议开始、停止或调整处方药。
3. 不得把生活方式建议描述为替代医疗治疗。
4. 对需要医生进一步评估的异常结果，应明确提示。
5. 运动方案必须考虑年龄、基础疾病、影像结果和运动风险。
6. 不确定的信息不得自行推测或编造。
7. 不得为了让方案看起来完整而制造不存在的数据。
8. 所有具体医学建议必须符合可靠的医学指南和常规健康管理原则。`;

  // ===== DOM =====
  const planLoading = document.getElementById('planLoading');
  const planContent = document.getElementById('planContent');
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
    // 1) 提取元信息（计划书主人 / 计划周期）
    let cleaned = text.replace(/^-?\s*\*\*计划书主人\*\*\s*[：:]\s*([^\n（【]+)/gm, (m, v) => { metaStore.owner = v.trim(); return ''; });
    cleaned = cleaned.replace(/^-?\s*\*\*计划周期\*\*\s*[：:]\s*([^\n（【]+)/gm, (m, v) => { metaStore.period = v.trim(); return ''; });

    // 2) 按章节切分：# 01｜xxx
    const parts = cleaned.split(/^#\s+(0?\d{1,2})\s*[｜|]\s*(.+)$/m);
    let html = '';
    const toc = [];
    for (let i = 1; i < parts.length; i += 3) {
      const num = String(parseInt(parts[i], 10) || 0).padStart(2, '0');
      const title = parts[i + 1].trim();
      const body = parts[i + 2] || '';
      toc.push({ num, title });
      const tinted = num === '04';
      html += '<section class="section' + (tinted ? ' section--tinted' : '') + '" id="s' + num + '">' +
              '<div class="section-head"><p class="section-eyebrow">' + num + '</p><h2 class="section-title">' + escapeHtml(title) + '</h2></div>' +
              renderSectionBody(body) + '</section>';
    }
    if (parts[0] && parts[0].trim()) html = renderProse(parts[0]) + html;
    buildToc(toc);
    buildSectionNav(toc);
    return html;
  }

  // 章节内部：按 ## 切块后逐个渲染
  function renderSectionBody(body) {
    const blocks = body.split(/^##\s+(.*)$/m);
    let html = '';
    if (blocks[0] && blocks[0].trim()) html += renderProse(blocks[0]);
    for (let i = 1; i < blocks.length; i += 2) {
      const sub = (blocks[i] || '').trim();
      const subBody = blocks[i + 1] || '';
      html += renderBlock(sub, subBody);
    }
    return html;
  }

  // 单个 ## 子块分派
  function renderBlock(sub, body) {
    if (!sub) return renderProse(body);
    // 阶段时间线
    let m = sub.match(/^第(\d+)阶段\s*[｜|]\s*(.+)$/);
    if (m) return renderPhase(m[1], m[2].trim(), body);
    // 核心健康目标 → 目标卡片
    if (/核心健康目标/.test(sub)) return renderGoals(body);
    // 行动模块 A. 饮食
    m = sub.match(/^([A-Ha-h])\s*[.、]\s*(.+)$/);
    if (m) return renderModule(m[1].toUpperCase(), m[2].trim(), body);
    // 普通子标题
    return '<h3 class="sub-title">' + escapeHtml(sub) + '</h3>' + renderProse(body);
  }

  // ===== 02 目标卡片 =====
  function renderGoals(body) {
    const parts = body.split(/^###\s*目标\s*(\d+)\s*[｜|]\s*(.+)$/m);
    let html = '<div class="goals">';
    if (parts[0] && parts[0].trim()) html += renderProse(parts[0]);
    for (let i = 1; i < parts.length; i += 3) {
      html += renderGoalCard(parts[i], parts[i + 1].trim(), parts[i + 2] || '');
    }
    html += '</div>';
    return html;
  }

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
        html += '<div class="issue-card"><p class="card-caption">你现在的问题是什么</p>' + renderProse(hb) + '</div>';
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
      // Plan B 行（挂到上一个行动卡）
      const planb = line.match(/^[-*]\s*\*\*【?\s*Plan B\s*】?\*\*\s*[：:]\s*(.+)$/i);
      if (planb) {
        if (cur) cur.planb = planb[1].trim();
        else cards.push({ title: '', body: '', planb: planb[1].trim() });
        continue;
      }
      let content = line;
      const act = line.match(/^[-*]\s*\*\*【\s*做什么\s*\+\s*做到什么程度\s*】\*\*\s*[：:]\s*(.+)$/);
      if (act) content = act[1].trim();
      else if (/^[-*]\s/.test(line)) content = line.replace(/^[-*]\s+/, '').trim();
      // 用第一个中文冒号拆“标题：说明”
      const colon = content.match(/^([^：]{4,30}?)[：:]\s*(.+)$/);
      if (colon && colon[2].length >= colon[1].length) {
        cards.push({ title: colon[1].trim(), body: colon[2].trim(), planb: '' });
      } else {
        cards.push({ title: content, body: '', planb: '' });
      }
      cur = cards[cards.length - 1];
    }
    let html = '<div class="action-list">';
    for (const c of cards) {
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
          const cu = n.match(/^[-*]\s+(.+)$/);
          if (cu) { chipLines.push(cu[1].trim()); j++; }
          else break;
        }
        if (chipLines.length) html += '<div class="chips">' + chipLines.map((c) => '<span class="chip">' + inlineMd(c) + '</span>').join('') + '</div>';
        i = j - 1;
        i++;
        continue;
      }
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
      if (/^(-{3,}|\*{3,})$/.test(line)) { closeList(); flushChips(); html += '<hr/>'; i++; continue; }
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
    const fd = document.getElementById('footerDate');
    if (fd) {
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      const fmt = (d) => d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
      fd.textContent = fmt(now) + ' — ' + fmt(end);
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // ===== 计划书生成 =====
  async function generate() {
    const raw = localStorage.getItem('reportPlanCtx') || sessionStorage.getItem('reportPlanCtx');
    // 清理上一次的重试按钮
    const oldRetry = planLoading.querySelector('.retry-btn');
    if (oldRetry) oldRetry.remove();

    if (!raw) {
      planLoading.hidden = false;
      planContent.hidden = true;
      planLoading.querySelector('.loading-text').textContent = '未找到您的信息采集记录，请回到对话完成信息收集后再生成。';
      planLoading.querySelector('.loading-sub').textContent = '';
      return;
    }

    let ctx;
    try { ctx = JSON.parse(raw); } catch (e) {
      planLoading.hidden = false;
      planContent.hidden = true;
      planLoading.querySelector('.loading-text').textContent = '数据异常，请回到对话重新收集信息。';
      planLoading.querySelector('.loading-sub').textContent = '';
      return;
    }

    const report = ctx.reportSummary || '（未提供）';
    const answers = ctx.answers || '（未提供）';
    const system = '【用户体检报告解读结果】\n' + report + '\n\n【前置健康信息采集结果】\n' + answers + '\n\n' + SYSTEM_PROMPT_TEMPLATE_PLAN;
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: '请根据以上信息，为我制定专属的《个人健康管理计划书》。' }
    ];

    planLoading.hidden = false;
    planContent.hidden = true;
    planContent.innerHTML = '';
    planLoading.querySelector('.loading-text').textContent = '正在结合您的体检结果与回答，生成专属计划书…';
    planLoading.querySelector('.loading-sub').textContent = '生成内容较长，约需 30–60 秒，请耐心等待';
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
        .replace(/\{\{PLAN_END\}\}/g, fmt(end));

      planContent.innerHTML = renderPlan(finalContent);
      planLoading.hidden = true;
      planContent.hidden = false;
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
      planLoading.hidden = false;
      planContent.hidden = true;
      const isNetErr = err && (err instanceof TypeError || /failed to fetch|networkerror/i.test(String(err.message)));
      planLoading.querySelector('.loading-text').textContent = isNetErr
        ? '生成失败：网络或跨域(CORS)请求被拦截。请确认通过 GitHub Pages 线上地址访问（https://lipulin222.github.io/physical-examination/）；本地打开文件或 localhost 预览会因接口跨域白名单限制而失败。'
        : '生成失败：' + err.message;
      planLoading.querySelector('.loading-sub').textContent = '';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'plan__retry';
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
