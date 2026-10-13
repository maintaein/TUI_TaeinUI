export interface NavigationItem {
  label: string;
  path: string;
  children?: NavigationItem[];
}

export const navigationData: NavigationItem[] = [
  {
    label: '소개',
    path: '/',
  },
  {
    label: '시작하기',
    path: '/getting-started',
  },
  {
    label: '컴포넌트',
    path: '/components',
    children: [
      { label: '개요', path: '/components/overview' },
      { label: 'Avatar', path: '/components/avatar' },
      { label: 'Badge', path: '/components/badge' },
      { label: 'BoardRow', path: '/components/board-row' },
      { label: 'Border', path: '/components/border' },
      { label: 'BottomSheet', path: '/components/bottom-sheet' },
      { label: 'Button', path: '/components/button' },
      { label: 'Card', path: '/components/card' },
      { label: 'Checkbox', path: '/components/checkbox' },
      { label: 'Chip', path: '/components/chip' },
      { label: 'Divider', path: '/components/divider' },
      { label: 'HeaderBar', path: '/components/header-bar' },
      { label: 'IconButton', path: '/components/icon-button' },
      { label: 'List', path: '/components/list' },
      { label: 'Loader', path: '/components/loader' },
      { label: 'Modal', path: '/components/modal' },
      { label: 'NumericSpinner', path: '/components/numeric-spinner' },
      { label: 'Popover', path: '/components/popover' },
      { label: 'SegmentedButtons', path: '/components/segmented-buttons' },
      { label: 'SideSheet', path: '/components/side-sheet' },
      { label: 'Skeleton', path: '/components/skeleton' },
      { label: 'Slider', path: '/components/slider' },
      { label: 'Snackbar', path: '/components/snackbar' },
      { label: 'Switch', path: '/components/switch' },
      { label: 'TextField', path: '/components/text-field' },
      { label: 'Tooltip', path: '/components/tooltip' },
    ],
  },
];
