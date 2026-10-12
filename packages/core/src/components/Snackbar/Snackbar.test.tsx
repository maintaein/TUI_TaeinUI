/**
 * M3 T3 — 막대와 타이머가 GSAP 트윈 하나로 합쳐진 뒤의 스낵바 테스트.
 *
 * jsdom + 가짜 타이머 환경에서 GSAP 티커는 rAF로 도는데 그 틱이 안 온다
 * (실측 — 함정 2). `vi.advanceTimersByTime`으로 카운트다운 트윈을 흘려보낼
 * 수 없다는 뜻이라, 트윈을 직접 `progress()`/`time()`으로 seek해서 단언한다
 * — 실제 GSAP 인스턴스를 조작하는 것이므로 무모킹 규칙에 맞다.
 *
 * 트윈은 공개 API로 안 나간다. `Snackbar.tsx`가 막대 DOM 노드에
 * `__countdownTween`이라는 테스트 전용 통로를 얹어 두고, 여기서 그걸 읽는다
 * (Task 2의 `timelineRef`와 같은 모양 — `useOverlayTransition.ts` 참고).
 * 등장·퇴장 타임라인은 이 통로가 없다 — 그쪽은 손대지 않는 범위다(Task 2 소관).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Snackbar, type SnackbarProps } from './Snackbar';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

type CountdownTweenHost = HTMLDivElement & {
  __countdownTween?: gsap.core.Tween;
};

type StackTweenHost = HTMLElement & { __stackTween?: gsap.core.Tween };

const getSheet = (container: HTMLElement): HTMLElement =>
  container.querySelector('[class*="Snackbar_snackbar__"]') as HTMLElement;

const getBar = (container: HTMLElement): CountdownTweenHost | null =>
  container.querySelector(
    '[class*="Snackbar_bar__"]'
  ) as CountdownTweenHost | null;

/** 막대의 인라인 `transform: scaleX(n)`에서 n을 읽는다. */
const readScaleX = (bar: HTMLElement | null): number => {
  const match = bar?.style.transform.match(/scaleX\(([-\d.]+)\)/);
  return match ? Number(match[1]) : NaN;
};

/** jsdom은 matchMedia를 구현하지 않는다 — 축소 선호 경로를 열려면 깔아야 한다. */
const installReducedMotion = (): void => {
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches: true,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
};

describe('Snackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('렌더링 테스트', () => {
    it('open=true일 때 렌더링된다', () => {
      render(<Snackbar open message="테스트 메시지" />);
      expect(
        screen.getByText('테스트 메시지', { selector: 'span' })
      ).toBeInTheDocument();
    });

    it('open=false일 때 렌더링되지 않는다', () => {
      render(<Snackbar open={false} message="테스트 메시지" />);
      expect(screen.queryByText('테스트 메시지')).not.toBeInTheDocument();
    });

    it('message를 표시한다', () => {
      render(<Snackbar open message="알림 메시지" />);
      expect(
        screen.getByText('알림 메시지', { selector: 'span' })
      ).toBeInTheDocument();
    });
  });

  describe('severity prop 테스트', () => {
    it('success severity를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="성공" severity="success" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('success');
    });

    it('error severity를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="에러" severity="error" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('error');
    });

    it('warning severity를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="경고" severity="warning" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('warning');
    });

    it('info severity를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="정보" severity="info" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('info');
    });

    it('기본 severity는 info이다', () => {
      const { container } = render(<Snackbar open message="기본" />);
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('info');
    });
  });

  describe('position prop 테스트', () => {
    it('top-left 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="top-left" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('top-left');
    });

    it('top-center 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="top-center" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('top-center');
    });

    it('top-right 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="top-right" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('top-right');
    });

    it('bottom-left 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="bottom-left" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('bottom-left');
    });

    it('bottom-center 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="bottom-center" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('bottom-center');
    });

    it('bottom-right 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="bottom-right" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('bottom-right');
    });

    it('기본 위치는 bottom-center이다', () => {
      const { container } = render(<Snackbar open message="메시지" />);
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('bottom-center');
    });
  });

  describe('center 위치 가로 중앙 정렬 (함정 1)', () => {
    it('xPercent(-50)이 등장 시작값에 이미 반영돼 있다', () => {
      // fromTo의 xPercent는 from·to가 둘 다 -50이라 진행도(progress)와 무관하게
      // 항상 -50으로 계산된다 — 진행이 전혀 안 되는 이 테스트 환경(함정 2)에서
      // 확인해도, rest·퇴장 후의 값도 같은 상수라 함께 증명된다.
      const { container } = render(
        <Snackbar open message="메시지" position="top-center" />
      );
      expect(getSheet(container).style.transform).toContain('-50%');
    });

    it('bottom-center도 마찬가지다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="bottom-center" />
      );
      expect(getSheet(container).style.transform).toContain('-50%');
    });

    it('center가 아닌 위치는 xPercent를 안 쓴다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="top-left" />
      );
      expect(getSheet(container).style.transform).not.toContain('-50%');
    });
  });

  describe('카운트다운 트윈 테스트 (막대·타이머 단일 진실)', () => {
    it('트윈의 progress가 1이 되면 onClose가 호출된다', () => {
      // 가짜 타이머로는 GSAP을 못 돌린다(함정 2 실측) — 트윈을 progress(1)로
      // 직접 몰아 onComplete를 발화시킨다. 실제 GSAP 인스턴스를 seek하는
      // 것이라 무모킹 규칙에 맞다.
      const handleClose = vi.fn();
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={handleClose}
        />
      );

      expect(handleClose).not.toHaveBeenCalled();

      act(() => {
        getBar(container)?.__countdownTween?.progress(1);
      });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('autoHideDuration 기본값은 6000ms이다 — 트윈 duration이 6초다', () => {
      const { container } = render(
        <Snackbar open message="메시지" onClose={vi.fn()} />
      );
      expect(getBar(container)?.__countdownTween?.duration()).toBeCloseTo(6, 5);
    });

    it('autoHideDuration이 트윈 duration(초)으로 그대로 반영된다', () => {
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      expect(getBar(container)?.__countdownTween?.duration()).toBeCloseTo(3, 5);
    });

    it('autoHideDuration=null이면 막대(카운트다운 트윈)가 없다', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={null}
          onClose={handleClose}
        />
      );

      expect(getBar(container)).toBeNull();

      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('onClose가 없으면 막대를 만들지 않는다', () => {
      const { container } = render(<Snackbar open message="메시지" />);
      expect(getBar(container)).toBeNull();
    });

    it('open이 false로 바뀌면 다시 열렸을 때 카운트다운이 처음부터 다시 시작한다', () => {
      // autoHideDuration이 개폐 사이에 안 바뀌어도, open=false는 진행 중이던
      // 트윈을 죽인다(설계상 다시 열면 새 트윈 — 보고서 "도중에 바뀌면" 절 참고).
      // 옛 트윈이 죽었는지 progress() 재호출로 확인하는 대신(킬 이후 동작이
      // GSAP 내부 구현에 기댄다), 관측 가능한 사실 — 인스턴스가 바뀌고 새
      // 트윈이 0에서 시작한다 — 로 "누수 없이 정리됐다"를 증명한다.
      const handleClose = vi.fn();
      const { container, rerender } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={handleClose}
        />
      );
      const first = getBar(container)?.__countdownTween;

      rerender(
        <Snackbar
          open={false}
          message="메시지"
          autoHideDuration={3000}
          onClose={handleClose}
        />
      );
      rerender(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={handleClose}
        />
      );

      const second = getBar(container)?.__countdownTween;
      expect(second).not.toBe(first);
      expect(second?.progress()).toBe(0);
    });
  });

  describe('수정 라운드 1 회귀 테스트 (C1·C2)', () => {
    it('onClose 아이덴티티가 리렌더마다 바뀌어도 트윈이 재생성되지 않고 progress가 유지된다 (C1)', () => {
      // 부모가 인라인 onClose(예: () => setOpen(false))를 넘기는 흔한 패턴 —
      // 이 프로젝트의 SnackbarPage 데모가 실제로 이렇게 쓴다. onClose가
      // deps에 raw로 남아 있으면 매 리렌더마다 effect가 재실행돼 막대와
      // 시계가 처음으로 되돌아간다.
      const { container, rerender } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={() => {}}
        />
      );
      const tween = getBar(container)?.__countdownTween;

      act(() => {
        tween?.progress(0.5);
      });

      // 매번 새 함수 아이덴티티
      rerender(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={() => {}}
        />
      );
      rerender(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={() => {}}
        />
      );

      expect(getBar(container)?.__countdownTween).toBe(tween);
      expect(tween?.progress()).toBeCloseTo(0.5, 5);
    });

    it('호버로 정지한 상태에서 effect가 재실행돼도(autoHideDuration 변경) 새 트윈이 정지 상태로 시작한다 (C2)', async () => {
      const user = userEvent.setup({ delay: null });
      const { container, rerender } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const sheet = getSheet(container);
      const firstTween = getBar(container)?.__countdownTween;

      await user.hover(sheet);
      expect(firstTween?.paused()).toBe(true);

      // autoHideDuration 변경 — effect가 재실행돼 트윈이 새로 만들어지는
      // 유일하게 남은 경로(C1 수정 후).
      rerender(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={4000}
          onClose={vi.fn()}
        />
      );

      const secondTween = getBar(container)?.__countdownTween;
      expect(secondTween).not.toBe(firstTween);
      expect(secondTween?.paused()).toBe(true);
    });
  });

  describe('막대 시각 테스트', () => {
    it('막대가 scaleX로만 움직인다 — width는 안 바뀐다', () => {
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const bar = getBar(container);

      act(() => {
        bar?.__countdownTween?.progress(0.5);
      });

      expect(readScaleX(bar)).toBeCloseTo(0.5, 5);
      expect(bar?.style.width).toBe('');
    });

    it('severity 4종 모두에서 막대가 렌더링된다', () => {
      for (const severity of ['success', 'error', 'warning', 'info'] as const) {
        const { container, unmount } = render(
          <Snackbar
            open
            message="메시지"
            severity={severity}
            autoHideDuration={3000}
            onClose={vi.fn()}
          />
        );
        expect(getBar(container)).not.toBeNull();
        unmount();
      }
    });

    it('위치 6종 전부에서 막대가 스낵바 내부에 있다', () => {
      const positions = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ] as const;
      for (const position of positions) {
        const { container, unmount } = render(
          <Snackbar
            open
            message="메시지"
            position={position}
            autoHideDuration={3000}
            onClose={vi.fn()}
          />
        );
        expect(getSheet(container)).toContainElement(getBar(container));
        unmount();
      }
    });

    it('막대는 접근성 트리에서 숨겨진다', () => {
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      expect(getBar(container)).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('호버·포커스 일시정지 테스트 (2.2.1 — 완료 조건 3·4·5)', () => {
    it('호버하면 카운트다운 트윈이 선다', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const tween = getBar(container)?.__countdownTween;

      await user.hover(getSheet(container));

      expect(tween?.paused()).toBe(true);
    });

    it('호버를 떼면 재개된다', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const sheet = getSheet(container);
      const tween = getBar(container)?.__countdownTween;

      await user.hover(sheet);
      await user.unhover(sheet);

      expect(tween?.paused()).toBe(false);
    });

    it('호버를 떼면 멈춘 자리에서 이어진다 — 처음부터 다시가 아니다', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const sheet = getSheet(container);
      const tween = getBar(container)?.__countdownTween;

      act(() => {
        tween?.progress(0.4);
      });

      await user.hover(sheet);
      expect(tween?.progress()).toBeCloseTo(0.4, 5);

      await user.unhover(sheet);
      expect(tween?.progress()).toBeCloseTo(0.4, 5);
    });

    it('action에 포커스가 있는 동안에도 선다 (키보드 경로)', () => {
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
          action={<button>실행 취소</button>}
        />
      );
      const tween = getBar(container)?.__countdownTween;
      const actionButton = screen.getByText('실행 취소');

      act(() => {
        actionButton.focus();
      });
      expect(tween?.paused()).toBe(true);

      act(() => {
        actionButton.blur();
      });
      expect(tween?.paused()).toBe(false);
    });

    it('마우스와 포커스가 동시에 있으면 하나만 빠져도 재개하지 않는다', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
          action={<button>실행 취소</button>}
        />
      );
      const sheet = getSheet(container);
      const actionButton = screen.getByText('실행 취소');
      const tween = getBar(container)?.__countdownTween;

      await user.hover(sheet);
      act(() => {
        actionButton.focus();
      });
      expect(tween?.paused()).toBe(true);

      await user.unhover(sheet);
      expect(tween?.paused()).toBe(true);

      act(() => {
        actionButton.blur();
      });
      expect(tween?.paused()).toBe(false);
    });
  });

  describe('축소 모드 테스트 (Ruling 14)', () => {
    it('축소 모드에서도 카운트다운 duration이 그대로다 — 즉시 닫히지 않는다', () => {
      installReducedMotion();
      const handleClose = vi.fn();
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={handleClose}
        />
      );

      expect(getBar(container)?.__countdownTween?.duration()).toBeCloseTo(3, 5);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('축소 모드에서는 막대 값이 스텝 단위로 끊긴다 — 연속으로 안 흐른다', () => {
      installReducedMotion();
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const bar = getBar(container);

      // remaining = 1 - 0.53 = 0.47 → 8단 중 ceil(0.47*8)/8 = 4/8 = 0.5
      act(() => {
        bar?.__countdownTween?.progress(0.53);
      });

      expect(readScaleX(bar)).toBeCloseTo(0.5, 5);
    });

    it('일반 모드에서는 같은 progress에서 막대 값이 연속(비-스텝)이다', () => {
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const bar = getBar(container);

      act(() => {
        bar?.__countdownTween?.progress(0.53);
      });

      expect(readScaleX(bar)).toBeCloseTo(0.47, 5);
    });

    it('축소 모드 막대는 progress 0에서 정확히 scaleX(1)이다 (Minor 2 — 끝값 고정)', () => {
      // Math.ceil(1 * 8) / 8 = 1 — 부동소수 오차 없이 정확히 1이어야 한다.
      // 0.3으로 먼저 옮겼다가 0으로 되돌려 실제 렌더(onUpdate)가 일어나게 한다.
      installReducedMotion();
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const bar = getBar(container);

      act(() => {
        bar?.__countdownTween?.progress(0.3);
        bar?.__countdownTween?.progress(0);
      });

      expect(readScaleX(bar)).toBe(1);
    });

    it('축소 모드 막대는 progress 1에서 정확히 scaleX(0)이다 (Minor 2 — 끝값 고정)', () => {
      // Math.ceil(0 * 8) / 8 = 0 — 부동소수 오차 없이 정확히 0이어야 한다.
      installReducedMotion();
      const { container } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );
      const bar = getBar(container);

      act(() => {
        bar?.__countdownTween?.progress(1);
      });

      expect(readScaleX(bar)).toBe(0);
    });
  });

  describe('닫기 버튼 테스트', () => {
    it('닫기 버튼이 렌더링된다', () => {
      render(<Snackbar open message="메시지" />);
      const closeButton = screen.getByLabelText('닫기');
      expect(closeButton).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
      const user = userEvent.setup({ delay: null });
      const handleClose = vi.fn();
      render(<Snackbar open message="메시지" onClose={handleClose} />);

      const closeButton = screen.getByLabelText('닫기');
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    describe('호버·눌림 면 (생성 CSS, CSSOM)', () => {
      // IconButton `weak dark`의 호버(gray[300])·눌림(gray[400]) 면은 밝은 회색이라
      // 색 면 위 흰 X가 1.3:1로 사라진다. closeButton이 글자색을 옅게 섞은 반투명으로
      // 덮되, IconButton의 같은 상태 규칙보다 특이도가 높아야 이긴다.
      type Flat = { rule: CSSStyleRule; media: string | null };

      const allRules = (): Flat[] => {
        const out: Flat[] = [];
        const walk = (rules: CSSRuleList, media: string | null) => {
          for (const rule of Array.from(rules)) {
            if (rule instanceof CSSMediaRule) {
              walk(rule.cssRules, rule.conditionText);
            } else if (rule instanceof CSSStyleRule) {
              out.push({ rule, media });
            }
          }
        };
        for (const sheet of Array.from(document.styleSheets)) {
          walk(sheet.cssRules, null);
        }
        return out;
      };

      /** 선택자 특이도(id는 안 쓴다). `:not()`은 안쪽 선택자만 센다. */
      const specificity = (selector: string): number =>
        (
          selector
            .replace(/::[\w-]+/g, '')
            .match(/\.[\w-]+|\[[^\]]+\]|:(?!not\b)[\w-]+/g) ?? []
        ).length;

      const hasBackground = ({ rule }: Flat): boolean =>
        rule.style.getPropertyValue('background') !== '' ||
        rule.style.getPropertyValue('background-color') !== '';

      const backgroundOf = ({ rule }: Flat): string =>
        rule.style.getPropertyValue('background-color') ||
        rule.style.getPropertyValue('background');

      const stateRules = (owner: string, state: ':hover' | '[data-pressed]') =>
        allRules().filter(
          (flat) =>
            flat.rule.selectorText.includes(owner) &&
            // 호버 선택자도 `:not([data-pressed])`를 품으니 눌림은 호버가 없는 쪽만 센다
            (state === ':hover'
              ? flat.rule.selectorText.includes(':hover')
              : flat.rule.selectorText.includes('[data-pressed]') &&
                !flat.rule.selectorText.includes(':hover')) &&
            hasBackground(flat)
        );

      it('호버 면은 글자색 16%, 눌림 면은 24%를 섞은 반투명이다', () => {
        render(<Snackbar open message="메시지" />);

        const hover = stateRules('Snackbar_closeButton', ':hover');
        expect(hover).toHaveLength(1);
        expect(backgroundOf(hover[0])).toBe(
          'color-mix(in srgb, currentColor 16%, transparent)'
        );
        // IconButton과 같은 게이트 안에서만 건다(터치에서 호버 면이 들러붙지 않게)
        expect(hover[0].media).toBe('(hover: hover) and (pointer: fine)');

        const pressed = stateRules('Snackbar_closeButton', '[data-pressed]');
        expect(pressed).toHaveLength(1);
        expect(backgroundOf(pressed[0])).toBe(
          'color-mix(in srgb, currentColor 24%, transparent)'
        );
      });

      it.each([':hover', '[data-pressed]'] as const)(
        '%s 규칙이 IconButton의 같은 상태 규칙보다 특이도가 높다',
        (state) => {
          render(<Snackbar open message="메시지" />);

          const mine = stateRules('Snackbar_closeButton', state);
          const theirs = stateRules('IconButton_', state).filter(
            (flat) => !flat.rule.selectorText.includes('Snackbar_closeButton')
          );
          expect(mine).toHaveLength(1);
          expect(theirs.length).toBeGreaterThan(0);
          for (const flat of theirs) {
            expect(
              specificity(mine[0].rule.selectorText),
              `${mine[0].rule.selectorText} 대 ${flat.rule.selectorText}`
            ).toBeGreaterThan(specificity(flat.rule.selectorText));
          }
        }
      );
    });
  });

  describe('action prop 테스트', () => {
    it('action 버튼을 렌더링한다', () => {
      const action = <button>실행 취소</button>;
      render(<Snackbar open message="메시지" action={action} />);
      expect(screen.getByText('실행 취소')).toBeInTheDocument();
    });

    it('action 버튼 클릭이 동작한다', async () => {
      const user = userEvent.setup({ delay: null });
      const handleAction = vi.fn();
      const action = <button onClick={handleAction}>실행 취소</button>;
      render(<Snackbar open message="메시지" action={action} />);

      const actionButton = screen.getByText('실행 취소');
      await user.click(actionButton);

      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성 테스트', () => {
    it('시각 상자는 role과 aria-live를 갖지 않는다', () => {
      const { container } = render(<Snackbar open message="메시지" />);
      const snackbar = container.querySelector(
        '[class*="Snackbar_snackbar__"]'
      ) as HTMLElement;
      expect(snackbar).not.toHaveAttribute('role');
      expect(snackbar).not.toHaveAttribute('aria-live');
    });

    it('role="status" 리전이 시각 상자와 별도로 존재한다', () => {
      const { container } = render(<Snackbar open message="메시지" />);
      const snackbar = container.querySelector(
        '[class*="Snackbar_snackbar__"]'
      ) as HTMLElement;
      const region = screen.getByRole('status');
      expect(region).toBeInTheDocument();
      expect(region).not.toBe(snackbar);
    });

    it('닫기 버튼에 aria-label이 있다', () => {
      render(<Snackbar open message="메시지" />);
      const closeButton = screen.getByLabelText('닫기');
      expect(closeButton).toHaveAttribute('aria-label', '닫기');
    });
  });

  describe('라이브 리전 테스트', () => {
    it('open=false여도 role="status" 리전이 DOM에 존재하고 비어 있다', () => {
      render(<Snackbar open={false} message="테스트 메시지" />);
      const region = screen.getByRole('status');
      expect(region).toBeInTheDocument();
      expect(region).toBeEmptyDOMElement();
    });

    it('처음부터 open된 채 마운트해도 리전에 메시지가 채워진다', () => {
      render(<Snackbar open message="처음부터 열림" />);
      const region = screen.getByRole('status');
      expect(region).toHaveTextContent('처음부터 열림');
    });

    it('리전이 severity를 접두사로 함께 읽어 준다', () => {
      // 아이콘은 aria-hidden이라 스크린 리더는 메시지 텍스트만 듣는다.
      // 화면에서 빨간 상자 + 경고 아이콘인 것이 소리로는 그냥 문장이 된다.
      render(<Snackbar open message="저장에 실패했습니다" severity="error" />);
      expect(screen.getByRole('status')).toHaveTextContent(
        '오류: 저장에 실패했습니다'
      );
    });

    it('severity마다 접두사가 다르다', () => {
      const labels = {
        success: '성공',
        error: '오류',
        warning: '경고',
        info: '알림',
      } as const;
      for (const [severity, label] of Object.entries(labels)) {
        const { unmount } = render(
          <Snackbar
            open
            message="메시지"
            severity={severity as keyof typeof labels}
          />
        );
        expect(screen.getByRole('status')).toHaveTextContent(
          `${label}: 메시지`
        );
        unmount();
      }
    });

    it('open이 false가 되면 리전이 비워진다', () => {
      const { rerender } = render(<Snackbar open message="닫히는 메시지" />);
      const region = screen.getByRole('status');
      expect(region).toHaveTextContent('닫히는 메시지');

      rerender(<Snackbar open={false} message="닫히는 메시지" />);
      expect(region).toBeEmptyDOMElement();
    });
  });

  describe('severity 아이콘 테스트', () => {
    it('success severity는 check-circle 아이콘을 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="성공" severity="success" />
      );
      expect(
        container.querySelector('[data-icon="check-circle"]')
      ).toBeInTheDocument();
    });

    it('error severity는 alert-circle 아이콘을 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="에러" severity="error" />
      );
      expect(
        container.querySelector('[data-icon="alert-circle"]')
      ).toBeInTheDocument();
    });

    it('warning severity는 alert-triangle 아이콘을 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="경고" severity="warning" />
      );
      expect(
        container.querySelector('[data-icon="alert-triangle"]')
      ).toBeInTheDocument();
    });

    it('info severity는 info 아이콘을 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="정보" severity="info" />
      );
      expect(container.querySelector('[data-icon="info"]')).toBeInTheDocument();
    });

    it('severity 아이콘은 접근성 트리에서 숨겨진다', () => {
      const { container } = render(
        <Snackbar open message="메시지" severity="success" />
      );
      const icon = container.querySelector('[data-icon="check-circle"]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className을 적용한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" className="custom-snackbar" />
      );
      const snackbar =
        container.querySelector('[class*="content"]')?.parentElement;
      expect(snackbar).toHaveClass('custom-snackbar');
    });
  });

  describe('다중 Snackbar 시나리오', () => {
    it('여러 Snackbar를 동시에 렌더링할 수 있다', () => {
      const { container } = render(
        <>
          <Snackbar open message="첫 번째" position="top-center" />
          <Snackbar open message="두 번째" position="bottom-center" />
        </>
      );
      expect(
        screen.getByText('첫 번째', { selector: 'span' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('두 번째', { selector: 'span' })
      ).toBeInTheDocument();
      const snackbars = container.querySelectorAll('[class*="content"]');
      expect(snackbars).toHaveLength(2);
    });
  });

  describe('언마운트 지연 테스트', () => {
    it('open이 false가 돼도 즉시 DOM에서 제거되지 않는다', () => {
      const { container, rerender } = render(
        <Snackbar open message="메시지" />
      );
      rerender(<Snackbar open={false} message="메시지" />);

      expect(container.querySelector('[class*="content"]')).toBeInTheDocument();
    });

    it('퇴장 타이머가 끝나면 DOM에서 제거된다', () => {
      // 예전엔 고정 EXIT_DURATION_MS(200ms)를 기다렸다. 지금은 Task 2의 훅이
      // 퇴장 길이를 "등장 타임라인이 실제로 진행된 시간의 65%"로 계산한다
      // (`useOverlayTransition.ts`). 이 테스트 환경은 GSAP 티커가 안 돌아
      // 등장 타임라인이 progress 0에 머물러 있으므로(함정 2), 퇴장 길이도
      // 0에 가깝다 — 충분히 큰 값으로 흘려보내 만료를 확인한다.
      const { container, rerender } = render(
        <Snackbar open message="메시지" />
      );
      rerender(<Snackbar open={false} message="메시지" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(container.querySelector('[class*="content"]')).toBeNull();
    });

    it('닫히는 도중 다시 열리면 언마운트가 취소된다', () => {
      const { container, rerender } = render(
        <Snackbar open message="메시지" />
      );
      rerender(<Snackbar open={false} message="메시지" />);
      rerender(<Snackbar open message="메시지" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(container.querySelector('[class*="content"]')).toBeInTheDocument();
    });

    it('컴포넌트가 unmount되면 대기 중인 타이머가 정리된다', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const { rerender, unmount } = render(<Snackbar open message="메시지" />);
      rerender(<Snackbar open={false} message="메시지" />);

      unmount();
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('카운트다운이 있는 스낵바가 unmount돼도 에러 없이 정리된다', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const { unmount } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={vi.fn()}
        />
      );

      unmount();

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('퇴장 중(open=false)엔 스낵바가 inert해 포커스·클릭이 들어가지 않는다', () => {
      const { container, rerender } = render(
        <Snackbar open message="메시지" />
      );
      expect(
        container.querySelector('[class*="content"]')?.parentElement
      ).not.toHaveAttribute('inert');

      rerender(<Snackbar open={false} message="메시지" />);

      expect(
        container.querySelector('[class*="content"]')?.parentElement
      ).toHaveAttribute('inert');
    });
  });

  // 같은 위치에 열린 스낵바가 줄을 선다 (M5 task-21).
  //
  // jsdom은 레이아웃이 없어 offsetHeight가 늘 0이다(환경 보급, Modal·BottomSheet 선례).
  // 높이는 스낵바에 단 `data-h`에서 읽어 주는 getter를 프로토타입에 깐다. 밀림은 시트에
  // 얹힌 테스트 전용 통로 `__stackTween`(= `__countdownTween`과 같은 방식)으로 읽는다.
  describe('같은 위치에 쌓기 (M5 task-21)', () => {
    let heightReads = 0;
    let restoreHeights: (() => void) | null = null;

    beforeEach(() => {
      heightReads = 0;
      const original = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetHeight'
      );
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get(this: HTMLElement) {
          heightReads += 1;
          return Number(this.dataset.h ?? 0);
        },
      });
      restoreHeights = () => {
        if (original) {
          Object.defineProperty(
            HTMLElement.prototype,
            'offsetHeight',
            original
          );
        }
      };
    });

    afterEach(() => {
      restoreHeights?.();
      restoreHeights = null;
    });

    interface Item {
      id: string;
      h: number;
      open?: boolean;
      position?: SnackbarProps['position'];
      onClose?: () => void;
    }

    const Stack = ({ items }: { items: Item[] }) => (
      <>
        {items.map(({ id, h, open = true, position, onClose }) => (
          <Snackbar
            key={id}
            open={open}
            message={id}
            position={position}
            onClose={onClose}
            autoHideDuration={null}
            {...{ 'data-h': h }}
          />
        ))}
      </>
    );

    const sheetOf = (container: HTMLElement, id: string): StackTweenHost => {
      const found = [
        ...container.querySelectorAll<StackTweenHost>(
          '[class*="Snackbar_snackbar__"]'
        ),
      ].find(
        (el) =>
          el.querySelector('[class*="Snackbar_message__"]')?.textContent === id
      );
      if (!found) throw new Error(`시트를 찾지 못했다: ${id}`);
      return found;
    };

    /** 시트의 마지막 밀림 트윈이 향하는 y(px) */
    const targetY = (container: HTMLElement, id: string): number =>
      Number(sheetOf(container, id).__stackTween?.vars.y);

    const A = { id: 'A', h: 40 };
    const B = { id: 'B', h: 56 };
    const C = { id: 'C', h: 72 };
    const D = { id: 'D', h: 40 };

    it('bottom: 새것이 가장자리(0)이고 먼저 있던 것은 위로 밀린다 (높이 합 + 간격 8)', () => {
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, B]} />);
      rerender(<Stack items={[A, B, C]} />);

      expect(targetY(container, 'C')).toBe(0);
      expect(targetY(container, 'B')).toBe(-(72 + 8));
      expect(targetY(container, 'A')).toBe(-(72 + 56 + 16));
    });

    it('top: 부호가 반대다 (새것이 맨 위, 먼저 있던 것은 아래로)', () => {
      const top = (item: Item): Item => ({ ...item, position: 'top-right' });
      const { container, rerender } = render(<Stack items={[top(A)]} />);
      rerender(<Stack items={[top(A), top(B)]} />);
      rerender(<Stack items={[top(A), top(B), top(C)]} />);

      expect(targetY(container, 'C')).toBe(0);
      expect(targetY(container, 'B')).toBe(72 + 8);
      expect(targetY(container, 'A')).toBe(72 + 56 + 16);
    });

    it('밀림은 gsapDuration.base, settle 커브의 트윈이다', () => {
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, B]} />);

      const tween = sheetOf(container, 'A').__stackTween as gsap.core.Tween;
      expect(tween.vars.duration).toBe(gsapDuration.base);
      expect(tween.vars.ease).toBe(gsapEasing.settle);
    });

    it('center의 가로 xPercent -50은 밀림과 함께 유지된다', () => {
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, B]} />);

      expect(sheetOf(container, 'A').style.transform).toContain(
        'translate(-50%'
      );
    });

    it('넷째가 열리면 가장 오래된 것의 onClose가 한 번 불린다', () => {
      const onCloseA = vi.fn();
      const onCloseB = vi.fn();
      const a = { ...A, onClose: onCloseA };
      const b = { ...B, onClose: onCloseB };
      const c = { ...C, onClose: vi.fn() };
      const d = { ...D, onClose: vi.fn() };
      const { rerender } = render(<Stack items={[a]} />);
      rerender(<Stack items={[a, b]} />);
      rerender(<Stack items={[a, b, c]} />);
      expect(onCloseA).not.toHaveBeenCalled();

      rerender(<Stack items={[a, b, c, d]} />);

      expect(onCloseA).toHaveBeenCalledTimes(1);
      expect(onCloseB).not.toHaveBeenCalled();
    });

    it('부모가 그 onClose로 닫으면 나머지가 메워 들어온다', () => {
      const a = { ...A, onClose: vi.fn() };
      const d = { ...D, onClose: vi.fn() };
      const { container, rerender } = render(<Stack items={[a]} />);
      rerender(<Stack items={[a, B]} />);
      rerender(<Stack items={[a, B, C]} />);
      rerender(<Stack items={[a, B, C, d]} />);
      rerender(<Stack items={[{ ...a, open: false }, B, C, d]} />);

      expect(targetY(container, 'D')).toBe(0);
      expect(targetY(container, 'C')).toBe(-(40 + 8));
      expect(targetY(container, 'B')).toBe(-(40 + 72 + 16));
    });

    it('하나를 닫으면 그보다 오래된 것이 메워 들어오고, 닫는 것은 제자리에서 나간다', () => {
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, B]} />);
      rerender(<Stack items={[A, B, C]} />);
      const closingTween = sheetOf(container, 'B').__stackTween;
      const aTween = sheetOf(container, 'A').__stackTween;

      rerender(<Stack items={[A, { ...B, open: false }, C]} />);

      expect(targetY(container, 'A')).toBe(-(72 + 8));
      expect(sheetOf(container, 'A').__stackTween).not.toBe(aTween);
      // 닫히기 시작한 B는 새 밀림 트윈을 받지 않는다. 지금 자리에서 퇴장 트윈으로 나간다.
      expect(sheetOf(container, 'B').__stackTween).toBe(closingTween);
      expect(closingTween?.parent).toBeNull();
    });

    /** 시트의 등장·퇴장 타임라인이 가진 트윈 중 해당 속성을 만지는 것이 있는가 */
    const touches = (
      container: HTMLElement,
      id: string,
      prop: 'yPercent' | 'opacity'
    ): boolean =>
      (sheetOf(container, id).__enterTimeline as gsap.core.Timeline)
        .getChildren(false, true, false)
        .some((child) => prop in child.vars);

    it('넷째가 열려 안쪽에서 밀려나는 첫째는 이동 없이 흐려지기만 한다', () => {
      const a = { ...A, onClose: vi.fn() };
      const { container, rerender } = render(<Stack items={[a]} />);
      rerender(<Stack items={[a, B]} />);
      rerender(<Stack items={[a, B, C]} />);
      rerender(<Stack items={[a, B, C, D]} />);
      rerender(<Stack items={[{ ...a, open: false }, B, C, D]} />);

      expect(touches(container, 'A', 'yPercent')).toBe(false);
      expect(touches(container, 'A', 'opacity')).toBe(true);
    });

    it('가운데 것을 닫아도 이동 없이 흐려지기만 한다', () => {
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, B]} />);
      rerender(<Stack items={[A, B, C]} />);
      rerender(<Stack items={[A, { ...B, open: false }, C]} />);

      expect(touches(container, 'B', 'yPercent')).toBe(false);
      expect(touches(container, 'B', 'opacity')).toBe(true);
    });

    it('가장자리(가장 새것)를 닫으면 지금처럼 가장자리 쪽으로 미끄러져 나간다', () => {
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, B]} />);
      rerender(<Stack items={[A, B, C]} />);
      rerender(<Stack items={[A, B, { ...C, open: false }]} />);

      expect(touches(container, 'C', 'yPercent')).toBe(true);
      expect(touches(container, 'C', 'opacity')).toBe(true);
    });

    it('혼자 열려 있던 것은 가장자리 것이라 미끄러져 나간다', () => {
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[{ ...A, open: false }]} />);

      expect(touches(container, 'A', 'yPercent')).toBe(true);
    });

    it('다른 위치의 스낵바는 서로 밀지도 넘치게 하지도 않는다', () => {
      const onCloseX = vi.fn();
      const x = {
        id: 'X',
        h: 40,
        position: 'top-left' as const,
        onClose: onCloseX,
      };
      const { container, rerender } = render(<Stack items={[x]} />);
      rerender(<Stack items={[x, A]} />);
      rerender(<Stack items={[x, A, B]} />);
      rerender(<Stack items={[x, A, B, C]} />);

      expect(targetY(container, 'X')).toBe(0);
      expect(onCloseX).not.toHaveBeenCalled();
      expect(targetY(container, 'C')).toBe(0);
    });

    it('축소 선호면 밀림이 즉시 끝난다', () => {
      installReducedMotion();
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, B]} />);

      const tween = sheetOf(container, 'A').__stackTween as gsap.core.Tween;
      expect(tween.progress()).toBe(1);
      expect(sheetOf(container, 'A').style.transform).toContain(
        `${-(56 + 8)}px`
      );
    });

    it('축소 선호가 아니면 밀림은 아직 끝나지 않았다', () => {
      const { container, rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, B]} />);

      const tween = sheetOf(container, 'A').__stackTween as gsap.core.Tween;
      expect(tween.progress()).toBeLessThan(1);
    });

    it('onClose가 없는 가장 오래된 것은 내보내지 못하고, 다른 것이 대신 닫히지도 않는다', () => {
      const onCloseB = vi.fn();
      const b = { ...B, onClose: onCloseB };
      const c = { ...C, onClose: vi.fn() };
      const d = { ...D, onClose: vi.fn() };
      const { rerender } = render(<Stack items={[A]} />);
      rerender(<Stack items={[A, b]} />);
      rerender(<Stack items={[A, b, c]} />);
      rerender(<Stack items={[A, b, c, d]} />);

      expect(onCloseB).not.toHaveBeenCalled();
    });

    it('언마운트하면 줄에서 빠져 다음 마운트로 새지 않는다', () => {
      const first = render(<Stack items={[A, B, C]} />);
      first.unmount();

      const onClose = vi.fn();
      const x = { id: 'X', h: 40, onClose };
      const y = { id: 'Y', h: 40, onClose };
      const z = { id: 'Z', h: 40, onClose };
      const second = render(<Stack items={[x, y, z]} />);

      expect(onClose).not.toHaveBeenCalled();
      expect(targetY(second.container, 'Z')).toBe(0);
    });

    it('open=false인 스낵바는 줄에 서지 않아 높이를 차지하지 않는다', () => {
      const { container, rerender } = render(
        <Stack items={[{ ...A, open: false }]} />
      );
      rerender(<Stack items={[{ ...A, open: false }, B, C]} />);

      expect(targetY(container, 'B')).toBe(-(72 + 8));
    });

    describe('높이는 등록과 크기 변화 때만 잰다', () => {
      class RecordingResizeObserver {
        static created: RecordingResizeObserver[] = [];
        disconnected = false;
        constructor(private readonly callback: ResizeObserverCallback) {
          RecordingResizeObserver.created.push(this);
        }
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {
          this.disconnected = true;
        }
        fire(): void {
          this.callback([], this as unknown as ResizeObserver);
        }
      }

      beforeEach(() => {
        RecordingResizeObserver.created = [];
        vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
      });

      it('크기가 바뀌었다고 알리면 그 위에 쌓인 것의 밀림이 새 높이를 따른다', () => {
        const { container, rerender } = render(<Stack items={[A]} />);
        rerender(<Stack items={[A, B]} />);
        expect(targetY(container, 'A')).toBe(-(56 + 8));

        rerender(<Stack items={[A, { ...B, h: 100 }]} />);
        // 다시 그리기만으로는 재지 않는다. 관찰자가 알려야 한다.
        expect(targetY(container, 'A')).toBe(-(56 + 8));

        act(() => RecordingResizeObserver.created[1].fire());
        expect(targetY(container, 'A')).toBe(-(100 + 8));
      });

      it('다시 그려도 높이를 읽지 않는다', () => {
        const { rerender } = render(<Stack items={[A]} />);
        rerender(<Stack items={[A, B]} />);
        const before = heightReads;

        rerender(<Stack items={[A, B]} />);
        rerender(<Stack items={[A, B]} />);

        expect(heightReads).toBe(before);
      });

      it('닫히거나 언마운트되면 관찰을 끊는다', () => {
        const { rerender, unmount } = render(<Stack items={[A, B]} />);
        rerender(<Stack items={[A, { ...B, open: false }]} />);
        expect(RecordingResizeObserver.created[1].disconnected).toBe(true);
        expect(RecordingResizeObserver.created[0].disconnected).toBe(false);
        unmount();
        expect(RecordingResizeObserver.created[0].disconnected).toBe(true);
      });
    });
  });
});
