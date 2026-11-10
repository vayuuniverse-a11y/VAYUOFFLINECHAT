/* === PART 1: ACCOUNT AVATARS & MESSAGE BADGES (profile.js) === */
(function () {
  if (typeof db === 'undefined') return;

  const COLORS = ['#00ff41', '#00e5ff', '#d946ef', '#ffd60a', '#ff3b3b', '#ff9100', '#3b82f6', '#10b981', '#f43f5e', '#a855f7'];
  let usersMap = {}, userKeysMap = {};

  function hashColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return COLORS[Math.abs(h) % COLORS.length];
  }

  function defaultAvatar(name) {
    const clean = (name || '?').trim();
    return { type: 'letter', color: hashColor(clean.toLowerCase()), value: (clean.charAt(0) || '?').toUpperCase(), image: '' };
  }

  function getAvatar(name) {
    if (!name) return defaultAvatar('?');
    const rec = usersMap[name.trim().toLowerCase()];
    return (rec && rec.avatar && rec.avatar.type) ? rec.avatar : defaultAvatar(name);
  }

  function paintAvatar(el, av, name) {
    el.textContent = '';
    el.style.backgroundImage = '';
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.overflow = 'hidden';

    if (av.type === 'image' && av.image) {
      el.style.backgroundColor = '#000';
      el.style.backgroundImage = 'url(' + av.image + ')';
    } else if (av.type === 'emoji' && av.value) {
      el.style.backgroundColor = av.color || hashColor(name);
      el.textContent = av.value;
    } else {
      el.style.backgroundColor = av.color || hashColor(name);
      el.style.color = '#000';
      el.textContent = (av.value || (name || '?').charAt(0)).toUpperCase();
    }
  }

  async function ensureDefaultProfile() {
    if (typeof currentUser !== 'string' || !currentUser.trim()) return;
    const key = currentUser.trim().toLowerCase();
    const existing = usersMap[key];
    if (existing && existing.avatar && existing.avatar.type) return;

    const fbKey = userKeysMap[key] || key.replace(/[.#$/]/g, '_');
    await db.ref('users/' + fbKey).update({
      name: currentUser.trim(),
      avatar: defaultAvatar(currentUser)
    });
  }

  function syncAvatars() {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
      chatBox.querySelectorAll('.msg').forEach((msg) => {
        const senderEl = msg.querySelector('.msg-sender');
        if (!senderEl) return;
        const clone = senderEl.cloneNode(true);
        clone.querySelectorAll('.owner-badge, .msg-avatar').forEach((n) => n.remove());
        const uname = clone.textContent.trim();
        if (!uname) return;

        let badge = senderEl.querySelector('.msg-avatar');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'avatar-circle msg-avatar';
          senderEl.style.display = 'inline-flex';
          senderEl.style.alignItems = 'center';
          senderEl.style.gap = '7px';
          senderEl.insertBefore(badge, senderEl.firstChild);
        }
        paintAvatar(badge, getAvatar(uname), uname);
      });
    }

    document.querySelectorAll('.online-item').forEach((item) => {
      const avEl = item.querySelector('.avatar-circle');
      if (!avEl) return;
      const clone = item.cloneNode(true);
      clone.querySelectorAll('.avatar-circle, .owner-badge').forEach((n) => n.remove());
      const uname = clone.textContent.trim();
      if (uname) paintAvatar(avEl, getAvatar(uname), uname);
    });
  }

  window.MatrixProfile = {
    COLORS: COLORS,
    getAvatar: getAvatar,
    paintAvatar: paintAvatar,
    syncAvatars: syncAvatars,
    saveAvatar: async function (avObj) {
      if (typeof currentUser !== 'string' || !currentUser.trim()) return;
      const key = currentUser.trim().toLowerCase();
      const fbKey = userKeysMap[key] || key.replace(/[.#$/]/g, '_');
      await db.ref('users/' + fbKey).update({ name: currentUser.trim(), avatar: avObj });
      syncAvatars();
    }
  };

  db.ref('users').on('value', (snap) => {
    const val = snap.val() || {};
    usersMap = {};
    userKeysMap = {};
    Object.entries(val).forEach(([k, u]) => {
      if (u && u.name) {
        const lower = u.name.trim().toLowerCase();
        usersMap[lower] = u;
        userKeysMap[lower] = k;
      }
    });
    ensureDefaultProfile();
    syncAvatars();
  });

  const watcher = setInterval(() => {
    if (typeof currentUser === 'string' && currentUser.trim()) {
      ensureDefaultProfile();
      syncAvatars();
      clearInterval(watcher);
    }
  }, 600);

  function attachObservers() {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) new MutationObserver(syncAvatars).observe(chatBox, { childList: true });
    const onlineList = document.getElementById('online-list');
    if (onlineList) new MutationObserver(syncAvatars).observe(onlineList, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachObservers);
  else attachObservers();
})();
