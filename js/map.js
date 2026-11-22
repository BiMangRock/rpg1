// =====================================================================
//  랜덤 맵 생성 — 스테이지마다 새 지형
//   flat  : 가로로 긴 맵, 낮은 발판 몇 층       → 포털은 오른쪽 끝 땅
//   mixed : 가로·세로 모두 넓은 맵              → 포털은 가장 높은 발판
//   tower : 좁고 높은 탑                         → 포털은 꼭대기
//  발판은 '등반 경로(walker)'를 따라 만들어서 항상 끝까지 올라갈 수 있게 보장
// =====================================================================
const MAP_TYPES = {
  flat:  { n: '평원', w: [2600, 3400], h: [640, 760] },
  mixed: { n: '고지', w: [2300, 3000], h: [1000, 1300] },
  tower: { n: '탑',   w: [1300, 1700], h: [1600, 2100] },
};

// 점프 한 번(약 120px)으로 닿는 간격
const STEP_UP = [70, 95];    // 다음 발판까지 높이
const STEP_SIDE = [40, 120]; // 다음 발판까지 가로 이동

// 포털까지 올라갈 수 있는 맵이 나올 때까지 다시 생성
function genMap() {
  if (isBossStage()) return bossArena();
  let m;
  for (let i = 0; i < 30; i++) { m = genOnce(); if (reachable(m)) break; }
  return m;
}

// 땅에서 시작해 점프(높이 95, 가로 120 이내)와 낙하만으로 포털 발판에 닿는지 검사
function reachable(m) {
  const floor = { x: 0, y: m.gy, w: m.mw }, all = [floor, ...m.pl], seen = new Set([floor]), q = [floor];
  while (q.length) {
    const a = q.shift();
    for (const b of all) {
      if (seen.has(b)) continue;
      const dy = a.y - b.y, gap = Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));
      if (dy < 0 || (dy <= 95 && gap <= 120)) { seen.add(b); q.push(b); }
    }
  }
  const tgt = all.find((o) => o.y === m.portal.y && m.portal.x >= o.x && m.portal.x <= o.x + o.w) || floor;
  return seen.has(tgt);
}

function genOnce() {
  const type = cur.s === 0 && cur.w === 0 ? 'flat' : pickR(['flat', 'mixed', 'mixed', 'tower']);
  const T0 = MAP_TYPES[type];
  const mw = Math.round(rr(...T0.w)), mh = Math.round(rr(...T0.h)), gy = mh - 70;
  const top = type === 'flat' ? gy - 330 : 150;
  const plats = [];

  // 1) 등반 경로: 땅에서 꼭대기까지 이어지는 발판 줄기 여러 개
  const nWalk = Math.max(2, Math.round(mw / 750));
  for (let i = 0; i < nWalk; i++) {
    const x0 = ((i + 0.5) / nWalk) * mw + rr(-120, 120);
    plats.push(...walker(cl(x0, 200, mw - 200), gy, top, mw));
  }
  // 2) 곁가지: 기존 발판에서 한 칸 위로 닿는 발판 추가 (갈래길/방)
  const extra = Math.round(plats.length * 0.5);
  for (let i = 0; i < extra; i++) {
    const q = pickR(plats);
    if (q.y - STEP_UP[1] < top - 40) continue;
    const w = rr(130, 300);
    plats.push(mkPlat(q.x + rr(-STEP_SIDE[1], q.w), q.y - rr(...STEP_UP), w, mw));
  }
  // 3) 너무 겹치는 발판 정리
  const pl2 = [];
  for (const q of plats.sort((a, b) => b.w - a.w)) {
    if (pl2.some((o) => Math.abs(o.y - q.y) < 34 && q.x < o.x + o.w + 20 && q.x + q.w > o.x - 20)) continue;
    pl2.push(q);
  }
  // 4) 포털 위치
  let portalAt;
  if (type === 'flat') portalAt = { x: mw - 160, y: gy };
  else {
    const hi = pl2.reduce((a, b) => (b.y < a.y ? b : a));
    if (hi.w < 200) { hi.x = cl(hi.x - (200 - hi.w) / 2, 20, mw - 220); hi.w = 200; }
    portalAt = { x: hi.x + hi.w / 2, y: hi.y };
  }
  // 적이 설 수 있는 자리 (땅은 여러 번 넣어 비중을 높임)
  const floor = { x: 0, y: gy, w: mw, floor: 1 };
  const spots = [floor, floor, floor, ...pl2.filter((q) => q.w >= 140)];
  return { type, name: T0.n, mw, mh, gy, pl: pl2, portal: portalAt, spots };
}

function mkPlat(x, y, w, mw) {
  w = Math.round(w);
  return { x: Math.round(cl(x, 20, mw - 20 - w)), y: Math.round(y), w };
}

function walker(cx, gy, top, mw) {
  const out = [];
  let y = gy, dir = R() < 0.5 ? -1 : 1;
  while (y - STEP_UP[1] > top - 40) {
    y -= rr(...STEP_UP);
    if (R() < 0.35) dir = -dir;
    cx += dir * rr(...STEP_SIDE);
    if (cx < 160) { cx = 160 + rr(0, 60); dir = 1; }
    if (cx > mw - 160) { cx = mw - 160 - rr(0, 60); dir = -1; }
    const wide = R() < 0.25; // 가끔 넓은 발판 = 싸울 공간
    const w = wide ? rr(380, 700) : rr(130, 250);
    out.push(mkPlat(cx - w / 2 + rr(-w * 0.3, w * 0.3), y, w, mw));
    // 다음 발판은 방금 만든 발판 위의 한 지점에서 출발
    const q = out[out.length - 1];
    cx = cl(cx, q.x + 40, q.x + q.w - 40);
  }
  return out;
}

// 보스전: 예전처럼 평평한 아레나
function bossArena() {
  const mw = 2600, mh = 540, gy = 470, sd = depth(), pl2 = [];
  for (let k = 0; k < 7; k++) pl2.push({ x: 260 + k * 320 + ((k + sd) % 2) * 40, y: gy - 105 - ((k + sd) % 3) * 50, w: 170 });
  return { type: 'arena', name: '', mw, mh, gy, pl: pl2, portal: { x: mw - 160, y: gy }, spots: [{ x: 0, y: gy, w: mw, floor: 1 }] };
}

// 플레이어와 적당히 떨어진 스폰 자리
function spawnSpot(minD, maxD) {
  const c = [];
  for (const q of map.spots)
    for (let k = 0; k < 2; k++) {
      const x = q.x + rr(30, q.w - 30), d = Math.hypot(x - p.x, (q.y - p.y) * 1.3);
      if (d > minD && d < maxD) c.push({ x, y: q.y });
    }
  return c.length ? pickR(c) : null;
}

// 중력 + 발판 착지 (적, 슬라임 공용). 플레이어와 같은 규칙
function body(o, dt) {
  const py = o.y;
  o.vy = (o.vy || 0) + 1700 * dt;
  o.y += o.vy * dt;
  o.g = 0;
  if (o.dn > 0) o.dn -= dt;
  if (o.y >= GY) { o.y = GY; o.vy = 0; o.g = 1; o.plat = null; o.airJ = o.mAir || 0; return; }
  if (o.vy > 0 && !(o.dn > 0))
    for (const q of pl)
      if (o.x > q.x && o.x < q.x + q.w && py <= q.y && o.y >= q.y) { o.y = q.y; o.vy = 0; o.g = 1; o.plat = q; o.airJ = o.mAir || 0; return; }
  o.plat = null;
}

// 목표가 위에 있으면 '다음에 밟을 발판'을 골라 점프, 아래에 있으면 발판에서 뛰어내림
// o.jx: 지금 향해야 할 x (없으면 목표를 그대로 쫓음)
function chaseJump(o, dt, tx, ty, power) {
  o.jt = (o.jt || 0) - dt;
  if (!o.g) {
    // 다단 점프 (★ 몬스터): 공중에서 한 번 더
    if (o.airJ > 0 && ty < o.y - 60 && o.vy > -150) {
      o.vy = -760; o.airJ--;
      fx.push({ a: [FR.flash[0]], x: o.x, y: o.y, d: 0.12, sz: 70, f: 1, t: 0 });
    }
    return; // 공중에서는 정해둔 방향 유지
  }
  o.jx = null;
  if (ty < o.y - 50) {
    const maxH = (power * power) / 3400 - 15;
    let best = null, bs = 1e9;
    for (const q of pl) {
      const h = o.y - q.y;
      if (h < 30 || h > maxH) continue;
      const hd = Math.abs(cl(o.x, q.x + 15, q.x + q.w - 15) - o.x);
      if (hd > 280) continue;
      const s = Math.abs(cl(tx, q.x, q.x + q.w) - tx) + Math.abs(q.y - ty) * 0.6 + hd * 0.5;
      if (s < bs) { bs = s; best = q; }
    }
    if (!best) return;
    o.jx = cl(tx, best.x + 20, best.x + best.w - 20);
    if (o.jt <= 0 && Math.abs(cl(o.x, best.x, best.x + best.w) - o.x) < 110) {
      o.vy = -Math.min(power, Math.sqrt(3400 * (o.y - best.y + 40)));
      o.jt = o.jcd || 0.7; o.g = 0;
    }
  } else if (ty > o.y + 50 && o.plat && Math.abs(tx - o.x) < 260 && o.jt <= 0) {
    o.dn = 0.3; o.y += 4; o.g = 0; o.jt = 0.5;
  }
}
