/* === PART 2A: SETTINGS BUTTON & COLOR/EMOJI CUSTOMIZER === */
(function () {
  const EMOJIS = ['😎', '🤖', '👾', '🔥', '💀', '🐱', '⚡', '👑', '🦊', '🚀', '💎', '👻'];
  let draft = null;

  function el(tag, css, text) {
    const n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function buildUI() {
    if (!window.MatrixProfile) return;
    const actions = document.querySelector('.header-actions');
    if (actions && !document.getElementById('prof-gear-btn')) {
      const gear = el('button', '', '⚙️');
      gear.id = 'prof-gear-btn';
      gear.className = 'icon-btn';
      gear.title = 'Profile Settings';
      gear.onclick = openSettings;
      actions.insertBefore(gear, actions.firstChild);
    }

    if (document.getElementById('prof-modal')) return;
    const modal = el('div', '');
    modal.id = 'prof-modal';
    modal.className = 'modal-backdrop';

    const box = el('div', 'max-width:400px;');
    box.className = 'modal-box';
    box.appendChild(el('h3', '', '⚙️ PROFILE SETTINGS'));

    const prevRow = el('div', 'display:flex;align-items:center;gap:12px;padding:8px;background:var(--bg-dark);border:1px solid var(--primary-border);border-radius:12px;');
    const prevCircle = el('div', 'width:52px;height:52px;font-size:1.4rem;border:2px solid var(--primary);');
    prevCircle.id = 'prof-prev';
    prevCircle.className = 'avatar-circle';
    const prevInfo = el('div', '');
    const prevName = el('div', 'font-weight:bold;', 'User');
    prevName.id = 'prof-uname';
    prevInfo.append(prevName, el('div', 'font-size:0.75rem;opacity:0.8;', 'Avatar Preview'));
    prevRow.append(prevCircle, prevInfo);
    box.appendChild(prevRow);

    const tabs = el('div', 'display:flex;gap:6px;');
    const btnCustom = el('button', 'flex:1;', '🎨 Customize Myself');
    btnCustom.className = 'btn';
    const btnUpload = el('button', 'flex:1;', '🖼️ Upload Photo');
    btnUpload.className = 'btn';
    tabs.append(btnCustom, btnUpload);
    box.appendChild(tabs);

    const tabCustom = el('div', 'display:flex;flex-direction:column;gap:9px;');
    tabCustom.appendChild(el('div', 'font-size:0.78rem;opacity:0.85;', 'Pick Profile Color:'));
    const colorRow = el('div', 'display:flex;gap:7px;flex-wrap:wrap;');
    window.MatrixProfile.COLORS.forEach((hex) => {
      const dot = el('button', 'width:25px;height:25px;border-radius:50%;background:' + hex + ';border:2px solid #fff;cursor:pointer;');
      dot.type = 'button';
      dot.onclick = () => {
        if (draft.type === 'image') draft.type = 'letter';
        draft.color = hex;
        refreshPreview();
      };
      colorRow.appendChild(dot);
    });
    tabCustom.appendChild(colorRow);

    tabCustom.appendChild(el('div', 'font-size:0.78rem;opacity:0.85;', 'Pick Emoji or First Letter:'));
    const emojiRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap;');
    EMOJIS.forEach((em) => {
      const eb = el('button', 'font-size:1.1rem;padding:3px 6px;border-radius:8px;border:1px solid var(--primary-border);background:var(--bg-dark);cursor:pointer;', em);
      eb.type = 'button';
      eb.onclick = () => { draft.type = 'emoji'; draft.value = em; refreshPreview(); };
      emojiRow.appendChild(eb);
    });
    tabCustom.appendChild(emojiRow);

    const customRow = el('div', 'display:flex;gap:6px;');
    const emojiIn = el('input', 'flex:1;padding:6px 9px;');
    emojiIn.className = 'modal-input';
    emojiIn.maxLength = 4;
    emojiIn.placeholder = 'Or type any emoji...';
    emojiIn.oninput = () => {
      const chars = Array.from(emojiIn.value.trim());
      if (chars.length > 0) { draft.type = 'emoji'; draft.value = chars.at(0); refreshPreview(); }
    };
    const resetBtn = el('button', 'padding:6px 10px;', 'Use Letter');
    resetBtn.type = 'button';
    resetBtn.className = 'btn';
    resetBtn.onclick = () => {
      draft.type = 'letter';
      draft.value = (currentUser || '?').trim().charAt(0).toUpperCase();
      refreshPreview();
    };
    customRow.append(emojiIn, resetBtn);
    tabCustom.appendChild(customRow);
    box.appendChild(tabCustom);

    const tabUpload = el('div', 'display:none;flex-direction:column;gap:8px;');
    tabUpload.id = 'prof-tab-upload';
    box.appendChild(tabUpload);

    const foot = el('div', 'display:flex;gap:8px;margin-top:4px;');
    const saveBtn = el('button', 'flex:1;', '💾 SAVE PROFILE');
    saveBtn.type = 'button';
    saveBtn.className = 'btn';
    const cancelBtn = el('button', '', 'CANCEL');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-danger';
    foot.append(saveBtn, cancelBtn);
    box.appendChild(foot);

    modal.appendChild(box);
    document.body.appendChild(modal);

    function setMode(up) {
      tabCustom.style.display = up ? 'none' : 'flex';
      tabUpload.style.display = up ? 'flex' : 'none';
      btnCustom.style.background = up ? '' : 'var(--primary)';
      btnCustom.style.color = up ? '' : '#000';
      btnUpload.style.background = up ? 'var(--primary)' : '';
      btnUpload.style.color = up ? '#000' : '';
    }
    btnCustom.onclick = () => setMode(false);
    btnUpload.onclick = () => setMode(true);
    cancelBtn.onclick = () => { modal.style.display = 'none'; };
    saveBtn.onclick = async () => {
      await window.MatrixProfile.saveAvatar(draft);
      modal.style.display = 'none';
    };

    window.MatrixModal = {
      getDraft: () => draft,
      refreshPreview: refreshPreview
    };
    modal._setMode = setMode;
  }

  function refreshPreview() {
    const p = document.getElementById('prof-prev');
    if (p && draft) window.MatrixProfile.paintAvatar(p, draft, currentUser || '?');
  }

  function openSettings() {
    if (typeof currentUser !== 'string' || !currentUser.trim()) {
      return alert('Please log in first to customize your profile.');
    }
    draft = Object.assign({}, window.MatrixProfile.getAvatar(currentUser));
    document.getElementById('prof-uname').textContent = currentUser;
    const m = document.getElementById('prof-modal');
    if (m._setMode) m._setMode(draft.type === 'image');
    refreshPreview();
    m.style.display = 'flex';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
  else buildUI();
})();
