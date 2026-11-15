// ko.js — 한국어판 표시 시점 오버레이 + 하위 경로(/klarbase-ko/) 보정.
// 원문 DOM 은 그대로 두고, 사전에 있는 문구만 한국어로 바꾼다. English 로 토글하면 원문으로 되돌린다.
// 원작: https://github.com/TanmoyP/klarbase (MIT) · 한국어판: sigco3111
import dUi from './dict-ui.js';
import dIsles from './dict-isles.js';
import dBuilder from './dict-builder.js';
import dGuide from './dict-guide.js';
import dExtra from './dict-extra.js';
import dScan from './dict-scan.js';
import dTut from './dict-tutorial.js';
import dGuide2 from './dict-guide2.js';

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
// 따옴표·줄표·공백 표기가 달라도 같은 문구로 보이도록 정규화한다
const canon = s => s
 .replace(/[\u2018\u2019]/g, "'")
 .replace(/[\u201c\u201d]/g, '"')
 .replace(/[\u2013\u2014]/g, '-')
 .replace(/\u00a0/g, ' ')
 .replace(/\s+/g, ' ')
 .trim();
const MAP = new Map();
for (const p of [dUi, dIsles, dBuilder, dGuide, dExtra, dScan, dTut, dGuide2]) for (const k of Object.keys(p)) MAP.set(canon(k), p[k]);
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
 [/^Difficulty (\d+)\/100 · early estimate - (\d+) of (\d+) plays so far; starts from the maker's gut call$/,
 m => '난이도 ' + m[1] + '/100 · 초기 추정 — 지금까지 ' + m[2] + '/' + m[3] + '회 플레이, 만든 이의 짐작에서 시작'],
 [/^✓ Solvable in (\d+) moves · sign in to see the route$/, m => '✓ ' + m[1] + '수로 풀 수 있음 · 경로를 보려면 로그인'],
 [/^([A-Za-z]+) (\d+) · estimated from the solver · settles as people play$/,
 m => T(m[1]) + ' ' + m[2] + ' · 해법기 추정 · 플레이가 쌓이면 안정됩니다'],
 [/^Remix: (.+)$/, m => '리믹스: ' + T(m[1])],
 [/^Isle (\d+)$/, m => '섬 ' + m[1]],
 [/^by @(.+)$/, m => '@' + m[1] + ' 제작'],
 [/^🔒 Light (.+) (\d+)\/(\d+) · (.+) (\d+)\/(\d+)$/, m => '🔒 ' + T2(m[1]) + ' ' + m[2] + '/' + m[3] + ' 밝힘 · ' + T2(m[4]) + ' ' + m[5] + '/' + m[6]],
];

// 낱말 단위 보정: 문장이 사전에 없을 때 짧은 라벨에서만 쓴다
const WORDS = [
 [/\bUndo\b/g, '되돌리기'], [/\bRestart\b/g, '다시 시작'], [/\bTip\b/g, '팁'],
 [/\bSolution\b/g, '해법'], [/\bTurn\b/g, '회전'], [/\bMap\b/g, '지도'],
 [/\bHint\b/g, '힌트'], [/\bBreeze\b/g, '산들바람'], [/\bEasy\b/g, '쉬움'],
 [/\bTricky\b/g, '까다로움'], [/\bHard\b/g, '어려움'], [/\bFiendish\b/g, '가혹함'],
 [/\bMythic\b/g, '신화'], [/\bWin\b/g, '승리'],
];
const norm = canon;
const wordPass = t => {
 if (t.length > 60) return null;
 let out = t;
 for (const [re, ko] of WORDS) out = out.replace(re, ko);
 return out === t ? null : out;
};
const CHAP = { Canopy: '캐노피', Mirage: '신기루', Lagoon: '석호', Rooftops: '옥상', Summit: '정상', Windward: '바람맞이', Night: '밤', Jungle: '정글', Oasis: '오아시스', 'Hanging Gardens': '매달린 정원', Confluence: '합류' };
const T2 = s => (CHAP[s] != null ? CHAP[s] : T(s));
const linewise = raw => {
 if (typeof raw !== 'string' || raw.indexOf('\n') < 0) return null;
 let changed = false;
 const out = raw.split('\n').map(line => {
 if (!/[A-Za-z]/.test(line)) return line;
 const key = canon(line);
 const hv = MAP.get(key);
 if (hv != null) { changed = true; return hv; }
 for (const [re, fn] of RULES) { const m = re.exec(key); if (m) { changed = true; return fn(m); } }
 return line;
 });
 return changed ? out.join('\n') : null;
};
// 긴 문단: 사전에 있는 긴 문구를 문장 단위로 치환한다 (튜토리얼처럼 한 덩어리로 그려지는 글)
const LONG = Array.from(MAP.entries()).filter(([en]) => en.length >= 25).sort((a, b) => b[0].length - a[0].length);
const phrasePass = t => {
 if (t.length < 40 || LONG.length === 0) return null;
 let out = t, hit = false;
 for (const [en, ko] of LONG) {
  if (out.indexOf(en) >= 0) { out = out.split(en).join(ko); hit = true; }
 }
 return hit ? out : null;
};
const lookup = raw => {
 const lw = linewise(raw);
 if (lw != null) return lw;
 const t = canon(raw);
 const v = MAP.get(t);
 if (v != null) return v;
 for (const [re, fn] of RULES) { const m = re.exec(t); if (m) return fn(m); }
 return wordPass(t) || phrasePass(t);
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
 const v = lookup(cur);
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
 const v = lookup(cur);
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

// 3-b) 인라인 자식(<b>, <code>, <kbd>, .ico 등)을 합쳐 문장 단위로 사전을 찾는다.
// <kbd>·<b> 때문에 텍스트 노드가 조각나도, 요소 전체를 한 문장으로 보고 번역한다.
const INLINE_TAGS = new Set(['B','STRONG','EM','I','KBD','CODE','SPAN','SMALL','SUP','SUB','U','MARK','S']);
const RICH_SKIP = new Set(['BUTTON','A','LABEL','SUMMARY','TEXTAREA','INPUT','SELECT','OPTION','CANVAS']);
const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function richFlat(el){
 let s = '', inline = 0;
 for (const c of el.childNodes){
  if (c.nodeType === 3){ s += c.nodeValue; continue; }
  if (c.nodeType !== 1) continue;
  if (!INLINE_TAGS.has(c.tagName)) return null;
  inline++;
  const t = c.textContent || '';
  if (c.classList && c.classList.contains('ico')) s += t + ' ';
  else s += t;
 }
 if (!inline) return null;
 return canon(s);
}
function richTranslate(el){
 if (!el || el.nodeType !== 1 || !el.isConnected) return;
 if (RICH_SKIP.has(el.tagName) || SKIP_TAGS.has(el.tagName)) return;
 if (el.closest('[data-ko-skip]')) return;
 if (el.querySelector && el.querySelector('a,button,textarea,input,select')) return;
 const rec = recs.get(el);
 if (rec && rec.richOrig != null){
  if (mode === 'ko') return;
  const rr = recs.get(el) || {};
  el.innerHTML = rec.richOrig;
  delete rr.richOrig;
  if (Object.keys(rr).length) recs.set(el, rr); else recs.delete(el);
  return;
 }
 if (mode !== 'ko') return;
 const key = richFlat(el);
 if (key == null || key.length < 12 || key.length > 1200 || !/[A-Za-z]/.test(key)) return;
 let outHtml = null;
 const direct = MAP.get(key);
 if (direct != null){
  const icoEl = el.firstElementChild && el.firstElementChild.classList && el.firstElementChild.classList.contains('ico') ? el.firstElementChild : null;
  let koText = direct;
  if (icoEl){
   const ic = icoEl.textContent || '';
   if (ic && koText.indexOf(ic) === 0) koText = koText.slice(ic.length).replace(/^\s+/, '');
   outHtml = '<span class="ico">' + escHtml(ic) + '</span> ' + escHtml(koText);
  } else outHtml = escHtml(koText);
 } else {
  const first = el.firstElementChild;
  if (first && first !== el.lastElementChild){
   const lv = MAP.get(canon(first.textContent || ''));
   if (lv != null && first.tagName !== 'A'){
    let rest = '';
    for (let n = first.nextSibling; n; n = n.nextSibling) rest += (n.textContent || '');
    const rv = MAP.get(canon(rest));
    if (rv != null) outHtml = '<b>' + escHtml(lv) + '</b> ' + escHtml(rv);
   }
  }
 }
 if (outHtml == null) return;
 const rr = recs.get(el) || {};
 rr.richOrig = el.innerHTML;
 recs.set(el, rr);
 el.innerHTML = outHtml;
}

function walk(root){
 if (!root) return;
 if (root.nodeType === 3){ if (accept(root)) applyText(root); return; }
 if (root.nodeType !== 1 && root.nodeType !== 9) return;
 const el = root.nodeType === 1 ? root : document.body;
 if (!el) return;
 // 부모 요소를 먼저 문장 단위로 번역해야 자식 낱말 치환이 문장 키를 깨지 않는다.
 if (el.nodeType === 1) richTranslate(el);
 if (el.querySelectorAll) for (const x of el.querySelectorAll('*')) richTranslate(x);
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
const origTitle = document.title;
function applyTitle(){
 const v = mode === 'ko' ? lookup(origTitle) : null;
 document.title = v != null ? v : origTitle;
}
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
 applyTitle();
 paintToggle();
}
// 5) 캔버스에 그리는 글자도 사전을 거친다. 원문은 소스에 그대로 있고, 한국어 모드에서만 바꾼다.
const koFillText = CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText = function (t) {
 if (mode === 'ko' && typeof t === 'string' && /[A-Za-z]/.test(t)) {
 const v = lookup(norm(t));
 if (v != null) return koFillText.apply(this, [v].concat([].slice.call(arguments, 1)));
 }
 return koFillText.apply(this, arguments);
};

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
 applyTitle();
 walk(document.body);
 // 화면이 나중에 덧그려지는 자리를 놓치지 않도록 주기적으로 다시 훑는다
 setInterval(() => { try { walk(document.body); } catch {} }, 1500);
 obs.observe(document.documentElement, {
 childList: true, subtree: true, characterData: true,
 attributes: true, attributeFilter: ATTRS,
 });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
