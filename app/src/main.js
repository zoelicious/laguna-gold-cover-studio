// Laguna Gold — editor. Loads the sample photos, keeps one state object,
// redraws the live preview on every change, and exports PNGs at the three
// post sizes. Photos are read on this machine only; nothing is uploaded.

import { SAMPLES, GRADES, LAYOUTS, defaultState, layoutRects, renderCover } from './cover.js';

const state = defaultState();
const images = {};
let selectedPanel = 0;
let previewScale = 1;

const preview = document.getElementById('preview');
const pctx = preview.getContext('2d');
const statusEl = document.getElementById('status');

function setStatus(msg) {
  statusEl.textContent = msg;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadAll() {
  await Promise.all(SAMPLES.map(async (s) => {
    images[s.key] = await loadImage(s.src);
  }));
  await document.fonts.load('16px "Archivo Black"');
  await document.fonts.load('700 16px Oswald');
  await document.fonts.load('16px Pacifico');
  await document.fonts.ready;
}

function drawPreview() {
  const size = 720;
  preview.width = size;
  preview.height = size;
  renderCover(preview, images, state, size, size);
  // Highlight the selected panel.
  const rects = layoutRects(state.layout, size, size);
  const r = rects[selectedPanel];
  if (r) {
    pctx.save();
    pctx.strokeStyle = '#ffd166';
    pctx.lineWidth = 4;
    pctx.setLineDash([10, 6]);
    pctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    pctx.restore();
  }
  previewScale = size / preview.getBoundingClientRect().width;
}

function refreshPanelControls() {
  const panel = state.panels[selectedPanel];
  document.getElementById('panelLabel').textContent =
    `Panel ${selectedPanel + 1} of ${layoutRects(state.layout, 720, 720).length}`;
  const sel = document.getElementById('panelPhoto');
  sel.value = panel.src;
  document.getElementById('panelZoom').value = panel.zoom;
  document.getElementById('panelZoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  document.getElementById('panelPanX').value = panel.dx;
  document.getElementById('panelPanY').value = panel.dy;
}

function buildControls() {
  // Layout switcher
  const layoutBox = document.getElementById('layoutBtns');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.name;
    b.dataset.layout = key;
    b.addEventListener('click', () => {
      state.layout = key;
      selectedPanel = 0;
      document.querySelectorAll('#layoutBtns button').forEach((x) => x.classList.toggle('active', x === b));
      refreshPanelControls();
      drawPreview();
    });
    if (key === state.layout) b.classList.add('active');
    layoutBox.appendChild(b);
  });

  // Grade switcher
  const gradeBox = document.getElementById('gradeBtns');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.name;
    b.dataset.grade = key;
    b.addEventListener('click', () => {
      state.grade = key;
      document.querySelectorAll('#gradeBtns button').forEach((x) => x.classList.toggle('active', x === b));
      drawPreview();
    });
    if (key === state.grade) b.classList.add('active');
    gradeBox.appendChild(b);
  });

  // Caption style
  const styleBox = document.getElementById('styleBtns');
  [['banner', 'Banner'], ['outline', 'Outline'], ['neon', 'Neon glow'], ['block', 'Block white']].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', () => {
      state.captionStyle = key;
      document.querySelectorAll('#styleBtns button').forEach((x) => x.classList.toggle('active', x === b));
      drawPreview();
    });
    if (key === state.captionStyle) b.classList.add('active');
    styleBox.appendChild(b);
  });

  // Caption position
  const posBox = document.getElementById('posBtns');
  [['top', 'Top'], ['centre', 'Centre'], ['bottom', 'Bottom']].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', () => {
      state.captionPos = key;
      document.querySelectorAll('#posBtns button').forEach((x) => x.classList.toggle('active', x === b));
      drawPreview();
    });
    if (key === state.captionPos) b.classList.add('active');
    posBox.appendChild(b);
  });

  // Panel photo picker
  const sel = document.getElementById('panelPhoto');
  SAMPLES.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.key;
    o.textContent = s.label;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    state.panels[selectedPanel].src = sel.value;
    drawPreview();
  });

  // Text fields
  const bindText = (id, key) => {
    const el = document.getElementById(id);
    el.value = state[key];
    el.addEventListener('input', () => {
      state[key] = el.value;
      drawPreview();
    });
  };
  bindText('titleInput', 'title');
  bindText('kickerInput', 'kicker');
  bindText('taglineInput', 'tagline');
  bindText('pillInput', 'pill');

  // Sliders
  const bindRange = (id, valId, fmt, apply) => {
    const el = document.getElementById(id);
    const out = document.getElementById(valId);
    el.addEventListener('input', () => {
      apply(parseFloat(el.value));
      out.textContent = fmt(parseFloat(el.value));
      drawPreview();
    });
  };
  bindRange('intensity', 'intensityVal', (v) => `${Math.round(v * 100)}%`, (v) => { state.intensity = v; });
  bindRange('captionSize', 'captionSizeVal', (v) => `${Math.round(v * 100)}%`, (v) => { state.captionSize = v; });
  bindRange('panelZoom', 'panelZoomVal', (v) => `${Math.round(v * 100)}%`, (v) => { state.panels[selectedPanel].zoom = v; });
  bindRange('panelPanX', 'panelPanXVal', (v) => `${Math.round(v * 100)}`, (v) => { state.panels[selectedPanel].dx = v; });
  bindRange('panelPanY', 'panelPanYVal', (v) => `${Math.round(v * 100)}`, (v) => { state.panels[selectedPanel].dy = v; });

  // Click a panel in the preview to select it; drag it to pan the photo.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  preview.addEventListener('pointerdown', (e) => {
    const rect = preview.getBoundingClientRect();
    const px = (e.clientX - rect.left) * previewScale;
    const py = (e.clientY - rect.top) * previewScale;
    const rects = layoutRects(state.layout, 720, 720);
    const hit = rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    if (hit >= 0) {
      selectedPanel = hit;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      preview.setPointerCapture(e.pointerId);
      refreshPanelControls();
      drawPreview();
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = preview.getBoundingClientRect();
    const panel = state.panels[selectedPanel];
    const r = layoutRects(state.layout, 720, 720)[selectedPanel];
    panel.dx += ((e.clientX - lastX) / rect.width) * (720 / r.w) * 0.6;
    panel.dy += ((e.clientY - lastY) / rect.height) * (720 / r.h) * 0.6;
    panel.dx = Math.max(-0.5, Math.min(0.5, panel.dx));
    panel.dy = Math.max(-0.5, Math.min(0.5, panel.dy));
    lastX = e.clientX;
    lastY = e.clientY;
    refreshPanelControls();
    drawPreview();
  });
  preview.addEventListener('pointerup', () => { dragging = false; });

  // Add your own photo to the selected panel (read locally, never uploaded).
  document.getElementById('uploadPhoto').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(file);
    });
    const key = `upload-${Date.now()}`;
    const img = await loadImage(dataUrl);
    images[key] = img;
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `Your photo — ${file.name}`;
    sel.appendChild(opt);
    state.panels[selectedPanel].src = key;
    refreshPanelControls();
    drawPreview();
    setStatus(`Loaded ${file.name} into panel ${selectedPanel + 1}.`);
  });

  // Export buttons
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => {
      const [w, h] = b.dataset.export.split('x').map(Number);
      exportCover(w, h);
    });
  });
  document.getElementById('exportAll').addEventListener('click', () => {
    exportCover(1080, 1080);
    setTimeout(() => exportCover(1080, 1350), 400);
    setTimeout(() => exportCover(1920, 1080), 800);
    setStatus('Exported 1080×1080, 1080×1350 and 1920×1080 PNGs.');
  });
}

function exportCover(w, h, gradeOverride) {
  const savedGrade = state.grade;
  if (gradeOverride) state.grade = gradeOverride;
  const c = document.createElement('canvas');
  renderCover(c, images, state, w, h);
  state.grade = savedGrade;
  c.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `laguna-gold-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
  setStatus(`Exported ${w}×${h} PNG.`);
}

// Hooks used by the maker's screenshot script (not by the UI).
window.__exportCover = (w, h, gradeOverride) => {
  const savedGrade = state.grade;
  if (gradeOverride) state.grade = gradeOverride;
  const c = document.createElement('canvas');
  renderCover(c, images, state, w, h);
  state.grade = savedGrade;
  return c.toDataURL('image/png');
};
window.__setState = (patch) => {
  Object.assign(state, patch);
  document.querySelectorAll('#layoutBtns button').forEach((x) => x.classList.toggle('active', x.dataset.layout === state.layout));
  document.querySelectorAll('#gradeBtns button').forEach((x) => x.classList.toggle('active', x.dataset.grade === state.grade));
  selectedPanel = 0;
  refreshPanelControls();
  drawPreview();
};
window.__drawPreview = drawPreview;

buildControls();
refreshPanelControls();
loadAll().then(() => {
  drawPreview();
  setStatus('Ready — 6 sample photos loaded. Pick a layout, grade and title, then export.');
  window.__ready = true;
}).catch((err) => {
  setStatus(`Could not load sample photos: ${err.message}`);
});
