// ko.js — 한국어판 표시 시점 오버레이.
// 원문 DOM 은 그대로 두고, 사전에 있는 문구만 한국어로 바꾼다. English 로 토글하면 원문으로 되돌린다.
// 원작: https://github.com/TanmoyP/klarbase (MIT) · 한국어판: sigco3111
const PARTS = [
  (await import('./dict-ui.js')).default,
  (await import('./dict-isles.js')).default,
  (await import('./dict-builder.js')).default,
  (await import('./dict-guide.js')).default,
];
const MAP = new Map();
for (const p of PARTS) for (const k of Object.keys(p)) MAP.set(k, p[k]);
const T = s => (MAP.get(s) != null ? MAP.get(s) : s);

// 숫자가 섞인 문구 규칙 (사전에 정확히 없는 것만)
const RULES = [
  [/^(.+) · isle (\d+) of (\d+)$/, m => T(m[1]) + ' · 섬 ' + m[2] + ' / ' + m[3]],
  [/^isle (\d+) of (\d+)$/i, m => '섬 ' + m[1] + ' / ' + m[2]],
  [/^(.+) · (.+) · (\d+)\/(\d+) ★$/, m => T(m[1]) + ' · ' + T(m[2]) + ' · ' + m[3] + '/' + m[4] + ' ★'],
  [/^par (\d+)$/, m => '기준 ' + m[1]],
  [/^☀ Daily #(\d+)$/, m => '☀ 데일리 #' + m[1]],
  [/^Your sky · (\d+) \/ (\d+) ★ · (\d+) lit$/, m => '내 하늘 · ' + m[1] + ' / ' + m[2] + ' ★ · ' + m[3] + '개 밝힘'],
  [/^Your sky: (\d+) of (\d+) constellations lit$/, m => '내 하늘: 별자리 ' + m[1] + ' / ' + m[2] + ' 밝힘'],
  [/^▶ (\d+) plays · (\d+)% clear · (\d+)% at par$/, m => '▶ ' + m[1] + '회 플레이 · ' + m[2] + '% 클리어 · ' + m[3] + '% 기준 달성'],
  [/^Difficulty (\d+)\/100 · early estimate — (\d+) of (\d+) plays so far; starts from the maker’s gut call$/,
    m => '난이도 ' + m[1] + '/100 · 초기 추정 — 지금까지 ' + m[2] + '/' + m[3] + '회 플레이, 만든 이의 짐작에서 시작'],
  [/^🔒 Light (.+) (\d+)\/(\d+) · (.+) (\d+)\/(\d+)$/,
    m => '🔒 ' + T(m[1]) + ' ' + m[2] + '/' + m[3] + ' 밝힘 · ' + T(m[4]) + ' ' + m[5] + '/' + m[6]],
  [/^✓ Solvable in (\d+) moves · sign in to see the route$/, m => '✓ ' + m[1] + '수로 풀 수 있음 · 경로를 보려면 로그인'],
  [/^([A-Za-z]+) (\d+) · estimated from the solver · settles as people play$/,
    m => T(m[1]) + ' ' + m[2] + ' · 해법기 추정 · 플레이가 쌓이면 안정됩니다'],
  [/^Remix: (.+)$/, m => '리믹스: ' + T(m[1])],
  [/^Isle (\d+)$/, m => '섬 ' + m[1]],
  [/^by @(.+)$/, m => '@' + m[1] + ' 제작'],
  [/^(.+) · (\d+)\/(\d+) ★$/, m => T(m[1]) + ' · ' + m[2] + '/' + m[3] + ' ★'],
];

const norm = s => s.replace(/\s+/g, ' ').trim();
const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'CANVAS']);
const KEY = 'klarbase.ko.lang';
let mode = localStorage.getItem(KEY) || 'ko';
const recs = new WeakMap();

function lookup(t){
  const v = MAP.get(t);
  if (v != null) return v;
  for (const [re, fn] of RULES){
    const m = re.exec(t);
    if (m) return fn(m);
  }
  return null;
}
function applyText(node){
  const cur = node.nodeValue;
  if (!cur) return;
  const rec = recs.get(node);
  if (rec && rec.written === cur){
    if (mode === 'ko') return;
    node.nodeValue = rec.orig;
    recs.set(node, { orig: rec.orig, written: rec.orig });
    return;
  }
  if (mode === 'ko' && /[A-Za-z]/.test(cur)){
    const v = lookup(norm(cur));
    if (v != null){
      const lead = (/^\s*/.exec(cur) || [''])[0];
      const trail = (/\s*$/.exec(cur) || [''])[0];
      const w = lead + v + trail;
      recs.set(node, { orig: cur, written: w });
      node.nodeValue = w;
      return;
    }
  }
  recs.set(node, { orig: cur, written: cur });
}
function applyAttrs(el){
  let store = recs.get(el);
  if (!store){ store = {}; recs.set(el, store); }
  for (const a of ATTRS){
    const cur = el.getAttribute(a);
    if (!cur) continue;
    const rec = store[a];
    if (rec && rec.written === cur) continue;
    if (mode === 'ko' && /[A-Za-z]/.test(cur)){
      const v = lookup(norm(cur));
      if (v != null){ store[a] = { orig: cur, written: v }; el.setAttribute(a, v); continue; }
    }
    store[a] = { orig: cur, written: cur };
  }
}
function accept(n){
  const p = n.parentElement;
  if (!p || SKIP_TAGS.has(p.tagName) || p.closest('[data-ko-skip]')) return false;
  return true;
}
function walk(root){
  if (!root) return;
  if (root.nodeType === 3){ if (accept(root)) applyText(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  const el = root.nodeType === 1 ? root : document.body;
  if (!el) return;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) if (accept(n)) applyText(n);
  if (el.querySelectorAll) el.querySelectorAll(ATTRS.map(a => '[' + a + ']').join(',')).forEach(applyAttrs);
  applyAttrs(el);
}
const obs = new MutationObserver(list => {
  for (const m of list){
    if (m.type === 'characterData'){ if (accept(m.target)) applyText(m.target); }
    else if (m.type === 'attributes'){ if (m.target && m.target.getAttribute) applyAttrs(m.target); }
    else for (const n of m.addedNodes) walk(n);
  }
});
function setMode(next){
  mode = next;
  localStorage.setItem(KEY, next);
  document.documentElement.classList.toggle('ko', next === 'ko');
  document.documentElement.lang = next === 'ko' ? 'ko' : 'en';
  if (next === 'en'){
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())){
      const rec = recs.get(n);
      if (rec && rec.written === n.nodeValue && rec.orig !== rec.written) n.nodeValue = rec.orig;
    }
    document.querySelectorAll(ATTRS.map(a => '[' + a + ']').join(',')).forEach(el => {
      const st = recs.get(el); if (!st) return;
      for (const a of ATTRS){ const rec = st[a]; if (rec && el.getAttribute(a) === rec.written) el.setAttribute(a, rec.orig); }
    });
    obs.takeRecords();
  }
  walk(document.body);
  paintToggle();
}
function paintToggle(){
  const b = document.getElementById('koToggle');
  if (b) b.textContent = mode === 'ko' ? 'English' : '한국어';
}
function mount(){
  if (!document.getElementById('koToggle')){
    const b = document.createElement('button');
    b.id = 'koToggle';
    b.className = 'btn small glass';
    b.setAttribute('data-ko-skip', '1');
    b.title = '한국어 / English';
    b.addEventListener('click', () => setMode(mode === 'ko' ? 'en' : 'ko'));
    document.body.appendChild(b);
  }
  paintToggle();
}
document.documentElement.classList.toggle('ko', mode === 'ko');
document.documentElement.lang = mode === 'ko' ? 'ko' : 'en';
function start(){
  mount();
  walk(document.body);
  obs.observe(document.documentElement, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ATTRS,
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
