// =====================================================================
//  적 AI · 지원형 적 스킬 · 소환수 AI
// =====================================================================

// 적 근처의 소환수 중 가장 가까운 것 (range 안에서)
function nearestSummon(e, range) {
  let best = null, bd = range;
  for (const a of al) {
    if (a.life <= 0) continue;
    const d = Math.abs(a.x - e.x);
    if (d < bd) { bd = d; best = a; }
  }
  return best;
}

function updEnemies(dt) {
  for (const e of en) {
    e.fl -= dt; e.ph += dt * 3; e.ac -= dt; e.bf -= dt; e.cast -= dt;
    if (e.shdT > 0 && (e.shdT -= dt) <= 0) e.shd = 0;
    const dx = p.x - e.x, ai = e.D.ai;
    const spd = e.sp * (e.bf > 0 ? 1.5 : 1), dmg = e.dmg * (e.bf > 0 ? 1.4 : 1);

    if (e.t === 'boss') bossAI(e, dt, dx);
    else if (ai === 'crystal') { /* 제자리 */ }
    else if (ai === 'wisp') {
      // 빛의 정령: 플레이어나 소환수에게 날아감
      const a = nearestSummon(e, Math.abs(dx));
      const tx2 = a ? a.x : p.x, ty = a ? a.y - a.h / 2 : p.y - 50;
      const ang = Math.atan2(ty - (e.y - e.h / 2), tx2 - e.x);
      e.x += Math.cos(ang) * spd * dt;
      e.y = cl(e.y + (Math.sin(ang) * spd + Math.sin(e.ph * 2) * 30) * dt, 60, GY);
      e.dir = Math.cos(ang) > 0 ? 1 : -1;
    } else if (ai === 'support') {
      // 지원형: 플레이어와 거리를 두고 주기적으로 스킬 사용
      const ad = Math.abs(dx);
      e.dir = dx > 0 ? 1 : -1;
      e.x += (ad < 260 ? -e.dir : ad > 380 ? e.dir : 0) * spd * dt;
      e.cd -= dt;
      if (e.cd <= 0 && ad < 700) support(e);
    } else {
      // 근접형 / 궁수: 가까운 소환수가 있으면 그쪽을 노림
      const a = nearestSummon(e, Math.min(320, Math.abs(dx)));
      const tdx = (a ? a.x : p.x) - e.x;
      if (ai === 'archer') {
        const ty = a ? a.y - a.h / 2 : p.y - 50, ad = Math.abs(tdx);
        e.dir = tdx > 0 ? 1 : -1;
        e.x += (ad < 240 ? -e.dir : ad > 340 ? e.dir : 0) * spd * dt;
        e.sh -= dt * (e.bf > 0 ? 1.5 : 1);
        if (e.sh <= 0 && ad < 520) {
          e.sh = 2.2;
          const ang = Math.atan2(ty - (e.y - 45), tdx);
          eb.push({ x: e.x, y: e.y - 45, vx: Math.cos(ang) * 280, vy: Math.sin(ang) * 280, life: 3, d: dmg, ar: 1 });
        }
      } else {
        e.dir = tdx > 0 ? 1 : -1;
        if (!a || Math.abs(tdx) > (e.w + a.w) / 2 - 8) e.x += e.dir * spd * dt;
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
        hurtP(dmg);
        if (T.thorns && !e.dead) hit(e, dm() * T.thorns, -e.dir * 200);
      }
    }
  }
  en = en.filter((e) => !e.dead);
}

// ----- 지원형 적 스킬 -----
function support(e) {
  const near = en.filter((o) => !o.dead && o.D.ai !== 'crystal' && o.t !== 'wisp' && Math.abs(o.x - e.x) < 340);
  e.cd = e.D.cd * rr(0.9, 1.1);
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
  } else if (e.t === 'summoner') {
    // 빛의 정령 2마리 (최대 4마리)
    const mine = en.filter((o) => o.owner === e && !o.dead).length;
    if (mine >= 4) { e.cd = 1.5; e.cast = 0; return; }
    for (let i = 0; i < 2; i++) spawn('wisp', e.x + (i ? 24 : -24), { y: e.y - e.h - 10, owner: e });
    wave(e.x, cy, '#c08aff', 140);
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
    a.ph += dt * 3; a.cd -= dt; a.iv -= dt; a.fl -= dt;
    let tg = null, bd = 450;
    for (const e of en) {
      if (e.dead || (a.t === 'slime' && e.D.fly)) continue; // 슬라임은 날아다니는 적을 못 쫓음
      const d = Math.abs(e.x - a.x);
      if (d < bd) { bd = d; tg = e; }
    }
    const dx = (tg ? tg.x : p.x + a.o) - a.x;
    a.dir = dx > 0 ? 1 : -1;
    if (tg || Math.abs(dx) > 60) a.x += a.dir * a.sp * dt;
    a.x = cl(a.x, 20, WW - 20);
    if (a.t === 'bat') a.y += ((tg ? tg.y - tg.h / 2 : p.y - 90) + Math.sin(a.ph) * 12 - a.y) * dt * 3;
    if (tg && a.cd <= 0 && Math.abs(tg.x - a.x) < (tg.w + a.w) / 2 + 4 && Math.abs(tg.y - tg.h / 2 - (a.y - a.h / 2)) < (tg.h + a.h) / 2) {
      a.cd = 0.5;
      hit(tg, dm() * T.sm * (a.t === 'bat' ? 0.7 : 1), a.dir * 120);
    }
  }
  al = al.filter((a) => a.life > 0);
}
