#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

python3 - <<'PYEOF'
import re
p = 'client/index.html'
s = open(p, encoding='utf-8').read()
n0 = s.count('fonts.googleapis.com') + s.count('fonts.gstatic.com')
s = re.sub(r'[ \t]*<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\n?', '', s)
s = s.replace('href="/privacy"', 'href="privacy"')
s = s.replace('href="/play"', 'href="play"').replace('href="/create"', 'href="create"')
open(p, 'w', encoding='utf-8').write(s)
print('fonts links removed:', n0)
left = re.findall(r'(?:href|src)="/[^/][^"]*"', s)
print('root-absolute left in index.html:', left)
PYEOF
