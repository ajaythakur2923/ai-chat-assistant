/* ============================================================
   AjayAI Chat Assistant 
   ============================================================ */

// ── CONFIG ──

const API_KEY = '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';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL   = 'llama-3.3-70b-versatile'; // Latest free Llama 3.3 model via Groq

// ── SYSTEM PROMPT ──
const SYSTEM_PROMPT = `You are AjayAI, a helpful and friendly AI assistant.
You are knowledgeable about software engineering, programming, web development,
game development, Python, C++, JavaScript, cloud computing, databases, and general tech topics.
Be concise, clear, and friendly. Format code using proper markdown code blocks.
When answering questions, give practical and easy to understand explanations.`;

// ── STATE ──
let conversations = {};
let currentChatId  = null;
let isLoading      = false;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  document.getElementById('userInput').focus();
});

// ── NEW CHAT ──
function newChat() {
  currentChatId = null;
  document.getElementById('messages').innerHTML = '';
  document.getElementById('welcome').style.display = 'flex';
  document.getElementById('topbarTitle').textContent = 'AjayAI Assistant';
  document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
}

// ── SEND MESSAGE ──
async function sendMessage() {
  const input = document.getElementById('userInput');
  const text  = input.value.trim();
  if (!text || isLoading) return;

  // Hide welcome screen
  document.getElementById('welcome').style.display = 'none';

  // Create new chat session if needed
  if (!currentChatId) {
    currentChatId = 'chat_' + Date.now();
    conversations[currentChatId] = {
      title: text.slice(0, 40) + (text.length > 40 ? '...' : ''),
      messages: []
    };
    addToHistory(currentChatId);
  }

  // Save & render user message
  conversations[currentChatId].messages.push({ role: 'user', content: text });
  appendMessage('user', text);

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Show typing + disable send
  const typingId = showTyping();
  setLoading(true);

  try {
    const reply = await callGroq(conversations[currentChatId].messages);
    removeTyping(typingId);
    conversations[currentChatId].messages.push({ role: 'assistant', content: reply });
    appendMessage('ai', reply);
    saveHistory();
  } catch (err) {
    removeTyping(typingId);
    appendMessage('ai', getErrorMessage(err), true);
  }

  setLoading(false);
}

// ── CALL GROQ API ──
// Groq uses the same format as OpenAI — very simple!
async function callGroq(messages) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── RENDER MESSAGE ──
function appendMessage(role, text, isError = false) {
  const container = document.getElementById('messages');

  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'ai' ? '✦' : 'AT';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const name = document.createElement('div');
  name.className = 'msg-name';
  name.textContent = role === 'ai' ? 'AjayAI' : 'You';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble' + (isError ? ' error-bubble' : '');
  bubble.innerHTML = formatMessage(text);

  content.appendChild(name);
  content.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(content);
  container.appendChild(wrap);

  document.getElementById('chatArea').scrollTop = 99999;
}

// ── FORMAT MESSAGE (markdown-lite) ──
function formatMessage(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headings
  html = html.replace(/^## (.+)/gm, '<strong style="font-size:14px;display:block;margin:8px 0 4px">$1</strong>');
  html = html.replace(/^# (.+)/gm,  '<strong style="font-size:15px;display:block;margin:8px 0 4px">$1</strong>');

  // Lists
  html = html.replace(/^[-•*]\s(.+)/gm, '<li>$1</li>');
  html = html.replace(/^\d+\.\s(.+)/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

// ── TYPING INDICATOR ──
function showTyping() {
  const id = 'typing_' + Date.now();
  const container = document.getElementById('messages');

  const wrap = document.createElement('div');
  wrap.className = 'message ai';
  wrap.id = id;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '✦';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const name = document.createElement('div');
  name.className = 'msg-name';
  name.textContent = 'AjayAI';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

  content.appendChild(name);
  content.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(content);
  container.appendChild(wrap);

  document.getElementById('chatArea').scrollTop = 99999;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── LOADING STATE ──
function setLoading(state) {
  isLoading = state;
  document.getElementById('sendBtn').disabled = state;
}

// ── CHAT HISTORY ──
function addToHistory(chatId) {
  const history = document.getElementById('history');
  const chat    = conversations[chatId];
  if (document.getElementById('hist_' + chatId)) return;
  // Hide empty state
  const empty = document.getElementById('historyEmpty');
  if (empty) empty.style.display = 'none';

  const item = document.createElement('div');
  item.className = 'history-item active';
  item.id = 'hist_' + chatId;
  item.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    ${escapeHtml(chat.title)}
  `;
  item.onclick = () => loadChat(chatId);
  document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
  history.prepend(item);
}

function loadChat(chatId) {
  if (!conversations[chatId]) return;
  currentChatId = chatId;
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('topbarTitle').textContent = conversations[chatId].title;

  const container = document.getElementById('messages');
  container.innerHTML = '';
  conversations[chatId].messages.forEach(msg => {
    appendMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
  });

  document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
  const item = document.getElementById('hist_' + chatId);
  if (item) item.classList.add('active');
}

function saveHistory() {
  try { localStorage.setItem('ajaiai_chats', JSON.stringify(conversations)); } catch(e) {}
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('ajaiai_chats');
    if (!saved) return;
    conversations = JSON.parse(saved);
    const history = document.getElementById('history');
    Object.keys(conversations).reverse().forEach(id => {
      const chat = conversations[id];
      if (!chat) return;
      const item = document.createElement('div');
      item.className = 'history-item';
      item.id = 'hist_' + id;
      item.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        ${escapeHtml(chat.title)}
      `;
      item.onclick = () => loadChat(id);
      history.appendChild(item);
    });
  } catch(e) {}
}

// ── SUGGESTION BUTTONS ──
function useSuggestion(btn) {
  const input = document.getElementById('userInput');
  input.value = btn.textContent.trim();
  input.focus();
  autoResize(input);
}

// ── KEYBOARD ──
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── AUTO RESIZE TEXTAREA ──
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

// ── SIDEBAR TOGGLE ──
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const isOpen   = sidebar.classList.toggle('open');
  overlay.classList.toggle('open', isOpen);
}

// ── ERROR MESSAGES ──
function getErrorMessage(err) {
  const msg = err.message || '';
  if (msg.includes('401') || msg.includes('invalid_api_key'))
    return '❌ Invalid API key. Open script.js and replace YOUR_GROQ_API_KEY_HERE with your real key from console.groq.com/keys';
  if (msg.includes('429'))
    return '❌ Rate limit hit. Wait a few seconds and try again.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return '❌ Network error. Check your internet connection.';
  return `❌ Error: ${msg}`;
}

// ── UTILS ──
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
