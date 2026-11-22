// =====================================================================
//  전투 — 플레이어 행동, 피해 처리, 소환, 드롭, 레벨업
// =====================================================================
const asm = () => T.as * (p.b.haste ? 1.5 : 1);
const dm = () => T.atk * (p.b.atk ? 1.6 : 1);
const rollCrit = () => R() < T.crit;
const heal = (v) => { p.hp = Math.min(T.maxhp, p.hp + v); };

function txt(x, y, s, c) { tx.push({ x, y, s, c, t: 0.9 }); }
function wave(x, y, c, r) { wv.push({ x, y, c, r: r || 120, t: 0 }); }

// ----- 적 생성 -----
function spawn(type, x, opt) {
  const D = ENEMY[type], L = depth(), m = 1 + L * 0.35 + lvl * 0.06;
  const e = {
    t: type, D, x: x ?? cl(p.x + (R() < 0.5 ? -1 : 1) * (W / 2 + 60), 30, WW - 30), y: GY,
    kx: 0, fl: 0, ph: R() * 6, dir: 1, w: D.w, h: D.h, sp: D.sp * rr(0.85, 1.15),
    dmg: (8 + L * 2.5) * D.dm, hp: D.hp * m, sh: rr(1, 2), ac: 0, cd: rr(1.5, D.cd || 2),
    shd: 0, shdT: 0, bf: 0, cast: 0,
  };
  if (D.fly) e.y = GY - rr(90, 170);
  Object.assign(e, opt);
  e.mh = e.hp;
  en.push(e);
  return e;
}

// ----- 플레이어 공격 -----
function melee() {
  const x = p.x + p.face * 50;
  fx.push({ a: FR.slash, x: p.x + p.face * 55, y: p.y - 58, d: 0.06, sz: 150, hh: 120, f: -p.face, t: 0 });
  let dealt = 0;
  for (const e of en)
    if (!e.dead && Math.abs(e.x - x) < 75 + e.w / 2 && e.y > p.y - 130 && e.y - e.h < p.y) dealt += hit(e, dm(), p.face * 260, rollCrit());
  if (T.vamp && dealt > 0) heal(dealt * T.vamp);
}

function shoot() {
  const n = 1 + T.multi, x = p.x + p.face * 48, y = p.y - 62;
  const b = p.am ? Math.atan2(p.am.y - y, p.am.x - x) : p.face > 0 ? 0 : Math.PI;
  fx.push({ a: [FR.flash[0]], x, y, d: 0.15, sz: 80, f: p.face, t: 0 });
  for (let i = 0; i < n; i++) {
    const a = b + (i - (n - 1) / 2) * 0.2;
    pr.push({ x, y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 1.3, a: 0, dmg: dm() * 5 * T.mp, crit: rollCrit() });
  }
  p.cd = MAG_CD * T.cdr;
}

function boom(x, y, d, crit) {
  const r = 90 * T.area;
  fx.push({ a: FR.exp, x, y, d: 0.07, sz: r * 2, f: 1, t: 0 });
  shake = Math.max(shake, 0.12);
  for (const e of en) if (Math.hypot(e.x - x, e.y - e.h / 2 - y) < r + e.w / 2) hit(e, d, (e.x > x ? 1 : -1) * 200, crit);
}

// ----- 적에게 피해 (실제로 깎인 HP 반환) -----
function hit(e, d, k, crit) {
  if (e.dead) return 0;
  if (e.inv > 0) { if (R() < 0.15) txt(e.x, e.y - e.h - 6, e.sanct ? '성역' : '무적', '#ffe08a'); return 0; }
  if (crit) d *= 2;
  if (e.shd > 0) {
    const a = Math.min(e.shd, d);
    e.shd -= a; d -= a; e.fl = 0.08;
    if (R() < 0.3) txt(e.x, e.y - e.h - 22, '보호막', '#8ac8ff');
    if (d <= 0) return 0;
  }
  e.hp -= d; e.fl = 0.12;
  if (e.t !== 'boss' && e.D.ai !== 'crystal') e.kx += k;
  txt(e.x, e.y - e.h - 6, Math.round(d) + (crit ? '!' : ''), crit ? '#ffd84a' : '#fff');
  if (e.hp <= 0) { e.dead = 1; kill(e); }
  return d;
}

function kill(e) {
  fx.push({ a: [FR.exp[1], FR.exp[2], FR.exp[3]], x: e.x, y: e.y - e.h / 2, d: 0.08, sz: e.w * 1.6, f: 1, t: 0 });
  if (e.t === 'boss') return bossDown(e);
  if (T.ls) heal(T.ls);
  if (!e.D.minion && e.D.ai !== 'crystal') kills++;
  if (e.D.xp) dr.push({ k: 'xp', v: e.D.xp, x: e.x, y: e.y - e.h / 2, vy: -200, life: 1e9 });
  if (e.D.gold) dropGold(e.x, e.y - e.h / 2, e.D.gold);
  if (!e.D.minion && R() < 0.15) dr.push({ k: 'b', b: pickR(Object.keys(BF)), x: e.x, y: e.y - e.h / 2, vy: -300, life: 12 });
}

function dropGold(x, y, v, spread) {
  v = Math.max(1, Math.round(v * rr(0.8, 1.25) * T.gold));
  while (v > 0) {
    const c = Math.min(spread ? 15 : 5, v);
    v -= c;
    dr.push({ k: 'g', v: c, x: x + (spread ? rr(-80, 80) : rr(-10, 10)), y, vy: spread ? rr(-600, -250) : rr(-320, -200), life: 1e9 });
  }
}

// ----- 플레이어 피격 -----
function hurtP(d) {
  if (p.inv > 0 || p.st === 'dead') return;
  d *= (p.b.guard ? 0.4 : 1) * (1 - T.dr);
  p.hp -= d; p.inv = 1;
  txt(p.x, p.y - 100, Math.round(d), '#ff4a6a');
  shake = 0.25;
  if (p.hp <= 0) {
    if (T.revive > 0 && !p.revUsed) {
      p.revUsed = 1; p.hp = T.maxhp * 0.5; p.inv = 2.5; shake = 0.6;
      txt(p.x, p.y - 125, '불사의 심장 — 부활!', '#ff8aa8');
      wave(p.x, p.y - 50, '#ff4a6a', 320);
      return;
    }
    p.hp = 0; p.st = 'dead'; p.t = 0;
    return;
  }
  p.st = 'hurt'; p.t = 0; p.vy = -250; p.vx = -p.face * 160;
}

// ----- 소환수 -----
function hurtA(a, d) {
  if (a.life <= 0 || a.iv > 0) return;
  a.hp -= d; a.iv = 0.25; a.fl = 0.12;
  txt(a.x, a.y - a.h - 8, Math.round(d), '#d8a0ff');
  if (a.hp <= 0) {
    a.life = 0;
    fx.push({ a: [FR.exp[1], FR.exp[2], FR.exp[3]], x: a.x, y: a.y - a.h / 2, d: 0.07, sz: 70, f: 1, t: 0 });
  }
}

function sumCast() {
  if (p.st === 'n' && p.sc <= 0) { p.st = 'cast'; p.t = 0; p.fired = 0; p.kind = 'sum'; p.am = null; }
}

// 시간이 지나도 사라지지 않음. 꽉 찼으면 새로 만들지 않고 기존 소환수 체력 회복.
function summon() {
  p.sc = SCD * T.scd;
  const sn = Math.round(T.sn), nw = Math.min(sn, MAXA - al.length);
  if (nw < sn) { for (const a of al) a.hp = a.mh; txt(p.x, p.y - 135, '소환수 회복!', '#9aff9a'); }
  const b0 = al.length;
  for (let i = 0; i < nw; i++) {
    const bat = (b0 + i) % 2, o = (i - (nw - 1) / 2) * 40, x = p.x + o * 1.2, y = bat ? p.y - 80 : GY;
    const mh = (bat ? 30 : 55) * T.sm * (1 + depth() * 0.2);
    al.push({ t: bat ? 'bat' : 'slime', x, y, w: bat ? 36 : 40, h: bat ? 26 : 32, sp: bat ? 150 : 120, life: 1, ph: R() * 6,
              dir: p.face, cd: 0, o, hp: mh, mh, iv: 0, fl: 0 });
    fx.push({ a: [FR.exp[1], FR.exp[2]], x, y: y - 16, d: 0.08, sz: 80, f: 1, t: 0 });
  }
  al.forEach((a, i) => (a.o = (i - (al.length - 1) / 2) * 30));
  txt(p.x, p.y - 110, '소환!', '#c88aff');
  shake = 0.15;
}

// ----- 플레이어 입력 동작 -----
function atk(m) {
  if (p.st !== 'n') return;
  if (m && mon) p.face = msx + cam > p.x ? 1 : -1;
  p.st = 'atk'; p.t = 0; p.hit = 0;
}

function cast() {
  if (p.st !== 'n' || p.cd > 0) return;
  p.st = 'cast'; p.t = 0; p.fired = 0; p.kind = 'mag';
  p.am = mon ? { x: msx + cam, y: msy } : null;
  if (p.am) p.face = p.am.x > p.x ? 1 : -1;
}

function jump() {
  if (p.g) {
    if (keys[KB.dn] && p.y < GY) { p.dn = 0.3; p.y += 4; }
    else { p.vy = -T.jump; p.jc = 1; }
    p.g = 0;
  } else if (p.jc < T.mj) {
    p.vy = -T.jump * 0.9; p.jc++;
    fx.push({ a: [FR.flash[0]], x: p.x, y: p.y, d: 0.15, sz: 90, f: 1, t: 0 });
  }
}

// ----- 드롭 / 레벨업 -----
function pick(d) {
  if (d.k === 'xp') { xp += d.v * T.xpm; chk(); }
  else if (d.k === 'g') gold += d.v;
  else {
    p.b[d.b] = 12;
    txt(p.x, p.y - 110, BF[d.b][0] + '!', BF[d.b][1]);
    fx.push({ a: [FR.flash[1], FR.flash[2]], x: p.x, y: p.y - 50, d: 0.12, sz: 130, f: 1, t: 0 });
  }
}

function chk() {
  if (xp >= need && state === 'play') {
    xp -= need; lvl++; need = Math.floor(need * 1.3 + 3);
    heal(T.maxhp * 0.2);
    lvFx();
  }
}

function lvFx() {
  state = 'lvfx'; lt = 1; lf = 0.8; shake = 0.5;
  for (let i = 0; i < 60; i++) {
    const a = R() * 6.283, s = rr(80, 420);
    pt.push({ x: p.x, y: p.y - 50, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 140, t: rr(0.6, 1.3), c: R() < 0.5 ? '#ffd84a' : '#fff' });
  }
  rg.push({ x: p.x, y: p.y - 50, t: 0 }, { x: p.x, y: p.y - 50, t: -0.2 });
  fx.push({ a: [FR.flash[1], FR.flash[2]], x: p.x, y: p.y - 50, d: 0.3, sz: 420, f: 1, t: 0 });
}
