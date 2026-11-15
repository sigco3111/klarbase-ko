// tools/ko-scan2.mjs — 사용자에게 보이는 영문 문자열 전수 추출 (노이즈 필터 강화). 결과: tools/ko-todo.txt
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BT = String.fromCharCode(96);
const canon = s => String(s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const unesc = s => s.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n').replace(/\\t/g, '\t');

const dict = new Map();
const DICT_DIR = path.join(ROOT, 'client/public/ko');
for (const f of fs.readdirSync(DICT_DIR).filter(x => /^dict-.*\.js$/.test(x))) {
  const src = fs.readFileSync(path.join(DICT_DIR, f), 'utf8');
  const re = /(?:^|[\s,{])(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*:/gm;
  let m;
  while ((m = re.exec(src))) dict.set(canon(unesc(m[1] !== undefined ? m[1] : m[2])), f);
}

function looksUI(t, kind) {
  if (t.length < 3 || t.length > 300) return false;
  if (!/[A-Za-z]{2}/.test(t)) return false;
  if (/[{}\[\];\\|&]|=>|===|\$\{|\.(js|mjs|json|png|svg|css|html)\b/.test(t) && kind !== 'json:hint' && kind !== 'json:text') return false;
  if (/^[.#:>+~*_\/@-]/.test(t)) return false;
  if (/^https?:|^\/\/|^data:|^var\(|^rgba?\(|^#[0-9a-f]+$/i.test(t)) return false;
  if (/\d+(px|em|rem|%)\b/.test(t) && !/\s[A-Za-z]{3,}\s[A-Za-z]{3,}/.test(t)) return false;
  const words = t.match(/[A-Za-z]{2,}/g) || [];
  const multi = /\s/.test(t) && words.length >= 2;
  if (multi) return true;
  if (kind === 'attr' || kind === 'htmltext' || kind.startsWith('json')) return /^[A-Z]/.test(t) || words.length >= 1;
  return /^[A-Z][a-z]{2,}[.!?:]?$/.test(t) || /^[A-Z][a-z]+ [A-Z]/.test(t);
}

const seen = new Map();
function push(raw, file, line, kind) {
  if (typeof raw !== 'string') return;
  const s = canon(raw);
  if (!looksUI(s, kind)) return;
  if (!seen.has(s)) seen.set(s, { s, n: 0, first: file + ':' + line, kinds: new Set() });
  const e = seen.get(s); e.n++; e.kinds.add(kind);
}

function scanJS(src, file) {
  let i = 0, line = 1; const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === '\n') { line++; i++; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (ch === "'" || ch === '"' || ch === BT) {
      const q = ch, startLine = line; let j = i + 1, out = '', closed = false;
      while (j < n) {
        const cj = src[j];
        if (cj === '\\') { out += unesc(src.slice(j, j + 2)); if (src[j + 1] === '\n') line++; j += 2; continue; }
        if (cj === q) { closed = true; break; }
        if (cj === '\n') { line++; if (q !== BT) { out = ''; break; } }
        if (q === BT && cj === '$' && src[j + 1] === '{') { out += '{?}'; j += 2; let d = 1; while (j < n && d > 0) { if (src[j] === '{') d++; else if (src[j] === '}') d--; else if (src[j] === '\n') line++; j++; } continue; }
        out += cj; j++;
      }
      if (out) push(out, file, startLine, q === BT ? 'template' : 'js');
      i = closed ? j + 1 : j; continue;
    }
    i++;
  }
}
function scanHTML(src, file) {
  const lineOf = idx => src.slice(0, idx).split('\n').length;
  const s2 = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  let m; const attr = /(?:title|aria-label|placeholder|alt)="([^"]*)"/g;
  while ((m = attr.exec(s2))) push(m[1], file, lineOf(m.index), 'attr');
  const textRe = />([^<>]+)</g;
  while ((m = textRe.exec(s2))) push(m[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' '), file, lineOf(m.index), 'htmltext');
}
const KEYRE = /^(name|title|subtitle|tagline|desc|description|blurb|hint|tip|tips|text|label|note|achievement|achievements|caption|msg|message|intro|story)$/i;
function scanJSON(value, file) {
  if (Array.isArray(value)) { value.forEach(v => scanJSON(v, file)); return; }
  if (value && typeof value === 'object') for (const k of Object.keys(value)) {
    const v = value[k];
    if (typeof v === 'string') { if (KEYRE.test(k)) push(v, file, 0, 'json:' + k.toLowerCase()); }
    else scanJSON(v, file);
  }
}
const walk = (dir, out) => { if (!fs.existsSync(dir)) return out; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (['node_modules','dist','.git'].includes(e.name)) continue; const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); } return out; };
const files = [];
walk(path.join(ROOT, 'client/src'), files); walk(path.join(ROOT, 'core/src'), files); walk(path.join(ROOT, 'isles'), files);
files.push(path.join(ROOT, 'client/index.html'));
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  try {
    if (/\.js$|\.mjs$/.test(f)) scanJS(fs.readFileSync(f, 'utf8'), rel);
    else if (/\.html$/.test(f)) scanHTML(fs.readFileSync(f, 'utf8'), rel);
    else if (/\.json$/.test(f)) scanJSON(JSON.parse(fs.readFileSync(f, 'utf8')), rel);
  } catch (err) { console.error('skip', rel, err.message); }
}
const all = [...seen.values()];
const todo = all.filter(e => !dict.has(e.s)).sort((a, b) => b.n - a.n || a.s.localeCompare(b.s));
const lines = todo.map(e => e.s + '\t' + e.n + '\t' + e.first + '\t' + [...e.kinds].join(','));
fs.writeFileSync(path.join(ROOT, 'tools/ko-todo.txt'), lines.join('\n') + '\n');
const CH = 25;
for (let k = 0; k * CH < lines.length; k++) {
  const nn = String(k + 1).padStart(2, '0');
  fs.writeFileSync(path.join(ROOT, 'tools/ko-todo-' + nn + '.txt'), lines.slice(k * CH, (k + 1) * CH).join('\n') + '\n');
}
fs.writeFileSync(path.join(ROOT, 'tools/ko-todo-count.txt'), 'candidates ' + all.length + '\nin_dict ' + (all.length - todo.length) + '\nuntranslated ' + todo.length + '\n');
console.log('candidates', all.length, 'in_dict', all.length - todo.length, 'untranslated', todo.length);
