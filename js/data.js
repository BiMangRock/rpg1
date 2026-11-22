// =====================================================================
//  게임 데이터 — 숫자 밸런스는 대부분 여기서 조절하면 됩니다.
// =====================================================================

// ----- 화면 / 월드 크기 -----
const W = 960, H = 540; // 캔버스 크기
const GY = 470;         // 땅 높이
const WW = 2600;        // 스테이지 가로 길이

// ----- 기본 수치 -----
const MAG_CD = 0.7; // 마법 기본 쿨타임(초)
const SCD = 12;     // 소환 기본 쿨타임(초)
const MAXA = 12;    // 소환수 최대 수
const POTION_PRICE = 40;
const REROLL_PRICE = 20;

// ----- 월드 / 스테이지 -----
// 월드마다 일반 스테이지 3개 + 보스 스테이지 1개 (4번째 = 보스)
// a/b: 하늘 그라데이션, e: 땅/발판 강조색, q: 포털이 열리는 처치 수, pool: 등장하는 적
const WORLDS = [
  {
    n: '인간 왕국', boss: 'hero', tier: 1,
    stages: [
      { n: '평화로운 마을', a: '#2b1240', b: '#0d0616', e: '#5ad06b', q: 10, pool: ['farmer', 'villager'] },
      { n: '국경 초소', a: '#3a1a2a', b: '#10060c', e: '#d0a05a', q: 14, pool: ['farmer', 'villager', 'swordsman', 'archer'] },
      { n: '왕국의 성하', a: '#43121f', b: '#12060a', e: '#e8685a', q: 18, pool: ['swordsman', 'archer', 'paladin', 'farmer'] },
      { n: '용사의 성전', a: '#122244', b: '#050818', e: '#6ab4ff' },
    ],
  },
  {
    n: '성교국', boss: 'pope', tier: 2,
    stages: [
      { n: '순례자의 길', a: '#2a2a10', b: '#0c0c04', e: '#e8d87a', q: 16, pool: ['swordsman', 'archer', 'cleric', 'bard'] },
      { n: '침묵의 수도원', a: '#14282a', b: '#050c0c', e: '#7ae8d8', q: 20, pool: ['paladin', 'archer', 'cleric', 'warden', 'summoner'] },
      { n: '대성당 회랑', a: '#2a1a3a', b: '#0a0612', e: '#c8a0ff', q: 24, pool: ['paladin', 'swordsman', 'cleric', 'bard', 'warden', 'summoner'] },
      { n: '대성당 제단', a: '#3a3020', b: '#100c06', e: '#ffe6a0' },
    ],
  },
];

// ----- 적 -----
// hp/sp(속도)/w/h/dm(공격 배율)/xp/gold, look: 외형 번호, ai: 행동 방식, cd: 지원 스킬 쿨타임
const ENEMY = {
  farmer:    { hp: 24,  sp: 60,  w: 32, h: 66, dm: 1,   xp: 2, gold: 2, col: '#8a6a3a', look: 0 },
  villager:  { hp: 16,  sp: 100, w: 30, h: 62, dm: 0.8, xp: 1, gold: 2, col: '#6a8aa8', look: 1 },
  swordsman: { hp: 60,  sp: 75,  w: 36, h: 76, dm: 1.6, xp: 4, gold: 4, col: '#8a8f9a', look: 2 },
  archer:    { hp: 28,  sp: 55,  w: 32, h: 68, dm: 0.9, xp: 3, gold: 3, col: '#3a7a4a', look: 3, ai: 'archer' },
  paladin:   { hp: 130, sp: 40,  w: 46, h: 84, dm: 1.8, xp: 7, gold: 6, col: '#dcdce8', look: 4 },
  // --- 2월드 지원형 ---
  cleric:    { hp: 45,  sp: 55,  w: 32, h: 70, dm: 0.8, xp: 5, gold: 5, col: '#efe9da', look: 5, ai: 'support', cd: 3.2, role: ['✚', '#7aff8a', '성직자'] },
  bard:      { hp: 40,  sp: 60,  w: 32, h: 68, dm: 0.8, xp: 5, gold: 5, col: '#d0602a', look: 6, ai: 'support', cd: 6,   role: ['♪', '#ffa040', '군악 사제'] },
  summoner:  { hp: 50,  sp: 45,  w: 34, h: 72, dm: 0.8, xp: 6, gold: 6, col: '#5a2a90', look: 7, ai: 'support', cd: 5,   role: ['◆', '#c08aff', '소환술사'] },
  warden:    { hp: 70,  sp: 45,  w: 38, h: 74, dm: 1,   xp: 6, gold: 6, col: '#3a5ab0', look: 8, ai: 'support', cd: 5,   role: ['⬡', '#7ac0ff', '수호 사제'] },
  // --- 소환물 / 보스 기믹 ---
  wisp:      { hp: 14,  sp: 150, w: 22, h: 22, dm: 0.6, xp: 0, gold: 0, ai: 'wisp', fly: 1, minion: 1 },
  crystal:   { hp: 150, sp: 0,   w: 40, h: 74, dm: 0,   xp: 3, gold: 10, ai: 'crystal' },
};

// ----- 레벨업 강화 (S = 레벨업으로 쌓이는 기본 스탯) -----
const UPGRADES = [
  { n: '공격력 +20%', f: () => (S.atk *= 1.2) },
  { n: '공격 속도 +15%', f: () => (S.as *= 1.15) },
  { n: '이동 속도 +12%', f: () => (S.spd *= 1.12) },
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
//    crit: 치명타 확률(피해 2배) / vamp: 검 피해 흡혈 비율 / dr: 받는 피해 감소(음수면 증가)
//    thorns: 닿은 적에게 공격력×값 반격 / revive: 스테이지마다 1회 부활
const SLOT = { wpn: '무기', arm: '갑옷', acc: '장신구' };

const ITEMS = [
  // 무기
  { id: 'rust',    slot: 'wpn', tier: 1, price: 60,  n: '녹슨 마검',      d: '공격력 +15%', m: { atk: 0.15 } },
  { id: 'grim',    slot: 'wpn', tier: 1, price: 90,  n: '심연의 마도서',  d: '마법 위력 +35%', m: { mp: 0.35 } },
  { id: 'vampsw',  slot: 'wpn', tier: 1, price: 140, n: '흡혈 대검',      d: '공격력 +20%, 검 피해의 6% 흡혈', m: { atk: 0.2, vamp: 0.06 } },
  { id: 'split',   slot: 'wpn', tier: 1, price: 160, n: '분열의 지팡이',  d: '마법구체 +1, 마법 위력 +10%', m: { multi: 1, mp: 0.1 } },
  { id: 'scepter', slot: 'wpn', tier: 2, price: 200, n: '군주의 홀',      d: '소환수 +2, 소환수 강화 +30%', m: { sn: 2, sm: 0.3 } },
  { id: 'axe',     slot: 'wpn', tier: 2, price: 230, n: '광폭의 도끼',    d: '공격력 +45%, 공격 속도 +15%, 받는 피해 +15%', m: { atk: 0.45, as: 0.15, dr: -0.15 } },
  { id: 'lance',   slot: 'wpn', tier: 2, price: 280, n: '종말의 마창',    d: '공격력 +30%, 마법 위력 +30%, 치명타 +10%', m: { atk: 0.3, mp: 0.3, crit: 0.1 } },
  // 갑옷
  { id: 'cloak',   slot: 'arm', tier: 1, price: 50,  n: '가죽 망토',      d: '최대 HP +25', m: { maxhp: 25 } },
  { id: 'windc',   slot: 'arm', tier: 1, price: 100, n: '바람의 외투',    d: '이동 속도 +15%, 점프 +1단', m: { spd: 0.15, mj: 1 } },
  { id: 'iron',    slot: 'arm', tier: 1, price: 130, n: '흑철 갑옷',      d: '최대 HP +50, 받는 피해 -10%', m: { maxhp: 50, dr: 0.1 } },
  { id: 'robe',    slot: 'arm', tier: 2, price: 170, n: '피의 로브',      d: '최대 HP +30, 처치 시 HP +3', m: { maxhp: 30, ls: 3 } },
  { id: 'thorn',   slot: 'arm', tier: 2, price: 220, n: '가시 갑주',      d: '최대 HP +40, 받는 피해 -15%, 몸에 닿은 적에게 반격', m: { maxhp: 40, dr: 0.15, thorns: 2 } },
  { id: 'dragon',  slot: 'arm', tier: 2, price: 300, n: '용린 갑주',      d: '최대 HP +100, 받는 피해 -20%', m: { maxhp: 100, dr: 0.2 } },
  // 장신구
  { id: 'coin',    slot: 'acc', tier: 1, price: 60,  n: '행운의 동전',    d: '골드 획득 +40%', m: { gold: 0.4 } },
  { id: 'sage',    slot: 'acc', tier: 1, price: 90,  n: '현자의 반지',    d: '경험치 +30%, 아이템 자석 +60%', m: { xpm: 0.3, mag: 0.6 } },
  { id: 'hunter',  slot: 'acc', tier: 1, price: 140, n: '사냥꾼의 목걸이', d: '치명타 확률 +15% (피해 2배)', m: { crit: 0.15 } },
  { id: 'hourear', slot: 'acc', tier: 2, price: 170, n: '시간의 귀걸이',  d: '마법·소환 쿨타임 -20%', m: { cdr: 0.2, scd: 0.2 } },
  { id: 'soul',    slot: 'acc', tier: 2, price: 180, n: '영혼의 부적',    d: '소환수 강화 +50%, 소환수 +1', m: { sm: 0.5, sn: 1 } },
  { id: 'storm',   slot: 'acc', tier: 2, price: 210, n: '폭풍의 인장',    d: '공격 속도 +25%, 폭발 범위 +25%', m: { as: 0.25, area: 0.25 } },
];

// 보스를 쓰러뜨리면 3개 중 1개 선택. 장착 없이 영구 적용.
const RELICS = [
  { id: 'grail',  n: '피의 성배',       d: '최대 HP +30, 처치 시 HP +2', m: { maxhp: 30, ls: 2 } },
  { id: 'horn',   n: '마왕의 뿔',       d: '공격력 +30%', m: { atk: 0.3 } },
  { id: 'glass',  n: '시간의 모래시계', d: '마법·소환 쿨타임 -25%', m: { cdr: 0.25, scd: 0.25 } },
  { id: 'banner', n: '군주의 깃발',     d: '소환수 +2, 소환수 강화 +40%', m: { sn: 2, sm: 0.4 } },
  { id: 'prism',  n: '분열의 수정',     d: '마법구체 +2', m: { multi: 2 } },
  { id: 'heart',  n: '불사의 심장',     d: '스테이지마다 1번, 쓰러지면 HP 50%로 부활', m: { revive: 1 } },
  { id: 'crown',  n: '탐욕의 왕관',     d: '골드 +60%, 경험치 +20%', m: { gold: 0.6, xpm: 0.2 } },
  { id: 'wing',   n: '폭풍의 날개',     d: '이동 속도 +20%, 점프 +1단', m: { spd: 0.2, mj: 1 } },
  { id: 'eye',    n: '저주받은 눈',     d: '치명타 확률 +20%', m: { crit: 0.2 } },
  { id: 'fang',   n: '흡혈귀의 송곳니', d: '검 피해의 10% 흡혈', m: { vamp: 0.1 } },
  { id: 'aegis',  n: '어둠의 방패',     d: '받는 피해 -20%', m: { dr: 0.2 } },
];

const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const RELIC = Object.fromEntries(RELICS.map((r) => [r.id, r]));

// ----- 버프 아이템 (적이 떨어뜨림) -----
const BF = { atk: ['공격력 UP', '#ff5a5a'], spd: ['신속', '#5ac8ff'], haste: ['광폭화', '#ffd24a'], guard: ['수호', '#a58bff'] };

// ----- 기본 키 -----
const KD = { atk: 'KeyF', mag: 'KeyE', sum: 'KeyQ', jmp: 'Space', por: 'KeyW', L: 'KeyA', R: 'KeyD', dn: 'KeyS' };
const KN = { atk: '공격', mag: '마법', sum: '소환', jmp: '점프', por: '포털', L: '왼쪽', R: '오른쪽', dn: '아래' };
