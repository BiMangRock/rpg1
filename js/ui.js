// =====================================================================
//  화면 메뉴 — 타이틀, 키 설정, 일시정지, 레벨업, 유물, 정비(상점·장비·유물), 결과
// =====================================================================
let KB = { ...KD }, wait = null, back = 'title', shopTab = 'shop';
try { Object.assign(KB, JSON.parse(localStorage.getItem('maou_kb2') || '{}')); } catch (x) {}

const kl = (k) => ({ ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }[k] || String(k).replace(/^(Key|Digit)/, ''));
const show = (h, panel) => { ov.innerHTML = h; ov.className = panel ? 'panel' : ''; ov.style.display = 'flex'; ov.scrollTop = 0; };
const hide = () => (ov.style.display = 'none');

// ----- 타이틀 / 키 설정 -----
function title() {
  show(`<h1>마왕 연대기</h1>
  <p>용사 일행을 처단하고 세상을 지배하라.<br>
  ${kl(KB.L)} ${kl(KB.R)} 이동 · ${kl(KB.jmp)} 점프 (${kl(KB.dn)}+점프: 아래로) · ${kl(KB.por)} 포털 · ${kl(KB.sum)} 소환<br>
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
  <div class=row><button onclick="resume()">계속하기</button><button onclick="equipPause()">장비</button><button onclick="ks('pause')">키 설정</button></div>`);
}
function equipPause() {
  state = 'pause';
  show(`<h2>장비</h2>${equipHTML()}<div class=row><button onclick="pauseM()">돌아가기</button></div>`, true);
}
function resume() { hide(); state = 'play'; }
function start() { hide(); newRun(); state = 'play'; }

// ----- 레벨업 -----
function menu() {
  state = 'lvl'; mb = {};
  const a = shuffle(UPGRADES.map((_, i) => i).filter((i) => !UPGRADES[i].max || (upc[i] || 0) < UPGRADES[i].max));
  opts = a.slice(0, 3);
  show(`<h1>LEVEL UP!</h1><p>Lv.${lvl} · 강화를 선택하세요 (1~3 키)</p>
  <div class=row>${opts.map((k, i) => `<button class=up onclick="pickUp(${i})"><b>${i + 1}. ${UPGRADES[k].n}</b><small>현재 ${upc[k] || 0}단계</small></button>`).join('')}</div>`);
}
function pickUp(i) {
  if (state !== 'lvl') return;
  const k = opts[i];
  UPGRADES[k].f();
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
  show(`<h1>클리어 보상</h1><p>${WORLDS[cur.w].n} 정복! 유물 하나를 선택하세요 (1~3 키) — 장착 없이 영구 적용</p>
  <div class=grid>${relicOpts.map((r, i) => `<div class="card relic" onclick="pickRelic(${i})"><small>유물 ${i + 1}</small><b>${r.n}</b><div class=d>${r.d}</div><button>선택</button></div>`).join('')}</div>`, true);
}
function pickRelic(i) {
  if (state !== 'relic' || !relicOpts[i]) return;
  relics.push(relicOpts[i].id);
  recalc();
  shopMenu('shop', true);
}

// ----- 정비 화면 (스테이지 사이) -----
function rollStock() {
  const tier = WORLDS[nextCur().w].tier;
  stock = shuffle(ITEMS.filter((i) => i.tier <= tier && !inv.includes(i.id))).slice(0, 4).map((i) => i.id);
}

function shopMenu(tab, fresh) {
  state = 'shop'; mb = {}; ban = null;
  if (fresh) rollStock();
  if (tab) shopTab = tab;
  const nc = nextCur(), nd = stageDef(nc);
  const tabs = [['shop', '상점'], ['equip', '장비'], ['relic', '유물']]
    .map(([k, n]) => `<button class="${shopTab === k ? 'on' : ''}" onclick="shopMenu('${k}')">${n}</button>`).join('');
  const body = shopTab === 'shop' ? shopHTML() : shopTab === 'equip' ? equipHTML() : relicHTML();
  show(`<h2>정비 시간</h2>
  <p>다음: <b>${stageLabel(nc)} ${nd.n}</b>${isBossStage(nc) ? ' · <span class=warn>보스전!</span>' : ''}
   · HP ${Math.ceil(p.hp)}/${Math.round(T.maxhp)} · <span class=gold>${gold} G</span></p>
  <div class=tabs>${tabs}</div>${body}
  <div class=row><button class=go onclick="nextStage()">다음 스테이지 ▶ (Enter)</button></div>`, true);
}

const card = (it, btn, cls = '') =>
  `<div class="card t${it.tier} ${cls}"><small>${SLOT[it.slot]} · ${'★'.repeat(it.tier)}</small><b>${it.n}</b><div class=d>${it.d}</div>${btn}</div>`;

function shopHTML() {
  const items = stock.map((id) => {
    const it = ITEM[id];
    if (inv.includes(id)) return card(it, '<button disabled>구매 완료</button>', 'sold');
    return card(it, `<button ${gold < it.price ? 'disabled' : ''} onclick="buy('${id}')">${it.price} G 구매</button>`);
  }).join('');
  const full = p.hp >= T.maxhp;
  const potion = `<div class="card t0"><small>소모품</small><b>회복 물약</b><div class=d>HP를 전부 회복합니다.</div>
    <button ${gold < POTION_PRICE || full ? 'disabled' : ''} onclick="buyPotion()">${full ? 'HP 가득' : POTION_PRICE + ' G 구매'}</button></div>`;
  return `<div class=grid>${items || '<p>더 살 수 있는 장비가 없어요.</p>'}${potion}</div>
  <div class=row><button ${gold < REROLL_PRICE ? 'disabled' : ''} onclick="reroll()">상품 새로고침 (${REROLL_PRICE} G)</button></div>
  <p><small>산 장비는 빈 칸이면 바로 장착되고, 아니면 가방에 들어갑니다. [장비] 탭에서 바꿔 끼세요.</small></p>`;
}

function equipHTML() {
  const worn = Object.values(eq);
  const slots = Object.keys(SLOT).map((s) => {
    const it = eq[s] && ITEM[eq[s]];
    if (!it) return `<div class="card empty"><small>${SLOT[s]}</small><b>— 비어 있음 —</b><div class=d></div></div>`;
    return card(it, `<button onclick="unequip('${s}')">해제</button>`, 'eq');
  }).join('');
  const bag = inv.filter((id) => !worn.includes(id)).map((id) => card(ITEM[id], `<button onclick="equip('${id}')">장착</button>`)).join('');
  return `<h3>장착 중</h3><div class=grid>${slots}</div>
  <h3>가방</h3><div class=grid>${bag || '<p>가방이 비어 있어요. 상점에서 장비를 사세요.</p>'}</div>${statsHTML()}`;
}

function relicHTML() {
  if (!relics.length) return '<p>아직 유물이 없어요. 보스를 쓰러뜨리면 하나를 골라 얻을 수 있어요.</p>';
  return `<div class=grid>${relics.map((id) => `<div class="card relic"><small>유물</small><b>${RELIC[id].n}</b><div class=d>${RELIC[id].d}</div></div>`).join('')}</div>`;
}

function statsHTML() {
  const pc = (v) => Math.round(v * 100) + '%';
  const rows = [
    ['공격력', T.atk.toFixed(1)], ['최대 HP', Math.round(T.maxhp)], ['공격 속도', pc(T.as)], ['이동 속도', Math.round(T.spd)],
    ['마법 위력', pc(T.mp)], ['마법구체', 1 + T.multi + '발'], ['마법 쿨타임', (MAG_CD * T.cdr).toFixed(2) + '초'],
    ['소환수', Math.round(T.sn) + '마리'], ['소환수 강화', pc(T.sm)], ['소환 쿨타임', (SCD * T.scd).toFixed(1) + '초'],
    ['받는 피해', (T.dr >= 0 ? '-' : '+') + pc(Math.abs(T.dr))], ['치명타', pc(T.crit)], ['검 흡혈', pc(T.vamp)],
    ['처치 시 회복', T.ls], ['골드 획득', pc(T.gold)], ['최대 점프', T.mj + '단'],
  ];
  return `<h3>현재 능력치</h3><div class=stats>${rows.map(([k, v]) => `<span>${k} <b>${v}</b></span>`).join('')}</div>`;
}

function refreshMenu() { state === 'shop' ? shopMenu() : equipPause(); }

function buy(id) {
  const it = ITEM[id];
  if (gold < it.price || inv.includes(id)) return;
  gold -= it.price;
  inv.push(id);
  if (!eq[it.slot]) eq[it.slot] = id;
  recalc();
  shopMenu();
}
function buyPotion() {
  if (gold < POTION_PRICE || p.hp >= T.maxhp) return;
  gold -= POTION_PRICE;
  p.hp = T.maxhp;
  shopMenu();
}
function reroll() {
  if (gold < REROLL_PRICE) return;
  gold -= REROLL_PRICE;
  rollStock();
  shopMenu();
}
function equip(id) { eq[ITEM[id].slot] = id; recalc(); refreshMenu(); }
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
