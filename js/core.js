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
let gold, inv, eq, relics, stock, relicOpts;
let cur = { w: 0, s: 0 }, kills = 0, portal = null, boss = null, bdone = 0, cam = 0, pl = [];
// en 적, pr 마법구체, eb 적 탄, dr 드롭, fx 스프라이트 이펙트, tx 숫자, al 소환수,
// pt/rg 레벨업 이펙트, hz 바닥 위험지대, wv 퍼지는 원 이펙트
let en = [], pr = [], eb = [], dr = [], fx = [], tx = [], al = [], pt = [], rg = [], hz = [], wv = [];
let lt = 0, lf = 0;
const keys = {};
let mb = {}, msx = 0, msy = 0, mon = 0;

// ----- 스테이지 정보 -----
const stageDef = (c = cur) => WORLDS[c.w].stages[c.s];
const isBossStage = (c = cur) => c.s === 3;
const stageLabel = (c = cur) => `${c.w + 1}-${c.s === 3 ? '보스' : c.s + 1}`;
const depth = () => cur.w * 4 + cur.s; // 난이도 지표 (0 ~ 7)
const nextCur = () => (cur.s < 3 ? { w: cur.w, s: cur.s + 1 } : { w: cur.w + 1, s: 0 });

// ----- 스탯 계산: S(레벨업) + 장비 + 유물 = T -----
const PCT_KEYS = ['atk', 'as', 'spd', 'mp', 'area', 'xpm', 'mag', 'sm', 'gold'];
const CD_KEYS = ['cdr', 'scd'];

function activeMods() {
  const list = [];
  for (const s in eq) if (eq[s]) list.push(ITEM[eq[s]].m);
  for (const r of relics) list.push(RELIC[r].m);
  return list;
}

function recalc() {
  T = { ...S, gold: 1, crit: 0, vamp: 0, dr: 0, thorns: 0, revive: 0 };
  const add = {};
  for (const m of activeMods()) for (const k in m) add[k] = (add[k] || 0) + m[k];
  for (const k in add) {
    if (PCT_KEYS.includes(k)) T[k] *= 1 + add[k];
    else if (CD_KEYS.includes(k)) T[k] *= Math.max(0.3, 1 - add[k]);
    else T[k] = (T[k] || 0) + add[k];
  }
  T.dr = Math.min(0.7, T.dr);
  T.crit = Math.min(0.8, T.crit);
  if (p) p.hp = Math.min(p.hp, T.maxhp);
}

// ----- 새 게임 -----
function newRun() {
  S = { atk: 10, maxhp: 100, spd: 230, as: 1, cdr: 1, area: 1, multi: 0, ls: 0, xpm: 1, jump: 640, mag: 1, mp: 1, mj: 1, sn: 3, scd: 1, sm: 1 };
  lvl = 1; xp = 0; need = 6; upc = {};
  gold = 0; inv = []; eq = { wpn: null, arm: null, acc: null }; relics = []; stock = [];
  al = [];
  p = { x: 120, y: GY, vx: 0, vy: 0, face: 1, hp: 100, g: 1, st: 'n', t: 0, inv: 0, cd: 0, sc: 0, jc: 0,
        kind: 'mag', am: null, b: {}, hit: 0, fired: 0, dn: 0, revUsed: 0 };
  recalc();
  p.hp = T.maxhp;
  cur = { w: 0, s: 0 };
  go();
}

// ----- 스테이지 시작 -----
function go() {
  kills = 0; portal = null; boss = null; bdone = 0; bossT = 2; spt = 0; winT = 0;
  en = []; pr = []; eb = []; dr = []; fx = []; tx = []; pt = []; rg = []; hz = []; wv = [];
  p.x = 120; p.y = GY; p.vx = p.vy = 0; p.st = 'n'; p.revUsed = 0; p.inv = 1; cam = 0;
  // 소환수는 다음 스테이지로 따라온다
  for (const a of al) { a.x = p.x + a.o * 1.2; a.y = a.t === 'bat' ? p.y - 80 : GY; a.cd = 0; }
  const sd = depth();
  pl = [];
  for (let k = 0; k < 7; k++) pl.push({ x: 260 + k * 320 + ((k + sd) % 2) * 40, y: GY - 105 - ((k + sd) % 3) * 50, w: 170 });
  ban = { s: `${stageLabel()} · ${stageDef().n}`, t: 2.5 };
}

function openPortal(msg) {
  portal = { x: WW - 160 };
  ban = { s: msg || `포털이 열렸다! → 끝까지 이동 후 ${kl(KB.por)}`, t: 3 };
}

// 포털에 들어가면: 보스 스테이지였으면 유물 선택 → 정비(상점), 아니면 바로 정비
function enter() {
  if (!portal || Math.abs(p.x - portal.x) >= 60) return;
  p.hp = Math.min(T.maxhp, p.hp + T.maxhp * 0.3);
  mb = {};
  if (isBossStage()) relicMenu();
  else shopMenu('shop', true);
}

function nextStage() {
  cur = nextCur();
  go();
  hide();
  state = 'play';
}
