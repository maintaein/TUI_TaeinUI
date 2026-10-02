import { glyphBase } from './glyph.css';

export type GlyphName =
  | 'close'
  | 'plus'
  | 'minus'
  | 'chevron-down'
  | 'check-circle'
  | 'alert-circle'
  | 'alert-triangle'
  | 'info';

export interface GlyphProps {
  name: GlyphName;
  /** sm=16px, md=20px, lg=24px, xl=32px @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 있으면 role="img"와 레이블, 없으면 장식용(aria-hidden) */
  'aria-label'?: string;
}

const SIZE_MAP = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const GLYPH_PATHS: Record<GlyphName, string> = {
  close: 'M18 6L6 18M6 6l12 12',
  plus: 'M12 5v14m-7-7h14',
  minus: 'M5 12h14',
  'chevron-down': 'M6 9l6 6 6-6',
  'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  'alert-circle': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 8v4M12 16h.01',
  'alert-triangle':
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 16v-4M12 8h.01',
};

/** core 내부 전용 정적 글리프. 공개 표면이 아니다. */
export const Glyph = ({
  name,
  size = 'md',
  'aria-label': ariaLabel,
}: GlyphProps) => {
  const px = SIZE_MAP[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={glyphBase}
      data-icon={name}
      {...(ariaLabel
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': 'true' as const })}
    >
      <path
        d={GLYPH_PATHS[name]}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};
