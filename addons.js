/* === UNIFIED MATRIX ADDONS & MOBILE RECOVERY BYPASS (PART 1 OF 2) === */
(function () {
  const input = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  const chatBox = document.getElementById('chat-box');
  if (!input || !sendBtn || !chatBox || typeof db === 'undefined') return;

  const bar = document.createElement('div');
  bar.style.cssText = 'display:none;background:#ffd60a;color:#000;padding:6px 10px;border-radius:10px;margin-bottom:6px;gap:6px;flex-wrap:wrap;font-weight:bold;font-size:0.82rem;box-shadow:0 0 12px rgba(255,214,10,0.6);';
  input.parentElement.parentElement.insertBefore(bar, input.parentElement);

  let cachedNames = new Array();
  db.ref('users').on('value', (s) => {
    cachedNames = Object.values(s.val() || {}).map(u => u.name).filter(Boolean);
  });

  function amIOwner() {
    return !!document.querySelector('.owner-badge') ||
      (typeof currentUser === 'string' && typeof OWNER_USERNAME === 'string' &&
       currentUser.trim().toLowerCase() === OWNER_USERNAME.trim().toLowerCase()) ||
      (typeof currentUser === 'string' && currentUser.trim().toLowerCase() === 'vayu24');
  }

  function addChip(label, fillText, isOwner) {
    const chip = document.createElement('span');
    chip.textContent = label;
    chip.style.cssText = (isOwner ? 'background:#0066ff;color:#fff;' : 'background:#000;color:#ffd60a;') + 'padding:3px 8px;border-radius:6px;cursor:pointer;';
    chip.onclick = () => { input.value = fillText; bar.style.display = 'none'; input.focus(); };
    bar.appendChild(chip);
  }

  function renderBar(q) {
    const query = q.toLowerCase();
    bar.innerHTML = '';
    const users = Array.from(new Set(new Array('everyone').concat(cachedNames)));
    users.forEach(n => { if (n.toLowerCase().startsWith(query)) addChip('#' + n, '#' + n + ' ', false); });
    if ('poll'.startsWith(query)) addChip('#Poll "Question"', '#Poll "What is 1 + 5"', false);
    if ('spin'.startsWith(query)) addChip('#spin', '#spin', false);
    if (amIOwner()) {
      new Array('FlyingText "Hello"(5 second)', 'StopFlyText').forEach(c => {
        if (c.toLowerCase().startsWith(query)) addChip('#' + c, '#' + c, true);
      });
    }
    bar.style.display = bar.children.length > 0 ? 'flex' : 'none';
  }

  input.addEventListener('input', () => {
    const v = input.value;
    if (v.startsWith('#') && !v.includes(' ')) renderBar(v.slice(1));
    else bar.style.display = 'none';
  });

  async function handleAddonSend() {
    const raw = input.value.trim();
    const lower = raw.toLowerCase();
    bar.style.display = 'none';

    if (amIOwner() && lower === '#stopflytext') {
      input.value = '';
      await db.ref('flying_texts').remove();
      if (typeof sendMessage === 'function') await sendMessage('#StopFlyText');
      return;
    }

    if (amIOwner() && lower.startsWith('#flyingtext')) {
      const m = raw.match(/^#flyingtext\s+"([^"]+)"\s*\((\d+)\s*second[s]?\)$/i);
      if (m) {
        const txt = m.slice(1, 2).toString();
        const secs = Math.min(Math.max(parseInt(m.slice(2, 3).toString(), 10) || 5, 1), 300);
        input.value = '';
        await db.ref('flying_texts').push({ text: txt, expiresAt: Date.now() + secs * 1000 });
        if (typeof sendMessage === 'function') await sendMessage(raw);
      } else alert('Format: #FlyingText "Hello"(5 second)');
      return;
    }

    if (lower.startsWith('#poll')) {
      const qm = raw.match(/^#poll\s+"([^"]+)"(.*)$/i);
      if (!qm) return alert('Format: #Poll "Question" OR #Poll "Question"(Choice1)(Choice2)');
      const question = qm.slice(1, 2).toString().trim();
      const rest = qm.slice(2, 3).toString().trim();
      const choices = new Array();
      const rx = /\(([^)]+)\)/g;
      let opt;
      while ((opt = rx.exec(rest)) !== null) choices.push(opt.slice(1, 2).toString().trim());
      if (choices.length < 2) { choices.length = 0; choices.push('Yes', 'No'); }
      const pollId = 'poll_' + Date.now() + '_' + Math.floor(Math.random() * 999);
      input.value = '';
      await db.ref('polls/' + pollId).set({ question: question, choices: choices, votes: {} });
      await db.ref('messages/' + currentRoomId).push({
        sender: currentUser, text: '📊 [POLL_ID:' + pollId + ']', readed: false, createdAt: Date.now()
      });
      return;
    }

    if (lower.startsWith('#spin')) {
      const spinMatch = raw.match(/^#spin(?:\((\d+)\))?$/i);
      if (!spinMatch) return alert('Format: #spin OR #spin(5)');
      const count = Math.min(Math.max(parseInt(spinMatch, 10) || 1, 1), 20);
      input.value = '';
      await db.ref('messages/' + currentRoomId).push({
        sender: currentUser, text: '🌀 [SPIN_COUNT:' + count + ']', readed: false, createdAt: Date.now()
      });
      return;
    }
/* === UNIFIED MATRIX ADDONS & MOBILE RECOVERY BYPASS (PART 2 OF 2) === */
    if (raw.startsWith('#') && raw.includes(' ')) {
      const sp = raw.indexOf(' ');
      const target = raw.slice(1, sp).trim();
      const secret = raw.slice(sp + 1).trim();
      if (target && secret && target.toLowerCase() !== 'everyone') {
        input.value = '';
        await db.ref('messages/' + currentRoomId).push({
          sender: currentUser, text: '🔒 [PRIVATE to ' + target + ']: ' + secret,
          privateTo: target.toLowerCase(), readed: false, createdAt: Date.now()
        });
        return;
      }
    }
    if (typeof sendMessage === 'function') sendMessage();
  }

  sendBtn.onclick = handleAddonSend;
  input.onkeydown = (e) => { if (e.key === 'Enter') handleAddonSend(); };

  db.ref('flying_texts').on('value', (snap) => {
    const all = snap.val() || {};
    document.querySelectorAll('.flying-owner-node').forEach(n => {
      if (!Object.prototype.hasOwnProperty.call(all, n.id.replace('fly_', ''))) n.remove();
    });
    Object.entries(all).forEach(([id, item]) => {
      const rem = item.expiresAt - Date.now();
      if (rem <= 0) return db.ref('flying_texts/' + id).remove();
      if (document.getElementById('fly_' + id)) return;
      const el = document.createElement('div');
      el.id = 'fly_' + id;
      el.className = 'flying-owner-node';
      el.textContent = item.text;
      el.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;font-size:1.8rem;font-weight:900;color:#00ff41;text-shadow:0 0 12px #00ff41,0 0 24px #000;transition:top 1.4s ease-in-out,left 1.4s ease-in-out;';
      el.style.top = Math.floor(15 + Math.random() * 65) + 'vh';
      el.style.left = Math.floor(10 + Math.random() * 70) + 'vw';
      document.body.appendChild(el);
      const t = setInterval(() => {
        if (!document.getElementById('fly_' + id)) return clearInterval(t);
        el.style.top = Math.floor(10 + Math.floor(Math.random() * 75)) + 'vh';
        el.style.left = Math.floor(5 + Math.floor(Math.random() * 75)) + 'vw';
      }, 1300);
      setTimeout(() => { clearInterval(t); el.remove(); db.ref('flying_texts/' + id).remove(); }, rem);
    });
  });

  function processBubbles() {
    if (!currentUser) return;
    const me = currentUser.toLowerCase();
    chatBox.querySelectorAll('.msg').forEach(b => {
      const txt = b.textContent || '';
      
      const spinM = '🌀 [SPIN_COUNT:';
      const spinS = txt.indexOf(spinM), spinE = txt.indexOf(']', spinS);
      if (spinS !== -1 && spinE !== -1 && !b.dataset.spinDone) {
        b.dataset.spinDone = '1';
        const totalSpins = parseInt(txt.slice(spinS + spinM.length, spinE), 10) || 1;
        const targetMenu = document.getElementById('chat-screen') || b.closest('.panel');
        
        const bodyNode = b.querySelector('.msg-body');
        if (bodyNode) bodyNode.textContent = '🌀 Executed layout spin sequence (' + totalSpins + 'x)!';
        
        if (targetMenu) {
          let currentSpin = 0;
          function runSpin() {
            if (currentSpin >= totalSpins) return;
            targetMenu.classList.remove('execute-menu-spin');
            void targetMenu.offsetWidth; 
            targetMenu.classList.add('execute-menu-spin');
            currentSpin++;
            setTimeout(runSpin, 1010);
          }
          runSpin();
        }
      }

      const pm = '🔒 [PRIVATE to ';
      const ps = txt.indexOf(pm), pe = txt.indexOf(']:', ps);
      if (ps !== -1 && pe !== -1) {
        const tgt = txt.slice(ps + pm.length, pe).toLowerCase();
        if (!b.classList.contains('mine') && tgt !== me) b.style.display = 'none';
        else b.style.borderColor = '#ffd60a';
      }
      if (b.dataset.pollDone) return;
      const pollM = '📊 [POLL_ID:';
      const s = txt.indexOf(pollM), e = txt.indexOf(']', s);
      if (s === -1 || e === -1) return;
      b.dataset.pollDone = '1';
      const pollId = txt.slice(s + pollM.length, e);
      const box = document.createElement('div');
      box.style.cssText = 'margin-top:6px;padding:10px;border:1.5px solid #ffd60a;border-radius:12px;background:rgba(255,214,10,0.08);';
      b.querySelector('.msg-body').innerHTML = '';
      b.querySelector('.msg-body').appendChild(box);
      db.ref('polls/' + pollId).on('value', (snap) => {
        const d = snap.val();
        if (!d) return;
        const votes = d.votes || {}, counts = new Map();
        Object.values(votes).forEach(i => counts.set(i, (counts.get(i) || 0) + 1));
        box.innerHTML = '';
        const title = document.createElement('div');
        title.textContent = '📊 ' + d.question;
        title.style.cssText = 'font-weight:bold;color:#ffd60a;margin-bottom:8px;';
        box.appendChild(title);
        (d.choices || new Array()).forEach((lbl, idx) => {
          const btn = document.createElement('button');
          const myVote = votes[me] === idx;
          btn.textContent = lbl + ' (' + (counts.get(idx) || 0) + ')';
          btn.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:5px;padding:6px 10px;border-radius:8px;cursor:pointer;font-weight:bold;border:1px solid #ffd60a;background:' + (myVote ? '#ffd60a' : '#000') + ';color:' + (myVote ? '#000' : '#ffd60a');
          btn.onclick = () => db.ref('polls/' + pollId + '/votes/' + me).set(idx);
          box.appendChild(btn);
        });
      });
    });
  }
  new MutationObserver(processBubbles).observe(chatBox, { childList: true });

  setInterval(() => {
    const authScreen = document.getElementById('auth-screen');
    if (authScreen && authScreen.style.display !== 'none' && !document.getElementById('mobile-bypass-btn')) {
      const bypassBtn = document.createElement('button');
      bypassBtn.id = 'mobile-bypass-btn';
      bypassBtn.className = 'btn';
      bypassBtn.style.cssText = 'margin-top:15px;width:100%;max-width:440px;background:#0066ff;color:#fff;border-color:#0044cc;';
      bypassBtn.textContent = '🔓 BYPASS LOGIN AS OWNER (VAYU24)';
      
      bypassBtn.onclick = () => {
        currentUser = "Vayu24"; 
        authScreen.style.display = 'none';
        const chatScreen = document.getElementById('chat-screen');
        if (chatScreen) chatScreen.style.display = 'flex';
        if (typeof window.MatrixProfile !== 'undefined') window.MatrixProfile.syncAvatars();
      };
      
      authScreen.appendChild(bypassBtn);
    }
  }, 1000);
})();
