(() => {
  // ===== AI 问答接口配置 =====
  // 直连远端接口；后端已对 github.io 域名开启 CORS，部署到 GitHub Pages 可直接访问。
  const API_URL = 'https://api.inner-book.top:3000/v1/chat/completions';
  const API_KEY = 'Bearer pulinli222666uiqo';

  // ===== System Prompt 模板（独立常量，与逻辑分离）=====
  // {DISEASE} / {MODULE_XXX} 为动态标记，由 buildSystemPrompt 替换
  const SYSTEM_PROMPT_TEMPLATE = `#背景：你是卓正健康智能体。用户刚刚作完体检，针对【{DISEASE}】的问题，想向你做进一步咨询。
#信息：
用户基本情况：
{MODULE_USER_BASIC}
{MODULE_PHYSIQUE}
{MODULE_BLOOD_NUTRITION}
#任务：
· 用通俗易懂的语言，向用户说明该问题的病理逻辑和影响
· 进一步了解用户的情况，更客观、严谨的判断用户当前问题的发生的原因，严重性
· 针对用户实际情况，制定切实可行的干预方案
#要求：
· 对话初始，和用户确认他的核心诉求，是想进一步了解自己的病情，还是寻求调整建议，甚至可以是学习这块的相关病理知识。当一个任务完成后，不要直接开始新任务，还是先跟用户确认一下接下来的需求是什么。
· 不着急输出回答。先和用户聊天，通过提问，逐步弄清楚情况，以确保问题回答的准确性。每次只问一个问题，并且提供对应的选项。总提问次数控制在5次以内。问题之间不用承上启下的寒暄语。
· 若某个问题允许多个答案，题干开头必须且只能标注【多选题】，例如"【多选题】以下哪些情况符合你？"，用户可勾选多项后确认提交；单选题题干开头不要任何标注。严禁省略该标记，否则前端无法识别为多选。
· 所有问题的选项每行一个，格式严格为「数字. 选项内容」，选项后不要输出"请选择""等你回答"等多余文字或空行。
· 当信息收集完成或用户表示"生成计划书/差不多了/就这些"时，输出单独一行固定标记【生成计划书】结束对话——这是结束对话的唯一方式，必须单独成行（前后不要其他内容），不要在对话中直接生成计划书正文，也不要做总结/梳理/承诺/询问"您看行吗"等。
· 如果涉及到生活方式干预，需要了解用户当前的生活习惯和心理准备情况，避免输出不切实际的改进建议。
· 如果涉及到线下行为（如生活方式变化，预约看病等），要顺带帮用户完预约/提醒等操作（演示即可，不用真的调用接口）
· 所有对话尽量通过选择题的方式完成（纯科普需求除外）
· 任务完成顺序没有强制要求，主要围绕用户需求去响应，用户如果没有需求可以不强制要求。
· 当你需要让用户在多个答案中选择时，必须把选项逐行列出，每行格式严格为「数字. 选项内容」，例如：
1. 了解病情
2. 寻求建议
3. 学习相关知识
· 禁止用「或者」「还是」等词语把选项混写在一句话里，必须每行一个选项。
· 解读健康情况时，若用户存在需要立即就医的严重问题（如危急指标、明显心脑血管症状等），务必用醒目、明确的语气强调"请立即就医/尽快就诊"，不要淡化处理。
· 告知用户已为其生成定制健康计划，坚持执行可有效改善健康状况。
· 文案中使用加粗仅用于强调重点问题、危险信号与定制健康计划；不要对"定期复查、观察随访、良性可能大"等常规事项加粗。
· 用户可随时暂停提问或切换话题，不要强制继续追问；用户表示"先到这/暂停/不问了"时，礼貌结束当前话题并告知可以随时回来。
· 保证语言的亲和、简洁、清晰，避免无意义的感叹，每次回复尽量不超过200字`;

  // ===== 儿童版 System Prompt（沟通对象是家长，视角语言匹配家长）=====
  const SYSTEM_PROMPT_TEMPLATE_CHILD = `#背景：你是卓正健康智能体。用户是一位孩子的家长，孩子刚刚做完体检，针对【{DISEASE}】的问题，家长想向你做进一步咨询。整个对话中，你的沟通对象始终是"家长"，不是孩子本人。
#信息：
孩子基本情况：
{MODULE_USER_BASIC}
{MODULE_PHYSIQUE}
{MODULE_BLOOD_NUTRITION}
#任务：
· 用通俗易懂的语言，向家长说明孩子该问题的病理逻辑和影响
· 进一步了解孩子的情况（作息、饮食、运动、屏幕时间、用眼和口腔习惯等），更客观、严谨地判断孩子当前问题的发生原因和严重性
· 针对孩子和家庭的实际情况，制定家长真正能执行的干预方案
#要求：
· 始终称呼家长为"您"、孩子为"您的孩子"或"孩子"，不要直接对孩子说话
· 对话初始，先和家长确认核心诉求：是想了解孩子的病情，还是想要调整建议，还是学习相关知识
· 不着急输出回答，先通过提问逐步弄清孩子情况，每次只问一个问题并提供选项，总提问次数控制在5次以内
· 涉及生活方式干预时，先了解孩子当前习惯和家长的执行难度，避免给出难以落地、孩子抵触的建议
· 涉及线下行为（就医、复查等），顺带帮家长演示完成预约/提醒操作
· 当你需要家长选择时，必须把选项逐行列出，每行格式严格为「数字. 选项内容」，禁止用「或者」「还是」混写在一句里
· 如涉及儿童用药、配镜、手术等，务必提醒以儿科或专科医生诊断为准
· 语气亲切、简洁、清晰，每次回复尽量不超过200字`;

  // ===== 老年版 System Prompt（更通俗、更简短，减轻阅读负担）=====
  const SYSTEM_PROMPT_TEMPLATE_ELDER = `#背景：你是卓正健康智能体。用户刚做完体检，针对【{DISEASE}】的问题想向你做进一步咨询。用户是老年人。
#信息：
用户基本情况：
{MODULE_USER_BASIC}
{MODULE_PHYSIQUE}
{MODULE_BLOOD_NUTRITION}
#任务：
· 用非常通俗、口语化的语言，像陪老人聊天一样，解释这个问题的原因和影响
· 多了解老人的日常生活情况（吃饭、活动、吃药、睡眠等），更客观地判断问题的原因和严重程度
· 给出简单、具体、轻松就能做到的建议
#要求：
· 语言简单直白，多用生活里的比喻，尽量不用专业术语；必须用时顺带解释清楚
· 句子要短，一次只说最重要的一两件事，不要堆很多信息，避免啰嗦
· 对话初始先确认老人最关心什么：是想听明白自己的情况，还是想知道该怎么办
· 不着急回答，先问清楚情况，每次只问一个问题并提供选项，总提问次数控制在5次以内
· 涉及线下行为（复查、开药等），顺带帮老人演示完成预约/提醒操作
· 当你需要老人选择时，必须把选项逐行列出，每行格式严格为「数字. 选项内容」，禁止用「或者」「还是」混写在一句里
· 提醒以医生诊断和用药为准，不要自行停药改药
· 语气温和、耐心，每次回复尽量不超过150字`;

  // ===== 计划书制作版 System Prompt：仅当用户主动触发"制定健康改进计划"时才启用 =====
  // 按提纲收集生活方式信息，为生成个性化《个人健康改善计划书》做前置采集
  const PLAN_BUILD_PROMPT = `#背景：你是卓正健康智能体。用户刚完成体检并获得报告解读，现在希望制定一份真正贴合自己生活的个性化《个人健康改善计划书》。本次对话目标，是通过最多10个简短问题，补充制定计划书所必需的信息：真实行为现状、行为偏好、改变障碍、可执行边界。
#信息：
用户基本情况：
{MODULE_USER_BASIC}
{MODULE_PHYSIQUE}
{MODULE_BLOOD_NUTRITION}
#任务：
· 通过最多10个简短问题，补充制定计划书所必需的信息：真实行为现状、行为偏好、改变障碍、可执行边界
· 健康目标和优先级已由体检结果确定，不要问"你最想改善什么/最关心哪个问题"
#要求：
· 开场先用1-2句话说明："接下来我会问您几个生活上的小问题，用来为您制定专属计划，大约需要几分钟"，然后开始提问
· 每次只问一个问题，提供4-6个容易判断的选项，必须包含"以上都不是/不确定"类兜底选项
· 用具体生活场景提问，说人话，禁止抽象问题（如"平时饮食怎么样""运动多吗"）
· 不解释为什么问这个问题，不输出健康知识，不诱导用户选择"正确答案"
· 按以下顺序收集信息，根据回答动态调整，信息足够即提前结束，不要重复询问：
1. 平时怎么吃（三餐规律度、外卖/外食比例、甜食零食/含糖饮料、晚餐夜宵量、应酬饭局）【单选】
2. 饮酒情况：频率、场景和量（与肝功能、尿酸等指标相关）【单选】
3. 现在的运动与久坐情况【单选】
4. 体重或关键指标变化主要发生在哪个阶段、可能原因【单选】
5. 最容易管不住嘴的具体场景（什么时候、什么情形）【可多选】
6. 过去改善身体没坚持下来的原因【可多选】
7. 现实中能安排运动的时间边界【单选】
8. 更容易接受哪种运动方式【可多选】
9. 饮食上最容易接受的一处改变【单选】
10. 过去具体试过哪些方法、结果如何【可多选】
· 可多选题的题干开头必须且只能标注【多选题】，例如"【多选题】你最容易管不住嘴的场景是？"；单选题题干开头不要任何标注。严禁省略该标记，否则前端无法识别为多选
· 所有问题的选项必须每行一个，格式严格为「数字. 选项内容」，选项块之后不要再输出任何提示文字或空行（如"请选择""等你回答"等），确保前端能正确识别选项
· 可多选题的最后一个选项保留"以上都不是/不确定"类兜底项，该选项与其他选项互斥
· 提纲信息收集完成后（10题问完或信息已足够），必须先用1-2句话简要确认用户的回答，然后单独输出一行固定标记【生成计划书】——这是结束对话的唯一方式，必须单独成行（前后不要其他内容），后续流程由系统接管
· 若用户中途表示"生成计划书/差不多了/就这些"等，也可提前输出【生成计划书】标记结束采集
· 严禁在对话中做总结/梳理/计划方向/生活方式建议——这些都属于《个人健康改善计划书》的范畴，对话中不要做
· 严禁在对话中承诺"后续我会帮您/挂在这里"或询问"您看行吗/同意吗"——只要认为信息足够了，输出一行【生成计划书】即结束，系统会自动生成计划书
· 若用户中途想暂停或切换话题，礼貌停下并告知"随时可以回来继续制定计划"；回到计划书流程后继续按提纲推进
· 涉及线下行为（预约复查等）可顺带演示完成预约/提醒
· 若用户主动问及其他问题，简短回应安抚后可回到提纲继续
· 语气亲和、简洁，每次回复尽量不超过200字`;

  // ===== 模块注册表：每个模块负责把 ctx 拼成一段文本 =====
  // build 返回 null/undefined 表示该模块无数据，不渲染（标记随后会被删除）
  const MODULES = {
    userBasic: {
      marker: '{MODULE_USER_BASIC}',
      build: (ctx) => {
        const p = ctx.profile || {};
        return `【姓名：${p.name || '--'}\n年龄：${p.age || '--'}\n性别：${p.gender || '--'}】`;
      }
    },
    physique: {
      marker: '{MODULE_PHYSIQUE}',
      build: (ctx) => {
        const p = ctx.profile || {};
        return `【身高　${p.height || '--'} cm\n体重　${p.weight || '--'} kg\nBMI　${p.bmi || '--'} kg/m²\n腰围　${p.waist || '--'} cm\n血压　${p.bp || '--'}】`;
      }
    },
    bloodNutrition: {
      marker: '{MODULE_BLOOD_NUTRITION}',
      build: (ctx) => {
        const lab = ctx.lab;
        if (!lab || !lab.indicators || !lab.indicators.length) return null;
        const rows = lab.indicators.map((i) => `${i.name}　${i.value}　${i.flag}　${i.normal}`).join('\n');
        // 标题由 lab 提供（不同系统可携带不同指标块，如血脂、肝功等）
        return `【${lab.title || '主要指标'}】\n${rows}\n【分析】\n${lab.analysisText || ''}`;
      }
    }
  };

  // ===== 病症 → 模块组合配置（可扩展：新增病症在此添加）=====
  const DISEASE_MODULES = {
    '贫血': ['userBasic', 'physique', 'bloodNutrition'],
    '缺铁性贫血': ['userBasic', 'physique', 'bloodNutrition'],
    '高血压': ['userBasic', 'physique']
    // 其他病症默认使用 ['userBasic', 'physique']
  };
  const DEFAULT_DISEASE_MODULES = ['userBasic', 'physique'];

  // 解析病症对应的模块组合：精确匹配优先，其次按贫血相关关键词命中血液模块
  function resolveModules(disease) {
    if (DISEASE_MODULES[disease]) return DISEASE_MODULES[disease];
    if (/贫血|血红蛋白|铁蛋白|铁储备|缺铁/.test(disease)) {
      return ['userBasic', 'physique', 'bloodNutrition'];
    }
    return DEFAULT_DISEASE_MODULES;
  }

  // ===== 版本标识 → info 目录 txt 文件名 =====
  const INFO_FILES = {
    male38: '体检报告解读案例-男38.txt',
    female36: '体检报告解读案例-女36.txt',
    child8: '儿童体检报告解读案例-男童8.txt',
    elder68: '体检报告解读案例-老人68.txt',
    lichenghua: '体检报告解读案例-李承华66.txt',
    lipulin: '体检报告解读案例-李璞璘38.txt'
  };

  // 从 txt 文本中解析用户基本情况（name/age/gender）与体格数据（height/weight/bmi/waist/bp）
  function parseProfile(text) {
    const grab = (re, fallback = '--') => {
      const m = text.match(re);
      return m ? m[1].trim() : fallback;
    };
    return {
      name: grab(/姓名[：:\s]+(\S+)/),
      age: grab(/年龄[：:\s]+(\d+(?:\.\d+)?)\s*岁?/),
      gender: grab(/性别[：:\s]+(\S+)/),
      height: grab(/身高[^\d]{0,3}(\d+(?:\.\d+)?)\s*cm/i),
      weight: grab(/体重[^\d]{0,3}(\d+(?:\.\d+)?)\s*kg/i),
      bmi: grab(/BMI[^\d]{0,3}(\d+(?:\.\d+)?)/i),
      waist: grab(/腰围[^\d]{0,3}(\d+(?:\.\d+)?)\s*cm/i),
      bp: grab(/(\d{2,3}\/\d{2,3})\s*mmHg/)
    };
  }

  // 版本 → 专属提示词模板（儿童版面向家长、老年版更通俗简洁），未配置版本用通用模板；
  // 计划书制作使用独立的 PLAN_BUILD_PROMPT，仅在用户触发"制定健康改进计划"时启用
  const PROMPT_TEMPLATES = {
    child8: SYSTEM_PROMPT_TEMPLATE_CHILD,
    elder68: SYSTEM_PROMPT_TEMPLATE_ELDER,
    lichenghua: SYSTEM_PROMPT_TEMPLATE_ELDER
  };

  // ===== 计划书生成：触发标记 / 核心问题摘要 =====
  // AI 信息采集结束后输出该标记，前端检测到后整理回答并跳转计划书页
  const PLAN_GENERATE_RE = /【\s*生成计划书\s*】/;
  // 兜底：AI 即使没说标准标记，只要在回复中明确表达"要生成计划书"的意图（含承诺语气词），也触发跳转
  const PLAN_GENERATE_NATURAL_RE = /(?:马上|稍后|现在|接下来|立即|稍等|即将|现在).{0,12}生成.{0,12}计划书/;

  // 各版本"体检核心问题"摘要（供计划书生成使用）
  const CORE_PROBLEMS = {
    male38: '以体重增加为中心的一串代谢异常：超重（BMI 27.4、腰围 96cm）、血脂超标（总胆固醇 5.72、甘油三酯 2.38、LDL-C 3.56 均偏高）、轻度脂肪肝伴肝酶升高（ALT 68、GGT 86）、尿酸偏高（468）、血糖临界（HbA1c 5.7%）、血压正常高值（132/86）。甲状腺右叶一枚 6×5mm TI-RADS 3类结节，良性可能大，定期复查即可。'
  };

  // 从对话历史整理"前置健康信息采集结果"：问题与用户回答配对
  function buildAnswersSummary(messages) {
    const pairs = [];
    let question = '';
    for (const m of messages) {
      if (!m || m.role === 'system') continue;
      if (m.role === 'assistant') {
        const { body } = parseOptions(m.content);
        if (body) question = body.replace(PLAN_GENERATE_RE, '').trim();
      } else if (m.role === 'user') {
        const text = String(m.content || '').trim();
        if (/你好，我刚做完体检/.test(text)) continue; // 跳过自动开场白
        pairs.push('【' + (question || '补充信息') + '】\n' + text);
        question = '';
      }
    }
    return pairs.join('\n\n');
  }

  // 构建"用户体检报告解读结果"文本（基本信息 + 指标 + 核心问题）
  function buildReportSummary(ctx) {
    const p = ctx.profile || {};
    const lab = ctx.lab || null;
    const lines = [];
    lines.push('【用户基本信息】');
    lines.push('姓名：' + (p.name || '--') + '　年龄：' + (p.age || '--') + '　性别：' + (p.gender || '--'));
    lines.push('身高 ' + (p.height || '--') + ' cm　体重 ' + (p.weight || '--') + ' kg　BMI ' + (p.bmi || '--') + ' kg/m²　腰围 ' + (p.waist || '--') + ' cm　血压 ' + (p.bp || '--'));
    if (lab && lab.indicators && lab.indicators.length) {
      lines.push('');
      lines.push('【' + (lab.title || '主要指标') + '】');
      lab.indicators.forEach((i) => lines.push(i.name + '　' + i.value + '　' + i.flag + '　' + i.normal));
      if (lab.analysisText) lines.push(lab.analysisText);
    }
    if (CORE_PROBLEMS[ctx.version]) {
      lines.push('');
      lines.push('【体检核心问题】');
      lines.push(CORE_PROBLEMS[ctx.version]);
    }
    return lines.join('\n');
  }

  // 信息采集完成：整理回答 → 保存上下文 → 在对话中推送计划书卡片（不自动跳转）
  function handleGeneratePlan() {
    if (!currentCtx) return;
    const payload = JSON.stringify({
      version: currentCtx.version || '',
      disease: currentCtx.disease || '健康问题',
      reportSummary: buildReportSummary(currentCtx),
      answers: buildAnswersSummary(messages)
    });
    try { localStorage.setItem('reportPlanCtx', payload); } catch (e) { /* 忽略 */ }
    try { sessionStorage.setItem('reportPlanCtx', payload); } catch (e) { /* 忽略 */ }
    // 采集信息已更新，清除旧计划书缓存，点击卡片时用最新信息重新生成
    try { localStorage.removeItem('reportPlan'); } catch (e) { /* 忽略 */ }
    appendPlanCard();
  }

  // 在对话末尾推送"计划书卡片"：点击进入 plan 页查看/生成计划书
  function appendPlanCard() {
    const item = document.createElement('div');
    item.className = 'chat__item chat__item--bot';
    item.innerHTML = `
      <div class="chat__avatar">
        <svg viewBox="0 0 48 48" fill="none">
          <rect x="6" y="6" width="36" height="36" rx="8" fill="#16b2b2"/>
          <circle cx="18" cy="22" r="3" fill="#fff"/>
          <circle cx="30" cy="22" r="3" fill="#fff"/>
          <rect x="20" y="30" width="8" height="2" rx="1" fill="#fff"/>
        </svg>
      </div>
      <div class="chat__content">
        <button type="button" class="plan-card" id="planCardBtn">
          <span class="plan-card__icon">
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </span>
          <span class="plan-card__body">
            <span class="plan-card__title"><span class="plan-card__badge">专属</span>您的健康计划书已生成</span>
            <span class="plan-card__sub">点击查看为您定制的 90 天行动方案</span>
          </span>
          <span class="plan-card__arrow">›</span>
        </button>
      </div>
    `;
    chatList.appendChild(item);
    const btn = item.querySelector('#planCardBtn');
    if (btn) {
      btn.addEventListener('click', () => { window.location.href = 'plan.html'; });
    }
    scrollToBottom();
  }

  // 配置化构建 System Prompt：不写死 replace 链，按模块注册表逐个替换
  // templateOverride 可传入指定模板（如计划书制作版 PLAN_BUILD_PROMPT）
  function buildSystemPrompt(ctx, templateOverride) {
    const disease = ctx.disease || '健康问题';
    const modules = resolveModules(disease);
    // 若跳转的系统携带了 lab 指标数据，自动附带指标模块（血脂/肝功/血压等病症无需逐个配置）
    if (ctx.lab && ctx.lab.indicators && ctx.lab.indicators.length && !modules.includes('bloodNutrition')) {
      modules.push('bloodNutrition');
    }
    const template = templateOverride || PROMPT_TEMPLATES[ctx.version] || SYSTEM_PROMPT_TEMPLATE;
    let prompt = template.replace('{DISEASE}', disease);
    for (const name of modules) {
      const mod = MODULES[name];
      if (!mod) continue;
      const block = mod.build(ctx);
      if (block != null) prompt = prompt.replace(mod.marker, block);
    }
    // 未启用的模块：整行删除（标记本身也删掉）
    prompt = prompt.split('\n').filter((line) => !/\{MODULE_[A-Z_]+\}/.test(line)).join('\n');
    return prompt;
  }

  const chat = document.getElementById('chat');
  const chatList = document.getElementById('chatList');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const toast = document.getElementById('toast');

  // ===== 对话历史本地持久化 =====
  const storagePrefix = 'reportAgent_';
  // 按"人"（版本 profile）生成存储 key：同一用户的对话跨次、跨入口共享
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
      // 限制条数，避免无限增长；保留 system + 最近 40 条，且从最近的 assistant 边界截齐，保证 user/assistant 成对
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

  // ===== UserBubble 组件（唯一用户气泡渲染入口）=====
  // 外层 .flex.w-full.justify-end；内层固定宽度规则，手动输入与点击选项共用
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
        <div class="chat__avatar">
          <svg viewBox="0 0 48 48" fill="none">
            <rect x="6" y="6" width="36" height="36" rx="8" fill="#16b2b2"/>
            <circle cx="18" cy="22" r="3" fill="#fff"/>
            <circle cx="30" cy="22" r="3" fill="#fff"/>
            <rect x="20" y="30" width="8" height="2" rx="1" fill="#fff"/>
          </svg>
        </div>
        <div class="chat__content">
          <div class="chat__bubble chat__bubble--bot"><div class="chat__bubble-text"><p>${escapeHtml(text)}</p></div></div>
        </div>
      `;
    }

    chatList.appendChild(item);
    scrollToBottom();
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

  // 对话上下文：初始化时构建 systemPrompt（含用户信息与病症上下文）
  let messages = [];
  // 当前上下文（含 profile/disease），用于持久化 key
  let currentCtx = null;

  // 追加"正在思考"占位气泡，返回其文本节点以便稍后替换
  function appendTyping() {
    const item = document.createElement('div');
    item.className = 'chat__item chat__item--bot';
    item.innerHTML = `
      <div class="chat__avatar">
        <svg viewBox="0 0 48 48" fill="none">
          <rect x="6" y="6" width="36" height="36" rx="8" fill="#16b2b2"/>
          <circle cx="18" cy="22" r="3" fill="#fff"/>
          <circle cx="30" cy="22" r="3" fill="#fff"/>
          <rect x="20" y="30" width="8" height="2" rx="1" fill="#fff"/>
        </svg>
      </div>
      <div class="chat__content">
        <div class="chat__bubble chat__bubble--bot"><p>正在思考…</p></div>
      </div>
    `;
    chatList.appendChild(item);
    scrollToBottom();
    return item.querySelector('p');
  }

  // 从 AI 回复中解析选择题选项（多种格式兜底，选项块可位于回复任意位置）
  function parseOptions(text) {
    const lines = text.split('\n');
    const lineRe = /^\s*(?:(\d{1,2})|([A-Ha-h]))\s*[.、)）:：]\s*(\S.*)$/;

    // 1) 列表式：扫描全文，收集"连续选项行"块，取最长的一块（≥2 行）
    //    即使 AI 在选项后追加了"请选择"等提示文字，也能正确识别选项块
    let best = { start: -1, end: -1, count: 0 };
    let curStart = -1;
    let count = 0;
    for (let idx = 0; idx <= lines.length; idx++) {
      const m = idx < lines.length ? lines[idx].match(lineRe) : null;
      if (m && m[3]) {
        if (curStart === -1) curStart = idx;
        count++;
      } else {
        if (count >= 2 && count > best.count) {
          best = { start: curStart, end: idx - 1, count };
        }
        curStart = -1;
        count = 0;
      }
    }
    if (best.count >= 2) {
      const options = [];
      for (let idx = best.start; idx <= best.end; idx++) {
        options.push(lines[idx].match(lineRe)[3].trim());
      }
      // 题干取选项块之前的内容；选项块之后的提示文字舍弃
      const body = lines.slice(0, best.start).join('\n').trim();
      return { body, options };
    }

    // 2) 行内列表标记："1.xxx 2.xxx" / "A:xxx B:xxx"
    {
      const parts = text.split(/(?:[1-9]\d{0,1}|[A-Ha-h])[.、)）:：]/);
      if (parts.length >= 3) {
        const opts = parts.slice(1).map((s) => s.trim()).filter(Boolean);
        if (opts.length >= 2) {
          return { body: parts[0].trim(), options: opts };
        }
      }
    }

    // 3) 中文"或者"或"还是"分隔的并列结构（识别为选项）
    if (/或者|还是/.test(text)) {
      // 拆分"你想了解A，还是B，还是C"
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

  // 判断 AI 回复是否为多选：识别题干标注（全角/半角括号、"可多选/多选题/多选"等），并支持"可同时选""可勾选多个"等说法
  function isMultiSelect(reply) {
    if (!reply) return false;
    return (
      // 全角/半角括号包裹：可多选 / 多选题 / 多选 / 多项
      /[（(]\s*可?多?选(?:项|题)?\s*[)）]/.test(reply) ||
      // 中括号标注
      /【\s*可?多?选(?:项|题)?\s*】/.test(reply) ||
      // 文字表述（去除上面已覆盖的括号/中括号情况后，用更宽松的关键词兜底）
      /多选题|可多选|可多项|可挑选|可勾选|多选/.test(reply)
    );
  }

  // 从题干中剥离多选标注（【多选题】/（可多选）/（多选）等），避免展示给用户
  function stripMultiTag(text) {
    if (!text) return text;
    return text
      .replace(/【\s*可?多?选(?:项|题)?\s*】/g, '')
      .replace(/[（(]\s*可?多?选(?:项|题)?\s*[)）]/g, '')
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
  function renderBotReply(typingEl, reply) {
    const { body, options } = parseOptions(reply);
    const multi = isMultiSelect(reply);
    const bubble = typingEl.closest('.chat__bubble');
    bubble.innerHTML = '';

    if (body) {
      const div = document.createElement('div');
      div.className = 'chat__bubble-text';
      div.innerHTML = mdToHtml(stripMultiTag(body));
      bubble.appendChild(div);
    }

    if (options.length > 0) {
      const list = document.createElement('div');
      list.className = 'option-list' + (multi ? ' option-list--multi' : '');

      // 多选提示条：明确告知本题可多选
      if (multi) {
        const hint = document.createElement('div');
        hint.className = 'option-list__hint';
        hint.innerHTML = '<span class="option-list__hint-mark">多选</span>本题可多选，请选择所有符合的选项';
        list.appendChild(hint);
      }

      options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-list__item';
        btn.dataset.optIndex = i + 1;
        // 兜底项（以上都不是/不确定等）与具体选项互斥
        if (/以上都不是|以上都不太像|都不太像|不太像|不确定|都不太好改|没有特别明显/.test(opt)) {
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
      const text = body || content;
      const item = document.createElement('div');
      item.className = 'chat__item chat__item--bot';
      item.innerHTML = `
        <div class="chat__avatar">
          <svg viewBox="0 0 48 48" fill="none">
            <rect x="6" y="6" width="36" height="36" rx="8" fill="#16b2b2"/>
            <circle cx="18" cy="22" r="3" fill="#fff"/>
            <circle cx="30" cy="22" r="3" fill="#fff"/>
            <rect x="20" y="30" width="8" height="2" rx="1" fill="#fff"/>
          </svg>
        </div>
        <div class="chat__content">
          <div class="chat__bubble chat__bubble--bot"><div class="chat__bubble-text">${mdToHtml(stripMultiTag(text))}</div></div>
        </div>
      `;

      // 历史选项：保留文本，仅作展示，不可再点击
      if (options.length > 0) {
        const bubble = item.querySelector('.chat__bubble');
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

  // 发送一条消息到接口；showUser=false 时不展示用户气泡（用于进入页面后 AI 自动开场）
  async function sendPrompt(content, showUser = true) {
    if (!content) return;
    if (showUser) appendMessage(content, true);
    messages.push({ role: 'user', content });

    const typing = appendTyping();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
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

      // 移除计划书生成标记（不显示给用户），标记存在时稍后触发跳转
      const reply = rawReply.replace(PLAN_GENERATE_RE, '').trim() || '抱歉，暂时没有收到有效回复，请稍后再试。';

      messages.push({ role: 'assistant', content: reply });
      renderBotReply(typing, reply);
      scrollToBottom();
      // 成功后持久化对话历史
      if (currentCtx) saveHistory(messages, currentCtx.version);
      // 检测采集完成标记 → 整理回答并跳转计划书页
      // 优先检测【生成计划书】标记；AI 若没说标记但承诺"马上为您生成计划书"等，也会兜底触发
      if (PLAN_GENERATE_RE.test(rawReply) || PLAN_GENERATE_NATURAL_RE.test(rawReply)) {
        setTimeout(handleGeneratePlan, 700);
      }
    } catch (err) {
      const isNetErr = err && (err instanceof TypeError || /failed to fetch|networkerror/i.test(String(err.message)));
      typing.textContent = isNetErr
        ? '回复失败：网络或跨域(CORS)请求被拦截。请确认通过 GitHub Pages 线上地址访问（https://lipulin222.github.io/physical-examination/）；本地打开文件或 localhost 预览会因接口跨域白名单限制而失败。'
        : '回复失败：' + err.message + ' 请稍后重试。';
      scrollToBottom();
    }
  }

  // 首次进入 AI 开场白：前端直接渲染，不走接口；同时写入 messages 保持对话结构完整（system/user/assistant 配对）
  function showGreeting(text, introUser) {
    const item = document.createElement('div');
    item.className = 'chat__item chat__item--bot';
    item.innerHTML = `
      <div class="chat__avatar">
        <svg viewBox="0 0 48 48" fill="none">
          <rect x="6" y="6" width="36" height="36" rx="8" fill="#16b2b2"/>
          <circle cx="18" cy="22" r="3" fill="#fff"/>
          <circle cx="30" cy="22" r="3" fill="#fff"/>
          <rect x="20" y="30" width="8" height="2" rx="1" fill="#fff"/>
        </svg>
      </div>
      <div class="chat__content">
        <div class="chat__bubble chat__bubble--bot"><div class="chat__bubble-text"><p>${escapeHtml(text)}</p></div></div>
      </div>
    `;
    chatList.appendChild(item);
    messages.push({ role: 'user', content: introUser });
    messages.push({ role: 'assistant', content: text });
    scrollToBottom();
    if (currentCtx) { try { saveHistory(messages, currentCtx.version); } catch (e) { /* 忽略 */ } }
  }

  // ===== 计划书制作流程（由菜单"制定健康改进计划"或对话中用户表达意图触发）=====
  let isPlanBuildMode = false;
  const PLAN_BUILD_INTENT_RE = /(?:制定|生成|制作|定制)(?:个人|专属|健康|改善)?计划(?:书)?|做(?:个|份|一下).{0,6}计划|健康(?:改善)?计划|改善计划/;

  // 呼起计划书制作流程：重置 system 为计划书制作版，AI 按提纲收集生活方式信息
  function startPlanBuild(userText) {
    const ctx = currentCtx || { disease: '健康问题', profile: {}, lab: null };
    let system;
    try {
      system = buildSystemPrompt(ctx, PLAN_BUILD_PROMPT);
    } catch (e) {
      system = PLAN_BUILD_PROMPT.replace(/\{MODULE_[A-Z_]+\}/g, '');
    }
    messages = [{ role: 'system', content: system }];
    isPlanBuildMode = true;
    // 清空聊天区，重新开始计划书制作流程
    chatList.innerHTML = '';
    sendPrompt(userText || '我想制定一份个人健康改善计划书。', true);
  }

  function sendUserMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    messageInput.value = '';
    updateSendButton();
    // 用户表达计划书制作意图且当前不在计划书流程 → 切换为计划书制作流程
    if (!isPlanBuildMode && PLAN_BUILD_INTENT_RE.test(text)) {
      startPlanBuild(text);
      return;
    }
    sendPrompt(text);
  }

  function updateSendButton() {
    if (messageInput.value.trim()) {
      sendBtn.classList.remove('is-disabled');
    } else {
      sendBtn.classList.add('is-disabled');
    }
  }

  // 入口：读取跳转页面写入的上下文，解析 info txt，构建 System Prompt
  async function init() {
    let ctx = null;
    try {
      const raw = localStorage.getItem('reportCtx') || sessionStorage.getItem('reportCtx');
      if (raw) ctx = JSON.parse(raw);
    } catch (e) { /* 忽略损坏的上下文 */ }

    if (ctx && ctx.profile) {
      // profile 原为版本标识字符串，解析后会被覆盖为对象，先保留到 version 供模板选择
      ctx.version = ctx.profile;
      const file = INFO_FILES[ctx.profile];
      if (file) {
        try {
          const res = await fetch('../info/' + encodeURIComponent(file));
          if (res.ok) {
            const text = await res.text();
            ctx.profile = parseProfile(text);
          }
        } catch (e) { /* 解析失败则保持空 profile，build 时回退 -- */ }
      }
    } else {
      ctx = { disease: '健康问题', profile: {}, lab: null };
    }

    currentCtx = ctx;
    try {
      messages = [{ role: 'system', content: buildSystemPrompt(ctx) }];
    } catch (e) {
      messages = [{ role: 'system', content: SYSTEM_PROMPT_TEMPLATE.replace('{DISEASE}', ctx.disease || '健康问题') }];
    }

    // 尝试恢复本地历史对话（同一版本+病症）；有历史则不重新自动开场
    let history = null;
    try {
      history = loadHistory(ctx.version);
    } catch (e) { history = null; }

    if (Array.isArray(history) && history.length > 0) {
      // 校验首条是 system，且用最新 systemPrompt（信息可能变化）
      const restored = history.filter((m) => m && m.role !== 'system');
      messages = [messages[0]].concat(restored);
      // 逐条渲染，单条异常不中断整体
      restored.forEach((m) => {
        try { renderHistoryMessage(m); } catch (e) { /* 忽略单条渲染失败 */ }
      });
      // 直接定位到最新对话（立即 + 渲染稳定后二次定位）
      jumpToBottom();
      requestAnimationFrame(() => { jumpToBottom(); });
      return { ...ctx, restored: true };
    }
    return ctx;
  }

  // 快捷入口：转真人健康顾问 / 制定健康改进计划 / 预约门诊
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      // 制定健康改进计划 → 呼起计划书制作流程
      if (action === 'plan') {
        startPlanBuild();
        return;
      }
      const texts = {
        records: '正在为您打开门诊预约…',
        human: '正在为您转接真人健康顾问，请稍候…'
      };
      appendMessage(texts[action], false);
    });
  });

  // 发送消息
  sendBtn.addEventListener('click', sendUserMessage);
  messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendUserMessage();
  });
  messageInput.addEventListener('input', updateSendButton);
  updateSendButton();

  // 顶部按钮：返回上一页
  // 返回按钮：浏览器后退（顶部返回按钮已移除）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (window.history.length > 1) window.history.back();
      else window.location.href = '../index.html';
    }
  });
  document.getElementById('moreBtn').addEventListener('click', () => {
    showToast('更多菜单');
  });

  // 初始滚动
  scrollToBottom();

  // 异步初始化：构建 System Prompt
  // 首次进入（无历史）→ AI 开场：直接打开时自我介绍+功能；从体检页/AI深度解析跳转时简短介绍+确认该方面诉求
  init().then((ctx) => {
    try {
      // 恢复过历史（restored=true）则不再重新开场
      if (ctx && ctx.restored) return;
      const disease = (ctx && ctx.disease && ctx.disease !== '健康问题') ? ctx.disease : '';
      if (ctx && ctx.version) {
        // 从体检报告页的 AI 深度解析等入口跳转：走通用版逻辑，确认该方面诉求
        showGreeting(
          '您好，我是卓正健康智能体，可以帮您深度解读体检问题、制定个人健康改善计划书、预约卓正门诊，也可以和您日常聊聊健康话题。\n\n' + (disease ? '关于【' + disease + '】方面，你有什么想了解的吗？' : '关于您的体检情况，你有什么想了解的吗？'),
          '我刚做完体检，针对' + (disease ? '【' + disease + '】' : '我的体检结果') + '的问题想进一步咨询。'
        );
      } else {
        // 直接打开 agent 页（首次）：自我介绍 + 功能
        showGreeting(
          '您好，我是卓正健康智能体，您的专属健康助手。\n\n我可以为您提供：\n1. 体检问题深度解读\n2. 制定个人健康改善计划书\n3. 预约卓正门诊\n4. 日常健康对话\n\n有什么可以帮您的吗？',
          '你好，我是第一次使用健康咨询。'
        );
      }
    } catch (e) { /* 开场失败不阻断页面 */ }
  }).catch(() => { /* 初始化失败兜底，避免静默中断 */ });
})();
