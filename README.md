<div align="center">

# 클라베이스 한국어판 (Klarbase KO)

**비공식 한국어판 — 떠 있는 섬 퍼즐 「Klarbase」의 화면 문구를 한국어로**

[▶ 플레이하기](https://sigco3111.github.io/klarbase-ko/) · [원작 저장소](https://github.com/TanmoyP/klarbase) · [원작 데모](https://klarbase.dev)

</div>

## 소개

「Klarbase」는 TanmoyP가 만든 아늑한 3D 퍼즐 게임입니다. 떠 있는 섬에서 새싹 정령 **핍(Pip)** 을 움직여 상자를 밀고, 얼음을 미끄러지고, 레버로 다리를 뒤집고, 아치로 건너 *빛나는 별*에 닿으면 됩니다. 공식 섬 48개(5개 기본 챕터 24개 + 확장 4챕터), 데일리 섬, 게임 안 레벨 빌더가 들어 있습니다.

이 저장소는 원작 소스(MIT)를 그대로 가져와 **화면에 보이는 영어 문구만 한국어로 바꾼 비공식 한국어판**입니다. 오른쪽 아래 **English / 한국어** 버튼으로 언제든 원문으로 돌아갈 수 있고, 선택은 브라우저에 저장됩니다.

## 번역 방식

원작은 화면 문구를 `client/index.html`과 `client/src/*.js`에 하드코딩하고 DOM으로 그립니다. 그래서 소스를 문장마다 고치는 대신 **표시 시점 번역 오버레이**를 씁니다(1번 작업 cadle-ko, 2번 battledrones-ko와 같은 방식).

- `client/public/ko/ko.js` — 오버레이 엔진. DOM 텍스트 노드와 `title`/`aria-label`/`placeholder`/`alt` 속성을 `MutationObserver`로 지켜보며 사전에 있는 문구만 바꿉니다. 원문은 노드별로 보존해 두었다가 English 모드에서 그대로 되돌립니다.
- `client/public/ko/dict-ui.js` — 메뉴·HUD·안내·토스트·개인정보 문구
- `client/public/ko/dict-isles.js` — 챕터·섬 이름, 챕터 소개, 난이도 등급
- `client/public/ko/dict-builder.js` — 레벨 빌더 UI
- `client/public/ko/dict-guide.js` — 「노는 법」 전문과 「만드는 법」 제목
- `client/public/ko/dict-extra.js` — 개인정보 본문, 낱말 단위 보정
- 숫자가 섞인 문구(`isle 1 of 48`, `par 4`, `▶ 128 plays · 64% clear`, `☀ Daily #27` 등)는 사전 대신 정규식 규칙으로 처리합니다.
- `client/vite.config.js` — 원문 `index.html`은 건드리지 않고, 빌드할 때 `ko.css`·`ko.js` 태그만 `<head>`에 끼워 넣습니다.

### 번역 범위

- 표제 화면, 섬 고르기(챕터 이름·소개·섬 48개 이름·난이도 등급·기준 수), 이어하기
- 인게임 HUD(이동·기준·열쇠·씨앗·시간), 되돌리기·다시 시작·팁·해법·회전·지도 버튼과 키 안내, 난이도 툴팁
- 「노는 법」 전문(상자·얼음·압판·레버·아치·하늘 저울·풍선·돌·부표·바람구멍·바위·가시 청소부·별·난이도까지)
- 레벨 빌더: 테마·난이도·크기·모든 타일 이름, 판정/시험/공유 버튼, 섬 코드·기여 영역, 디자인 팁
- 토스트와 모달(클리어, 본(bonk) 경고, 막힌 자리, 복사/공유 결과, 타이머 설정 등)
- 개인정보 페이지 본문
- 「만드는 법」 안내서의 제목과 첫 문단

### 남은 부분

- 「만드는 법」 안내서의 **타일별 상세 설명 문단**(지형/시작과 목표/도구와 스위치/맵 전용 항목 등)은 영어 그대로입니다. 제목과 접힘 항목 이름만 번역했습니다.
- **섬별 힌트 문장과 해법 해설**(`catch`)은 원작 데이터 파일에 있어 번역하지 않았습니다. 힌트는 영어로 표시됩니다.
- 커뮤니티·데일리 탭의 일부 동적 안내문, `llms.txt`/`robots.txt` 같은 크롤러용 문서는 영어입니다.
- 원작 문서(`ENGINEERING.md`, `CONTRIBUTING.md`, `isles/README.md` 등)는 번역하지 않았습니다.

## 서버 기능 비활성화 (정적 배포)

원작은 Express + Prisma + better-auth 서버(`server/`)와 Postgres로 섬 공유·로그인·익명 플레이 통계를 돌립니다. 이 한국어판은 **GitHub Pages 정적 호스팅**만 쓰므로 다음을 꺼 두었습니다.

- `client/src/net.js` — 모든 `/api` 호출이 즉시 실패하고 각 호출부의 `try/catch`가 화면을 정상 유지합니다(통계·공유 요청이 나가지 않음).
- `client/src/auth.js` — better-auth 클라이언트 대신 같은 이름의 no-op 구현. 로그인 칩은 `ko.css`에서 숨깁니다.
- `server/`, `docker-compose.yml`, `.env.example`, 루트 `package.json`의 `server` 워크스페이스와 better-auth 의존성을 제거했습니다.
- 원작이 쓰던 **Cloudflare Web Analytics**와 **Google Fonts(Fredoka·Nunito) 외부 링크**는 `client/index.html`에서 제거했습니다. 한글은 시스템 글꼴(Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR …)을 먼저 쓰고, 웹폰트를 내려받지 않습니다.
- 단일 플레이는 완전히 정적입니다: 섬 48개, 데일리 섬, 레벨 빌더, 저장은 브라우저 로컬 저장소만 사용합니다.
- **온라인 공유·로그인·서버 통계·의견 보내기**는 동작하지 않습니다. `README`의 원작 개인정보 안내 중 서버 관련 항목은 이 빌드에 해당하지 않습니다.

## 원작과 다른 점 (번역 외 변경)

- `client/vite.config.js`: `base: '/klarbase-ko/'`(GitHub Pages 하위 경로), 사이트맵 도메인 교체, `ko-overlay` 플러그인 추가.
- `client/src/main.js`: 주소 판정을 `location.pathname` 대신 `window.__koPath()`로 (하위 경로에서 `/klarbase-ko/play` → `/play` 로 읽도록). `ko.js`가 `history.pushState/replaceState`에 `/klarbase-ko` 접두사를 붙입니다.
- `client/index.html`: 외부 폰트 링크 제거, `href="/privacy"` → `href="privacy"`(하위 경로 대응). 그 외 마크업은 그대로입니다.
- `client/public/ko/`, `docs/glossary.md`, `NOTICE`, `tools/`(문자열 추출 스크립트), Pages 워크플로 추가.
- 원작 `.github/workflows/ci.yml` 등 원작 CI는 가져오지 않았고, 빌드·배포 워크플로만 새로 두었습니다.
- 원작의 `README.md`는 `README.en.md`로 그대로 보존했습니다.
- 게임 로직·규칙·밸런스·아일랜드 데이터는 건드리지 않았습니다.

## 라이선스·크레딧

- 원작: **Klarbase** © 2026 TanmoyP and Klarbase contributors — https://github.com/TanmoyP/klarbase, MIT License. 원문 `LICENSE`를 그대로 두었습니다.
- 원작 README 원문: [README.en.md](README.en.md)
- 한국어 번역·오버레이: sigco3111 (비공식, 원작자와 무관)
- 게임의 모든 그래픽은 절차적으로 그려지며(모델·텍스처·오디오 파일 없음) 별도 에셋 라이선스 표기는 없습니다. 섬 데이터도 코드와 같은 MIT입니다.

## 빌드

```bash
npm install
npm run build     # client/vite.config.js 의 base('/klarbase-ko/') 사용, 결과물 client/dist
```

GitHub Actions(`ko-pages`)가 같은 명령으로 빌드해 Pages에 올리고, `index.html`에 루트 절대경로(`="/..."`)가 남았는지 검사합니다. `404.html`도 함께 만들어 깊은 링크를 앱으로 되돌립니다.

## 검증 기록

| 항목 | 결과 |
| --- | --- |
| Pages 주소 | 확인 (https://sigco3111.github.io/klarbase-ko/) |
| 한국어 표시 | 확인 (표제·섬 고르기·챕터/섬 이름·HUD·키 안내·빌더) |
| English 전환 | 부분 확인 (버튼 라벨이 English↔한국어로 바뀌고 선택이 저장됨. 영어 화면 전체 복귀는 브라우저 호스트 장애로 재확인하지 못했습니다) |
| 하위 경로 배포 | 확인 (base=/klarbase-ko/, 루트 절대경로 0건) |
| 라우팅 | 확인 (/play, /isle/<id>, /create 이동) |
| 스크린샷 | 미확인 — 클라우드 브라우저가 캡처를 지원하지 않아 화면 픽셀 검증은 못 했습니다(문서 구조로 확인) |
| 실제 플레이 | 부분 확인 (섬 진입·HUD·키 안내까지. WebGL 조작 자동화는 하지 않았습니다) |
| 힌트·해설 문장 | 미번역 (영어로 표시 — '남은 부분' 참고) |

## 면책

비공식 팬 번역입니다. 원작자와 무관하며, 문제가 있으면 이 저장소 이슈로 알려 주세요. 원작에 대한 권리는 모두 원작자에게 있습니다.
