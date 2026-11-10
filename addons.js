/* === #WHISPER & @MENTION BAR ADDON (addons.js) === */
(function () {
  const input = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  const chatBox = document.getElementById('chat-box');
  if (!input || !sendBtn || !chatBox) return;

  // Create Yellow Suggestion Bar right above the chat input
  const bar = document.createElement('div');
  bar.style.cssText = 'display:none; background:#ffd60a; color:#000; padding:6px 10px; border-radius:10px; margin-bottom:6px; gap:6px; flex-wrap:wrap; font-weight:bold; font-size:0.82rem; box-shadow:0 0 12px rgba(255,214,10,0.6);';
  input.parentElement.parentElement.insertBefore(bar, input.parentElement);

  let cachedNames = [];
  if (typeof db !== 'undefined') {
    db.ref('users').on('value', (snap) => {
      const data = snap.val() || {};
      cachedNames = Object.values(data).map(u => u.name).filter(Boolean);
    });
  }

  function renderBar(filterText) {
    const query = filterText.toLowerCase();
    const allOptions = ['everyone', ...cachedNames];
    const unique = [...new Set(allOptions)].filter(n => n.toLowerCase().startsWith(query));

    if (unique.length === 0) {
      bar.style.display = 'none';
      return;
    }

    bar.innerHTML = '';
    unique.forEach(name => {
      const chip = document.createElement('span');
      chip.textContent = '#' + name;
      chip.style.cssText = 'background:#000; color:#ffd60a; padding:3px 8px; border-radius:6px; cursor:pointer;';
      chip.onclick = () => {
        input.value = '#' + name + ' ';
        bar.style.display = 'none';
        input.focus();
      };
      bar.appendChild(chip);
    });
    bar.style.display = 'flex';
  }

  input.addEventListener('input', () => {
    const val = input.value;
    if (val.startsWith('#') && !val.includes(' ')) {
      renderBar(val.slice(1));
    } else {
      bar.style.display = 'none';
    }
  });

  // Handle #Name private whispers & #everyone
  async function handleAddonSend() {
    const raw = input.value.trim();
    const match = raw.match(/^#(\S+)\s+(.+)$/);
    bar.style.display = 'none';

    if (match && match[1].toLowerCase() !== 'everyone') {
      const target = match[1];
      const secretText = match[2];
      input.value = '';
      await db.ref('messages/' + currentRoomId).push({
        sender: currentUser,
        text: `🔒 [PRIVATE to ${target}]: ${secretText}`,
        privateTo: target.toLowerCase(),
        readed: false,
        createdAt: Date.now()
      });
      return;
    }

    if (typeof sendMessage === 'function') sendMessage();
  }

  sendBtn.onclick = handleAddonSend;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') handleAddonSend();
  };

  // Hide private messages meant for other people
  const observer = new MutationObserver(() => {
    if (!currentUser) return;
    const me = currentUser.toLowerCase();
    chatBox.querySelectorAll('.msg').forEach(bubble => {
      const txt = bubble.textContent || '';
      const privMatch = txt.match(/🔒 \[PRIVATE to ([^\]]+)\]:/);
      if (privMatch) {
        const target = privMatch[1].toLowerCase();
        const isSender = bubble.classList.contains('mine');
        if (!isSender && target !== me) {
          bubble.style.display = 'none';
        } else {
          bubble.style.borderColor = '#ffd60a';
        }
      }
    });
  });
  observer.observe(chatBox, { childList: true });
})();
