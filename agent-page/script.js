(() => {
  // ===== AI 问答接口配置 =====
  // 直连远端接口；后端已对 github.io 域名开启 CORS，部署到 GitHub Pages 可直接访问。
  const API_URL = 'http://106.54.13.148:3000/v1/chat/completions';
  const API_KEY = 'Bearer pulinli222666uiqo';
  const SYSTEM_PROMPT = '你是"小卓"健康智能体，一位专业、亲切的体检报告解读助手。请用通俗易懂的语言回答用户的健康问题；涉及用药、治疗等建议时，提醒用户以医生的诊断为准。';

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

  // 对话上下文：保留本轮的会话历史，供接口理解前后文
  let messages = [{ role: 'system', content: SYSTEM_PROMPT }];

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

  async function sendUserMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    appendMessage(text, true);
    messageInput.value = '';
    updateSendButton();
    messages.push({ role: 'user', content: text });

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

  function updateSendButton() {
    if (messageInput.value.trim()) {
      sendBtn.classList.remove('is-disabled');
    } else {
      sendBtn.classList.add('is-disabled');
    }
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
})();
