// Laguna Gold — cover renderer. Draws a multi-panel poster cover onto any
// 2D canvas: photo panels with per-panel crop, a colour grade applied on
// canvas, a giant two-word title block with kicker + script tagline + pill,
// a retro striped sun overlay and palm silhouettes flanking the title.
// All art is drawn here from scratch; no outside images, no network.

export const SAMPLES = [
  { key: 'hero', label: 'Hero — convertible', src: 'samples/hero.jpg' },
  { key: 'captain', label: 'Captain — pier', src: 'samples/captain.jpg' },
  { key: 'marina', label: 'Marina — yachts', src: 'samples/marina.jpg' },
  { key: 'neon', label: 'Neon street', src: 'samples/neon.jpg' },
  { key: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { key: 'pier', label: 'Pier sunset', src: 'samples/pier.jpg' },
];

export const GRADES = {
  sunset: { name: 'Sunset', filter: 'saturate(1.35) contrast(1.08) brightness(1.02)', warm: 0.55, cool: 0.35 },
  golden: { name: 'Golden Hour', filter: 'saturate(1.45) contrast(1.05) brightness(1.06) sepia(0.18)', warm: 0.6, cool: 0.1 },
  neon: { name: 'Neon Night', filter: 'saturate(1.5) contrast(1.15) brightness(0.92) hue-rotate(-12deg)', warm: 0.25, cool: 0.6 },
  bright: { name: 'Bright Day', filter: 'saturate(1.3) contrast(1.06) brightness(1.1)', warm: 0.25, cool: 0.05 },
  halftone: { name: 'Pop Art / Halftone', filter: 'saturate(1.6) contrast(1.3) brightness(1.07)', warm: 0.4, cool: 0.3 },
};

export const LAYOUTS = {
  hero: { name: 'Hero — big left', slots: 4 },
  four: { name: '4-panel', slots: 4 },
  six: { name: '6-panel', slots: 6 },
  nine: { name: '9-panel classic', slots: 9 },
  single: { name: 'Single hero', slots: 1 },
};

export function defaultState() {
  return {
    layout: 'hero',
    grade: 'golden',
    intensity: 0.85,
    title: 'LAGUNA GOLD',
    kicker: 'WELCOME TO LAGUNA',
    tagline: 'golden tides, neon nights',
    pill: 'SUMMER 2026',
    captionStyle: 'banner',
    captionSize: 1.0,
    captionPos: 'bottom',
    // one entry per panel slot: which sample, zoom and pan (fractions of panel)
    panels: [
      { src: 'hero', zoom: 1.05, dx: 0, dy: -0.04 },
      { src: 'captain', zoom: 1.0, dx: 0, dy: 0 },
      { src: 'marina', zoom: 1.0, dx: 0, dy: 0 },
      { src: 'neon', zoom: 1.0, dx: -0.12, dy: 0 },
      { src: 'boulevard', zoom: 1.0, dx: 0, dy: 0 },
      { src: 'pier', zoom: 1.0, dx: 0, dy: 0 },
      { src: 'hero', zoom: 1.6, dx: 0.08, dy: -0.1 },
      { src: 'captain', zoom: 1.6, dx: -0.06, dy: 0 },
      { src: 'marina', zoom: 1.4, dx: 0, dy: -0.06 },
    ],
  };
}

// Panel rectangles (fractions of the photo area) per layout.
export function layoutRects(layout, w, h) {
  const photoH = h * 0.72;
  const R = (x, y, rw, rh) => ({ x: x * w, y: y * photoH, w: rw * w, h: rh * photoH });
  switch (layout) {
    case 'hero':
      return [
        R(0, 0, 0.55, 1),
        R(0.55, 0, 0.45, 0.5),
        R(0.55, 0.5, 0.225, 0.5),
        R(0.775, 0.5, 0.225, 0.5),
      ];
    case 'four':
      return [
        R(0, 0, 0.55, 1),
        R(0.55, 0, 0.45, 0.34),
        R(0.55, 0.34, 0.45, 0.33),
        R(0.55, 0.67, 0.45, 0.33),
      ];
    case 'six':
      return [
        R(0, 0, 0.5, 0.55),
        R(0.5, 0, 0.25, 0.55),
        R(0.75, 0, 0.25, 0.55),
        R(0, 0.55, 0.333, 0.45),
        R(0.333, 0.55, 0.333, 0.45),
        R(0.666, 0.55, 0.334, 0.45),
      ];
    case 'nine': {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(R(c / 3, r / 3, 1 / 3, 1 / 3));
      return out;
    }
    case 'single':
    default:
      return [R(0, 0, 1, 1)];
  }
}

function coverFit(img, rect, zoom, dx, dy) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * base;
  const ph = img.naturalHeight * base;
  return {
    x: rect.x + (rect.w - pw) / 2 + dx * rect.w,
    y: rect.y + (rect.h - ph) / 2 + dy * rect.h,
    w: pw,
    h: ph,
  };
}

// Grade one photo panel onto ctx, clipped to rect. Returns after drawing.
function drawGradedPanel(ctx, img, rect, panel, gradeKey, intensity) {
  const grade = GRADES[gradeKey] || GRADES.golden;
  const off = document.createElement('canvas');
  const scale = Math.min(1, 560 / Math.max(rect.w, rect.h));
  off.width = Math.max(2, Math.round(rect.w * scale));
  off.height = Math.max(2, Math.round(rect.h * scale));
  const o = off.getContext('2d');
  const d = coverFit(img, { x: 0, y: 0, w: off.width, h: off.height }, panel.zoom, panel.dx, panel.dy);
  o.filter = grade.filter;
  o.drawImage(img, d.x, d.y, d.w, d.h);
  o.filter = 'none';
  // Warm sunset wash from the top, cool magenta from the bottom.
  const k = intensity;
  if (grade.warm > 0) {
    const g = o.createLinearGradient(0, 0, 0, off.height);
    g.addColorStop(0, `rgba(255,140,60,${0.22 * grade.warm * k})`);
    g.addColorStop(1, 'rgba(255,140,60,0)');
    o.fillStyle = g;
    o.fillRect(0, 0, off.width, off.height);
  }
  if (grade.cool > 0) {
    const g = o.createLinearGradient(0, 0, 0, off.height);
    g.addColorStop(0, 'rgba(190,40,160,0)');
    g.addColorStop(1, `rgba(190,40,160,${0.28 * grade.cool * k})`);
    o.fillStyle = g;
    o.fillRect(0, 0, off.width, off.height);
  }
  // Vignette so panels read as one poster, not loose photos.
  const v = o.createRadialGradient(
    off.width / 2, off.height / 2, Math.min(off.width, off.height) * 0.35,
    off.width / 2, off.height / 2, Math.max(off.width, off.height) * 0.75,
  );
  v.addColorStop(0, 'rgba(20,0,30,0)');
  v.addColorStop(1, `rgba(20,0,30,${0.22 * k})`);
  o.fillStyle = v;
  o.fillRect(0, 0, off.width, off.height);
  if (gradeKey === 'halftone') posterizeAndDots(o, off.width, off.height, k);
  ctx.drawImage(off, rect.x, rect.y, rect.w, rect.h);
}

// Posterize to flat duotone bands, then a halftone dot screen. Applied to
// every panel alike, so the style is consistent across the whole cover.
function posterizeAndDots(o, w, h, k) {
  const img = o.getImageData(0, 0, w, h);
  const px = img.data;
  const levels = 5;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const q = Math.floor((lum / 255) * levels) / (levels - 1 || 1);
    // Duotone: shadows lean magenta, highlights lean warm yellow.
    const t = q;
    px[i] = Math.round(255 * (0.55 + 0.45 * t) * (0.85 + 0.15 * t));
    px[i + 1] = Math.round(255 * (0.15 + 0.55 * t) * (0.7 + 0.3 * t));
    px[i + 2] = Math.round(255 * (0.35 + 0.35 * t));
  }
  o.putImageData(img, 0, 0);
  const step = Math.max(5, Math.round(w / 90));
  o.fillStyle = 'rgba(30,0,50,0.38)';
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const d = o.getImageData(x, y, 1, 1).data;
      const lum = (0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2]) / 255;
      const r = (1 - lum) * step * 0.42 * (0.5 + 0.5 * k);
      if (r > 0.4) {
        o.beginPath();
        o.arc(x, y, r, 0, Math.PI * 2);
        o.fill();
      }
    }
  }
}

// Retro striped sun: a disc cut by horizontal gaps, drawn as an overlay
// (never its own panel), about 15–20% of the cover width.
export function drawRetroSun(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(0.55, '#ff9a3d');
  g.addColorStop(1, '#ff4e8a');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(43,16,56,0.9)';
  let y = cy + r * 0.08;
  let gap = r * 0.07;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.16;
    gap *= 1.35;
  }
  ctx.restore();
}

// One palm silhouette: curved trunk + drooping fronds.
export function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(lean);
  ctx.strokeStyle = '#1d0a2e';
  ctx.fillStyle = '#1d0a2e';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -60, 26, -108);
  ctx.stroke();
  const topX = 26;
  const topY = -108;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.13);
    const len = 62 - Math.abs(i - 3) * 7;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6, topY + Math.sin(a) * len * 0.55 - 14,
      topX + Math.cos(a) * len, topY + Math.sin(a) * len + 26,
    );
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.restore();
}

function fitFont(ctx, text, fontTemplate, maxWidth, startSize) {
  let size = startSize;
  ctx.font = fontTemplate(size);
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = fontTemplate(size);
  }
  return size;
}

// The giant title block: kicker, two-word title, script tagline, pill.
// `box` is the banner rect; position top/centre moves it over the photos.
function drawTitleBlock(ctx, w, h, state, box) {
  const { title, kicker, tagline, pill } = state;
  const cx = w / 2;
  const titleMax = w * 0.64 * state.captionSize;
  const titleSize = fitFont(ctx, title, (s) => `${s}px "Archivo Black", sans-serif`, titleMax, h * 0.135);
  const titleFont = (s) => `${s}px "Archivo Black", sans-serif`;
  const kickerSize = Math.max(12, titleSize * 0.22);
  const tagSize = Math.max(14, titleSize * 0.34);
  const pillSize = Math.max(11, titleSize * 0.16);
  const blockH = kickerSize * 1.5 + titleSize * 1.15 + tagSize * 1.5 + pillSize * 2.4;
  let top = box.y + (box.h - blockH) / 2;
  if (state.captionPos === 'top') top = h * 0.06;
  if (state.captionPos === 'centre') top = h * 0.36;
  const cy = top + blockH / 2;

  // Palms flanking the title, rooted at the banner's bottom edge.
  const palmS = titleSize / 55;
  drawPalm(ctx, w * 0.06, box.y + box.h * 0.98, palmS, -0.35);
  ctx.save();
  ctx.translate(w * 0.94, box.y + box.h * 0.98);
  ctx.scale(-1, 1);
  ctx.translate(-w * 0.94, -(box.y + box.h * 0.98));
  drawPalm(ctx, w * 0.94, box.y + box.h * 0.98, palmS, -0.35);
  ctx.restore();

  // Retro sun peeking over the banner's top-right corner.
  drawRetroSun(ctx, w * 0.9, box.y + h * 0.015, w * 0.085);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let y = top + kickerSize * 0.75;
  // Kicker
  ctx.font = `700 ${kickerSize}px Oswald, sans-serif`;
  ctx.fillStyle = '#ffe259';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText(kicker.toUpperCase(), cx, y);
  ctx.shadowBlur = 0;
  // Title
  y += kickerSize * 0.9 + titleSize * 0.55;
  ctx.font = titleFont(titleSize);
  ctx.lineJoin = 'round';
  const grad = ctx.createLinearGradient(cx - titleMax / 2, y - titleSize / 2, cx + titleMax / 2, y + titleSize / 2);
  if (state.captionStyle === 'neon') {
    grad.addColorStop(0, '#ff7ad9');
    grad.addColorStop(1, '#ff2e88');
  } else {
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(0.5, '#ffb347');
    grad.addColorStop(1, '#ff5e7a');
  }
  ctx.save();
  if (state.captionStyle === 'neon') {
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = titleSize * 0.35;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = titleSize * 0.12;
    ctx.shadowOffsetY = titleSize * 0.05;
  }
  if (state.captionStyle === 'outline') {
    ctx.fillStyle = '#fff8ec';
  } else {
    ctx.fillStyle = grad;
  }
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = Math.max(3, titleSize * 0.09);
  ctx.strokeText(title.toUpperCase(), cx, y);
  ctx.fillText(title.toUpperCase(), cx, y);
  ctx.restore();
  // Script tagline
  y += titleSize * 0.62 + tagSize * 0.55;
  ctx.font = `${tagSize}px Pacifico, cursive`;
  ctx.fillStyle = '#ff8ac2';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(tagline, cx, y);
  ctx.shadowBlur = 0;
  // Pill
  y += tagSize * 0.75 + pillSize;
  ctx.font = `700 ${pillSize}px Oswald, sans-serif`;
  const pw = ctx.measureText(pill.toUpperCase()).width + pillSize * 2.2;
  const ph = pillSize * 2.1;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.roundRect(cx - pw / 2, y - ph / 2, pw, ph, ph / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(pill.toUpperCase(), cx, y + 1);
}

// Full render. `images` maps sample key -> loaded HTMLImageElement.
export function renderCover(canvas, images, state, W, H) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const photoH = H * 0.72;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2b1038');
  bg.addColorStop(0.72, '#3d1445');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const rects = layoutRects(state.layout, W, H);
  const gap = Math.max(3, Math.round(W * 0.006));
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || state.panels[0];
    const img = images[panel.src] || images.hero;
    if (!img) return;
    const r = { x: rect.x + gap / 2, y: rect.y + gap / 2, w: rect.w - gap, h: rect.h - gap };
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    drawGradedPanel(ctx, img, r, panel, state.grade, state.intensity);
    ctx.restore();
  });

  // Banner: deep magenta-to-purple gradient with a thin gold rule on top.
  const banner = { x: 0, y: photoH, w: W, h: H - photoH };
  const bg2 = ctx.createLinearGradient(0, banner.y, 0, H);
  bg2.addColorStop(0, '#4a1150');
  bg2.addColorStop(0.5, '#7a1e63');
  bg2.addColorStop(1, '#2b1038');
  ctx.fillStyle = bg2;
  ctx.fillRect(banner.x, banner.y, banner.w, banner.h);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, banner.y, W, Math.max(2, H * 0.004));
  ctx.fillStyle = 'rgba(255,209,102,0.35)';
  ctx.fillRect(0, H - Math.max(2, H * 0.004), W, Math.max(2, H * 0.004));

  if (state.captionPos !== 'bottom') {
    // Title floats over the photos: darken a band behind it first.
    const scrim = ctx.createLinearGradient(0, H * 0.28, 0, H * 0.62);
    scrim.addColorStop(0, 'rgba(18,8,31,0)');
    scrim.addColorStop(0.5, 'rgba(18,8,31,0.55)');
    scrim.addColorStop(1, 'rgba(18,8,31,0)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H * 0.28, W, H * 0.34);
  }
  drawTitleBlock(ctx, W, H, state, banner);
  return canvas;
}
