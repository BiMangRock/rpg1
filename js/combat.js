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
  // 지상 적은 모두 발판 점프 추격 (2월드가 더 높고 자주)
  e.jumper = !D.fly && D.ai !== 'crystal';
  e.jp = cur.w >= 1 ? 980 : 880; e.jcd = cur.w >= 1 ? 0.7 : 1.1;
  if (D.ev) { e.ev = D.ev; e.evc = 0.5; }
  if (type === 'ninja') { e.jp = 1080; e.jcd = 0.35; e.mAir = 1; e.shT = rr(1, 2.5); }
  // ★ 몬스터: 일반 적이 가끔 ★1~5로 등장. 별이 많을수록 강하고 보상이 큼
  if (!opt?.owner && !opt?.nostar && !D.minion && D.ai !== 'crystal' && !isBossStage() && R() < STAR_CHANCE * (1 + L * 0.06) * (1 + T.luck)) {
    let st = 1;
    while (st < 5 && R() < STAR_UP + L * 0.02) st++;
    e.star = st;
    e.hp *= 1 + st; // ★1 +100%, ★2 +200%, … ★5 +500% e.dmg *= 1 + st * 0.12; e.sp *= 1 + st * 0.03;
    e.w *= 1 + st * 0.06; e.h *= 1 + st * 0.06;
    // 특수 능력
    const af = [];
    if (st >= 3) af.push('armor');
    if (st >= 4) af.push('jump');
    if (st >= 5) af.push('wave');
    const pool = shuffle(AFFIX_RANDOM.filter((a) => !af.includes(a)));
    while (af.length < st - 1 + (st >= 5 ? 1 : 0)) af.push(pool.shift());
    e.af = new Set(af);
    if (e.af.has('armor')) e.dr = 0.35;               // 받는 피해 -35%, 넉백 무시
    if (e.af.has('haste')) e.sp *= 1.6;
    if (e.af.has('jump')) { e.mAir = 2; e.jp += 120; e.jcd = 0.4; } // 공중에서 2번 더 점프
    e.wvT = 2; e.hsT = 1; e.blT = 3;
    if (STAR_EVADE[st]) { e.ev = Math.max(e.ev || 0, STAR_EVADE[st]); e.evc = Math.min(e.evc || 9, 1.2); }
  }
  Object.assign(e, opt);
  e.mh = e.hp;
  en.push(e);
  return e;
}

// ----- 플레이어 공격 -----
// 검: 회피·보호막 무시, 적 탄환 튕겨내기, 얼린 적 분쇄 (+ 장비로 콤보)
function melee() {
  let big = false, cm = 1;
  if (T.combo) {
    p.combo = Math.min(10, p.combo + 1); p.comboT = 1.3;
    big = p.combo % 3 === 0;                    // 3번째 타격
    cm = 1 + Math.min(1, (p.combo - 1) * 0.1); // 콤보마다 +10%
  }
  const rng = T.swr * (big ? 1.6 : 1), x = p.x + p.face * 50 * rng;
  fx.push({ a: FR.slash, x: p.x + p.face * 55 * rng, y: p.y - 58, d: 0.06, sz: 150, hh: 120 * rng, f: -p.face, t: 0 });
  if (big) { shake = Math.max(shake, 0.25); wave(x, p.y - 55, '#ffd24a', 110 * rng); }
  let dealt = 0;
  for (const e of en)
    if (!e.dead && Math.abs(e.x - x) < 75 * rng + e.w / 2 && e.y > p.y - 130 * rng && e.y - e.h < p.y + 10) {
      const fz = e.frz > 0;
      dealt += hit(e, dm() * T.swd * cm * (big ? 1.5 : 1), p.face * (big ? 650 : 260), rollCrit(), 'sw');
      if (fz) shatter(e);
      if (big && !e.dead && e.t !== 'boss' && e.D.ai !== 'crystal') e.stn = 1; // 기절
    }
  parry(x);
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

function boom(x, y, d, crit, direct) {
  const r = 90 * T.area;
  fx.push({ a: FR.exp, x, y, d: 0.07, sz: r * 2, f: 1, t: 0 });
  shake = Math.max(shake, 0.12);
  for (const e of en)
    if (Math.hypot(e.x - x, e.y - e.h / 2 - y) < r + e.w / 2 && (e === direct || !evade(e, 'pr'))) hit(e, d, (e.x > x ? 1 : -1) * 200, crit, 'mg');
  if (T.chain) chainBolt(x, y, d * 0.6, T.chain);
}

// 탄 튕겨내기: 검 범위 안의 적 탄환을 베면 반대로 날려 보냄 (쏜 적을 향해)
function parry(x) {
  let n = 0;
  for (const o of eb) {
    if (o.gw || o.life <= 0 || Math.abs(o.x - x) > 100 * T.swr || o.y < p.y - 160 || o.y > p.y + 10) continue;
    o.life = 0; n++;
    const s = o.src && !o.src.dead ? o.src : null;
    const ang = s ? Math.atan2(s.y - s.h / 2 - o.y, s.x - o.x) : p.face > 0 ? 0 : Math.PI;
    pr.push({ rf: 1, x: o.x, y: o.y, vx: Math.cos(ang) * 720, vy: Math.sin(ang) * 720, life: 1.4, a: 0, dmg: dm() * T.swd * 2 + (o.d || 15) * 1.5, c: '#ffe680', r: (o.r || 6) + 2 });
  }
  if (n) { txt(p.x, p.y - 125, n > 1 ? `튕겨내기 ×${n}!` : '튕겨내기!', '#ffe680'); fx.push({ a: [FR.flash[0]], x, y: p.y - 60, d: 0.1, sz: 110, f: 1, t: 0 }); }
}

// 빙결 분쇄: 얼어 있던 적을 베면 산산조각 → 본인 추가 피해 + 주변 범위 피해
function shatter(e) {
  e.frz = 0;
  const cy = e.y - e.h / 2;
  txt(e.x, e.y - e.h - 26, '분쇄!', '#bfeaff');
  wave(e.x, cy, '#bfeaff', 140);
  for (let i = 0; i < 14; i++) { const a = R() * 6.283, s = rr(120, 380); pt.push({ x: e.x, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, t: rr(0.3, 0.7), c: R() < 0.5 ? '#bfeaff' : '#fff' }); }
  if (!e.dead) hit(e, dm() * T.swd * 2, 0, false, 'sh');
  for (const o of en) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - o.h / 2 - cy) < 130) hit(o, dm() * T.swd * 1.5, (o.x > e.x ? 1 : -1) * 250, false, 'sh');
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

// 회피 (★4·★5, 닌자): 점프+옆으로 튕겨 나가며 잠깐 마법·검 피해 무시
// kind: 'pr' = 마법구체·검기·폭발, 'sw' = 검
function evade(e, kind) {
  if (e.evT > 0) return true;
  const ch = kind === 'sw' ? e.D.evs || 0 : e.ev || 0;
  if (!ch || e.evCd > 0 || e.frz > 0 || e.dead || R() >= ch) return false;
  e.evT = 0.35; e.evCd = e.evc || 1;
  const away = e.x >= p.x ? 1 : -1;
  e.kx = away * (e.t === 'ninja' ? 520 : 380);
  if (e.g !== 0) { e.vy = -620; e.g = 0; }
  txt(e.x, e.y - e.h - 16, '회피!', '#9affff');
  e.ghost = { x: e.x, y: e.y, t: 0.3 };
  return true;
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
const DMG_COL = { burn: '#ff9a40', psn: '#9aff5a', ch: '#bfe0ff', kb: '#ffb070', sh: '#bfeaff', rf: '#ffe680' };
function hit(e, d, k = 0, crit, src) {
  if (e.dead) return 0;
  const blade = src === 'sw' || src === 'sh';
  if (e.inv > 0) {
    // 검은 대주교의 성역을 뚫고 50% 피해
    if (blade && e.sanct) d *= 0.5;
    else { if (R() < 0.15) txt(e.x, e.y - e.h - 6, e.sanct ? '성역' : '무적', '#ffe08a'); return 0; }
  }
  if (e.evT > 0 && src === 'mg') return 0; // 검은 회피를 무시
  if (crit) d *= 2 + T.critx;
  if (e.dr) d *= 1 - e.dr;
  if (e.frz > 0 && T.frzB) d *= 1 + T.frzB;
  if (e.shd > 0 && !blade) { // 검은 보호막을 무시
    const a = Math.min(e.shd, d);
    e.shd -= a; d -= a; e.fl = 0.08;
    if (R() < 0.3) txt(e.x, e.y - e.h - 22, '보호막', '#8ac8ff');
    if (d <= 0) return 0;
  }
  e.hp -= d;
  if (src !== 'burn' && src !== 'psn') e.fl = 0.12;
  if (e.t !== 'boss' && e.D.ai !== 'crystal' && !(e.frz > 0) && !e.af?.has('armor')) e.kx += k;
  txt(e.x, e.y - e.h - 6, Math.round(d) + (crit ? '!' : ''), crit ? '#ffd84a' : DMG_COL[src] || '#fff');
  // 적중 효과 (검/마법/소환수)
  if (src === 'sw' || src === 'mg' || src === 'sm') {
    const fc = src === 'sm' ? T.sfrz : T.frz;
    if (fc && R() < fc) freeze(e, 1.5 + T.frzT);
    if (src === 'mg' && T.burn) { e.burnT = 3; e.burnD = dm() * T.burn; }
    if (src === 'sw' && T.psn) { e.psnS = Math.min(5, (e.psnT > 0 ? e.psnS : 0) + 1); e.psnT = 4; e.psnD = dm() * T.psn; }
    if (T.exe && e.t !== 'boss' && e.D.ai !== 'crystal' && e.hp > 0 && e.hp < e.mh * T.exe) { e.hp = 0; txt(e.x, e.y - e.h - 24, '처형!', '#ff4a6a'); }
  }
  // ★몬스터 가시: 검으로 때리면 피해 일부 반사
  if (src === 'sw' && e.af?.has('thorns') && p.inv <= 0) hurtP(Math.min(d * 0.2, e.dmg), null);
  if (e.hp <= 0 && e.af?.has('revive') && !e.revived) {
    e.revived = 1; e.hp = e.mh * 0.5;
    txt(e.x, e.y - e.h - 30, '부활!', '#ff8aa8'); wave(e.x, e.y - e.h / 2, '#ff4a6a', 140);
    return d;
  }
  if (e.hp <= 0) { e.dead = 1; kill(e, src); }
  return d;
}

function kill(e, src) {
  esDie(e);
  fx.push({ a: [FR.exp[1], FR.exp[2], FR.exp[3]], x: e.x, y: e.y - e.h / 2, d: 0.08, sz: e.w * 1.6, f: 1, t: 0 });
  if (e.t === 'boss') return bossDown(e);
  if (T.ls) heal(T.ls);
  if (!e.D.minion && e.D.ai !== 'crystal') kills++;
  // ★ 보상: 별 수의 제곱에 비례 (★5 = 경험치 13.5배, 골드 16배)
  const blade = src === 'sw' || src === 'sh';
  const st = e.star || 0, bn = (st && T.bounty ? 2 : 1) * STAR_BONUS[st] * (blade ? 1 + T.swkill : 1), cy = e.y - e.h / 2;
  if (e.D.xp) dropXP(e.x, cy, e.D.xp * (1 + st * st * 0.5) * bn, st >= 2);
  if (st >= 4) { shake = Math.max(shake, 0.35); wave(e.x, cy, '#ffd24a', 220); }
  if (e.D.gold) dropGold(e.x, cy, (e.D.gold * (1 + st * st * 0.6) + T.gkill) * bn, st >= 2);
  else if (T.gkill) dropGold(e.x, cy, T.gkill);
  if (T.kboom) kq.push({ x: e.x, y: cy });
  if (!e.D.minion && (st >= 3 || R() < 0.15)) dr.push({ k: 'b', b: pickR(Object.keys(BF)), x: e.x, y: cy, vy: -300, life: 12 });
  // ★ 몬스터는 장비를 떨어뜨릴 수 있음
  if (st && R() < STAR_ITEM[st] * (1 + T.luck * 0.8) * (blade ? 1 + T.swdrop : 1)) dropItem(e.x, cy, st >= 4 ? 1 : 0);
  if (st >= 5 && R() < 0.5) dropItem(e.x + 20, cy, 1);
  // 닌자 등 보상형 적: 별이 없어도 장비를 떨어뜨릴 수 있음
  if (e.D.item && R() < e.D.item * (1 + T.luck * 0.8) * (blade ? 1 + T.swdrop : 1)) dropItem(e.x - 20, cy, 0);
  if (st >= 5 && R() < STAR_RELIC * (1 + T.luck * 0.5)) {
    const r = RELICS.filter((r) => !relics.includes(r.id));
    if (r.length) dr.push({ k: 'rl', id: pickR(r).id, x: e.x, y: cy, vy: -500, life: 1e9 });
  }
  // ★몬스터 자폭
  if (e.af?.has('kboom')) {
    fx.push({ a: FR.exp, x: e.x, y: cy, d: 0.07, sz: 240, f: 1, t: 0 }); shake = Math.max(shake, 0.3);
    if (Math.hypot(p.x - e.x, p.y - 45 - cy) < 130) hurtP(e.dmg * 1.3, null);
    for (const a of al) if (Math.hypot(a.x - e.x, a.y - cy) < 130) hurtA(a, e.dmg * 1.3);
  }
  if (st >= 3) txt(e.x, e.y - e.h - 30, '★'.repeat(st) + ' 처치!', '#ffd24a');
  // 분열: 죽으면 작은 분신 2마리
  if (e.af?.has('split'))
    for (const d of [-1, 1]) {
      const c = spawn(e.t, cl(e.x + d * 24, 20, WW - 20), { y: e.y, nostar: 1 });
      c.hp = c.mh = c.mh * 0.6; c.kx = d * 200;
    }
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
  dropXP(c.x, c.y - 30, (3 + depth()) * 3, true);
  if (R() < 0.35 * mul) dropItem(c.x, c.y - 30, 0);
}

// 골드·경험치는 양에 비례한 개수로 사방에 쏟아짐 (최대 50개)
function spray(k, x, y, v, spread) {
  const n = cl(Math.ceil(v / (k === 'g' ? 3 : 2)), 1, 50), sp = spread ? 1 + Math.min(2, n / 12) : 0.5;
  // 골드는 정수로 나눔 (나머지는 앞쪽 금화에 1씩) — 소수점 골드 방지
  const gi = k === 'g', base = gi ? Math.floor(v / n) : v / n, rem = gi ? Math.round(v - base * n) : 0;
  for (let i = 0; i < n; i++)
    dr.push({ k, v: base + (i < rem ? 1 : 0), x: x + rr(-8, 8), y, vx: rr(-170, 170) * sp, vy: rr(-380, -180) * (spread ? 1.5 : 1), life: 1e9 });
}
function dropGold(x, y, v, spread) {
  v = Math.max(1, Math.round(v * rr(0.8, 1.25) * T.gold));
  spray('g', x, y, v, spread);
}
function dropXP(x, y, v, spread) { spray('xp', x, y, v, spread); }

// ----- 플레이어 피격 -----
// 플레이어 피격. src = 때린 적 (★몬스터 특성 적용)
function hurtP(d, src, el) {
  if (p.inv > 0 || p.st === 'dead') return;
  if (T.dodge && R() < T.dodge) { p.inv = 0.4; txt(p.x, p.y - 100, '회피!', '#9affff'); return; }
  // 원소 효과 (법사의 마법·정령): 불 = 화상, 물 = 둔화, 나무 = 독
  el = el || src?.D?.el;
  if (el === 'fire') { p.burnD = Math.max(p.burnT > 0 ? p.burnD || 0 : 0, d * 0.25); p.burnT = 3; }
  else if (el === 'water') { if (!(p.slowT > 0)) txt(p.x, p.y - 135, '💧 둔화', '#6ab4ff'); p.slowT = 2.2; }
  else if (el === 'wood') { p.psnS = Math.min(5, (p.psnT > 0 ? p.psnS : 0) + 1); p.psnT = 4; p.psnD = Math.max(p.psnD || 0, d * 0.08); }
  const A = src?.af;
  if (A?.has('crit') && R() < 0.3) { d *= 2; txt(p.x, p.y - 118, '치명타!', '#ff4a4a'); }
  d *= (p.b.guard ? 0.4 : 1) * (1 - T.dr);
  p.inv = 1;
  shake = 0.25;
  if (T.frzA && p.frzCd <= 0) {
    // 서리 갑주: 주변 적 빙결
    p.frzCd = 4;
    wave(p.x, p.y - 50, '#9ad8ff', 200);
    for (const e of en) if (Math.abs(e.x - p.x) < 200 && Math.abs(e.y - e.h / 2 - (p.y - 50)) < 160) freeze(e, 2 + T.frzT);
  }
  if (A) {
    // ★몬스터 적중 효과 (마왕이 장비로 쓰는 특성과 같은 계열)
    if (A.has('frost')) { if (!(p.slowT > 0)) txt(p.x, p.y - 135, '❄ 둔화', '#9ad8ff'); p.slowT = 2; }
    if (A.has('burn')) { p.burnT = 3; p.burnD = src.dmg * 0.3; }
    if (A.has('poison')) { p.psnS = Math.min(5, (p.psnT > 0 ? p.psnS : 0) + 1); p.psnT = 4; p.psnD = src.dmg * 0.1; }
    if (A.has('vamp') && !src.dead) { src.hp = Math.min(src.mh, src.hp + d * 1.5); txt(src.x, src.y - src.h - 10, '+' + Math.round(d * 1.5), '#ff8aa8'); }
  }
  p.combo = 0;
  if (!loseHP(d, '#ff4a6a')) return;
  p.st = 'hurt'; p.t = 0; p.vy = -250; p.vx = -p.face * 160;
}

// HP 감소 (무적 무시). 쓰러지면 false
function loseHP(d, c) {
  p.hp -= d;
  txt(p.x, p.y - 100, Math.round(d), c);
  if (p.hp > 0) return true;
  if (p.revUsed < T.revive) {
    p.revUsed++; p.hp = T.maxhp * 0.5; p.inv = 2.5; shake = 0.6;
    p.burnT = p.psnT = 0;
    txt(p.x, p.y - 125, '불사의 심장 — 부활!', '#ff8aa8');
    wave(p.x, p.y - 50, '#ff4a6a', 320);
    return false;
  }
  p.hp = 0; p.st = 'dead'; p.t = 0;
  return false;
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
// 소환 레벨 = 1 + 소환 계열 레벨업 횟수 + 장비/유물. 3·5·7·9에서 진화
const summonLv = () => 1 + Math.round(T.slv);
function summonTier() {
  const lv = summonLv();
  let t = 0;
  for (const n of SUMMON_LV) if (lv >= n) t++;
  return t;
}
const sumDef = (air) => SUMMONS[sTier][air ? 1 : 0];
const sumMh = (d) => d.hp * T.sm * (1 + depth() * 0.13);

// 기존 소환수도 즉시 새 모습으로 (체력 비율 유지)
function evolveSummons() {
  for (const a of al) {
    const d = sumDef(a.air), r = a.hp / a.mh;
    Object.assign(a, { k: d.k, d, w: d.w, h: d.h, sp: d.sp });
    a.mh = sumMh(d); a.hp = a.mh * r;
    fx.push({ a: [FR.flash[1], FR.flash[2]], x: a.x, y: a.y - a.h / 2, d: 0.1, sz: 90, f: 1, t: 0 });
  }
  if (p && state !== 'title' && sTier > 0) {
    ban = { s: `소환수 진화! ${sumDef(0).n} · ${sumDef(1).n}`, t: 3 };
    wave(p.x, p.y - 50, '#c08aff', 300);
  }
}

// 최대치(smax)가 꽉 찼으면 새로 만들지 않고 기존 소환수 체력 회복
function summon() {
  p.sc = SCD * T.scd;
  const sn = Math.round(T.sn), max = Math.round(T.smax), nw = Math.max(0, Math.min(sn, max - al.length));
  if (nw < sn) { for (const a of al) a.hp = a.mh; txt(p.x, p.y - 135, '소환수 회복!', '#9aff9a'); }
  const b0 = al.length;
  for (let i = 0; i < nw; i++) {
    const air = (b0 + i) % 2 === 1, d = sumDef(air), o = (i - (nw - 1) / 2) * 40, x = p.x + o * 1.2, y = air ? p.y - 80 : p.y;
    const mh = sumMh(d);
    al.push({ air, k: d.k, d, x, y, w: d.w, h: d.h, sp: d.sp, life: 1, ph: R() * 6, dir: p.face, cd: 0, st: rr(0.5, 1.5), o, hp: mh, mh, iv: 0, fl: 0 });
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
  // 낙하의 장화: 공중에서 S+공격 → 내려찍기
  if (T.slam && !p.g && keys[KB.dn]) { p.st = 'slam'; p.t = 0; p.vy = 1300; p.slamY = p.y; p.inv = Math.max(p.inv, 0.2); return; }
  p.st = 'atk'; p.t = 0; p.hit = 0;
  // 질주의 검집: 달리면서 공격하면 돌진 베기
  if (T.dash && p.g && Math.abs(p.vx) > 60 && p.dashCd <= 0) {
    p.dashT = 0.2; p.dashCd = 0.9; p.dashHs = new Set(); p.inv = Math.max(p.inv, 0.35);
    fx.push({ a: [FR.flash[0]], x: p.x, y: p.y - 40, d: 0.1, sz: 90, f: p.face, t: 0 });
  }
}

// 내려찍기 착지: 떨어진 높이에 비례한 충격파
function slamLand() {
  const fall = Math.max(0, p.y - p.slamY), d = dm() * T.swd * (2.5 + Math.min(fall, 700) / 180);
  p.st = 'n'; p.inv = Math.max(p.inv, 0.25);
  shake = 0.5;
  fx.push({ a: FR.exp, x: p.x, y: p.y - 20, d: 0.06, sz: 260, f: 1, t: 0 });
  wave(p.x, p.y - 10, '#ffb070', 220);
  for (const e of en)
    if (!e.dead && Math.abs(e.x - p.x) < 170 + e.w / 2 && Math.abs(e.y - p.y) < 110) {
      const fz = e.frz > 0;
      hit(e, d, (e.x > p.x ? 1 : -1) * 350, rollCrit(), 'sw');
      if (fz) shatter(e);
      if (!e.dead && e.t !== 'boss' && e.D.ai !== 'crystal') { e.vy = -520; e.g = 0; }
    }
  txt(p.x, p.y - 120, '내려찍기!', '#ffb070');
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
  else if (d.k === 'g') gold = Math.round(gold + d.v * (1 + T.gdup));
  else if (d.k === 'rl') {
    if (relics.includes(d.id)) { gold += 80; return; }
    relics.push(d.id); recalc();
    txt(p.x, p.y - 130, `유물 획득! ${RELIC[d.id].n}`, '#ff8aa8');
    wave(p.x, p.y - 50, '#ff4a6a', 200);
  }
  else if (d.k === 'it') {
    if (inv.includes(d.id)) { gold += 40; return; }
    inv.push(d.id);
    lockd = lockd.filter((x) => x !== d.id);
    const it = ITEM[d.id], empty = slotsFor(it).find((s) => !eq[s]);
    if (empty) { eq[empty] = d.id; recalc(); }
    txt(p.x, p.y - 130, `장비 획득! ${itemName(d.id)}${empty ? ' (장착)' : ''}`, ['#fff', '#cfe6ff', '#e0b0ff', '#ffc070'][it.tier]);
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
