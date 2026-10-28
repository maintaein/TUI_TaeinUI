export interface SearchSection {
  title: string;
  content: string;
}

export interface SearchEntry {
  id: string;
  pageTitle: string;
  path: string;
  category: string;
  description: string;
  sections: SearchSection[];
}

export const searchIndex: SearchEntry[] = [
  // ─── 소개 & 시작하기 ───
  {
    id: 'introduction',
    pageTitle: '소개',
    path: '/',
    category: '시작하기',
    description:
      'TUI(TaeinUI) 소개. 컴포넌트마다 다른 움직임을 갖는 React UI 컴포넌트 라이브러리.',
    sections: [
      {
        title: 'TUI의 목표',
        content:
          '컴포넌트마다 다른 움직임, 시인성·가독성·가시성은 협상 대상이 아님, AI 친화, 정적 CSS와 분리된 모듈. GSAP 모션, prefers-reduced-motion, llms.txt 제공',
      },
      {
        title: '빠른 미리보기',
        content:
          '컴포넌트 패밀리 25개(top-level export 33개), GSAP 모션 14개 컴포넌트, Zero-runtime CSS, Tree-shakable',
      },
    ],
  },
  {
    id: 'getting-started',
    pageTitle: '시작하기',
    path: '/getting-started',
    category: '시작하기',
    description: '설치 방법과 기본 설정 가이드.',
    sections: [
      {
        title: '설치',
        content: 'npm install @taein-ui/core, pnpm add, yarn add',
      },
      {
        title: '기본 사용법',
        content: 'styles.css를 import하여 사용',
      },
    ],
  },

  // ─── 폼 & 입력 컴포넌트 ───
  {
    id: 'text-field',
    pageTitle: 'TextField',
    path: '/components/text-field',
    category: '폼 & 입력',
    description: '텍스트 입력 필드. 다양한 타입과 상태를 지원합니다.',
    sections: [
      { title: 'Basic TextField', content: '기본적인 텍스트 입력 필드 사용법' },
      { title: 'Sizes', content: 'sm, md, lg 세 가지 크기를 지원합니다' },
      {
        title: 'States',
        content: 'error, disabled, readOnly 상태를 지원합니다',
      },
      {
        title: 'With Icons',
        content: 'leftIcon, rightIcon prop으로 아이콘을 배치할 수 있습니다',
      },
      {
        title: 'Password',
        content: '비밀번호 입력 필드. type="password"로 설정',
      },
      {
        title: 'Multiline',
        content:
          '여러 줄 입력은 multiline. rows로 줄 수, autoResize로 내용에 맞춰 높이 조절',
      },
    ],
  },
  {
    id: 'checkbox',
    pageTitle: 'Checkbox',
    path: '/components/checkbox',
    category: '폼 & 입력',
    description: '체크박스. indeterminate 상태를 지원합니다.',
    sections: [
      { title: 'Basic Checkbox', content: '기본 체크박스 사용법' },
      {
        title: 'Indeterminate',
        content: '부분 선택 상태를 나타내는 indeterminate 모드',
      },
      { title: 'Sizes', content: 'sm, md, lg 크기를 지원합니다' },
      {
        title: 'States',
        content: 'checked, unchecked, indeterminate, disabled, error 상태',
      },
    ],
  },
  {
    id: 'switch',
    pageTitle: 'Switch',
    path: '/components/switch',
    category: '폼 & 입력',
    description: '토글 스위치. on/off 상태를 시각적으로 표현합니다.',
    sections: [
      { title: 'Basic Switch', content: '기본 토글 스위치 사용법' },
      { title: 'Sizes', content: 'sm, md, lg 크기를 지원합니다' },
      { title: 'With Label', content: '레이블과 함께 사용하기' },
      { title: 'States', content: 'checked, disabled 상태를 지원합니다' },
    ],
  },
  {
    id: 'numeric-spinner',
    pageTitle: 'NumericSpinner',
    path: '/components/numeric-spinner',
    category: '폼 & 입력',
    description: '숫자 입력 스피너. 증가/감소 버튼을 제공합니다.',
    sections: [
      { title: 'Basic NumericSpinner', content: '기본 숫자 입력 스피너' },
      { title: 'Min/Max', content: 'min, max prop으로 범위 제한' },
      { title: 'Step', content: 'step prop으로 증가/감소 단위 설정' },
      { title: 'Sizes', content: 'sm, md, lg 크기를 지원합니다' },
    ],
  },
  {
    id: 'segmented-buttons',
    pageTitle: 'SegmentedButtons',
    path: '/components/segmented-buttons',
    category: '폼 & 입력',
    description: '세그먼트 버튼. 단일 선택 라디오 그룹입니다.',
    sections: [
      { title: 'Basic SegmentedButtons', content: '기본 세그먼트 버튼 사용법' },
      {
        title: 'Controlled',
        content: 'value와 onChange로 제어되는 세그먼트 버튼',
      },
      { title: 'Sizes', content: 'sm, md, lg 크기를 지원합니다' },
    ],
  },
  {
    id: 'slider',
    pageTitle: 'Slider',
    path: '/components/slider',
    category: '폼 & 입력',
    description: '슬라이더. 범위 값을 선택합니다.',
    sections: [
      { title: 'Basic Slider', content: '기본 슬라이더 사용법' },
      { title: 'Range', content: 'min, max, step으로 범위와 단위 설정' },
      { title: 'With Label', content: '현재 값 표시와 함께 사용' },
      {
        title: '진행도 수치',
        content: 'showThumbValue로 잡는 동안 머리 위에 값을 띄웁니다',
      },
    ],
  },

  // ─── 버튼 ───
  {
    id: 'button',
    pageTitle: 'Button',
    path: '/components/button',
    category: '버튼',
    description: '버튼. 4가지 variant와 4가지 size를 지원합니다.',
    sections: [
      {
        title: 'Basic Button',
        content: '기본 버튼 사용법. onClick 이벤트를 트리거합니다',
      },
      {
        title: 'Variants (Fill)',
        content: 'primary, dark, danger, light 4가지 Fill 스타일 변형',
      },
      {
        title: 'Variants (Weak)',
        content: 'buttonStyle="weak"로 채도가 낮은 배경색 사용',
      },
      { title: 'Sizes', content: 'sm, md, lg, xl 네 가지 크기를 지원합니다' },
      {
        title: 'With Icons',
        content: 'leftIcon, rightIcon prop으로 아이콘 배치',
      },
      {
        title: 'Loading',
        content: 'loading prop으로 로딩 스피너 표시. 자동 비활성화',
      },
      { title: 'Full Width', content: 'fullWidth prop으로 전체 너비 사용' },
      {
        title: 'Custom Color',
        content: 'customColor prop으로 커스텀 색상 설정',
      },
      { title: 'Disabled', content: 'disabled prop으로 비활성화 상태' },
    ],
  },
  {
    id: 'icon-button',
    pageTitle: 'IconButton',
    path: '/components/icon-button',
    category: '버튼',
    description: '아이콘 버튼. 정사각형 버튼입니다.',
    sections: [
      { title: 'Basic IconButton', content: '기본 아이콘 버튼 사용법' },
      { title: 'Sizes', content: 'sm, md, lg, xl 크기를 지원합니다' },
      {
        title: 'Ghost',
        content: 'buttonStyle ghost(기본값)로 배경 없는 투명 버튼',
      },
      {
        title: 'Variants',
        content: 'weak, strong에서 primary, dark, danger, light 색상 변형',
      },
    ],
  },
  // ─── 피드백 & 상태 ───
  {
    id: 'badge',
    pageTitle: 'Badge',
    path: '/components/badge',
    category: '피드백 & 상태',
    description: '뱃지. 숫자 또는 dot 표시를 지원합니다.',
    sections: [
      { title: 'Basic Badge', content: '기본 뱃지 사용법' },
      { title: 'Dot', content: 'dot 모드로 알림 표시' },
      { title: 'Count', content: '숫자 카운트 뱃지' },
      { title: 'Max', content: 'max prop으로 최대 숫자 제한 (예: 99+)' },
      {
        title: 'Colors',
        content: 'primary, secondary, success, error, warning 색상',
      },
    ],
  },
  {
    id: 'loader',
    pageTitle: 'Loader',
    path: '/components/loader',
    category: '피드백 & 상태',
    description:
      '고수준 로더. orbit(기본)/spinner/dots/bar/wave 타입과 label/overlay, 모든 타입의 완료·실패 상태(status)를 지원합니다.',
    sections: [
      { title: 'Basic Loader', content: '기본 로더 사용법' },
      {
        title: 'Types',
        content:
          'orbit(기본), spinner, dots, bar, wave(물결 막대) 다섯 가지 로딩 타입. status로 결과를 표시합니다. bar는 색과 흔들림, spinner는 원이 닫힌 뒤 버블처럼 등장하는 체크/X 표식입니다.',
      },
      { title: 'Overlay', content: 'overlay prop으로 전체 화면 오버레이 로딩' },
      { title: 'With Label', content: 'label prop으로 로딩 메시지 표시' },
    ],
  },
  {
    id: 'skeleton',
    pageTitle: 'Skeleton',
    path: '/components/skeleton',
    category: '피드백 & 상태',
    description: '스켈레톤. 로딩 상태를 시각적으로 표현합니다.',
    sections: [
      { title: 'Basic Skeleton', content: '기본 스켈레톤 사용법' },
      { title: 'Shapes', content: 'text, circle, rectangle 형태를 지원합니다' },
      { title: 'Animation', content: 'pulse, wave 애니메이션 효과' },
    ],
  },
  {
    id: 'snackbar',
    pageTitle: 'Snackbar',
    path: '/components/snackbar',
    category: '피드백 & 상태',
    description: '스낵바. 알림 메시지를 표시합니다.',
    sections: [
      { title: 'Basic Snackbar', content: '기본 스낵바 알림' },
      { title: 'Types', content: 'info, success, warning, error 타입' },
      { title: 'With Action', content: 'action prop으로 버튼 추가' },
      { title: 'Auto Dismiss', content: 'duration prop으로 자동 닫힘 설정' },
    ],
  },
  {
    id: 'tooltip',
    pageTitle: 'Tooltip',
    path: '/components/tooltip',
    category: '피드백 & 상태',
    description: '툴팁. 호버 시 추가 정보를 표시합니다.',
    sections: [
      { title: 'Basic Tooltip', content: '기본 툴팁 사용법' },
      { title: 'Placement', content: 'top, bottom, left, right 방향 설정' },
      { title: 'Custom Content', content: '커스텀 콘텐츠를 툴팁에 표시' },
    ],
  },

  // ─── 오버레이 ───
  {
    id: 'modal',
    pageTitle: 'Modal',
    path: '/components/modal',
    category: '오버레이',
    description: '모달. 중앙 정렬 다이얼로그입니다.',
    sections: [
      { title: 'Basic Modal', content: '기본 모달 다이얼로그 사용법' },
      { title: 'Sizes', content: 'sm, md, lg 크기를 지원합니다' },
      {
        title: 'With Header/Footer',
        content: 'Modal.Header, Modal.Content, Modal.Footer 컴파운드 패턴',
      },
      { title: 'Focus Trap', content: '포커스 트랩으로 키보드 접근성 보장' },
    ],
  },
  {
    id: 'bottom-sheet',
    pageTitle: 'BottomSheet',
    path: '/components/bottom-sheet',
    category: '오버레이',
    description: '바텀 시트. 하단에서 슬라이드됩니다.',
    sections: [
      { title: 'Basic BottomSheet', content: '기본 바텀 시트 사용법' },
      { title: 'Sizes', content: 'sm, md, lg, full 크기를 지원합니다' },
      { title: 'With Handle', content: '드래그 핸들이 포함된 바텀 시트' },
    ],
  },
  {
    id: 'side-sheet',
    pageTitle: 'SideSheet',
    path: '/components/side-sheet',
    category: '오버레이',
    description: '사이드 시트. 우측에서 슬라이드됩니다.',
    sections: [
      { title: 'Basic SideSheet', content: '기본 사이드 시트 사용법' },
      { title: 'Sizes', content: 'sm, md, lg 크기를 지원합니다' },
      {
        title: 'With Header/Footer',
        content:
          'SideSheet.Header, SideSheet.Body, SideSheet.Footer 컴파운드 패턴',
      },
    ],
  },
  {
    id: 'popover',
    pageTitle: 'Popover',
    path: '/components/popover',
    category: '오버레이',
    description: '팝오버. 클릭 시 트리거 근처에 콘텐츠를 표시합니다.',
    sections: [
      { title: 'Basic Popover', content: '기본 팝오버 사용법' },
      { title: 'Placement', content: 'top, bottom, left, right 방향 설정' },
      { title: 'With Arrow', content: '화살표가 포함된 팝오버' },
    ],
  },

  // ─── 레이아웃 ───
  {
    id: 'header-bar',
    pageTitle: 'HeaderBar',
    path: '/components/header-bar',
    category: '레이아웃',
    description: '헤더 바. sticky 옵션을 지원합니다.',
    sections: [
      { title: 'Basic HeaderBar', content: '기본 헤더 바 사용법' },
      { title: 'Sticky', content: 'sticky prop으로 상단 고정' },
      { title: 'With Actions', content: '우측에 액션 버튼 배치' },
    ],
  },
  {
    id: 'divider',
    pageTitle: 'Divider',
    path: '/components/divider',
    category: '레이아웃',
    description: '구분선. 수평/수직 방향을 지원합니다.',
    sections: [
      { title: 'Basic Divider', content: '기본 구분선 사용법' },
      { title: 'Direction', content: 'horizontal, vertical 방향 설정' },
      { title: 'With Label', content: '라벨이 포함된 구분선' },
    ],
  },
  {
    id: 'border',
    pageTitle: 'Border',
    path: '/components/border',
    category: '레이아웃',
    description: '테두리. 4방향 개별 설정이 가능합니다.',
    sections: [
      { title: 'Basic Border', content: '기본 테두리 컴포넌트 사용법' },
      { title: 'Directions', content: 'top, right, bottom, left 개별 설정' },
      { title: 'Styles', content: 'solid, dashed, dotted 스타일' },
    ],
  },
  {
    id: 'list',
    pageTitle: 'List',
    path: '/components/list',
    category: '레이아웃',
    description: '리스트. label-value 쌍을 표시합니다.',
    sections: [
      { title: 'Basic List', content: '기본 리스트 사용법' },
      { title: 'With Divider', content: '구분선이 포함된 리스트' },
      { title: 'Interactive', content: '클릭 가능한 인터랙티브 리스트' },
    ],
  },
  {
    id: 'board-row',
    pageTitle: 'BoardRow',
    path: '/components/board-row',
    category: '레이아웃',
    description: '아코디언. 펼침/접힘이 가능합니다.',
    sections: [
      { title: 'Basic BoardRow', content: '기본 아코디언 사용법' },
      {
        title: 'Controlled',
        content: 'expanded와 onChange로 제어되는 아코디언',
      },
      { title: 'Multiple', content: '여러 행을 동시에 펼칠 수 있는 모드' },
    ],
  },

  // ─── 데이터 표시 ───
  {
    id: 'avatar',
    pageTitle: 'Avatar',
    path: '/components/avatar',
    category: '데이터 표시',
    description: '아바타. 이미지/텍스트 fallback을 지원합니다.',
    sections: [
      { title: 'Basic Avatar', content: '기본 아바타 사용법' },
      { title: 'Sizes', content: 'sm, md, lg, xl 크기를 지원합니다' },
      { title: 'With Image', content: 'src prop으로 이미지 아바타' },
      { title: 'Fallback', content: '이미지 로드 실패 시 이니셜 텍스트 표시' },
    ],
  },
  {
    id: 'chip',
    pageTitle: 'Chip',
    path: '/components/chip',
    category: '데이터 표시',
    description: '칩. 태그 시스템에 사용됩니다.',
    sections: [
      { title: 'Basic Chip', content: '기본 칩 사용법' },
      { title: 'Variants', content: 'filled, outlined 스타일 변형' },
      { title: 'Deletable', content: 'onDelete prop으로 삭제 가능한 칩' },
      { title: 'With Icon', content: '아이콘이 포함된 칩' },
    ],
  },
  {
    id: 'card',
    pageTitle: 'Card',
    path: '/components/card',
    category: '데이터 표시',
    description: '카드. header/content/footer 구조를 지원합니다.',
    sections: [
      { title: 'Basic Card', content: '기본 카드 사용법' },
      {
        title: 'Compound Pattern',
        content: 'Card.Header, Card.Body, Card.Footer 컴파운드 패턴',
      },
      { title: 'Clickable', content: 'onClick prop으로 클릭 가능한 카드' },
      { title: 'Elevation', content: 'elevation prop으로 그림자 수준 설정' },
    ],
  },

  // ─── 모션 ───
  {
    id: 'hangul-assemble',
    pageTitle: '한글 조립',
    path: '/motion/hangul-assemble',
    category: '모션',
    description:
      'HangulAssemble. 흩어진 자모가 날아와 모이며 한글 글자가 됩니다.',
    sections: [
      {
        title: '텍스트 애니메이션',
        content:
          'text에 문장을 주면 화면에 들어올 때 한 번 자모가 모여 글자가 됩니다',
      },
      {
        title: '다시 재생',
        content:
          'text가 바뀌어도 다시 재생하지 않습니다. key를 바꾸면 다시 조립합니다',
      },
      {
        title: 'as',
        content: 'h1, h2, p 등 루트 요소를 고릅니다',
      },
      {
        title: '움직임 줄이기',
        content: '움직임 줄이기에서는 완성 문장을 바로 보여 줍니다',
      },
    ],
  },
  {
    id: 'jelly-text',
    pageTitle: '젤리 글자',
    path: '/motion/jelly-text',
    category: '모션',
    description:
      'JellyText. 커서가 지나가는 글자가 말랑하게 늘었다 출렁이며 돌아옵니다.',
    sections: [
      {
        title: '텍스트 애니메이션',
        content:
          '말랑한 글자. 커서와 가까운 글자가 가로로 늘었다가 세로로 눌리며 출렁이고 스프링처럼 돌아옵니다',
      },
      {
        title: '어떻게 움직이나',
        content:
          '젤리처럼 출렁입니다. 한 칸 떨어지면 절반쯤 늘고 커서가 있는 줄의 글자만 반응합니다',
      },
      {
        title: 'as',
        content: 'h1, h2, p 등 루트 요소를 고릅니다',
      },
      {
        title: '움직임 줄이기',
        content:
          '움직임 줄이기와 터치 화면에서는 평범한 글자로 보이고 출렁이지 않습니다',
      },
    ],
  },
  {
    id: 'gooey-search',
    pageTitle: '물방울 검색창',
    path: '/motion/gooey-search',
    category: '모션',
    description:
      'GooeySearch. 검색 단추가 물방울처럼 갈라지며 그 사이로 입력창이 늘어납니다.',
    sections: [
      {
        title: '컴포넌트',
        content:
          '물방울 검색창. 둥근 검색 단추를 누르면 오른쪽으로 갈라지고 입력창이 늘어나며, 닫으면 두 덩어리가 끈적하게 합쳐집니다',
      },
      {
        title: '부모가 쥐기',
        content:
          'open과 onOpenChange로 열림을 제어하고 입력값과 결과 목록은 inputProps와 children으로 넘깁니다',
      },
      {
        title: '접근성',
        content:
          'Esc로 닫으면 트리거로 포커스가 돌아옵니다. combobox 연결은 부모가 합니다',
      },
      {
        title: '움직임 줄이기',
        content: '움직임 줄이기에서는 갈라짐 없이 바로 열리고 닫힙니다',
      },
    ],
  },
  {
    id: 'copy-button',
    pageTitle: '복사됨',
    path: '/motion/copy-button',
    category: '모션',
    description:
      "CopyButton. 누르면 아이콘이 체크로 접히고 글자가 '복사됨'으로 바뀝니다. 복사, 클립보드, copy.",
    sections: [
      {
        title: '마이크로 인터랙션',
        content:
          '복사 단추. 누르면 클립보드 아이콘이 접히며 체크 선이 그려지고 글자가 위로 빠지며 복사됨이 올라옵니다. 잠시 뒤 평소 모습으로 돌아옵니다. 클립보드에 복사, copy, clipboard',
      },
      {
        title: '복사 실패',
        content:
          '클립보드가 없거나 쓰기가 거절되면 아이콘이 짧게 흔들리고 글자가 복사 실패가 됩니다. onCopy로 결과를 받습니다',
      },
      {
        title: '접근성',
        content:
          '단추의 이름은 늘 label입니다. 결과는 aria-live 영역이 한 번 읽습니다',
      },
      {
        title: '움직임 줄이기',
        content: '움직임 줄이기에서는 아이콘과 글자가 움직임 없이 바뀝니다',
      },
    ],
  },
  {
    id: 'burst-toggle',
    pageTitle: '좋아요 터짐',
    path: '/motion/burst-toggle',
    category: '모션',
    description:
      'BurstToggle. 켜면 아이콘이 납작했다가 튕기며 채워지고 파란 점이 터져 흩어집니다. 좋아요, 하트, 터짐, burst.',
    sections: [
      {
        title: '마이크로 인터랙션',
        content:
          '좋아요 단추. 켜면 아이콘이 납작했다가 튕기며 채워지고 파란 점이 아이콘 가운데에서 터져 흩어집니다. 끄면 조용히 꺼진 아이콘으로 돌아갑니다. 좋아요, 저장, 즐겨찾기, 하트, 별, 북마크, like, heart, burst',
      },
      {
        title: '상태 들기',
        content:
          'selected를 소비자가 쥐고 onClick에서 뒤집습니다. 터짐은 이 단추를 눌러 켜질 때만 일어납니다',
      },
      {
        title: '접근성',
        content:
          'aria-pressed가 selected를 따르고 이름은 aria-label로 고정입니다. 터지는 점은 aria-hidden 장식입니다',
      },
      {
        title: '움직임 줄이기',
        content: '움직임 줄이기에서는 아이콘만 바뀌고 점은 터지지 않습니다',
      },
    ],
  },
  {
    id: 'hold-button',
    pageTitle: '꾹 눌러 확정',
    path: '/motion/hold-button',
    category: '모션',
    description:
      'HoldButton. 누르고 있는 동안 단추가 차오르고 다 차면 실행됩니다. 한 번 눌러 두고 다시 눌러도 됩니다. 꾹, 길게, 확정, 삭제, 결제, 초기화, hold.',
    sections: [
      {
        title: '마이크로 인터랙션',
        content:
          '꾹 눌러 확정하는 단추. 누르고 있는 동안 안쪽이 왼쪽부터 차오르고 끝 구간에서 미세하게 떨리며, 다 차면 튕기며 체크가 나타나고 실행됩니다. 중간에 떼면 물 빠지듯 되감깁니다',
      },
      {
        title: '실행은 onConfirm에',
        content:
          'onConfirm은 홀드를 다 채웠을 때와 두 번 눌러 확정의 두 번째 click에서 불립니다. 네이티브 onClick은 실행을 뜻하지 않습니다',
      },
      {
        title: '접근성',
        content:
          '두 번 눌러 확정. click 한 번은 무장이 되어 글자가 confirmLabel로 바뀌고 role status가 알립니다. 무장에는 타이머가 없고 포커스가 빠지면 풀립니다. 홀드 시간은 1.5초로 고정입니다',
      },
      {
        title: '움직임 줄이기',
        content:
          '움직임 줄이기에서는 누르는 시간은 같고, 차오름이 네 단계로 끊어 보입니다. 떨림과 튕김은 없습니다',
      },
    ],
  },
  {
    id: 'stamp-button',
    pageTitle: '도장 확정',
    path: '/motion/stamp-button',
    category: '모션',
    description:
      'StampButton. 누르면 도장이 내려와 쾅 찍히고 파란 인주가 번집니다. 도장, 결재, 승인, 제출, 확정, 인주, stamp.',
    sections: [
      {
        title: '마이크로 인터랙션',
        content:
          '결재와 제출 단추. 누르면 도장이 단추 위에서 1.6배로 기울어 내려와 쾅 찍히고(단추가 1px 눌립니다), 도장 둘레로 옅은 파란 인주 자국이 번집니다',
      },
      {
        title: '다시 찍기는 key로',
        content:
          '한 번만 찍힙니다. 되돌리는 prop은 없고 key를 바꿔 단추를 새로 그리면 처음 상태로 돌아갑니다',
      },
      {
        title: '접근성',
        content:
          '찍힌 뒤에는 aria-disabled로 잠겨 click, Enter, Space가 onClick을 부르지 않고 포커스는 남습니다. role status가 도장을 찍었다고 알립니다. 도장과 인주는 aria-hidden 장식입니다',
      },
      {
        title: '움직임 줄이기',
        content:
          '움직임 줄이기에서는 도장과 인주 자국이 움직임 없이 바로 나타납니다',
      },
    ],
  },
  {
    id: 'slosh-gauge',
    pageTitle: '출렁이는 게이지',
    path: '/motion/slosh-gauge',
    category: '모션',
    description:
      'SloshGauge. 값이 바뀌면 통 안의 물이 크게 출렁였다가 잔잔해집니다. 게이지, 물, 출렁, 수위, 저장 공간, meter.',
    sections: [
      {
        title: '마이크로 인터랙션',
        content:
          '값을 통 안의 물높이로 보이는 게이지. 값이 바뀌면 수면이 새 높이로 가면서 크게 출렁였다가 잔잔해집니다. 출렁임은 값이 바뀔 때만 생기고 저절로 되풀이되지 않습니다',
      },
      {
        title: '출렁임의 규칙',
        content:
          '바뀐 양에 비례해 커지되 통 높이의 8%에서 잘리고, 마지막 변경 뒤 1.5초 안에 수면이 평평해집니다. 값이 자주 바뀌어도 쌓여 커지지 않습니다',
      },
      {
        title: '접근성',
        content:
          'role meter, aria-valuenow는 값이 바뀌는 즉시 새 값입니다. valueText가 없으면 백분율을 읽습니다. 통과 물은 aria-hidden 장식입니다',
      },
      {
        title: '움직임 줄이기',
        content: '움직임 줄이기에서는 물이 출렁이지 않고 높이만 바뀝니다',
      },
    ],
  },
];
