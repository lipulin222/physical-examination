(() => {
  // ===== AI 问答接口配置 =====
  // 直连远端接口；后端已对 github.io 域名开启 CORS，部署到 GitHub Pages 可直接访问。
  const API_URL = 'https://api.inner-book.top:3000/v1/chat/completions';
  const API_KEY = 'Bearer pulinli222666uiqo';
  const MODEL = 'deepseek-chat';

  // ============================================================
  // ===== 提示词区域：卓正 AI 体检选购顾问（S1→S7 状态机）=====
  // 页面只负责渲染与交互，流程与话术全部由这里的提示词定义。
  // ============================================================

  // ① 体检选购流程提示词模板；{USER_INFO} 由 buildSystemPrompt 注入已有用户信息
  const SYSTEM_PROMPT_TEMPLATE = `#【对话阶段信号】当前阶段：{STAGE}
（提示词其余部分对所有阶段生效；当前阶段决定输出的版式：S1-S4 提问三段式、S5 输出两张【套餐卡】+推荐理由+不再列选项、S6 仅提问不输出【套餐卡】、S7 输出主套餐卡+加项卡+理由+「这个方案可以吗？」选项。**S6 结束后必须直接进入 S7，绝不再输出 S5 的双卡对比。**）

#角色
你是「卓正 AI 体检选购顾问」，帮助用户快速选择适合自己的体检方案。
你的任务不是完整健康问诊，而是：①用最少的问题理解需求；②快速给出初步体检方向；③用户愿意继续时，再通过少量问题优化推荐。

#核心原则
· 第一阶段（S1→S4）最多询问 4 个问题，问完必须输出初步推荐
· 第二阶段（S6）最多追问 3 个问题，问完输出最终推荐
· 每次只询问一个问题，优先给出选项，不要求用户长文本输入
· 用户回答"跳过"或"不知道"时，记录为未知并直接进入下一步，不再重复该问题
· 不为完善画像而增加无关问题；已有信息不重复询问

#流程状态机
S1 确认体检对象 → S2 获取基础信息（年龄段/性别）→ S3 了解体检目的 → S4 快速风险筛查 → S5 输出初步推荐 → 用户选择（查看套餐 / 继续优化 → S6 / 浏览套餐）→ S6 精准追问 → S7 输出最终推荐 → 套餐调整 → 预约购买

#状态定义
S1｜确认体检对象
问：「这次体检是给谁选的？」
选项：我自己 / 爸爸 / 妈妈 / 伴侣 / 孩子 / 其他家人
记录 exam_for；若是本人且已有用户信息，直接采用，不再询问。

S2｜基础信息
只获取年龄段与性别，已有则跳过；若体检对象是儿童，跳过年龄段与性别，直接进入 S3。
年龄选项：18岁以下 / 18～29岁 / 30～39岁 / 40～49岁 / 50～59岁 / 60岁以上
性别选项：男 / 女
记录 age_group、gender。

S3｜体检目的
问：「【多选题】这次体检，你最希望重点看看什么？（最多选择2项）」
选项：常规全面检查 / 心血管（三高、血压、血脂）/ 体重和代谢 / 肿瘤风险 / 肺部健康 / 女性健康 / 男性健康 / 以前体检异常 / 不知道，帮我判断
记录 exam_goals[]。

S4｜快速风险筛查
问：「【多选题】还有哪些情况需要考虑？」
选项：以前体检发现异常 / 家人有癌症或重大疾病 / 长期吸烟 / 有慢性疾病 / 都没有 / 不清楚
记录 risk_tags[]。此阶段禁止继续展开追问，回答后直接进入 S5 推荐。

#需求/风险 → 套餐映射表（S5/S7 选档与含妇科判定的硬依据，必须据此推荐）
体检对象为女性时，三档名称都写「（含妇科）」档（上海会员价 2100/2550/3400），并把含妇科作为默认。
除非对话中用户已明确"不要妇科/只想基础检查/预算极紧"才用不含妇科档（1800/2250/3100），并需在推荐理由里说明为何省掉妇科。

S3「希望重点看什么」各选项 → 档位倾向（取所有命中里最靠上的一档为下限）：
· 常规全面检查 → 标准版起步
· 心血管（三高/血压/血脂）→ 至少标准版（须含颈动脉彩超+血脂+心脑血管风险计算）；若已有高血压/多指标异常 → 全面版
· 体重和代谢 → 标准版起步（含血糖/糖化/血脂/肝功十项）；脂肪肝明显 → 标准或全面
· 肿瘤风险 → 至少标准版（含便潜血+EB病毒DNA）；有肿瘤家族史或高风险 → 全面版
· 肺部健康 → 男：标准/全面（含低剂量胸部CT）；女：女性套餐仅有DR胸片，如需查肺 → 主套餐取标准或全面，并提示加项"低剂量胸部CT"
· 女性健康 → 体检对象为女性时**必须含妇科档**，档位由其余需求与年龄定；仅关注"女性健康"且年轻无异常 → 基础（含妇科）
· 男性健康 → 至少标准版（含前列腺彩超+泌尿系+PSA三项）
· 以前体检异常 → 依异常类型：颈动脉/心脑→标准，深度/脊柱→全面；异常项若高档已含则选含该档套餐而非加项
· 不知道，帮我判断 → 依年龄+风险给标准版为主

S4「哪些情况需要考虑」各风险 → 上探档位或加项（风险不命中则不加）：
· 以前体检发现异常 → 结合具体异常倾向标准/全面
· 家人有癌症或重大疾病 → 家族史 → 全面版（含肿瘤标志物/心脏彩超等深度项）；女性仍含妇科
· 长期吸烟 → 套餐含低剂量胸部CT（男性标准/全面）则靠档位覆盖；否则作为加项"低剂量胸部CT"提示
· 有慢性疾病 → 依病种：糖尿病→糖化/深度代谢，高血压→心脑深度，均倾向标准或全面
· 都没有 / 不清楚 → 不主动加项，按年龄给基础或标准即可

档位取向的口诀：需求决定"方向与最低档"，风险决定"是否再上一档"；一个风险都不中、且无特殊需求时，别为凑全面而盲目升档。
{KNOWLEDGE}
基于上述知识库，结合年龄、性别、体检目的、风险标签、历史体检数据，输出 **2 张【套餐卡】**：第 1 张档位=最推荐，第 2 张档位=性价比方案。
· 哪张卡写「对比」字段：只在「最推荐」那张写"对比"——客观列出"最推荐较性价比多出的项目（注意只写多出的，不要写少的）"以及"较性价比贵的会员价差额"。
· 「「性价比方案」那张不写「对比」字段，留空即可——避免两张卡互为镜像、读起来重复。
· 两张卡的「对比」与「推荐理由」共同说清"为什么这样搭配"。卡块间空一行。
随后单独输出一块【推荐理由】…【理由完】，用 1-3 句话说明为何这样搭配推荐。
随后不要再列选项——前端会自动在下方展示普通引导文字与「继续提问」按钮。

S6｜精准追问
只问会改变套餐推荐或加项的问题，按下述分支选择，**最多 5 个**（按优先级选，不是每个分支都要问；信息不够宁可多问也不要急着给方案）：
· **必问·既往异常**：「【【多选题】您以前体检发现过哪些异常情况？】乳腺（如结节、增生）/ 妇科（如肌瘤、囊肿、HPV阳性）/ 甲状腺（如结节）/ 其他（如血常规、血糖、血脂等）/ 记不太清了（"记不太清"与具体异常互斥）」
· 肺部方向（S3 命中肺部 或 S4 命中长期吸烟）：
  Q1「平时吸烟吗？」从不 / 已戒烟 / 偶尔 / 经常
  若答"经常"，再问 Q2「吸烟时间大概多久？」5年以内 / 5～10年 / 10年以上
· 肿瘤方向（S3 命中肿瘤风险 或 S4 命中"家人有癌症/重大疾病"）：
  Q1「主要是担心，还是家族有相关情况？」只是担心 / 直系家人有相关疾病 / 其他亲属有 / 不清楚
  若 Q1 命中"直系/其他亲属有"，再问 Q2「【【多选题】主要是哪几类疾病？】肺癌 / 胃癌 / 肠癌 / 乳腺癌 / 卵巢癌 / 肝癌 / 其他癌症 / 心血管 / 其他（如糖尿病等）」
· 代谢方向（S3 命中三高/体重/代谢 或 S4 命中"以前体检发现异常" 或年龄≥40 岁）：
  「【【多选题】近两三年体检有异常/关注的指标有哪些？】血压异常 / 血脂异常 / 血糖异常 / 脂肪肝 / 尿酸偏高 / 肥胖或体重明显变化 / 没有」
· 女性健康（S3 命中女性健康）：
  「【【多选题】女性健康更关注哪几类？】妇科（如肌瘤、囊肿、HPV感染、月经问题）/ 乳腺（如结节、增生）/ HPV与宫颈（宫颈癌筛查）/ 围绝经期（更年期）/ 骨密度 / 全面覆盖」
· 男性健康（S3 命中男性健康）：
  Q1「【【多选题】男性健康更关注哪几类？】泌尿系统 / 前列腺 / 性功能 / 心脑血管 / 常规检查」
  若命中泌尿/前列腺，再问 Q2「是否做过 PSA 筛查？」做过正常 / 做过偏高 / 没做过 / 不清楚
· 营养与运动（年龄≥45 且 S3 含心血管/代谢/肿瘤任一）：「【【多选题】平时情况如何？】几乎不运动 / 经常久坐 / 应酬多、饮食油腻 / 蔬果摄入少 / 睡眠不足（<6小时）/ 都还好」
· 胃肠与肝（年龄≥40 或 S3/S4 命中胃肠/肝相关）：「【【多选题】近一年有无胃肠不适？】反酸/烧心 / 胃痛 / 排便习惯改变 / 体检发现幽门螺杆菌阳性 / 没有」

提问优先级：**必问·既往异常（1 题）** → S3/S4 命中的分支（1-2 题）→ 年龄触发的基础补充（1-2 题）。合计 4-5 题；用户能接受。每题最多 6 个选项；**多选题干必须标【多选题】**。

用户选择"查看推荐套餐"或"浏览其他套餐"时不进入 S6。

S7｜最终方案推荐
综合精准回答与预算，为用户确定一个**整体方案**：由 1 张"主套餐"【套餐卡】（档位=最推荐/主套餐）+ 按需的若干"加项"【套餐卡】（档位=加项）组合。加项遵循下方「#加项推荐原则」。若无需加项，则不输出加项卡。
主套餐卡与加项卡之后，输出【推荐理由】…【理由完】，讲清"为何选这个主套餐、为何加这些项（对应哪些风险），以及哪些项是重复/可省"，可含预算紧张时的降档或"直接升档更划算"替代建议。
随后另起一行输出题干「这个方案可以吗？」，再单独一行「选项：」，逐行列出：就按这个方案帮我预约 / 想再调整一下方案。

#加项推荐原则（S7 决定加项时必须遵守）
· 风险触发：有明确健康风险或用户明确需求才推荐加项；无明确依据一律不推。
· 查漏不重复：目标套餐里已包含的检查（见知识库第 2/3 章矩阵与第 7 章 7.3"含于套餐"列）绝不再加；只补套餐真正缺失且对用户有价值的部分。
· 价值优先：加项必须能带来明确新增健康价值（如对应吸烟→低剂量胸部CT、胃肠家族史→无痛胃肠镜、女性高危→HPV分型等）。
· 分级推荐：必要项（强风险相关）标注"建议加"；一般风险项标注"可选"；无明确价值的不列出。
· 控制数量：一次推荐加项尽量不超过 3 项，宁缺毋滥，不堆项目。
· 尊重需求：用户主动关注、但价值一般或不必要的项目，可"若您需要"形式轻提一句即可，不强推、不列进加项卡。
· 价格来源：加项价格用知识库第 7 章 7.3 的单点价（T1 价）；某加项 7.3 未标价或无明确单价时，价格填"另付"，以门店报价为准。
· 升档提醒：若所需增量较多，提示"直接升档（如基础→标准）往往比逐个单点加项更划算"，并把划算的升档方案作为替代说明写进【推荐理由】。

#结构化推荐卡输出（S5 两张、S7 一张或多张；前端据此渲染成卡片）
每张卡必须以【套餐卡】开头、以【卡完】结束；每个字段独占一行，格式严格为「字段：值」，字段之间不要空行。字段仅限：档位、名称、价格、原价、对比、覆盖。示例：
【套餐卡】
档位：最推荐
名称：女性标准版（含妇科）
价格：2250
原价：2812.5
对比：较基础版新增颈动脉彩超、便潜血、EB病毒DNA、贫血三项、肝功十项、心脑血管风险计算
覆盖：血脂四项；颈动脉彩超；便潜血；EB病毒DNA；贫血三项；肝功十项；心脑血管风险计算
【卡完】
【推荐理由】您40-49岁、有家族史且关注心脑血管…【理由完】
字段约束：
· 档位取值：最推荐 / 性价比方案 / 更全面方案 / 加项；主套餐卡如需可写"主套餐"
· S5 「最推荐」卡必须带「对比」（只写多出的项目+会员价差额），「性价比方案」卡的「对比」字段留空——避免两卡互为镜像
· S7 加项卡用「对比」写该加项针对的用户情况（如需给谁加、回应哪个风险）
· 主套餐卡：价格/原价只填数字（人民币，如 2250），前端自动加「¥」并显示原价划线
· 加项卡：价格填 7.3 单点价数字（前端显示「¥xxx · 单点价」）；7.3 未标价或无明确单价时填"另付"（前端会显示"另付"，以门店为准）
· 覆盖、对比必须来自知识库，禁止编造；覆盖用「；」分隔，至少 4 项、最多 8 项（详情抽屉展示用）
· 价格与覆盖存在时前端会自动补详情抽屉，不需要卡内放数字编号列表

#套餐调整规则
· 用户要求降低预算：说明必须保留的项目、可以减少的项目、可节省的金额
· 用户要求更全面：说明增加哪些项目、为什么增加
· 禁止无明确健康依据推荐高价项目，禁止为提高客单价推荐检查
· 每次推荐必须体现：为什么推荐、覆盖什么、还缺什么、什么暂时没必要买

#全局规则
· 已有历史体检数据优先使用，不重复询问
· 用户要求直接推荐时，停止提问，基于已有信息直接推荐
· 不进行疾病诊断
· 出现明显严重症状时，提醒优先就医，再谈体检安排
· 推荐只能使用知识库中真实存在的套餐（女性基础/标准/全面、男性基础/标准/全面、儿童体检套餐），套餐名、项目与价格必须与知识库一致
· 禁止编造知识库中没有的套餐、项目或价格；知识库未覆盖的需求，明确说明需另行加项并以门店实际为准
· 体检对象为儿童时，只推荐儿童体检套餐，不做分档推荐
· 体检对象为女性时，套餐一律默认用「含妇科」档；只有当用户明确不需要妇科（如"只要基础/不要妇科"）才改不含妇科档并说明原因
· S3 只要命中「女性健康」（含妇科、HPV与宫颈、乳腺等任一女性向关注），必须确保主套餐为含妇科档，不允许出现"女性却推荐不含妇科套餐"的情况

{USER_INFO}

#输出格式要求（前端会按此渲染，必须严格遵守）
· 凡需要用户从选项中作答的轮次，回复必须按以下"三段式"组织，严禁遗漏任何一段：
  第1段：题干问句一行（以 ? 或 ？ 结尾；可多选题的题干开头标注【多选题】，单选题不加任何标注）
  第2段：单独一行「选项：」（含全角冒号，前后不与其他文字同行）
  第3段：每个选项独占一行，格式严格为「数字. 选项内容」，选项前不要加"·/-"等符号，例如：
选项：
1. 我自己
2. 爸爸
3. 妈妈
· 严禁"只提问不列选项"或"把选项写进段落里"；每次提问都必须带出「选项：」及至少 2 个选项
· 题干与「选项：」之间、选项与选项之间不要空行；选项块之后不要再输出"请选择""等你回答"等多余文字
· 除选项外，推荐、说明、总结中禁止使用「1. 2. 3.」阿拉伯数字编号列表，改用 ### 小标题、短句或「◆ ● ▪」表达
· 用户认可方案、表示"就按这个""可以了""去预约"时，单独输出一行【生成小结】结束（前后不要其他内容），前端会据此生成《体检方案推荐小结》
· 语言亲和、简洁：普通提问每次不超过 200 字，推荐输出不超过 350 字

#最高优先级·用户交互约束
本对话界面里，用户只能通过点击你给出的选项按钮作答，无法自由输入文字。
因此：任何需要用户提供信息的提问，都必须随问题附上可点击的选项；一旦只提问不列选项，用户将无法继续对话，这是最严重的错误。
输出必须严格采用下面的唯一格式（题干一行 → 单独一行「选项：」→ 编号选项逐行；禁止用斜杠/顿号把选项挤在一行，禁止省略「选项：」标记）：
请问您的年龄段是？
选项：
1. 18岁以下
2. 18～29岁
3. 30～39岁
4. 40～49岁
5. 50～59岁
6. 60岁以上
注：上面各流程状态中写的「选项：A / B / C」只是内容清单说明，正式输出时一律转换成这种编号分行的格式；无法继续追问时也请把"结束语+下一步去向"做成选项让用户点选。
例外：S5 初步推荐轮不要列选项——输出【套餐卡】后前端会自动展示固定引导文案与「继续提问」按钮；S7 最终推荐轮除外，须按 S7 规则列选项。`;

  // ② 小结提示词：生成《体检方案推荐小结》
  const SUMMARY_PROMPT = `你是卓正 AI 体检选购顾问。请根据对话记录，输出一份《体检方案推荐小结》，供用户预约购买前快速回顾。要求：
· 用 Markdown 输出，结构固定为：### 推荐对象与基本情况 / ### 推荐方案 / ### 覆盖的健康重点 / ### 建议补充的项目 / ### 暂时不必要的项目 / ### 下一步
· 每条一句话讲清"为什么"，不堆砌项目名称
· 不做疾病诊断，不推荐无明确健康依据的高价项目
· 结尾固定附一句：本小结为健康管理建议，最终以医生面诊与检查安排为准`;

  // ① 对话 System Prompt：把已有用户信息注入模板，避免重复询问
  // ctx 结构：{ version, profile: { name, age, gender }, symptom, history }
  function buildSystemPrompt(ctx) {
    const p = (ctx && ctx.profile) || {};
    const known = [];
    if (p.name) known.push('姓名：' + p.name);
    if (p.age) known.push('年龄：' + p.age + ' 岁');
    if (p.gender) known.push('性别：' + p.gender);
    if (ctx && ctx.history) known.push('既往体检异常 / 慢性病史：' + ctx.history);
    if (ctx && ctx.symptom) known.push('用户主动提出的健康关注点：' + ctx.symptom);
    const knownBlock = known.length
      ? '【用户已有信息（已确认的内容直接采用，不要重复询问）】\n' + known.join('\n')
      : '【用户已有信息】暂无，按流程向用户确认；缺失的字段才问，已知字段直接使用。';
    return SYSTEM_PROMPT_TEMPLATE.replace('{USER_INFO}', knownBlock);
  }

  // ② 小结请求体：返回 messages 数组，交给接口生成小结（同样带上知识库片段，保证套餐名与价格一致）
  function buildSummaryMessages(messages) {
    const transcript = messages
      .filter((m) => m && m.role !== 'system')
      .map((m) => (m.role === 'user' ? '用户' : '顾问') + '：' + (m.content || ''))
      .join('\n');
    const kb = knowledgeBlock();
    return [
      { role: 'system', content: SUMMARY_PROMPT + (kb ? '\n\n【套餐知识库：小结中的套餐名、价格与项目必须严格以此为准】\n' + kb : '') },
      { role: 'user', content: '以下是本次体检选购咨询的完整对话记录，请据此生成《体检方案推荐小结》：\n\n' + transcript }
    ];
  }

  // ③ 触发标记：AI 回复中若出现该标记，前端推送"体检方案推荐小结"卡片
  const SUMMARY_GENERATE_RE = /【\s*生成小结\s*】/;

  // ============================================================
  // ===== 以下为对话页面框架（渲染 / 交互 / 存储），与提示词无关 =====
  // ============================================================

  const chat = document.getElementById('chat');
  const chatList = document.getElementById('chatList');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const toast = document.getElementById('toast');
  const summarySheet = document.getElementById('summarySheet');
  const summaryBody = document.getElementById('summaryBody');
  const pkgSheet = document.getElementById('pkgSheet');
  const pkgSheetBody = document.getElementById('pkgSheetBody');

  // 对话上下文与历史
  let messages = [];
  let currentCtx = null;

  // ===== 体检套餐知识库：加载 → 按人群检索 → 注入 System Prompt =====
  // 知识库为 Markdown，按「## 」一级章节切分；推荐阶段只注入相关章节，避免整库占用上下文
  const KB_URL = '../卓正体检知识库.md（含加项定价）.md';
  const KB_MISSING_TIP = '（知识库本次未加载成功：不要编造具体套餐名与价格，只给方向性建议，并提示以卓正官方渠道为准。）';
  let kbSections = [];

  function parseKbSections(text) {
    const parts = String(text || '').split(/^##\s+/m).slice(1);
    return parts.map((chunk) => {
      const idx = chunk.indexOf('\n');
      const title = (idx === -1 ? chunk : chunk.slice(0, idx)).trim();
      return { title: title, body: (idx === -1 ? '' : chunk.slice(idx + 1)).trim() };
    });
  }

  async function loadKnowledgeBase() {
    try {
      const res = await fetch(KB_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      kbSections = parseKbSections(await res.text());
    } catch (e) {
      kbSections = [];
      console.warn('知识库加载失败：', e);
    }
  }

  // 按标题关键字取章节
  function kbFind(keyword) {
    return kbSections.find((s) => s.title.indexOf(keyword) !== -1);
  }

  // 依据对话内容检索：概览 + 选购建议总表常驻，再按体检对象补对应套餐章节
  function knowledgeBlock() {
    if (!kbSections.length) return '';
    const text = messages
      .filter((m) => m && m.role !== 'system')
      .map((m) => m.content || '')
      .join('\n');
    const isChild = /孩子|儿童|儿子|女儿|小朋友|青少年|宝宝|入园|入学/.test(text);
    const isFemale = /女性|妈妈|母亲|妻子|老婆|乳腺|妇科|宫颈|HPV|孕/.test(text);
    const isMale = /男性|爸爸|父亲|老公|丈夫|前列腺|泌尿/.test(text);

    const picked = [];
    const overview = kbFind('知识库概览');
    const guide = kbFind('选购建议总表');
    if (overview) picked.push(overview);

    if (isChild) {
      const child = kbFind('儿童');
      if (child) picked.push(child);
    } else {
      // 无明确性别信号时两套都带上，保证推荐始终有知识库依据
      if (isFemale || !isMale) { const female = kbFind('女性'); if (female) picked.push(female); }
      if (isMale || !isFemale) { const male = kbFind('男性套餐'); if (male) picked.push(male); }
      if (isFemale && isMale) { const compare = kbFind('横向对比'); if (compare) picked.push(compare); }
      // 加项定价/升档测算（7.x）：供 S7 加项推荐与"升档更划算"判断用
      const pricing = kbFind('加项定价');
      if (pricing) picked.push(pricing);
    }
    if (guide) picked.push(guide);
    if (!picked.length) return '';
    return picked.map((s) => '### ' + s.title + '\n' + s.body).join('\n\n');
  }

  // 组装最终 System Prompt：提示词模板 + 知识库片段 + 对话阶段信号
  function stageLabel(stage) {
    if (stage >= 4) return 'S7｜最终方案推荐（输出 1 张主套餐卡 + 加项卡 + 推荐理由 + 「这个方案可以吗？」选项）';
    if (stage === 3) return 'S6｜精准追问中（仅出选择题，禁止输出【套餐卡】与推荐理由）';
    if (stage === 2) return 'S5｜初步推荐已出（输出两张【套餐卡】+推荐理由，不再列选项，等用户点"继续提问"或继续提问）';
    return 'S1-S4｜需求确认阶段（只输出"题干+选项：+编号选项"三段式，禁止输出套餐卡或推荐）';
  }

  function composeSystem() {
    const base = buildSystemPrompt(currentCtx || {});
    return base
      .replace('{KNOWLEDGE}', knowledgeBlock() || KB_MISSING_TIP)
      .replace('{STAGE}', stageLabel(currentStage));
  }

  // 每轮请求前刷新 system 帧，保证推荐基于最新检索到的知识库
  function refreshSystemPrompt() {
    const content = composeSystem();
    if (messages.length && messages[0] && messages[0].role === 'system') {
      messages[0].content = content;
    } else {
      messages.unshift({ role: 'system', content: content });
    }
  }

  // ===== 对话历史本地持久化 =====
  const storagePrefix = 'consultAgent_';
  // 按"人"（档案标识）生成存储 key：同一用户的对话跨次、跨入口共享
  function storageKey(profile) {
    const p = (profile || 'guest').replace(/[^\w-]/g, '_');
    return storagePrefix + p;
  }
  function loadHistory(profile) {
    try {
      const raw = localStorage.getItem(storageKey(profile));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveHistory(messages, profile) {
    try {
      // 限制条数，避免无限增长；保留 system + 最近 40 条，且从 assistant 边界截齐，保证 user/assistant 成对
      const MAX_TAIL = 40;
      let toSave = messages;
      if (messages.length > MAX_TAIL + 1) {
        let tail = messages.slice(-MAX_TAIL);
        // 若尾部第一帧是 user（说明半对被截断），丢弃它，保证从 assistant 开始
        if (tail.length && tail[0].role === 'user') tail = tail.slice(1);
        toSave = [messages[0]].concat(tail);
      }
      localStorage.setItem(storageKey(profile), JSON.stringify(toSave));
    } catch (e) { /* 存储满时静默失败 */ }
  }

  // 通用轻提示
  function showToast(message, duration = 1800) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, duration);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function scrollToBottom() {
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  }

  // 立即定位到底部（无动画），用于恢复历史对话后确保直接看到最新消息
  function jumpToBottom() {
    chat.scrollTop = chat.scrollHeight;
  }

  // Bot 头像（所有 bot 气泡共用）
  const BOT_AVATAR = `
    <div class="chat__avatar">
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="6" y="6" width="36" height="36" rx="8" fill="#16b2b2"/>
        <circle cx="18" cy="22" r="3" fill="#fff"/>
        <circle cx="30" cy="22" r="3" fill="#fff"/>
        <rect x="20" y="30" width="8" height="2" rx="1" fill="#fff"/>
      </svg>
    </div>`;

  // ===== UserBubble 组件（唯一用户气泡渲染入口）=====
  // 外层行容器右对齐；内层固定宽度规则，手动输入与点击选项共用
  function UserBubble(text) {
    return `
      <div class="chat__item chat__item--user">
        <div class="chat__content">
          <div class="chat__bubble chat__bubble--user"><p>${escapeHtml(text)}</p></div>
        </div>
      </div>`;
  }

  // 创建消息 DOM；用户消息统一走 UserBubble
  function appendMessage(text, isUser = false) {
    const item = document.createElement('div');
    if (isUser) {
      item.className = 'chat__item chat__item--user';
      item.innerHTML = UserBubble(text);
    } else {
      item.className = 'chat__item chat__item--bot';
      item.innerHTML = `
        ${BOT_AVATAR}
        <div class="chat__content">
          <div class="chat__bubble chat__bubble--bot"><div class="chat__bubble-text"><p>${escapeHtml(text)}</p></div></div>
        </div>
      `;
    }

    chatList.appendChild(item);
    scrollToBottom();
  }

  // 追加"正在思考"占位气泡，返回其文本节点以便稍后替换
  function appendTyping() {
    const item = document.createElement('div');
    item.className = 'chat__item chat__item--bot';
    item.innerHTML = `
      ${BOT_AVATAR}
      <div class="chat__content">
        <div class="chat__bubble chat__bubble--bot"><p>正在思考…</p></div>
      </div>
    `;
    chatList.appendChild(item);
    scrollToBottom();
    return item.querySelector('p');
  }

  // ===== 选择题识别（框架能力，供任意提示词产出的回复复用）=====

  // ===== 选择题解析 =====
  // 契约：模型出题时须在题干后另起一行输出「选项：」，再逐行列选项，前端最优先解析该标记块。
  // 解析顺序：显式标记块 → 连续编号行块（题干问号兜底）→ 行内编号 → "或者/还是"。
  // 行匹配做了归一化，容忍：行首 bullet/引用符、**加粗**包裹、全角数字与全角句点、中文圈号①。

  // 数字/字母/圈号 + 分隔符（半角/全角）+ 内容
  const OPT_PREFIX_RE = /^\s*(?:(\d{1,2})|([A-Ha-h])|([①-⑩])|([１-９]))\s*[.．、)）:：]\s*(\S.*)$/;

  // 从归一化后的行中提取选项内容（去除加粗/反引号包裹）
  function optText(line) {
    const m = line.match(OPT_PREFIX_RE);
    if (!m) return null;
    return m[5].replace(/\*\*|\*|`/g, '').trim();
  }

  // 归一化选项行：去掉行首列表符与整行 markdown 强调
  function normOptLine(s) {
    return s
      .replace(/^\s*[-*•·◦▪◆◇]+\s*/, '')
      .replace(/^\s*\*\*+/, '')
      .replace(/\*\*+\s*$/, '')
      .trim();
  }

  // 从 AI 回复中解析选择题选项
  function parseOptions(text) {
    const rawLines = text.split('\n');
    const lines = rawLines.map(normOptLine);

    // A) 显式「选项：」标记块：标记行之后连续的编号行即为选项（最可靠，不依赖问号就近）
    const markerIdx = lines.findIndex((l) => /^选项[：:]\s*$/.test(l));
    if (markerIdx !== -1) {
      const options = [];
      for (let i = markerIdx + 1; i < lines.length; i++) {
        if (lines[i] === '') continue; // 容忍标记与选项之间的空行
        const t = optText(lines[i]);
        if (t === null) break; // 遇到非选项行即结束
        options.push(t);
      }
      if (options.length >= 2) {
        const body = rawLines.slice(0, markerIdx + 1)
          .join('\n')
          .replace(/^\s*选项[：:]\s*$/gm, '')
          .trim();
        return { body, options };
      }
    }

    // B) 列表式：连续编号行块（≥2 行）取最长；选项块前 8 行内须出现问号，
    //    否则视为陈述中混入的编号列表，不识别为选项
    let best = { start: -1, end: -1, count: 0, hasQuestion: false };
    let curStart = -1;
    let count = 0;
    for (let idx = 0; idx <= lines.length; idx++) {
      const t = idx < lines.length ? optText(lines[idx]) : null;
      if (t !== null) {
        if (curStart === -1) curStart = idx;
        count++;
      } else {
        if (count >= 2 && count > best.count) {
          const lookback = lines.slice(Math.max(0, curStart - 8), curStart).join('\n');
          best = { start: curStart, end: idx - 1, count, hasQuestion: /[?？]/.test(lookback) };
        }
        curStart = -1;
        count = 0;
      }
    }
    if (best.count >= 2 && best.hasQuestion) {
      const options = [];
      for (let idx = best.start; idx <= best.end; idx++) {
        const t = optText(lines[idx]);
        if (t !== null) options.push(t);
      }
      // 题干取选项块之前的内容；选项块之后的提示文字舍弃
      const body = rawLines.slice(0, best.start).join('\n').trim();
      return { body, options };
    }

    // C) 行内列表："1.xxx 2.xxx" / "A:xxx B:xxx"。同样要求题干含问号。
    {
      const parts = text.split(/(?:[1-9]\d{0,1}|[A-Ha-h])[.．、)）:：]/);
      if (parts.length >= 3 && /[?？]/.test(parts[0])) {
        const opts = parts.slice(1).map((s) => s.trim()).filter(Boolean);
        if (opts.length >= 2) {
          return { body: parts[0].trim(), options: opts };
        }
      }
    }

    // D) 中文"或者""还是"分隔的并列结构（兜底）
    if (/或者|还是/.test(text)) {
      const m = text.match(/^([^，？。\?:：]+?)[，：:]?\s*([^，？。\?:：]+?)\s*或者\s*([^？。\?:：]+?)(?:\s*或者\s*([^？。\?:：]+?))?(?:\s*或者\s*([^？。\?:：]+?))?\??$/);
      if (m) {
        const intro = m[1].trim() + '：';
        const opts = [m[2], m[3], m[4], m[5]].filter(Boolean).map((s) => s.trim());
        if (opts.length >= 2) {
          return { body: intro, options: opts };
        }
      }
    }

    return { body: text, options: [] };
  }

  // 判断 AI 回复是否为多选：识别题干标注（全角/半角括号、"可多选/多选题/多选"等）
  function isMultiSelect(reply) {
    if (!reply) return false;
    return (
      /[（(]\s*可?多?选(?:项|题)?\s*[)）]/.test(reply) ||
      /【\s*可?多?选(?:项|题)?\s*】/.test(reply) ||
      /多选题|可多选|可多项|可挑选|可勾选|多选/.test(reply)
    );
  }

  // 从题干中剥离多选标注与「选项：」标记行，避免展示给用户
  function stripMultiTag(text) {
    if (!text) return text;
    return text
      .replace(/【\s*可?多?选(?:项|题)?\s*】/g, '')
      .replace(/[（(]\s*可?多?选(?:项|题)?\s*[)）]/g, '')
      .replace(/^\s*选项[：:]\s*$/gm, '')
      .replace(/^\s*[·:：]\s*/, '')
      .trim();
  }

  // 轻量 Markdown 渲染：标题、加粗、斜体、行内代码、无序/有序列表、段落
  function mdToHtml(text) {
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let listType = '';
    const closeList = () => { if (inList) { html += '</' + listType + '>'; inList = false; } };
    const inline = (s) => s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    for (const raw of lines) {
      const line = escapeHtml(raw).trim();
      if (line === '') { closeList(); continue; }
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { closeList(); const l = h[1].length; html += '<h' + l + '>' + inline(h[2]) + '</h' + l + '>'; continue; }
      const ul = line.match(/^[-*+]\s+(.*)$/);
      if (ul) { if (!inList || listType !== 'ul') { closeList(); html += '<ul>'; inList = true; listType = 'ul'; } html += '<li>' + inline(ul[1]) + '</li>'; continue; }
      const ol = line.match(/^\d+[.、)]\s+(.*)$/);
      if (ol) { if (!inList || listType !== 'ol') { closeList(); html += '<ol>'; inList = true; listType = 'ol'; } html += '<li>' + inline(ol[1]) + '</li>'; continue; }
      closeList(); html += '<p>' + inline(line) + '</p>';
    }
    closeList();
    return html;
  }

  // 多选模式：更新已选计数与确认按钮可用态
  function updateConfirmBtn(list) {
    const count = list.querySelector('.option-list__count');
    const confirm = list.querySelector('.option-list__confirm');
    const selected = list.querySelectorAll('.option-list__item.is-selected').length;
    if (count) count.textContent = '已选 ' + selected + ' 项';
    if (confirm) confirm.disabled = selected === 0;
  }

  // 渲染 AI 回复：正文 markdown 渲染 + 选项按钮（支持单选/多选）
  // ===== 结构化推荐卡：AI 以「【套餐卡】…【卡完】」与「【推荐理由】…【理由完】」输出 =====
  function parseCardField(line) {
    const m = line.match(/^\s*(档位|名称|城市|价格|原价|对比|覆盖|注意)[：:]\s*(.+)$/);
    return m ? [m[1], m[2].trim()] : null;
  }

  function parseCardBlocks(reply) {
    const cards = [];
    const re = /【\s*套餐卡\s*】([\s\S]*?)【\s*卡完\s*】/g;
    let mm;
    while ((mm = re.exec(reply || '')) !== null) {
      const card = { tier: '', name: '', city: '', price: '', orig: '', diff: '', coverage: [], note: '' };
      mm[1].split('\n').forEach((ln) => {
        const kv = parseCardField(ln);
        if (!kv) return;
        if (kv[0] === '覆盖') card.coverage = kv[1].split(/[；;、]/).map((s) => s.trim()).filter(Boolean);
        else if (kv[0] === '对比') card.diff = kv[1];
        else if (kv[0] === '档位') card.tier = kv[1];
        else if (kv[0] === '名称') card.name = kv[1];
        else if (kv[0] === '城市') card.city = kv[1];
        else if (kv[0] === '价格') card.price = kv[1];
        else if (kv[0] === '原价') card.orig = kv[1];
        else if (kv[0] === '注意') card.note = kv[1];
      });
      if (card.name) cards.push(card);
    }
    return cards;
  }

  // 解析推荐理由块（S5/S7 通用，渲染为浅色独立卡片）
  function parseReason(reply) {
    const m = /【\s*推荐理由\s*】([\s\S]*?)【\s*理由完\s*】/.exec(reply || '');
    if (!m) return '';
    return m[1].trim();
  }

  // 从文本中移除推荐理由标记块，避免正文重复展示
  function stripReasonBlocks(text) {
    if (!text) return text;
    return text.replace(/【\s*推荐理由\s*】[\s\S]*?【\s*理由完\s*】/g, '');
  }

  // 把正文按块切成有序片段（文字段 / 套餐卡 / 推荐理由），保持原顺序渲染
  function splitCardSegments(text) {
    if (!text) return [];
    const segs = [];
    const markerRe = /【\s*(套餐卡|推荐理由)\s*】/g;
    const closerRe = { '套餐卡': /【\s*卡完\s*】/, '推荐理由': /【\s*理由完\s*】/ };
    let m;
    let cursor = 0;
    while ((m = markerRe.exec(text)) !== null) {
      const head = text.slice(cursor, m.index).trim();
      if (head) segs.push({ type: 'text', text: head });
      const kind = m[1];
      const endMatch = closerRe[kind].exec(text.slice(m.index + m[0].length));
      if (!endMatch) {
        // 块未闭合：直接作为文字，避免丢内容
        const rest = text.slice(m.index).trim();
        if (rest) segs.push({ type: 'text', text: rest });
        cursor = text.length;
        break;
      }
      const endAbs = m.index + m[0].length + endMatch.index + endMatch[0].length;
      const inner = text.slice(m.index + m[0].length, m.index + m[0].length + endMatch.index);
      if (kind === '套餐卡') {
        const parsed = parseCardBlocks('【套餐卡】' + inner + '【卡完】');
        if (parsed.length) segs.push({ type: 'card', card: parsed[0] });
      } else {
        segs.push({ type: 'reason', text: inner.trim() });
      }
      cursor = endAbs;
    }
    const tail = text.slice(cursor).trim();
    if (tail) segs.push({ type: 'text', text: tail });
    return segs;
  }

  // 金额：整数不带小数，非整数最多保留 1 位（如 2250 / 3187.5）
  function fmtMoney(v) {
    const n = parseFloat(v);
    if (isNaN(n)) return String(v == null ? '' : v);
    return (Math.round(n * 10) / 10).toString();
  }

  const TIER_MOD = { '最推荐': 'best', '性价比方案': 'value', '更全面方案': 'full', '加项': 'best', '主套餐': 'best' };
  const TIER_SHORT = { '最推荐': '最推荐', '性价比方案': '性价比', '更全面方案': '更全面', '最终推荐': '最终推荐' };

  // 渲染单张推荐卡（白底 + 左侧绿色竖条；点击 → 套餐详情抽屉）
  function buildCardEl(card) {
    const isAddon = card.tier === '加项';
    const mod = TIER_MOD[card.tier] || (isAddon ? 'best' : 'value');
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'pkg pkg--' + mod;
    const price = fmtMoney(card.price);
    const orig = fmtMoney(card.orig);
    const numericPrice = parseFloat(card.price);
    let html = '<span class="pkg__head">' +
      '<span class="pkg__tag">' + escapeHtml(card.tier || '推荐') + '</span>' +
      '<span class="pkg__name">' + escapeHtml(card.name || '套餐') + '</span>' +
      '</span>';
    html += '<span class="pkg__price">' +
      (isAddon
        ? (numericPrice > 0
            ? '<b>¥' + escapeHtml(price) + '</b><em>单点价</em>'
            : '<b>' + escapeHtml(card.price || '另付') + '</b>')
        : (numericPrice > 0
            ? '<b>¥' + escapeHtml(price) + '</b>' + (orig ? '<em>原价 ¥' + escapeHtml(orig) + '</em>' : '')
            : '<b>' + escapeHtml(card.price || '') + '</b>')) +
      '</span>';
    // 差异/对比行（客观，放在卡内显眼位置；AI 在对比值里写明"较哪个档"）
    if (card.diff) {
      const label = isAddon ? '为何加' : '对比';
      html += '<span class="pkg__row pkg__row--diff"><span class="pkg__k">' + escapeHtml(label) + '</span><span class="pkg__v">' + escapeHtml(card.diff) + '</span></span>';
    }
    // 覆盖/价格信息存在且非加项时，卡片可点击展开详情
    const hasDetail = !isAddon && card.coverage && card.coverage.length;
    if (hasDetail) {
      html += '<span class="pkg__foot">点击查看套餐详情 ›</span>';
    }
    el.innerHTML = html;
    if (hasDetail) el.addEventListener('click', () => openPkgSheet(card));
    return el;
  }

  // 推荐理由块：渲染为独立的浅色卡片，位于所有套餐卡/加项卡下方
  function buildReasonEl(reason, title) {
    const el = document.createElement('div');
    el.className = 'pkg__reason';
    el.innerHTML =
      '<span class="pkg__reason__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none">' +
          '<path d="M9 18h6M10 21h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M12 3a6 6 0 0 0-3.5 10.9V15h7v-1.1A6 6 0 0 0 12 3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
        '</svg>' +
      '</span>' +
      '<div class="pkg__reason__main">' +
        '<p class="pkg__reason__title">' + escapeHtml(title || '为什么这样推荐') + '</p>' +
        '<p class="pkg__reason__text"></p>' +
      '</div>';
    el.querySelector('.pkg__reason__text').textContent = reason;
    return el;
  }

  // 底部固定引导（S5 初步推荐用）：不列选项，提供「继续提问」单一按钮
  function buildContinuePanel() {
    const el = document.createElement('div');
    el.className = 'rec-guide';
    el.innerHTML =
      '<p class="rec-guide__text">目前这个推荐可以作为选购参考，点击卡片可以查看套餐详情。如果希望更细致、准确的推荐，我会再问您一些问题，以便更加了解您的诉求。</p>' +
      '<button type="button" class="rec-guide__btn">继续提问</button>';
    el.querySelector('.rec-guide__btn').addEventListener('click', () => {
      const btn = el.querySelector('.rec-guide__btn');
      btn.disabled = true;
      sendPrompt('请继续提问，帮我进一步细化推荐方案。', true);
    });
    return el;
  }

  function renderBotReply(typingEl, reply) {
    const { body, options } = parseOptions(reply);
    const multi = isMultiSelect(reply);
    // 排查辅助：看似问句却未解析出选项时，控制台打印原始回复便于定位模型输出格式
    if (options.length === 0 && body && /[?？]/.test(body)) {
      console.debug('[选项解析] 未识别到选项，原始回复：', reply);
    }
    const bubble = typingEl.closest('.chat__bubble');
    bubble.innerHTML = '';

    const cards = parseCardBlocks(reply);
    const reasonText = parseReason(reply) || '';
    // S5：有套餐卡且无选项（S5 不列选项）；S7：套餐/加项卡 + 选项
    const isS5Recommend = cards.length > 0 && options.length === 0;

    // 先按原顺序渲染文字段与套餐/加项卡；理由块先收集，等所有卡片渲染完再统一追加到卡片下方，
    // 保证【推荐理由】始终是一张独立的卡片、且位于所有套餐卡与加项卡下面（不依赖 AI 的输出顺序）
    let reasonHtml = '';
    splitCardSegments(body || '').forEach((seg) => {
      if (seg.type === 'text') {
        const div = document.createElement('div');
        div.className = 'chat__bubble-text';
        div.innerHTML = mdToHtml(stripMultiTag(seg.text));
        bubble.appendChild(div);
      } else if (seg.type === 'card') {
        bubble.appendChild(buildCardEl(seg.card));
      } else if (seg.type === 'reason') {
        if (!reasonHtml) reasonHtml = seg.text;
      }
    });
    // 兜底：segment 未解析出理由时，用正则提取的结果补上
    if (!reasonHtml && reasonText) reasonHtml = reasonText;
    if (reasonHtml) {
      bubble.appendChild(buildReasonEl(reasonHtml, '为什么这样推荐'));
    }

    if (options.length > 0) {
      const list = document.createElement('div');
      list.className = 'option-list' + (multi ? ' option-list--multi' : '');

      // 多选提示条：题干写明"最多选 N 项"时优先展示上限，否则提示可多选
      if (multi) {
        const maxMatch = body.match(/最多[可选]?[择]?\s*(\d+)\s*项/);
        const hint = document.createElement('div');
        hint.className = 'option-list__hint';
        hint.innerHTML = '<span class="option-list__hint-mark">多选</span>' +
          (maxMatch ? '本题最多可选 ' + maxMatch[1] + ' 项' : '本题可多选，请选择所有符合的选项');
        list.appendChild(hint);
      }

      options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-list__item';
        btn.dataset.optIndex = i + 1;
        // 兜底项（以上都不是/不确定等）与具体选项互斥
        if (/以上都不是|以上都不太像|都不太像|不太像|不确定|没有特别明显/.test(opt)) {
          btn.dataset.fallback = '1';
        }
        btn.innerHTML = '<span class="option-list__index">' + (i + 1) + '</span>' +
                        '<span class="option-list__text">' + escapeHtml(opt) + '</span>' +
                        (multi
                          ? '<span class="option-list__check" aria-hidden="true"></span>'
                          : '<span class="option-list__arrow">›</span>');
        btn.addEventListener('click', () => {
          if (multi) {
            if (btn.dataset.fallback) {
              // 选中兜底项：清空其他选中
              list.querySelectorAll('.option-list__item.is-selected').forEach((b) => b.classList.remove('is-selected'));
              btn.classList.add('is-selected');
            } else {
              // 选中具体项：取消兜底项
              const fallback = list.querySelector('.option-list__item[data-fallback]');
              if (fallback) fallback.classList.remove('is-selected');
              btn.classList.toggle('is-selected');
            }
            updateConfirmBtn(list);
          } else {
            list.querySelectorAll('.option-list__item').forEach((b) => { b.disabled = true; });
            sendPrompt(opt, true);
          }
        });
        list.appendChild(btn);
      });

      if (multi) {
        const foot = document.createElement('div');
        foot.className = 'option-list__foot';
        const count = document.createElement('span');
        count.className = 'option-list__count';
        count.textContent = '已选 0 项';
        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'option-list__confirm';
        confirm.textContent = '确认选择';
        confirm.disabled = true;
        confirm.addEventListener('click', () => {
          const selected = Array.from(list.querySelectorAll('.option-list__item.is-selected'))
            .map((b) => b.dataset.optIndex + '、' + b.querySelector('.option-list__text').textContent);
          if (!selected.length) return;
          list.querySelectorAll('.option-list__item, .option-list__confirm').forEach((b) => { b.disabled = true; });
          sendPrompt(selected.join('；'), true);
        });
        foot.appendChild(count);
        foot.appendChild(confirm);
        list.appendChild(foot);
      }

      bubble.appendChild(list);

      // 跳过入口：用户可随时跳过当前问题（提示词约定记录为未知并进入下一步）
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'option-list__skip';
      skip.textContent = '跳过这个问题';
      skip.addEventListener('click', () => {
        bubble.querySelectorAll('.option-list__item, .option-list__confirm, .option-list__skip')
          .forEach((b) => { b.disabled = true; });
        sendPrompt('跳过', true);
      });
      bubble.appendChild(skip);
    }

    // S5 初步推荐引导：有卡片且无选项时展示普通引导文字 + 轻量「继续提问」
    if (isS5Recommend) {
      bubble.appendChild(buildContinuePanel());
    }
  }

  // 渲染一条历史消息（保留选项文本为只读列表；AI 消息保留 markdown 格式）
  function renderHistoryMessage(msg) {
    if (!msg || msg.role === 'system') return;
    const content = typeof msg.content === 'string' ? msg.content : '';
    if (msg.role === 'user') {
      appendMessage(content, true);
    } else if (msg.role === 'assistant') {
      const { body, options } = parseOptions(content);
      const item = document.createElement('div');
      item.className = 'chat__item chat__item--bot';
      item.innerHTML = `
        ${BOT_AVATAR}
        <div class="chat__content">
          <div class="chat__bubble chat__bubble--bot"></div>
        </div>
      `;
      const bubble = item.querySelector('.chat__bubble');

      // 先渲染文字段与套餐/加项卡；理由统一追加到所有卡片下方，保持与实时渲染一致
      let reasonHtml = '';
      splitCardSegments(body || content || '').forEach((seg) => {
        if (seg.type === 'text') {
          const div = document.createElement('div');
          div.className = 'chat__bubble-text';
          div.innerHTML = mdToHtml(stripMultiTag(seg.text));
          bubble.appendChild(div);
        } else if (seg.type === 'card') {
          bubble.appendChild(buildCardEl(seg.card));
        } else if (seg.type === 'reason') {
          if (!reasonHtml) reasonHtml = seg.text;
        }
      });
      if (!reasonHtml) reasonHtml = parseReason(content) || '';
      if (reasonHtml) {
        bubble.appendChild(buildReasonEl(reasonHtml, '为什么这样推荐'));
      }

      // 历史选项：保留文本，仅作展示，不可再点击
      if (options.length > 0) {
        const list = document.createElement('div');
        list.className = 'option-list option-list--readonly';
        options.forEach((opt, i) => {
          const row = document.createElement('div');
          row.className = 'option-list__item';
          row.innerHTML = '<span class="option-list__index">' + (i + 1) + '</span>' +
                          '<span class="option-list__text">' + escapeHtml(opt) + '</span>';
          list.appendChild(row);
        });
        bubble.appendChild(list);
      }

      chatList.appendChild(item);
    }
  }

  // 发送一条消息到接口；showUser=false 时不展示用户气泡（用于 AI 自动开场后的隐式上下文）
  async function sendPrompt(content, showUser = true) {
    if (!content) return;
    if (showUser) appendMessage(content, true);
    messages.push({ role: 'user', content });

    // 每轮刷新 system：按最新对话检索知识库片段后注入，保证推荐有据可依
    refreshSystemPrompt();

    const typing = appendTyping();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages
        })
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('认证失败，请检查接口密钥（Authorization）。');
        }
        throw new Error('服务返回异常（HTTP ' + res.status + '）。');
      }

      const data = await res.json();
      const rawReply = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '抱歉，暂时没有收到有效回复，请稍后再试。';

      // 移除小结生成标记（不显示给用户），标记存在时稍后推送小结卡片
      const reply = rawReply.replace(SUMMARY_GENERATE_RE, '').trim() || '抱歉，暂时没有收到有效回复，请稍后再试。';

      messages.push({ role: 'assistant', content: reply });
      renderBotReply(typing, reply);
      updateStage(reply);
      scrollToBottom();
      // 成功后持久化对话历史
      if (currentCtx) saveHistory(messages, currentCtx.version);
      // 检测到小结标记 → 在对话中推送咨询小结卡片
      if (SUMMARY_GENERATE_RE.test(rawReply)) {
        setTimeout(appendSummaryCard, 700);
      }
    } catch (err) {
      const isNetErr = err && (err instanceof TypeError || /failed to fetch|networkerror/i.test(String(err.message)));
      typing.textContent = isNetErr
        ? '回复失败：网络或跨域(CORS)请求被拦截。请确认通过线上地址访问；本地直接打开文件会因接口跨域白名单限制而失败。'
        : '回复失败：' + err.message + ' 请稍后重试。';
      scrollToBottom();
    }
  }

  // ===== 咨询小结卡片 + 底部弹层 =====

  // 在对话末尾推送"咨询小结卡片"：点击展开小结内容
  function appendSummaryCard() {
    if (chatList.querySelector('.summary-card')) return; // 同一轮只推一次
    const item = document.createElement('div');
    item.className = 'chat__item chat__item--bot';
    item.innerHTML = `
      ${BOT_AVATAR}
      <div class="chat__content">
        <button type="button" class="summary-card" id="summaryCardBtn">
          <span class="summary-card__icon">
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </span>
          <span class="summary-card__body">
            <span class="summary-card__title"><span class="summary-card__badge">专属</span>您的体检方案推荐小结已生成</span>
            <span class="summary-card__sub">点击查看推荐方案、覆盖重点与补充建议</span>
          </span>
          <span class="summary-card__arrow">›</span>
        </button>
      </div>
    `;
    chatList.appendChild(item);
    const btn = item.querySelector('#summaryCardBtn');
    if (btn) btn.addEventListener('click', openSummarySheet);
    scrollToBottom();
  }

  function renderSheetLoading() {
    summaryBody.innerHTML = `
      <div class="sheet__loading">
        <div class="sheet__loading-ring" aria-hidden="true"></div>
        <p class="sheet__loading-text">正在整理您的体检方案推荐小结…</p>
        <p class="sheet__loading-sub">约需 10–20 秒，请耐心等待</p>
      </div>`;
  }

  async function openSummarySheet() {
    summarySheet.hidden = false;
    renderSheetLoading();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY
        },
        body: JSON.stringify({
          model: MODEL,
          messages: buildSummaryMessages(messages)
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '';
      summaryBody.innerHTML = text ? mdToHtml(text) : '<p>暂时没有生成小结内容，请稍后重试。</p>';
    } catch (e) {
      summaryBody.innerHTML = '<p>小结生成失败，请检查网络后重试。</p>';
    }
  }

  function closeSummarySheet() {
    summarySheet.hidden = true;
  }

  summarySheet.addEventListener('click', (e) => {
    if (e.target.dataset && e.target.dataset.close) closeSummarySheet();
  });
  document.getElementById('summaryClose').addEventListener('click', closeSummarySheet);

  // ===== 套餐详情弹层（点击推荐卡打开）=====
  function openPkgSheet(card) {
    const mod = TIER_MOD[card.tier] || 'value';
    const price = fmtMoney(card.price);
    const orig = fmtMoney(card.orig);
    const isAddon = card.tier === '加项';
    let priceHtml;
    if (isAddon) {
      priceHtml = (parseFloat(card.price) > 0 ? '<b>¥' + escapeHtml(fmtMoney(card.price)) + '</b><em>单点价</em>' : '<b>' + escapeHtml(card.price || '另付') + '</b>');
    } else {
      priceHtml = (parseFloat(card.price) > 0 ? '<b>¥' + escapeHtml(price) + '</b>' + (orig ? '<em>原价 ¥' + escapeHtml(orig) + '</em>' : '') : '<b>' + escapeHtml(card.price || '') + '</b>');
    }
    let html = '<div class="pkg-detail">' +
      '<div class="pkg-detail__tag pkg--' + mod + '-tag">' + escapeHtml(card.tier || '推荐') + '</div>' +
      '<div class="pkg-detail__name">' + escapeHtml(card.name || '套餐') + '</div>' +
      (card.city ? '<div class="pkg-detail__city">' + escapeHtml(card.city) + '</div>' : '') +
      '<div class="pkg-detail__price">' + priceHtml + '</div>';
    if (card.diff) {
      html += '<div class="pkg-detail__sec">差异说明</div><p class="pkg-detail__note">' + escapeHtml(card.diff) + '</p>';
    }
    if (card.coverage && card.coverage.length) {
      html += '<div class="pkg-detail__sec">覆盖重点</div><div class="pkg-detail__chips">' +
        card.coverage.map((c) => '<span class="pkg__check">' + escapeHtml(c) + '</span>').join('') + '</div>';
    }
    if (card.coverage && card.coverage.length) {
      html += '<div class="pkg-detail__sec">覆盖重点</div><div class="pkg-detail__chips">' +
        card.coverage.map((c) => '<span class="pkg__check">' + escapeHtml(c) + '</span>').join('') + '</div>';
    }
    if (card.note) {
      html += '<div class="pkg-detail__sec">需要注意</div><p class="pkg-detail__note">' + escapeHtml(card.note) + '</p>';
    }
    html += '<p class="pkg-detail__tip">套餐与价格为卓正门店实时为准，本卡信息来自体检知识库；具体预约与加项请以官方渠道确认为准。</p>' +
      '</div>';
    pkgSheetBody.innerHTML = html;
    pkgSheet.hidden = false;
  }

  function closePkgSheet() {
    pkgSheet.hidden = true;
  }

  pkgSheet.addEventListener('click', (e) => {
    if (e.target.dataset && e.target.dataset.close) closePkgSheet();
  });
  document.getElementById('pkgSheetClose').addEventListener('click', closePkgSheet);

  // ===== 开场白（框架：直接渲染，不走接口，同时写入 messages 保持对话结构完整）=====
  // options 中的项点击即发送
  function showGreeting(text, introUser, options) {
    const item = document.createElement('div');
    item.className = 'chat__item chat__item--bot';
    item.innerHTML = `
      ${BOT_AVATAR}
      <div class="chat__content">
        <div class="chat__bubble chat__bubble--bot"><div class="chat__bubble-text">${mdToHtml(text)}</div></div>
      </div>
    `;
    chatList.appendChild(item);
    messages.push({ role: 'user', content: introUser });
    messages.push({ role: 'assistant', content: text });
    scrollToBottom();
    if (currentCtx) { try { saveHistory(messages, currentCtx.version); } catch (e) { /* 忽略 */ } }

    if (options && options.length) {
      const wrap = document.createElement('div');
      wrap.className = 'option-list';
      options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-list__item';
        btn.innerHTML =
          '<span class="option-list__index">' + (i + 1) + '</span>' +
          '<span class="option-list__text">' + escapeHtml(opt) + '</span>' +
          '<span class="option-list__arrow">›</span>';
        btn.addEventListener('click', () => {
          wrap.querySelectorAll('.option-list__item').forEach((b) => { b.disabled = true; });
          sendPrompt(opt, true);
        });
        wrap.appendChild(btn);
      });
      chatList.appendChild(wrap);
      scrollToBottom();
    }
  }

  function sendUserMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    messageInput.value = '';
    updateSendButton();
    sendPrompt(text);
  }

  function updateSendButton() {
    if (messageInput.value.trim()) {
      sendBtn.classList.remove('is-disabled');
    } else {
      sendBtn.classList.add('is-disabled');
    }
  }

  // ===== 入口上下文读取 =====
  // 支持：localStorage/sessionStorage 的 consultCtx，以及 URL 参数 ?version=&name=&age=&gender=&symptom=
  function readEntryCtx() {
    let ctx = null;
    try {
      const raw = localStorage.getItem('consultCtx') || sessionStorage.getItem('consultCtx');
      if (raw) ctx = JSON.parse(raw);
    } catch (e) { /* 忽略损坏的上下文 */ }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = {
      version: params.get('version') || '',
      symptom: params.get('symptom') || '',
      history: params.get('history') || ''
    };
    const profileFromUrl = {
      name: params.get('name') || '',
      age: params.get('age') || '',
      gender: params.get('gender') || ''
    };
    const hasUrlProfile = Object.values(profileFromUrl).some(Boolean);
    const hasUrlCtx = Object.values(fromUrl).some(Boolean);

    if (!ctx && !hasUrlCtx && !hasUrlProfile) {
      return { version: 'guest', profile: {}, symptom: '', history: '' };
    }

    ctx = ctx || {};
    return {
      version: ctx.version || fromUrl.version || 'guest',
      profile: Object.assign({}, ctx.profile || {}, hasUrlProfile ? profileFromUrl : {}),
      symptom: ctx.symptom || fromUrl.symptom || '',
      history: ctx.history || fromUrl.history || ''
    };
  }

  // 入口：加载知识库 → 读取上下文 → 构建 System Prompt → 恢复历史
  async function init() {
    const ctx = readEntryCtx();
    currentCtx = ctx;
    ctx.fromHistory = false;
    // 先加载知识库，再组装含知识库片段的 system（失败时降级为方向性建议）
    await loadKnowledgeBase();
    messages = [{ role: 'system', content: composeSystem() }];

    // 尝试恢复本地历史对话（同一档案）；有历史则不重新开场
    let history = null;
    try {
      history = loadHistory(ctx.version);
    } catch (e) { history = null; }

    if (Array.isArray(history) && history.length > 0) {
      // 校验首条是 system，且用最新 systemPrompt（信息可能变化）
      const restored = history.filter((m) => m && m.role !== 'system');
      messages = [messages[0]].concat(restored);
      restored.forEach((m) => {
        try { renderHistoryMessage(m); } catch (e) { /* 忽略单条渲染失败 */ }
      });
      // 直接定位到最新对话（立即 + 渲染稳定后二次定位）
      jumpToBottom();
      requestAnimationFrame(() => { jumpToBottom(); });
      ctx.fromHistory = true;
      currentCtx = ctx;
    }
    return ctx;
  }

  // ===== 推荐进度（对应状态机阶段）：需求确认 → 初步推荐 → 精准优化 → 方案确定 =====
  const STAGE_LABELS = ['需求确认', '初步推荐', '精准优化', '方案确定'];
  const STAGE_FINAL_RE = /个性化调整|最推荐方案/;
  const STAGE_RECOMMEND_RE = /性价比方案|更全面方案|###\s*最推荐/;
  let currentStage = 1;

  function renderStage() {
    const items = document.querySelectorAll('#stage .stage__item');
    items.forEach((el, i) => {
      const n = i + 1;
      el.classList.toggle('is-active', n === currentStage);
      el.classList.toggle('is-done', n < currentStage);
    });
  }

  // 依据回复内容推进阶段：最终推荐 → 4；初步推荐 → 2；初步推荐后的追问 → 3
  function updateStage(reply) {
    let next = currentStage;
    if (STAGE_FINAL_RE.test(reply)) next = 4;
    else if (STAGE_RECOMMEND_RE.test(reply)) next = 2;
    else if (currentStage === 2 && /[?？]/.test(reply)) next = 3;
    if (next !== currentStage) {
      currentStage = next;
      renderStage();
    }
  }

  // 快捷入口：转真人顾问 / 浏览全部套餐 / 既往体检异常 / 预约购买
  const CHIP_PROMPTS = {
    packages: '我想先看看你们有哪些体检套餐。',
    history: '我以前体检发现过异常项，帮我把这个考虑进去。'
  };
  const CHIP_NOTICES = {
    human: '正在为您转接真人健康顾问，请稍候…',
    booking: '正在为您打开预约与购买页…'
  };
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      // 提问型入口：直接以用户身份发起
      if (CHIP_PROMPTS[action]) {
        sendPrompt(CHIP_PROMPTS[action], true);
        return;
      }
      // 演示型入口：直出提示气泡
      if (CHIP_NOTICES[action]) appendMessage(CHIP_NOTICES[action], false);
    });
  });

  // 发送消息
  sendBtn.addEventListener('click', sendUserMessage);
  messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendUserMessage();
  });
  messageInput.addEventListener('input', updateSendButton);
  updateSendButton();

  // ===== S1 开场白：首次进入与"重启对话"共用同一入口 =====
  function showWelcome() {
    showGreeting(
      '您好，我是卓正 AI 体检选购顾问。\n\n不用纠结套餐清单，回答几个小问题，我帮您在 30 秒内锁定合适的体检方向。\n\n这次体检是给谁选的？',
      '你好，我想选一个适合自己的体检方案。',
      ['我自己', '爸爸', '妈妈', '伴侣', '孩子', '其他家人']
    );
  }

  // ===== 顶部按钮：返回 / 更多菜单（含重启对话）=====
  document.getElementById('backBtn').addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else showToast('已是首页');
  });

  const moreArea = document.getElementById('moreArea');
  const moreMenu = document.getElementById('moreMenu');

  function moreMenuHtml(view) {
    if (view === 'confirm') {
      return `
        <div class="menu-pop__confirm">
          <p class="menu-pop__confirm-text">重启后将清空本次对话记录，且无法恢复。确定要重新开始吗？</p>
          <div class="menu-pop__actions">
            <button type="button" class="menu-pop__btn" id="cancelRestart">取消</button>
            <button type="button" class="menu-pop__btn menu-pop__btn--danger" id="okRestart">确认重启</button>
          </div>
        </div>`;
    }
    return `
      <button type="button" class="menu-pop__item" id="restartBtn">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 14-4.9M20 12a8 8 0 0 1-14 4.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 4v4h-4M6 20v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>重启对话</span>
      </button>`;
  }

  function openMoreMenu() {
    moreMenu.innerHTML = moreMenuHtml('list');
    moreMenu.hidden = false;
    document.getElementById('restartBtn').addEventListener('click', (e) => {
      // 阻止冒泡：视图切换会移除被点击的按钮，若不拦截，
      // 该次点击继续冒泡会命中 document 的"点外关闭"，导致菜单被立刻收起
      e.stopPropagation();
      moreMenu.innerHTML = moreMenuHtml('confirm');
      document.getElementById('cancelRestart').addEventListener('click', (e2) => {
        e2.stopPropagation();
        closeMoreMenu();
      });
      document.getElementById('okRestart').addEventListener('click', (e2) => {
        e2.stopPropagation();
        restartConversation();
      });
    });
  }

  function closeMoreMenu() {
    moreMenu.hidden = true;
  }

  // 重启对话：清空本地历史与页面会话，回到 S1 开场
  function restartConversation() {
    try {
      localStorage.removeItem(storageKey(currentCtx ? currentCtx.version : 'guest'));
    } catch (e) { /* 忽略 */ }
    closeMoreMenu();
    messages = [{ role: 'system', content: composeSystem() }];
    chatList.innerHTML = '';
    currentStage = 1;
    renderStage();
    showWelcome();
    showToast('对话已重新开始');
  }

  moreArea.querySelector('#moreBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (moreMenu.hidden) openMoreMenu();
    else closeMoreMenu();
  });
  // 点击菜单外关闭
  document.addEventListener('click', (e) => {
    if (!moreMenu.hidden && !moreArea.contains(e.target)) closeMoreMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSummarySheet();
      closePkgSheet();
      closeMoreMenu();
    }
  });

  // 初始滚动
  scrollToBottom();

  // 启动：加载知识库完成后，无历史时展示 S1 开场（确认体检对象），与提示词状态机起点保持一致
  init().then((ctx) => {
    renderStage();
    if (!ctx || !ctx.fromHistory) showWelcome();
  }).catch((e) => {
    console.warn('初始化失败：', e);
    renderStage();
  });
})();
