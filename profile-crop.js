/* === PART 2B: 10MB IMAGE UPLOAD & CIRCULAR CROPPER === */
(function () {
  const MAX_MB = 10 * 1024 * 1024;
  let rawImg = null, zoom = 1, cx = 0, cy = 0, drag = false, sx = 0, sy = 0;

  function initCropper() {
    const host = document.getElementById('prof-tab-upload');
    if (!host || host.dataset.ready) return;
    host.dataset.ready = '1';

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:0.76rem;opacity:0.85;';
    hint.textContent = 'Max 10 MB. Auto-crops instantly—drag or zoom to edit:';

    const fileIn = document.createElement('input');
    fileIn.type = 'file';
    fileIn.accept = 'image/*';
    fileIn.className = 'modal-input';
    fileIn.style.padding = '6px';

    const errTxt = document.createElement('div');
    errTxt.style.cssText = 'display:none;color:#ff3b3b;font-size:0.78rem;font-weight:bold;';

    const cropBox = document.createElement('div');
    cropBox.style.cssText = 'display:none;flex-direction:column;align-items:center;gap:8px;padding:8px;background:#000;border:1px solid var(--primary-border);border-radius:12px;';

    const canvas = document.createElement('canvas');
    canvas.width = 170;
    canvas.height = 170;
    canvas.style.cssText = 'border-radius:50%;border:2px solid var(--primary);cursor:grab;touch-action:none;';

    const zRow = document.createElement('div');
    zRow.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;font-size:0.78rem;';
    const zLbl = document.createElement('span');
    zLbl.textContent = 'Zoom:';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '3';
    slider.step = '0.05';
    slider.value = '1';
    slider.style.cssText = 'flex:1;accent-color:var(--primary);';

    zRow.append(zLbl, slider);
    cropBox.append(canvas, zRow);
    host.append(hint, fileIn, errTxt, cropBox);

    function drawCrop() {
      if (!rawImg || !window.MatrixModal) return;
      const ctx = canvas.getContext('2d');
      const s = canvas.width;
      ctx.clearRect(0, 0, s, s);
      const scale = Math.max(s / rawImg.width, s / rawImg.height) * zoom;
      const w = rawImg.width * scale, h = rawImg.height * scale;
      const mx = Math.max(0, (w - s) / 2), my = Math.max(0, (h - s) / 2);
      cx = Math.max(-mx, Math.min(mx, cx));
      cy = Math.max(-my, Math.min(my, cy));
      ctx.drawImage(rawImg, (s - w) / 2 + cx, (s - h) / 2 + cy, w, h);

      const out = document.createElement('canvas');
      out.width = 140;
      out.height = 140;
      out.getContext('2d').drawImage(canvas, 0, 0, 140, 140);

      const d = window.MatrixModal.getDraft();
      if (d) {
        d.type = 'image';
        d.image = out.toDataURL('image/jpeg', 0.82);
        window.MatrixModal.refreshPreview();
      }
    }

    fileIn.onchange = () => {
      errTxt.style.display = 'none';
      const f = fileIn.files && fileIn.files.item(0);
      if (!f) return;
      if (f.size > MAX_MB) {
        errTxt.textContent = 'File too large (' + (f.size / 1048576).toFixed(1) + ' MB). Max is 10 MB.';
        errTxt.style.display = 'block';
        fileIn.value = '';
        return;
      }
      const r = new FileReader();
      r.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          rawImg = img; zoom = 1; cx = 0; cy = 0; slider.value = '1';
          cropBox.style.display = 'flex';
          drawCrop();
        };
        img.src = ev.target.result;
      };
      r.readAsDataURL(f);
    };

    slider.oninput = () => { zoom = parseFloat(slider.value); drawCrop(); };
    const start = (x, y) => { drag = true; sx = x - cx; sy = y - cy; };
    const move = (x, y) => { if (drag && rawImg) { cx = x - sx; cy = y - sy; drawCrop(); } };
    const stop = () => { drag = false; };

    canvas.addEventListener('mousedown', (e) => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', stop);
    canvas.addEventListener('touchstart', (e) => { if (e.touches.item(0)) start(e.touches.item(0).clientX, e.touches.item(0).clientY); }, { passive: true });
    canvas.addEventListener('touchmove', (e) => { if (e.touches.item(0)) move(e.touches.item(0).clientX, e.touches.item(0).clientY); }, { passive: true });
    canvas.addEventListener('touchend', stop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCropper);
  else initCropper();
})();
