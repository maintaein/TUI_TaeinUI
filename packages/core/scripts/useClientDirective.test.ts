import { describe, it, expect } from 'vitest';
import {
  USE_CLIENT_DIRECTIVE,
  needsUseClientDirective,
} from './useClientDirective';

// 빌드 산출물 청크를 흉내내는 최소 코드. esbuild가 식별자를 재명명해도
// import 구문의 specifier(`useState as k`)에는 원래 이름이 남으므로
// 판별은 호출부가 아니라 "원래 이름의 등장" 기준으로 검사한다.
const chunk = (body: string) => `import { jsx as e } from "react/jsx-runtime";
${body}
export { x as Comp };
`;

describe('needsUseClientDirective', () => {
  const reactHooks = [
    'useState',
    'useEffect',
    'useRef',
    'useMemo',
    'useCallback',
    'useContext',
    'useReducer',
    'useLayoutEffect',
    'useId',
    'useSyncExternalStore',
    'useImperativeHandle',
    'useTransition',
    'useDeferredValue',
  ];

  it.each(reactHooks)('React 훅 %s 을 감지한다', (hook) => {
    const code = chunk(
      `import { ${hook} as k } from "react";\nconst x = () => k();`
    );
    expect(needsUseClientDirective('components/C/C.mjs', code)).toBe(true);
  });

  it.each(reactHooks)('React.%s 멤버 접근도 감지한다', (hook) => {
    const code = chunk(`const x = () => React.${hook}();`);
    expect(needsUseClientDirective('components/C/C.mjs', code)).toBe(true);
  });

  // 패키지 자체 내부 훅(useClickable/useFocusTrap)도 클라이언트 경계다.
  it.each(['useClickable', 'useFocusTrap'])(
    '패키지 내부 훅 %s 을 감지한다',
    (hook) => {
      const code = chunk(
        `import { ${hook} as k } from "../../_internal/${hook}.mjs";\nconst x = () => k();`
      );
      expect(needsUseClientDirective('components/C/C.mjs', code)).toBe(true);
    }
  );

  it('createContext 를 감지한다', () => {
    const code = chunk(
      `import { createContext as c } from "react";\nconst x = c(null);`
    );
    expect(needsUseClientDirective('_internal/ctx.mjs', code)).toBe(true);
  });

  it('React.createContext 멤버 접근도 감지한다', () => {
    expect(
      needsUseClientDirective(
        '_internal/ctx.mjs',
        chunk('const x = React.createContext(null);')
      )
    ).toBe(true);
  });

  it('forwardRef 만 쓰는 청크는 서버 컴포넌트로 남긴다', () => {
    const code = chunk(
      `import { forwardRef as f } from "react";\nconst x = f((p, r) => e("button", { ...p, ref: r }));`
    );
    expect(needsUseClientDirective('components/Button/Button.mjs', code)).toBe(
      false
    );
  });

  it('forwardRef 가 훅과 함께 쓰이면 감지한다', () => {
    const code = chunk(
      `import { forwardRef as f, useRef as r } from "react";\nconst x = f((p) => e("i", { ref: r(null) }));`
    );
    expect(needsUseClientDirective('components/C/C.mjs', code)).toBe(true);
  });

  it('순수 표현 컴포넌트 청크는 지시문 없이 남긴다', () => {
    const code = chunk(
      `import { clsx as c } from "clsx";\nconst x = (p) => e("p", { className: c(p.className) });`
    );
    expect(
      needsUseClientDirective('components/Divider/Divider.mjs', code)
    ).toBe(false);
  });

  // 긴 식별자 안에 훅 이름이 들어 있는 경우(reuseContext, houseRefund)는
  // 단어 경계 검사로 걸러진다.
  it.each([
    'const reuseContext = 1;',
    'const houseRefund = 2;',
    'const misuseIdentity = 3;',
  ])('긴 식별자 부분 문자열(%s)은 훅으로 오탐하지 않는다', (body) => {
    expect(needsUseClientDirective('components/C/C.mjs', chunk(body))).toBe(
      false
    );
  });

  it('vanilla-extract 산출물 청크는 제외한다', () => {
    const code = 'export var useState = "x_hash";';
    expect(needsUseClientDirective('components/C/C.vanilla.mjs', code)).toBe(
      false
    );
  });

  it('.css 접미사가 남은 청크도 제외한다', () => {
    expect(
      needsUseClientDirective(
        'components/C/C.css.mjs',
        'export var useId = "y";'
      )
    ).toBe(false);
  });

  it('타입 선언 파일은 제외한다', () => {
    expect(
      needsUseClientDirective(
        'components/C/C.d.ts',
        'export declare const x: () => void;'
      )
    ).toBe(false);
  });

  it("지시문은 'use client'; 리터럴이다", () => {
    expect(USE_CLIENT_DIRECTIVE).toBe("'use client';");
  });

  // 알려진 오탐: 문자열/주석 안의 훅 이름도 true가 된다.
  // 산출물은 esbuild minify로 주석이 제거되므로 실제 빌드에서는 발생하지 않고,
  // 오탐 비용(순수 컴포넌트가 서버 렌더 능력을 잃음)이 미탐 비용(런타임 크래시)보다
  // 작으므로 문자열 파싱까지 하지 않는다.
  it('문자열 안의 훅 이름은 오탐으로 남긴다(의도된 동작)', () => {
    const code = chunk('const msg = "useState is required";');
    expect(needsUseClientDirective('components/C/C.mjs', code)).toBe(true);
  });
});
