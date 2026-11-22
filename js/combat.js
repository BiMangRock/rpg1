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
  const D = ENEMY[type], L = depth(), m = 1 + L * 0.23 + lvl * 0.05;
  const e = {
    t: type, D, x: x ?? cl(p.x + (R() < 0.5 ? -1 : 1) * (W / 2 + 60), 30, WW - 30), y: opt?.y ?? GY, vy: 0, g: 1, jt: 0,
    kx: 0, fl: 0, ph: R() * 6, dir: 1, w: D.w, h: D.h, sp: D.sp * rr(0.85, 1.15),
    dmg: (8 + L * 1.6) * D.dm, hp: D.hp * m, sh: rr(1, 2), ac: 0, cd: rr(1.5, D.cd || 2),
    shd: 0, shdT: 0, bf: 0, cast: 0, frz: 0, burnT: 0, psnT: 0, psnS: 0,
  };
  if (D.fly) e.y -= rr(90, 170);
  // 발판 점프 추격: jump 1 = 항상, 2 = 2월드부터
  e.jumper = D.jump === 1 || (D.jump === 2 && cur.w >= 1);
  // ★ 몬스터: 일반 적이 가끔 ★1~5로 등장. 별이 많을수록 강하고 보상이 큼
  if (!opt?.owner && !D.minion && D.ai !== 'crystal' && !isBossStage() && R() < STAR_CHANCE * (1 + L * 0.06) * (1 + T.luck)) {
    let st = 1;
    while (st < 5 && R() < STAR_UP + L * 0.02) st++;
    e.star = st;
    e.hp *= 1 + st * 0.7; e.dmg *= 1 + st * 0.12; e.sp *= 1 + st * 0.03;
    e.w *= 1 + st * 0.06; e.h *= 1 + st * 0.06;
  }
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
    if (!e.dead && Math.abs(e.x - x) < 75 + e.w / 2 && e.y > p.y - 130 && e.y - e.h < p.y) dealt += hit(e, dm(), p.face * 260, rollCrit(), 'sw');
  if (T.vamp && dealt > 0) heal(dealt * T.vamp);
  // 검기: 적을 관통하며 날아감
  if (T.swave) pr.push({ sw: 1, x: p.x + p.face * 40, y: p.y - 60, vx: p.face * 760, vy: 0, life: 0.5, a: 0, f: p.face, dmg: dm() * T.swave, crit: rollCrit(), hs: new Set() });
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
  for (const e of en) if (Math.hypot(e.x - x, e.y - e.h / 2 - y) < r + e.w / 2) hit(e, d, (e.x > x ? 1 : -1) * 200, crit, 'mg');
  if (T.chain) chainBolt(x, y, d * 0.6, T.chain);
}

// 연쇄 번개: 폭발 지점에서 가까운 적으로 차례로 튐
function chainBolt(x, y, d, n) {
  const done = new Set();
  for (let i = 0; i < n; i++) {
    let best = null, bd = 300;
    for (const e of en) {
      if (e.dead || done.has(e)) continue;
      const ds = Math.hypot(e.x - x, e.y - e.h / 2 - y);
      if (ds < bd) { bd = ds; best = e; }
    }
    if (!best) break;
    done.add(best);
    const nx = best.x, ny = best.y - best.h / 2;
    zp.push({ x1: x, y1: y, x2: nx, y2: ny, t: 0 });
    hit(best, d, 0, false, 'ch');
    x = nx; y = ny;
  }
}

// 빙결: 일반 적은 정지, 보스는 둔화
function freeze(e, t) {
  if (e.D.ai === 'crystal') return;
  if (e.t === 'boss') { if (!(e.slow > 0)) txt(e.x, e.y - e.h - 24, '❄ 둔화', '#9ad8ff'); e.slow = Math.max(e.slow || 0, t); return; }
  if (!(e.frz > 0)) txt(e.x, e.y - e.h - 24, '❄ 빙결', '#9ad8ff');
  e.frz = Math.max(e.frz, t); e.kx = 0;
}

// ----- 적에게 피해 (실제로 깎인 HP 반환) -----
// src: sw 검 / mg 마법 / sm 소환수 / ch 번개 / kb 처치폭발 / th 반격 / burn 화상 / psn 독
const DMG_COL = { burn: '#ff9a40', psn: '#9aff5a', ch: '#bfe0ff', kb: '#ffb070' };
function hit(e, d, k, crit, src) {
  if (e.dead) return 0;
  if (e.inv > 0) { if (R() < 0.15) txt(e.x, e.y - e.h - 6, e.sanct ? '성역' : '무적', '#ffe08a'); return 0; }
  if (crit) d *= 2 + T.critx;
  if (e.frz > 0 && T.frzB) d *= 1 + T.frzB;
  if (e.shd > 0) {
    const a = Math.min(e.shd, d);
    e.shd -= a; d -= a; e.fl = 0.08;
    if (R() < 0.3) txt(e.x, e.y - e.h - 22, '보호막', '#8ac8ff');
    if (d <= 0) return 0;
  }
  e.hp -= d;
  if (src !== 'burn' && src !== 'psn') e.fl = 0.12;
  if (e.t !== 'boss' && e.D.ai !== 'crystal' && !(e.frz > 0)) e.kx += k;
  txt(e.x, e.y - e.h - 6, Math.round(d) + (crit ? '!' : ''), crit ? '#ffd84a' : DMG_COL[src] || '#fff');
  // 적중 효과 (검/마법/소환수)
  if (src === 'sw' || src === 'mg' || src === 'sm') {
    const fc = src === 'sm' ? T.sfrz : T.frz;
    if (fc && R() < fc) freeze(e, 1.5 + T.frzT);
    if (src === 'mg' && T.burn) { e.burnT = 3; e.burnD = dm() * T.burn; }
    if (src === 'sw' && T.psn) { e.psnS = Math.min(5, (e.psnT > 0 ? e.psnS : 0) + 1); e.psnT = 4; e.psnD = dm() * T.psn; }
    if (T.exe && e.t !== 'boss' && e.D.ai !== 'crystal' && e.hp > 0 && e.hp < e.mh * T.exe) { e.hp = 0; txt(e.x, e.y - e.h - 24, '처형!', '#ff4a6a'); }
  }
  if (e.hp <= 0) { e.dead = 1; kill(e); }
  return d;
}

function kill(e) {
  fx.push({ a: [FR.exp[1], FR.exp[2], FR.exp[3]], x: e.x, y: e.y - e.h / 2, d: 0.08, sz: e.w * 1.6, f: 1, t: 0 });
  if (e.t === 'boss') return bossDown(e);
  if (T.ls) heal(T.ls);
  if (!e.D.minion && e.D.ai !== 'crystal') kills++;
  const st = e.star || 0, bn = st && T.bounty ? 2 : 1, cy = e.y - e.h / 2;
  if (e.D.xp) dr.push({ k: 'xp', v: e.D.xp * (1 + st) * bn, x: e.x, y: cy, vy: -200, life: 1e9 });
  if (e.D.gold) dropGold(e.x, cy, (e.D.gold * (1 + st * 1.2) + T.gkill) * bn, st >= 2);
  else if (T.gkill) dropGold(e.x, cy, T.gkill);
  if (T.kboom) kq.push({ x: e.x, y: cy });
  if (!e.D.minion && (st >= 3 || R() < 0.15)) dr.push({ k: 'b', b: pickR(Object.keys(BF)), x: e.x, y: cy, vy: -300, life: 12 });
  // ★ 몬스터는 장비를 떨어뜨릴 수 있음
  if (st && R() < st * STAR_ITEM * (1 + T.luck * 0.8)) dropItem(e.x, cy, st >= 4 ? 1 : 0);
  if (st >= 3) txt(e.x, e.y - e.h - 30, '★'.repeat(st) + ' 처치!', '#ffd24a');
}

// 아직 없는 장비 중 하나 (bonus: 한 등급 위까지 허용)
function randItem(bonus) {
  const cap = Math.min(3, tierCap(cur) + (bonus || 0));
  const pool = ITEMS.filter((i) => i.tier <= cap && !inv.includes(i.id) && !dr.some((d) => d.id === i.id));
  return pool.length ? pickR(pool).id : null;
}
function dropItem(x, y, bonus) {
  const id = randItem(bonus);
  if (id) dr.push({ k: 'it', id, x, y, vy: -420, life: 1e9 });
  else dropGold(x, y, 40, true); // 살 장비가 없으면 골드로
}

// 보물상자
function openChest(c) {
  c.open = 1;
  const mul = 1 + T.chest * 0.5;
  shake = 0.25;
  wave(c.x, c.y - 20, '#ffd24a', 160);
  txt(c.x, c.y - 60, '보물상자!', '#ffd24a');
  dropGold(c.x, c.y - 30, (25 + depth() * 10) * mul, true);
  for (let i = 0; i < 3; i++) dr.push({ k: 'xp', v: 3 + depth(), x: c.x + rr(-30, 30), y: c.y - 30, vy: rr(-500, -300), life: 1e9 });
  if (R() < 0.35 * mul) dropItem(c.x, c.y - 30, 0);
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
  if (T.frzA && p.frzCd <= 0) {
    // 서리 갑주: 주변 적 빙결
    p.frzCd = 4;
    wave(p.x, p.y - 50, '#9ad8ff', 200);
    for (const e of en) if (Math.abs(e.x - p.x) < 200 && Math.abs(e.y - e.h / 2 - (p.y - 50)) < 160) freeze(e, 2 + T.frzT);
  }
  if (p.hp <= 0) {
    if (p.revUsed < T.revive) {
      p.revUsed++; p.hp = T.maxhp * 0.5; p.inv = 2.5; shake = 0.6;
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
    const bat = (b0 + i) % 2, o = (i - (nw - 1) / 2) * 40, x = p.x + o * 1.2, y = bat ? p.y - 80 : p.y;
    const mh = (bat ? 30 : 55) * T.sm * (1 + depth() * 0.13);
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
  p.am = mon ? { x: msx + cam, y: msy + camY } : null;
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
// 실제 획득 (정산 화면에서도 사용, 레벨업 연출 없이)
function pickRaw(d) {
  if (d.k === 'xp') xp += d.v * T.xpm;
  else if (d.k === 'g') gold += d.v * (1 + T.gdup);
  else if (d.k === 'it') {
    if (inv.includes(d.id)) { gold += 40; return; }
    inv.push(d.id);
    lockd = lockd.filter((x) => x !== d.id);
    const it = ITEM[d.id], empty = slotsFor(it).find((s) => !eq[s]);
    if (empty) { eq[empty] = d.id; recalc(); }
    txt(p.x, p.y - 130, `장비 획득! ${it.n}${empty ? ' (장착)' : ''}`, ['#fff', '#cfe6ff', '#e0b0ff', '#ffc070'][it.tier]);
  }
}

function pick(d) {
  if (d.k !== 'b') { pickRaw(d); if (d.k === 'xp') chk(); }
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
