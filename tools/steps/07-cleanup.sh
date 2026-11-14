#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

rm -rf tools/steps
rm -f tools/ko-scan.mjs tools/dump-isles.mjs tools/dump-text.mjs tools/dump-js.mjs tools/ko-step.sh
rm -f docs/strings-en.txt docs/isle-text.txt docs/html-text.txt docs/js-main.txt docs/js-builder.txt docs/js-guide.txt docs/js-world.txt docs/ko-check.txt docs/size-test.txt
rm -f .github/workflows/ko-import.yml .github/workflows/ko-scan.yml .github/workflows/ko-run.yml

git add -A
git commit -m "정리: 임시 스크립트·워크플로 제거 (배포 워크플로만 남김)"
echo cleanup done
