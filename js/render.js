// =====================================================================
//  그리기 — 배경, 적, 보스, 소환수, 플레이어, 이펙트, HUD
// =====================================================================

function bgd() {
  const c = stageDef(), gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, c.a); gr.addColorStop(1, c.b);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff14'; g.beginPath(); g.arc(740 - cam * 0.05, 110, 46, 0, 7); g.fill();
  for (let L = 0; L < 3; L++) {
    g.fillStyle = `rgba(0,0,0,${0.18 + L * 0.16})`;
    const par = 0.15 + L * 0.2, hh = 130 + L * 40;
    g.beginPath(); g.moveTo(0, GY);
    for (let x = 0; x <= W; x += 24) {
      const wx = x + cam * par;
      g.lineTo(x, GY - hh * 0.45 - Math.abs(Math.sin(wx * 0.013 + L * 2) + Math.sin(wx * 0.031 + L)) * hh * 0.28);
    }
    g.lineTo(W, GY); g.fill();
  }
  g.fillStyle = '#120a18'; g.fillRect(0, GY, W, H - GY);
  g.fillStyle = c.e + '88'; g.fillRect(0, GY, W, 3);
  for (const q of pl) { g.fillStyle = '#2a1a34'; g.fillRect(q.x - cam, q.y, q.w, 12); g.fillStyle = c.e + 'aa'; g.fillRect(q.x - cam, q.y, q.w, 3); }
  if (portal) {
    const x = portal.x - cam;
    g.save(); g.translate(x, GY - 70); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = `rgba(${120 + i * 30},80,255,.6)`; g.lineWidth = 4;
      g.beginPath(); g.ellipse(0, 0, 38 - i * 7, 66 - i * 11, time * (i % 2 ? 1 : -1) * 2, 0, 5); g.stroke();
    }
    g.fillStyle = '#8a5aff55'; g.beginPath(); g.ellipse(0, 0, 34, 62, 0, 0, 7); g.fill();
    g.restore();
  }
}

function glow(x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 2, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}

// ----- 적 -----
function drawE(e) {
  const sx = e.x - cam;
  if (sx < -200 || sx > W + 200) return;
  if (e.t === 'boss') return drawBoss(e);
  if (e.t === 'wisp') return drawWisp(e);
  if (e.t === 'crystal') return drawCrystal(e);

  const f = e.fl > 0, h = e.h, w = e.w;
  const P = (c) => (g.fillStyle = f ? '#fff' : c), S2 = (c) => (g.strokeStyle = f ? '#fff' : c);
  // 버프 / 시전 이펙트 (뒤쪽)
  g.save(); g.globalCompositeOperation = 'lighter';
  if (e.bf > 0) glow(sx, e.y - h * 0.4, h * 0.8, '255,150,60', 0.35 + 0.15 * Math.sin(time * 12));
  if (e.cast > 0 && e.D.role) glow(sx, e.y - h * 0.6, 60, hexRgb(e.D.role[1]), e.cast);
  g.restore();

  g.save(); g.translate(sx, e.y); g.scale(e.dir, 1);
  const bc = e.D.col, k = e.D.look, wk = Math.sin(e.ph * 2.5) * (e.kx > 20 ? 0 : 1);
  if (k >= 5) {
    // 로브 (지원형)
    P(bc); g.beginPath(); g.moveTo(-w * 0.4, -h * 0.76); g.lineTo(w * 0.4, -h * 0.76); g.lineTo(w * 0.52, 0); g.lineTo(-w * 0.52, 0); g.fill();
    P('#00000033'); g.fillRect(-w * 0.05 + wk * 2, -h * 0.4, w * 0.1, h * 0.4);
  } else {
    P('#3a2a20'); g.fillRect(-w * 0.3 + wk * 5, -h * 0.36, w * 0.22, h * 0.36); g.fillRect(w * 0.06 - wk * 5, -h * 0.36, w * 0.22, h * 0.36);
    P(bc); g.fillRect(-w * 0.4, -h * 0.76, w * 0.8, h * 0.42);
  }
  P('#e0c0a0'); g.beginPath(); g.arc(0, -h * 0.86, w * 0.28, 0, 7); g.fill();
  g.fillStyle = '#221'; g.fillRect(w * 0.04, -h * 0.9, w * 0.1, w * 0.08);
  // 모자
  if (k === 0) { P('#d8b050'); g.fillRect(-w * 0.5, -h * 0.95, w, 4); g.fillRect(-w * 0.25, -h * 1.02, w * 0.5, 8); }
  else if (k === 1) { P('#5a3a20'); g.fillRect(-w * 0.28, -h * 1.0, w * 0.56, 6); }
  else if (k === 2) { P('#d02030'); g.fillRect(-w * 0.3, -h * 0.93, w * 0.6, 4); }
  else if (k === 3) { P('#2a5a34'); g.beginPath(); g.moveTo(-w * 0.32, -h * 0.84); g.lineTo(0, -h * 1.1); g.lineTo(w * 0.32, -h * 0.84); g.fill(); }
  else if (k === 4) { P('#b8b8cc'); g.fillRect(-w * 0.3, -h * 1.0, w * 0.6, h * 0.14); P('#d02030'); g.fillRect(-3, -h * 1.1, 6, h * 0.1); }
  else if (k === 5) { P('#fff'); g.beginPath(); g.arc(0, -h * 0.88, w * 0.33, Math.PI, 0); g.fill(); P('#d8b050'); g.fillRect(-2, -h * 0.72, 4, h * 0.24); g.fillRect(-w * 0.15, -h * 0.64, w * 0.3, 4); }
  else if (k === 6) { P('#a02020'); g.beginPath(); g.moveTo(-w * 0.36, -h * 0.92); g.lineTo(w * 0.1, -h * 1.12); g.lineTo(w * 0.36, -h * 0.92); g.fill(); S2('#ffe680'); g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.05, -h * 1.08); g.lineTo(-w * 0.3, -h * 1.22); g.stroke(); }
  else if (k === 7) { P('#3a1a60'); g.beginPath(); g.moveTo(-w * 0.38, -h * 0.78); g.lineTo(-w * 0.05, -h * 1.2); g.lineTo(w * 0.38, -h * 0.78); g.fill(); g.fillStyle = '#c08aff'; g.fillRect(w * 0.04, -h * 0.9, w * 0.1, w * 0.08); }
  else if (k === 8) { P('#8aa8d8'); g.beginPath(); g.arc(0, -h * 0.9, w * 0.31, Math.PI, 0); g.fill(); P('#d8b050'); g.fillRect(-w * 0.31, -h * 0.9, w * 0.62, 3); }
  // 무기 / 소품
  g.lineWidth = 3; g.beginPath();
  if (k === 0) {
    S2('#7a5530'); g.moveTo(w * 0.4, -h * 0.3); g.lineTo(w * 0.7, -h * 1.05); g.stroke();
    S2('#ccc'); g.beginPath(); g.moveTo(w * 0.6, -h * 1.0); g.lineTo(w * 0.82, -h * 1.0); g.moveTo(w * 0.6, -h * 1.0); g.lineTo(w * 0.6, -h * 1.14); g.moveTo(w * 0.82, -h * 1.0); g.lineTo(w * 0.82, -h * 1.14); g.stroke();
  } else if (k === 1) {
    S2('#7a5530'); g.moveTo(w * 0.4, -h * 0.35); g.lineTo(w * 0.65, -h * 0.95); g.stroke();
    P('#ff9a30'); g.beginPath(); g.arc(w * 0.67, -h * 1.0, 6, 0, 7); g.fill();
  } else if (k === 3) { S2('#a0702a'); g.arc(w * 0.55, -h * 0.6, h * 0.28, -1.3, 1.3); g.stroke(); }
  else if (k === 5) {
    S2('#c9a227'); g.moveTo(w * 0.5, -h * 0.05); g.lineTo(w * 0.5, -h * 1.0); g.stroke();
    P('#ffe680'); g.beginPath(); g.arc(w * 0.5, -h * 1.06, 6, 0, 7); g.fill();
  } else if (k === 6) {
    P('#c89040'); g.beginPath(); g.ellipse(w * 0.45, -h * 0.4, w * 0.28, h * 0.11, 0, 0, 7); g.fill();
    P('#f0d8a0'); g.fillRect(w * 0.2, -h * 0.47, w * 0.5, 3);
    S2('#5a3a20'); g.beginPath(); g.moveTo(w * 0.3, -h * 0.65); g.lineTo(w * 0.5 + Math.sin(time * 12) * 4, -h * 0.5); g.stroke();
  } else if (k === 7) {
    P('#2a1a40'); g.fillRect(w * 0.25, -h * 0.62, w * 0.4, h * 0.16);
    g.fillStyle = e.cast > 0 ? '#e8c8ff' : '#9a6ad8'; g.fillRect(w * 0.3, -h * 0.6, w * 0.3, 3);
  } else if (k === 8) {
    P('#3a5ab0'); g.fillRect(w * 0.22, -h * 0.75, w * 0.42, h * 0.55);
    S2('#d8b050'); g.lineWidth = 2; g.strokeRect(w * 0.22, -h * 0.75, w * 0.42, h * 0.55);
    P('#d8b050'); g.fillRect(w * 0.4, -h * 0.65, 3, h * 0.35);
  } else {
    S2('#dfe6ee'); g.lineWidth = 4; g.moveTo(w * 0.4, -h * 0.5); g.lineTo(w * 0.9, -h * (0.95 + wk * 0.1)); g.stroke();
    if (k === 4) { P('#c9a227'); g.fillRect(w * 0.28, -h * 0.72, w * 0.3, h * 0.4); }
  }
  g.restore();
  drawStatus(e);
}

// 보호막 · 역할 아이콘 · 체력바 (좌우 반전 없이)
function drawStatus(e) {
  const sx = e.x - cam, cy = e.y - e.h / 2;
  if (e.shd > 0) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(120,190,255,${0.5 + 0.2 * Math.sin(time * 6)})`; g.lineWidth = 3;
    g.fillStyle = 'rgba(90,160,255,.12)';
    g.beginPath(); g.ellipse(sx, cy, e.w * 0.95 + 8, e.h * 0.62 + 6, 0, 0, 7); g.fill(); g.stroke();
    g.restore();
  }
  if (e.D.role) {
    g.font = '16px "Do Hyeon",sans-serif'; g.textAlign = 'center';
    g.fillStyle = '#000'; g.fillText(e.D.role[0], sx + 1, e.y - e.h - 13);
    g.fillStyle = e.D.role[1]; g.fillText(e.D.role[0], sx, e.y - e.h - 14);
    g.textAlign = 'left';
  }
  if (e.t !== 'boss' && e.hp < e.mh) {
    bar(sx - 18, e.y - e.h - 8, 36, 4, e.hp / e.mh, '#e04a4a');
    if (e.shd > 0) { g.fillStyle = '#8ac8ff'; g.fillRect(sx - 18, e.y - e.h - 11, 36 * cl(e.shd / e.mh, 0, 1), 2); }
  }
}

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function drawWisp(e) {
  const sx = e.x - cam, y = e.y - e.h / 2;
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(sx - e.dir * 12, y + 2, 16, '255,230,140', 0.35);
  glow(sx, y, 22, '255,240,170', 0.8);
  g.fillStyle = e.fl > 0 ? '#fff' : '#fff6d0';
  g.beginPath(); g.arc(sx, y, 6 + Math.sin(e.ph * 4), 0, 7); g.fill();
  g.restore();
  if (e.shd > 0) drawStatus(e);
}

function drawCrystal(e) {
  const sx = e.x - cam, y = e.y - 44 + Math.sin(time * 3 + e.ph) * 5;
  if (boss) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(140,230,255,${0.25 + 0.2 * Math.sin(time * 10 + e.ph)})`; g.lineWidth = 3;
    g.beginPath(); g.moveTo(sx, y); g.lineTo(boss.x - cam, boss.y - 85); g.stroke();
    g.restore();
  }
  g.save(); g.globalCompositeOperation = 'lighter'; glow(sx, y, 50, '120,220,255', 0.5); g.restore();
  g.fillStyle = e.fl > 0 ? '#fff' : '#7ae8ff';
  g.beginPath(); g.moveTo(sx, y - 34); g.lineTo(sx + 16, y); g.lineTo(sx, y + 34); g.lineTo(sx - 16, y); g.fill();
  g.fillStyle = '#e0faff'; g.beginPath(); g.moveTo(sx, y - 26); g.lineTo(sx + 6, y); g.lineTo(sx, y + 10); g.fill();
  bar(sx - 22, e.y - e.h - 12, 44, 5, e.hp / e.mh, '#7ae8ff');
}

// ----- 보스 -----
function drawBoss(e) {
  const sx = e.x - cam, f = e.fl > 0;
  const P = (c) => (g.fillStyle = f ? '#fff' : c), S2 = (c) => (g.strokeStyle = f ? '#fff' : c);
  if (e.pz >= 2) {
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(sx, e.y - 80, 140, e.pz >= 3 ? '255,80,60' : '255,200,80', 0.45);
    g.restore();
  }
  if (e.kind === 'pope' && e.sanct) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(255,230,140,${0.5 + 0.2 * Math.sin(time * 5)})`; g.lineWidth = 4; g.fillStyle = 'rgba(255,220,120,.10)';
    g.beginPath(); g.arc(sx, e.y - 85, 115, 0, 7); g.fill(); g.stroke();
    g.restore();
  } else if (e.inv > 0) {
    g.strokeStyle = '#ffffff88'; g.lineWidth = 3; g.beginPath(); g.arc(sx, e.y - 80, 95, 0, 7); g.stroke();
  }
  g.save(); g.translate(sx, e.y); g.scale(e.dir, 1);
  g.globalAlpha = e.alpha ?? 1;
  const b = Math.sin(e.ph) * 3;
  if (e.kind === 'hero') {
    P('#a01828'); g.beginPath(); g.moveTo(-10, -120 + b); g.lineTo(-64, -14); g.lineTo(-20, -8); g.fill();
    P('#c9a227'); g.fillRect(-30, -48, 22, 48); g.fillRect(6, -48, 22, 48); g.fillRect(-40, -108 + b, 80, 64);
    P('#fff4c0'); g.fillRect(-8, -95 + b, 16, 30);
    P('#e0c0a0'); g.beginPath(); g.arc(0, -124 + b, 20, 0, 7); g.fill();
    P('#c9a227'); g.beginPath(); g.arc(0, -128 + b, 22, Math.PI, 0); g.fill();
    P('#e01830'); g.fillRect(-4, -160 + b, 8, 18);
    g.fillStyle = e.tel ? '#ff3a3a' : '#2a60ff'; g.fillRect(6, -124 + b, 8, 6);
    S2('#e8f2ff'); g.lineWidth = 9; g.beginPath(); g.moveTo(40, -70 + b); g.lineTo(100, -165 + b); g.stroke();
    S2('#c9a227'); g.lineWidth = 6; g.beginPath(); g.moveTo(30, -78 + b); g.lineTo(54, -60 + b); g.stroke();
    if (e.act && e.act.k === 'wave' && e.tel) {
      g.fillStyle = '#bfe6ff'; g.globalAlpha = 0.6 + 0.4 * Math.sin(time * 40);
      g.beginPath(); g.arc(100, -165 + b, 10 + e.act.t * 30, 0, 7); g.fill();
    }
  } else {
    // 대주교: 후광, 흰 로브, 높은 관, 태양 지팡이
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = '#ffe680aa'; g.lineWidth = 4; g.beginPath(); g.arc(0, -150, 30, 0, 7); g.stroke();
    g.restore();
    P('#f4efe2'); g.beginPath(); g.moveTo(-30, -120); g.lineTo(30, -120); g.lineTo(46, 0); g.lineTo(-46, 0); g.fill();
    P('#c9a227'); g.fillRect(-8, -120, 16, 120); g.fillRect(-30, -122, 60, 8);
    P('#a01828'); g.fillRect(-4, -100, 8, 26); g.fillRect(-12, -92, 24, 8);
    P('#e0c0a0'); g.beginPath(); g.arc(0, -138, 17, 0, 7); g.fill();
    P('#f4efe2'); g.beginPath(); g.moveTo(-16, -146); g.lineTo(0, -190); g.lineTo(16, -146); g.fill();
    P('#c9a227'); g.fillRect(-2, -184, 4, 34); g.fillRect(-9, -172, 18, 4);
    g.fillStyle = e.tel ? '#ffe680' : '#3a2a20'; g.fillRect(4, -142, 7, 4);
    S2('#c9a227'); g.lineWidth = 5; g.beginPath(); g.moveTo(44, -10); g.lineTo(44, -170); g.stroke();
    P('#ffe680'); g.beginPath(); g.arc(44, -180, e.tel ? 14 + Math.sin(time * 30) * 3 : 11, 0, 7); g.fill();
  }
  g.restore();
  if (e.shd > 0) drawStatus(e);
}

// ----- 바닥 위험지대 (빛기둥) -----
function drawHazards() {
  for (const h of hz) {
    const x = h.x - cam;
    g.save();
    if (h.t < 0) {
      const k = 1 + h.t / 0.9;
      g.fillStyle = `rgba(255,60,60,${0.12 + 0.18 * k + 0.08 * Math.sin(time * 30)})`; g.fillRect(x - 34, 0, 68, GY);
      g.fillStyle = '#ff4a4a'; g.fillRect(x - 34, GY - 4, 68, 4);
    } else {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(0, 1 - h.t / 0.35);
      g.fillStyle = '#fff3b0'; g.fillRect(x - 34, 0, 68, GY);
      g.fillStyle = '#fff'; g.fillRect(x - 12, 0, 24, GY);
    }
    g.restore();
  }
}

// ----- 소환수 -----
function drawA(a) {
  g.save(); g.translate(a.x - cam, a.y);
  g.fillStyle = a.fl > 0 ? '#fff' : '#b06aff';
  if (a.t === 'bat') {
    const f = Math.sin(a.ph * 3) * 14;
    g.beginPath(); g.moveTo(0, -15); g.lineTo(-28, -15 - f); g.lineTo(-14, -4); g.moveTo(0, -15); g.lineTo(28, -15 - f); g.lineTo(14, -4); g.fill();
    g.beginPath(); g.arc(0, -14, 10, 0, 7); g.fill();
    g.fillStyle = '#ff3'; g.fillRect(-6, -17, 4, 4); g.fillRect(2, -17, 4, 4);
  } else {
    const ry = (a.h / 2) * (1 + Math.sin(a.ph * 2) * 0.1);
    g.beginPath(); g.ellipse(0, -ry, a.w / 2, ry, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.fillRect(-9, -a.h * 0.62, 8, 8); g.fillRect(3, -a.h * 0.62, 8, 8);
    g.fillStyle = '#d11'; g.fillRect(a.dir > 0 ? -4 : -9, -a.h * 0.58, 4, 4); g.fillRect(a.dir > 0 ? 8 : 3, -a.h * 0.58, 4, 4);
  }
  g.restore();
  if (a.hp < a.mh && a.life > 0) bar(a.x - cam - 18, a.y - (a.t === 'bat' ? 40 : a.h + 12), 36, 4, a.hp / a.mh, '#b06aff');
}

// ----- 플레이어 -----
function drawP() {
  let a, i;
  const t = time;
  if (p.st === 'dead') { a = FR.hurt; i = Math.min(5, (p.t / 0.22) | 0); }
  else if (p.st === 'hurt') { a = FR.hurt; i = 0; }
  else if (p.st === 'atk') { a = FR.atk; i = Math.min(4, (p.t / (0.055 / asm())) | 0); }
  else if (p.st === 'cast') { a = FR.cast; i = Math.min(5, (p.t / (0.085 / asm())) | 0); }
  else if (!p.g) { a = FR.walk; i = 2; }
  else if (Math.abs(p.vx) > 10) { a = FR.walk; i = ((t / 0.09) | 0) % a.length; }
  else { a = FR.idle; i = ((t / 0.5) | 0) % 2; }
  const f = a[i], sx = p.x - cam;
  g.save(); g.globalAlpha = 0.35; g.fillStyle = '#000'; g.beginPath(); g.ellipse(sx, p.y + 2, 26, 6, 0, 0, 7); g.fill(); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const k in p.b) glow(sx, p.y - 55, 80, hexRgb(BF[k][1]), 0.4);
  g.restore();
  g.save(); g.translate(sx, p.y); g.scale(p.face, 1);
  if (p.inv > 0 && p.st !== 'dead' && ((time * 20) | 0) % 2) g.globalAlpha = 0.45;
  g.drawImage(f.i, -f.ax, -f.ay, f.w, f.h);
  g.restore();
}

function bar(x, y, w, h, v, c) {
  g.fillStyle = '#000a'; g.fillRect(x, y, w, h);
  g.fillStyle = c; g.fillRect(x, y, w * cl(v, 0, 1), h);
  g.strokeStyle = '#fff6'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

// ----- 레벨업 연출 -----
function lvDraw() {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const r of rg) {
    if (r.t < 0) continue;
    const k = r.t / 0.9;
    g.strokeStyle = `rgba(255,216,74,${1 - k})`; g.lineWidth = 10 * (1 - k) + 2;
    g.beginPath(); g.arc(r.x - cam, r.y, k * 520, 0, 7); g.stroke();
  }
  for (const q of pt) { g.fillStyle = q.c; g.globalAlpha = Math.min(1, q.t * 2); g.fillRect(q.x - cam - 2, q.y - 2, 4, 4); }
  g.globalAlpha = 1;
  if (state === 'lvfx') {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#ffd84a00'); gr.addColorStop(0.5, `rgba(255,230,140,${0.6 * lt})`); gr.addColorStop(1, '#ffd84a00');
    g.fillStyle = gr;
    const bw = 60 * (1.2 - lt);
    g.fillRect(p.x - cam - bw / 2, 0, bw, H);
  }
  g.restore();
  if (lf > 0) { g.fillStyle = `rgba(255,240,200,${lf * 0.5})`; g.fillRect(0, 0, W, H); }
  if (state === 'lvfx') {
    g.textAlign = 'center'; g.font = '56px "Do Hyeon",sans-serif';
    g.fillStyle = '#000'; g.fillText('LEVEL UP!', W / 2 + 3, 203);
    g.fillStyle = '#ffd84a'; g.globalAlpha = Math.min(1, lt * 2); g.fillText('LEVEL UP!', W / 2, 200);
    g.globalAlpha = 1; g.textAlign = 'left';
  }
}

// ----- 전체 그리기 -----
function draw() {
  g.save();
  if (shake > 0) g.translate(rr(-4, 4) * shake * 4, rr(-4, 4) * shake * 4);
  bgd();
  // 드롭
  for (const d of dr) {
    const x = d.x - cam;
    if (d.k === 'g') {
      g.fillStyle = '#8a5a10'; g.beginPath(); g.arc(x, d.y, 6, 0, 7); g.fill();
      g.fillStyle = '#ffd24a'; g.beginPath(); g.ellipse(x, d.y, 5 * Math.abs(Math.cos(time * 5 + d.x)) + 1, 5, 0, 0, 7); g.fill();
      continue;
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    const c = d.k === 'xp' ? '#66aaff' : BF[d.b][1], r = d.k === 'xp' ? 6 : 10 + Math.sin(time * 8) * 2;
    glow(x, d.y, r * 2.2, hexRgb(c), 1);
    g.restore();
  }
  drawHazards();
  for (const e of en) drawE(e);
  for (const a of al) drawA(a);
  drawP();
  for (const o of pr) {
    const f = FR.orb[((o.a / 0.08) | 0) % 3], w = 56, h = (w * f.h) / f.w;
    g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(f.i, o.x - cam - w / 2, o.y - h / 2, w, h); g.restore();
  }
  // 적 탄환
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const o of eb) {
    const x = o.x - cam;
    if (o.gw) {
      g.fillStyle = '#ffb347'; g.beginPath(); g.ellipse(x, o.y, 16, 24, 0, 0, 7); g.fill();
      g.fillStyle = '#fff6d0'; g.beginPath(); g.ellipse(x, o.y + 4, 7, 14, 0, 0, 7); g.fill();
      continue;
    }
    const r = o.r || (o.ar ? 5 : 8);
    if (o.hm) glow(x, o.y, r * 2.4, '255,230,128', 0.5);
    g.fillStyle = o.c || (o.ar ? '#ffe9b0' : '#ffd84a'); g.beginPath(); g.arc(x, o.y, r, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, o.y, r * 0.4, 0, 7); g.fill();
  }
  // 퍼지는 원 (힐/버프/보호막 시전)
  for (const w of wv) {
    const k = w.t / 0.6;
    g.strokeStyle = w.c; g.globalAlpha = 1 - k; g.lineWidth = 4;
    g.beginPath(); g.arc(w.x - cam, w.y, w.r * k, 0, 7); g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
  for (const f of fx) {
    const im = f.a[Math.min(f.a.length - 1, (f.t / f.d) | 0)], w = f.hh ? (f.hh * im.w) / im.h : f.sz, h = f.hh || (w * im.h) / im.w;
    g.save(); g.translate(f.x - cam, f.y); if (f.f < 0) g.scale(-1, 1);
    g.globalCompositeOperation = im.n ? 'source-over' : 'lighter';
    g.drawImage(im.i, -w / 2, -h / 2, w, h); g.restore();
  }
  g.font = '18px "Do Hyeon",sans-serif'; g.textAlign = 'center';
  for (const t of tx) {
    g.globalAlpha = Math.min(1, t.t * 2);
    g.fillStyle = '#000'; g.fillText(t.s, t.x - cam + 1, t.y + 1);
    g.fillStyle = t.c; g.fillText(t.s, t.x - cam, t.y);
  }
  g.globalAlpha = 1;
  g.restore();
  hud();
  lvDraw();
}

function hud() {
  g.textAlign = 'left'; g.font = '16px "Do Hyeon",sans-serif'; g.fillStyle = '#fff';
  bar(16, 14, 220, 16, p.hp / T.maxhp, '#e0345a'); g.fillStyle = '#fff'; g.fillText(`HP ${Math.ceil(p.hp)}/${Math.round(T.maxhp)}`, 22, 27);
  bar(16, 36, 220, 10, xp / need, '#5ab4ff'); g.fillStyle = '#fff'; g.fillText(`Lv.${lvl}`, 244, 46);
  const c = stageDef();
  g.fillText(`${stageLabel()} ${c.n}${isBossStage() || portal ? '' : '  처치 ' + Math.min(kills, c.q) + '/' + c.q}`, 16, 68);
  bar(16, 80, 60, 6, 1 - Math.max(0, p.cd) / (MAG_CD * T.cdr), '#c88aff'); g.fillStyle = '#fff'; g.fillText('우클릭 마법', 82, 88);
  bar(16, 98, 60, 6, 1 - Math.max(0, p.sc) / (SCD * T.scd), '#6aff9a'); g.fillStyle = '#fff';
  g.fillText(`${kl(KB.sum)} 소환 ${p.sc > 0 ? Math.ceil(p.sc) + '초' : '준비'}  (${al.length}/${MAXA})`, 82, 106);
  let bx = 16;
  for (const k in p.b) { g.fillStyle = BF[k][1]; g.fillRect(bx, 116, 18, 18); g.fillStyle = '#fff'; g.fillText(Math.ceil(p.b[k]), bx + 22, 130); bx += 56; }
  // 골드 / 유물
  g.textAlign = 'right'; g.font = '20px "Do Hyeon",sans-serif'; g.fillStyle = '#ffd24a';
  g.fillText(`${gold} G`, W - 16, 30);
  if (relics.length) { g.font = '14px "Do Hyeon",sans-serif'; g.fillStyle = '#c88aff'; g.fillText(`유물 ${relics.length}개`, W - 16, 50); }
  g.textAlign = 'left';
  if (boss) {
    bar(W / 2 - 220, 16, 440, 14, boss.hp / boss.mh, '#a020c0');
    if (boss.shd > 0) { g.fillStyle = '#8ac8ff'; g.fillRect(W / 2 - 220, 31, 440 * cl(boss.shd / boss.mh, 0, 1), 3); }
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '16px "Do Hyeon",sans-serif';
    g.fillText(`${BOSS[boss.kind].n} · ${boss.pz}페이즈${boss.sanct ? ' · 성역(무적)' : ''}`, W / 2, 50);
    g.textAlign = 'left';
  }
  if (portal) {
    const px = portal.x - cam;
    if (px < 30 || px > W - 30) {
      g.textAlign = px < 30 ? 'left' : 'right'; g.fillStyle = '#b48aff'; g.font = '22px "Do Hyeon",sans-serif';
      g.fillText(px < 30 ? '◀ 포털' : '포털 ▶', px < 30 ? 16 : W - 16, GY - 60); g.textAlign = 'left';
    }
  }
  if (ban) {
    g.textAlign = 'center'; g.font = '36px "Do Hyeon",sans-serif'; g.globalAlpha = Math.min(1, ban.t);
    g.fillStyle = '#000'; g.fillText(ban.s, W / 2 + 2, 182);
    g.fillStyle = '#ffb347'; g.fillText(ban.s, W / 2, 180);
    g.globalAlpha = 1; g.textAlign = 'left';
  }
}
