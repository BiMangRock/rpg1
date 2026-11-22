// =====================================================================
//  그리기 — 배경, 적, 보스, 소환수, 플레이어, 이펙트, HUD
// =====================================================================

// 하늘·별·산 (화면 좌표, 시차 스크롤)
function sky() {
  const c = stageDef(), gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, c.a); gr.addColorStop(1, c.b);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const span = Math.max(1, MH - H), up = 1 - camY / span; // 0 = 바닥, 1 = 꼭대기
  g.fillStyle = '#ffffff22';
  for (let i = 0; i < 40; i++) {
    const x = (((i * 197.3 - cam * 0.03) % W) + W) % W, y = (((i * 89.7 + camY * 0.05) % H) + H) % H;
    g.fillRect(x, y, 2, 2);
  }
  g.fillStyle = '#ffffff14'; g.beginPath(); g.arc(740 - cam * 0.05, 110 + up * 40, 46, 0, 7); g.fill();
  const base = H - 70 + (span - camY) * 0.35;
  for (let L = 0; L < 3; L++) {
    g.fillStyle = `rgba(0,0,0,${0.18 + L * 0.16})`;
    const par = 0.15 + L * 0.2, hh = 130 + L * 40;
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 24) {
      const wx = x + cam * par;
      g.lineTo(x, base - hh * 0.45 - Math.abs(Math.sin(wx * 0.013 + L * 2) + Math.sin(wx * 0.031 + L)) * hh * 0.28);
    }
    g.lineTo(W, H); g.fill();
  }
}

// 땅·발판·포털 (월드 좌표, y는 translate로 처리)
function terrain() {
  const c = stageDef();
  g.fillStyle = '#120a18'; g.fillRect(0, GY, W, MH - GY + 60);
  g.fillStyle = c.e + '88'; g.fillRect(0, GY, W, 3);
  // 맵 양 끝 벽
  if (cam < 10) { g.fillStyle = '#0a0610'; g.fillRect(-cam - 40, 0, 40, MH); }
  if (cam > WW - W - 10) { g.fillStyle = '#0a0610'; g.fillRect(WW - cam, 0, 40, MH); }
  for (const q of pl) {
    const x = q.x - cam;
    if (x > W || x + q.w < 0 || q.y < camY - 20 || q.y > camY + H + 20) continue;
    g.fillStyle = '#2a1a34'; g.fillRect(x, q.y, q.w, 14);
    g.fillStyle = '#1a0f22'; g.fillRect(x + 4, q.y + 14, q.w - 8, 4);
    if (q.w > 300) { g.fillStyle = '#1a0f2299'; g.fillRect(x + 16, q.y + 14, 8, 26); g.fillRect(x + q.w - 24, q.y + 14, 8, 26); }
    g.fillStyle = c.e + 'aa'; g.fillRect(x, q.y, q.w, 3);
  }
  if (portal) {
    const x = portal.x - cam;
    g.save(); g.translate(x, portal.y - 70); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = `rgba(${120 + i * 30},80,255,.6)`; g.lineWidth = 4;
      g.beginPath(); g.ellipse(0, 0, 38 - i * 7, 66 - i * 11, time * (i % 2 ? 1 : -1) * 2, 0, 5); g.stroke();
    }
    g.fillStyle = '#8a5aff55'; g.beginPath(); g.ellipse(0, 0, 34, 62, 0, 0, 7); g.fill();
    g.restore();
  } else if (map && map.portal.y < GY - 50 && !isBossStage()) {
    // 포털 예정 자리 (닫힌 상태)
    const x = map.portal.x - cam;
    g.strokeStyle = '#8a5aff44'; g.lineWidth = 3; g.setLineDash([6, 6]);
    g.beginPath(); g.ellipse(x, map.portal.y - 70, 30, 56, 0, 0, 7); g.stroke(); g.setLineDash([]);
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
  if (sx < -200 || sx > W + 200 || e.y < camY - 100 || e.y - e.h > camY + H + 100) return;
  if (e.t === 'boss') return drawBoss(e);
  if (e.D.ai === 'wisp') return drawWisp(e);
  if (e.t === 'crystal') return drawCrystal(e);

  const f = e.fl > 0, h = e.h, w = e.w;
  const P = (c) => (g.fillStyle = f ? '#fff' : c), S2 = (c) => (g.strokeStyle = f ? '#fff' : c);
  // 회피 잔상
  if (e.ghost && e.ghost.t > 0) {
    g.fillStyle = `rgba(150,255,255,${e.ghost.t})`;
    g.fillRect(e.ghost.x - cam - w * 0.4, e.ghost.y - h, w * 0.8, h);
  }
  // 버프 / 시전 이펙트 (뒤쪽)
  g.save(); g.globalCompositeOperation = 'lighter';
  if (e.star) glow(sx, e.y - h * 0.5, h * (0.6 + e.star * 0.12), e.star >= 4 ? '255,90,60' : '255,200,60', 0.2 + e.star * 0.05 + 0.1 * Math.sin(time * 5));
  if (e.rg) glow(sx, e.y - h * 0.5, h * 0.8, '255,40,40', 0.35 + 0.15 * Math.sin(time * 15));
  if (e.bf > 0) glow(sx, e.y - h * 0.4, h * 0.8, '255,150,60', 0.35 + 0.15 * Math.sin(time * 12));
  if (e.cast > 0 && e.D.role) glow(sx, e.y - h * 0.6, 60, hexRgb(e.D.role[1]), e.cast);
  g.restore();

  if (esHas(e.t) && esDrawEnemy(e, sx)) { drawStatus(e); return; }
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
  else if (k === 9) { P('#7a1020'); g.beginPath(); g.moveTo(-w * 0.36, -h * 0.78); g.lineTo(-w * 0.1, -h * 1.12); g.lineTo(w * 0.36, -h * 0.8); g.fill(); g.fillStyle = '#ff4a4a'; g.fillRect(w * 0.04, -h * 0.9, w * 0.1, w * 0.08); P('#a01828'); g.fillRect(-w * 0.4, -h * 0.6, w * 0.8, 4); }
  else if (k === 10) {
    // 닌자: 검은 두건, 눈 틈, 붉은 머플러
    P('#14141c'); g.beginPath(); g.arc(0, -h * 0.87, w * 0.31, 0, 7); g.fill();
    g.fillStyle = '#e0c0a0'; g.fillRect(-w * 0.05, -h * 0.9, w * 0.32, w * 0.09);
    g.fillStyle = '#111'; g.fillRect(w * 0.12, -h * 0.9, w * 0.08, w * 0.06);
    P('#c01830'); g.fillRect(-w * 0.32, -h * 0.79, w * 0.64, 5);
    g.fillRect(-w * 0.32 - 14 - Math.sin(time * 14) * 3, -h * 0.79, 14, 4);
  }
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
  // ★ 몬스터: 용사의 갑옷 (금빛 견갑·투구 장식), 용사의 검 (빛나는 대검)
  if (e.af?.has('armor')) {
    P('#c9a227'); g.fillRect(-w * 0.48, -h * 0.78, w * 0.96, h * 0.08); g.fillRect(-w * 0.12, -h * 0.74, w * 0.24, h * 0.3);
    P('#e01830'); g.fillRect(-3, -h * 1.16, 6, h * 0.12);
  }
  if (e.af?.has('wave')) {
    S2('#e8f2ff'); g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.3, -h * 0.45); g.lineTo(w * 1.1, -h * 1.2); g.stroke();
    S2('#c9a227'); g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.2, -h * 0.52); g.lineTo(w * 0.5, -h * 0.4); g.stroke();
  }
  g.restore();
  drawStatus(e);
}

// 보호막 · 역할 아이콘 · 체력바 (좌우 반전 없이)
function drawStatus(e) {
  const sx = e.x - cam, cy = e.y - e.h / 2;
  g.save(); g.globalCompositeOperation = 'lighter';
  if (e.burnT > 0) glow(sx, cy + e.h * 0.2, e.w * 1.3, '255,110,30', 0.35 + 0.2 * Math.sin(time * 20 + e.ph));
  if (e.psnT > 0) glow(sx, cy, e.w * 1.1, '120,255,60', 0.12 * e.psnS);
  g.restore();
  if (e.frz > 0) {
    // 얼음 덩어리
    g.fillStyle = 'rgba(150,215,255,.45)'; g.fillRect(sx - e.w * 0.6, e.y - e.h - 4, e.w * 1.2, e.h + 4);
    g.strokeStyle = '#e0f6ff'; g.lineWidth = 2; g.strokeRect(sx - e.w * 0.6, e.y - e.h - 4, e.w * 1.2, e.h + 4);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(sx - e.w * 0.45, e.y - e.h + 2, 4, e.h * 0.5);
  }
  if (e.stn > 0) {
    g.font = '14px "Do Hyeon",sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffe680';
    richText('✦ 기절 ✦', sx + Math.sin(time * 10) * 4, e.y - e.h - 12); g.textAlign = 'left';
  }
  if (e.psnT > 0 && e.psnS > 1) {
    g.font = '13px "Do Hyeon",sans-serif'; g.textAlign = 'center'; g.fillStyle = '#9aff5a';
    richText('☠' + e.psnS, sx + e.w * 0.6 + 6, e.y - e.h + 4); g.textAlign = 'left';
  }
  // 별·특성·역할 표시는 머리 위에 띄우지 않고, 마우스를 올렸을 때 크게 보여줌 (hoverInfo)
  if (e.shd > 0) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(120,190,255,${0.5 + 0.2 * Math.sin(time * 6)})`; g.lineWidth = 3;
    g.fillStyle = 'rgba(90,160,255,.12)';
    g.beginPath(); g.ellipse(sx, cy, e.w * 0.95 + 8, e.h * 0.62 + 6, 0, 0, 7); g.fill(); g.stroke();
    g.restore();
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

// 정령 색: [꼬리 glow, 몸 glow, 핵]
const SPIRIT_COL = {
  fire: ['255,120,40', '255,150,60', '#ffd0a0'], water: ['80,160,255', '110,190,255', '#d0ecff'],
  wood: ['90,200,80', '120,220,100', '#d8ffc8'],
};
function drawWisp(e) {
  const sx = e.x - cam, y = e.y - e.h / 2, C = SPIRIT_COL[e.D.el] || ['255,230,140', '255,240,170', '#fff6d0'];
  const sz = e.D.el ? 1.25 : 1;
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(sx - e.dir * 12, y + 2, 16 * sz, C[0], 0.35);
  glow(sx, y, 22 * sz, C[1], 0.8);
  g.fillStyle = e.fl > 0 ? '#fff' : C[2];
  g.beginPath(); g.arc(sx, y, (6 + Math.sin(e.ph * 4)) * sz, 0, 7); g.fill();
  if (e.D.el === 'wood') { // 나뭇잎 두 장
    g.fillStyle = '#7ad06a';
    for (const d of [-1, 1]) { g.beginPath(); g.ellipse(sx + d * 9, y - 6, 6, 3, d * 0.6, 0, 7); g.fill(); }
  }
  g.restore();
  drawStatus(e);
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
  if (e.shd > 0 || e.slow > 0 || e.burnT > 0 || e.psnT > 0) drawStatus(e);
  if (e.slow > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(sx, e.y - 80, 120, '120,200,255', 0.3); g.restore(); }
}

// ----- 바닥 위험지대 (빛기둥) -----
function drawHazards() {
  for (const h of hz) {
    const x = h.x - cam;
    g.save();
    if (h.el === 'wood') {
      // 가시덩굴: 발밑 초록 경고 → 가시가 솟음
      if (h.t < 0) {
        g.fillStyle = `rgba(90,220,80,${0.35 + 0.25 * Math.sin(time * 30)})`; g.fillRect(x - 34, h.y - 6, 68, 6);
      } else {
        const k = Math.min(1, h.t / 0.08), a = Math.max(0, 1 - h.t / 0.35);
        g.globalAlpha = a; g.fillStyle = '#4a9a3a';
        for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 13 - 7, h.y); g.lineTo(x + i * 13, h.y - (90 - Math.abs(i) * 18) * k); g.lineTo(x + i * 13 + 7, h.y); g.fill(); }
      }
      g.restore();
      continue;
    }
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

// ----- 소환수 (소환 레벨에 따라 5단계 진화) -----
function drawA(a) {
  const w = a.w, h = a.h, f = a.fl > 0, t = a.ph;
  const P = (c) => (g.fillStyle = f ? '#fff' : c);
  g.save(); g.translate(a.x - cam, a.y); g.scale(a.dir, 1);
  const eye = (x, y, c, s = 4) => { g.fillStyle = c; g.fillRect(x, y, s, s); };
  const wings = (span, col, flap) => {
    P(col); const fl = Math.sin(t * flap) * h * 0.5;
    g.beginPath(); g.moveTo(0, -h * 0.6); g.lineTo(-span, -h * 0.6 - fl); g.lineTo(-span * 0.5, -h * 0.25); g.fill();
    g.beginPath(); g.moveTo(0, -h * 0.6); g.lineTo(span, -h * 0.6 - fl); g.lineTo(span * 0.5, -h * 0.25); g.fill();
  };
  switch (a.k) {
    case 'slime': {
      const ry = (h / 2) * (1 + Math.sin(t * 2) * 0.1);
      P('#b06aff'); g.beginPath(); g.ellipse(0, -ry, w / 2, ry, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.fillRect(-2, -h * 0.62, 8, 8); g.fillRect(8, -h * 0.62, 8, 8);
      eye(3, -h * 0.58, '#d11'); eye(12, -h * 0.58, '#d11'); break;
    }
    case 'bat': {
      wings(28, '#b06aff', 9);
      P('#b06aff'); g.beginPath(); g.arc(0, -h * 0.55, 10, 0, 7); g.fill();
      eye(-6, -h * 0.65, '#ff3'); eye(2, -h * 0.65, '#ff3'); break;
    }
    case 'skel': {
      const wk = Math.sin(t * 6) * 4;
      P('#e8e0d0'); g.fillRect(-8 + wk, -h * 0.35, 5, h * 0.35); g.fillRect(3 - wk, -h * 0.35, 5, h * 0.35);
      g.fillRect(-9, -h * 0.72, 18, h * 0.38);
      g.fillStyle = '#2a1a34'; for (let i = 0; i < 3; i++) g.fillRect(-7, -h * 0.66 + i * 6, 14, 2);
      P('#e8e0d0'); g.beginPath(); g.arc(0, -h * 0.84, 9, 0, 7); g.fill();
      eye(1, -h * 0.88, '#b06aff', 4);
      g.strokeStyle = '#c0c8d8'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -h * 0.5); g.lineTo(24, -h * 0.95); g.stroke(); break;
    }
    case 'crow': {
      g.save(); g.globalAlpha = 0.85; wings(30, '#2a2a4a', 10);
      P('#1a1a30'); g.beginPath(); g.ellipse(0, -h * 0.55, 13, 9, 0, 0, 7); g.fill();
      P('#e0a020'); g.beginPath(); g.moveTo(12, -h * 0.6); g.lineTo(22, -h * 0.55); g.lineTo(12, -h * 0.5); g.fill();
      g.restore(); eye(4, -h * 0.66, '#7ae8ff'); break;
    }
    case 'hound': {
      const wk = Math.sin(t * 9) * 5;
      g.save(); g.globalCompositeOperation = 'lighter'; glow(0, -h * 0.5, w * 0.8, '255,90,30', 0.35); g.restore();
      P('#3a1010'); g.fillRect(-w * 0.4 + wk, -h * 0.3, 6, h * 0.3); g.fillRect(w * 0.25 - wk, -h * 0.3, 6, h * 0.3);
      P('#5a1a14'); g.beginPath(); g.ellipse(0, -h * 0.5, w * 0.45, h * 0.28, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(w * 0.42, -h * 0.7, w * 0.2, h * 0.2, 0, 0, 7); g.fill();
      P('#ff7a2a'); g.beginPath(); g.moveTo(-w * 0.4, -h * 0.6); g.lineTo(-w * 0.65, -h * 0.9 - Math.sin(t * 12) * 5); g.lineTo(-w * 0.35, -h * 0.45); g.fill();
      eye(w * 0.45, -h * 0.78, '#ffd24a'); break;
    }
    case 'garg': {
      wings(32, '#6a6a7a', 6);
      P('#8a8a98'); g.beginPath(); g.ellipse(0, -h * 0.5, 14, 16, 0, 0, 7); g.fill();
      P('#6a6a7a'); g.beginPath(); g.moveTo(-8, -h * 0.85); g.lineTo(-4, -h * 1.05); g.lineTo(0, -h * 0.85); g.moveTo(4, -h * 0.85); g.lineTo(8, -h * 1.05); g.lineTo(10, -h * 0.82); g.fill();
      eye(3, -h * 0.66, '#c08aff', 5); break;
    }
    case 'knight': {
      const wk = Math.sin(t * 5) * 4;
      g.save(); g.globalCompositeOperation = 'lighter'; glow(0, -h * 0.5, w, '160,90,255', 0.25); g.restore();
      P('#1a1424'); g.fillRect(-w * 0.3 + wk, -h * 0.36, w * 0.22, h * 0.36); g.fillRect(w * 0.08 - wk, -h * 0.36, w * 0.22, h * 0.36);
      P('#2a2238'); g.fillRect(-w * 0.42, -h * 0.78, w * 0.84, h * 0.44);
      P('#7a3ac0'); g.fillRect(-w * 0.48, -h * 0.8, w * 0.96, 5);
      P('#2a2238'); g.fillRect(-w * 0.26, -h * 1.0, w * 0.52, h * 0.22);
      eye(-2, -h * 0.92, '#c08aff', 10);
      g.strokeStyle = '#9a7ae8'; g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.4, -h * 0.4); g.lineTo(w * 0.95, -h * 1.05); g.stroke(); break;
    }
    case 'wyvern': {
      wings(42, '#3a6a4a', 7);
      P('#4a8a5a'); g.beginPath(); g.ellipse(0, -h * 0.5, 22, 11, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(16, -h * 0.55); g.lineTo(34, -h * 0.7); g.lineTo(34, -h * 0.45); g.fill();
      g.beginPath(); g.moveTo(-18, -h * 0.5); g.lineTo(-38, -h * 0.35 + Math.sin(t * 4) * 5); g.lineTo(-18, -h * 0.4); g.fill();
      eye(26, -h * 0.66, '#ffd24a'); break;
    }
    case 'golem': {
      const wk = Math.sin(t * 3) * 3;
      g.save(); g.globalCompositeOperation = 'lighter'; glow(0, -h * 0.5, w, '140,80,255', 0.3); g.restore();
      P('#3a3448'); g.fillRect(-w * 0.35 + wk, -h * 0.3, w * 0.25, h * 0.3); g.fillRect(w * 0.1 - wk, -h * 0.3, w * 0.25, h * 0.3);
      P('#4a4458'); g.fillRect(-w * 0.45, -h * 0.82, w * 0.9, h * 0.54);
      g.fillRect(-w * 0.62, -h * 0.78, w * 0.2, h * 0.5); g.fillRect(w * 0.42, -h * 0.78, w * 0.2, h * 0.5);
      P('#4a4458'); g.fillRect(-w * 0.2, -h * 1.0, w * 0.4, h * 0.2);
      g.fillStyle = '#b06aff'; g.fillRect(-4, -h * 0.66, 8, h * 0.3); g.fillRect(-w * 0.2, -h * 0.54, w * 0.4, 5);
      eye(-6, -h * 0.94, '#e0b0ff', 5); eye(4, -h * 0.94, '#e0b0ff', 5); break;
    }
    case 'dragon': {
      g.save(); g.globalCompositeOperation = 'lighter'; glow(0, -h * 0.5, w * 0.7, '160,60,255', 0.3); g.restore();
      wings(58, '#2a1a3a', 5);
      P('#3a2448'); g.beginPath(); g.ellipse(0, -h * 0.5, 30, 15, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(22, -h * 0.6); g.lineTo(48, -h * 0.85); g.lineTo(54, -h * 0.6); g.lineTo(26, -h * 0.4); g.fill();
      g.beginPath(); g.moveTo(-26, -h * 0.5); g.lineTo(-56, -h * 0.3 + Math.sin(t * 3) * 6); g.lineTo(-26, -h * 0.38); g.fill();
      P('#c08aff'); g.beginPath(); g.moveTo(40, -h * 0.85); g.lineTo(36, -h * 1.05); g.lineTo(46, -h * 0.85); g.fill();
      eye(44, -h * 0.76, '#ff4aff', 5); break;
    }
  }
  g.restore();
  if (a.hp < a.mh && a.life > 0) bar(a.x - cam - 18, a.y - h - 12, 36, 4, a.hp / a.mh, '#b06aff');
}

// ----- 플레이어 -----
function drawP() {
  let a, i;
  const t = time;
  if (p.st === 'dead') { a = FR.hurt; i = Math.min(5, (p.t / 0.22) | 0); }
  else if (p.st === 'hurt') { a = FR.hurt; i = 0; }
  else if (p.dashT > 0 && FR.dash) { a = FR.dash; i = p.dashT > 0.15 ? 1 : 2; } // 돌진 베기
  else if (p.st === 'atk' && p.dashCd > 0.72 && FR.dash) { a = FR.dash; i = 3; }
  else if (p.st === 'atk') { a = FR.atk; i = Math.min(4, (p.t / (0.055 / asm())) | 0); }
  else if (p.st === 'slam') { a = FR.atk; i = 2; }
  else if (p.st === 'cast') { a = FR.cast; i = Math.min(5, (p.t / (0.085 / asm())) | 0); }
  else if (!p.g) { a = FR.walk; i = 2; }
  else if (Math.abs(p.vx) > 10) { a = FR.walk; i = ((t / 0.09) | 0) % a.length; }
  else { a = FR.idle; i = ((t / 0.5) | 0) % 2; }
  const f = a[i], sx = p.x - cam;
  g.save(); g.globalAlpha = 0.35; g.fillStyle = '#000'; g.beginPath(); g.ellipse(sx, p.y + 2, 26, 6, 0, 0, 7); g.fill(); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const k in p.b) glow(sx, p.y - 55, 80, hexRgb(BF[k][1]), 0.4);
  if (p.slowT > 0) glow(sx, p.y - 50, 70, '120,200,255', 0.45);
  if (p.burnT > 0) glow(sx, p.y - 40, 60, '255,110,30', 0.35 + 0.2 * Math.sin(time * 20));
  if (p.psnT > 0) glow(sx, p.y - 50, 60, '120,255,60', 0.1 * p.psnS);
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
function lvWorld() {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const r of rg) {
    if (r.t < 0) continue;
    const k = r.t / 0.9;
    g.strokeStyle = `rgba(255,216,74,${1 - k})`; g.lineWidth = 10 * (1 - k) + 2;
    g.beginPath(); g.arc(r.x - cam, r.y, k * 520, 0, 7); g.stroke();
  }
  for (const q of pt) { g.fillStyle = q.c; g.globalAlpha = Math.min(1, q.t * 2); g.fillRect(q.x - cam - 2, q.y - 2, 4, 4); }
  g.globalAlpha = 1;
  g.restore();
}

function lvDraw() {
  g.save(); g.globalCompositeOperation = 'lighter';
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
  sky();
  g.translate(0, -Math.round(camY)); // 여기부터 월드 좌표
  terrain();
  // 드롭
  for (const d of dr) {
    const x = d.x - cam;
    if (d.k === 'it') {
      // 장비: 등급 색으로 빛나는 상자
      const tc = ['255,255,255', '200,230,255', '220,160,255', '255,180,90'][ITEM[d.id].tier];
      g.save(); g.globalCompositeOperation = 'lighter'; glow(x, d.y, 30, tc, 0.7 + 0.2 * Math.sin(time * 6)); g.restore();
      if (!drawIcon(itemIcon(ITEM[d.id]), x, d.y - 4 + Math.sin(time * 4 + d.x) * 2, 30)) {
        g.fillStyle = `rgb(${tc})`; g.fillRect(x - 8, d.y - 8, 16, 16);
        g.fillStyle = '#1a0f22'; g.fillRect(x - 5, d.y - 5, 10, 10);
        g.fillStyle = `rgb(${tc})`; g.fillRect(x - 2, d.y - 2, 4, 4);
      }
      continue;
    }
    if (d.k === 'gm' || d.k === 'rl') {
      // 보석: 보석 색으로 빛나는 마름모 / 유물: 분홍빛
      const c = d.k === 'gm' ? GEM[d.id].c : '#ff8aa8', y = d.y - 6 + Math.sin(time * 4 + d.x) * 3;
      g.save(); g.globalCompositeOperation = 'lighter'; glow(x, y, 40, hexRgb(c), 0.8 + 0.2 * Math.sin(time * 6)); g.restore();
      if (!drawIcon(d.k === 'gm' ? 'gem_' + d.id : relicIcon(RELIC[d.id]), x, y, 30)) {
        g.fillStyle = c; g.beginPath(); g.moveTo(x, y - 13); g.lineTo(x + 10, y); g.lineTo(x, y + 13); g.lineTo(x - 10, y); g.fill();
        g.fillStyle = '#ffffffaa'; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 4, y - 2); g.lineTo(x - 4, y - 2); g.fill();
      }
      continue;
    }
    if (d.k === 'g') {
      g.fillStyle = '#8a5a10'; g.beginPath(); g.arc(x, d.y, 6, 0, 7); g.fill();
      g.fillStyle = '#ffd24a'; g.beginPath(); g.ellipse(x, d.y, 5 * Math.abs(Math.cos(time * 5 + d.x)) + 1, 5, 0, 0, 7); g.fill();
      continue;
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    const c = d.k === 'xp' ? '#66aaff' : BF[d.b][1], r = d.k === 'xp' ? 6 : 10 + Math.sin(time * 8) * 2;
    glow(x, d.y, r * 2.2, hexRgb(c), 1);
    g.restore();
    if (d.k !== 'xp') drawIcon('bf_' + d.b, x, d.y, 22);
  }
  drawHazards();
  for (const c of chests) {
    const x = c.x - cam, y = c.y;
    if (!c.open) { g.save(); g.globalCompositeOperation = 'lighter'; glow(x, y - 14, 46, '255,210,80', 0.3 + 0.1 * Math.sin(time * 4)); g.restore(); }
    g.fillStyle = '#6a3a14'; g.fillRect(x - 20, y - 24, 40, 24);
    g.fillStyle = '#c9a227'; g.fillRect(x - 20, y - 24, 40, 3); g.fillRect(x - 3, y - 18, 6, 8);
    if (c.open) { g.fillStyle = '#4a2a0e'; g.fillRect(x - 20, y - 36, 40, 10); }
    else {
      g.fillStyle = '#8a4a1a'; g.fillRect(x - 21, y - 32, 42, 9);
      if (Math.abs(p.x - c.x) < 60 && Math.abs(p.y - c.y) < 60) {
        g.font = '15px "Do Hyeon",sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffd24a';
        g.fillText(`${kl(KB.por)} 열기`, x, y - 44); g.textAlign = 'left';
      }
    }
  }
  esDrawCorpses();
  for (const e of en) drawE(e);
  for (const a of al) drawA(a);
  drawP();
  for (const o of pr) {
    if (o.rf || o.ab) {
      g.save(); g.globalCompositeOperation = 'lighter';
      glow(o.x - cam, o.y, (o.r || 6) * 2.6, hexRgb(o.c), 0.8);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(o.x - cam, o.y, (o.r || 6) * 0.5, 0, 7); g.fill();
      g.restore();
      continue;
    }
    if (o.sw) {
      // 검기: 초승달
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(o.x - cam, o.y); g.scale(o.f, 1);
      g.globalAlpha = Math.min(1, o.life * 4);
      g.strokeStyle = '#bfe6ff'; g.lineWidth = 7; g.beginPath(); g.arc(-20, 0, 46, -1.1, 1.1); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(-20, 0, 46, -0.9, 0.9); g.stroke();
      g.restore();
      continue;
    }
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
    if (o.sk) {
      g.save(); g.translate(x, o.y); g.rotate(time * 25); g.fillStyle = '#e8ecf4';
      for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -8); g.lineTo(3, 0); g.lineTo(-3, 0); g.fill(); }
      g.restore();
      continue;
    }
    const r = o.r || (o.ar ? 5 : 8);
    if (o.hm) glow(x, o.y, r * 2.4, '255,230,128', 0.5);
    g.fillStyle = o.c || (o.ar ? '#ffe9b0' : '#ffd84a'); g.beginPath(); g.arc(x, o.y, r, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, o.y, r * 0.4, 0, 7); g.fill();
  }
  // 연쇄 번개
  for (const z of zp) {
    g.strokeStyle = '#cfe8ff'; g.globalAlpha = 1 - z.t / 0.25; g.lineWidth = 3;
    g.beginPath(); g.moveTo(z.x1 - cam, z.y1);
    for (let i = 1; i < 6; i++) { const k = i / 6; g.lineTo(z.x1 + (z.x2 - z.x1) * k - cam + rr(-10, 10), z.y1 + (z.y2 - z.y1) * k + rr(-10, 10)); }
    g.lineTo(z.x2 - cam, z.y2); g.stroke();
  }
  g.globalAlpha = 1;
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
    g.fillStyle = t.c; richText(t.s, t.x - cam, t.y, 1);
  }
  g.globalAlpha = 1;
  lvWorld();
  g.restore();
  hud();
  hoverInfo();
  lvDraw();
}

// ----- 마우스를 올린 적 정보 (별 · 역할 · 특성) -----
function hoverEnemy() {
  if (!mon || (state !== 'play' && state !== 'pause' && state !== 'inv')) return null;
  const wx = msx + cam, wy = msy + camY;
  let best = null, bd = 1e9;
  for (const e of en) {
    if (e.dead || e.t === 'boss') continue;
    const pad = 10, top = e.t === 'crystal' ? e.y - 90 : e.y - e.h * (esHas(e.t) ? ES_SCALE : 1);
    if (Math.abs(wx - e.x) > e.w / 2 + pad || wy < top - pad || wy > e.y + pad) continue;
    const d = Math.abs(wx - e.x) + Math.abs(wy - (e.y - e.h / 2)) * 0.5;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function hoverInfo() {
  const e = hoverEnemy();
  if (!e) return;
  const sx = e.x - cam, top = e.y - e.h * (esHas(e.t) ? ES_SCALE : 1) - camY;
  // 대상 표시 (발밑 링)
  g.save(); g.strokeStyle = e.star >= 4 ? '#ff7a4a' : e.star ? '#ffd24a' : '#ffffffaa'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(sx, e.y - camY + 2, e.w * 0.75, 8, 0, 0, 7); g.stroke(); g.restore();
  // 내용
  const name = ENAME[e.t] || e.t, role = e.D.role;
  const af = e.af?.size ? [...e.af].map((a) => AFFIX[a]) : [];
  const rows = []; // 특성은 한 줄에 3개씩
  for (let i = 0; i < af.length; i += 3) rows.push(af.slice(i, i + 3).join(' · '));
  g.font = '22px "Do Hyeon",sans-serif';
  const nw = g.measureText(name).width + (role ? 40 : 0);
  g.font = '16px "Do Hyeon",sans-serif';
  const aw = Math.max(0, ...rows.map((r) => g.measureText(r).width));
  const ss = 26, sw = e.star ? e.star * (ss - 2) : 0;
  const bw = Math.max(nw, aw, sw, 120) + 28;
  const bh = 14 + 30 + (e.star ? ss + 6 : 0) + 22 + rows.length * 21 + 10;
  const bx = cl(sx - bw / 2, 8, W - bw - 8);
  let by = top - bh - 14; if (by < 8) by = Math.min(H - bh - 8, e.y - camY + 16);
  g.save();
  g.fillStyle = 'rgba(14,8,20,.92)'; g.fillRect(bx, by, bw, bh);
  g.strokeStyle = e.star >= 4 ? '#ff7a4a' : e.star ? '#ffd24a' : role ? role[1] : '#8a6aa8'; g.lineWidth = 2;
  g.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
  g.textAlign = 'center';
  let y = by + 14;
  // 이름 + 역할 아이콘 (크게)
  g.font = '22px "Do Hyeon",sans-serif';
  const tw = g.measureText(name).width, cx = bx + bw / 2 + (role ? 18 : 0);
  if (role && !drawIcon(EMO[role[0]], cx - tw / 2 - 22, y + 11, 32)) { g.fillStyle = role[1]; g.fillText(role[0], cx - tw / 2 - 22, y + 19); }
  g.fillStyle = role ? role[1] : '#fff'; g.fillText(name, cx, y + 20);
  y += 30;
  if (e.star) {
    if (e.star >= 4) { g.save(); g.globalCompositeOperation = 'lighter'; glow(bx + bw / 2, y + ss / 2, sw * 0.7, '255,90,40', 0.35); g.restore(); }
    for (let i = 0; i < e.star; i++) drawIcon('st_star', bx + bw / 2 + (i - (e.star - 1) / 2) * (ss - 2), y + ss / 2, ss);
    y += ss + 6;
  }
  g.font = '15px "Do Hyeon",sans-serif'; g.fillStyle = '#ffffffcc';
  g.fillText(`HP ${Math.ceil(e.hp)} / ${Math.round(Math.max(e.mh, e.hp))}`, bx + bw / 2, y + 14);
  y += 22;
  g.font = '16px "Do Hyeon",sans-serif'; g.fillStyle = '#ffe0a0';
  for (const r of rows) { g.fillText(r, bx + bw / 2, y + 14); y += 21; }
  g.restore();
}

function hud() {
  g.textAlign = 'left'; g.font = '16px "Do Hyeon",sans-serif'; g.fillStyle = '#fff';
  bar(16, 14, 220, 16, p.hp / T.maxhp, '#e0345a'); g.fillStyle = '#fff'; g.fillText(`HP ${Math.ceil(p.hp)}/${Math.round(T.maxhp)}`, 22, 27);
  bar(16, 36, 220, 10, xp / need, '#5ab4ff'); g.fillStyle = '#fff'; g.fillText(`Lv.${lvl}`, 244, 46);
  const c = stageDef();
  g.fillText(`${stageLabel()} ${c.n}${isBossStage() || portal ? '' : '  처치 ' + Math.min(kills, c.q) + '/' + c.q}`, 16, 68);
  bar(16, 80, 60, 6, 1 - Math.max(0, p.cd) / (MAG_CD * T.cdr), '#c88aff'); g.fillStyle = '#fff'; g.fillText('우클릭 마법', 82, 88);
  bar(16, 98, 60, 6, 1 - Math.max(0, p.sc) / (SCD * T.scd), '#6aff9a'); g.fillStyle = '#fff';
  g.fillText(`${kl(KB.sum)} 소환 ${p.sc > 0 ? Math.ceil(p.sc) + '초' : '준비'}  (${al.length}/${Math.round(T.smax)}) · 소환 Lv.${summonLv()} ${sumDef(0).n}`, 82, 106);
  if (p.combo > 1) {
    g.font = '28px "Do Hyeon",sans-serif'; g.textAlign = 'center';
    g.fillStyle = '#000'; g.fillText(`${p.combo} COMBO`, W / 2 + 2, H - 78);
    g.fillStyle = p.combo % 3 === 2 ? '#ffd24a' : '#fff'; g.fillText(`${p.combo} COMBO`, W / 2, H - 80);
    g.font = '13px "Do Hyeon",sans-serif'; g.fillStyle = '#ffffffaa';
    g.fillText(`검 피해 +${Math.min(100, (p.combo - 1) * 10)}%${p.combo % 3 === 2 ? ' · 다음 타격 강타!' : ''}`, W / 2, H - 62);
    g.textAlign = 'left';
  }
  g.font = '16px "Do Hyeon",sans-serif';
  g.font = '13px "Do Hyeon",sans-serif'; g.fillStyle = '#ffffff99'; g.fillText(`${kl(KB.inv)} 장비창 · Esc 일시정지`, 16, H - 12);
  g.font = '16px "Do Hyeon",sans-serif'; g.fillStyle = '#fff';
  // 상태이상 표시
  const sts = [];
  if (p.slowT > 0) sts.push(['❄ 둔화', '#9ad8ff']);
  if (p.burnT > 0) sts.push(['🔥 화상', '#ff9a40']);
  if (p.psnT > 0) sts.push([`☠ 독 ${p.psnS}`, '#9aff5a']);
  if (stk.slaughter && worn('slaughter')) sts.push([`연쇄 ${stk.slaughter}`, '#ffb070']);
  sts.forEach(([t, c], i) => { g.fillStyle = c; richText(t, 244 + i * 70, 27); });
  g.fillStyle = '#fff';
  let bx = 16;
  for (const k in p.b) {
    if (!drawIcon('bf_' + k, bx + 11, 125, 24)) { g.fillStyle = BF[k][1]; g.fillRect(bx, 116, 18, 18); }
    g.fillStyle = '#fff'; g.fillText(Math.ceil(p.b[k]), bx + 26, 130); bx += 60;
  }
  // 골드 / 유물
  g.textAlign = 'right'; g.font = '20px "Do Hyeon",sans-serif'; g.fillStyle = '#ffd24a';
  g.fillText(`${gold} G`, W - 16, 30);
  drawIcon('ui_gold', W - 30 - g.measureText(`${gold} G`).width, 23, 26);
  g.font = '14px "Do Hyeon",sans-serif';
  const rg2 = [relics.length ? `유물 ${relics.length}개` : '', gems.length ? `보석 ${gems.length}/${GEMS.length}` : ''].filter(Boolean).join(' · ');
  if (rg2) { g.fillStyle = gemAll() ? '#ffd24a' : '#c88aff'; g.fillText(rg2, W - 16, 50); }
  g.fillStyle = '#8ae0ffaa'; g.fillText(`영혼석 +${Math.floor(runXp * SOUL_RATE)}`, W - 16, H - 12);
  g.textAlign = 'left';
  if (!boss) minimap();
  if (boss) {
    bar(W / 2 - 220, 16, 440, 14, boss.hp / boss.mh, '#a020c0');
    if (boss.shd > 0) { g.fillStyle = '#8ac8ff'; g.fillRect(W / 2 - 220, 31, 440 * cl(boss.shd / boss.mh, 0, 1), 3); }
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '16px "Do Hyeon",sans-serif';
    g.fillText(`${BOSS[boss.kind].n} · ${boss.pz}페이즈${boss.sanct ? ' · 성역(무적)' : ''}`, W / 2, 50);
    g.textAlign = 'left';
  }
  if (portal) {
    // 화면 밖 포털 방향 표시
    const px = portal.x - cam, py = portal.y - 70 - camY;
    if (px < 30 || px > W - 30 || py < 20 || py > H - 20) {
      const ang = Math.atan2(py - H / 2, px - W / 2);
      const ex = cl(px, 60, W - 60), ey = cl(py, 150, H - 40);
      g.save(); g.translate(ex, ey);
      g.fillStyle = '#b48aff'; g.font = '20px "Do Hyeon",sans-serif'; g.textAlign = 'center';
      g.fillText('포털', 0, -18);
      g.rotate(ang); g.beginPath(); g.moveTo(16, 0); g.lineTo(-6, -10); g.lineTo(-6, 10); g.fill();
      g.restore(); g.textAlign = 'left';
    }
  }
  if (ban) {
    g.textAlign = 'center'; g.font = '36px "Do Hyeon",sans-serif'; g.globalAlpha = Math.min(1, ban.t);
    g.fillStyle = '#000'; g.fillText(ban.s, W / 2 + 2, 182);
    g.fillStyle = '#ffb347'; g.fillText(ban.s, W / 2, 180);
    g.globalAlpha = 1; g.textAlign = 'left';
  }
}

// ----- 미니맵 (오른쪽 위): 발판, 적(★은 금색), 포털, 보물상자, 화면 범위 -----
function minimap() {
  const BW = 190, BH = 120, sc = Math.min(BW / WW, BH / MH);
  const mw = WW * sc, mh = MH * sc, x0 = W - 16 - mw, y0 = 60;
  const X = (x) => x0 + x * sc, Y = (y) => y0 + y * sc;
  g.fillStyle = 'rgba(10,6,16,.72)'; g.fillRect(x0 - 4, y0 - 4, mw + 8, mh + 8);
  g.strokeStyle = '#ffffff33'; g.lineWidth = 1; g.strokeRect(x0 - 3.5, y0 - 3.5, mw + 7, mh + 7);
  // 땅 / 발판
  g.fillStyle = stageDef().e + '99';
  g.fillRect(x0, Y(GY), mw, 2);
  for (const q of pl) g.fillRect(X(q.x), Y(q.y), Math.max(2, q.w * sc), 1.5);
  // 화면 범위
  g.strokeStyle = '#ffffff55'; g.strokeRect(X(cam) + 0.5, Y(camY) + 0.5, W * sc, H * sc);
  // 보물상자
  for (const c of chests) if (!c.open) { g.fillStyle = '#ffd24a'; g.fillRect(X(c.x) - 2, Y(c.y) - 4, 5, 4); }
  // 포털 (열리기 전엔 흐리게)
  const pp = portal || map.portal;
  g.fillStyle = portal ? `rgba(180,130,255,${0.7 + 0.3 * Math.sin(time * 6)})` : '#8a5aff55';
  g.beginPath(); g.ellipse(X(pp.x), Y(pp.y - 30), 3, 5, 0, 0, 7); g.fill();
  // 적
  for (const e of en) {
    if (e.star) { g.fillStyle = e.star >= 4 ? '#ff7a4a' : '#ffd24a'; g.fillRect(X(e.x) - 2, Y(e.y - e.h / 2) - 2, 4, 4); }
    else { g.fillStyle = '#ff5a6a'; g.fillRect(X(e.x) - 1, Y(e.y - e.h / 2) - 1, 2, 2); }
  }
  // 소환수 / 플레이어
  g.fillStyle = '#b06aff'; for (const a of al) g.fillRect(X(a.x) - 1, Y(a.y - 10) - 1, 2, 2);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(X(p.x), Y(p.y - 40), 2.6, 0, 7); g.fill();
}
