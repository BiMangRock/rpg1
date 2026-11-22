// =====================================================================
//  아이콘 — assets/icons/*.png (이모지 대신 쓰는 이미지)
//   HTML: 메뉴 문자열 안의 이모지를 show()에서 자동으로 <img>로 바꿈 (emo)
//   캔버스: richText()가 이모지 자리에 아이콘을 그려 줌
// =====================================================================

// 이모지/기호 → 아이콘 키
const EMO = {
  '❄': 'st_frost', '🔥': 'st_burn', '☠': 'st_poison', '⚡': 'st_chain', '💥': 'st_boom',
  '💧': 'st_water', '✦': 'st_stun', '★': 'st_star', '☆': 'st_star_empty',
  '🔒': 'ui_lock', '🔓': 'ui_unlock',
  '✚': 'role_cleric', '♪': 'role_bard', '◆': 'role_summoner', '⬡': 'role_warden',
};
const EMO_RE = new RegExp(`(${Object.keys(EMO).join('|')})️?`, 'gu');

// 이미지 미리 불러오기 (장비·유물은 슬롯_id / relic_id)
const ICON = {};
const iconSrc = (k) => `assets/icons/${k}.png`;
function loadIcon(k) {
  if (ICON[k]) return ICON[k];
  const im = new Image(); im.src = iconSrc(k); ICON[k] = im; return im;
}
[...Object.values(EMO), 'ui_gold', 'ui_next', 'bf_atk', 'bf_spd', 'bf_haste', 'bf_guard',
  ...ITEMS.map((i) => `${i.slot}_${i.id}`), ...RELICS.map((r) => `relic_${r.id}`)].forEach(loadIcon);

const itemIcon = (it) => `${it.slot}_${it.id}`;
const relicIcon = (r) => `relic_${r.id}`;

// ----- HTML -----
const icImg = (k, cls = 'ic') => `<img class="${cls}" src="${iconSrc(k)}" alt="">`;
const emo = (h) => h.replace(EMO_RE, (m, c) => icImg(EMO[c]));

// ----- 캔버스 -----
const icReady = (k) => { const im = ICON[k]; return im && im.complete && im.naturalWidth > 0; };
// 아이콘 하나 그리기 (중심 기준)
function drawIcon(k, x, y, s) {
  if (!icReady(k)) return false;
  g.drawImage(ICON[k], x - s / 2, y - s / 2, s, s); return true;
}
// 이모지가 섞인 문자열을 그림. g.font / g.textAlign / g.fillStyle 그대로 따름.
// shadow: 검은 그림자 오프셋(px). 텍스트에만 그림자, 아이콘은 그대로.
function richText(str, x, y, shadow = 0) {
  const fs = parseFloat(g.font) || 16, s = Math.round(fs * 1.15), gap = 1;
  const parts = [];
  let last = 0;
  for (const m of str.matchAll(EMO_RE)) {
    if (m.index > last) parts.push({ t: str.slice(last, m.index) });
    parts.push({ k: EMO[m[1]] });
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push({ t: str.slice(last) });
  // 이미지가 아직 안 불러와졌으면 그냥 글자로
  for (const p of parts) if (p.k && !icReady(p.k)) { p.t = Object.keys(EMO).find((c) => EMO[c] === p.k); delete p.k; }
  for (const p of parts) p.w = p.k ? s + gap * 2 : g.measureText(p.t).width;
  const total = parts.reduce((a, p) => a + p.w, 0);
  const al = g.textAlign;
  let cx = al === 'center' ? x - total / 2 : al === 'right' || al === 'end' ? x - total : x;
  const col = g.fillStyle;
  g.textAlign = 'left';
  for (const p of parts) {
    if (p.k) drawIcon(p.k, cx + p.w / 2, y - fs * 0.35, s);
    else {
      if (shadow) { g.fillStyle = '#000'; g.fillText(p.t, cx + shadow, y + shadow); g.fillStyle = col; }
      g.fillText(p.t, cx, y);
    }
    cx += p.w;
  }
  g.textAlign = al;
}
