import {
  Badge,
  Bone,
  ChevronsUpDown,
  CirclePlus,
  CircleUser,
  Columns3,
  Hash,
  Info,
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
  SlidersHorizontal,
  Square,
  SquareCheck,
  SquareDashed,
  Tag,
  TextCursorInput,
  ToggleLeft,
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

export const categoryColors: Record<ComponentInfo['category'], string> = {
  form: '#2563eb', // Primary Blue
  button: '#10b981', // Success Green
  feedback: '#f59e0b', // Warning Amber
  overlay: '#8b5cf6', // Purple
  layout: '#06b6d4', // Cyan
  data: '#ec4899', // Pink
};

/** 번호(계열 순서대로 이어서 01부터)를 붙여 계열별로 묶은 목록. 사이드바와 상세 페이지 머리가 이것 하나를 쓴다 */
let count = 0;
export const numberedGroups = Object.entries(categoryLabels).map(
  ([key, label]) => ({
    label,
    items: componentsData
      .filter((c) => c.category === key)
      .map((c) => ({ ...c, no: String(++count).padStart(2, '0') })),
  })
);

/** 상세 페이지 머리의 번호와 계열 이름 */
export const detailMeta = (name: string) => {
  const group = numberedGroups.find((g) =>
    g.items.some((c) => c.name === name)
  )!;
  return {
    no: group.items.find((c) => c.name === name)!.no,
    group: group.label,
  };
};
