import type { ComponentType } from 'react';
import type { DemoProps } from '../Stage';
import { AvatarDemo } from '../../pages/Components/Avatar/AvatarPage';
import { BadgeDemo } from '../../pages/Components/Badge/BadgePage';
import { BoardRowDemo } from '../../pages/Components/BoardRow/BoardRowPage';
import { BorderDemo } from '../../pages/Components/Border/BorderPage';
import { BottomSheetDemo } from '../../pages/Components/BottomSheet/BottomSheetPage';
import { ButtonDemo } from '../../pages/Components/Button/ButtonPage';
import { CardDemo } from '../../pages/Components/Card/CardPage';
import { CheckboxDemo } from '../../pages/Components/Checkbox/CheckboxPage';
import { ChipDemo } from '../../pages/Components/Chip/ChipPage';
import { DividerDemo } from '../../pages/Components/Divider/DividerPage';
import { HeaderBarDemo } from '../../pages/Components/HeaderBar/HeaderBarPage';
import { IconButtonDemo } from '../../pages/Components/IconButton/IconButtonPage';
import { ListDemo } from '../../pages/Components/List/ListPage';
import { LoaderDemo } from '../../pages/Components/Loader/LoaderPage';
import { ModalDemo } from '../../pages/Components/Modal/ModalPage';
import { NumericSpinnerDemo } from '../../pages/Components/NumericSpinner/NumericSpinnerPage';
import { PopoverDemo } from '../../pages/Components/Popover/PopoverPage';
import { SegmentedButtonsDemo } from '../../pages/Components/SegmentedButtons/SegmentedButtonsPage';
import { SideSheetDemo } from '../../pages/Components/SideSheet/SideSheetPage';
import { SkeletonDemo } from '../../pages/Components/Skeleton/SkeletonPage';
import { SliderDemo } from '../../pages/Components/Slider/SliderPage';
import { SnackbarDemo } from '../../pages/Components/Snackbar/SnackbarPage';
import { SwitchDemo } from '../../pages/Components/Switch/SwitchPage';
import { TextFieldDemo } from '../../pages/Components/TextField/TextFieldPage';
import { TooltipDemo } from '../../pages/Components/Tooltip/TooltipPage';

/** 전체 컴포넌트 카드 미니. 각 상세 페이지의 무대 조각(대본 포함)을 그대로 쓴다 */
export const DEMOS: Record<string, ComponentType<DemoProps>> = {
  TextField: TextFieldDemo,
  Checkbox: CheckboxDemo,
  Switch: SwitchDemo,
  NumericSpinner: NumericSpinnerDemo,
  SegmentedButtons: SegmentedButtonsDemo,
  Slider: SliderDemo,
  Button: ButtonDemo,
  IconButton: IconButtonDemo,
  Badge: BadgeDemo,
  Loader: LoaderDemo,
  Skeleton: SkeletonDemo,
  Snackbar: SnackbarDemo,
  Tooltip: TooltipDemo,
  Modal: ModalDemo,
  BottomSheet: BottomSheetDemo,
  SideSheet: SideSheetDemo,
  Popover: PopoverDemo,
  HeaderBar: HeaderBarDemo,
  Divider: DividerDemo,
  Border: BorderDemo,
  List: ListDemo,
  BoardRow: BoardRowDemo,
  Avatar: AvatarDemo,
  Chip: ChipDemo,
  Card: CardDemo,
};
