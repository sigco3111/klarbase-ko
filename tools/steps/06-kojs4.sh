#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

cp tools/steps/ko-js4.txt client/public/ko/ko.js
node --check client/public/ko/ko.js 2>&1 || echo "SYNTAX CHECK FAILED"
wc -c client/public/ko/ko.js
echo step6 done
