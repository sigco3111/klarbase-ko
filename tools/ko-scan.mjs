// tools/ko-scan.mjs — 사용자에게 보이는 영문 문자열을 소스 전체에서 전수 추출하고, 사전 대비 미번역을 집계한다.
// 사용: node tools/ko-scan.mjs  →  tools/ko-report.json, tools/ko-untranslated.txt
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DICT_DIR = path.join(ROOT, 'client/public/ko');
const BT = String.fromCharCode(96);

const canon = s => String(s)
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\u00a0/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const unesc = s => s.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n').replace(/\\t/g, '\t');

// 1) 사전 키 모으기
const dict = new Map();
for (const f of fs.readdirSync(DICT_DIR).filter(x => /^dict-.*\.js$/.test(x))) {
  const src = fs.readFileSync(path.join(DICT_DIR, f), 'utf8');
  const re = /(?:^|[\s,{])(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*:/gm;
  let m;
  while ((m = re.exec(src))) {
    const k = m[1] !== undefined ? m[1] : m[2];
    dict.set(canon(unesc(k)), f);
  }
}

// 2) 후보 필터
function looksUI(t) {
  if (/^(https?:|\/\/|\/|\.{1,2}\/|@|#|data:|var\(|rgba?\(|hsla?\(|linear-gradient|translate|rotate|scale|matrix|url\()/i.test(t)) return false;
  if (/^[0-9\s.,:%+\-*/x]+$/i.test(t)) return false;
  if (/^[a-z][a-z0-9_-]*$/.test(t)) return false;
  if (/^[a-z]+([A-Z][a-z0-9]*)+$/.test(t)) return false;
  if (/^[A-Z][A-Z0-9_]+$/.test(t) && t.length > 3) return false;
  if (/^(true|false|null|undefined|NaN)$/.test(t)) return false;
  if (!/[A-Za-z]{2}/.test(t)) return false;
  return true;
}

const CAND = [];
const seen = new Map();
function push(raw, file, line, kind) {
  if (typeof raw !== 'string' || !raw) return;
  const s = canon(raw);
  if (s.length < 2 || s.length > 400) return;
  if (!looksUI(s)) return;
  if (!seen.has(s)) { seen.set(s, { s, where: [], kinds: [] }); CAND.push(seen.get(s)); }
  const e = seen.get(s);
  if (e.where.length < 12) e.where.push(file + ':' + line);
  if (!e.kinds.includes(kind)) e.kinds.push(kind);
}

// 3) JS 스캔 (주석 건너뛰고 문자열만)
function scanJS(src, file) {
  let i = 0, line = 1;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === '\n') { line++; i++; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
      i += 2; continue;
    }
    if (ch === "'" || ch === '"' || ch === BT) {
      const q = ch, startLine = line;
      let j = i + 1, out = '';
      let closed = false;
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

// 4) HTML 스캔 (텍스트 노드 + 속성)
function scanHTML(src, file) {
  const lineOf = idx => src.slice(0, idx).split('\n').length;
  const s2 = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const attr = /(?:title|aria-label|placeholder|alt)="([^"]*)"/g;
  let m;
  while ((m = attr.exec(s2))) push(m[1], file, lineOf(m.index), 'attr');
  const textRe = />([^<>]+)</g;
  while ((m = textRe.exec(s2))) {
    const t = m[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
    if (/[A-Za-z]{2}/.test(t)) push(t, file, lineOf(m.index), 'htmltext');
  }
}

// 5) 데이터 JSON 스캔 (이름·설명 계열 키만)
const KEYRE = /^(name|title|subtitle|tagline|desc|description|blurb|hint|tip|tips|text|label|note|achievement|achievements|caption|msg|message|intro|story)$/i;
function scanJSON(value, file, jsonPath) {
  if (Array.isArray(value)) { value.forEach((v, i) => scanJSON(v, file, jsonPath + '[' + i + ']')); return; }
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      const v = value[k];
      if (typeof v === 'string') { if (KEYRE.test(k)) push(v, file, 0, 'json:' + k); }
      else scanJSON(v, file, jsonPath + '.' + k);
    }
  }
}

// 6) 파일 훑기
const walk = (dir, out) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};

const files = [];
walk(path.join(ROOT, 'client/src'), files);
walk(path.join(ROOT, 'core/src'), files);
walk(path.join(ROOT, 'isles'), files);
files.push(path.join(ROOT, 'client/index.html'));

for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  try {
    if (/\.js$/.test(f)) scanJS(fs.readFileSync(f, 'utf8'), rel);
    else if (/\.html$/.test(f)) scanHTML(fs.readFileSync(f, 'utf8'), rel);
    else if (/\.json$/.test(f)) scanJSON(JSON.parse(fs.readFileSync(f, 'utf8')), rel, '');
  } catch (err) { console.error('skip', rel, err.message); }
}

// 7) 집계
const entries = CAND.map(e => ({ s: e.s, where: e.where, kinds: e.kinds, inDict: dict.has(canon(e.s)), dictFile: dict.get(canon(e.s)) || null, n: e.where.length }));
const untranslated = entries.filter(e => !e.inDict).sort((a, b) => (b.where.length - a.where.length) || a.s.localeCompare(b.s));

fs.writeFileSync(path.join(ROOT, 'tools/ko-report.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  files: files.map(f => path.relative(ROOT, f).split(path.sep).join('/')),
  totals: { unique: entries.length, translated: entries.length - untranslated.length, untranslated: untranslated.length },
  entries,
}, null, 1));

fs.writeFileSync(path.join(ROOT, 'tools/ko-untranslated.txt'), untranslated.map(e => e.s + '\t' + e.where.join(' ') + '\t' + e.kinds.join(',')).join('\n') + '\n');

console.log('unique', entries.length, 'translated', entries.length - untranslated.length, 'untranslated', untranslated.length);
