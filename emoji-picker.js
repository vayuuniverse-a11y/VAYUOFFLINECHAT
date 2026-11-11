/* === EMOJI KEYBOARD EXTENSION (emoji-picker.js) === */
(function () {
  const CATEGORIES = {
    "Smileys": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕"],
    "Gamer/SciFi": ["🤖","👾","👽","☠️","💀","🔥","💥","⚡","🌟","✨","🛸","🚀","🎮","🕹️","💻","🖥️","⌨️","🖱️","💾","💿","🔮","🛡️","⚔️","👑","💎","👁️","🧠","🦾","🦿"],
    "Gestures": ["👍","👎","👊","✊","🤛","🤜","🤞","✌️","🤟","🤘","👌","🤌","🤏","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤙","💪","🙏","👏","🙌","👐","🤝"]
  };

  function initEmojiPicker() {
    const input = document.getElementById('msg-input');
    const oldGifDrawer = document.getElementById('gif-drawer');
    if (!input || !oldGifDrawer) return;

    // 1. Hide/Cleanup the old GIF drawer structure
    oldGifDrawer.innerHTML = '';
    oldGifDrawer.style.display = 'none';
    oldGifDrawer.style.flexDirection = 'column';
    oldGifDrawer.style.gap = '6px';
    oldGifDrawer.style.padding = '10px';

    // 2. Build the Category Headers
    const catBar = document.createElement('div');
    catBar.style.cssText = 'display:flex;gap:8px;border-bottom:1px solid var(--primary-border);padding-bottom:6px;overflow-x:auto;';

    // 3. Build the Grid Layout area
    const gridArea = document.createElement('div');
    gridArea.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(32px, 1fr));gap:6px;max-height:120px;overflow-y:auto;padding-top:6px;';

    // Scrollbar styling for the emoji container
    gridArea.className = 'scroll-list';

    // Function to populate emojis for a selected category
    function showCategory(name) {
      gridArea.innerHTML = '';
      const list = CATEGORIES[name] || [];
      list.forEach((emoji) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.textContent = emoji;
        item.style.cssText = 'font-size:1.4rem;background:transparent;border:none;cursor:pointer;padding:4px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;';
        item.onmouseenter = () => { item.style.background = 'var(--primary-dim)'; };
        item.onmouseleave = () => { item.style.background = 'transparent'; };
        
        item.onclick = (e) => {
          e.preventDefault();
          const start = input.selectionStart || 0;
          const end = input.selectionEnd || 0;
          const text = input.value;
          input.value = text.slice(0, start) + emoji + text.slice(end);
          input.focus();
          const nextPos = start + emoji.length;
          input.setSelectionRange(nextPos, nextPos);
        };
        gridArea.appendChild(item);
      });
    }

    // Generate Tab Headers dynamically
    Object.keys(CATEGORIES).forEach((catName, idx) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.textContent = catName;
      tab.className = 'icon-btn';
      tab.style.fontSize = '0.75rem';
      tab.style.padding = '3px 8px';
      tab.onclick = (e) => {
        e.preventDefault();
        catBar.querySelectorAll('button').forEach(b => { b.style.background = ''; b.style.color = ''; });
        tab.style.background = 'var(--primary)';
        tab.style.color = '#000';
        showCategory(catName);
      };
      catBar.appendChild(tab);
      if (idx === 0) {
        tab.style.background = 'var(--primary)';
        tab.style.color = '#000';
        showCategory(catName);
      }
    });

    oldGifDrawer.append(catBar, gridArea);

    // 4. Swap GIF Button behavior to become the Emoji Toggle button
    document.querySelectorAll('.tool-btn').forEach((btn) => {
      const label = (btn.textContent || '').trim();
      if (label === '🖼️' || label.toLowerCase().includes('gif') || label === '👾') {
        btn.textContent = '😀';
        btn.title = 'Toggle Emoji Keyboard';
        btn.onclick = (e) => {
          e.preventDefault();
          const isOpen = oldGifDrawer.style.display === 'flex';
          oldGifDrawer.style.display = isOpen ? 'none' : 'flex';
        };
      }
    });
  }

  // Handle intercept on enter key or send click to auto-close drawer neatly
  function setupCloseTriggers() {
    const sendBtn = document.getElementById('send-btn');
    const drawer = document.getElementById('gif-drawer');
    if (sendBtn && drawer) {
      sendBtn.addEventListener('click', () => { drawer.style.display = 'none'; });
    }
    const input = document.getElementById('msg-input');
    if (input && drawer) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') drawer.style.display = 'none';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initEmojiPicker(); setupCloseTriggers(); });
  } else {
    initEmojiPicker();
    setupCloseTriggers();
  }
})();
