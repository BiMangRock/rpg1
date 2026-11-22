// =====================================================================
//  화면 메뉴 — 타이틀, 키 설정, 일시정지, 레벨업, 유물, 정비(상점·장비·유물), 결과
// =====================================================================
let shopNote = '';
let KB = { ...KD }, wait = null, back = 'title', shopTab = 'shop';
try { Object.assign(KB, JSON.parse(localStorage.getItem('maou_kb2') || '{}')); } catch (x) {}

const kl = (k) => ({ ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }[k] || String(k).replace(/^(Key|Digit)/, ''));
const show = (h, panel) => { ov.innerHTML = emo(h); ov.className = panel ? 'panel' : ''; ov.style.display = 'flex'; ov.scrollTop = 0; };
const hide = () => (ov.style.display = 'none');

// ----- 타이틀 / 키 설정 -----
function title() {
  show(`<h1>마왕 연대기</h1>
  <p>용사 일행을 처단하고 세상을 지배하라.<br>
  ${kl(KB.L)} ${kl(KB.R)} 이동 · ${kl(KB.jmp)} 점프 (${kl(KB.dn)}+점프: 아래로) · ${kl(KB.por)} 포털·보물상자 · ${kl(KB.sum)} 소환 · ${kl(KB.inv)} 장비창<br>
  좌클릭 검 (커서 쪽으로 베기) · 우클릭 마법 (커서 방향) · 꾹 누르면 연속 공격<br>
  <small>키보드로도 가능: ${kl(KB.atk)} 검 · ${kl(KB.mag)} 마법 · Esc 일시정지</small></p>
  <div class=row><button onclick="start()">모험 시작</button><button onclick="ks('title')">키 설정</button></div>`);
}

function ks(f) {
  if (f) back = f;
  show(`<h1>키 설정</h1><p>바꿀 항목을 누른 뒤 새 키를 누르세요 (Esc 취소)</p>
  <div class=row>${Object.keys(KN).map((a) => `<button onclick="rb('${a}')">${KN[a]}: <b>${wait === a ? '...' : kl(KB[a])}</b></button>`).join('')}</div>
  <div class=row><button onclick="kreset()">초기화</button><button onclick="bk()">${back === 'pause' ? '돌아가기' : '뒤로'}</button></div>`);
}
function rb(a) { wait = a; ks(); }
function kreset() { KB = { ...KD }; try { localStorage.removeItem('maou_kb2'); } catch (x) {} ks(); }
function bk() { back === 'pause' ? pauseM() : title(); }

// ----- 일시정지 -----
function pauseM() {
  state = 'pause'; mb = {};
  show(`<h1>일시정지</h1><p>${stageLabel()} ${stageDef().n} · Lv.${lvl} · <span class=gold>${gold} G</span></p>
  <div class=row><button onclick="resume()">계속하기</button><button onclick="invMenu()">장비창 (${kl(KB.inv)})</button><button onclick="ks('pause')">키 설정</button></div>`);
}

// ----- 장비창: 게임 중 언제든 (I키) -----
let invTab = 'equip';
function invMenu(tab) {
  state = 'inv'; mb = {};
  if (tab) invTab = tab;
  const tabs = [['equip', `장비 (${inv.length})`], ['relic', `유물·보석 (${relics.length}·${gems.length}/${GEMS.length})`]]
    .map(([k, n]) => `<button class="${invTab === k ? 'on' : ''}" onclick="invMenu('${k}')">${n}</button>`).join('');
  show(`<h2>장비창</h2><p>${stageLabel()} ${stageDef().n} · Lv.${lvl} · HP ${Math.ceil(p.hp)}/${Math.round(T.maxhp)} · <span class=gold>${gold} G</span></p>
  <div class=tabs>${tabs}</div>${invTab === 'equip' ? equipHTML() : relicHTML()}
  <div class=row><button class=go onclick="resume()">닫기 (${kl(KB.inv)} / Esc)</button></div>`, true);
}
function resume() { hide(); state = 'play'; }
function start() { hide(); newRun(); state = 'play'; }

// ----- 레벨업 -----
function menu() {
  state = 'lvl'; mb = {};
  // 선택지 3개: 이미 고른 적 있는 강화 2개 + 랜덤 1개 (빌드가 흩어지지 않게)
  //  고른 강화가 2개보다 적으면 남는 자리는 랜덤으로 채움. 랜덤은 가중치(w) 비례
  const ok = (i) => !UPGRADES[i].max || (upc[i] || 0) < UPGRADES[i].max;
  const roll = (cand) => {
    let r = R() * cand.reduce((s, i) => s + (UPGRADES[i].w || 1), 0), j = 0;
    while ((r -= UPGRADES[cand[j]].w || 1) > 0) j++;
    return cand.splice(Math.min(j, cand.length - 1), 1)[0];
  };
  const owned = UPGRADES.map((_, i) => i).filter((i) => upc[i] > 0 && ok(i));
  const fresh = UPGRADES.map((_, i) => i).filter((i) => !(upc[i] > 0) && ok(i));
  opts = [];
  while (opts.length < 2 && owned.length) opts.push(roll(owned));
  // 나머지는 전체에서 랜덤 (이미 뜬 것 제외)
  const rest = [...owned, ...fresh];
  while (opts.length < 3 && rest.length) opts.push(roll(rest));
  show(`<h1>LEVEL UP!</h1><p>Lv.${lvl} · 강화를 선택하세요 (1~3 키)</p>
  <div class=row>${opts.map((k, i) => `<button class=up onclick="pickUp(${i})"><b>${i + 1}. ${UPGRADES[k].n}</b><small>${upc[k] ? `보유 ${upc[k]}단계` : '<span class=gold>새 강화</span>'}${UPGRADES[k].sum ? ` · 소환 Lv ${summonLv()}→${summonLv() + 1 + (UPGRADES[k].n.includes('숙련') ? 1 : 0)}` : ''}</small></button>`).join('')}</div>`);
}
function pickUp(i) {
  if (state !== 'lvl') return;
  const k = opts[i];
  UPGRADES[k].f();
  if (UPGRADES[k].sum) S.slv++; // 소환 계열은 소환 레벨 +1
  upc[k] = (upc[k] || 0) + 1;
  recalc();
  hide(); state = 'play';
  chk();
}

// ----- 보스 클리어 보상: 유물 선택 -----
function relicMenu() {
  relicOpts = shuffle(RELICS.filter((r) => !relics.includes(r.id))).slice(0, 3);
  if (!relicOpts.length) return shopMenu('shop', true);
  state = 'relic'; ban = null;
  show(`<h1>클리어 보상</h1><p>${WORLDS[cur.w].n} 정복! 유물 하나를 선택하세요 (1~3 키) — 장착 없이 영구 적용</p>${clearMsg ? `<p class=gold>${clearMsg}</p>` : ''}
  <div class=grid>${relicOpts.map((r, i) => `<div class="card relic" onclick="pickRelic(${i})"><small>유물 ${i + 1}</small><div class=ch>${icImg(relicIcon(r), 'icn')}<b>${r.n}</b></div><div class=d>${r.d}</div><button>선택</button></div>`).join('')}</div>`, true);
}
function pickRelic(i) {
  if (state !== 'relic' || !relicOpts[i]) return;
  relics.push(relicOpts[i].id);
  recalc();
  shopMenu('shop', true);
}

// ----- 정비 화면 (스테이지 사이) -----
// 상점 상품은 맵이 바뀔 때마다 새로 바뀜. 🔒 잠근 상품은 사거나 잠금을 풀 때까지 계속 남아 있음.
const priceOf = (it) => Math.round(it.price * (1 - T.disc));
const lockCost = (it) => Math.max(10, Math.round(priceOf(it) * 0.1));
const rerollCost = () => (rerollN < T.freeroll ? 0 : REROLL_PRICE + (rerollN - T.freeroll) * 10);

function rollStock() {
  lockd = lockd.filter((id) => !inv.includes(id));
  const cap = tierCap(nextCur());
  const pool = shuffle(ITEMS.filter((i) => i.tier <= cap && !inv.includes(i.id) && !lockd.includes(i.id)));
  stock = [...lockd, ...pool.slice(0, Math.max(0, SHOP_SIZE - lockd.length)).map((i) => i.id)];
}

function shopMenu(tab, fresh) {
  state = 'shop'; mb = {}; ban = null;
  if (fresh) { rollStock(); rerollN = 0; shopNote = ''; }
  if (tab) shopTab = tab;
  const nc = nextCur(), nd = stageDef(nc);
  const tabs = [['shop', '상점'], ['equip', '장비'], ['relic', `유물·보석 (${gems.length}/${GEMS.length})`]]
    .map(([k, n]) => `<button class="${shopTab === k ? 'on' : ''}" onclick="shopMenu('${k}')">${n}</button>`).join('');
  const body = shopTab === 'shop' ? shopHTML() : shopTab === 'equip' ? equipHTML() : relicHTML();
  show(`<h2>정비 시간</h2>
  <p>다음: <b>${stageLabel(nc)} ${nd.n}</b>${isBossStage(nc) ? ' · <span class=warn>보스전!</span>' : ''}
   · HP ${Math.ceil(p.hp)}/${Math.round(T.maxhp)} · <span class=gold>${gold} G</span></p>
  ${clearMsg ? `<p class=gold>클리어 정산: ${clearMsg}</p>` : ''}${shopNote ? `<p class=grow>${shopNote}</p>` : ''}
  <div class=tabs>${tabs}</div>${body}
  <div class=row><button class=go onclick="nextStage()">다음 스테이지 ▶ (Enter)</button></div>`, true);
}

const card = (it, btn, cls = '') => {
  const L = upg[it.id] || 0;
  return `<div class="card t${it.tier} ${cls}"><small>${SLOT[it.slot]} · <span class=tier>${'★'.repeat(it.tier)} ${TIER_NAME[it.tier]}</span></small>` +
    `<div class=ch>${icImg(itemIcon(it), 'icn')}<b>${baseName(it)}${L ? ` <span class=upg>+${L}</span>` : ''}</b></div><div class=d>${it.d}${L ? `<br><span class=upg>강화 효과 ×${(1 + UPG_STEP * L).toFixed(2)}${L >= 3 ? ' · 개수형 +' + Math.floor(L / 3) : ''}</span>` : ''}${it.sd ? `<br><span class=grow>${it.sd(stk[it.id])}</span>` : ''}</div>${btn}</div>`;
};
// 강화 비용 / 장신구 칸 확장 비용
const upgCost = (id) => Math.round(ITEM[id].price * UPG_COST * ((upg[id] || 0) + 1) * (1 - T.disc));
const slotCost = () => ACC_SLOT_PRICE[accN - ACC_BASE - (gemAll() ? 1 : 0)];

function shopHTML() {
  const items = stock.map((id) => {
    const it = ITEM[id];
    if (inv.includes(id)) return card(it, '<button disabled>구매 완료</button>', 'sold');
    const locked = lockd.includes(id);
    const lockBtn = locked
      ? `<button class=lock onclick="toggleLock('${id}')" title="잠금 해제 (무료)">🔒 잠김</button>`
      : `<button class=lock ${gold < lockCost(it) ? 'disabled' : ''} onclick="toggleLock('${id}')" title="다음 맵에서도 이 상품 유지">🔓 ${lockCost(it)}G</button>`;
    const pr2 = priceOf(it);
    return card(it, `<div class=btns><button ${gold < pr2 ? 'disabled' : ''} onclick="buy('${id}')">${pr2 < it.price ? `<s>${it.price}</s> ` : ''}${pr2} G 구매</button>${lockBtn}</div>`, locked ? 'locked' : '');
  }).join('');
  const full = p.hp >= T.maxhp;
  const potion = `<div class="card t0"><small>소모품</small><b>회복 물약</b><div class=d>HP를 전부 회복합니다.</div>
    <button ${gold < POTION_PRICE || full ? 'disabled' : ''} onclick="buyPotion()">${full ? 'HP 가득' : POTION_PRICE + ' G 구매'}</button></div>`;
  const sc = slotCost();
  const slotCard = sc ? `<div class="card t0"><small>장비칸</small><b>장신구 칸 확장</b><div class=d>장신구를 ${accN + 1}개까지 장착 (현재 ${accN}칸)</div>
    <button ${gold < sc ? 'disabled' : ''} onclick="buySlot()">${sc} G 구매</button></div>` : '';
  return `<div class=grid>${items || '<p>더 살 수 있는 장비가 없어요.</p>'}${potion}${slotCard}</div>
  <div class=row><button ${gold < rerollCost() ? 'disabled' : ''} onclick="reroll()">상품 새로고침 (${rerollCost() ? rerollCost() + ' G' : '무료'}) — 잠근 상품은 유지</button></div>
  <p><small>상품은 맵마다 바뀝니다. 마음에 드는 상품은 🔓 잠금(가격의 10%)하면 다음 맵에서도 남아 있어요.<br>
  가진 장비는 [장비] 탭에서 <b>강화</b>할 수 있어요 (최대 +${UPG_MAX}, 단계마다 효과 +${UPG_STEP * 100}%).<br>
  ${tierCap(nextCur()) < 2 ? '★★ 희귀 장비는 1-3부터, ' : ''}${tierCap(nextCur()) < 3 ? '★★★ 전설 장비는 2월드부터 등장해요.' : ''}</small></p>`;
}

const slotsFor = (it) => (it.slot === 'acc' ? Array.from({ length: accN }, (_, i) => 'acc' + (i + 1))
  : gemAll() ? [it.slot, it.slot + '2'] : [it.slot]);

// 상점(정비 화면)에서만 강화 버튼 표시
function upgBtn(id) {
  if (state !== 'shop') return '';
  const L = upg[id] || 0;
  if (L >= UPG_MAX) return '<button disabled>강화 MAX</button>';
  const c = upgCost(id);
  return `<button class=upgb ${gold < c ? 'disabled' : ''} onclick="enhance('${id}')">강화 +${L + 1} (${c}G)</button>`;
}

function equipHTML() {
  const worn = Object.values(eq), names = eqSlotNames();
  const slots = Object.keys(names).map((s) => {
    const it = eq[s] && ITEM[eq[s]];
    if (!it) return `<div class="card empty"><small>${names[s]}</small><b>— 비어 있음 —</b><div class=d></div></div>`;
    return card(it, `<div class=btns><button onclick="unequip('${s}')">해제</button>${upgBtn(it.id)}</div>`, 'eq');
  }).join('');
  const bag = inv.filter((id) => !worn.includes(id)).map((id) => {
    const it = ITEM[id], sl = slotsFor(it);
    const btn = sl.length > 1 && sl.every((s) => eq[s])
      ? `<select onchange="if(this.value)equip('${id}',this.value)"><option value="">장착할 칸 선택…</option>${sl.map((s) => `<option value="${s}">${names[s]}: ${itemName(eq[s])}와 교체</option>`).join('')}</select>`
      : `<button onclick="equip('${id}')">장착</button>`;
    return card(it, `<div class=btns>${btn}${upgBtn(id)}</div>`);
  }).join('');
  return `<h3>장착 중 (${gemAll() ? '무기 2 · 갑옷 2 · ' : ''}장신구 ${accN}칸${state === 'shop' && slotCost() ? ' · 상점에서 칸 확장 가능' : ''})</h3><div class=grid>${slots}</div>
  <h3>가방</h3><div class=grid>${bag || '<p>가방이 비어 있어요. 상점에서 장비를 사세요.</p>'}</div>${statsHTML()}`;
}

function gemHTML() {
  const cards = GEMS.map((x) => gems.includes(x.id)
    ? `<div class="card gem" style="border-color:${x.c}"><small>보석</small><div class=ch>${icImg('gem_' + x.id, 'icn')}<b style="color:${x.c}">${x.n}</b></div><div class=d>${x.d}</div></div>`
    : `<div class="card empty"><small>보석</small><b>— ??? —</b><div class=d>보스(확정) · ★4·★5 몬스터 · 보물상자에서 얻을 수 있어요</div></div>`).join('');
  return `<h3>보석 ${gems.length}/${GEMS.length} ${gemAll() ? '<span class=gold>— 세트 완성: 무기·갑옷·장신구 칸 +1</span>' : '<small>(모두 모으면 무기·갑옷·장신구 칸 +1)</small>'}</h3><div class=grid>${cards}</div>`;
}

function relicHTML() {
  if (!relics.length) return '<p>아직 유물이 없어요. 보스를 쓰러뜨리면 하나를 골라 얻을 수 있어요.</p>' + gemHTML();
  return `<div class=grid>${relics.map((id) => `<div class="card relic"><small>유물</small><div class=ch>${icImg(relicIcon(RELIC[id]), 'icn')}<b>${RELIC[id].n}</b></div><div class=d>${RELIC[id].d}</div></div>`).join('')}</div>${gemHTML()}`;
}

function statsHTML() {
  const pc = (v) => Math.round(v * 100) + '%';
  const rows = [
    ['공격력', T.atk.toFixed(1)], ['최대 HP', Math.round(T.maxhp)], ['공격 속도', pc(T.as)], ['이동 속도', Math.round(T.spd)],
    ['마법 위력', pc(T.mp)], ['마법구체', 1 + T.multi + '발'], ['마법 쿨타임', (MAG_CD * T.cdr).toFixed(2) + '초'],
    ['한 번에 소환', Math.round(T.sn) + '마리'], ['최대 소환수', Math.round(T.smax) + '마리'], ['소환 레벨', `Lv.${summonLv()} (${sumDef(0).n}·${sumDef(1).n})`],
    ['소환수 강화', pc(T.sm)], ['소환 쿨타임', (SCD * T.scd).toFixed(1) + '초'], ['검 피해', pc(T.swd)],
    ['받는 피해', (T.dr >= 0 ? '-' : '+') + pc(Math.abs(T.dr))], ['치명타', `${pc(T.crit)} (×${2 + T.critx})`], ['검 흡혈', pc(T.vamp)],
    ['처치 시 회복', T.ls], ['골드 획득', pc(T.gold)], ['최대 점프', T.mj + '단'],
  ];
  // 특수 효과는 있을 때만 표시
  const fx2 = [
    [T.frz, '❄ 빙결', pc(T.frz) + (T.frzT ? ` · ${1.5 + T.frzT}초` : '')], [T.frzB, '빙결 적 추가 피해', '+' + pc(T.frzB)],
    [T.sfrz, '소환수 빙결', pc(T.sfrz)], [T.frzA, '피격 시 빙결', '켜짐'], [T.burn, '🔥 화상', `초당 ${pc(T.burn)}`],
    [T.psn, '☠ 독', `중첩당 초당 ${pc(T.psn)}`], [T.chain, '⚡ 연쇄 번개', T.chain + '명'], [T.swave, '검기', pc(T.swave)],
    [T.exe, '처형', pc(T.exe) + ' 이하'], [T.kboom, '💥 시체 폭발', pc(T.kboom)], [T.thorns, '반격', pc(T.thorns)],
    [T.revive, '부활', T.revive + '회'], [T.dodge, '회피', pc(T.dodge)],
    [T.gdup, '골드 추가 획득', '×' + (1 + T.gdup)], [T.intr, '이자', `${pc(T.intr)} (최대 ${Math.round(800 * T.intr)}G)`],
    [T.vac, '자동 획득', '켜짐'], [T.luck, '★몬스터 확률', '+' + pc(T.luck)], [T.bounty, '★몬스터 보상', '×2'],
    [T.disc, '상점 할인', pc(T.disc)], [T.freeroll, '무료 새로고침', T.freeroll + '회'], [T.clrxp, '클리어 경험치', pc(T.clrxp)],
    [T.chest, '보물상자', '항상'], [T.gkill, '처치 골드', '+' + T.gkill],
    [T.combo, '3연타 콤보', '켜짐'], [T.slam, '내려찍기', '공중 S+공격'], [T.dash, '돌진 베기', '켜짐'],
    [T.gfist, '최대 HP 비례 피해', pc(T.gfist)], [T.flesh, '살덩이 (HP 100당)', '-' + pc(T.flesh)],
    [T.lowx, '빈사 적 추가 피해', '+' + pc(T.lowx)], [T.healm, '회복량', '+' + pc(T.healm)], [T.frust, '피격 반격 폭발', pc(T.frust)],
    [T.swkill, '검 처치 보상', '+' + pc(T.swkill)], [T.swdrop, '검 처치 장비 드롭', '+' + pc(T.swdrop)],
  ].filter((r) => r[0]).map((r) => [r[1], r[2]]);
  return `<h3>현재 능력치</h3><div class=stats>${[...rows, ...fx2].map(([k, v]) => `<span>${k} <b>${v}</b></span>`).join('')}</div>`;
}

// 골드 사용 (황금 우상: 50G마다 무작위 능력치 +2%)
function spend(v) {
  gold -= v;
  if (!worn('idol') || v <= 0) return;
  const o = (stk.idol = stk.idol || { g: 0, m: {} });
  o.g += v;
  const got = [];
  while (o.g >= 50) { o.g -= 50; got.push(growStat('idol', 0.02)); }
  if (got.length) { recalc(); shopNote = `황금 우상: ${got.join(', ')}`; }
}

function refreshMenu() { state === 'shop' ? shopMenu() : invMenu(); }

function buy(id) {
  const it = ITEM[id];
  if (gold < priceOf(it) || inv.includes(id)) return;
  spend(priceOf(it));
  inv.push(id);
  lockd = lockd.filter((x) => x !== id);
  const empty = slotsFor(it).find((s) => !eq[s]);
  if (empty) eq[empty] = id;
  recalc();
  shopMenu();
}
function enhance(id) {
  const c = upgCost(id);
  if (gold < c || (upg[id] || 0) >= UPG_MAX) return;
  spend(c);
  upg[id] = (upg[id] || 0) + 1;
  recalc();
  shopMenu();
}
function buySlot() {
  const c = slotCost();
  if (!c || gold < c) return;
  spend(c);
  accN++;
  eq['acc' + accN] = null;
  shopMenu();
}
function toggleLock(id) {
  if (lockd.includes(id)) lockd = lockd.filter((x) => x !== id);
  else {
    const c = lockCost(ITEM[id]);
    if (gold < c) return;
    spend(c);
    lockd.push(id);
  }
  shopMenu();
}
function buyPotion() {
  if (gold < POTION_PRICE || p.hp >= T.maxhp) return;
  spend(POTION_PRICE);
  p.hp = T.maxhp;
  shopMenu();
}
function reroll() {
  if (gold < rerollCost()) return;
  spend(rerollCost());
  rerollN++;
  rollStock();
  shopMenu();
}
function equip(id, slot) {
  const sl = slotsFor(ITEM[id]);
  slot = slot || sl.find((s) => !eq[s]) || sl[0];
  eq[slot] = id;
  recalc();
  refreshMenu();
}
function unequip(s) { eq[s] = null; recalc(); refreshMenu(); }

// ----- 결과 -----
function over() {
  state = 'over';
  show(`<h1>마왕, 쓰러지다</h1><p>${stageLabel()} ${stageDef().n} · Lv.${lvl} · 유물 ${relics.length}개</p><button onclick="start()">다시 도전</button>`);
}
function win() {
  state = 'over';
  show(`<h1>VICTORY</h1><p>용사도, 대주교도 쓰러졌습니다. 이제 세상은 마왕의 것입니다.<br>최종 레벨 Lv.${lvl} · 유물 ${relics.length}개 · ${gold} G</p><button onclick="start()">처음부터 다시</button>`);
}
