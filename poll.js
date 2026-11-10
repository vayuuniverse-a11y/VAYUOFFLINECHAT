/* === LIVE INTERACTIVE #Poll ADDON (poll.js) === */
(function () {
  const input = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  const chatBox = document.getElementById('chat-box');
  if (!input || !sendBtn || !chatBox || typeof db === 'undefined') return;

  // Add #Poll chip into the yellow bar when typing #
  input.addEventListener('input', () => {
    const val = input.value;
    if (!val.startsWith('#') || val.includes(' ')) return;
    const q = val.slice(1).toLowerCase();
    if (!'poll'.startsWith(q)) return;

    setTimeout(() => {
      const bar = input.parentElement.previousElementSibling;
      if (!bar) return;
      const chip = document.createElement('span');
      chip.textContent = '#Poll "Question"';
      chip.style.cssText = 'background:#000; color:#ffd60a; padding:3px 8px; border-radius:6px; cursor:pointer;';
      chip.onclick = () => {
        input.value = '#Poll "What is 1 + 5"';
        bar.style.display = 'none';
        input.focus();
      };
      bar.appendChild(chip);
      bar.style.display = 'flex';
    }, 20);
  });

  // Intercept #Poll command on Send or Enter
  async function handlePollSend(e) {
    const raw = input.value.trim();
    if (!raw.toLowerCase().startsWith('#poll')) return false;

    if (e) e.stopImmediatePropagation();
    const bar = input.parentElement.previousElementSibling;
    if (bar) bar.style.display = 'none';

    const qMatch = raw.match(/^#poll\s+"([^"]+)"(.*)$/i);
    if (!qMatch) {
      alert('Format: #Poll "Question"  OR  #Poll "Question"(Choice1)(Choice2)');
      return true;
    }

    const question = qMatch.slice(1, 2).toString().trim();
    const rest = qMatch.slice(2, 3).toString().trim();
    const choices = new Array();

    const optRegex = /\(([^)]+)\)/g;
    let m;
    while ((m = optRegex.exec(rest)) !== null) {
      choices.push(m.slice(1, 2).toString().trim());
    }
    if (choices.length < 2) {
      choices.length = 0;
      choices.push('Yes', 'No');
    }

    const pollId = 'poll_' + Date.now() + '_' + Math.floor(Math.random() * 999);
    input.value = '';

    await db.ref('polls/' + pollId).set({
      question: question,
      choices: choices,
      votes: {}
    });

    await db.ref('messages/' + currentRoomId).push({
      sender: currentUser,
      text: '📊 [POLL_ID:' + pollId + ']',
      readed: false,
      createdAt: Date.now()
    });
    return true;
  }

  sendBtn.addEventListener('click', (e) => { handlePollSend(e); }, true);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePollSend(e);
  }, true);

  // Transform [POLL_ID:...] messages into live clickable voting boxes
  function upgradePolls() {
    chatBox.querySelectorAll('.msg').forEach(bubble => {
      if (bubble.dataset.pollDone) return;
      const txt = bubble.textContent || '';
      const marker = '📊 [POLL_ID:';
      const s = txt.indexOf(marker);
      const end = txt.indexOf(']', s);
      if (s === -1 || end === -1) return;

      bubble.dataset.pollDone = '1';
      const pollId = txt.slice(s + marker.length, end);
      const box = document.createElement('div');
      box.style.cssText = 'margin-top:6px; padding:10px; border:1.5px solid #ffd60a; border-radius:12px; background:rgba(255,214,10,0.08);';
      bubble.querySelector('.msg-body').innerHTML = '';
      bubble.querySelector('.msg-body').appendChild(box);

      db.ref('polls/' + pollId).on('value', (snap) => {
        const data = snap.val();
        if (!data) return;
        const votes = data.votes || {};
        const counts = new Map();
        Object.values(votes).forEach(idx => counts.set(idx, (counts.get(idx) || 0) + 1));

        box.innerHTML = '';
        const title = document.createElement('div');
        title.textContent = '📊 ' + data.question;
        title.style.cssText = 'font-weight:bold; color:#ffd60a; margin-bottom:8px;';
        box.appendChild(title);

        (data.choices || new Array()).forEach((label, idx) => {
          const btn = document.createElement('button');
          const count = counts.get(idx) || 0;
          const myVote = currentUser && votes[currentUser.toLowerCase()] === idx;
          btn.textContent = label + ' (' + count + ')';
          btn.style.cssText = 'display:block; width:100%; text-align:left; margin-bottom:5px; padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:bold; border:1px solid #ffd60a; background:' + (myVote ? '#ffd60a' : '#000') + '; color:' + (myVote ? '#000' : '#ffd60a') + ';';
          btn.onclick = () => {
            if (!currentUser) return;
            db.ref('polls/' + pollId + '/votes/' + currentUser.toLowerCase()).set(idx);
          };
          box.appendChild(btn);
        });
      });
    });
  }

  new MutationObserver(upgradePolls).observe(chatBox, { childList: true });
})();
