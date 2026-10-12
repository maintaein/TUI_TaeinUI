import { primary, gray, success, warning, error } from './colors.css';
import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  fontVariantNumeric,
} from './typography.css';
import { spacing, borderRadius } from './spacing.css';
import { shadows } from './shadows.css';
import { duration, loop, easing } from './animation.css';
import { zIndex } from './zIndex.css';

/**
 * 테마 계약의 값 정의. `theme.css.ts`가 이 객체를 `createGlobalTheme`에 넘겨
 * CSS 변수로 만든다.
 *
 * 계약 자체(`themeContract`)를 읽으면 값이 아니라 `var(--...)` 문자열이 나오므로,
 * 실제 색상값·간격값이 필요한 쪽(문서 생성기 등)은 이 객체를 참조한다. 문서와
 * 계약이 어긋나지 않게 하려면 이 파일이 유일한 출처여야 한다.
 */
export const themeTokens = {
  color: {
    primary: {
      main: primary[700],
      light: primary[400],
      dark: primary[800],
      contrast: '#FFFFFF',
    },
    text: {
      primary: gray[900],
      secondary: gray[600],
      disabled: gray[400],
      // 어두운 면 위에 얹는 글자. semantic 4슬롯의 contrast로는 못 덮는 자리가 있다
      // — gray[700~900] 배경(Button·IconButton의 dark 변형)과 스크림 위 텍스트다.
      inverse: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: gray[50],
    },
    surface: {
      default: '#FFFFFF',
      hover: gray[100],
      active: gray[200],
      // 밝은 것이 올라타는 트랙의 면. 흰 배경 위에 흰 트랙(surface.default)을
      // 얹으면 대비가 아예 없다(예: disabled Switch 실측 1.00:1). gray[550]은 흰
      // 배경 대비 3.59:1로 1.4.11의 3:1을 넘긴다.
      // 트랙의 임무는 그 위에 올라타는 것과 대비되는 것이다. 밝은 rider(Switch
      // 썸·Loader color="white" fill)에만 이 어두운 면을 쓴다 — 어두운 rider
      // (Slider fill·Loader primary/secondary fill)에는 쓰지 마라. 거기서는 면을
      // background.paper로 두고 border.strong 경계선이 식별을 맡는다.
      // border.strong과 값은 같지만 트랙은 경계선이 아니라 면이라 별도 토큰으로
      // 둔다 — border.strong을 조정해도 트랙이 딸려 움직이면 안 된다.
      track: gray[550],
    },
    border: {
      default: gray[300],
      // 정보를 전달하는 경계선용. default(#E0E0E0)는 1.32:1이라 1.4.11의 3:1에
      // 못 미친다. 폼 컨트롤·카드 경계처럼 있고 없고가 의미를 바꾸는 자리에 쓴다.
      strong: gray[550],
      focus: primary[700],
    },
    // 반투명 합성색. 밑에 깔리는 배경에 따라 결과색이 달라져 단일 대비값을
    // 정의할 수 없으므로 대비비 검사 대상이 아니다.
    overlay: {
      // 백드롭·이미지 오버레이 스크림. 소비자는 넷이다. Modal·BottomSheet·
      // SideSheet는 각자 rgba(0, 0, 0, 0.5)를 리터럴로 적고 있어 렌더가
      // 그대로지만, Card 이미지 오버레이는 0.4였어서 0.5로 올라갔다(ed3138d).
      // 값이 하나로 모이는 게 이 토큰을 만든 이유고 어두워지는 방향은 위
      // 텍스트 대비에 유리해서 되돌리지 않는다.
      scrim: 'rgba(0, 0, 0, 0.5)',
      // 포커스·에러 halo. 대비 1.1~1.2:1이라 이것만으로는 포커스 표시가 못 된다 —
      // 실제 표시는 focusRing 유틸의 outline이 맡는다(S6). 이건 장식이다.
      focusHalo: 'rgba(25, 118, 210, 0.16)', // primary[700] @16%
      errorHalo: 'rgba(211, 47, 47, 0.16)', // error[700] @16%
      // Skeleton shimmer 하이라이트. 팔레트 밖 흰색 반투명이라 컴포넌트가
      // 리터럴로 들고 있었다(M2 T3c 사전 스캔 R3) — 토큰으로 옮긴다.
      shimmer: 'rgba(255, 255, 255, 0.3)',
    },
    // semantic 4슬롯의 역할 구분:
    // - main    글자(contrast)를 얹는 면. 판정 기준은 페이지 배경이 아니라
    //           contrast와의 대비 4.5:1이다. success/warning은 흰 배경 대비가
    //           2.77/2.15라 배경과의 3:1은 보장하지 않는다
    // - light   연한 배경용. 위에 text.primary를 얹는다
    // - dark    흰 배경 위 본문 텍스트용 (대비 4.5:1 기준). 글자를 얹지 않는
    //           도형(아이콘 단독·차트 마커·상태 점)도 이 슬롯을 쓴다.
    //           예외 하나: Snackbar의 success·warning은 `dark`를 면으로 쓰고 그 위에
    //           `text.inverse`(흰색)를 얹는다. 대비는 success 5.13:1, warning
    //           5.49:1이다. `main` 위 흰 글자는 2.78·2.16:1이라 못 쓴다. 이 쌍은
    //           llms.test.ts가 Snackbar.css.ts 소스에서 읽어 잰다
    // - contrast main 위에 얹는 글자색
    success: {
      main: success[500],
      light: success[100],
      dark: success[800],
      contrast: gray[900],
    },
    warning: {
      main: warning[500],
      light: warning[100],
      dark: warning[800],
      contrast: gray[900],
    },
    error: {
      main: error[700],
      light: error[100],
      dark: error[800],
      contrast: '#FFFFFF',
    },
    // Snackbar의 기본 severity가 info인데 계약에 뒷받침하는 토큰이 없어서
    // 컴포넌트가 primary를 빌려 쓰고 있었다. 어휘를 계약에 맞춘다.
    // 값은 의도적으로 primary와 같다 — info는 브랜드 블루로 표현한다.
    info: {
      main: primary[700],
      light: primary[100],
      dark: primary[800],
      contrast: '#FFFFFF',
    },
  },
  // 역할 기반 4슬롯(main/light/dark/contrast)으로 표현되지 않는, 상호작용
  // 상태별 세밀한 shade(hover/active 등)가 필요한 컴포넌트를 위한 원본 스케일
  // 노출. raw colors.css를 직접 import하는 대신 이 경로를 거치면 CSS 변수로
  // 감싸여 향후 다중 테마 도입 시에도 자동으로 반응한다.
  palette: {
    primary,
    gray,
    error,
  },
  spacing,
  borderRadius,
  shadow: shadows,
  font: {
    family: fontFamily,
    size: fontSize,
    weight: fontWeight,
    lineHeight,
    letterSpacing,
    variantNumeric: fontVariantNumeric,
  },
  animation: {
    duration,
    loop,
    easing,
  },
  zIndex,
};
