#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

cat > tools/dump-js.mjs <<'KOEOF'
import fs from 'node:fs';
const files = { main:'client/src/main.js', builder:'client/src/builder.js', guide:'client/src/buildguide.js', world:'client/src/game/world.js' };
const keep = s => {
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length < 5 || s.length > 240) return false;
  if (!/[A-Za-z]{2}/.test(s)) return false;
  if (!/\s/.test(s)) return false;
  if (/[{}<>]/.test(s)) return false;
  if (/(px|var\(|rgba?\(|flex|grid|url\(|:#|\$\{)/.test(s)) return false;
  if (/^(https?:|\/|\.\/|@)/.test(s)) return false;
  return true;
};
for (const [k, f] of Object.entries(files)){
  const src = fs.readFileSync(f, 'utf8');
  const out = new Set();
  for (const m of src.matchAll(/(['"`])((?:[^\\\n]|\\.){2,2000}?)\1/g)){
    const raw = m[2];
    if (raw.includes('<')) {
      for (const frag of raw.replace(/<[^>]+>/g, '\n').split('\n')){
        const t = frag.replace(/\s+/g, ' ').trim();
        if (t.length > 3 && /[A-Za-z]{3}/.test(t) && !/[{}]/.test(t)) out.add(t);
      }
    } else if (keep(raw)) out.add(raw.replace(/\s+/g, ' ').trim());
  }
  const lines = [...out].sort();
  fs.writeFileSync('docs/js-' + k + '.txt', lines.join('\n') + '\n');
  console.log(k, lines.length);
}
KOEOF

node tools/dump-js.mjs
