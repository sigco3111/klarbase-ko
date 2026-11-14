#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

cp tools/steps/ko-js3.txt client/public/ko/ko.js
wc -c client/public/ko/ko.js

# 배포 도메인에 맞춰 robots/llms 안내문의 도메인 교체
python3 - <<'PY'
import pathlib
new = 'https://sigco3111.github.io/klarbase-ko'
for p in ['client/public/robots.txt','client/public/llms.txt','client/public/.well-known/security.txt']:
    f = pathlib.Path(p)
    if not f.exists():
        continue
    s = f.read_text(encoding='utf-8')
    s2 = s.replace('https://klarbase.dev', new).replace('klarbase.dev', 'sigco3111.github.io/klarbase-ko')
    f.write_text(s2, encoding='utf-8')
    print(p, s != s2)
PY
echo step5 done
