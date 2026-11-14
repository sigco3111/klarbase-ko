// 한국어판(klarbase-ko): 로그인 비활성화.
// 원작 client/src/auth.js 는 better-auth 클라이언트로 GitHub/Google 로그인을 연동한다.
// 이 한국어판은 정적 GitHub Pages 배포라 세션 서버가 없으므로 같은 이름의 no-op 구현만 둔다.
// 원문: https://github.com/TanmoyP/klarbase/blob/main/client/src/auth.js
export const authClient = null;

export async function getSession(){
  return null;                        // 항상 로그아웃 상태
}

export const signIn = () => {};
export const signOut = async () => {};
