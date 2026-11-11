/* === MATRIX SUB-ARCADE GAME MODULES (dashboard-games.js) === */
(function () {
  const games = {};

  function el(tag, css, text) {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // 1. TIC-TAC-TOE WITH BOT OR LOCAL 2-PLAYER MODES
  games['game-ttt'] = function (container, renderHeader, mount) {
    container.appendChild(renderHeader('❌ MODULE: TIC_TAC_TOE.EXE', true));
    const body = el('div');
    body.className = 'dash-view-screen';

    const menuBox = el('div', 'display:flex;flex-direction:column;gap:12px;width:100%;max-width:300px;');
    const b1 = el('button', 'padding:12px;', '👥 LOCAL 2 PLAYER'); b1.className = 'btn';
    const b2 = el('button', 'padding:12px;', '🤖 VS MATRIX BOT'); b2.className = 'btn';
    menuBox.append(el('div', 'text-align:center;margin-bottom:8px;', 'CHOOSE OPPONENT MODE:'), b1, b2);
    body.appendChild(menuBox);
    mount(body);

    function startTTT(isBotMode) {
      body.innerHTML = '';
      const status = el('div', 'font-size:1.2rem;margin-bottom:12px;font-weight:bold;', "YOUR TURN (X)");
      const grid = el('div');
      grid.className = 'ttt-grid-box';

      let board = Array(9).fill('');
      let turn = 'X';
      let live = true;
      const cells = [];
      
      // Fixed: Restored full winning lines configuration array
      const wins = [, [3, 4, 5], [6, 7, 8],
, [1, 4, 7], [2, 5, 8],
, [2, 4, 6]
      ];

      function checkWin(p) { return wins.some(w => w.every(idx => board[idx] === p)); }

      function makeMove(i) {
        if (!live || board[i]) return;
        board[i] = turn;
        cells[i].textContent = turn;

        if (checkWin(turn)) {
          status.textContent = 'PLAYER ' + turn + ' WINS!';
          status.style.color = '#ffd60a';
          live = false; 
          return;
        }
        if (board.every(c => c)) { 
          status.textContent = "IT'S A DRAW!"; 
          live = false; 
          return; 
        }

        turn = turn === 'X' ? 'O' : 'X';
        if (isBotMode && turn === 'O' && live) {
          status.textContent = 'BOT IS THINKING...';
          setTimeout(() => {
            const empties = board.map((c, idx) => c === '' ? idx : null).filter(v => v !== null);
            if (empties.length > 0 && live) {
              const botMove = empties[Math.floor(Math.random() * empties.length)];
              makeMove(botMove);
            }
          }, 600);
        } else {
          status.textContent = isBotMode ? "YOUR TURN (X)" : "PLAYER " + turn + "'S TURN";
        }
      }

      for (let i = 0; i < 9; i++) {
        const cell = el('button'); cell.className = 'ttt-grid-cell';
        cell.onclick = () => { if (turn === 'X' || !isBotMode) makeMove(i); };
        cells.push(cell); grid.appendChild(cell);
      }
      const reset = el('button', 'margin-top:20px;padding:8px 16px;', 'BACK TO GAME MENU'); reset.className = 'btn';
      reset.onclick = () => window.MatrixDashboard.setView('game-ttt', true);
      body.append(status, grid, reset);
    }
    b1.onclick = () => startTTT(false);
    b2.onclick = () => startTTT(true);
  };

  // 2. TIMED ALGEBRA MATH CHALLENGE
  games['game-math'] = function (container, renderHeader, mount) {
    container.appendChild(renderHeader('🧮 MODULE: MATH_ALGEBRA.SYS', true));
    const body = el('div');
    body.className = 'dash-view-screen';

    const box = el('div');
    box.className = 'math-game-box';

    const stats = el('div', 'display:flex;justify-content:space-between;font-size:0.9rem;border-bottom:1px solid var(--dash-border);padding-bottom:6px;');
    const scoreDisplay = el('span', '', 'SCORE: 0');
    const timeDisplay = el('span', '', 'TIME: 20s');
    stats.append(scoreDisplay, timeDisplay);

    const display = el('div', '', 'LOADING...');
    display.className = 'math-equation-display';

    const ansIn = el('input', 'padding:8px;font-size:1.1rem;text-align:center;');
    ansIn.className = 'modal-input';
    ansIn.type = 'number';
    ansIn.placeholder = 'Type answer...';

    box.append(stats, display, ansIn);
    body.appendChild(box);
    mount(body);

    let score = 0, timeLeft = 20, timer = null, solution = 0;

    function nextQuestion() {
      ansIn.value = '';
      const a = Math.floor(Math.random() * 12) + 2;
      const b = Math.floor(Math.random() * 10) + 1;
      const types = ['+', '-', '*'];
      const op = types[Math.floor(Math.random() * types.length)];
      
      if (op === '+') { solution = a + b; display.textContent = a + ' + ' + b + ' = ?'; }
      else if (op === '-') { solution = a - b; display.textContent = a + ' - ' + b + ' = ?'; }
      else { solution = a * b; display.textContent = a + ' x ' + b + ' = ?'; }
      ansIn.focus();
    }

    ansIn.oninput = () => {
      if (parseInt(ansIn.value, 10) === solution) {
        score += 10;
        scoreDisplay.textContent = 'SCORE: ' + score;
        nextQuestion();
      }
    };

    timer = setInterval(() => {
      timeLeft--;
      timeDisplay.textContent = 'TIME: ' + timeLeft + 's';
      if (timeLeft <= 0) {
        clearInterval(timer);
        ansIn.disabled = true;
        display.textContent = 'GAME OVER!';
        display.style.color = '#ff3b3b';
        ansIn.placeholder = 'Final Score: ' + score;
        ansIn.value = '';
      }
    }, 1000);

    nextQuestion();
  };

  // 3. CANVAS NEON LIGHT DRAWING PAD
  games['game-draw'] = function (container, renderHeader, mount) {
    container.appendChild(renderHeader('🎨 MODULE: NEON_LIGHT_DRAW.NET', true));
    const body = el('div');
    body.className = 'dash-view-screen';

    const wrap = el('div');
    wrap.className = 'paint-canvas-container';

    const canvas = el('canvas');
    canvas.className = 'paint-canvas-node';
    canvas.width = 480;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    let drawing = false;
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const drawStart = (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const drawMove = (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const drawStop = () => drawing = false;

    canvas.addEventListener('mousedown', drawStart);
    window.addEventListener('mousemove', drawMove);
    window.addEventListener('mouseup', drawStop);
    canvas.addEventListener('touchstart', drawStart, { passive: true });
    canvas.addEventListener('touchmove', drawMove, { passive: true });
    canvas.addEventListener('touchend', drawStop);

    const controls = el('div');
    controls.className = 'paint-control-row';

    const colors = ['#00ff41', '#00e5ff', '#d946ef', '#ffd60a', '#ff3b3b'];
    colors.forEach(c => {
      const b = el('button', 'width:24px;height:24px;border-radius:50%;cursor:pointer;border:2px solid #fff;background:' + c);
      b.onclick = () => ctx.strokeStyle = c;
      controls.appendChild(b);
    });

    const clear = el('button', 'padding:4px 10px;font-size:0.75rem;', 'CLEAR CANVAS');
    clear.className = 'btn';
    clear.onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
    controls.appendChild(clear);

    wrap.append(canvas, controls);
    body.appendChild(wrap);
    mount(body);
  };

  window.MatrixGames = games;
})();
