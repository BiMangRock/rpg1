// =====================================================================
//  적 AI · 지원형 적 스킬 · 소환수 AI
// =====================================================================

// 적 근처의 소환수 중 가장 가까운 것 (range 안에서)
function nearestSummon(e, range) {
  let best = null, bd = range;
  for (const a of al) {
    if (a.life <= 0) continue;
    const d = Math.abs(a.x - e.x) + Math.abs(a.y - e.y) * 1.5;
    if (d < bd) { bd = d; best = a; }
  }
  return best;
}

// 걷기. keep = 발판 끝에서 멈춤 (거리를 두는 적이 뒷걸음질로 떨어지지 않게)
function stepX(e, dx, keep) {
  const nx = e.x + dx;
  if (e.plat && (keep || !e.jumper) && (nx < e.plat.x + 8 || nx > e.plat.x + e.plat.w - 8)) return;
  e.x = nx;
}
// 발판으로 올라가는 중이면 그쪽으로 이동하고 true
function climb(e, spd, dt) {
  if (e.jx == null) return false;
  const mdx = e.jx - e.x;
  e.dir = mdx > 0 ? 1 : -1;
  if (Math.abs(mdx) > 4) stepX(e, e.dir * Math.min(spd * dt, Math.abs(mdx)));
  return true;
}

// ★ 몬스터 특수 능력 (매 프레임)
function starAI(e, dt, dx) {
  const A = e.af, mh = e.mh, cy = e.y - e.h / 2;
  if (A.has('regen') && e.hp < mh) e.hp = Math.min(mh, e.hp + mh * 0.025 * dt);
  if (A.has('holy') && (e.hsT -= dt) <= 0) {
    e.hsT = 9; e.shd = mh * 0.3; e.shdT = 6;
    wave(e.x, cy, '#6ab4ff', 120);
  }
  if (A.has('wave') && (e.wvT -= dt) <= 0 && Math.hypot(dx, p.y - e.y) < 650) {
    // 용사의 검기: 3갈래
    e.wvT = 2.6;
    const ang = Math.atan2(p.y - 50 - (e.y - e.h * 0.6), dx);
    for (const o of [-0.14, 0, 0.14])
      eb.push({ x: e.x, y: e.y - e.h * 0.6, vx: Math.cos(ang + o) * 380, vy: Math.sin(ang + o) * 380, life: 2.5, d: e.dmg * 0.7, r: 12, c: '#9ad8ff', src: e });
  }
  if (A.has('blink') && (e.blT -= dt) <= 0 && Math.hypot(dx, p.y - e.y) > 420) {
    e.blT = 6;
    wave(e.x, cy, '#c08aff', 90);
    e.x = cl(p.x + (R() < 0.5 ? -1 : 1) * rr(120, 180), 20, WW - 20); e.y = p.y - 10; e.vy = 0;
    wave(e.x, e.y - e.h / 2, '#c08aff', 90);
  }
  if (A.has('chain') && (e.chT = (e.chT ?? 2) - dt) <= 0 && Math.hypot(dx, p.y - e.y) < 380) {
    // 번개: 마왕에게 직접 번개
    e.chT = 3.5;
    zp.push({ x1: e.x, y1: cy, x2: p.x, y2: p.y - 50, t: 0 });
    hurtP(e.dmg * 0.6, e);
  }
  if (e.hp < mh * 0.5) {
    if (A.has('rage') && !e.rg) { e.rg = 1; txt(e.x, e.y - e.h - 30, '광폭!', '#ff4a4a'); }
    if (A.has('call') && !e.called) {
      e.called = 1;
      txt(e.x, e.y - e.h - 30, '호출!', '#ffa040');
      for (const d of [-1, 1]) spawn(pickR(stageDef().pool), cl(e.x + d * 70, 20, WW - 20), { y: e.y, nostar: 1 });
    }
  }
}

function updEnemies(dt) {
  for (const e of en) {
    e.fl -= dt; e.ph += dt * 3; e.ac -= dt; e.bf -= dt; e.cast -= dt;
    if (e.ev) { e.evT -= dt; e.evCd -= dt; if (e.ghost) e.ghost.t -= dt; }
    if (e.shdT > 0 && (e.shdT -= dt) <= 0) e.shd = 0;
    // 화상 / 독: 0.5초마다 피해
    if (e.burnT > 0 || e.psnT > 0) {
      e.burnT -= dt; e.psnT -= dt;
      e.dotT = (e.dotT ?? 0.5) - dt;
      if (e.dotT <= 0) {
        e.dotT = 0.5;
        if (e.burnT > 0) hit(e, e.burnD * 0.5, 0, false, 'burn');
        if (e.psnT > 0 && !e.dead) hit(e, e.psnD * e.psnS * 0.5, 0, false, 'psn');
      }
      if (e.dead) continue;
    }
    if (e.t !== 'boss' && !e.D.fly && e.D.ai !== 'crystal') body(e, dt);
    // 기절 (3연타 마지막 타격)
    if (e.stn > 0) {
      e.stn -= dt;
      e.x += e.kx * dt; e.kx *= Math.pow(0.02, dt);
      continue;
    }
    // 빙결: 아무것도 못 함
    if (e.frz > 0) {
      e.frz -= dt;
      e.x += e.kx * dt; e.kx *= Math.pow(0.02, dt);
      continue;
    }
    if (e.slow > 0) e.slow -= dt;
    const dx = p.x - e.x, ai = e.D.ai;
    if (e.af) starAI(e, dt, dx);
    const spd = e.sp * (e.bf > 0 ? 1.5 : 1) * (e.rg ? 1.3 : 1), dmg = e.dmg * (e.bf > 0 ? 1.4 : 1) * (e.rg ? 1.5 : 1);

    if (e.t === 'boss') bossAI(e, e.slow > 0 ? dt * 0.5 : dt, dx);
    else if (ai === 'crystal') { /* 제자리 */ }
    else if (ai === 'wisp') {
      // 빛의 정령: 플레이어나 소환수에게 날아감
      const a = nearestSummon(e, Math.abs(dx));
      const tx2 = a ? a.x : p.x, ty = a ? a.y - a.h / 2 : p.y - 50;
      const ang = Math.atan2(ty - (e.y - e.h / 2), tx2 - e.x);
      e.x += Math.cos(ang) * spd * dt;
      e.y = cl(e.y + (Math.sin(ang) * spd + Math.sin(e.ph * 2) * 30) * dt, 60, GY);
      e.dir = Math.cos(ang) > 0 ? 1 : -1;
      // 불의 정령: 가끔 작은 화염구 발사
      if (e.D.el === 'fire' && (e.shT = (e.shT ?? rr(1, 2)) - dt) <= 0 && Math.hypot(dx, p.y - e.y) < 460) {
        e.shT = rr(2.2, 3);
        const a2 = Math.atan2(p.y - 50 - (e.y - e.h / 2), dx);
        eb.push({ x: e.x, y: e.y - e.h / 2, vx: Math.cos(a2) * 300, vy: Math.sin(a2) * 300, life: 2.2, d: e.dmg * 0.7, r: 6, c: '#ff7a3a', el: 'fire', src: e });
      }
    } else if (ai === 'support') {
      // 지원형: 플레이어와 거리를 두고 주기적으로 스킬 사용
      const ad = Math.abs(dx);
      chaseJump(e, dt, p.x, p.y, e.jp);
      if (!climb(e, spd, dt)) {
        e.dir = dx > 0 ? 1 : -1;
        stepX(e, (ad < 260 ? -e.dir : ad > 380 ? e.dir : 0) * spd * dt, true);
      }
      e.cd -= dt;
      if (e.cd <= 0 && ad < 700) support(e);
      // 법사: 연속 시전 대기열
      if (e.mq?.length) for (const q of e.mq) if ((q.t -= dt) <= 0) { q.done = 1; mageSpell(e, q.k, e.star || 0); }
      if (e.mq) e.mq = e.mq.filter((q) => !q.done);
    } else {
      // 근접형 / 궁수: 가까운 소환수가 있으면 그쪽을 노림
      const a = nearestSummon(e, Math.min(320, Math.abs(dx) + Math.abs(p.y - e.y) * 1.5));
      const tdx = (a ? a.x : p.x) - e.x;
      chaseJump(e, dt, a ? a.x : p.x, a ? a.y : p.y, e.jp);
      if (ai === 'archer') {
        const ty = a ? a.y - a.h / 2 : p.y - 50, ad = Math.abs(tdx);
        if (!climb(e, spd, dt)) {
          e.dir = tdx > 0 ? 1 : -1;
          stepX(e, (ad < 240 ? -e.dir : ad > 340 ? e.dir : 0) * spd * dt, true);
        }
        e.sh -= dt * (e.bf > 0 ? 1.5 : 1);
        if (e.sh <= 0 && ad < 520) {
          e.sh = 2.2;
          const ang = Math.atan2(ty - (e.y - 45), tdx);
          eb.push({ x: e.x, y: e.y - 45, vx: Math.cos(ang) * 280, vy: Math.sin(ang) * 280, life: 3, d: dmg, ar: 1, src: e });
        }
      } else {
        if (!climb(e, spd, dt)) {
          e.dir = tdx > 0 ? 1 : -1;
          if (!a || Math.abs(tdx) > (e.w + a.w) / 2 - 8) stepX(e, e.dir * spd * dt);
        }
        // 닌자: 수리검 투척
        if (e.t === 'ninja' && (e.shT -= dt) <= 0) {
          const ad = Math.hypot(dx, p.y - e.y);
          if (ad > 140 && ad < 520) {
            e.shT = rr(1.8, 2.6);
            const ang = Math.atan2(p.y - 50 - (e.y - e.h * 0.6), dx);
            for (const o of [-0.1, 0.1]) eb.push({ x: e.x, y: e.y - e.h * 0.6, vx: Math.cos(ang + o) * 430, vy: Math.sin(ang + o) * 430, life: 2, d: dmg * 0.6, r: 6, c: '#d8dde8', sk: 1, src: e });
          }
        }
      }
    }
    if (e.t !== 'boss') e.x = cl(e.x, 20, WW - 20);
    e.x += e.kx * dt;
    e.kx *= Math.pow(0.02, dt);

    if (e.dmg > 0) {
      // 소환수 공격
      if (e.ac <= 0)
        for (const a of al)
          if (a.life > 0 && Math.abs(a.x - e.x) < (e.w + a.w) / 2 + 4 && a.y > e.y - e.h && a.y - a.h < e.y + 4) {
            hurtA(a, dmg * (e.t === 'boss' ? 1.5 : 0.7));
            e.ac = e.t === 'boss' ? 0.4 : 0.9;
            break;
          }
      // 플레이어 몸통 박치기
      if (p.inv <= 0 && p.st !== 'dead' && Math.abs(dx) < (e.w + 30) / 2 && p.y > e.y - e.h && p.y - 90 < e.y) {
        hurtP(dmg, e);
        if (T.thorns && !e.dead) hit(e, dm() * T.thorns, -e.dir * 200, false, 'th');
      }
    }
  }
  en = en.filter((e) => !e.dead);
}

// ----- 지원형 적 스킬 -----
function support(e) {
  const near = en.filter((o) => !o.dead && o.D.ai !== 'crystal' && !o.D.minion && Math.abs(o.x - e.x) < 340);
  e.cd = e.D.cd * rr(0.9, 1.1);
  if (e.t === 'summoner') return mageCast(e);
  e.cast = 0.6;
  const cy = e.y - e.h / 2;

  if (e.t === 'cleric') {
    // 주변 아군 회복 (보스는 조금만)
    const hurt = near.filter((o) => o.hp < o.mh);
    if (!hurt.length) { e.cd = 1; e.cast = 0; return; }
    for (const o of hurt) {
      const v = o.mh * (o.t === 'boss' ? 0.02 : 0.22);
      o.hp = Math.min(o.mh, o.hp + v);
      txt(o.x, o.y - o.h - 8, '+' + Math.round(v), '#7aff8a');
    }
    wave(e.x, cy, '#7aff8a', 340);
  } else if (e.t === 'bard') {
    // 주변 아군 5초간 이동속도 +50%, 공격력 +40%
    for (const o of near) o.bf = 5;
    wave(e.x, cy, '#ffa040', 340);
    txt(e.x, e.y - e.h - 12, '돌격하라!', '#ffa040');
  } else if (e.t === 'warden') {
    // 체력 많은 아군 2명에게 보호막 (8초)
    const tg = near.filter((o) => o.shd <= 0).sort((a, b) => b.mh - a.mh).slice(0, 2);
    if (!tg.length) { e.cd = 1.5; e.cast = 0; return; }
    for (const o of tg) {
      o.shd = o.mh * (o.t === 'boss' ? 0.06 : 0.5);
      o.shdT = 8;
      txt(o.x, o.y - o.h - 12, '보호막', '#8ac8ff');
    }
    wave(e.x, cy, '#6ab4ff', 340);
  }
}

// ----- 소환수 AI -----
function updSummons(dt) {
  for (const a of al) {
    const D = a.d;
    a.ph += dt * 3; a.cd -= dt; a.iv -= dt; a.fl -= dt; a.st -= dt;
    // 너무 멀어지면 마왕 곁으로 순간이동
    if (Math.hypot(a.x - p.x, a.y - p.y) > 750) {
      a.x = cl(p.x + a.o, 20, WW - 20); a.y = a.air ? p.y - 80 : p.y; a.vy = 0;
      fx.push({ a: [FR.exp[1], FR.exp[2]], x: a.x, y: a.y - 16, d: 0.06, sz: 60, f: 1, t: 0 });
    }
    // 목표: 가까운 적 (지상형은 날아다니는 적과 너무 높은 곳의 적은 무시)
    let tg = null, bd = 450;
    for (const e of en) {
      if (e.dead || (!a.air && (e.D.fly || e.y < a.y - 260))) continue;
      const d = Math.abs(e.x - a.x) + Math.abs(e.y - a.y) * 0.8;
      if (d < bd) { bd = d; tg = e; }
    }
    const tx = tg ? tg.x : p.x + a.o;
    if (!a.air) chaseJump(a, dt, tx, tg ? tg.y : p.y, 900);
    const dx = (a.jx != null ? a.jx : tx) - a.x;
    a.dir = dx > 0 ? 1 : -1;
    // 원거리형은 일정 거리에서 멈추고 쏨
    const keep = D.shot && tg ? 160 : 0;
    if ((tg || a.jx != null || Math.abs(dx) > 60) && Math.abs(dx) > keep) a.x += a.dir * Math.min(a.sp * dt, Math.abs(dx));
    a.x = cl(a.x, 20, WW - 20);
    if (a.air) a.y += ((tg ? tg.y - tg.h / 2 - (D.shot ? 70 : 0) : p.y - 90) + Math.sin(a.ph) * 12 - a.y) * dt * 3;
    else body(a, dt);
    const dmgA = dm() * T.sm * D.dm;
    // 원거리 발사 (가고일·와이번·흑룡)
    if (D.shot && tg && a.st <= 0 && Math.hypot(tg.x - a.x, tg.y - a.y) < 460) {
      a.st = 1.4;
      const ang = Math.atan2(tg.y - tg.h / 2 - (a.y - a.h / 2), tg.x - a.x);
      for (let i = 0; i < D.shot; i++) {
        const o = (i - (D.shot - 1) / 2) * 0.15;
        pr.push({ ab: 1, x: a.x, y: a.y - a.h / 2, vx: Math.cos(ang + o) * 520, vy: Math.sin(ang + o) * 520, life: 1.2, a: 0, dmg: dmgA * 0.6, r: 7, c: D.burn ? '#ff7a3a' : '#c08aff', burn: D.burn });
      }
    }
    // 근접 공격 (aoe: 주변 적 모두)
    if (tg && a.cd <= 0 && Math.abs(tg.x - a.x) < (tg.w + a.w) / 2 + 4 && Math.abs(tg.y - tg.h / 2 - (a.y - a.h / 2)) < (tg.h + a.h) / 2) {
      a.cd = 0.5;
      const list = D.aoe ? en.filter((e) => !e.dead && Math.hypot(e.x - a.x, e.y - a.y) < a.w + 50) : [tg];
      if (D.aoe) wave(a.x, a.y - a.h / 2, '#c08aff', a.w + 50);
      for (const e of list) {
        hit(e, dmgA, a.dir * 120, false, 'sm');
        if (D.burn && !e.dead) { e.burnT = 3; e.burnD = dmgA * 0.3; }
      }
    }
  }
  al = al.filter((a) => a.life > 0);
}


// ----- 소환술사(법사): 정령 소환 + 원소 마법 -----
// ★이 붙을수록: 시전 간격 짧아짐 (★5 ≈ 2.2배 자주), 한 번에 여러 마법, 발수·정령 수 증가, 새 마법 해금
//   기본: 빛의 정령 / 원소 정령 / 화염구 / 물결   ★2+: 가시덩굴   ★3+: 불비   (★3 2연속 시전, ★5 3연속)
const MAGE_SPELL = {
  wisp: ['빛의 정령!', '#fff0a0'], spirit: ['정령 소환!', '#c08aff'], fire: ['화염구!', '#ff7a3a'],
  water: ['물결!', '#6ab4ff'], wood: ['가시덩굴!', '#7ad06a'], meteor: ['불비!', '#ff5a2a'],
};
function mageCast(e) {
  const s = e.star || 0, cy = e.y - e.h / 2;
  e.cd = e.D.cd * rr(0.9, 1.1) / (1 + s * 0.25);
  const list = ['wisp', 'spirit', 'fire', 'fire', 'water', 'water'];
  if (s >= 2) list.push('wood', 'wood');
  if (s >= 3) list.push('meteor', 'meteor');
  // 정령이 이미 많으면 소환 대신 공격 마법
  const mine = en.filter((o) => o.owner === e && !o.dead).length, cap = 4 + s;
  const pool = mine >= cap ? list.filter((k) => k !== 'wisp' && k !== 'spirit') : list;
  const n = 1 + (s >= 3 ? 1 : 0) + (s >= 5 ? 1 : 0), used = [];
  for (let i = 0; i < n; i++) {
    let k, tries = 0;
    do k = pickR(pool); while (used.includes(k) && ++tries < 10);
    used.push(k);
    (e.mq ||= []).push({ k, t: i * 0.45 });
  }
  e.cast = 0.6 + (n - 1) * 0.45;
  wave(e.x, cy, '#c08aff', 120);
}
function mageSpell(e, k, s) {
  const cy = e.y - e.h / 2, ox = e.x, oy = e.y - e.h * 0.7, d = e.dmg;
  txt(e.x, e.y - e.h - 14, MAGE_SPELL[k][0], MAGE_SPELL[k][1]);
  if (k === 'wisp') {
    // 빛의 정령 2마리 (+★2마다 1)
    for (let i = 0; i < 2 + (s >> 1); i++) spawn('wisp', e.x + (i - 0.5) * 30, { y: e.y - e.h - 10, owner: e });
    wave(e.x, cy, '#fff0a0', 140);
  } else if (k === 'spirit') {
    // 불·물·나무 정령 중 랜덤 1마리 (★3부터 2마리)
    for (let i = 0; i < 1 + (s >= 3 ? 1 : 0); i++) spawn(pickR(['fsp', 'wsp', 'tsp']), e.x + (i ? 30 : -30), { y: e.y - e.h - 10, owner: e });
    wave(e.x, cy, '#c08aff', 160);
  } else if (k === 'fire') {
    // 화염구 부채꼴 3발 (+★마다 1발)
    const c = 3 + s, ang = Math.atan2(p.y - 50 - oy, p.x - ox);
    for (let i = 0; i < c; i++) {
      const o = (i - (c - 1) / 2) * 0.16;
      eb.push({ x: ox, y: oy, vx: Math.cos(ang + o) * 320, vy: Math.sin(ang + o) * 320, life: 2.6, d: d * 0.8, r: 9, c: '#ff7a3a', el: 'fire', src: e });
    }
  } else if (k === 'water') {
    // 물결: 세로로 늘어선 물방울 벽이 마왕 쪽으로 밀려옴 (점프로 넘기) — ★2부터 높이 +1, ★4부터 반대쪽에서도
    const dir = p.x > e.x ? 1 : -1, rows = 4 + (s >= 2 ? 1 : 0), by = p.y - 12;
    const sides = s >= 4 ? [[e.x, dir], [cl(p.x + dir * 520, 20, WW - 20), -dir]] : [[e.x, dir]];
    for (const [sx, sd] of sides)
      for (let i = 0; i < rows; i++)
        eb.push({ x: sx, y: by - i * 24, vx: sd * 280, vy: 0, life: 3, d: d * 0.6, r: 10, c: '#4aa8ff', el: 'water', src: e });
  } else if (k === 'wood') {
    // 가시덩굴: 마왕 발밑에 경고 후 솟아오름 (★마다 범위 증가)
    const c = 1 + ((s - 1) >> 1) * 2;
    for (let i = 0; i < c; i++) hz.push({ x: cl(p.x + (i - (c - 1) / 2) * 100, 30, WW - 30), y: p.y, t: -0.85, d: d * 1.1, el: 'wood' });
  } else if (k === 'meteor') {
    // 불비: 하늘에서 화염구가 쏟아짐
    for (let i = 0; i < 3 + s; i++)
      eb.push({ x: cl(p.x + rr(-220, 220), 20, WW - 20), y: p.y - 520 - rr(0, 200), vx: rr(-30, 30), vy: 330, life: 4, d: d * 0.9, r: 11, c: '#ff5a2a', el: 'fire', src: e });
  }
}
