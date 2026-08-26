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
· 保证语言的亲和、简洁、清晰，避免无意义的感叹，每次回复尽量不超过200字`;

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
      name: grab(/姓名[：:]\s*(\S+)/),
      age: grab(/年龄[：:]\s*(\S+)/),
      gender: grab(/性别[：:]\s*(\S+)/),
      height: grab(/身高[^\d]{0,3}(\d+(?:\.\d+)?)\s*cm/i),
      weight: grab(/体重[^\d]{0,3}(\d+(?:\.\d+)?)\s*kg/i),
      bmi: grab(/BMI[：: ]\s*(\d+(?:\.\d+)?)/i),
      waist: grab(/腰围[^\d]{0,3}(\d+(?:\.\d+)?)\s*cm/i),
      bp: grab(/(\d{2,3}\/\d{2,3})\s*mmHg/)
    };
  }

  // 配置化构建 System Prompt：不写死 replace 链，按模块注册表逐个替换
  function buildSystemPrompt(ctx) {
    const disease = ctx.disease || '健康问题';
    const modules = DISEASE_MODULES[disease] || DEFAULT_DISEASE_MODULES;
    let prompt = SYSTEM_PROMPT_TEMPLATE.replace('{DISEASE}', disease);
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

  // 通用轻提示
  function showToast(message, duration = 1800) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, duration);
  }

  // 创建消息 DOM
  function appendMessage(text, isUser = false) {
    const item = document.createElement('div');
    item.className = `chat__item chat__item--${isUser ? 'user' : 'bot'}`;

    if (isUser) {
      item.innerHTML = `
        <div class="chat__content">
          <div class="chat__bubble chat__bubble--user"><p>${escapeHtml(text)}</p></div>
        </div>
      `;
    } else {
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

  // 对话上下文：初始化时构建 systemPrompt（含用户信息与病症上下文）
  let messages = [];

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
      typing.textContent = reply;
      scrollToBottom();
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

    messages = [{ role: 'system', content: buildSystemPrompt(ctx) }];
    return ctx;
  }

  // 快捷入口
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const texts = {
        records: '正在打开「诊疗记录」…',
        human: '正在为您转接人工客服，请稍候。'
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
  document.getElementById('backBtn').addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '../index.html';
    }
  });
  document.getElementById('moreBtn').addEventListener('click', () => {
    showToast('更多菜单');
  });

  // 初始滚动
  scrollToBottom();

  // 异步初始化：构建 System Prompt；若从体检页携带病症进入，自动发起第一条咨询，让 AI 主动开口
  init().then((ctx) => {
    if (ctx && ctx.disease && ctx.disease !== '健康问题') {
      sendPrompt('你好，我刚做完体检，针对【' + ctx.disease + '】的问题想进一步咨询。', false);
    }
  });
})();
