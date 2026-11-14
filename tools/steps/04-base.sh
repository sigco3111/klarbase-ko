#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

# 원문 README 보관 (README.en.md)
curl -fsSL https://raw.githubusercontent.com/TanmoyP/klarbase/main/README.md -o README.en.md

# 오버레이 스크립트 교체 (하위 경로 보정 포함)
cp tools/steps/ko-js.txt client/public/ko/ko.js

# 앱 라우팅: location.pathname 을 BASE 를 뺀 경로로 읽는다
python3 - <<'PY'
import pathlib
for p in ['client/src/main.js','client/src/builder.js','client/src/buildguide.js','client/src/game/world.js']:
    f = pathlib.Path(p)
    if not f.exists():
        continue
    s = f.read_text(encoding='utf-8')
    n = s.count('location.pathname')
    if n:
        f.write_text(s.replace('location.pathname', '(window.__koPath ? window.__koPath() : location.pathname)'), encoding='utf-8')
    print(p, n)
v = pathlib.Path('client/vite.config.js')
s = v.read_text(encoding='utf-8')
old = "src: BASE + 'ko/ko.js' }, injectTo:'head' }"
assert s.count(old) == 1, 'vite pattern not found'
v.write_text(s.replace(old, "src: BASE + 'ko/ko.js' }, injectTo:'head-prepend' }"), encoding='utf-8')
print('vite ok')
PY

# 점검 결과를 파일로 남겨 읽을 수 있게 한다
{
  echo "== analytics/beacon/gtag =="
  grep -ril 'cloudflare\|beacon\|googletagmanager\|gtag\|analytics' client/index.html client/src client/public || echo none
  echo "== fonts.g* in index.html =="
  grep -c 'fonts\.g' client/index.html || true
  echo "== klarbase.dev refs =="
  grep -rl 'klarbase\.dev' client/index.html client/public client/src || echo none
  echo "== root-absolute in index.html =="
  grep -oE '(src|href)="/[^/][^"]*"' client/index.html || echo none
  echo "== __koPath uses =="
  grep -rc '__koPath' client/src || true
} > docs/ko-check.txt
echo step4 done
