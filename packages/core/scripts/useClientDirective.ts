/**
 * Next.js App Router 대응: 빌드 산출물 청크에 'use client' 지시문을 넣을지 판별한다.
 *
 * App Router에서는 모든 모듈이 기본적으로 서버 컴포넌트다. 훅이나 컨텍스트를
 * 쓰는 모듈은 지시문 없이 import되면 렌더 시점에 터진다. 반대로 Divider/
 * Border처럼 순수 표현만 하는 컴포넌트는 지시문이 없어야 소비자가 서버 컴포넌트로
 * 그대로 쓸 수 있다(SSR 페이로드 절약). 그래서 "전부 주입"이 아니라 청크별 판별이다.
 *
 * 이 파일은 빌드 도구 전용이라 src/ 밖에 둔다. src/에 두면 tsconfig.build.json이
 * dist에 .d.ts를 emit해 배포 산출물에 빌드 스크립트가 섞인다.
 */

/** 청크 첫 줄에 넣을 지시문 리터럴 */
export const USE_CLIENT_DIRECTIVE = "'use client';";

/**
 * 클라이언트 전용 마커.
 *
 * 훅 이름을 일일이 나열하는 대신 `use[A-Z]` 컨벤션으로 잡는다. React 공식 훅
 * 전체(useState/useEffect/useRef/useMemo/useCallback/useContext/useReducer/
 * useLayoutEffect/useId/useSyncExternalStore/useImperativeHandle/useTransition/
 * useDeferredValue)와 패키지 자체 내부 훅(useClickable/useFocusTrap)을 한 번에
 * 덮고, 내부 훅이 추가돼도 목록을 고칠 필요가 없다.
 *
 * 호출부가 아니라 "이름의 등장"을 본다. 산출물은 esbuild가 식별자를 재명명하므로
 * 호출부는 `k()`가 되지만 import specifier(`useState as k`)에는 원래 이름이 남는다.
 * 같은 이유로 `\b` 경계 덕분에 `React.useState` 같은 멤버 접근도 별도 패턴 없이 잡힌다.
 *
 * forwardRef는 일부러 마커에 넣지 않았다. 서버 컴포넌트에서도 합법이라
 * forwardRef만 쓰는 컴포넌트(Button 등)는 서버 컴포넌트로 남는 게 맞다.
 * forwardRef가 훅과 함께 쓰이면 그 훅이 이미 마커로 걸린다.
 */
const CLIENT_MARKER = /\b(?:use[A-Z][A-Za-z0-9]*|createContext)\b/;

/**
 * 판별 대상이 아닌 청크.
 * - `.vanilla.*`: vanilla-extract가 뽑아낸 스타일 청크. 런타임 클래스명 문자열뿐이다.
 * - `.css.*`: 파일명 재작성을 타지 않은 스타일 청크 대비용.
 * - `.d.ts`: 타입 선언은 tsc가 별도로 emit하며 지시문이 들어가면 파싱 에러가 된다.
 */
const NON_CLIENT_CHUNK = /\.(?:vanilla|css)\.|\.d\.ts$/;

/**
 * 해당 청크가 'use client' 지시문을 필요로 하는지 판별한다.
 *
 * 알려진 오탐: 문자열 리터럴 안의 훅 이름도 마커로 걸린다. 산출물에서는 주석이
 * 제거되므로 주석 오탐은 실제로 발생하지 않고, 문자열까지 파싱해 걸러내는 건
 * 비용 대비 이득이 없다. 오탐 비용(순수 컴포넌트가 서버 렌더 능력을 잃음)이
 * 미탐 비용(소비자 앱 런타임 크래시)보다 훨씬 작으므로 포함 쪽으로 기운다.
 *
 * @param fileName 산출물 청크 경로 (예: `components/Button/Button.mjs`)
 * @param code 렌더된 청크 코드
 */
export function needsUseClientDirective(
  fileName: string,
  code: string
): boolean {
  if (NON_CLIENT_CHUNK.test(fileName)) {
    return false;
  }

  return CLIENT_MARKER.test(code);
}
