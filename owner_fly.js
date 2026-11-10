/* === OWNER #FlyingText & #StopFlyText ADDON (owner_fly.js) === */
(function () {
  const input = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  if (!input || !sendBtn || typeof db === 'undefined') return;

  // Detect Owner directly from the blue OWNER badge on screen
  function amIOwner() {
    if (document.querySelector('.owner-badge')) return true;
    if (typeof currentUser === 'string' && typeof OWNER_USERNAME === 'string') {
      return currentUser.trim().toLowerCase() === OWNER_USERNAME.trim().toLowerCase();
    }
    return false;
  }

  // Dedicated Blue Owner Bar right above the chat controls
  const ownerBar = document.createElement('div');
  ownerBar.style.cssText = 'display:none; background:#0055cc; color:#fff; padding:6px 10px; border-radius:10px; margin-bottom:6px; gap:6px; flex-wrap:wrap; font-weight:bold; font-size:0.82rem; box-shadow:0 0 12px rgba(0,136,255,0.7);';
  input.parentElement.parentElement.insertBefore(ownerBar, input.parentElement);

  input.addEventListener('input', () => {
    const val = input.value;
    if (!amIOwner() || !val.startsWith('#') || val.includes(' ')) {
      ownerBar.style.display = 'none';
      return;
    }

    const q = val.slice(1).toLowerCase();
    const cmds = new Array('FlyingText "Hello"(5 second)', 'StopFlyText');
    const matches = cmds.filter(c => c.toLowerCase().startsWith(q));

    if (matches.length === 0) {
      ownerBar.style.display = 'none';
      return;
    }

    ownerBar.innerHTML = '';
    matches.forEach(cmd => {
      const chip = document.createElement('span');
      chip.textContent = '#' + cmd;
      chip.style.cssText = 'background:#001a44; color:#00e5ff; border:1px solid #00e5ff; padding:3px 8px; border-radius:6px; cursor:pointer;';
      chip.onclick = () => {
        input.value = '#' + cmd;
        ownerBar.style.display = 'none';
        input.focus();
      };
      ownerBar.appendChild(chip);
    });
    ownerBar.style.display = 'flex';
  });

  // Intercept #FlyingText and #StopFlyText on Send click or Enter key
  async function handleOwnerCmd(e) {
    const raw = input.value.trim();
    const lower = raw.toLowerCase();

    if (amIOwner() && lower === '#stopflytext') {
      if (e) e.stopImmediatePropagation();
      ownerBar.style.display = 'none';
      input.value = '';
      await db.ref('flying_texts').remove();
      return true;
    }

    if (amIOwner() && lower.startsWith('#flyingtext')) {
      if (e) e.stopImmediatePropagation();
      ownerBar.style.display = 'none';
      const match = raw.match(/^#flyingtext\s+"([^"]+)"\s*\((\d+)\s*second[s]?\)$/i);
      if (match) {
        const text = match.slice(1, 2).toString();
        const secs = Math.min(Math.max(parseInt(match.slice(2, 3).toString(), 10) || 5, 1), 300);
        input.value = '';
        await db.ref('flying_texts').push({
          text: text,
          expiresAt: Date.now() + secs * 1000
        });
      } else {
        alert('Use format: #FlyingText "Hello"(5 second)');
      }
      return true;
    }
    return false;
  }

  sendBtn.addEventListener('click', (e) => { handleOwnerCmd(e); }, true);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleOwnerCmd(e);
  }, true);

  // Float text randomly across everyone's screen
  db.ref('flying_texts').on('value', (snap) => {
    const all = snap.val() || {};
    document.querySelectorAll('.flying-owner-node').forEach(node => {
      const id = node.id.replace('fly_', '');
      if (!Object.prototype.hasOwnProperty.call(all, id)) node.remove();
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

