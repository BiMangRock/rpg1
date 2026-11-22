// =====================================================================
//  매 프레임 갱신
// =====================================================================
function upd(dt) {
  time += dt;
  if (ban && (ban.t -= dt) <= 0) ban = null;
  updPlayer(dt);
  stageLogic(dt);
  updEnemies(dt);
  updSummons(dt);
  updProjectiles(dt);
  updDrops(dt);
  vfx(dt);
  if (winT > 0 && (winT -= dt) <= 0) win();
}

function updPlayer(dt) {
  if (p.st === 'dead') {
    p.t += dt; p.vx = 0;
    if (p.t > 1.6) over();
  } else {
    const d = (keys[KB.R] ? 1 : 0) - (keys[KB.L] ? 1 : 0);
    const sp = T.spd * (p.b.spd ? 1.4 : 1) * (p.st === 'atk' || p.st === 'cast' ? 0.45 : 1);
    p.cd -= dt; p.sc -= dt; p.inv -= dt; p.dn -= dt; p.frzCd -= dt;
    if (p.st === 'hurt') { p.t += dt; p.vx *= 0.92; if (p.t > 0.25) p.st = 'n'; }
    else { p.vx = d * sp; if (d && p.st === 'n') p.face = d; }
    // 꾹 누르고 있으면 연속 공격
    if (p.st === 'n') {
      if (keys[KB.atk] || mb[0]) atk(mb[0]);
      else if (keys[KB.mag] || mb[2]) cast();
      else if (keys[KB.sum]) sumCast();
    }
    if (p.st === 'atk') {
      p.t += dt;
      const f = p.t / (0.055 / asm());
      if (f >= 3 && !p.hit) { p.hit = 1; melee(); }
      if (f >= 5) p.st = 'n';
    }
    if (p.st === 'cast') {
      p.t += dt;
      const f = p.t / (0.085 / asm());
      if (f >= 4 && !p.fired) { p.fired = 1; p.kind === 'sum' ? summon() : shoot(); }
      if (f >= 6) p.st = 'n';
    }
    for (const k in p.b) if ((p.b[k] -= dt) <= 0) delete p.b[k];
  }
  // 물리 / 발판
  const py = p.y;
  p.vy += 1700 * dt; p.y += p.vy * dt;
  p.x = cl(p.x + p.vx * dt, 20, WW - 20);
  p.g = 0;
  if (p.y >= GY) { p.y = GY; p.vy = 0; p.g = 1; }
  else if (p.vy > 0 && p.dn <= 0)
    for (const q of pl) if (p.x > q.x && p.x < q.x + q.w && py <= q.y && p.y >= q.y) { p.y = q.y; p.vy = 0; p.g = 1; }
  if (p.g) p.jc = 0;
  cam += (cl(p.x - W / 2, 0, WW - W) - cam) * Math.min(1, dt * 6);
  camY += (cl(p.y - H * 0.62, 0, MH - H) - camY) * Math.min(1, dt * 6);
}

function stageLogic(dt) {
  if (isBossStage()) {
    if (!boss && !bdone && (bossT -= dt) <= 0) mkBoss();
    return;
  }
  const c = stageDef();
  if (kills >= c.q && !portal) openPortal();
  spt -= dt;
  const live = en.filter((e) => !e.D.minion).length;
  if (spt <= 0 && kills < c.q && live < 6 + Math.round(depth() * 0.6)) {
    spt = 1.1;
    // 플레이어와 적당히 떨어진 땅이나 발판 위에 등장
    const sp = spawnSpot(450, 1100) || spawnSpot(300, 99999);
    if (sp) spawn(pickR(c.pool), sp.x, { y: sp.y });
    else spawn(pickR(c.pool));
  }
}

function updProjectiles(dt) {
  // 플레이어 마법구체
  for (const o of pr) {
    o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt; o.a += dt;
    if (o.sw) {
      // 검기: 관통, 적마다 한 번씩
      for (const e of en)
        if (!e.dead && !o.hs.has(e) && Math.abs(o.x - e.x) < e.w / 2 + 30 && o.y > e.y - e.h - 30 && o.y < e.y + 10) { o.hs.add(e); hit(e, o.dmg, o.f * 160, o.crit, 'sw'); }
      if (o.life <= 0) o.dead = 1;
      continue;
    }
    for (const e of en)
      if (!o.dead && !e.dead && Math.abs(o.x - e.x) < e.w / 2 + 14 && o.y > e.y - e.h - 14 && o.y < e.y + 10) { o.dead = 1; boom(o.x, o.y, o.dmg, o.crit); }
    if ((o.life <= 0 || o.y >= GY - 4) && !o.dead) { o.dead = 1; boom(o.x, Math.min(o.y, GY - 4), o.dmg, o.crit); }
  }
  pr = pr.filter((o) => !o.dead);
  // 시체 폭발 (처치 다음 프레임에 터짐)
  const q = kq; kq = [];
  for (const b of q) {
    fx.push({ a: FR.exp, x: b.x, y: b.y, d: 0.06, sz: 170, f: 1, t: 0 });
    for (const e of en) if (!e.dead && Math.hypot(e.x - b.x, e.y - e.h / 2 - b.y) < 85 + e.w / 2) hit(e, dm() * T.kboom, (e.x > b.x ? 1 : -1) * 150, false, 'kb');
  }
  en = en.filter((e) => !e.dead);

  // 적 탄환 (gw: 땅 충격파, hm: 유도탄, ar: 화살)
  for (const o of eb) {
    if (o.hm) {
      const want = Math.atan2(p.y - 50 - o.y, p.x - o.x), now = Math.atan2(o.vy, o.vx);
      const da = ((want - now + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const na = now + cl(da, -o.hm * dt, o.hm * dt), s = Math.hypot(o.vx, o.vy);
      o.vx = Math.cos(na) * s; o.vy = Math.sin(na) * s;
    }
    o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt;
    const od = o.d || 14 + depth() * 1.3, orr = o.r || (o.ar ? 5 : 8);
    if (p.inv <= 0 && p.st !== 'dead' && (o.gw ? Math.abs(o.x - p.x) < 28 && p.y > GY - 46 : Math.hypot(o.x - p.x, o.y - p.y + 45) < orr + 18)) {
      if (!o.gw) o.life = 0;
      hurtP(od);
    }
    if (o.life > 0)
      for (const a of al)
        if (a.life > 0 && (o.gw ? Math.abs(o.x - a.x) < 28 && a.y > GY - 40 : Math.hypot(o.x - a.x, o.y - (a.y - a.h / 2)) < orr + a.w * 0.4)) {
          hurtA(a, od);
          if (!o.gw) { o.life = 0; break; }
        }
  }
  eb = eb.filter((o) => o.life > 0 && o.y < GY);

  // 빛기둥 (경고 후 내리꽂힘)
  for (const h of hz) {
    h.t += dt;
    if (h.t >= 0 && !h.hit) {
      h.hit = 1;
      shake = Math.max(shake, 0.2);
      if (Math.abs(p.x - h.x) < 36) hurtP(h.d);
      for (const a of al) if (Math.abs(a.x - h.x) < 36) hurtA(a, h.d);
    }
  }
  hz = hz.filter((h) => h.t < 0.35);
}

function updDrops(dt) {
  for (const d of dr) {
    const dx = p.x - d.x, dy = p.y - 45 - d.y, ds = Math.hypot(dx, dy) || 1;
    d.life -= dt;
    const vac = T.vac && portal && d.k !== 'b';
    if (vac || (ds < (d.k === 'b' ? 70 : 110) * T.mag && p.st !== 'dead')) {
      const sp = vac ? Math.max(900, ds * 2.5) : 420;
      d.x += (dx / ds) * sp * dt; d.y += (dy / ds) * sp * dt; d.vy = 0;
    }
    else {
      const py = d.y;
      d.vy += 900 * dt; d.y += d.vy * dt;
      let fl = GY - 8;
      if (d.vy > 0) for (const q of pl) if (d.x > q.x && d.x < q.x + q.w && py <= q.y - 8 && d.y >= q.y - 8) { fl = q.y - 8; break; }
      if (d.y > fl) { d.y = fl; d.vy = Math.abs(d.vy) > 80 ? -d.vy * 0.4 : 0; }
    }
    if (ds < 26) { d.life = 0; pick(d); }
  }
  dr = dr.filter((d) => d.life > 0);
}

function vfx(dt) {
  shake = Math.max(0, shake - dt);
  for (const f of fx) f.t += dt;
  fx = fx.filter((f) => f.t < f.a.length * f.d);
  for (const t of tx) { t.y -= 40 * dt; t.t -= dt; }
  tx = tx.filter((t) => t.t > 0);
  for (const q of pt) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; q.t -= dt; }
  pt = pt.filter((q) => q.t > 0);
  for (const r of rg) r.t += dt;
  rg = rg.filter((r) => r.t < 0.9);
  for (const z of zp) z.t += dt;
  zp = zp.filter((z) => z.t < 0.25);
  for (const w of wv) w.t += dt;
  wv = wv.filter((w) => w.t < 0.6);
  lf = Math.max(0, lf - dt * 1.2);
}
