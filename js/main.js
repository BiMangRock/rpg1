// =====================================================================
//  입력 · 게임 루프 · 시작
// =====================================================================
onkeydown = (e) => {
  const k = e.code;
  if (wait) {
    e.preventDefault();
    if (k !== 'Escape') {
      for (const o in KB) if (KB[o] === k && o !== wait) KB[o] = KB[wait];
      KB[wait] = k;
      try { localStorage.setItem('maou_kb2', JSON.stringify(KB)); } catch (x) {}
    }
    wait = null; ks(); return;
  }
  if (/Arrow|Space/.test(k) || Object.values(KB).includes(k)) e.preventDefault();
  keys[k] = 1;
  if (e.repeat) return;
  if (k === 'Escape') { if (state === 'play') pauseM(); else if (state === 'pause' || state === 'inv') resume(); return; }
  if (k === KB.inv && (state === 'play' || state === 'inv')) { state === 'inv' ? resume() : invMenu(); return; }
  if (state === 'lvl' && /Digit[123]/.test(k)) return pickUp(+k[5] - 1);
  if (state === 'relic' && /Digit[123]/.test(k)) return pickRelic(+k[5] - 1);
  if (state === 'shop' && (k === 'Enter' || k === 'NumpadEnter')) return nextStage();
  if (state !== 'play' || p.st === 'dead') return;
  if (k === KB.jmp) jump();
  // S(아래): 발판 위에서 누르면 아래로 내려감
  if (k === KB.dn && p.g && p.y < GY) { p.dn = 0.3; p.y += 4; p.g = 0; }
  if (k === KB.atk) atk();
  if (k === KB.mag) cast();
  if (k === KB.sum) { if (p.sc > 0) txt(p.x, p.y - 110, '소환 대기 ' + p.sc.toFixed(1) + '초', '#9a8aaa'); else sumCast(); }
  if (k === KB.por) {
    const c = chests.find((c) => !c.open && Math.abs(p.x - c.x) < 60 && Math.abs(p.y - c.y) < 60);
    if (c) openChest(c); else enter();
  }
};
onkeyup = (e) => (keys[e.code] = 0);
onblur = () => { for (const k in keys) keys[k] = 0; mb = {}; };

cv.onmousemove = (e) => {
  const r = cv.getBoundingClientRect();
  msx = ((e.clientX - r.left) / r.width) * W;
  msy = ((e.clientY - r.top) / r.height) * H;
  mon = 1;
};
cv.onmousedown = (e) => {
  e.preventDefault();
  cv.onmousemove(e);
  mb[e.button] = 1;
  if (state !== 'play' || p.st === 'dead') return;
  if (e.button === 0) atk(1);
  else if (e.button === 2) cast();
};
onmouseup = (e) => (mb[e.button] = 0);
cv.oncontextmenu = (e) => e.preventDefault();

function load(cb) {
  let n = 0, t = 0;
  const done = () => { if (++n === t) cb(); };
  for (const k in FR)
    for (const f of FR[k]) {
      t++;
      f.i = new Image();
      f.i.onload = done;
      f.i.onerror = () => { console.warn('이미지 로드 실패:', f.s); done(); };
      f.i.src = f.s;
    }
}

let last = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.033, (ts - last) / 1000 || 0);
  last = ts;
  try {
    if (state === 'play') upd(dt);
    else if (state === 'lvfx') { vfx(dt); lt -= dt; if (lt <= 0) menu(); }
    if (p) draw();
  } catch (e) {
    console.error(e);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
}

load(() => { newRun(); title(); requestAnimationFrame(loop); });
