// =====================================================================
//  공용 상태 · 유틸리티 · 스탯 계산 · 스테이지 흐름
// =====================================================================
const $ = (id) => document.getElementById(id);
const cv = $('c'), g = cv.getContext('2d'), ov = $('ov');
g.imageSmoothingEnabled = false;

const R = Math.random;
const rr = (a, b) => a + R() * (b - a);
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const pickR = (arr) => arr[(R() * arr.length) | 0];
const shuffle = (arr) => arr.map((v) => [R(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

// ----- 게임 상태 -----
let state = 'title'; // title | play | pause | lvfx | lvl | relic | shop | over
let time = 0, shake = 0, ban = null, spt = 0, bossT = 0, winT = 0;
let S, T, p, lvl, xp, need, upc, opts;  // S: 레벨업 스탯, T: 장비·유물까지 합친 최종 스탯
let stk = {}, gems = []; // stk: 성장형 장비 누적치 (아이템 id별), gems: 모은 보석
let gold, inv, eq, relics, stock, relicOpts, lockd = [], rerollN = 0, upg = {}, accN = ACC_BASE;
let cur = { w: 0, s: 0 }, kills = 0, portal = null, boss = null, bdone = 0, cam = 0, camY = 0, pl = [], map = null;
let chests = [], clearMsg = '';
// en 적, pr 마법구체, eb 적 탄, dr 드롭, fx 스프라이트 이펙트, tx 숫자, al 소환수,
// pt/rg 레벨업 이펙트, hz 바닥 위험지대, wv 퍼지는 원 이펙트
// kq 처치 폭발 대기열, zp 번개 이펙트
let en = [], pr = [], eb = [], dr = [], fx = [], tx = [], al = [], pt = [], rg = [], hz = [], wv = [], kq = [], zp = [];
let lt = 0, lf = 0, sTier = 0;
const keys = {};
let mb = {}, msx = 0, msy = 0, mon = 0;

// ----- 영혼석 · 영구 강화 (localStorage에 저장) -----
let runXp = 0, soulGot = 0; // runXp: 이번 판에 모은 경험치 총량
const meta = { soul: 0, lv: {} };
try { Object.assign(meta, JSON.parse(localStorage.getItem('maou_meta') || '{}')); } catch (x) {}
const saveMeta = () => { try { localStorage.setItem('maou_meta', JSON.stringify(meta)); } catch (x) {} };
const metaLv = (id) => meta.lv[id] || 0;
// 판이 끝날 때 한 번만 지급
function grantSouls() {
  if (soulGot) return soulGot;
  soulGot = Math.max(runXp > 0 ? 1 : 0, Math.floor(runXp * SOUL_RATE));
  meta.soul += soulGot; saveMeta();
  return soulGot;
}

// ----- 스테이지 정보 -----
const stageDef = (c = cur) => WORLDS[c.w].stages[c.s];
const isBossStage = (c = cur) => c.s === WORLDS[c.w].stages.length - 1;
const stageLabel = (c = cur) => `${c.w + 1}-${isBossStage(c) ? '보스' : c.s + 1}`;
// 난이도 지표: 지금까지 지나온 스테이지 수 (1-1 = 0, 2-1 = 6 ...)
const depthOf = (c) => WORLDS.slice(0, c.w).reduce((n, w) => n + w.stages.length, 0) + c.s;
const depth = () => depthOf(cur);
const nextCur = () => (isBossStage() ? { w: cur.w + 1, s: 0 } : { w: cur.w, s: cur.s + 1 });
// 상점 등급: 1월드 초반 ★, 1-3부터 ★★, 2월드부터 ★★★
const tierCap = (c) => (c.w >= 1 ? 3 : c.s >= 2 ? 2 : 1);

// ----- 스탯 계산: S(레벨업) + 장비 + 유물 = T -----
const PCT_KEYS = ['atk', 'as', 'spd', 'mp', 'area', 'xpm', 'mag', 'sm', 'gold'];
const CD_KEYS = ['cdr', 'scd'];

// 장비 강화: 수치 효과는 단계마다 +25%, 개수형(마법구체·소환수·번개·점프)은 +3에서 +1
const INT_UP = ['multi', 'sn', 'smax', 'chain', 'mj', 'freeroll'];
const NO_SCALE = ['revive', 'vac', 'frzA', 'chest', 'gdup', 'bounty', 'freeroll', 'combo', 'slam', 'dash', 'slv'];
function modsOf(id) {
  const it = ITEM[id], L = upg[id] || 0, m = {};
  // 성장형: 기본 효과 + 누적 효과 (강화 배율은 둘 다 적용)
  const base = { ...it.m };
  if (it.dyn) for (const [k, v] of Object.entries(it.dyn(stk[id]))) base[k] = (base[k] || 0) + v;
  for (const k in base) {
    const v = base[k];
    if (INT_UP.includes(k)) m[k] = v + (v > 0 ? Math.floor(L / 3) : 0);
    else if (NO_SCALE.includes(k) || v < 0) m[k] = v;
    else m[k] = v * (1 + UPG_STEP * L);
  }
  return m;
}
const baseName = (it) => (it.id === 'souljar' && (stk.souljar || 0) >= SOUL_MAX ? '각성한 ' : '') + it.n;
const itemName = (id) => baseName(ITEM[id]) + (upg[id] ? ` +${upg[id]}` : '');
const worn = (id) => { for (const s in eq) if (eq[s] === id) return true; return false; };
const gemAll = () => gems.length >= GEMS.length; // 보석 4개 → 무기·갑옷·장신구 칸 +1
const eqSlotNames = () => {
  const o = gemAll() ? { wpn: '무기 1', wpn2: '무기 2', arm: '갑옷 1', arm2: '갑옷 2' } : { wpn: '무기', arm: '갑옷' };
  for (let i = 1; i <= accN; i++) o['acc' + i] = '장신구 ' + i;
  return o;
};

function activeMods() {
  const list = [];
  for (const s in eq) if (eq[s]) list.push(modsOf(eq[s]));
  for (const r of relics) list.push(RELIC[r].m);
  for (const x of gems) list.push(GEM[x].m);
  return list;
}

function recalc() {
  // 기본값 → 레벨업 스탯(S)으로 덮어쓰기 → 장비·유물 더하기
  T = { gold: 1, crit: 0, critx: 0, vamp: 0, dr: 0, thorns: 0, revive: 0, dodge: 0,
        frz: 0, frzT: 0, frzB: 0, sfrz: 0, frzA: 0, burn: 0, psn: 0, chain: 0, swave: 0, exe: 0, kboom: 0,
        gdup: 0, intr: 0, vac: 0, luck: 0, bounty: 0, disc: 0, freeroll: 0, clrxp: 0, chest: 0, gkill: 0,
        combo: 0, slam: 0, dash: 0, swkill: 0, swdrop: 0, ...S };
  const add = {};
  for (const m of activeMods()) for (const k in m) add[k] = (add[k] || 0) + m[k];
  T.atk += add.atkf || 0; // 고정 공격력은 % 증가보다 먼저
  for (const k in add) {
    if (PCT_KEYS.includes(k)) T[k] *= 1 + add[k];
    else if (CD_KEYS.includes(k)) T[k] *= Math.max(0.3, 1 - add[k]);
    else T[k] = (T[k] || 0) + add[k];
  }
  // 살덩이 갑옷: 최대 HP 100마다 받는 피해 감소
  if (T.flesh) T.dr += Math.min(0.4, Math.floor(T.maxhp / 100) * T.flesh);
  T.dr = Math.min(0.7, T.dr);
  T.crit = Math.min(0.8, T.crit);
  T.frz = Math.min(0.75, T.frz);
  T.dodge = Math.min(0.5, T.dodge);
  // 소환 레벨이 3·5·7·9에 닿으면 소환수 진화
  const tier = summonTier();
  if (tier !== sTier) { sTier = tier; evolveSummons(); }
  if (p) p.hp = Math.min(p.hp, T.maxhp);
}

// ----- 새 게임 -----
function newRun() {
  S = { atk: 10, maxhp: 100, spd: 230, as: 1, cdr: 1, area: 1, multi: 0, ls: 0, xpm: 1, jump: 640, mag: 1, mp: 1, mj: 1,
        sn: 3, smax: 10, slv: 0, scd: 1, sm: 1, swd: 1, swr: 1 };
  // 영구 강화 적용
  for (const m of META) if (m.f && metaLv(m.id)) m.f(S, m.v * metaLv(m.id));
  runXp = 0; soulGot = 0;
  sTier = 0;
  lvl = 1; xp = 0; need = 6; upc = {};
  gold = Math.round(META.find((m) => m.id === 'gold').v * metaLv('gold')); inv = []; relics = []; stk = {}; gems = []; stock = []; lockd = []; upg = {}; accN = ACC_BASE;
  eq = { wpn: null, arm: null };
  for (let i = 1; i <= accN; i++) eq['acc' + i] = null;
  al = [];
  p = { x: 120, y: GY, vx: 0, vy: 0, face: 1, hp: 100, g: 1, st: 'n', t: 0, inv: 0, cd: 0, sc: 0, jc: 0,
        kind: 'mag', am: null, b: {}, hit: 0, fired: 0, dn: 0, revUsed: 0, frzCd: 0,
        slowT: 0, burnT: 0, psnT: 0, psnS: 0, dotT: 0.5, combo: 0, comboT: 0, dashT: 0, dashCd: 0 };
  recalc();
  p.hp = T.maxhp;
  cur = { w: 0, s: 0 };
  go();
}

// ----- 스테이지 시작 -----
function go() {
  kills = 0; portal = null; boss = null; bdone = 0; bossT = 2; spt = 0; winT = 0;
  en = []; corpses = []; pr = []; eb = []; dr = []; fx = []; tx = []; pt = []; rg = []; hz = []; wv = []; kq = []; zp = [];
  p.x = 120; p.y = GY; p.vx = p.vy = 0; p.st = 'n'; p.revUsed = 0; p.inv = 1; cam = 0;
  p.slowT = p.burnT = p.psnT = 0;
  // 소환수는 다음 스테이지로 따라온다
  for (const a of al) { a.x = p.x + a.o * 1.2; a.y = a.air ? p.y - 80 : GY; a.cd = 0; }
  // 랜덤 맵
  map = genMap();
  WW = map.mw; MH = map.mh; GY = map.gy; pl = map.pl;
  p.y = GY;
  for (const a of al) a.y = a.air ? p.y - 80 : GY;
  cam = cl(p.x - W / 2, 0, WW - W);
  camY = cl(p.y - H * 0.62, 0, MH - H);
  ban = { s: `${stageLabel()} · ${stageDef().n}${map.name ? ` · ${map.name}` : ''}`, t: 2.5 };
  // 보물상자: 시작 지점에서 먼 곳에
  chests = [];
  if (!isBossStage() && (T.chest || R() < CHEST_CHANCE)) {
    const sp = spawnSpot(900, 99999) || spawnSpot(500, 99999);
    if (sp) chests.push({ x: sp.x, y: sp.y, open: 0 });
  }
  // 발판 위에도 미리 적 배치
  if (!isBossStage()) {
    const n = Math.min(8, Math.round(stageDef().q * 0.35));
    for (let i = 0; i < n; i++) {
      const sp = spawnSpot(500, 99999);
      if (sp) spawn(pickR(stageDef().pool), sp.x, { y: sp.y });
    }
  }
}

function openPortal(msg) {
  portal = { ...map.portal };
  const where = portal.y < GY - 50 ? '맵 꼭대기' : '오른쪽 끝';
  ban = { s: msg || `포털이 열렸다! → ${where}에서 ${kl(KB.por)}`, t: 3 };
}

// 포털에 들어가면: 보스 스테이지였으면 유물 선택 → 정비(상점), 아니면 바로 정비
function enter() {
  if (!portal || Math.abs(p.x - portal.x) >= 60 || Math.abs(p.y - portal.y) > 80) return;
  heal(T.maxhp * 0.3);
  mb = {};
  stageClear();
  if (isBossStage()) relicMenu();
  else shopMenu('shop', true);
}

// 스테이지 클리어 정산: 자동 획득, 이자, 경험치
function stageClear() {
  const msg = [];
  // 맵에 남은 경험치·골드·장비는 자동 획득 (수집가의 자루: 경험치·골드 한 번 더)
  const g0 = gold, x0 = xp;
  let n = 0;
  for (const d of dr) {
    if (d.k === 'b') continue;
    pickRaw(d); n++;
    if (T.vac && (d.k === 'g' || d.k === 'xp')) pickRaw(d);
  }
  dr = [];
  if (n) msg.push(`남은 드롭 자동 획득 +${gold - g0}G · 경험치 +${Math.round(xp - x0)}${T.vac ? ' · 수집가의 자루 2배' : ''}`);
  if (T.intr && gold > 0) {
    const v = Math.min(Math.round(gold * T.intr), Math.round(800 * T.intr));
    if (v > 0) { gold += v; msg.push(`이자 +${v}G`); }
  }
  if (T.clrxp) { xp += need * T.clrxp; runXp += need * T.clrxp; msg.push(`레벨업 게이지 +${Math.round(T.clrxp * 100)}%`); }
  clearMsg = msg.join(' · ');
}

function nextStage() {
  cur = nextCur();
  go();
  hide();
  state = 'play';
  clearMsg = '';
  chk(); // 정산으로 쌓인 경험치 반영
}
