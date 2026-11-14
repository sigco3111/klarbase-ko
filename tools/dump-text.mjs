import fs from 'node:fs';
import path from 'node:path';
// 1) 섬 이름/힌트
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rows = [];
for (const f of walk('isles').filter(f => f.endsWith('.json') && !f.endsWith('chapters.json'))){
  let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
  rows.push([f.replace('isles/', ''), d.name || '', d.author || '', d.theme || '', d.twist ? 'twist' : '', (d.hint || '').replace(/\n/g, ' '), (d.catch || '').replace(/\n/g, ' ')].join(' | '));
}
rows.sort();
fs.writeFileSync('docs/isle-text.txt', rows.join('\n') + '\n');
// 2) index.html 정적 텍스트
const html = fs.readFileSync('client/index.html', 'utf8')
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '');
const seen = new Set(); const out = [];
for (const m of html.matchAll(/>([^<>]+)</g)){
  const t = m[1].replace(/\s+/g, ' ').trim();
  if (!t || !/[A-Za-z]/.test(t) || seen.has(t)) continue;
  seen.add(t); out.push(t);
}
fs.writeFileSync('docs/html-text.txt', out.join('\n') + '\n');
console.log('isles', rows.length, 'html', out.length);
