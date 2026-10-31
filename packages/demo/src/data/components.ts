import {
  Badge,
  Bone,
  Brush,
  ChevronsUpDown,
  CirclePlus,
  CircleUser,
  ClipboardCheck,
  Columns3,
  Hash,
  Heart,
  Info,
  Languages,
  LayoutPanelTop,
  List,
  Loader,
  MessageCircle,
  MessageSquare,
  Minus,
  MousePointerClick,
  PanelBottom,
  PanelRight,
  PanelTop,
  Search,
  SlidersHorizontal,
  Square,
  SquareCheck,
  SquareDashed,
  Tag,
  TextCursorInput,
  ToggleLeft,
  Fan,
  Send,
  Sparkles,
  Gauge,
  KeyRound,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

export interface ComponentInfo {
  name: string;
  path: string;
  description: string;
  category: 'form' | 'button' | 'feedback' | 'overlay' | 'layout' | 'data';
  icon: LucideIcon;
}

export const componentsData: ComponentInfo[] = [
  // Form Components (6개)
  {
    name: 'TextField',
    path: '/components/text-field',
    description:
      '이름, 이메일, 비밀번호 등 한 줄 텍스트를 입력받을 때 사용합니다.',
    category: 'form',
    icon: TextCursorInput,
  },
  {
    name: 'Checkbox',
    path: '/components/checkbox',
    description:
      '약관 동의, 다중 선택 등 사용자가 항목을 체크할 때 사용합니다.',
    category: 'form',
    icon: SquareCheck,
  },
  {
    name: 'Switch',
    path: '/components/switch',
    description: '알림, 자동 저장 등 설정을 켜거나 끌 때 사용합니다.',
    category: 'form',
    icon: ToggleLeft,
  },
  {
    name: 'NumericSpinner',
    path: '/components/numeric-spinner',
    description: '수량, 인원수 등 숫자를 버튼으로 조절할 때 사용합니다.',
    category: 'form',
    icon: Hash,
  },
  {
    name: 'SegmentedButtons',
    path: '/components/segmented-buttons',
    description:
      '보기 모드, 정렬 방식 등 여러 옵션 중 하나를 선택할 때 사용합니다.',
    category: 'form',
    icon: Columns3,
  },
  {
    name: 'Slider',
    path: '/components/slider',
    description:
      '볼륨, 가격 범위 등 연속적인 값을 드래그로 조절할 때 사용합니다.',
    category: 'form',
    icon: SlidersHorizontal,
  },

  // Button Components (3개)
  {
    name: 'Button',
    path: '/components/button',
    description:
      '폼 제출, 모달 열기, 삭제 등 사용자 액션을 실행할 때 사용합니다.',
    category: 'button',
    icon: MousePointerClick,
  },
  {
    name: 'IconButton',
    path: '/components/icon-button',
    description: '닫기, 메뉴 열기 등 아이콘만으로 액션을 표현할 때 사용합니다.',
    category: 'button',
    icon: CirclePlus,
  },

  // Feedback Components (6개)
  {
    name: 'Badge',
    path: '/components/badge',
    description:
      '읽지 않은 알림 수, 새 메시지 표시 등 상태를 알려줄 때 사용합니다.',
    category: 'feedback',
    icon: Badge,
  },
  {
    name: 'Loader',
    path: '/components/loader',
    description: '페이지 전체나 특정 영역이 로딩 중일 때 사용합니다.',
    category: 'feedback',
    icon: Loader,
  },
  {
    name: 'Skeleton',
    path: '/components/skeleton',
    description:
      '콘텐츠가 로딩되기 전에 레이아웃 윤곽을 미리 보여줄 때 사용합니다.',
    category: 'feedback',
    icon: Bone,
  },
  {
    name: 'Snackbar',
    path: '/components/snackbar',
    description:
      '저장 완료, 에러 발생 등 짧은 알림을 화면 하단에 띄울 때 사용합니다.',
    category: 'feedback',
    icon: MessageSquare,
  },
  {
    name: 'Tooltip',
    path: '/components/tooltip',
    description:
      '아이콘이나 버튼 위에 마우스를 올렸을 때 부가 설명을 보여줄 때 사용합니다.',
    category: 'feedback',
    icon: Info,
  },

  // Overlay Components (4개)
  {
    name: 'Modal',
    path: '/components/modal',
    description:
      '확인 대화상자, 폼 입력 등 사용자의 주의가 필요한 작업에 사용합니다.',
    category: 'overlay',
    icon: Square,
  },
  {
    name: 'BottomSheet',
    path: '/components/bottom-sheet',
    description:
      '모바일에서 옵션 선택, 필터 등을 화면 아래에서 올릴 때 사용합니다.',
    category: 'overlay',
    icon: PanelBottom,
  },
  {
    name: 'SideSheet',
    path: '/components/side-sheet',
    description:
      '상세 정보, 설정 패널 등을 화면 옆에서 슬라이드로 열 때 사용합니다.',
    category: 'overlay',
    icon: PanelRight,
  },
  {
    name: 'Popover',
    path: '/components/popover',
    description:
      '프로필 메뉴, 날짜 선택기 등 특정 요소 근처에 패널을 띄울 때 사용합니다.',
    category: 'overlay',
    icon: MessageCircle,
  },

  // Layout Components (5개)
  {
    name: 'HeaderBar',
    path: '/components/header-bar',
    description: '페이지 상단에 로고, 제목, 액션 버튼을 배치할 때 사용합니다.',
    category: 'layout',
    icon: PanelTop,
  },
  {
    name: 'Divider',
    path: '/components/divider',
    description: '콘텐츠 사이를 시각적으로 구분할 때 사용합니다.',
    category: 'layout',
    icon: Minus,
  },
  {
    name: 'Border',
    path: '/components/border',
    description: '콘텐츠 영역에 테두리를 넣어 구분하거나 강조할 때 사용합니다.',
    category: 'layout',
    icon: SquareDashed,
  },
  {
    name: 'List',
    path: '/components/list',
    description: '설정 항목, 주문 내역 등 정보를 세로로 나열할 때 사용합니다.',
    category: 'layout',
    icon: List,
  },
  {
    name: 'BoardRow',
    path: '/components/board-row',
    description: 'FAQ, 상세 정보 등 콘텐츠를 접었다 펼칠 때 사용합니다.',
    category: 'layout',
    icon: ChevronsUpDown,
  },

  // Data Components (4개)
  {
    name: 'Avatar',
    path: '/components/avatar',
    description: '사용자 프로필 사진이나 이니셜을 표시할 때 사용합니다.',
    category: 'data',
    icon: CircleUser,
  },
  {
    name: 'Chip',
    path: '/components/chip',
    description: '태그, 필터, 카테고리 등을 작은 라벨로 표시할 때 사용합니다.',
    category: 'data',
    icon: Tag,
  },
  {
    name: 'Card',
    path: '/components/card',
    description:
      '상품, 글, 프로필 등 관련 정보를 하나의 영역으로 묶을 때 사용합니다.',
    category: 'data',
    icon: LayoutPanelTop,
  },
];

export const categoryLabels: Record<ComponentInfo['category'], string> = {
  form: '폼 & 입력',
  button: '버튼',
  feedback: '피드백 & 상태',
  overlay: '오버레이',
  layout: '레이아웃',
  data: '데이터 표시',
};

/** 번호(계열 순서대로 이어서 01부터)를 붙여 계열별로 묶은 목록. 사이드바와 전체 컴포넌트 카드가 이것 하나를 쓴다 */
let count = 0;
export const numberedGroups = Object.entries(categoryLabels).map(
  ([key, label]) => ({
    label,
    items: componentsData
      .filter((c) => c.category === key)
      .map((c) => ({ ...c, no: String(++count).padStart(2, '0') })),
  })
);

/**
 * 전체 컴포넌트 벽에서 넓은 몸을 가진 컴포넌트에 주는 칸. 적지 않은 컴포넌트는 한 칸이다.
 * 세 줄(3열)과 두 줄(2열, 1024px 이하) 모두 계열마다 빈칸 없이 채워지도록 짠 표다. 칸을 바꾸면 두 폭 다 확인한다.
 * - wide: 가로 두 칸(3열·2열 모두)
 * - wide3: 3열에서만 가로 두 칸
 * - wide2: 2열에서만 가로 두 칸
 * - tall: 3열에서 세로 두 칸
 */
export const cardCell: Record<string, 'wide' | 'wide3' | 'wide2' | 'tall'> = {
  TextField: 'tall',
  Switch: 'tall',
  SegmentedButtons: 'wide3',
  Button: 'wide3',
  Snackbar: 'wide',
  Modal: 'wide',
  BottomSheet: 'wide',
  HeaderBar: 'wide',
  Border: 'tall',
  List: 'wide',
  BoardRow: 'wide',
  Card: 'wide2',
};

/**
 * 전체 컴포넌트 카드 미니 칸의 최소 높이(px). 적지 않은 컴포넌트는 기본 높이다.
 * 미니는 칸 크기를 바꾸지 못하고(넘치면 잘린다) 둘레에 여백을 둔 채 들어가야 하므로, 내용이 큰 것만 키운다.
 */
export const cardHeight: Record<string, number> = {
  TextField: 232,
  Loader: 268,
  Skeleton: 268,
  Card: 312,
  BoardRow: 366,
  // 부채꼴이 허브 위로 약 130px 펼쳐지는 자리
  FanMenu: 240,
};

// ─── 모션 ───────────────────────────────────────────────────────
// UI 컴포넌트는 목적으로 찾고 모션 컴포넌트는 효과로 찾는다. 위 UI 쪽과 나란히 두고 번호도 따로 센다.

export interface MotionInfo {
  /** core의 컴포넌트 이름 */
  name: string;
  /** 효과 이름. 사이드바와 검색이 이것을 보인다 */
  title: string;
  path: string;
  description: string;
  /** 어디에 쓰는지 한 줄 */
  usage: string;
  category: 'text' | 'animation' | 'component' | 'micro' | 'background';
  icon: LucideIcon;
}

export const motionData: MotionInfo[] = [
  // Text Animation (2개)
  {
    name: 'HangulAssemble',
    title: '한글 조립',
    path: '/motion/hangul-assemble',
    description:
      '자모 모양으로 오린 글자 조각이 날아와 맞물리며 한글 글자가 됩니다.',
    usage: '첫 화면 소개 문장, 섹션 제목',
    category: 'text',
    icon: Languages,
  },
  {
    name: 'BrushText',
    title: '붓글씨 글자',
    path: '/motion/brush-text',
    description:
      '잉크를 재서 획을 찾고 자모마다 따로 획의 길을 따라 붓이 지나가며 문장이 한 글자씩 쓰이듯 나타납니다.',
    usage: '첫 화면 소개 문장, 섹션 제목',
    category: 'text',
    icon: Brush,
  },
  // Component (1개)
  {
    name: 'GooeySearch',
    title: '물방울 검색창',
    path: '/motion/gooey-search',
    description:
      '검색 단추가 물방울처럼 갈라지며 그 사이로 입력창이 늘어납니다.',
    usage: '헤더 검색, 도구 막대',
    category: 'component',
    icon: Search,
  },
  // Micro Interaction (7개)
  {
    name: 'CopyButton',
    title: '복사됨',
    path: '/motion/copy-button',
    description: "누르면 아이콘이 체크로 접히고 글자가 '복사됨'으로 바뀝니다.",
    usage: '코드 블록, 공유 링크',
    category: 'micro',
    icon: ClipboardCheck,
  },
  {
    name: 'BurstToggle',
    title: '좋아요 터짐',
    path: '/motion/burst-toggle',
    description:
      '켜면 아이콘이 납작했다가 튕기며 채워지고 파란 점이 터져 흩어집니다.',
    usage: '좋아요, 저장, 즐겨찾기',
    category: 'micro',
    icon: Heart,
  },
  {
    name: 'HoldButton',
    title: '꾹 눌러 확정',
    path: '/motion/hold-button',
    description:
      '누르고 있는 동안 단추가 차오르고 다 차면 실행됩니다. 한 번 눌러 두고 다시 눌러도 됩니다.',
    usage: '삭제, 결제, 초기화',
    category: 'micro',
    icon: Trash2,
  },
  {
    name: 'SloshGauge',
    title: '출렁이는 게이지',
    path: '/motion/slosh-gauge',
    description:
      '값이 바뀌면 물방울 그릇 안의 물이 목표를 넘었다 돌아오며 출렁이고, 쉴 때는 잔물결이 남습니다.',
    usage: '저장 공간, 할당량, 진행률',
    category: 'micro',
    icon: Gauge,
  },
  {
    name: 'CodeSlots',
    title: '인증번호 슬롯',
    path: '/motion/code-slots',
    description:
      '숫자가 슬롯처럼 굴러 들어오고, 틀리면 칸이 물결치고 맞으면 칸 테두리가 흐려진 뒤 칸이 모여 하나의 알약이 됩니다.',
    usage: '인증번호, PIN 입력',
    category: 'micro',
    icon: KeyRound,
  },
  {
    name: 'FanMenu',
    title: '부채꼴 메뉴',
    path: '/motion/fan-menu',
    description:
      '가운데 단추를 누르면 아이콘이 부채꼴로 차례차례 튀어나오고, 가리킨 쪽 아이콘이 커지며 이름표가 뜹니다.',
    usage: '빠른 작업, 공유 메뉴',
    category: 'micro',
    icon: Fan,
  },
  {
    name: 'WingButton',
    title: '날개 전송',
    path: '/motion/wing-button',
    description: '누르면 단추에 날개가 돋아 오른쪽 위로 날아갑니다.',
    usage: '메일 보내기, 제출, 전송',
    category: 'micro',
    icon: Send,
  },
  // Background (1개)
  {
    name: 'LuminousFlow',
    title: '빛 물줄기',
    path: '/motion/luminous-flow',
    description:
      '굽이치는 물길 안을 빛줄기가 흐르고, 스크롤하면 흐름이 빨라집니다.',
    usage: '첫 화면 배경, 어두운 섹션',
    category: 'background',
    icon: Sparkles,
  },
];

export const motionCategoryLabels: Record<MotionInfo['category'], string> = {
  text: '텍스트 애니메이션',
  animation: '애니메이션',
  component: '컴포넌트',
  micro: '마이크로 인터랙션',
  background: '배경',
};

/** 모션 번호(01부터)를 붙여 분류별로 묶은 목록. 항목이 없는 분류는 어디에도 보이지 않도록 뺀다 */
export function groupMotion(items: MotionInfo[]) {
  let no = 0;
  return Object.entries(motionCategoryLabels)
    .map(([key, label]) => ({
      label,
      items: items
        .filter((m) => m.category === key)
        .map((m) => ({ ...m, no: String(++no).padStart(2, '0') })),
    }))
    .filter((g) => g.items.length > 0);
}

export const numberedMotionGroups = groupMotion(motionData);
