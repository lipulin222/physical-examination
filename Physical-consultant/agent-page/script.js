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
  const SYSTEM_PROMPT_TEMPLATE = `#角色
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

S5｜初步推荐（需求确认结束后触发，必须严格依据知识库）
{KNOWLEDGE}
基于上述知识库，结合年龄、性别、体检目的、风险标签、历史体检数据输出推荐。每类写清"套餐名称 + 会员价 + 匹配原因（对应知识库中的哪些项目）"：
### 最推荐
### 性价比方案
### 更全面方案
再补三点：◆ 已覆盖哪些重点；◆ 知识库中可能缺少什么、哪些需要另行加项；◆ 是否建议继续优化。
结束语固定为：「目前这个推荐已经可以作为参考。如果希望更精准，我可以再帮你确认几个关键问题。」
随后另起一行输出题干「接下来想怎么做？」，再逐行给出选项：查看推荐套餐 / 再帮我选准一点 / 浏览其他套餐。

S6｜精准追问
只问会改变套餐推荐的问题，按下述分支选择，最多 3 个：
· 肺部方向（关注肺部或长期吸烟）：「平时吸烟吗？」从不 / 已戒烟 / 偶尔 / 经常；若答"经常"，再问「吸烟时间大概多久？」5年以内 / 5～10年 / 10年以上
· 肿瘤方向（关注肿瘤或家族重大疾病）：「主要是担心，还是家族有相关情况？」只是担心 / 直系家人有相关疾病 / 其他亲属有 / 不清楚；若答"直系家人有"，再问「主要是哪类疾病？」
· 代谢方向（三高、体重、脂肪肝、既往异常）：「以前体检有没有发现这些问题？」血压异常 / 血脂异常 / 血糖异常 / 脂肪肝 / 尿酸偏高 / 没有
· 女性健康：「女性健康方面更关注哪类？」妇科 / 乳腺 / HPV与宫颈 / 全面覆盖
· 男性健康：「男性健康方面更关注哪类？」泌尿系统 / 前列腺 / 常规检查
用户选择"查看推荐套餐"或"浏览其他套餐"时不进入 S6。

S7｜最终推荐
同样以知识库为准，输出"### 最推荐方案"：为什么适合、覆盖哪些风险、哪些项目需要补充；再输出"### 个性化调整"，支持增加项目、删除非必要项目、更换套餐。知识库未包含的项目，必须标注"需单独加项，以门店为准"。

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

{USER_INFO}

#输出格式要求（前端会按此渲染，必须严格遵守）
· 每次只问一个问题，选项逐行输出，格式严格为「数字. 选项内容」，例如：
1. 我自己
2. 爸爸
3. 妈妈
· 题干必须是问句（以 ? 或 ？ 结尾）；可多选题的题干开头必须标注【多选题】，单选题不加任何标注
· 选项块之后不要输出"请选择""等你回答"等多余文字或空行
· 除选项外，推荐、说明、总结中禁止使用「1. 2. 3.」阿拉伯数字编号列表，改用 ### 小标题、短句或「◆ ● ▪」表达
· 用户认可方案、表示"就按这个""可以了""去预约"时，单独输出一行【生成小结】结束（前后不要其他内容），前端会据此生成《体检方案推荐小结》
· 语言亲和、简洁：普通提问每次不超过 200 字，推荐输出不超过 350 字`;

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

  // 对话上下文与历史
  let messages = [];
  let currentCtx = null;

  // ===== 体检套餐知识库：加载 → 按人群检索 → 注入 System Prompt =====
  // 知识库为 Markdown，按「## 」一级章节切分；推荐阶段只注入相关章节，避免整库占用上下文
  const KB_URL = '../卓正体检知识库.md';
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
    }
    if (guide) picked.push(guide);
    if (!picked.length) return '';
    return picked.map((s) => '### ' + s.title + '\n' + s.body).join('\n\n');
  }

  // 组装最终 System Prompt：提示词模板 + 知识库片段
  function composeSystem() {
    const base = buildSystemPrompt(currentCtx || {});
    return base.replace('{KNOWLEDGE}', knowledgeBlock() || KB_MISSING_TIP);
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

  // 从 AI 回复中解析选择题选项（多种格式兜底，选项块可位于回复任意位置）
  function parseOptions(text) {
    const lines = text.split('\n');
    const lineRe = /^\s*(?:(\d{1,2})|([A-Ha-h]))\s*[.、)）:：]\s*(\S.*)$/;

    // 1) 列表式：扫描全文，收集"连续选项行"块，取最长的一块（≥2 行）。
    //    严格条件：选项块之前 5 行内必须出现问号 ? 或 ？，否则视为陈述中混入的编号列表，不识别为选项。
    let best = { start: -1, end: -1, count: 0, hasQuestion: false };
    let curStart = -1;
    let count = 0;
    for (let idx = 0; idx <= lines.length; idx++) {
      const m = idx < lines.length ? lines[idx].match(lineRe) : null;
      if (m && m[3]) {
        if (curStart === -1) curStart = idx;
        count++;
      } else {
        if (count >= 2 && count > best.count) {
          const lookback = lines.slice(Math.max(0, curStart - 5), curStart).join('\n');
          const hasQ = /[?？]/.test(lookback);
          best = { start: curStart, end: idx - 1, count, hasQuestion: hasQ };
        }
        curStart = -1;
        count = 0;
      }
    }
    if (best.count >= 2 && best.hasQuestion) {
      const options = [];
      for (let idx = best.start; idx <= best.end; idx++) {
        options.push(lines[idx].match(lineRe)[3].trim());
      }
      // 题干取选项块之前的内容；选项块之后的提示文字舍弃
      const body = lines.slice(0, best.start).join('\n').trim();
      return { body, options };
    }

    // 2) 行内列表标记："1.xxx 2.xxx" / "A:xxx B:xxx"。同样要求题干含问号。
    {
      const parts = text.split(/(?:[1-9]\d{0,1}|[A-Ha-h])[.、)）:：]/);
      if (parts.length >= 3 && /[?？]/.test(parts[0])) {
        const opts = parts.slice(1).map((s) => s.trim()).filter(Boolean);
        if (opts.length >= 2) {
          return { body: parts[0].trim(), options: opts };
        }
      }
    }

    // 3) 中文"或者""还是"分隔的并列结构（识别为选项）
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

  // 从题干中剥离多选标注（【多选题】/（可多选）等），避免展示给用户
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
        ${BOT_AVATAR}
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
    document.getElementById('restartBtn').addEventListener('click', () => {
      // 进入二次确认视图
      moreMenu.innerHTML = moreMenuHtml('confirm');
      document.getElementById('cancelRestart').addEventListener('click', closeMoreMenu);
      document.getElementById('okRestart').addEventListener('click', restartConversation);
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
