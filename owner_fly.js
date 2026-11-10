/* === OWNER #FlyingText & #StopFlyText ADDON (owner_fly.js) === */
(function () {
  const input = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  if (!input || !sendBtn || typeof db === 'undefined') return;

  function amIOwner() {
    if (typeof currentUser !== 'string' || typeof OWNER_USERNAME !== 'string') return false;
    return currentUser.trim().toLowerCase() === OWNER_USERNAME.trim().toLowerCase();
  }

  // Inject Owner-only commands into the yellow bar right above .controls
  input.addEventListener('input', () => {
    if (!amIOwner()) return;
    const val = input.value;
    if (!val.startsWith('#') || val.includes(' ')) return;
    const q = val.slice(1).toLowerCase();

    setTimeout(() => {
      const bar = input.parentElement.previousElementSibling;
      if (!bar) return;
      const cmds = new Array('FlyingText "Hello"(5 second)', 'StopFlyText');
      cmds.forEach(cmd => {
        if (cmd.toLowerCase().startsWith(q)) {
          const chip = document.createElement('span');
          chip.textContent = '#' + cmd;
          chip.style.cssText = 'background:#0088ff; color:#fff; padding:3px 8px; border-radius:6px; cursor:pointer;';
          chip.onclick = () => {
            input.value = '#' + cmd;
            bar.style.display = 'none';
            input.focus();
          };
          bar.appendChild(chip);
          bar.style.display = 'flex';
        }
      });
    }, 15);
  });

  // Intercept #FlyingText and #StopFlyText commands from Owner
  const prevSend = sendBtn.onclick;
  sendBtn.onclick = async () => {
    const raw = input.value.trim();

    if (amIOwner() && raw.toLowerCase() === '#stopflytext') {
      input.value = '';
      await db.ref('flying_texts').remove();
      return;
    }

    if (amIOwner() && raw.toLowerCase().startsWith('#flyingtext')) {
      const match = raw.match(/^#flyingtext\s+"([^"]+)"\s*\((\d+)\s*second[s]?\)$/i);
      if (match) {
        const text = match.slice(1, 2).toString();
        const secs = Math.min(Math.max(parseInt(match.slice(2, 3).toString(), 10) || 5, 1), 300);
        input.value = '';
        await db.ref('flying_texts').push({
          text: text,
          expiresAt: Date.now() + secs * 1000
        });
        return;
      } else {
        alert('Format: #FlyingText "Hello"(5 second)');
        return;
      }
    }

    if (prevSend) prevSend();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const raw = input.value.trim().toLowerCase();
      if (raw.startsWith('#flyingtext') || raw === '#stopflytext') {
        e.stopImmediatePropagation();
        sendBtn.onclick();
      }
    }
  }, true);

  // Render floating text across everyone's screen in real time
  const activeMap = new Map();
  db.ref('flying_texts').on('value', (snap) => {
    const all = snap.val() || {};
    activeMap.forEach((val, id) => {
      if (!Object.prototype.hasOwnProperty.call(all, id)) {
        const node = document.getElementById('fly_' + id);
        if (node) node.remove();
        activeMap.delete(id);
      }
    });

    Object.entries(all).forEach(([id, item]) => {
      const remaining = item.expiresAt - Date.now();
      if (remaining <= 0) {
        db.ref('flying_texts/' + id).remove();
        return;
      }
      if (document.getElementById('fly_' + id)) return;

      const el = document.createElement('div');
      el.id = 'fly_' + id;
      el.textContent = item.text;
      el.style.cssText = 'position:fixed; z-index:9999; pointer-events:none; font-size:1.8rem; font-weight:900; color:#00ff41; text-shadow:0 0 12px #00ff41, 0 0 24px #000; transition:top 1.4s ease-in-out, left 1.4s ease-in-out;';
      el.style.top = Math.floor(15 + Math.random() * 65) + 'vh';
      el.style.left = Math.floor(10 + Math.random() * 70) + 'vw';
      document.body.appendChild(el);
      activeMap.set(id, true);

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
