/* === #WHISPER & @MENTION BAR ADDON (addons.js) === */
(function () {
  const input = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  const chatBox = document.getElementById('chat-box');
  if (!input || !sendBtn || !chatBox) return;

  // Create Yellow Suggestion Bar above chat input
  const bar = document.createElement('div');
  bar.style.cssText = 'display:none; background:#ffd60a; color:#000; padding:6px 10px; border-radius:10px; margin-bottom:6px; gap:6px; flex-wrap:wrap; font-weight:bold; font-size:0.82rem; box-shadow:0 0 12px rgba(255,214,10,0.6);';
  input.parentElement.parentElement.insertBefore(bar, input.parentElement);

  function renderBar(filterText) {
    const query = filterText.toLowerCase();
    const names = ['everyone', ...Object.values(usersCache || {}).map(u => u.name).filter(Boolean)];
    const unique = [...new Set(names)].filter(n => n.toLowerCase().startsWith(query));

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

  // Intercept Private Messages (#Name message) before sending
  const origSend = sendBtn.onclick;
  sendBtn.onclick = async () => {
    const raw = input.value.trim();
    const match = raw.match(/^#(\S+)\s+(.+)$/);
    if (match && match[1].toLowerCase() !== 'everyone') {
      const target = match[1];
      const secretText = match[2];
      bar.style.display = 'none';
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
    bar.style.display = 'none';
    if (origSend) origSend();
  };

  // Hide other people's private messages on your screen
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
