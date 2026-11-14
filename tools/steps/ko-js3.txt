// ko.js — 한국어판 표시 시점 오버레이 + 하위 경로(/klarbase-ko/) 보정.
// 원문 DOM 은 그대로 두고, 사전에 있는 문구만 한국어로 바꾼다. English 로 토글하면 원문으로 되돌린다.
// 원작: https://github.com/TanmoyP/klarbase (MIT) · 한국어판: sigco3111
import dUi from './dict-ui.js';
import dIsles from './dict-isles.js';
import dBuilder from './dict-builder.js';
import dGuide from './dict-guide.js';
import dExtra from './dict-extra.js';

// 1) 하위 경로 보정. 앱은 '/play' 같은 절대 경로로 주소를 바꾸므로 BASE 를 앞에 붙이고, 읽을 때는 BASE 를 뺀다.
const BASE = '/klarbase-ko';
const under = u => u === BASE || u.startsWith(BASE + '/');
const fixPath = u => (typeof u === 'string' && u.startsWith('/') && !under(u) ? BASE + u : u);
const origPush = history.pushState.bind(history);
const origReplace = history.replaceState.bind(history);
history.pushState = (s, t, u) => origPush(s, t, fixPath(u));
history.replaceState = (s, t, u) => origReplace(s, t, fixPath(u));
window.__koPath = () => { const p = location.pathname; return under(p) ? (p.slice(BASE.length) || '/') : p; };

// 2) 사전
const MAP = new Map();
for (const p of [dUi, dIsles, dBuilder, dGuide, dExtra]) for (const k of Object.keys(p)) MAP.set(k, p[k]);
const T = s => (MAP.get(s) != null ? MAP.get(s) : s);
const lockKo = s => {
  const m = /^ 🔒 Light (.+) (\d+)\/(\d+) · (.+) (\d+)\/(\d+)$/.exec(s);
  return m ? ' 🔒 ' + T(m[1]) + ' ' + m[2] + '/' + m[3] + ' 밝힘 · ' + T(m[4]) + ' ' + m[5] + '/' + m[6] : s;
};

// 3) 숫자가 섞인 문구 규칙 (사전에 정확히 없는 것만)
const RULES = [
  [/^(.+) · isle (\d+) of (\d+)$/, m => T(m[1]) + ' · 섬 ' + m[2] + ' / ' + m[3]],
  [/^isle (\d+) of (\d+)$/i, m => '섬 ' + m[1] + ' / ' + m[2]],
  [/^(✦ )?(Twist )?(Breeze|Easy|Tricky|Hard|Fiendish|Mythic) (\d+) (.+?) par (\d+) ★★★(.*)$/,
    m => (m[1] ? '✦ ' : '') + (m[2] ? '변형 ' : '') + T(m[3]) + ' ' + m[4] + ' ' + T(m[5]) + ' 기준 ' + m[6] + ' ★★★' + lockKo(m[7])],
  [/^(Breeze|Easy|Tricky|Hard|Fiendish|Mythic) (\d+)$/, m => T(m[1]) + ' ' + m[2]],
  [/^(.+) · (.+) · (\d+)\/(\d+) ★$/, m => T(m[1]) + ' · ' + T(m[2]) + ' · ' + m[3] + '/' + m[4] + ' ★'],
  [/^(.+) · (\d+)\/(\d+) ★$/, m => T(m[1]) + ' · ' + m[2] + '/' + m[3] + ' ★'],
  [/^par (\d+)$/, m => '기준 ' + m[1]],
  [/^☀ Daily #(\d+)$/, m => '☀ 데일리 #' + m[1]],
  [/^Your sky · (\d+) \/ (\d+) ★ · (\d+) lit$/, m => '내 하늘 · ' + m[1] + ' / ' + m[2] + ' ★ · ' + m[3] + '개 밝힘'],
  [/^Your sky: (\d+) of (\d+) constellations lit$/, m => '내 하늘: 별자리 ' + m[1] + ' / ' + m[2] + ' 밝힘'],
  [/^▶ (\d+) plays · (\d+)% clear · (\d+)% at par$/, m => '▶ ' + m[1] + '회 플레이 · ' + m[2] + '% 클리어 · ' + m[3] + '% 기준 달성'],
  [/^Difficulty (\d+)\/100 · early estimate — (\d+) of (\d+) plays so far; starts from the maker’s gut call$/,
    m => '난이도 ' + m[1] + '/100 · 초기 추정 — 지금까지 ' + m[2] + '/' + m[3] + '회 플레이, 만든 이의 짐작에서 시작'],
  [/^✓ Solvable in (\d+) moves · sign in to see the route$/, m => '✓ ' + m[1] + '수로 풀 수 있음 · 경로를 보려면 로그인'],
  [/^([A-Za-z]+) (\d+) · estimated from the solver · settles as people play$/,
    m => T(m[1]) + ' ' + m[2] + ' · 해법기 추정 · 플레이가 쌓이면 안정됩니다'],
  [/^Remix: (.+)$/, m => '리믹스: ' + T(m[1])],
  [/^Isle (\d+)$/, m => '섬 ' + m[1]],
  [/^by @(.+)$/, m => '@' + m[1] + ' 제작'],
];

// 낱말 단위 보정: 문장이 사전에 없을 때 짧은 라벨에서만 쓴다
const WORDS = [
  [/\bUndo\b/g, '되돌리기'], [/\bRestart\b/g, '다시 시작'], [/\bTip\b/g, '팁'],
  [/\bSolution\b/g, '해법'], [/\bTurn\b/g, '회전'], [/\bMap\b/g, '지도'],
  [/\bHint\b/g, '힌트'], [/\bBreeze\b/g, '산들바람'], [/\bEasy\b/g, '쉬움'],
  [/\bTricky\b/g, '까다로움'], [/\bHard\b/g, '어려움'], [/\bFiendish\b/g, '가혹함'],
  [/\bMythic\b/g, '신화'], [/\bWin\b/g, '승리'],
];
const norm = s => s.replace(/\s+/g, ' ').trim();
const wordPass = t => {
  if (t.length > 60) return null;
  let out = t;
  for (const [re, ko] of WORDS) out = out.replace(re, ko);
  return out === t ? null : out;
};
const lookup = t => {
  const v = MAP.get(t);
  if (v != null) return v;
  for (const [re, fn] of RULES) { const m = re.exec(t); if (m) return fn(m); }
  return wordPass(t);
};

// 4) DOM 적용
const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'CANVAS']);
const KEY = 'klarbase.ko.lang';
let mode = localStorage.getItem(KEY) || 'ko';
const recs = new WeakMap();

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
      const w = (/^\s*/.exec(cur) || [''])[0] + v + (/\s*$/.exec(cur) || [''])[0];
      recs.set(node, { orig: cur, written: w });
      node.nodeValue = w;
      return;
    }
  }
  recs.set(node, { orig: cur, written: cur });
}
function applyAttrs(el){
  let st = recs.get(el);
  if (!st){ st = {}; recs.set(el, st); }
  for (const a of ATTRS){
    const cur = el.getAttribute(a);
    if (!cur) continue;
    const rec = st[a];
    if (rec && rec.written === cur) continue;
    if (mode === 'ko' && /[A-Za-z]/.test(cur)){
      const v = lookup(norm(cur));
      if (v != null){ st[a] = { orig: cur, written: v }; el.setAttribute(a, v); continue; }
    }
    st[a] = { orig: cur, written: cur };
  }
}
function accept(n){
  const p = n.parentElement;
  return !!p && !SKIP_TAGS.has(p.tagName) && !p.closest('[data-ko-skip]');
}
const ATTR_SEL = ATTRS.map(a => '[' + a + ']').join(',');
function walk(root){
  if (!root) return;
  if (root.nodeType === 3){ if (accept(root)) applyText(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  const el = root.nodeType === 1 ? root : document.body;
  if (!el) return;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) if (accept(n)) applyText(n);
  if (el.querySelectorAll) el.querySelectorAll(ATTR_SEL).forEach(applyAttrs);
  if (el.nodeType === 1) applyAttrs(el);
}
const obs = new MutationObserver(list => {
  for (const m of list){
    if (m.type === 'characterData'){ if (accept(m.target)) applyText(m.target); }
    else if (m.type === 'attributes'){ if (m.target && m.target.getAttribute) applyAttrs(m.target); }
    else for (const n of m.addedNodes) walk(n);
  }
});
function paintToggle(){
  const b = document.getElementById('koToggle');
  if (b) b.textContent = mode === 'ko' ? 'English' : '한국어';
}
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
    document.querySelectorAll(ATTR_SEL).forEach(el => {
      const st = recs.get(el); if (!st) return;
      for (const a of ATTRS){ const rec = st[a]; if (rec && el.getAttribute(a) === rec.written) el.setAttribute(a, rec.orig); }
    });
  }
  obs.takeRecords();
  walk(document.body);
  paintToggle();
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
