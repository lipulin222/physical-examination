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
· 如果涉及到生活方式干预，需要了解用户当前的生活习惯和心理准备情况，避免输出不切实际的改进建议。
· 如果涉及到线下行为（如生活方式变化，预约看病等），要顺带帮用户完预约/提醒等操作（演示即可，不用真的调用接口）
· 所有对话尽量通过选择题的方式完成（纯科普需求除外）
· 任务完成顺序没有强制要求，主要围绕用户需求去响应，用户如果没有需求可以不强制要求。
· 当你需要让用户在多个答案中选择时，必须把选项逐行列出，每行格式严格为「数字. 选项内容」，例如：
1. 了解病情
2. 寻求建议
3. 学习相关知识
· 禁止用「或者」「还是」等词语把选项混写在一句话里，必须每行一个选项。
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
        return `【血常规及铁代谢】\n${rows}\n【分析】\n${lab.analysisText || ''}`;
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
    elder68: '体检报告解读案例-老人68.txt'
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

  // 版本 → 专属提示词模板（儿童版面向家长、老年版更通俗简洁），未配置版本用通用模板
  const PROMPT_TEMPLATES = {
    child8: SYSTEM_PROMPT_TEMPLATE_CHILD,
    elder68: SYSTEM_PROMPT_TEMPLATE_ELDER
  };

  // 配置化构建 System Prompt：不写死 replace 链，按模块注册表逐个替换
  function buildSystemPrompt(ctx) {
    const disease = ctx.disease || '健康问题';
    const modules = resolveModules(disease);
    const template = PROMPT_TEMPLATES[ctx.version] || SYSTEM_PROMPT_TEMPLATE;
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
      // 限制条数，避免无限增长；保留 system + 最近 40 条
      const toSave = messages.length > 41 ? [messages[0]].concat(messages.slice(-40)) : messages;
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
          <div class="chat__bubble chat__bubble--bot"><p>${escapeHtml(text)}</p></div>
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

  // 从 AI 回复中解析选择题选项（多种格式兜底）
  function parseOptions(text) {
    // 1) 列表式：按行识别 "1.xxx" / "A.xxx" / "1、xxx" / "1）xxx" 等
    const lines = text.split('\n');
    const bodyLines = [];
    const options = [];
    const lineRe = /^\s*(?:(\d{1,2})|([A-Ha-h]))\s*[.、)）:：]\s*(\S.*)$/;
    for (const line of lines) {
      const m = line.match(lineRe);
      if (m && m[3]) options.push(m[3].trim());
      else bodyLines.push(line);
    }
    if (options.length > 0) {
      return { body: bodyLines.join('\n').trim(), options };
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

  // 判断 AI 回复是否为多选（含"多选/选多项"等关键词）
  function isMultiSelect(reply) {
    return /多选|选多项|多项选择|可多选/.test(reply);
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

  // 多选模式：更新确认按钮可用态
  function updateConfirmBtn(list) {
    const confirm = list.querySelector('.option-list__confirm');
    if (!confirm) return;
    const selected = list.querySelectorAll('.option-list__item.is-selected').length;
    confirm.disabled = selected === 0;
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
      div.innerHTML = mdToHtml(body);
      bubble.appendChild(div);
    }

    if (options.length > 0) {
      const list = document.createElement('div');
      list.className = 'option-list';
      options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-list__item';
        btn.innerHTML = '<span class="option-list__index">' + (i + 1) + '</span>' +
                        '<span class="option-list__text">' + escapeHtml(opt) + '</span>' +
                        '<span class="option-list__arrow">›</span>';
        btn.addEventListener('click', () => {
          if (multi) {
            btn.classList.toggle('is-selected');
            updateConfirmBtn(list);
          } else {
            list.querySelectorAll('.option-list__item').forEach((b) => { b.disabled = true; });
            sendPrompt(opt, true);
          }
        });
        list.appendChild(btn);
      });

      if (multi) {
        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'option-list__confirm';
        confirm.textContent = '确认';
        confirm.disabled = true;
        confirm.addEventListener('click', () => {
          const selected = Array.from(list.querySelectorAll('.option-list__item.is-selected'))
            .map((b) => b.querySelector('.option-list__text').textContent);
          if (!selected.length) return;
          list.querySelectorAll('.option-list__item, .option-list__confirm').forEach((b) => { b.disabled = true; });
          sendPrompt(selected.join('、'), true);
        });
        list.appendChild(confirm);
      }

      bubble.appendChild(list);
    }
  }

  // 渲染一条历史消息（保留选项文本为只读列表；AI 消息保留 markdown 格式）
  function renderHistoryMessage(msg) {
    if (msg.role === 'system') return;
    if (msg.role === 'user') {
      appendMessage(msg.content, true);
    } else if (msg.role === 'assistant') {
      const { body, options } = parseOptions(msg.content);
      const text = body || msg.content;
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
          <div class="chat__bubble chat__bubble--bot"><div class="chat__bubble-text">${mdToHtml(text)}</div></div>
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
      const reply = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '抱歉，暂时没有收到有效回复，请稍后再试。';

      messages.push({ role: 'assistant', content: reply });
      renderBotReply(typing, reply);
      scrollToBottom();
      // 成功后持久化对话历史
      if (currentCtx) saveHistory(messages, currentCtx.version);
    } catch (err) {
      typing.textContent = '回复失败：' + err.message + ' 请稍后重试。';
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

  // 入口：读取跳转页面写入的上下文，解析 info txt，构建 System Prompt
  async function init() {
    let ctx = null;
    try {
      const raw = sessionStorage.getItem('reportCtx');
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
    messages = [{ role: 'system', content: buildSystemPrompt(ctx) }];

    // 尝试恢复本地历史对话（同一版本+病症）；有历史则不重新自动开场
    const history = loadHistory(ctx.version);
    if (history && history.length > 0) {
      // 校验首条是 system，且用最新 systemPrompt（信息可能变化）
      messages = [messages[0]].concat(history.filter((m) => m.role !== 'system'));
      messages.forEach(renderHistoryMessage);
      // 直接定位到最新对话（立即 + 渲染稳定后二次定位）
      jumpToBottom();
      requestAnimationFrame(() => { jumpToBottom(); });
      return { ...ctx, restored: true };
    }
    return ctx;
  }

  // 快捷入口
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const texts = {
        records: '正在为您打开门诊预约…',
        human: '正在为您整理健康建议汇总…'
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

  // 异步初始化：构建 System Prompt；若从体检页携带病症进入且无历史，自动发起第一条咨询让 AI 主动开口
  init().then((ctx) => {
    if (ctx && !ctx.restored && ctx.disease && ctx.disease !== '健康问题') {
      sendPrompt('你好，我刚做完体检，针对【' + ctx.disease + '】的问题想进一步咨询。', false);
    }
  });
})();
