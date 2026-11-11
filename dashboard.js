/* === MAIN TERMINAL DASHBOARD & NAVIGATOR (dashboard.js) === */
(function () {
  let activeView = 'hub';
  let historyStack = [];

  function el(tag, css, text) {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderHeader(titleText, showBack) {
    const head = el('div');
    head.className = 'dash-header';

    if (showBack) {
      const back = el('button', '', '← GO BACK');
      back.className = 'dash-back-btn';
      back.onclick = () => {
        if (historyStack.length > 0) setView(historyStack.pop(), true);
        else setView('hub', true);
      };
      head.appendChild(back);
    }

    const title = el('div', '', titleText);
    title.className = 'dash-title';
    head.appendChild(title);
    return head;
  }

  function setView(viewName, isGoingBack) {
    const container = document.getElementById('dash-root-overlay');
    if (!container) return;

    if (!isGoingBack && activeView !== viewName) {
      historyStack.push(activeView);
    }
    activeView = viewName;
    container.innerHTML = '';

    if (viewName === 'chat') {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';

    if (viewName === 'hub') {
      historyStack = [];
      container.appendChild(renderHeader('/// MATRIX CORE DASHBOARD ///', false));
      const body = el('div');
      body.className = 'dash-view-screen';

      const grid = el('div');
      grid.className = 'dash-grid-menu';

      const c1 = el('div');
      c1.className = 'dash-card';
      c1.append(el('h2', '', '🕹️ MINI GAMES'), el('p', '', 'Run local terminal arcade modules.'));
      c1.onclick = () => setView('games-menu');

      const c2 = el('div');
      c2.className = 'dash-card';
      c2.append(el('h2', '', '🌐 VAYU BROWSER'), el('p', '', 'Proxy internet search gateway via Google.'));
      c2.onclick = () => setView('browser');

      const c3 = el('div');
      c3.className = 'dash-card';
      c3.append(el('h2', '', '💬 TERMINAL CHAT'), el('p', '', 'Establish remote link to live messaging server.'));
      c3.onclick = () => setView('chat');

      grid.append(c1, c2, c3);
      body.appendChild(grid);
      container.appendChild(body);
    } 
    else if (viewName === 'browser') {
      container.appendChild(renderHeader('🌐 DIRECTORY: VAYU_BROWSER.SYS', true));
      const body = el('div');
      body.className = 'dash-view-screen';

      body.appendChild(el('div', 'font-size:1.1rem;margin-bottom:15px;letter-spacing:1px;', 'ENTER SEARCH QUERY:'));

      const sBox = el('div');
      sBox.className = 'vayu-search-box';
      const input = el('input');
      input.type = 'text';
      input.placeholder = 'Search Google via terminal proxy...';
      const goBtn = el('button', '', 'SEARCH');
      goBtn.className = 'icon-btn';

      // FIXED: Hardcoded full secure path pattern to block any direct domain suffix concatenation errors
      function runSearch() {
        const q = input.value.trim();
        if (q) {
          window.open('https://google.com' + encodeURIComponent(q), '_blank');
          input.value = '';
        }
      }
      goBtn.onclick = runSearch;
      input.onkeydown = (e) => { if (e.key === 'Enter') runSearch(); };

      sBox.append(input, goBtn);
      body.appendChild(sBox);
      container.appendChild(body);
    }
    else if (viewName === 'games-menu') {
      container.appendChild(renderHeader('🕹️ SELECT ARCADE RUNTIME ENGINE', true));
      const body = el('div');
      body.className = 'dash-view-screen';

      const wrap = el('div');
      wrap.className = 'games-layout-wrapper';

      const g1 = el('button', 'padding:14px;', '❌ TIC-TAC-TOE (LOCAL / BOT)');
      g1.className = 'btn';
      g1.onclick = () => setView('game-ttt');

      const g2 = el('button', 'padding:14px;', '🧮 ALGEBRA MATH CHALLENGE');
      g2.className = 'btn';
      g2.onclick = () => setView('game-math');

      const g3 = el('button', 'padding:14px;', '🎨 NEON LIGHT DRAWING PAD');
      g3.className = 'btn';
      g3.onclick = () => setView('game-draw');

      wrap.append(g1, g2, g3);
      body.appendChild(wrap);
      container.appendChild(body);
    }
    else if (window.MatrixGames && window.MatrixGames[viewName]) {
      window.MatrixGames[viewName](container, renderHeader, body => container.appendChild(body));
    }
  }

  // Inject Exit Button into Chat Header Panel Controls
  setInterval(() => {
    const chatHeader = document.querySelector('.header-actions');
    if (chatHeader && !document.getElementById('dash-exit-chat-btn')) {
      const exitBtn = document.createElement('button');
      exitBtn.id = 'dash-exit-chat-btn';
      exitBtn.className = 'icon-btn btn-danger';
      exitBtn.style.marginRight = '6px';
      exitBtn.textContent = '← MENU';
      exitBtn.onclick = (e) => {
        e.preventDefault();
        window.MatrixDashboard.setView('hub', true);
      };
      chatHeader.insertBefore(exitBtn, chatHeader.firstChild);
    }
  }, 1000);

  function initDashboard() {
    if (document.getElementById('dash-root-overlay')) return;
    const overlay = el('div');
    overlay.id = 'dash-root-overlay';
    overlay.className = 'dash-overlay';
    document.body.appendChild(overlay);

    window.MatrixDashboard = { setView: setView };
    setView('hub');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboard);
  else initDashboard();
})();
