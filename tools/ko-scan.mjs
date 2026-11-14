// ko-scan: extract every user-visible English string the client can show.
import fs from 'node:fs';
import path from 'node:path';
const rows = new Map();
const add = (f, k, s) => {
  s = String(s).replace(/\s+/g, ' ').trim();
  if (!s || s.length < 2 || s.length > 300) return;
  if (!/[A-Za-z]/.test(s)) return;
  if (!/[\s]/.test(s) && s.length < 4) return;
  const key = k + '|' + s;
  if (!rows.has(key)) rows.set(key, f);
};
const html = fs.readFileSync('client/index.html', 'utf8')
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '');
for (const m of html.matchAll(/>([^<>]+)</g)) add('index.html', 'text', m[1]);
for (const m of html.matchAll(/(title|placeholder|aria-label|alt|content)="([^"]+)"/g)) add('index.html', 'attr:' + m[1], m[2]);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);
for (const f of walk('client/src')) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(['"`])((?:[^\\\n]|\\.){2,300}?)\1/g)) add(f, 'js', m[2]);
}
const isles = walk('isles').filter(f => f.endsWith('.json'));
for (const f of isles) {
  let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
  for (const key of ['name', 'hint', 'catch', 'author', 'title']) {
    const v = d && d[key]; if (typeof v === 'string') add(f, key, v);
  }
}
const core = walk('core/src').filter(f => f.endsWith('.js'));
for (const f of core) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(['"`])((?:[^\\\n]|\\.){3,300}?)\1/g)) add(f, 'js', m[2]);
}
const lines = [...rows.entries()].map(([k, f]) => k.split('|')[0] + '\t' + f + '\t' + k.slice(k.indexOf('|') + 1));
lines.sort();
fs.writeFileSync('docs/strings-en.txt', lines.join('\n') + '\n');
console.log('strings:', lines.length);
