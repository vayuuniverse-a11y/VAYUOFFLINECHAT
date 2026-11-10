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
    /* === OWNER #FlyingText & #StopFlyText === */
  function amIOwner() {
    return !!document.querySelector('.owner-badge') ||
      (typeof currentUser === 'string' && typeof OWNER_USERNAME === 'string' &&
       currentUser.trim().toLowerCase() === OWNER_USERNAME.trim().toLowerCase());
  }

  // Add blue Owner commands into the existing yellow bar when typing #
  input.addEventListener('input', () => {
    if (!amIOwner()) return;
    const val = input.value;
    if (!val.startsWith('#') || val.includes(' ')) return;
    const q = val.slice(1).toLowerCase();
    const cmds = new Array('FlyingText "Hello"(5 second)', 'StopFlyText');

    cmds.forEach(cmd => {
      if (cmd.toLowerCase().startsWith(q)) {
        const chip = document.createElement('span');
        chip.textContent = '#' + cmd;
        chip.style.cssText = 'background:#0066ff; color:#fff; padding:3px 8px; border-radius:6px; cursor:pointer;';
        chip.onclick = () => {
          input.value = '#' + cmd;
          bar.style.display = 'none';
          input.focus();
        };
        bar.appendChild(chip);
        bar.style.display = 'flex';
      }
    });
  });

  // Intercept #FlyingText and #StopFlyText on Send
  const prevWhisperSend = handleAddonSend;
  handleAddonSend = async function () {
    const raw = input.value.trim();
    const lower = raw.toLowerCase();
    bar.style.display = 'none';

    if (amIOwner() && lower === '#stopflytext') {
      input.value = '';
      await db.ref('flying_texts').remove();
      return;
    }

    if (amIOwner() && lower.startsWith('#flyingtext')) {
      const match = raw.match(/^#flyingtext\s+"([^"]+)"\s*\((\d+)\s*second[s]?\)$/i);
      if (match) {
        const text = match.slice(1, 2).toString();
        const secs = Math.min(Math.max(parseInt(match.slice(2, 3).toString(), 10) || 5, 1), 300);
        input.value = '';
        await db.ref('flying_texts').push({ text: text, expiresAt: Date.now() + secs * 1000 });
      } else {
        alert('Format: #FlyingText "Hello"(5 second)');
      }
      return;
    }

    await prevWhisperSend();
  };

  sendBtn.onclick = handleAddonSend;
  input.onkeydown = (e) => { if (e.key === 'Enter') handleAddonSend(); };

  // Float text across everyone's screen in real time
  db.ref('flying_texts').on('value', (snap) => {
    const all = snap.val() || {};
    document.querySelectorAll('.flying-owner-node').forEach(node => {
      if (!Object.prototype.hasOwnProperty.call(all, node.id.replace('fly_', ''))) node.remove();
    });

    Object.entries(all).forEach(([id, item]) => {
      const remaining = item.expiresAt - Date.now();
      if (remaining <= 0) { db.ref('flying_texts/' + id).remove(); return; }
      if (document.getElementById('fly_' + id)) return;

      const el = document.createElement('div');
      el.id = 'fly_' + id;
      el.className = 'flying-owner-node';
      el.textContent = item.text;
      el.style.cssText = 'position:fixed; z-index:9999; pointer-events:none; font-size:1.8rem; font-weight:900; color:#00ff41; text-shadow:0 0 12px #00ff41, 0 0 24px #000; transition:top 1.4s ease-in-out, left 1.4s ease-in-out;';
      el.style.top = Math.floor(15 + Math.random() * 65) + 'vh';
      el.style.left = Math.floor(10 + Math.random() * 70) + 'vw';
      document.body.appendChild(el);

      const moveTimer = setInterval(() => {
        if (!document.getElementById('fly_' + id)) return clearInterval(moveTimer);
        el.style.top = Math.floor(10 + Math.random() * 75) + 'vh';
        el.style.left = Math.floor(5 + Math.random() * 75) + 'vw';
      }, 1300);

      setTimeout(() => {
        clearInterval(moveTimer);
        el.remove();
        db.ref('flying_texts/' + id).remove();
      }, remaining);
    });
  });


})();
