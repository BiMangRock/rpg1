// =====================================================================
//  보스 — 1월드: 각성한 용사 / 2월드: 대주교 루미엘
//  체력 66% / 33% 에서 2·3페이즈로 넘어감
// =====================================================================
const BOSS = {
  hero: { n: '각성한 용사', mk: () => ({ w: 120, h: 150, dmg: 30, hp: 3000 + lvl * 130 }), ai: heroAI },
  pope: { n: '대주교 루미엘', mk: () => ({ w: 90, h: 170, dmg: 26, hp: 5200 + lvl * 170, y: GY - 40, alpha: 1 }), ai: popeAI },
};

function mkBoss() {
  const kind = WORLDS[cur.w].boss, B = BOSS[kind];
  const e = {
    t: 'boss', kind, D: {}, x: WW - 300, y: GY, kx: 0, fl: 0, ph: 0, dir: -1, sp: 0, pz: 1, at: 1.5, act: null,
    vx: 0, vy: 0, inv: 0, tel: 0, ac: 0, shd: 0, shdT: 0, bf: 0, cast: 0, ...B.mk(),
  };
  e.hp = e.mh = Math.round(e.hp);
  boss = e;
  en.push(e);
  ban = { s: 'BOSS · ' + B.n, t: 3 };
  shake = 0.6;
}

function bossAI(e, dt, dx) {
  const z = e.hp > e.mh * 0.66 ? 1 : e.hp > e.mh * 0.33 ? 2 : 3;
  e.inv -= dt;
  BOSS[e.kind].ai(e, dt, dx, z);
  e.x = cl(e.x, 60, WW - 60);
}

function bDone(e, z) { e.act = null; e.tel = 0; e.alpha = 1; e.at = [0, 1.5, 1.1, 0.7][z] * (e.kind === 'pope' ? 1.1 : 1); }

function pickAct(e, list) {
  let k;
  do k = pickR(list); while (k === e.last && new Set(list).size > 1);
  e.last = k;
  e.act = { k, t: 0, n: 0 };
  return k;
}

function ring(e, n, sp, off, d) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + (off || 0);
    eb.push({ x: e.x, y: e.y - 85, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 4, d: d || 16 });
  }
}

function pillars(c, d) {
  for (let i = 0; i < c; i++) hz.push({ x: cl(p.x + (i - (c - 1) / 2) * 115, 30, WW - 30), t: -0.9, d });
}

// 보스 처치
function bossDown(e) {
  bdone = 1; boss = null; eb = []; hz = [];
  for (const o of en) if (o !== e) o.dead = 1;
  dropXP(e.x, e.y - 80, 12 * (8 + cur.w * 6), true);
  dropGold(e.x, e.y - 80, [200, 400][cur.w] || 400, true);
  dropGem(e.x, e.y - 80); // 보스는 보석 확정
  shake = 0.8;
  if (cur.w === WORLDS.length - 1) { ban = { s: '최종 보스 격파!', t: 3 }; winT = 2.5; }
  else openPortal('보스 격파! 포털에 들어가 보상을 받으세요');
}

// ---------------------------------------------------------------------
//  1월드 보스: 각성한 용사 — 탄막, 검기, 돌진, 도약 충격파, 빛기둥
// ---------------------------------------------------------------------
function heroAI(e, dt, dx, z) {
  if (z > e.pz) {
    e.pz = z; e.inv = 1.2; e.act = null; e.tel = 0; e.at = 1.4; shake = 0.6;
    ban = { s: z === 2 ? '용사가 분노한다!' : '최후의 각성 · 빛의 심판', t: 2.5 };
    ring(e, 16, 230, 0, 18);
    spawn('paladin', cl(e.x - 180, 40, WW - 40));
    spawn('swordsman', cl(e.x + 180, 40, WW - 40));
    if (z === 3) spawn('archer', cl(p.x + (R() < 0.5 ? -320 : 320), 40, WW - 40));
  }
  if (z === 3) {
    e.mt = (e.mt ?? 8) - dt;
    if (e.mt <= 0) { e.mt = 9; if (en.length < 6) spawn(R() < 0.5 ? 'swordsman' : 'paladin', cl(e.x + (R() < 0.5 ? -150 : 150), 40, WW - 40)); }
  }
  // 도약 중 중력
  if (e.y < GY || e.vy < 0) {
    e.vy += 2200 * dt; e.y += e.vy * dt; e.x += e.vx * dt;
    if (e.y >= GY) { e.y = GY; e.vy = 0; e.vx = 0; heroLand(e, z); }
  }
  const A = e.act;
  if (!A) {
    e.dir = dx > 0 ? 1 : -1;
    e.x += e.dir * [0, 55, 75, 100][z] * dt;
    e.at -= dt;
    if (e.at <= 0) {
      const L = ['ring', 'wave', 'charge', 'leap'];
      if (z >= 2) L.push('pillar', 'wave', 'leap');
      if (z >= 3) L.push('pillar', 'charge');
      const k = pickAct(e, L);
      if (k === 'charge' || k === 'wave') e.tel = 1;
    }
    return;
  }
  A.t += dt;
  if (A.k === 'ring') {
    if (A.n < z && A.t >= 0.3 + A.n * 0.4) { ring(e, [0, 10, 14, 18][z], 210, A.n * 0.25); A.n++; shake = Math.max(shake, 0.12); }
    if (A.t > 0.5 + z * 0.4) bDone(e, z);
  } else if (A.k === 'wave') {
    // 칼끝이 빛난 뒤 플레이어 조준 검기
    const shots = z >= 3 ? 2 : 1;
    if (A.n < shots && A.t >= 0.5 + A.n * 0.45) {
      e.tel = 0;
      const c = [0, 3, 5, 7][z], b = Math.atan2(p.y - 50 - (e.y - 100), p.x - e.x);
      for (let i = 0; i < c; i++) {
        const a = b + (i - (c - 1) / 2) * 0.16;
        eb.push({ x: e.x + e.dir * 40, y: e.y - 100, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, life: 3, d: 22, r: 13, c: '#9ad8ff' });
      }
      A.n++;
    }
    if (A.t > 0.7 + shots * 0.45) bDone(e, z);
  } else if (A.k === 'charge') {
    // 눈이 빨개진 뒤 돌진 (3페이즈는 2연속)
    const reps = z >= 3 ? 2 : 1, sp = [0, 560, 680, 820][z], seg = 1.25, i = Math.floor(A.t / seg);
    if (i >= reps) bDone(e, z);
    else {
      const t2 = A.t - i * seg;
      if (t2 < 0.55) { e.tel = 1; e.dir = dx > 0 ? 1 : -1; e.d0 = e.dir; }
      else { e.tel = 0; if (A.n <= i) { A.n = i + 1; shake = 0.3; } e.x += e.d0 * sp * dt; }
    }
  } else if (A.k === 'leap') {
    if (!A.n) { A.n = 1; const Tm = 0.95; e.vy = (-2200 * Tm) / 2; e.vx = (cl(p.x, 80, WW - 80) - e.x) / Tm; }
    if (A.t > 2) bDone(e, z);
  } else if (A.k === 'pillar') {
    const vol = z >= 3 ? 2 : 1;
    if (A.n < vol && A.t >= A.n) { pillars(z >= 3 ? 5 : 3, 26); A.n++; }
    if (A.t > vol + 0.6) bDone(e, z);
  }
}

function heroLand(e, z) {
  shake = 0.5;
  for (const d of [-1, 1]) eb.push({ x: e.x + d * 50, y: GY - 18, vx: d * [0, 400, 450, 520][z], vy: 0, life: 2.4, d: 24, gw: 1 });
  if (z >= 2)
    for (let i = 0; i < 6; i++) {
      const a = (-Math.PI * (i + 0.5)) / 6;
      eb.push({ x: e.x, y: e.y - 60, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 3, d: 16 });
    }
  if (e.act && e.act.k === 'leap') bDone(e, z);
}

// ---------------------------------------------------------------------
//  2월드 보스: 대주교 루미엘 — 공중에 떠서 싸우는 마법사형
//  페이즈 전환 시 '성역 수정'을 소환: 수정이 남아 있는 동안 무적
// ---------------------------------------------------------------------
function popeAI(e, dt, dx, z) {
  if (z > e.pz) {
    e.pz = z; e.act = null; e.alpha = 1; e.at = 2; e.inv = 1; shake = 0.6;
    ban = { s: z === 2 ? '성역 전개 — 수정을 파괴하라!' : '최후의 기도 — 수정을 파괴하라!', t: 3 };
    for (const o of z === 2 ? [-280, 280] : [-380, 0, 380]) spawn('crystal', cl(e.x + o, 80, WW - 80));
    spawn(z === 2 ? 'warden' : 'summoner', cl(e.x - 170, 40, WW - 40));
    spawn(z === 2 ? 'cleric' : 'bard', cl(e.x + 170, 40, WW - 40));
    ring(e, 20, 220, 0, 18);
  }
  e.sanct = en.some((o) => o.t === 'crystal' && !o.dead);
  if (e.sanct) e.inv = Math.max(e.inv, 0.1);
  e.y = GY - 40 + Math.sin(time * 2) * 10; // 공중 부유

  const A = e.act;
  if (!A) {
    // 플레이어와 220~420 거리 유지
    const ad = Math.abs(dx);
    e.dir = dx > 0 ? 1 : -1;
    e.x += (ad < 220 ? -e.dir : ad > 420 ? e.dir : 0) * [0, 60, 80, 100][z] * dt;
    e.at -= dt;
    if (e.at <= 0) {
      const L = ['orbs', 'ring', 'pillar', 'tele'];
      if (z >= 2) L.push('summon', 'orbs', 'pillar');
      if (z >= 3) L.push('rain', 'tele', 'rain');
      if (pickAct(e, L) === 'orbs') e.tel = 1;
    }
    return;
  }
  A.t += dt;
  if (A.k === 'orbs') {
    // 따라오는 빛 구체
    const shots = z >= 3 ? 2 : 1;
    if (A.n < shots && A.t >= 0.5 + A.n * 0.7) {
      e.tel = 0;
      const c = [0, 3, 4, 6][z], b = Math.atan2(p.y - 50 - (e.y - 100), p.x - e.x);
      for (let i = 0; i < c; i++) {
        const a = b + (i - (c - 1) / 2) * 0.5;
        eb.push({ x: e.x, y: e.y - 110, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 4, d: 20, r: 11, c: '#ffe680', hm: 2 });
      }
      A.n++;
    }
    if (A.t > 0.9 + shots * 0.7) bDone(e, z);
  } else if (A.k === 'ring') {
    if (A.n < z + 1 && A.t >= 0.3 + A.n * 0.45) { ring(e, [0, 12, 16, 20][z], 190, A.n * 0.2); A.n++; }
    if (A.t > 0.6 + (z + 1) * 0.45) bDone(e, z);
  } else if (A.k === 'pillar') {
    const vol = z >= 3 ? 2 : 1;
    if (A.n < vol && A.t >= A.n) { pillars([0, 3, 5, 7][z], 26); A.n++; }
    if (A.t > vol + 0.6) bDone(e, z);
  } else if (A.k === 'tele') {
    // 사라졌다가 플레이어 근처에 나타나며 탄막
    if (A.t < 0.4) e.alpha = 1 - A.t / 0.4;
    else if (A.n === 0) { A.n = 1; e.x = cl(p.x + (R() < 0.5 ? -1 : 1) * rr(220, 300), 80, WW - 80); wave(e.x, e.y - 85, '#ffe680', 160); }
    else if (A.t < 0.7) e.alpha = (A.t - 0.4) / 0.3;
    else if (A.n === 1) { A.n = 2; e.alpha = 1; ring(e, 12, 240, R(), 18); shake = 0.2; }
    if (A.t > 1.1) bDone(e, z);
  } else if (A.k === 'summon') {
    if (!A.n) {
      A.n = 1;
      if (en.length < 9) {
        for (let i = 0; i < 3; i++) spawn('wisp', e.x + (i - 1) * 40, { y: e.y - 150, owner: e });
        spawn(pickR(['cleric', 'warden', 'bard']), cl(e.x + (R() < 0.5 ? -200 : 200), 40, WW - 40));
      }
      wave(e.x, e.y - 85, '#c08aff', 260);
    }
    if (A.t > 0.8) bDone(e, z);
  } else if (A.k === 'rain') {
    // 하늘에서 빛의 비
    if (A.n < 16 && A.t >= A.n * 0.1) {
      eb.push({ x: cl(p.x + rr(-300, 300), 20, WW - 20), y: -10, vx: 0, vy: 420, life: 3, d: 18, r: 9, c: '#fff3b0' });
      A.n++;
    }
    if (A.t > 2) bDone(e, z);
  }
}
