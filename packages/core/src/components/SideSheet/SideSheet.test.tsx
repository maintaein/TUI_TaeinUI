import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SideSheet } from './SideSheet';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

const SHEET_PACE = 1.3;

describe('SideSheet', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    children: 'SideSheet content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('렌더링 테스트', () => {
    it('open이 true일 때 SideSheet가 렌더링된다', () => {
      render(<SideSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('SideSheet content')).toBeInTheDocument();
    });

    it('open이 false일 때 SideSheet가 렌더링되지 않는다', () => {
      render(<SideSheet {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('children이 올바르게 렌더링된다', () => {
      render(
        <SideSheet {...defaultProps}>
          <div>Custom content</div>
        </SideSheet>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('title이 있을 때 렌더링된다', () => {
      render(<SideSheet {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('title이 없을 때 렌더링되지 않는다', () => {
      render(<SideSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.querySelector('h2')).not.toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('role="dialog"를 가진다', () => {
      render(<SideSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal="true"를 가진다', () => {
      render(<SideSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('aria-modal', 'true');
    });

    it('title이 있을 때 aria-labelledby가 설정된다', () => {
      render(<SideSheet {...defaultProps} title="Test Title" />);
      const sheet = screen.getByRole('dialog');
      const labelledby = sheet.getAttribute('aria-labelledby');
      expect(labelledby).toBeTruthy();

      const title = document.getElementById(labelledby!);
      expect(title).toHaveTextContent('Test Title');
    });

    it('title을 dialog의 accessible name으로 사용한다', () => {
      render(<SideSheet {...defaultProps} title="Test Title" />);
      expect(
        screen.getByRole('dialog', { name: 'Test Title' })
      ).toBeInTheDocument();
    });

    it('aria-label이 있을 때 설정된다', () => {
      render(<SideSheet {...defaultProps} aria-label="Custom Label" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('aria-label', 'Custom Label');
    });
  });

  describe('Backdrop 클릭 테스트', () => {
    it('closeOnBackdropClick이 true일 때 backdrop 클릭 시 onClose가 호출된다', async () => {
      render(<SideSheet {...defaultProps} closeOnBackdropClick />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closeOnBackdropClick이 false일 때 backdrop 클릭 시 onClose가 호출되지 않는다', () => {
      render(<SideSheet {...defaultProps} closeOnBackdropClick={false} />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('시트 영역 클릭 시 onClose가 호출되지 않는다', () => {
      render(<SideSheet {...defaultProps} closeOnBackdropClick />);
      const sheet = screen.getByRole('dialog');
      fireEvent.click(sheet);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('ESC 키 테스트', () => {
    it('closeOnEscape이 true일 때 ESC 키로 닫힌다', async () => {
      render(<SideSheet {...defaultProps} closeOnEscape />);
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closeOnEscape이 false일 때 ESC 키로 닫히지 않는다', () => {
      render(<SideSheet {...defaultProps} closeOnEscape={false} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('너비 테스트', () => {
    it('기본 너비(md)가 적용된다', () => {
      render(<SideSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toBeInTheDocument();
    });

    it('width="sm" 일 때 작은 너비가 적용된다', () => {
      render(<SideSheet {...defaultProps} width="sm" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('sm');
    });

    it('width="md" 일 때 중간 너비가 적용된다', () => {
      render(<SideSheet {...defaultProps} width="md" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('md');
    });

    it('width="lg" 일 때 큰 너비가 적용된다', () => {
      render(<SideSheet {...defaultProps} width="lg" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('lg');
    });

    it('width="full" 일 때 전체 너비가 적용된다', () => {
      render(<SideSheet {...defaultProps} width="full" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('full');
    });
  });

  describe('위치 테스트', () => {
    it('position="right" (기본값)일 때 우측에서 슬라이드된다', () => {
      render(<SideSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toBeInTheDocument();
    });

    it('position="left" 일 때 좌측에서 슬라이드된다', () => {
      render(<SideSheet {...defaultProps} position="left" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('left');
    });
  });

  describe('닫기 버튼 테스트', () => {
    it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
      render(<SideSheet {...defaultProps} showClose title="Title" />);
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
      render(<SideSheet {...defaultProps} showClose title="Title" />);
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('showClose가 false일 때 닫기 버튼이 렌더링되지 않는다', () => {
      render(<SideSheet {...defaultProps} showClose={false} title="Title" />);
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });

    it('title이 없으면 닫기 버튼이 렌더링되지 않는다', () => {
      render(<SideSheet {...defaultProps} showClose />);
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('포커스 관리 테스트', () => {
    it('열릴 때 SideSheet로 포커스가 이동한다', async () => {
      render(<SideSheet {...defaultProps} />);
      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(document.activeElement).toBe(sheet);
      });
    });

    it('닫힐 때 이전 포커스가 복원된다', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(<SideSheet {...defaultProps} />);

      rerender(<SideSheet {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
      document.body.removeChild(button);
    });

    it('포커스 가능한 요소가 있을 때 첫 번째 요소로 포커스가 이동한다', async () => {
      render(
        <SideSheet {...defaultProps}>
          <button>First Button</button>
          <button>Second Button</button>
        </SideSheet>
      );
      await waitFor(() => {
        const firstButton = screen.getByRole('button', {
          name: 'First Button',
        });
        expect(document.activeElement).toBe(firstButton);
      });
    });
  });

  describe('포커스 트랩 테스트', () => {
    it('Tab 키로 마지막 요소에서 첫 요소로 순환한다', async () => {
      render(
        <SideSheet {...defaultProps}>
          <button>First</button>
          <button>Last</button>
        </SideSheet>
      );

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: 'First' });
        expect(document.activeElement).toBe(firstButton);
      });

      const firstButton = screen.getByRole('button', { name: 'First' });
      const lastButton = screen.getByRole('button', { name: 'Last' });

      lastButton.focus();
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(document.activeElement).toBe(firstButton);
    });

    it('Shift+Tab 키로 첫 요소에서 마지막 요소로 순환한다', async () => {
      render(
        <SideSheet {...defaultProps}>
          <button>First</button>
          <button>Last</button>
        </SideSheet>
      );

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: 'First' });
        expect(document.activeElement).toBe(firstButton);
      });

      const firstButton = screen.getByRole('button', { name: 'First' });
      const lastButton = screen.getByRole('button', { name: 'Last' });

      firstButton.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      expect(document.activeElement).toBe(lastButton);
    });
  });

  describe('Body scroll 테스트', () => {
    it('열릴 때 body scroll이 비활성화된다', async () => {
      render(<SideSheet {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('닫힐 때 body scroll이 복원된다', async () => {
      const { rerender } = render(<SideSheet {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      rerender(<SideSheet {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });
  });

  describe('container 테스트', () => {
    let host: HTMLElement;

    beforeEach(() => {
      host = document.createElement('div');
      document.body.appendChild(host);
    });

    afterEach(() => {
      host.remove();
    });

    it('container를 주면 다이얼로그가 그 안에 그려진다', () => {
      render(<SideSheet {...defaultProps} container={host} />);
      expect(host).toContainElement(screen.getByRole('dialog'));
    });

    it('container를 주면 열려도 body 스크롤을 잠그지 않는다', () => {
      render(<SideSheet {...defaultProps} container={host} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('container가 null이면 body로 간다', () => {
      render(<SideSheet {...defaultProps} container={null} />);
      expect(document.body).toContainElement(screen.getByRole('dialog'));
      expect(host).not.toContainElement(screen.getByRole('dialog'));
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('언마운트 지연 테스트', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('open이 false가 돼도 즉시 DOM에서 제거되지 않는다', () => {
      const { rerender } = render(<SideSheet {...defaultProps} />);
      rerender(<SideSheet {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('animationend 없이 타이머만으로 DOM에서 제거된다', () => {
      const { rerender } = render(<SideSheet {...defaultProps} />);
      rerender(<SideSheet {...defaultProps} open={false} />);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // "닫히는 도중 다시 열리면 언마운트가 취소된다"를 여기서 검증할 수 없어 지웠다.
    // jsdom엔 rAF 티커가 없어 `timeline.time()`이 0이고 퇴장 타이머가 0ms로 접힌다.
    // 타이머를 조금만 진전시키면 취소가 아니라 재마운트를 보게 된다. 진짜 취소를
    // 만들려면 타임라인을 0이 아닌 위치로 seek해야 하는데 그러려면 이 파일이 gsap을
    // import해야 하고(게이트 검사가 막는다), 취소 메커니즘은 훅이 100% 소유한다.
    // 잠그는 자리: `_internal/useOverlayTransition.test.ts`의
    // `닫는 도중 다시 열면 현재 progress에서 정방향으로 이어진다`.

    it('퇴장 중(open=false)엔 시트가 inert해 포커스·클릭이 들어가지 않는다', () => {
      const { rerender } = render(<SideSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');

      rerender(<SideSheet {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('inert');
    });
  });

  describe('퇴장 메커니즘 잠금', () => {
    // jsdom은 애니메이션을 돌리지도 계산값을 주지도 않아 소스 텍스트를 읽는다
    // (tokens/animationBoundary.test.ts와 같은 방식).
    // M3 T2 전까지 퇴장은 CSS transition 클래스였고 이 검사가 그 존재를 잠갔다.
    // 지금은 등장·퇴장이 한 GSAP 타임라인의 양방향이므로 잠글 대상이 뒤집힌다.
    // CSS가 모션을 **다시 갖지 않는다**. 키프레임이 돌아오면 조항 1이 또 깨진다
    // (진행 중 progress를 읽을 수 없어 중단 지점에서 점프한다).
    it('CSS가 등장·퇴장 모션을 갖지 않는다 (명제 조항 1)', () => {
      const source = readFileSync(
        resolve(__dirname, 'SideSheet.css.ts'),
        'utf-8'
      );

      expect(source).not.toMatch(/keyframes/);
      expect(source).not.toMatch(/animation:/);
      expect(source).not.toMatch(/export const \w*Exit\w* = style/);
    });

    it('시트 시작 위치를 타임라인이 소유한다. 오른쪽은 화면 오른쪽 밖', () => {
      render(<SideSheet {...defaultProps} position="right" />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(100%, 0%)'
      );
    });

    it('시트 시작 위치를 타임라인이 소유한다. 왼쪽은 화면 왼쪽 밖', () => {
      render(<SideSheet {...defaultProps} position="left" />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(-100%, 0%)'
      );
    });
  });

  describe('등장: 넘침 · 페이드 · float', () => {
    type Host = HTMLElement & {
      __sideSheetTimeline?: gsap.core.Timeline;
      __sideSheetFade?: gsap.core.Timeline;
    };
    type TweenLike = gsap.core.Tween & {
      vars: gsap.TweenVars & { startAt?: gsap.TweenVars };
    };

    const timelineOf = (sheet: HTMLElement) => {
      const timeline = (sheet as Host).__sideSheetTimeline;
      expect(timeline).toBeDefined();
      return timeline!;
    };
    const fadeOf = (sheet: HTMLElement) => {
      const fade = (sheet as Host).__sideSheetFade;
      expect(fade).toBeDefined();
      return fade!;
    };
    const tweensOn = (timeline: gsap.core.Timeline, target: Element) =>
      (timeline.getChildren() as TweenLike[]).filter((t) =>
        t.targets().includes(target)
      );
    const items = Array.from({ length: 10 }, (_, i) => <p key={i}>항목 {i}</p>);

    it.each([1, 0.5])(
      'paced exit at progress %s unmounts after remaining time',
      (progress) => {
        vi.useFakeTimers();
        try {
          const { rerender } = render(<SideSheet {...defaultProps} />);
          const timeline = timelineOf(screen.getByRole('dialog'));
          expect(timeline.duration()).toBeCloseTo(
            gsapDuration.slow * SHEET_PACE,
            5
          );
          const backdrop = document.querySelector('[role="presentation"]')!;
          expect(tweensOn(timeline, backdrop)[0].duration()).toBeCloseTo(
            gsapDuration.base * SHEET_PACE,
            5
          );
          act(() => {
            timeline.pause().progress(progress);
          });
          rerender(<SideSheet {...defaultProps} open={false} />);
          expect(timeline.reversed()).toBe(true);
          expect(Math.abs(timeline.timeScale())).toBeCloseTo(1 / 0.65, 5);
          timeline.pause();
          const remaining =
            gsapDuration.slow * SHEET_PACE * progress * 0.65 * 1000;
          act(() => {
            vi.advanceTimersByTime(Math.floor(remaining) - 1);
          });
          expect(screen.getByRole('dialog')).toBeInTheDocument();
          act(() => {
            vi.advanceTimersByTime(2);
          });
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        } finally {
          vi.useRealTimers();
        }
      }
    );

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('넘침', () => {
      it('오른쪽: 시트 트윈이 둘이다. 1단은 폭 기준 음수 xPercent, 2단은 drift로 0', () => {
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(
          400
        );
        render(<SideSheet {...defaultProps} position="right" />);
        const sheet = screen.getByRole('dialog');
        const [up, settle, ...rest] = tweensOn(timelineOf(sheet), sheet);

        expect(rest).toHaveLength(0);
        // 16px / 400px = 4%
        expect(up.vars.xPercent).toBeCloseTo(-4, 5);
        expect(up.vars.ease).toBe(gsapEasing.settle);
        expect(up.duration()).toBeCloseTo(gsapDuration.slow * SHEET_PACE, 5);
        expect(settle.vars.xPercent).toBe(0);
        expect(settle.vars.ease).toBe(gsapEasing.drift);
        expect(settle.duration()).toBeCloseTo(
          gsapDuration.base * SHEET_PACE,
          5
        );
        expect(settle.startTime()).toBeCloseTo(
          gsapDuration.slow * SHEET_PACE,
          5
        );
        expect(timelineOf(sheet).duration()).toBeCloseTo(
          (gsapDuration.slow + gsapDuration.base) * SHEET_PACE,
          5
        );
      });

      it('왼쪽: 1단 끝값이 양수 xPercent다', () => {
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(
          300
        );
        render(<SideSheet {...defaultProps} position="left" />);
        const sheet = screen.getByRole('dialog');
        const [up] = tweensOn(timelineOf(sheet), sheet);

        expect(up.vars.xPercent).toBeCloseTo((16 / 300) * 100, 5);
      });

      it('폭이 0이면 넘침 없이 100 → 0 하나다', () => {
        render(<SideSheet {...defaultProps} />);
        const sheet = screen.getByRole('dialog');
        const tweens = tweensOn(timelineOf(sheet), sheet);

        expect(tweens).toHaveLength(1);
        expect(tweens[0].vars.xPercent).toBe(0);
      });
    });

    describe('내용 페이드', () => {
      const renderItems = () => {
        render(
          <SideSheet {...defaultProps} title="제목">
            {items}
          </SideSheet>
        );
        const sheet = screen.getByRole('dialog');
        return {
          sheet,
          timeline: timelineOf(sheet),
          fade: fadeOf(sheet),
        };
      };

      it('내용 전체가 위치 이동 없이 settle·fast로 페이드인한다', () => {
        const { fade } = renderItems();
        const [tween, ...rest] = tweensOn(
          fade,
          screen.getByText('항목 0').parentElement!
        );

        expect(rest).toHaveLength(0);
        expect(tween.vars).not.toHaveProperty('y');
        expect(tween.vars.startAt).not.toHaveProperty('y');
        expect(tween.vars).not.toHaveProperty('x');
        expect(tween.vars.startAt?.opacity).toBe(0);
        expect(tween.vars.opacity).toBe(1);
        expect(tween.vars.ease).toBe(gsapEasing.settle);
        expect(tween.duration()).toBeCloseTo(gsapDuration.fast, 5);
      });

      it('모든 항목이 같은 시점과 중간 불투명도로 함께 나타난다', () => {
        const { fade } = renderItems();
        act(() => {
          fade.pause().time(gsapDuration.fast / 2);
        });
        const first = screen.getByText('항목 0');
        expect(Number(first.parentElement!.style.opacity)).toBeGreaterThan(0);
        expect(Number(first.parentElement!.style.opacity)).toBeLessThan(1);
        for (let i = 0; i < 10; i++) {
          const item = screen.getByText(`항목 ${i}`);
          expect(tweensOn(fade, item.parentElement!)[0].startTime()).toBe(0);
          expect(item.parentElement!.style.opacity).toBe(
            first.parentElement!.style.opacity
          );
          expect(item.style.transform).toBe('');
        }
      });

      it('페이드 타임라인은 등장이 1단의 60% 지점을 정방향으로 지날 때 돈다', () => {
        const { timeline, fade } = renderItems();

        act(() => {
          timeline.time(gsapDuration.slow * SHEET_PACE * 0.6 - 0.05);
        });
        expect(fade.paused()).toBe(true);
        act(() => {
          timeline.time(gsapDuration.slow * SHEET_PACE * 0.6 + 0.05);
        });
        expect(fade.paused()).toBe(false);
      });

      it('Compound의 SideSheet.Content 직계 자식에도 걸린다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Content>
              <p>가</p>
              <p>나</p>
            </SideSheet.Content>
          </SideSheet>
        );
        const sheet = screen.getByRole('dialog');

        expect(
          tweensOn(fadeOf(sheet), screen.getByText('나').parentElement!)
        ).toHaveLength(1);
      });

      it('닫으면 되감기지 않고 끝으로 확정되어 인라인 y가 0으로 돌아온다', () => {
        const view = render(
          <SideSheet {...defaultProps} title="제목">
            {items}
          </SideSheet>
        );
        const sheet = screen.getByRole('dialog');
        const fade = fadeOf(sheet);
        act(() => {
          timelineOf(sheet).progress(1);
          fade.progress(0.3);
        });

        view.rerender(
          <SideSheet {...defaultProps} title="제목" open={false}>
            {items}
          </SideSheet>
        );

        const first = screen.getByText('항목 0');
        expect(fade.progress()).toBe(1);
        expect(first.parentElement!.style.opacity).toBe('1');
        expect(first.style.transform).not.toContain('24');
      });

      it('문자열 children도 본문 컨테이너와 함께 페이드인한다', () => {
        render(
          <SideSheet {...defaultProps} title="제목">
            문자열 본문
          </SideSheet>
        );
        const fade = fadeOf(screen.getByRole('dialog'));
        const body = screen.getByText('문자열 본문');
        expect(tweensOn(fade, body)).toHaveLength(1);
        act(() => {
          fade.pause().progress(0.5);
        });
        expect(Number(body.style.opacity)).toBeGreaterThan(0);
        expect(Number(body.style.opacity)).toBeLessThan(1);
      });
    });

    describe('float', () => {
      it('등장이 끝나면 data-floating이 붙는다. 처음엔 없다', () => {
        render(<SideSheet {...defaultProps} />);
        const sheet = screen.getByRole('dialog');

        expect(sheet).not.toHaveAttribute('data-floating');
        act(() => {
          timelineOf(sheet).progress(1);
        });
        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).not.toHaveAttribute('data-float-paused');
      });

      it('닫는 중이면 data-floating은 남고 멈춤이 붙는다', () => {
        const { rerender } = render(<SideSheet {...defaultProps} />);
        const sheet = screen.getByRole('dialog');
        act(() => {
          timelineOf(sheet).progress(1);
        });

        rerender(<SideSheet {...defaultProps} open={false} />);

        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).toHaveAttribute('data-float-paused');
      });

      it('닫는 도중 다시 열면 멈춤이 풀린다', () => {
        const { rerender } = render(<SideSheet {...defaultProps} />);
        const sheet = screen.getByRole('dialog');
        act(() => {
          timelineOf(sheet).progress(1);
        });
        rerender(<SideSheet {...defaultProps} open={false} />);
        rerender(<SideSheet {...defaultProps} />);

        expect(sheet).not.toHaveAttribute('data-float-paused');
      });
    });

    describe('둥실거림 배선', () => {
      it.each([
        ['right', 'left'],
        ['left', 'right'],
      ] as const)(
        'position="%s"는 그 방향 클래스를 붙이고 %s의 것은 안 붙인다',
        (position, other) => {
          render(<SideSheet {...defaultProps} position={position} />);
          const sheet = screen.getByRole('dialog');

          expect(sheet.className).toMatch(
            new RegExp(`floatClass_${position}__`)
          );
          expect(sheet.className).not.toMatch(
            new RegExp(`floatClass_${other}__`)
          );
          // 방향 변형은 둥실거림 규칙(sheetFloat)과 한 덩어리로 온다.
          expect(sheet.className).toMatch(/sheetFloat_sheetFloat__/);
        }
      );
    });

    describe('축소 선호(게이트가 페이드를 끝으로 확정한다)', () => {
      beforeEach(() => {
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
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('reduced motion opens and unmounts immediately', () => {
        const { rerender } = render(<SideSheet {...defaultProps} />);
        const timeline = timelineOf(screen.getByRole('dialog'));
        expect(timeline.progress()).toBe(1);
        expect(timeline.isActive()).toBe(false);
        rerender(<SideSheet {...defaultProps} open={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('내용 직계 자식이 끝 상태(opacity 1, y 0)이고 페이드 타임라인이 이미 끝났다', () => {
        render(
          <SideSheet {...defaultProps} title="제목">
            {items}
          </SideSheet>
        );
        const sheet = screen.getByRole('dialog');
        const first = screen.getByText('항목 0');

        expect(first.parentElement!.style.opacity).toBe('1');
        expect(first.style.transform).toBe('');
        expect(fadeOf(sheet).progress()).toBe(1);
      });
    });

    describe('CSS', () => {
      const read = (path: string) =>
        readFileSync(resolve(__dirname, path), 'utf-8');

      it('둥실거림은 붙은 가장자리에서 안쪽으로다. 오른쪽 시트는 x 음수, 왼쪽 시트는 x 양수', () => {
        const source = read('../../_internal/sheetFloat.css.ts');
        const xOf = (name: string) =>
          new RegExp(
            `${name}:\\s*\\{\\s*vars:\\s*\\{\\s*\\[floatX\\]:\\s*'([^']+)'`
          ).exec(source)?.[1];

        expect(xOf('right')).toMatch(/^-\d+px$/);
        expect(xOf('left')).toMatch(/^\d+px$/);
      });

      it('boxShadow 덮개의 부호는 오른쪽 양수, 왼쪽 음수다', () => {
        const source = read('SideSheet.css.ts');
        const shadowOf = (name: string) =>
          new RegExp(
            String.raw`${name}:\s*\{[^}]*boxShadow:\s*gapCover\('([^']+)'\)`
          ).exec(source)?.[1];

        expect(shadowOf('right')).toBe('32px');
        expect(shadowOf('left')).toBe('-32px');
      });

      it('덮개는 첫 번째 그림자다. 앞에 쓴 그림자가 위에 칠해지므로 2xl이 앞서면 덮개를 덮는다', () => {
        const source = read('SideSheet.css.ts');

        expect(source).toContain(
          "`${offset} 0 0 0 ${themeContract.color.background.default}, ${themeContract.shadow['2xl']}`"
        );
      });

      it('시트 자신이 스크롤 컨테이너라 ::after를 쓰지 않는다', () => {
        const source = read('SideSheet.css.ts');

        expect(source).toMatch(/overflowY:\s*'auto'/);
        expect(source).not.toMatch(/&::after/);
      });
    });
  });

  describe('className 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      render(<SideSheet {...defaultProps} className="custom-class" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('custom-class');
    });
  });

  describe('Compound API 테스트', () => {
    describe('SideSheet.Header', () => {
      it('SideSheet.Header가 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>Header Content</SideSheet.Header>
            <SideSheet.Content>Body Content</SideSheet.Content>
          </SideSheet>
        );
        expect(screen.getByText('Header Content')).toBeInTheDocument();
      });

      it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header showClose>Header</SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        expect(
          screen.getByRole('button', { name: /닫기/i })
        ).toBeInTheDocument();
      });

      it('showClose 닫기 버튼 클릭 시 onClose가 호출된다', async () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header showClose>Header</SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        const closeButton = screen.getByRole('button', { name: /닫기/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('SideSheet.Title', () => {
      it('SideSheet.Title이 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>
              <SideSheet.Title>제목입니다</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        expect(screen.getByText('제목입니다')).toBeInTheDocument();
      });

      it('SideSheet.Title이 h2 요소로 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>
              <SideSheet.Title>제목</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        const title = screen.getByText('제목');
        expect(title.tagName).toBe('H2');
      });

      it('SideSheet.Title이 dialog의 accessible name이 된다 (compound 경로)', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>
              <SideSheet.Title>제목입니다</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        expect(
          screen.getByRole('dialog', { name: '제목입니다' })
        ).toBeInTheDocument();
      });

      it('aria-labelledby를 직접 주면 SideSheet.Title이 있어도 그 값이 우선한다', () => {
        render(
          <SideSheet {...defaultProps} aria-labelledby="external-label">
            <span id="external-label">외부 레이블</span>
            <SideSheet.Header>
              <SideSheet.Title>내부 제목</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        expect(
          screen.getByRole('dialog', { name: '외부 레이블' })
        ).toBeInTheDocument();
      });

      it('Title에 소비자 id를 줘도 dialog의 접근 가능 이름이 유지된다', () => {
        // Title의 id는 컴포넌트가 소유한다. 소비자 id가 이기면 루트의
        // aria-labelledby가 허공을 가리켜 접근 가능 이름이 조용히 사라진다.
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>
              <SideSheet.Title id="my-heading">탈퇴 확인</SideSheet.Title>
            </SideSheet.Header>
          </SideSheet>
        );
        expect(screen.getByRole('dialog')).toHaveAccessibleName('탈퇴 확인');
      });

      it('Title이 없으면 dangling IDREF가 되지만 이름 계산이 깨지지 않는다', () => {
        // compound 경로의 루트는 항상 생성 titleId를 가리킨다. 그 id를 가진
        // 요소가 없으면 accname 1.2는 그 단계를 건너뛴다. 이름은 빈 문자열이고
        // id 문자열이 이름으로 새어 나오지 않는다. 라이브러리가 이 동작을 바꾸는
        // 날 여기서 잡힌다.
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Content>제목 없는 본문</SideSheet.Content>
          </SideSheet>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAccessibleName('');
      });
    });

    describe('SideSheet.Content', () => {
      it('SideSheet.Content가 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Content>내용입니다</SideSheet.Content>
          </SideSheet>
        );
        expect(screen.getByText('내용입니다')).toBeInTheDocument();
      });

      it('복잡한 컴포넌트를 Content로 렌더링할 수 있다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Content>
              <div>
                <button>버튼 1</button>
                <button>버튼 2</button>
              </div>
            </SideSheet.Content>
          </SideSheet>
        );
        expect(
          screen.getByRole('button', { name: '버튼 1' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: '버튼 2' })
        ).toBeInTheDocument();
      });
    });

    describe('Compound 조합 테스트', () => {
      it('Header + Title + Content를 함께 사용할 수 있다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header showClose>
              <SideSheet.Title>제목</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>내용</SideSheet.Content>
          </SideSheet>
        );
        expect(screen.getByText('제목')).toBeInTheDocument();
        expect(screen.getByText('내용')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /닫기/i })
        ).toBeInTheDocument();
      });

      it('position과 함께 사용할 수 있다', () => {
        render(
          <SideSheet {...defaultProps} position="left">
            <SideSheet.Header>
              <SideSheet.Title>제목</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>내용</SideSheet.Content>
          </SideSheet>
        );
        const sheet = screen.getByRole('dialog');
        expect(sheet.className).toContain('left');
      });
    });
  });
});
