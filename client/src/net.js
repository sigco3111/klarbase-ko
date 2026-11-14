// 한국어판(klarbase-ko): API 서버 비활성화.
// 원작 client/src/net.js 는 /api 로 요청을 보낸다. 정적 배포에는 서버가 없으므로
// 호출 즉시 실패하고, 각 호출부의 try/catch 가 화면을 정상 유지한다.
// 원문: https://github.com/TanmoyP/klarbase/blob/main/client/src/net.js
export async function api(){
  throw new Error('서버 기능이 비활성화된 정적 빌드입니다');
}
