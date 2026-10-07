import { lazy, Suspense, type ReactNode } from 'react';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { IntroductionPage } from '../pages/Introduction/IntroductionPage';
import { ErrorPage } from '../pages/Error';

// ─── Lazy-loaded pages ─────────────────────────────────────────────

// Getting Started
const GettingStartedPage = lazy(() =>
  import('../pages/GettingStarted/GettingStartedPage').then((m) => ({
    default: m.GettingStartedPage,
  }))
);

// Components
const ComponentsOverviewPage = lazy(() =>
  import('../pages/Components/ComponentsOverviewPage').then((m) => ({
    default: m.ComponentsOverviewPage,
  }))
);
const TextFieldPage = lazy(() =>
  import('../pages/Components/TextField').then((m) => ({
    default: m.TextFieldPage,
  }))
);
const CheckboxPage = lazy(() =>
  import('../pages/Components/Checkbox').then((m) => ({
    default: m.CheckboxPage,
  }))
);
const SwitchPage = lazy(() =>
  import('../pages/Components/Switch').then((m) => ({ default: m.SwitchPage }))
);
const NumericSpinnerPage = lazy(() =>
  import('../pages/Components/NumericSpinner').then((m) => ({
    default: m.NumericSpinnerPage,
  }))
);
const SegmentedButtonsPage = lazy(() =>
  import('../pages/Components/SegmentedButtons').then((m) => ({
    default: m.SegmentedButtonsPage,
  }))
);
const SliderPage = lazy(() =>
  import('../pages/Components/Slider').then((m) => ({ default: m.SliderPage }))
);
const ButtonPage = lazy(() =>
  import('../pages/Components/Button').then((m) => ({ default: m.ButtonPage }))
);
const IconButtonPage = lazy(() =>
  import('../pages/Components/IconButton').then((m) => ({
    default: m.IconButtonPage,
  }))
);
const TextPage = lazy(() =>
  import('../pages/Components/Text').then((m) => ({ default: m.TextPage }))
);
const BadgePage = lazy(() =>
  import('../pages/Components/Badge').then((m) => ({ default: m.BadgePage }))
);
const LoaderPage = lazy(() =>
  import('../pages/Components/Loader').then((m) => ({ default: m.LoaderPage }))
);
const SkeletonPage = lazy(() =>
  import('../pages/Components/Skeleton').then((m) => ({
    default: m.SkeletonPage,
  }))
);
const SnackbarPage = lazy(() =>
  import('../pages/Components/Snackbar').then((m) => ({
    default: m.SnackbarPage,
  }))
);
const TooltipPage = lazy(() =>
  import('../pages/Components/Tooltip').then((m) => ({
    default: m.TooltipPage,
  }))
);
const ModalPage = lazy(() =>
  import('../pages/Components/Modal').then((m) => ({ default: m.ModalPage }))
);
const BottomSheetPage = lazy(() =>
  import('../pages/Components/BottomSheet').then((m) => ({
    default: m.BottomSheetPage,
  }))
);
const SideSheetPage = lazy(() =>
  import('../pages/Components/SideSheet').then((m) => ({
    default: m.SideSheetPage,
  }))
);
const HeaderBarPage = lazy(() =>
  import('../pages/Components/HeaderBar').then((m) => ({
    default: m.HeaderBarPage,
  }))
);
const DividerPage = lazy(() =>
  import('../pages/Components/Divider').then((m) => ({
    default: m.DividerPage,
  }))
);
const BorderPage = lazy(() =>
  import('../pages/Components/Border').then((m) => ({ default: m.BorderPage }))
);
const ListPage = lazy(() =>
  import('../pages/Components/List').then((m) => ({ default: m.ListPage }))
);
const BoardRowPage = lazy(() =>
  import('../pages/Components/BoardRow').then((m) => ({
    default: m.BoardRowPage,
  }))
);
const AvatarPage = lazy(() =>
  import('../pages/Components/Avatar').then((m) => ({ default: m.AvatarPage }))
);
const PopoverPage = lazy(() =>
  import('../pages/Components/Popover').then((m) => ({
    default: m.PopoverPage,
  }))
);
const ChipPage = lazy(() =>
  import('../pages/Components/Chip').then((m) => ({ default: m.ChipPage }))
);
const CardPage = lazy(() =>
  import('../pages/Components/Card').then((m) => ({ default: m.CardPage }))
);

// ─── Suspense wrapper ──────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
      }}
      role="status"
      aria-label="페이지 로딩 중"
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ─── Router ────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage type="generic" />,
    children: [
      {
        index: true,
        element: <IntroductionPage />,
      },
      {
        path: 'getting-started',
        element: (
          <LazyPage>
            <GettingStartedPage />
          </LazyPage>
        ),
      },
      {
        path: 'components',
        children: [
          {
            index: true,
            element: <Navigate to="overview" replace />,
          },
          {
            path: 'overview',
            element: (
              <LazyPage>
                <ComponentsOverviewPage />
              </LazyPage>
            ),
          },
          {
            path: 'text-field',
            element: (
              <LazyPage>
                <TextFieldPage />
              </LazyPage>
            ),
          },
          {
            path: 'checkbox',
            element: (
              <LazyPage>
                <CheckboxPage />
              </LazyPage>
            ),
          },
          {
            path: 'switch',
            element: (
              <LazyPage>
                <SwitchPage />
              </LazyPage>
            ),
          },
          {
            path: 'numeric-spinner',
            element: (
              <LazyPage>
                <NumericSpinnerPage />
              </LazyPage>
            ),
          },
          {
            path: 'segmented-buttons',
            element: (
              <LazyPage>
                <SegmentedButtonsPage />
              </LazyPage>
            ),
          },
          {
            path: 'slider',
            element: (
              <LazyPage>
                <SliderPage />
              </LazyPage>
            ),
          },
          {
            path: 'button',
            element: (
              <LazyPage>
                <ButtonPage />
              </LazyPage>
            ),
          },
          {
            path: 'icon-button',
            element: (
              <LazyPage>
                <IconButtonPage />
              </LazyPage>
            ),
          },
          {
            path: 'text',
            element: (
              <LazyPage>
                <TextPage />
              </LazyPage>
            ),
          },
          {
            path: 'badge',
            element: (
              <LazyPage>
                <BadgePage />
              </LazyPage>
            ),
          },
          {
            path: 'loader',
            element: (
              <LazyPage>
                <LoaderPage />
              </LazyPage>
            ),
          },
          {
            path: 'skeleton',
            element: (
              <LazyPage>
                <SkeletonPage />
              </LazyPage>
            ),
          },
          {
            path: 'snackbar',
            element: (
              <LazyPage>
                <SnackbarPage />
              </LazyPage>
            ),
          },
          {
            path: 'tooltip',
            element: (
              <LazyPage>
                <TooltipPage />
              </LazyPage>
            ),
          },
          {
            path: 'modal',
            element: (
              <LazyPage>
                <ModalPage />
              </LazyPage>
            ),
          },
          {
            path: 'bottom-sheet',
            element: (
              <LazyPage>
                <BottomSheetPage />
              </LazyPage>
            ),
          },
          {
            path: 'side-sheet',
            element: (
              <LazyPage>
                <SideSheetPage />
              </LazyPage>
            ),
          },
          {
            path: 'header-bar',
            element: (
              <LazyPage>
                <HeaderBarPage />
              </LazyPage>
            ),
          },
          {
            path: 'divider',
            element: (
              <LazyPage>
                <DividerPage />
              </LazyPage>
            ),
          },
          {
            path: 'border',
            element: (
              <LazyPage>
                <BorderPage />
              </LazyPage>
            ),
          },
          {
            path: 'list',
            element: (
              <LazyPage>
                <ListPage />
              </LazyPage>
            ),
          },
          {
            path: 'board-row',
            element: (
              <LazyPage>
                <BoardRowPage />
              </LazyPage>
            ),
          },
          {
            path: 'avatar',
            element: (
              <LazyPage>
                <AvatarPage />
              </LazyPage>
            ),
          },
          {
            path: 'popover',
            element: (
              <LazyPage>
                <PopoverPage />
              </LazyPage>
            ),
          },
          {
            path: 'chip',
            element: (
              <LazyPage>
                <ChipPage />
              </LazyPage>
            ),
          },
          {
            path: 'card',
            element: (
              <LazyPage>
                <CardPage />
              </LazyPage>
            ),
          },
        ],
      },
      {
        path: '*',
        element: <ErrorPage type="404" />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
