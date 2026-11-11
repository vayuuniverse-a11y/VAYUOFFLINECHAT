/* === MULTI-VERSE THEME INTERFACE ENGINE (theme-engine.js) === */
(function () {
  const THEMES = [
    { id: 'theme-matrix', label: '🟢 CYBER MATRIX' },
    { id: 'theme-pink-cartoon', label: '🌸 PINK CARTOON' },
    { id: 'theme-sky-galaxy', label: '🌌 SKY GALAXY' },
    { id: 'theme-discord-white', label: '⚪ DISCORD WHITE' },
    { id: 'theme-violent-purple', label: '🔮 VIOLENT PURPLE' }
  ];
  let currentThemeIdx = 0;

  function applyTheme(themeId) {
    const b = document.body;
    // Wipe any existing custom multi-verse skin classes
    THEMES.forEach(t => b.classList.remove(t.id));
    
    // Apply the active layout modifier class
    b.classList.add(themeId);
    
    // Keep your style.css background selectors clean when flipping modes
    if (themeId !== 'theme-matrix') {
      b.style.backgroundColor = 'transparent'; 
    } else {
      b.style.backgroundColor = '#000000';
    }
  }

  function toggleNextTheme() {
    currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
    const active = THEMES[currentThemeIdx];
    applyTheme(active.id);
    updateToggleButtonsText(active.label);
  }

  function updateToggleButtonsText(label) {
    document.querySelectorAll('.multi-theme-toggle-btn').forEach(btn => {
      btn.textContent = '🎨 SKIN: ' + label;
    });
  }

  function injectThemeControls() {
    // 1. Inject Control Toggle straight into the Global Chat Room Header bar
    const chatActions = document.querySelector('.header-actions');
    if (chatActions && !document.getElementById('chat-theme-toggle-node')) {
      const chatBtn = document.createElement('button');
      chatBtn.id = 'chat-theme-toggle-node';
      chatBtn.className = 'icon-btn multi-theme-toggle-btn';
      chatBtn.style.fontWeight = 'bold';
      chatBtn.title = 'Switch Application Visual Core Skin';
      chatBtn.onclick = (e) => { e.preventDefault(); toggleNextTheme(); };
      chatActions.insertBefore(chatBtn, chatActions.firstChild);
    }

    // 2. Inject Control Toggle straight into the Main Hub Dashboard Overlay Header bar
    const dashOverlay = document.getElementById('dash-root-overlay');
    if (dashOverlay) {
      const dashHeader = dashOverlay.querySelector('.dash-header');
      if (dashHeader && !document.getElementById('dash-theme-toggle-node')) {
        const dashBtn = document.createElement('button');
        dashBtn.id = 'dash-theme-toggle-node';
        dashBtn.className = 'icon-btn multi-theme-toggle-btn';
        dashBtn.style.marginLeft = 'auto';
        dashBtn.style.fontWeight = 'bold';
        dashBtn.onclick = (e) => { e.preventDefault(); toggleNextTheme(); };
        dashHeader.appendChild(dashBtn);
      }
    }

    // Keep labels synced across all views
    updateToggleButtonsText(THEMES[currentThemeIdx].label);
  }

  // Continuously verify injection hooks match up correctly as panels switch views dynamically
  setInterval(injectThemeControls, 1000);

  // Initialize Default Skin state on runtime start
  applyTheme(THEMES[currentThemeIdx].id);
})();
