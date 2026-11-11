/* === FIREBASE GLOBAL SCREEN-FLASH NOTIFICATIONS (global-notifications.js) === */
(function () {
  if (typeof db === 'undefined') return;

  // Sound generator matching your chat-alerts tone parameters
  function playAlertPing() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, audioContext.currentTime); // Crisp High Tone
      osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.12);
    } catch (e) { /* Swallowed if audio blocked */ }
  }

  function showToastNotification(sender, text) {
    // Prevent showing notification to yourself
    if (typeof currentUser === 'string' && sender.toLowerCase() === currentUser.toLowerCase()) return;

    const toast = document.createElement('div');
    toast.className = 'global-alert-toast';
    
    const title = document.createElement('div');
    title.className = 'global-alert-title';
    title.textContent = '🔔 NEW MESSAGE FROM ' + sender.toUpperCase();

    const body = document.createElement('div');
    body.className = 'global-alert-body';
    // Trim length if text snippet is long
    body.textContent = text.length > 50 ? text.slice(0, 47) + '...' : text;

    toast.append(title, body);
    document.body.appendChild(toast);

    // Trigger sliding animation entry smoothly
    setTimeout(() => { 
      toast.classList.add('show'); 
      playAlertPing();
    }, 100);

    // Slide out and destroy element cleanly after 4.5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 4500);
  }

  // Intercept your local chat send action buttons or keys to log the alert hook
  function hijackSendAction() {
    const input = document.getElementById('msg-input');
    const sendBtn = document.getElementById('send-btn');
    if (!input || !sendBtn) return;

    async function pushAlertHook() {
      const txt = input.value.trim();
      if (!txt || typeof currentUser !== 'string') return;
      
      // Skip system hashtag command values to keep notifications clean
      if (txt.startsWith('#')) return;

      // Log notification log parameters onto global Firebase schema pool
      await db.ref('global_alerts').set({
        sender: currentUser,
        text: txt,
        timestamp: Date.now()
      });
    }

    sendBtn.addEventListener('click', pushAlertHook);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') pushAlertHook(); });
  }

  // Listen to remote push notification records across all connected classmates live
  db.ref('global_alerts').on('value', (snap) => {
    const data = snap.val();
    if (!data || !data.sender || !data.text) return;
    
    // Ignore historical system records older than 8 seconds
    if (Date.now() - data.timestamp > 8000) return;

    showToastNotification(data.sender, data.text);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hijackSendAction);
  else hijackSendAction();
})();
