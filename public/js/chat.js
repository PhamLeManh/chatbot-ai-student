/**
 * ==========================================================================
 * AI STUDENT ASSISTANT - CHAT CONTROLLER (chat.js)
 * Real-time conversation management, Markdown rendering, Code copy, TTS & Voice
 * ==========================================================================
 */

let activeConversationId = null;
let isGenerating = false;
let uploadedAttachments = [];
let speechSynth = window.speechSynthesis;
let recognition = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Kiểm tra đăng nhập
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Khởi tạo các sự kiện giao diện
  initChatEvents();
  initVoiceRecognition();

  // Tải danh sách hội thoại và gợi ý câu hỏi
  await Promise.all([
    loadConversations(),
    loadQuickPrompts(),
  ]);

  // Tự động điều chỉnh kích thước textarea
  const textarea = document.getElementById('chat-input');
  if (textarea) {
    textarea.addEventListener('input', autoResizeTextarea);
  }
});

// ==========================================
// 1. Khởi tạo sự kiện Chat
// ==========================================
function initChatEvents() {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const newChatBtn = document.getElementById('new-chat-btn');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const exportChatBtn = document.getElementById('export-chat-btn');
  const fileInput = document.getElementById('chat-file-input');

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage();
    });
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      activeConversationId = null;
      document.getElementById('active-conv-title').innerText = 'Đoạn hội thoại mới';
      document.getElementById('chat-messages').innerHTML = getWelcomeMessageHtml();
      document.querySelectorAll('.conversation-item').forEach((i) => i.classList.remove('active'));
    });
  }

  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('chat-sidebar');
      sidebar.classList.toggle('collapsed');
      sidebar.classList.toggle('open');
    });
  }

  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', handleClearChat);
  }

  if (exportChatBtn) {
    exportChatBtn.addEventListener('click', handleExportChat);
  }

  if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
  }
}

// ==========================================
// 2. Quản lý Danh sách Cuộc trò chuyện
// ==========================================
async function loadConversations() {
  try {
    const result = await fetchAPI('/api/conversations');
    const conversations = result.data || [];
    renderConversationList(conversations);

    // Nếu có cuộc trò chuyện và chưa chọn cái nào, mở cái đầu tiên
    if (conversations.length > 0 && !activeConversationId) {
      selectConversation(conversations[0]._id);
    } else if (conversations.length === 0) {
      document.getElementById('chat-messages').innerHTML = getWelcomeMessageHtml();
    }
  } catch (error) {
    console.error('Lỗi tải danh sách hội thoại:', error.message);
  }
}

function renderConversationList(conversations) {
  const container = document.getElementById('conversation-list');
  if (!container) return;

  if (conversations.length === 0) {
    container.innerHTML = `
      <div style="padding: 1.5rem 1rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
        <i class="fas fa-comments" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
        Chưa có cuộc trò chuyện nào.<br>Hãy bắt đầu hỏi AI ngay!
      </div>
    `;
    return;
  }

  container.innerHTML = conversations
    .map(
      (conv) => `
    <div class="conversation-item ${conv._id === activeConversationId ? 'active' : ''}" 
         onclick="selectConversation('${conv._id}')" 
         id="conv-item-${conv._id}">
      <div class="conv-title-wrap">
        <i class="fas ${conv.isPinned ? 'fa-thumbtack' : 'fa-comment-alt'}" style="color: ${conv.isPinned ? 'var(--warning)' : 'var(--primary)'};"></i>
        <span class="conv-title">${escapeHtml(conv.title)}</span>
      </div>
      <div class="conv-actions" onclick="event.stopPropagation();">
        <button class="conv-action-btn" title="Ghim" onclick="togglePinConversation('${conv._id}')">
          <i class="fas fa-thumbtack"></i>
        </button>
        <button class="conv-action-btn btn-delete" title="Xóa" onclick="deleteConversation('${conv._id}')">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `
    )
    .join('');
}

async function selectConversation(conversationId) {
  if (isGenerating) return;
  activeConversationId = conversationId;

  // Cập nhật UI active
  document.querySelectorAll('.conversation-item').forEach((item) => {
    item.classList.remove('active');
  });
  const activeItem = document.getElementById(`conv-item-${conversationId}`);
  if (activeItem) activeItem.classList.add('active');

  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
    </div>
  `;

  try {
    const result = await fetchAPI(`/api/conversations/${conversationId}`);
    const { conversation, messages } = result.data;

    document.getElementById('active-conv-title').innerText = conversation.title || 'Đoạn hội thoại';

    if (messages.length === 0) {
      messagesContainer.innerHTML = getWelcomeMessageHtml();
    } else {
      messagesContainer.innerHTML = '';
      messages.forEach((msg) => appendMessageBubble(msg));
      scrollToBottom();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function togglePinConversation(conversationId) {
  try {
    await fetchAPI(`/api/conversations/${conversationId}/pin`, { method: 'PUT' });
    loadConversations();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteConversation(conversationId) {
  if (!confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) return;
  try {
    await fetchAPI(`/api/conversations/${conversationId}`, { method: 'DELETE' });
    showToast('Đã xóa cuộc trò chuyện.', 'info');
    if (activeConversationId === conversationId) {
      activeConversationId = null;
      document.getElementById('active-conv-title').innerText = 'Đoạn hội thoại mới';
      document.getElementById('chat-messages').innerHTML = getWelcomeMessageHtml();
    }
    loadConversations();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==========================================
// 3. Xử lý Gửi Tin Nhắn Chat
// ==========================================
async function handleSendMessage(customPrompt = null) {
  if (isGenerating) return;

  const chatInput = document.getElementById('chat-input');
  const content = customPrompt || (chatInput ? chatInput.value.trim() : '');

  if (!content && uploadedAttachments.length === 0) return;

  if (chatInput) {
    chatInput.value = '';
    autoResizeTextarea();
  }

  // 1. Render tin nhắn User ngay lập tức
  const tempUserMsg = {
    sender: 'user',
    content,
    attachments: [...uploadedAttachments],
    createdAt: new Date().toISOString(),
  };
  appendMessageBubble(tempUserMsg);
  scrollToBottom();

  // Reset attachments sau khi gửi
  const currentAttachments = [...uploadedAttachments];
  uploadedAttachments = [];
  renderAttachmentPreview();

  // 2. Hiển thị Typing Indicator
  isGenerating = true;
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.disabled = true;

  const typingBubble = showTypingIndicator();
  scrollToBottom();

  try {
    const result = await fetchAPI('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: activeConversationId,
        content,
        attachments: currentAttachments,
      }),
    });

    typingBubble.remove();

    const { conversation, aiMessage } = result.data;
    activeConversationId = conversation._id;
    document.getElementById('active-conv-title').innerText = conversation.title;

    // Render tin nhắn AI phản hồi
    appendMessageBubble(aiMessage);
    scrollToBottom();

    // Cập nhật lại sidebar
    loadConversations();
  } catch (error) {
    typingBubble.remove();
    showToast(error.message || 'Lỗi gửi tin nhắn.', 'error');
  } finally {
    isGenerating = false;
    if (sendBtn) sendBtn.disabled = false;
  }
}

// ==========================================
// 4. Render Message Bubbles & Markdown
// ==========================================
function appendMessageBubble(msg) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const isUser = msg.sender === 'user';
  const row = document.createElement('div');
  row.className = `message-row ${isUser ? 'user' : 'assistant'}`;

  const formattedTime = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let attachmentsHtml = '';
  if (msg.attachments && msg.attachments.length > 0) {
    attachmentsHtml = `
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
        ${msg.attachments.map((att) => `<span class="attachment-tag"><i class="fas fa-file-alt"></i> ${escapeHtml(att.name)}</span>`).join('')}
      </div>
    `;
  }

  const renderedContent = isUser ? escapeHtml(msg.content).replace(/\n/g, '<br>') : parseMarkdown(msg.content);

  row.innerHTML = `
    <div class="message-avatar">
      <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
    </div>
    <div class="message-content-wrap">
      ${attachmentsHtml}
      <div class="message-bubble">
        ${renderedContent}
      </div>
      <div class="message-meta">
        <span>${formattedTime}</span>
        ${
          !isUser
            ? `
          <div class="message-actions-inline">
            <button class="msg-btn-mini" title="Đọc to bằng giọng nói" onclick="speakText(this)">
              <i class="fas fa-volume-up"></i>
            </button>
            <button class="msg-btn-mini" title="Sao chép nội dung" onclick="copyMessageText(this)">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;

  container.appendChild(row);
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.className = 'message-row assistant';
  row.id = 'typing-indicator-row';

  row.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content-wrap">
      <div class="message-bubble" style="padding: 0.75rem 1.25rem;">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(row);
  return row;
}

// ==========================================
// 5. Trình phân tích Markdown & Highlight Code
// ==========================================
function parseMarkdown(text) {
  if (!text) return '';

  let html = text;

  // 1. Code Blocks: ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'code';
    const escapedCode = escapeHtml(code.trim());
    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span>${language.toUpperCase()}</span>
          <button class="copy-code-btn" onclick="copyCodeSnippet(this)">
            <i class="fas fa-copy"></i> Sao chép
          </button>
        </div>
        <pre><code class="language-${language}">${escapedCode}</code></pre>
      </div>
    `;
  });

  // 2. Inline Code: `...`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 3. Headings: ### , ## , #
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 4. Blockquotes: > ...
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // 5. Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. Lists: - item or * item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // 7. Line breaks
  html = html.replace(/\n\n/g, '<p></p>');

  return html;
}

// ==========================================
// 6. Quick Prompts & Gợi ý Câu hỏi
// ==========================================
async function loadQuickPrompts() {
  try {
    const result = await fetchAPI('/api/chat/quick-prompts');
    const prompts = result.data || [];
    const container = document.getElementById('quick-prompts-bar');
    if (!container) return;

    container.innerHTML = prompts
      .map(
        (p) => `
      <div class="prompt-chip" onclick="handleQuickPromptClick('${escapeHtml(p.prompt)}')">
        <i class="fas ${p.icon}"></i>
        <span>${escapeHtml(p.title)}</span>
      </div>
    `
      )
      .join('');
  } catch (e) {
    console.warn('Lỗi tải quick prompts:', e);
  }
}

function handleQuickPromptClick(promptText) {
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.value = promptText;
    chatInput.focus();
    autoResizeTextarea();
  }
}

// ==========================================
// 7. Speech-to-Text & Text-to-Speech (Voice)
// ==========================================
function initVoiceRecognition() {
  const micBtn = document.getElementById('voice-input-btn');
  if (!micBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'vi-VN';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    micBtn.classList.add('active');
    showToast('Đang lắng nghe giọng nói tiếng Việt...', 'info');
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = (chatInput.value + ' ' + transcript).trim();
      autoResizeTextarea();
    }
  };

  recognition.onend = () => {
    micBtn.classList.remove('active');
  };

  recognition.onerror = (event) => {
    micBtn.classList.remove('active');
    showToast('Không nhận diện được giọng nói: ' + event.error, 'warning');
  };

  micBtn.addEventListener('click', () => {
    try {
      recognition.start();
    } catch (e) {
      recognition.stop();
    }
  });
}

function speakText(btn) {
  if (!speechSynth) {
    showToast('Trình duyệt của bạn không hỗ trợ đọc giọng nói.', 'warning');
    return;
  }

  if (speechSynth.speaking) {
    speechSynth.cancel();
    btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    return;
  }

  const bubble = btn.closest('.message-content-wrap').querySelector('.message-bubble');
  const text = bubble.innerText;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = 1.0;

  utterance.onstart = () => {
    btn.innerHTML = '<i class="fas fa-stop" style="color: var(--accent);"></i>';
  };

  utterance.onend = () => {
    btn.innerHTML = '<i class="fas fa-volume-up"></i>';
  };

  speechSynth.speak(utterance);
}

// ==========================================
// 8. Sao chép Code & Tiện ích
// ==========================================
function copyCodeSnippet(btn) {
  const pre = btn.closest('.code-block-wrapper').querySelector('pre code');
  if (!pre) return;

  navigator.clipboard.writeText(pre.innerText).then(() => {
    btn.innerHTML = '<i class="fas fa-check"></i> Đã chép!';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-copy"></i> Sao chép';
    }, 2000);
  });
}

function copyMessageText(btn) {
  const bubble = btn.closest('.message-content-wrap').querySelector('.message-bubble');
  navigator.clipboard.writeText(bubble.innerText).then(() => {
    showToast('Đã sao chép nội dung tin nhắn!', 'success');
  });
}

function autoResizeTextarea() {
  const textarea = document.getElementById('chat-input');
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', file.name);

  try {
    showToast(`Đang tải lên & phân tích tài liệu "${file.name}" bằng AI...`, 'info');
    const result = await fetchAPI('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    uploadedAttachments.push({
      name: file.name,
      url: result.data.fileUrl,
      fileType: file.type,
      size: file.size,
    });

    renderAttachmentPreview();
    showToast('Đã đính kèm tài liệu thành công!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    e.target.value = '';
  }
}

function renderAttachmentPreview() {
  let previewBar = document.getElementById('attachment-preview-bar');
  if (!previewBar) return;

  if (uploadedAttachments.length === 0) {
    previewBar.innerHTML = '';
    return;
  }

  previewBar.innerHTML = uploadedAttachments
    .map(
      (att, idx) => `
    <span class="attachment-tag">
      <i class="fas fa-paperclip"></i> ${escapeHtml(att.name)}
      <i class="fas fa-times remove-attach" onclick="removeAttachment(${idx})"></i>
    </span>
  `
    )
    .join('');
}

function removeAttachment(index) {
  uploadedAttachments.splice(index, 1);
  renderAttachmentPreview();
}

async function handleClearChat() {
  if (!activeConversationId) return;
  if (!confirm('Bạn có chắc muốn xóa sạch tin nhắn trong đoạn chat này?')) return;

  try {
    await fetchAPI(`/api/conversations/${activeConversationId}/clear`, { method: 'DELETE' });
    document.getElementById('chat-messages').innerHTML = getWelcomeMessageHtml();
    showToast('Đã làm mới đoạn chat.', 'info');
    loadConversations();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function handleExportChat() {
  const messages = document.querySelectorAll('.message-bubble');
  if (messages.length === 0) {
    showToast('Chưa có nội dung để xuất tệp.', 'warning');
    return;
  }

  let textContent = `=== NHẬT KÝ HỌC TẬP - AI STUDENT ASSISTANT ===\nNgày xuất: ${new Date().toLocaleString()}\n\n`;
  document.querySelectorAll('.message-row').forEach((row) => {
    const isUser = row.classList.contains('user');
    const bubble = row.querySelector('.message-bubble');
    if (bubble) {
      textContent += `[${isUser ? 'SINH VIÊN' : 'AI ASSISTANT'}]:\n${bubble.innerText}\n\n-------------------------\n\n`;
    }
  });

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-export-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất lịch sử chat ra file text thành công!', 'success');
}

function getWelcomeMessageHtml() {
  const user = getCurrentUser();
  return `
    <div style="text-align: center; max-width: 640px; margin: 2.5rem auto; padding: 2rem;">
      <div style="position: relative; width: 80px; height: 80px; margin: 0 auto 1.5rem;">
        <div style="width: 80px; height: 80px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--cosmic-violet), var(--cosmic-cyan)); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; color: #fff; box-shadow: 0 0 35px var(--primary-glow); position: relative; z-index: 2;">
          <i class="fas fa-meteor"></i>
        </div>
        <div style="position: absolute; inset: -6px; border-radius: var(--radius-lg); border: 1px dashed rgba(6, 182, 212, 0.6); animation: orbitRotate 15s linear infinite; z-index: 1;"></div>
      </div>

      <span class="badge badge-primary" style="margin-bottom: 0.85rem; padding: 4px 14px; font-size: 0.8rem;">
        <i class="fas fa-satellite" style="color: var(--cosmic-cyan-glow);"></i> TRẠM GIAO TIẾP LƯỢNG TỬ ĐÃ KẾT NỐI
      </span>

      <h2 style="font-family: var(--font-display); font-size: 1.9rem; font-weight: 800; margin-bottom: 0.6rem; color: #ffffff;">
        Xin chào, ${user ? user.name : 'Phi Hành Gia Sinh Viên'}! 🚀
      </h2>
      <p style="color: var(--text-muted); font-size: 1.02rem; margin-bottom: 2rem; line-height: 1.7;">
        Mình là <strong>AI Student Cosmos</strong>. Hãy gửi bất kỳ câu hỏi nào về giải thuật, toán học cao cấp, tiếng Anh học thuật hoặc tải lên tài liệu để bắt đầu phân tích!
      </p>

      <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-secondary btn-sm" onclick="handleQuickPromptClick('Giải thích thuật toán Dijkstra và viết code minh họa bằng C++')">
          <i class="fas fa-code" style="color: var(--cosmic-cyan-glow);"></i> Code Dijkstra C++
        </button>
        <button class="btn btn-secondary btn-sm" onclick="handleQuickPromptClick('Lập đề cương ôn thi trắc nghiệm môn Triết học Mác - Lênin')">
          <i class="fas fa-book" style="color: var(--cosmic-violet);"></i> Đề cương Triết học
        </button>
        <button class="btn btn-secondary btn-sm" onclick="handleQuickPromptClick('Cách tính tích phân kép và các dạng bài tập điển hình môn Giải tích 2')">
          <i class="fas fa-square-root-variable" style="color: var(--warning);"></i> Toán Giải tích 2
        </button>
      </div>
    </div>
  `;
}
