// AI Chat Assistant - Frontend
//
// This file has NO API key in it at all.
// It talks to our own Vercel server which has the key hidden.
// So even if someone reads this code on GitHub, there is nothing to steal.
//
// How it works:
// User types message --> this file sends it to /api/chat on Vercel
// Vercel uses the hidden key to call Groq --> sends reply back here
// We show the reply on screen


// this is the URL of our own server that handles the API call
// when running locally it goes to the Vercel dev server
// when live on the internet it goes to your Vercel deployment automatically
var PROXY_URL = 'https://ai-chat-assistant-dpa2qntpb-ajaythakur2923s-projects.vercel.app/api/chat';

// this tells the AI how to behave
var SYSTEM_PROMPT = 'You are a helpful and friendly AI assistant. You are good at explaining things clearly, helping with code, answering questions about technology, and general topics. Be concise and easy to understand.';

// we store all conversations here while the app is open
var conversations = {};

// keeps track of which chat is currently open
var currentChatId = null;

// stops the user from sending while waiting for a reply
var isLoading = false;


// runs when the page loads
window.onload = function() {
  buildApp();
};


// builds all the HTML and puts it on the page
function buildApp() {
  var root = document.getElementById('root');

  root.innerHTML = `
    <div class="app">

      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="logo-row">
            <div class="logo-gem">A</div>
            <span class="logo-name">AI Assistant</span>
          </div>
          <button class="new-btn" id="newChatBtn">+ New Chat</button>
        </div>

        <div class="hist-label">Recent Chats</div>
        <div class="hist-list" id="histList">
          <div class="hist-empty" id="histEmpty">No chats yet. Start talking!</div>
        </div>

        <div class="sidebar-footer">
          <div class="model-row">
            <div class="status-dot"></div>
            <span>Llama 3.3 via Groq</span>
          </div>
          <div class="powered">Key secured on server</div>
        </div>
      </aside>

      <main class="main">

        <header class="topbar">
          <button class="menu-btn" id="menuBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="topbar-title" id="topbarTitle">New Conversation</div>
          <div class="topbar-right">
            <div class="status-dot"></div>
            <span class="model-badge">Llama 3.3</span>
          </div>
        </header>

        <div class="chat-scroll" id="chatScroll">

          <div class="welcome" id="welcomeScreen">
            <div class="orb-wrap">
              <div class="orb">
                <div class="orb-inner">A</div>
              </div>
            </div>
            <h1 class="welcome-title">How can I help you?</h1>
            <p class="welcome-sub">A free AI assistant powered by Groq and Llama 3.3. Ask me anything about code, tech, or general topics.</p>
            <div class="suggestions" id="suggestionsGrid">
              <button class="sug-btn" data-prompt="Explain how machine learning works in simple terms">
                <span class="sug-icon">🧠</span>
                How does machine learning work?
              </button>
              <button class="sug-btn" data-prompt="Write a Python function to read a CSV file">
                <span class="sug-icon">🐍</span>
                Python function to read a CSV
              </button>
              <button class="sug-btn" data-prompt="What is the difference between SQL and NoSQL?">
                <span class="sug-icon">🗄️</span>
                SQL vs NoSQL databases
              </button>
              <button class="sug-btn" data-prompt="Help me write a cover letter for a software developer job">
                <span class="sug-icon">📝</span>
                Write a cover letter for me
              </button>
              <button class="sug-btn" data-prompt="What are some good habits for a software developer?">
                <span class="sug-icon">💡</span>
                Good habits for developers
              </button>
              <button class="sug-btn" data-prompt="Explain what REST APIs are and how they work">
                <span class="sug-icon">🌐</span>
                What are REST APIs?
              </button>
            </div>
          </div>

          <div class="messages" id="messagesContainer"></div>

        </div>

        <div class="input-area">
          <div class="input-wrap">
            <div class="input-box">
              <textarea id="userInput" placeholder="Ask me anything..." rows="1"></textarea>
              <button class="send-btn" id="sendBtn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p class="input-note">Free to use · Powered by Groq · API key secured on server</p>
          </div>
        </div>

      </main>
    </div>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>
  `;

  setupEventListeners();
  loadChatsFromStorage();
}


// sets up all the click and keyboard handlers
function setupEventListeners() {
  document.getElementById('newChatBtn').onclick = startNewChat;
  document.getElementById('menuBtn').onclick = toggleSidebar;
  document.getElementById('sidebarOverlay').onclick = toggleSidebar;
  document.getElementById('sendBtn').onclick = sendMessage;

  document.getElementById('userInput').onkeydown = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  document.getElementById('userInput').oninput = function() {
    resizeTextarea(this);
  };

  document.getElementById('suggestionsGrid').onclick = function(e) {
    var btn = e.target.closest('.sug-btn');
    if (!btn) return;
    var input = document.getElementById('userInput');
    input.value = btn.dataset.prompt;
    resizeTextarea(input);
    input.focus();
  };
}


// clears the screen and starts fresh
function startNewChat() {
  currentChatId = null;
  document.getElementById('messagesContainer').innerHTML = '';
  document.getElementById('welcomeScreen').style.display = 'flex';
  document.getElementById('topbarTitle').textContent = 'New Conversation';

  document.querySelectorAll('.hist-item').forEach(function(item) {
    item.classList.remove('active');
  });

  closeSidebarOnMobile();
}


// sends the user message to our Vercel server
async function sendMessage() {
  var input = document.getElementById('userInput');
  var text = input.value.trim();

  if (!text || isLoading) return;

  document.getElementById('welcomeScreen').style.display = 'none';

  // create a new chat session if this is the first message
  if (!currentChatId) {
    currentChatId = 'chat_' + Date.now();
    var title = text.length > 40 ? text.slice(0, 40) + '...' : text;
    conversations[currentChatId] = {
      title: title,
      messages: []
    };
    addChatToSidebar(currentChatId);
  }

  // save the user message to our conversation list
  conversations[currentChatId].messages.push({
    role: 'user',
    content: text
  });

  showMessage('user', text);

  input.value = '';
  input.style.height = 'auto';

  var typingId = showTypingDots();
  setLoadingState(true);

  try {
    var reply = await sendToServer(conversations[currentChatId].messages);

    removeElement(typingId);

    conversations[currentChatId].messages.push({
      role: 'assistant',
      content: reply
    });

    showMessage('ai', reply);
    saveChatsToStorage();

  } catch (err) {
    removeElement(typingId);
    showMessage('ai', getErrorMessage(err), true);
  }

  setLoadingState(false);
}


// this sends the messages to our Vercel server, not to Groq directly
// the server then calls Groq with the hidden key and sends us back the reply
async function sendToServer(messages) {
  // build the full message list including the system prompt
  var messageList = [{ role: 'system', content: SYSTEM_PROMPT }];

  messages.forEach(function(msg) {
    messageList.push({
      role: msg.role,
      content: msg.content
    });
  });

  var response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: messageList
    })
  });

  // if something went wrong, throw an error
  if (!response.ok) {
    var errorData = await response.json().catch(function() { return {}; });
    throw new Error(errorData.error || 'Server error ' + response.status);
  }

  var data = await response.json();
  return data.reply;
}


// puts a message on the screen
function showMessage(role, text, isError) {
  var container = document.getElementById('messagesContainer');

  var wrap = document.createElement('div');
  wrap.className = 'message ' + role;

  var avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'ai' ? 'AI' : 'You';

  var content = document.createElement('div');
  content.className = 'msg-content';

  var name = document.createElement('div');
  name.className = 'msg-name';
  name.textContent = role === 'ai' ? 'Assistant' : 'You';

  var bubble = document.createElement('div');
  bubble.className = isError ? 'msg-bubble error-bubble' : 'msg-bubble';
  bubble.innerHTML = formatText(text);

  content.appendChild(name);
  content.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(content);
  container.appendChild(wrap);

  scrollToBottom();
}


// converts markdown text into HTML so it looks nice
function formatText(text) {
  var html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, function(match, lang, code) {
    return '<pre><code>' + code.trim() + '</code></pre>';
  });

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  html = html.replace(/^### (.+)/gm, '<strong style="font-size:13.5px;display:block;margin:10px 0 4px;">$1</strong>');
  html = html.replace(/^## (.+)/gm, '<strong style="font-size:14.5px;display:block;margin:12px 0 5px;">$1</strong>');
  html = html.replace(/^# (.+)/gm, '<strong style="font-size:15.5px;display:block;margin:14px 0 6px;">$1</strong>');

  html = html.replace(/^[-*]\s(.+)/gm, '<li>$1</li>');
  html = html.replace(/^\d+\.\s(.+)/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, function(match) {
    return '<ul>' + match + '</ul>';
  });

  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');

  return html;
}


// shows the bouncing dots while waiting
function showTypingDots() {
  var id = 'typing_' + Date.now();
  var container = document.getElementById('messagesContainer');

  var wrap = document.createElement('div');
  wrap.className = 'message ai';
  wrap.id = id;
  wrap.innerHTML = `
    <div class="msg-avatar">AI</div>
    <div class="msg-content">
      <div class="msg-name">Assistant</div>
      <div class="msg-bubble">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;

  container.appendChild(wrap);
  scrollToBottom();
  return id;
}


// adds a chat to the sidebar history list
function addChatToSidebar(chatId) {
  var histList = document.getElementById('histList');
  var emptyMsg = document.getElementById('histEmpty');

  if (emptyMsg) {
    emptyMsg.style.display = 'none';
  }

  var existing = document.getElementById('hist_' + chatId);
  if (existing) {
    existing.remove();
  }

  var item = document.createElement('div');
  item.className = 'hist-item active';
  item.id = 'hist_' + chatId;

  var dot = document.createElement('div');
  dot.className = 'hist-dot';

  var title = document.createTextNode(safeText(conversations[chatId].title));

  item.appendChild(dot);
  item.appendChild(title);

  item.onclick = function() {
    loadChat(chatId);
  };

  document.querySelectorAll('.hist-item').forEach(function(i) {
    i.classList.remove('active');
  });

  histList.prepend(item);
}


// loads a previous chat when clicked in the sidebar
function loadChat(chatId) {
  if (!conversations[chatId]) return;

  currentChatId = chatId;

  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('topbarTitle').textContent = conversations[chatId].title;

  var container = document.getElementById('messagesContainer');
  container.innerHTML = '';

  conversations[chatId].messages.forEach(function(msg) {
    var role = msg.role === 'assistant' ? 'ai' : 'user';
    showMessage(role, msg.content);
  });

  document.querySelectorAll('.hist-item').forEach(function(i) {
    i.classList.remove('active');
  });

  var activeItem = document.getElementById('hist_' + chatId);
  if (activeItem) {
    activeItem.classList.add('active');
  }

  closeSidebarOnMobile();
}


// saves conversations to the browser storage
function saveChatsToStorage() {
  try {
    localStorage.setItem('groq_chat_history', JSON.stringify(conversations));
  } catch (e) {
    console.log('Could not save chats:', e);
  }
}


// loads saved conversations when the app starts
function loadChatsFromStorage() {
  try {
    var saved = localStorage.getItem('groq_chat_history');
    if (!saved) return;

    conversations = JSON.parse(saved);

    var ids = Object.keys(conversations).reverse();
    if (ids.length === 0) return;

    var histList = document.getElementById('histList');
    histList.innerHTML = '';

    ids.forEach(function(id) {
      var chat = conversations[id];
      if (!chat) return;

      var item = document.createElement('div');
      item.className = 'hist-item';
      item.id = 'hist_' + id;

      var dot = document.createElement('div');
      dot.className = 'hist-dot';

      var title = document.createTextNode(safeText(chat.title));

      item.appendChild(dot);
      item.appendChild(title);

      item.onclick = function() {
        loadChat(id);
      };

      histList.appendChild(item);
    });

  } catch (e) {
    console.log('Could not load chats:', e);
  }
}


// opens or closes the sidebar
function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  var isOpen = sidebar.classList.toggle('open');
  overlay.classList.toggle('open', isOpen);
}


// closes sidebar only on small screens
function closeSidebarOnMobile() {
  if (window.innerWidth <= 680) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  }
}


// enables or disables the send button while waiting
function setLoadingState(loading) {
  isLoading = loading;
  document.getElementById('sendBtn').disabled = loading;
  document.getElementById('userInput').disabled = loading;
}


// makes the textarea grow as the user types more
function resizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}


// scrolls chat to the bottom so new messages are visible
function scrollToBottom() {
  var scroll = document.getElementById('chatScroll');
  if (scroll) {
    scroll.scrollTop = scroll.scrollHeight;
  }
}


// removes an element from the page
function removeElement(id) {
  var el = document.getElementById(id);
  if (el) {
    el.remove();
  }
}


// makes text safe to display by escaping HTML characters
function safeText(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


// returns a readable error message based on what went wrong
function getErrorMessage(err) {
  var msg = err.message || '';

  if (msg.includes('401') || msg.includes('api_key')) {
    return 'The API key on the server looks incorrect. Check your Vercel environment variable.';
  }

  if (msg.includes('429')) {
    return 'Too many requests. Wait a few seconds and try again.';
  }

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Could not connect to the server. Check your internet connection.';
  }

  return 'Something went wrong: ' + msg;
}
