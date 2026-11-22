// =====================================================================
//  게임 데이터 — 숫자 밸런스는 대부분 여기서 조절하면 됩니다.
// =====================================================================

// ----- 화면 / 월드 크기 -----
const W = 960, H = 540; // 캔버스 크기
// 아래 셋은 스테이지마다 랜덤 맵에 맞춰 바뀜 (map.js)
let GY = 470;   // 땅 높이
let WW = 2600;  // 맵 가로 길이
let MH = 540;   // 맵 세로 길이

// ----- 기본 수치 -----
const MAG_CD = 0.7; // 마법 기본 쿨타임(초)
const SCD = 12;     // 소환 기본 쿨타임(초)
const MAXA = 12;    // 소환수 최대 수
const POTION_PRICE = 40;
const REROLL_PRICE = 20;  // 새로고침 비용 (같은 상점에서 누를 때마다 +10)
const SHOP_SIZE = 5;      // 상점 진열 수
// ★ 몬스터: 일반 적이 확률적으로 ★1~5 등급으로 등장 (등급이 높을수록 강하고 보상이 큼)
const STAR_CHANCE = 0.07;    // 기본 등장 확률 (스테이지가 깊어질수록 조금씩 증가)
const STAR_UP = 0.35;        // 한 단계 더 높은 별이 붙을 확률 (깊어질수록 증가)
const STAR_ITEM = [0, 0.08, 0.18, 0.32, 0.55, 1]; // 별 수별 장비 드롭 확률 (★5는 확정, 50% 확률로 1개 더)
const STAR_RELIC = 0.2;      // ★5 처치 시 유물 드롭 확률
// 장비 강화 / 칸 확장 (상점)
const UPG_MAX = 5;           // 최대 +5
const UPG_STEP = 0.25;       // 강화 1단계마다 효과 +25%
const UPG_COST = 0.4;        // 강화 비용 = 장비 가격 × 0.4 × (다음 단계)
const ACC_BASE = 3;          // 기본 장신구 칸
const ACC_SLOT_PRICE = [150, 260, 400]; // 장신구 4·5·6번째 칸 가격
const CHEST_CHANCE = 0.4;    // 스테이지에 보물상자가 나올 확률
// ★ 몬스터 특수 능력: ★2는 랜덤 1개, ★3부터 '용사의 갑옷', ★4부터 '다단 점프', ★5는 '용사의 검기' 고정 + 랜덤
// 마왕이 장비로 얻는 특성(빙결, 화상, 독, 흡혈, 가시, 치명타, 부활, 번개, 시체 폭발)도 ★몬스터가 가질 수 있음
const AFFIX = {
  armor: '용사갑옷', jump: '다단점프', wave: '용사검기', haste: '신속', regen: '재생',
  holy: '성방패', blink: '순간이동', split: '분열', rage: '광폭', call: '호출',
  frost: '빙결타', burn: '화염타', poison: '독타', vamp: '흡혈', thorns: '가시',
  crit: '치명', revive: '부활', chain: '번개', kboom: '자폭',
};
const AFFIX_RANDOM = ['haste', 'regen', 'holy', 'blink', 'split', 'rage', 'call', 'jump',
  'frost', 'burn', 'poison', 'vamp', 'thorns', 'crit', 'revive', 'chain', 'kboom'];

// ----- 월드 / 스테이지 -----
// 월드마다 일반 스테이지 5개 + 마지막 보스 스테이지
// a/b: 하늘 그라데이션, e: 땅/발판 강조색, q: 포털이 열리는 처치 수, pool: 등장하는 적
const WORLDS = [
  {
    n: '인간 왕국', boss: 'hero',
    stages: [
      { n: '평화로운 마을', a: '#2b1240', b: '#0d0616', e: '#5ad06b', q: 10, pool: ['farmer', 'villager'] },
      { n: '밀밭 언덕', a: '#3a2a14', b: '#100a04', e: '#e8c05a', q: 12, pool: ['farmer', 'villager', 'archer'] },
      { n: '국경 초소', a: '#3a1a2a', b: '#10060c', e: '#d0a05a', q: 15, pool: ['farmer', 'villager', 'swordsman', 'archer'] },
      { n: '기사단 훈련장', a: '#1a2238', b: '#060812', e: '#a0b0d0', q: 18, pool: ['swordsman', 'archer', 'paladin', 'villager'] },
      { n: '왕국의 성하', a: '#43121f', b: '#12060a', e: '#e8685a', q: 22, pool: ['swordsman', 'archer', 'paladin', 'farmer'] },
      { n: '용사의 성전', a: '#122244', b: '#050818', e: '#6ab4ff' },
    ],
  },
  {
    n: '성교국', boss: 'pope',
    stages: [
      { n: '순례자의 길', a: '#2a2a10', b: '#0c0c04', e: '#e8d87a', q: 16, pool: ['swordsman', 'archer', 'cleric', 'bard', 'zealot'] },
      { n: '빛의 묘지', a: '#1a1a2a', b: '#06060c', e: '#b0c0ff', q: 18, pool: ['archer', 'paladin', 'summoner', 'cleric', 'zealot'] },
      { n: '침묵의 수도원', a: '#14282a', b: '#050c0c', e: '#7ae8d8', q: 21, pool: ['paladin', 'archer', 'cleric', 'warden', 'summoner', 'zealot'] },
      { n: '성가대 종탑', a: '#2a1420', b: '#0c0408', e: '#ff9ac0', q: 24, pool: ['swordsman', 'bard', 'warden', 'summoner', 'archer', 'zealot'] },
      { n: '대성당 회랑', a: '#2a1a3a', b: '#0a0612', e: '#c8a0ff', q: 28, pool: ['paladin', 'swordsman', 'cleric', 'bard', 'warden', 'summoner', 'zealot', 'zealot'] },
      { n: '대성당 제단', a: '#3a3020', b: '#100c06', e: '#ffe6a0' },
    ],
  },
];

// ----- 적 -----
// hp/sp(속도)/w/h/dm(공격 배율)/xp/gold, look: 외형 번호, ai: 행동 방식, cd: 지원 스킬 쿨타임
// (지상 적은 모두 발판을 뛰어오르내리며 추격. 2월드 적이 더 높이, 자주 점프)
const ENEMY = {
  farmer:    { hp: 24,  sp: 60,  w: 32, h: 66, dm: 1,   xp: 2, gold: 2, col: '#8a6a3a', look: 0 },
  villager:  { hp: 16,  sp: 100, w: 30, h: 62, dm: 0.8, xp: 1, gold: 2, col: '#6a8aa8', look: 1 },
  swordsman: { hp: 60,  sp: 75,  w: 36, h: 76, dm: 1.6, xp: 4, gold: 4, col: '#8a8f9a', look: 2 },
  archer:    { hp: 28,  sp: 55,  w: 32, h: 68, dm: 0.9, xp: 3, gold: 3, col: '#3a7a4a', look: 3, ai: 'archer' },
  paladin:   { hp: 130, sp: 40,  w: 46, h: 84, dm: 1.8, xp: 7, gold: 6, col: '#dcdce8', look: 4 },
  // --- 2월드 지원형 ---
  cleric:    { hp: 45,  sp: 55,  w: 32, h: 70, dm: 0.8, xp: 5, gold: 5, col: '#efe9da', look: 5, ai: 'support', cd: 3.2, role: ['✚', '#7aff8a', '성직자'] },
  bard:      { hp: 40,  sp: 60,  w: 32, h: 68, dm: 0.8, xp: 5, gold: 5, col: '#d0602a', look: 6, ai: 'support', cd: 6,   role: ['♪', '#ffa040', '군악 사제'] },
  zealot:    { hp: 50,  sp: 125, w: 32, h: 70, dm: 1.3, xp: 5, gold: 5, col: '#3a2a48', look: 9 },
  summoner:  { hp: 50,  sp: 45,  w: 34, h: 72, dm: 0.8, xp: 6, gold: 6, col: '#5a2a90', look: 7, ai: 'support', cd: 5,   role: ['◆', '#c08aff', '소환술사'] },
  warden:    { hp: 70,  sp: 45,  w: 38, h: 74, dm: 1,   xp: 6, gold: 6, col: '#3a5ab0', look: 8, ai: 'support', cd: 5,   role: ['⬡', '#7ac0ff', '수호 사제'] },
  // --- 소환물 / 보스 기믹 ---
  wisp:      { hp: 14,  sp: 150, w: 22, h: 22, dm: 0.6, xp: 0, gold: 0, ai: 'wisp', fly: 1, minion: 1 },
  crystal:   { hp: 150, sp: 0,   w: 40, h: 74, dm: 0,   xp: 3, gold: 10, ai: 'crystal' },
};

// ----- 레벨업 강화 (S = 레벨업으로 쌓이는 기본 스탯) -----
// w: 나올 확률 가중치 (기본 1), max: 최대 횟수
const UPGRADES = [
  { n: '공격력 +20%', f: () => (S.atk *= 1.2) },
  { n: '공격 속도 +15%', f: () => (S.as *= 1.15), w: 1.5 },
  { n: '이동 속도 +15%', f: () => (S.spd *= 1.15), w: 2 },
  { n: '질풍: 이동 속도 +20%, 점프력 +8%', f: () => { S.spd *= 1.2; S.jump *= 1.08; }, w: 1.5 },
  { n: '회피 +8%', f: () => (S.dodge = (S.dodge || 0) + 0.08), max: 4, w: 1.5 },
  { n: '치명타 확률 +8%', f: () => (S.crit = (S.crit || 0) + 0.08), max: 4 },
  { n: '받는 피해 -7%', f: () => (S.dr = (S.dr || 0) + 0.07), max: 4 },
  { n: '빙결 확률 +7%', f: () => (S.frz = (S.frz || 0) + 0.07), max: 3 },
  { n: '처치 시 골드 +1', f: () => (S.gkill = (S.gkill || 0) + 1), max: 3 },
  { n: '최대 HP +25 · 회복', f: () => { S.maxhp += 25; p.hp += 40; } },
  { n: '마법구체 +1발', f: () => S.multi++ },
  { n: '폭발 범위 +25%', f: () => (S.area *= 1.25) },
  { n: '마법 쿨타임 -15%', f: () => (S.cdr *= 0.85) },
  { n: '마법 위력 +30%', f: () => (S.mp *= 1.3) },
  { n: '흡혈: 처치 시 HP +3', f: () => (S.ls += 3) },
  { n: '경험치 획득 +25%', f: () => (S.xpm *= 1.25) },
  { n: '점프 +1단 (이단/삼단 점프)', f: () => S.mj++, max: 2 },
  { n: '아이템 자석 +50%', f: () => (S.mag *= 1.5) },
  { n: '소환수 +1마리', f: () => S.sn++, max: 4 },
  { n: '소환 쿨타임 -20%', f: () => (S.scd *= 0.8), max: 4 },
  { n: '소환수 강화 +30%', f: () => (S.sm *= 1.3) },
];

// ----- 장비 / 유물 효과 키 -----
//  퍼센트 증가: atk as spd mp area xpm mag sm gold   (0.15 = +15%)
//  쿨타임 감소: cdr scd                              (0.2  = -20%)
//  더하기:     maxhp multi ls mj sn crit vamp dr thorns revive
//    crit: 치명타 확률 / critx: 치명타 배율 추가(기본 2배) / vamp: 검 피해 흡혈 비율
//    dodge: 회피 확률 (피해 완전 무시)
//    dr: 받는 피해 감소(음수면 증가) / thorns: 닿은 적에게 공격력×값 반격 / revive: 스테이지마다 부활 횟수
//  특수 효과:
//    frz: 검·마법 적중 시 빙결 확률 (보스는 둔화) / frzT: 빙결 시간 추가(초) / frzB: 빙결된 적에게 추가 피해
//    sfrz: 소환수 공격 빙결 확률 / frzA: 피격 시 주변 적 빙결 (쿨 4초)
//    burn: 마법 폭발이 3초간 불태움 (초당 공격력×값) / psn: 검 적중 시 독 중첩 (최대 5, 중첩당 초당 공격력×값)
//    chain: 마법 폭발 시 주변 적에게 연쇄 번개 (명 수) / swave: 검을 휘두르면 관통 검기 (공격력×값)
//    exe: 체력이 이 비율 이하인 일반 적 즉사 / kboom: 적 처치 시 폭발 (공격력×값)
//  경제·유틸:
//    gdup: 골드를 주울 때마다 같은 양 추가 / intr: 스테이지 클리어 시 보유 골드 이자 (최대 800×값)
//    vac: 포털이 열리면 맵의 드롭을 모두 끌어오고, 포털 진입 시 남은 것 자동 획득
//    luck: ★몬스터 등장 확률 증가, 장비 드롭 확률 증가 / bounty: ★몬스터 보상 2배
//    disc: 상점 가격 할인 / freeroll: 상점마다 무료 새로고침 횟수 / clrxp: 클리어 시 레벨업 게이지 획득
//    chest: 보물상자 항상 등장 + 보상 증가 / gkill: 적 처치 시 골드 추가
const SLOT = { wpn: '무기', arm: '갑옷', acc: '장신구' };              // 아이템 종류
const TIER_NAME = ['', '일반', '희귀', '전설'];

const ITEMS = [
  // ===== 무기 =====
  { id: 'rust',    slot: 'wpn', tier: 1, price: 50,  n: '녹슨 마검',      d: '공격력 +25%', m: { atk: 0.25 } },
  { id: 'grim',    slot: 'wpn', tier: 1, price: 80,  n: '심연의 마도서',  d: '마법 위력 +50%', m: { mp: 0.5 } },
  { id: 'quick',   slot: 'wpn', tier: 1, price: 70,  n: '쾌속 단검',      d: '공격 속도 +25%, 이동 속도 +12%', m: { as: 0.25, spd: 0.12 } },
  { id: 'vampsw',  slot: 'wpn', tier: 1, price: 120, n: '흡혈 대검',      d: '공격력 +30%, 검 피해의 8% 흡혈', m: { atk: 0.3, vamp: 0.08 } },
  { id: 'frostpk', slot: 'wpn', tier: 2, price: 180, n: '서리 송곳',      d: '공격력 +25%, 적중 시 20% 확률로 ❄빙결 (1.5초 정지)', m: { atk: 0.25, frz: 0.2 } },
  { id: 'flame',   slot: 'wpn', tier: 2, price: 170, n: '화염 지팡이',    d: '마법 위력 +40%, 마법 폭발이 3초간 🔥불태움 (초당 공격력 80%)', m: { mp: 0.4, burn: 0.8 } },
  { id: 'venom',   slot: 'wpn', tier: 2, price: 160, n: '맹독 단검',      d: '공격 속도 +30%, 검 적중 시 ☠독 중첩 (최대 5, 중첩당 초당 공격력 35%)', m: { as: 0.3, psn: 0.35 } },
  { id: 'split',   slot: 'wpn', tier: 2, price: 200, n: '분열의 지팡이',  d: '마법구체 +2, 마법 위력 +15%', m: { multi: 2, mp: 0.15 } },
  { id: 'wavesw',  slot: 'wpn', tier: 2, price: 220, n: '검기의 대검',    d: '공격력 +30%, 검을 휘두르면 적을 관통하는 검기 발사 (공격력 150%)', m: { atk: 0.3, swave: 1.5 } },
  { id: 'thunder', slot: 'wpn', tier: 3, price: 320, n: '뇌신의 홀',      d: '마법 위력 +60%, 폭발 시 ⚡연쇄 번개가 주변 적 4명 타격', m: { mp: 0.6, chain: 4 } },
  { id: 'zero',    slot: 'wpn', tier: 3, price: 380, n: '절대영도',       d: '공격력 +50%, 빙결 확률 +35%, 빙결된 적에게 피해 +60%', m: { atk: 0.5, frz: 0.35, frzB: 0.6 } },
  { id: 'scythe',  slot: 'wpn', tier: 3, price: 400, n: '마왕의 대낫',    d: '공격력 +80%, 체력 20% 이하 일반 적 즉사, 처치 시 HP +5', m: { atk: 0.8, exe: 0.2, ls: 5 } },
  { id: 'scepter', slot: 'wpn', tier: 3, price: 300, n: '군주의 홀',      d: '소환수 +3, 소환수 강화 +60%, 소환수 공격 15% 빙결', m: { sn: 3, sm: 0.6, sfrz: 0.15 } },
  // ===== 갑옷 =====
  { id: 'cloak',   slot: 'arm', tier: 1, price: 50,  n: '가죽 망토',      d: '최대 HP +40', m: { maxhp: 40 } },
  { id: 'windc',   slot: 'arm', tier: 1, price: 90,  n: '바람의 외투',    d: '이동 속도 +20%, 점프 +1단', m: { spd: 0.2, mj: 1 } },
  { id: 'iron',    slot: 'arm', tier: 1, price: 120, n: '흑철 갑옷',      d: '최대 HP +60, 받는 피해 -12%', m: { maxhp: 60, dr: 0.12 } },
  { id: 'frostar', slot: 'arm', tier: 2, price: 190, n: '서리 갑주',      d: '최대 HP +50, 받는 피해 -15%, 맞으면 주변 적 ❄빙결', m: { maxhp: 50, dr: 0.15, frzA: 1 } },
  { id: 'shadow',  slot: 'arm', tier: 2, price: 180, n: '그림자 망토',    d: '이동 속도 +30%, 회피 +12%, 최대 HP +20', m: { spd: 0.3, dodge: 0.12, maxhp: 20 } },
  { id: 'robe',    slot: 'arm', tier: 2, price: 170, n: '피의 로브',      d: '최대 HP +40, 처치 시 HP +4, 검 흡혈 5%', m: { maxhp: 40, ls: 4, vamp: 0.05 } },
  { id: 'thorn',   slot: 'arm', tier: 2, price: 200, n: '가시 갑주',      d: '최대 HP +60, 받는 피해 -15%, 닿은 적에게 공격력 300% 반격', m: { maxhp: 60, dr: 0.15, thorns: 3 } },
  { id: 'dragon',  slot: 'arm', tier: 3, price: 340, n: '용린 갑주',      d: '최대 HP +150, 받는 피해 -25%', m: { maxhp: 150, dr: 0.25 } },
  { id: 'phoenix', slot: 'arm', tier: 3, price: 360, n: '불사조 망토',    d: '최대 HP +60, 스테이지마다 1번 부활, 마법 폭발 🔥화상', m: { maxhp: 60, revive: 1, burn: 0.5 } },
  // ===== 장신구 (2칸까지 장착) =====
  { id: 'coin',    slot: 'acc', tier: 1, price: 60,  n: '행운의 동전',    d: '골드 획득 +50%', m: { gold: 0.5 } },
  { id: 'sage',    slot: 'acc', tier: 1, price: 80,  n: '현자의 반지',    d: '경험치 +40%, 아이템 자석 +80%', m: { xpm: 0.4, mag: 0.8 } },
  { id: 'hunter',  slot: 'acc', tier: 1, price: 120, n: '사냥꾼의 목걸이', d: '치명타 확률 +20%', m: { crit: 0.2 } },
  { id: 'feather', slot: 'acc', tier: 1, price: 60,  n: '가벼운 깃털',    d: '이동 속도 +18%, 점프 +1단', m: { spd: 0.18, mj: 1 } },
  { id: 'mistrg',  slot: 'acc', tier: 2, price: 150, n: '안개 반지',      d: '회피 +15% (피해를 완전히 무시)', m: { dodge: 0.15 } },
  { id: 'gale',    slot: 'acc', tier: 2, price: 160, n: '질풍의 발찌',    d: '이동 속도 +25%, 공격 속도 +20%', m: { spd: 0.25, as: 0.2 } },
  { id: 'hermes',  slot: 'acc', tier: 3, price: 300, n: '헤르메스의 날개', d: '이동 속도 +40%, 점프 +2단, 회피 +15%', m: { spd: 0.4, mj: 2, dodge: 0.15 } },
  { id: 'frostrg', slot: 'acc', tier: 2, price: 150, n: '서리 반지',      d: '❄빙결 확률 +12%, 빙결 시간 +1초', m: { frz: 0.12, frzT: 1 } },
  { id: 'hourear', slot: 'acc', tier: 2, price: 170, n: '시간의 귀걸이',  d: '마법·소환 쿨타임 -30%', m: { cdr: 0.3, scd: 0.3 } },
  { id: 'soul',    slot: 'acc', tier: 2, price: 170, n: '영혼의 부적',    d: '소환수 강화 +60%, 소환수 +1', m: { sm: 0.6, sn: 1 } },
  { id: 'storm',   slot: 'acc', tier: 2, price: 190, n: '폭풍의 인장',    d: '공격 속도 +30%, 폭발 범위 +35%', m: { as: 0.3, area: 0.35 } },
  { id: 'corpse',  slot: 'acc', tier: 2, price: 200, n: '시체 폭발 부적', d: '적 처치 시 💥폭발 (공격력 250% 범위 피해)', m: { kboom: 2.5 } },
  // --- 경제·유틸 장신구 ---
  { id: 'sack',    slot: 'acc', tier: 1, price: 70,  n: '수집가의 자루',  d: '포털이 열리면 맵의 경험치·골드·아이템을 전부 끌어오고, 포털에 들어가면 남은 것도 자동 획득', m: { vac: 1, mag: 0.3 } },
  { id: 'ledger',  slot: 'acc', tier: 1, price: 100, n: '은행가의 장부',  d: '스테이지 클리어 시 보유 골드의 10% 이자 (최대 80G)', m: { intr: 0.1 } },
  { id: 'clover',  slot: 'acc', tier: 1, price: 90,  n: '네잎 클로버',    d: '★몬스터 등장 확률 +60%, ★몬스터 장비 드롭 +50%', m: { luck: 0.6 } },
  { id: 'goose',   slot: 'acc', tier: 2, price: 180, n: '황금 거위 깃털', d: '골드를 주울 때마다 같은 양을 한 번 더 획득', m: { gdup: 1 } },
  { id: 'seal',    slot: 'acc', tier: 2, price: 150, n: '상인의 인장',    d: '상점 가격 -20%, 상점마다 새로고침 1회 무료', m: { disc: 0.2, freeroll: 1 } },
  { id: 'tome',    slot: 'acc', tier: 2, price: 160, n: '경험의 서',      d: '스테이지 클리어 시 레벨업 게이지 40% 획득, 경험치 +20%', m: { clrxp: 0.4, xpm: 0.2 } },
  { id: 'tmap',    slot: 'acc', tier: 2, price: 140, n: '보물 지도',      d: '매 스테이지 보물상자 등장, 상자 보상 +50%', m: { chest: 1 } },
  { id: 'bounty',  slot: 'acc', tier: 2, price: 170, n: '현상금 증표',    d: '★몬스터 처치 시 골드·경험치 2배, 등장 확률 +30%', m: { bounty: 1, luck: 0.3 } },
  { id: 'midas',   slot: 'acc', tier: 3, price: 320, n: '미다스의 손',    d: '골드 +80%, 이자 15% (최대 120G), 적 처치 시 골드 +2', m: { gold: 0.8, intr: 0.15, gkill: 2 } },
  // --- 전투 장신구 (전설) ---
  { id: 'pact',    slot: 'acc', tier: 3, price: 320, n: '피의 계약',      d: '공격력 +40%, 치명타 +20%, 치명타 피해 3배', m: { atk: 0.4, crit: 0.2, critx: 1 } },
  { id: 'chaos',   slot: 'acc', tier: 3, price: 340, n: '혼돈의 눈',      d: '❄빙결 +15%, 🔥화상, ☠독, ⚡연쇄 번개 2명 — 모든 원소를 부여', m: { frz: 0.15, burn: 0.5, psn: 0.25, chain: 2 } },
];

// 보스를 쓰러뜨리면 3개 중 1개 선택. 장착 없이 영구 적용.
const RELICS = [
  { id: 'grail',  n: '피의 성배',       d: '최대 HP +50, 처치 시 HP +3', m: { maxhp: 50, ls: 3 } },
  { id: 'horn',   n: '마왕의 뿔',       d: '공격력 +40%', m: { atk: 0.4 } },
  { id: 'glass',  n: '시간의 모래시계', d: '마법·소환 쿨타임 -30%', m: { cdr: 0.3, scd: 0.3 } },
  { id: 'banner', n: '군주의 깃발',     d: '소환수 +2, 소환수 강화 +50%', m: { sn: 2, sm: 0.5 } },
  { id: 'prism',  n: '분열의 수정',     d: '마법구체 +2', m: { multi: 2 } },
  { id: 'heart',  n: '불사의 심장',     d: '스테이지마다 1번, 쓰러지면 HP 50%로 부활', m: { revive: 1 } },
  { id: 'crown',  n: '탐욕의 왕관',     d: '골드 +70%, 경험치 +25%', m: { gold: 0.7, xpm: 0.25 } },
  { id: 'wing',   n: '폭풍의 날개',     d: '이동 속도 +25%, 점프 +1단', m: { spd: 0.25, mj: 1 } },
  { id: 'eye',    n: '저주받은 눈',     d: '치명타 확률 +25%', m: { crit: 0.25 } },
  { id: 'fang',   n: '흡혈귀의 송곳니', d: '검 피해의 12% 흡혈', m: { vamp: 0.12 } },
  { id: 'aegis',  n: '어둠의 방패',     d: '받는 피해 -25%', m: { dr: 0.25 } },
  { id: 'iceq',   n: '얼음 여왕의 심장', d: '❄빙결 확률 +20%, 맞으면 주변 적 빙결', m: { frz: 0.2, frzA: 1 } },
  { id: 'hellf',  n: '지옥불 인장',     d: '마법 폭발 🔥화상 (초당 공격력 120%)', m: { burn: 1.2 } },
  { id: 'stormc', n: '폭풍의 핵',       d: '마법 폭발 시 ⚡연쇄 번개 3명', m: { chain: 3 } },
  { id: 'boots',  n: '바람신의 장화',   d: '이동 속도 +35%, 회피 +10%', m: { spd: 0.35, dodge: 0.1 } },
  { id: 'stone',  n: '연금술사의 돌',   d: '이자 20% (최대 160G), 골드 +30%', m: { intr: 0.2, gold: 0.3 } },
  { id: 'hoard',  n: '용의 보물더미',   d: '골드를 주울 때마다 같은 양 추가, 보물상자 항상 등장', m: { gdup: 1, chest: 1 } },
  { id: 'star',   n: '떨어진 별',       d: '★몬스터 등장 확률 +100%, 장비 드롭 +80%, 보상 2배', m: { luck: 1, bounty: 1 } },
  { id: 'vacuum', n: '공허의 아가리',   d: '포털이 열리면 드롭 전부 흡수, 클리어 시 레벨업 게이지 30%', m: { vac: 1, clrxp: 0.3 } },
];

const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const RELIC = Object.fromEntries(RELICS.map((r) => [r.id, r]));

// ----- 버프 아이템 (적이 떨어뜨림) -----
const BF = { atk: ['공격력 UP', '#ff5a5a'], spd: ['신속', '#5ac8ff'], haste: ['광폭화', '#ffd24a'], guard: ['수호', '#a58bff'] };

// ----- 기본 키 -----
const KD = { atk: 'KeyF', mag: 'KeyE', sum: 'KeyQ', jmp: 'Space', por: 'KeyW', L: 'KeyA', R: 'KeyD', dn: 'KeyS', inv: 'KeyI' };
const KN = { atk: '공격', mag: '마법', sum: '소환', jmp: '점프', por: '포털·상자', L: '왼쪽', R: '오른쪽', dn: '아래', inv: '장비창' };
