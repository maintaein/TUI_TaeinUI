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
import { BottomSheet } from './BottomSheet';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

describe('BottomSheet', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    children: 'BottomSheet content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('렌더링 테스트', () => {
    it('open이 true일 때 BottomSheet가 렌더링된다', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('BottomSheet content')).toBeInTheDocument();
    });

    it('open이 false일 때 BottomSheet가 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('children이 올바르게 렌더링된다', () => {
      render(
        <BottomSheet {...defaultProps}>
          <div>Custom content</div>
        </BottomSheet>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('title이 있을 때 렌더링된다', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('title이 없을 때 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.querySelector('h2')).not.toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('role="dialog"를 가진다', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal="true"를 가진다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('aria-modal', 'true');
    });

    it('title이 있을 때 aria-labelledby가 설정된다', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" />);
      const sheet = screen.getByRole('dialog');
      const labelledby = sheet.getAttribute('aria-labelledby');
      expect(labelledby).toBeTruthy();

      const title = document.getElementById(labelledby!);
      expect(title).toHaveTextContent('Test Title');
    });

    it('title을 dialog의 accessible name으로 사용한다', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" />);
      expect(
        screen.getByRole('dialog', { name: 'Test Title' })
      ).toBeInTheDocument();
    });

    it('aria-label이 있을 때 설정된다', () => {
      render(<BottomSheet {...defaultProps} aria-label="Custom Label" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('aria-label', 'Custom Label');
    });
  });

  describe('Backdrop 클릭 테스트', () => {
    it('closeOnBackdropClick이 true일 때 backdrop 클릭 시 onClose가 호출된다', async () => {
      render(<BottomSheet {...defaultProps} closeOnBackdropClick />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closeOnBackdropClick이 false일 때 backdrop 클릭 시 onClose가 호출되지 않는다', () => {
      render(<BottomSheet {...defaultProps} closeOnBackdropClick={false} />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('시트 영역 클릭 시 onClose가 호출되지 않는다', () => {
      render(<BottomSheet {...defaultProps} closeOnBackdropClick />);
      const sheet = screen.getByRole('dialog');
      fireEvent.click(sheet);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('ESC 키 테스트', () => {
    it('closeOnEscape이 true일 때 ESC 키로 닫힌다', async () => {
      render(<BottomSheet {...defaultProps} closeOnEscape />);
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closeOnEscape이 false일 때 ESC 키로 닫히지 않는다', () => {
      render(<BottomSheet {...defaultProps} closeOnEscape={false} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('높이 테스트', () => {
    it('기본 높이(auto)가 적용된다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toBeInTheDocument();
    });

    it('height="sm" 일 때 작은 높이가 적용된다', () => {
      render(<BottomSheet {...defaultProps} height="sm" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('sm');
    });

    it('height="md" 일 때 중간 높이가 적용된다', () => {
      render(<BottomSheet {...defaultProps} height="md" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('md');
    });

    it('height="lg" 일 때 큰 높이가 적용된다', () => {
      render(<BottomSheet {...defaultProps} height="lg" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('lg');
    });

    it('height="full" 일 때 전체 높이가 적용된다', () => {
      render(<BottomSheet {...defaultProps} height="full" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('full');
    });
  });

  describe('드래그 핸들 테스트', () => {
    it('showHandle이 true일 때 드래그 핸들이 렌더링된다', () => {
      render(<BottomSheet {...defaultProps} showHandle />);
      const sheet = screen.getByRole('dialog');
      const handle = sheet.querySelector('[data-testid="bottomsheet-handle"]');
      expect(handle).toBeInTheDocument();
    });

    it('showHandle이 false일 때 드래그 핸들이 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} showHandle={false} />);
      const sheet = screen.getByRole('dialog');
      const handle = sheet.querySelector('[data-testid="bottomsheet-handle"]');
      expect(handle).not.toBeInTheDocument();
    });

    it('기본값은 showHandle=true이다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const handle = sheet.querySelector('[data-testid="bottomsheet-handle"]');
      expect(handle).toBeInTheDocument();
    });
  });

  describe('닫기 버튼 테스트', () => {
    it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
      render(<BottomSheet {...defaultProps} showClose title="Title" />);
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
      render(<BottomSheet {...defaultProps} showClose title="Title" />);
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('showClose가 false일 때 닫기 버튼이 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} showClose={false} title="Title" />);
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });

    it('title이 없으면 닫기 버튼이 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} showClose />);
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('포커스 관리 테스트', () => {
    it('열릴 때 BottomSheet로 포커스가 이동한다', async () => {
      render(<BottomSheet {...defaultProps} />);
      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(document.activeElement).toBe(sheet);
      });
    });

    it('닫힐 때 이전 포커스가 복원된다', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(<BottomSheet {...defaultProps} />);

      rerender(<BottomSheet {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
      document.body.removeChild(button);
    });

    it('포커스 가능한 요소가 있을 때 첫 번째 요소로 포커스가 이동한다', async () => {
      render(
        <BottomSheet {...defaultProps}>
          <button>First Button</button>
          <button>Second Button</button>
        </BottomSheet>
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
    it('마지막 요소에서 Tab을 누르면 첫 요소로 순환한다', () => {
      render(
        <BottomSheet {...defaultProps}>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </BottomSheet>
      );

      const button1 = screen.getByText('Button 1');
      const button3 = screen.getByText('Button 3');

      button3.focus();
      expect(button3).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Tab' });

      expect(button1).toHaveFocus();
    });

    it('첫 요소에서 Shift+Tab을 누르면 마지막 요소로 순환한다', () => {
      render(
        <BottomSheet {...defaultProps}>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </BottomSheet>
      );

      const button1 = screen.getByText('Button 1');
      const button3 = screen.getByText('Button 3');

      button1.focus();
      expect(button1).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      expect(button3).toHaveFocus();
    });
  });

  describe('Body scroll 테스트', () => {
    it('열릴 때 body scroll이 비활성화된다', async () => {
      render(<BottomSheet {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('닫힐 때 body scroll이 복원된다', async () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      rerender(<BottomSheet {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });
  });

  describe('드래그 동작 테스트', () => {
    it('enableDrag가 true일 때 드래그로 닫을 수 있다', async () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, {
        touches: [{ clientY: 100 }],
      });

      fireEvent.touchMove(sheet, {
        touches: [{ clientY: 300 }],
      });

      fireEvent.touchEnd(sheet, {
        changedTouches: [{ clientY: 300 }],
      });

      // 드래그 닫기는 transitionend 후 onClose를 호출함
      fireEvent.transitionEnd(sheet);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('enableDrag가 false일 때 드래그로 닫을 수 없다', () => {
      render(<BottomSheet {...defaultProps} enableDrag={false} />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, {
        touches: [{ clientY: 100 }],
      });

      fireEvent.touchMove(sheet, {
        touches: [{ clientY: 300 }],
      });

      fireEvent.touchEnd(sheet, {
        changedTouches: [{ clientY: 300 }],
      });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('위로 드래그하면 닫히지 않는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, {
        touches: [{ clientY: 300 }],
      });

      fireEvent.touchMove(sheet, {
        touches: [{ clientY: 100 }],
      });

      fireEvent.touchEnd(sheet, {
        changedTouches: [{ clientY: 100 }],
      });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  // 예전엔 드래그 닫기가 자체 CSS transition을 걸고 `transitionend`를 기다렸고,
  // 그 이벤트가 안 올 때를 위한 300ms 폴백 타이머가 있었다. M3 T2가 닫기를
  // 타임라인에 넘겨 전이도 폴백 타이머도 사라졌으므로, 이 자리는 그 둘이
  // 없어도 닫힘이 확정된다는 사실을 잠근다 — 폴백이 지키려던 바로 그 성질이다.
  describe('드래그 닫기는 애니메이션 이벤트에 기대지 않는다', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('transitionend가 오지 않아도 놓는 즉시 닫힘이 확정된다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 300 }] });
      fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 300 }] });

      // transitionend를 일부러 발생시키지 않는다 — 기다리는 이벤트가 없다.
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('시간이 더 흘러도 onClose가 중복 호출되지 않는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 300 }] });
      fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 300 }] });

      fireEvent.transitionEnd(sheet);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
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
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      rerender(<BottomSheet {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('animationend 없이 타이머만으로 DOM에서 제거된다', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      rerender(<BottomSheet {...defaultProps} open={false} />);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // "닫히는 도중 다시 열리면 언마운트가 취소된다"를 여기서 검증할 수 없어 지웠다.
    // jsdom엔 rAF 티커가 없어 `timeline.time()`이 0이고 퇴장 타이머가 0ms로 접힌다 —
    // 타이머를 조금만 진전시키면 취소가 아니라 재마운트를 보게 된다. 진짜 취소를
    // 만들려면 타임라인을 0이 아닌 위치로 seek해야 하는데 그러려면 이 파일이 gsap을
    // import해야 하고(게이트 검사가 막는다), 취소 메커니즘은 훅이 100% 소유한다.
    // 잠그는 자리: `_internal/useOverlayTransition.test.ts`의
    // `닫는 도중 다시 열면 현재 progress에서 정방향으로 이어진다`.

    it('퇴장 중(open=false)엔 시트가 inert해 포커스·클릭이 들어가지 않는다', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');

      rerender(<BottomSheet {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('inert');
    });
  });

  describe('퇴장 메커니즘 잠금', () => {
    // jsdom은 애니메이션을 돌리지도 계산값을 주지도 않아 소스 텍스트를 읽는다
    // (tokens/animationBoundary.test.ts와 같은 방식).
    // M3 T2 전까지 퇴장은 CSS transition 클래스였고 이 검사가 그 존재를 잠갔다.
    // 지금은 등장·퇴장이 한 GSAP 타임라인의 양방향이므로 잠글 대상이 뒤집힌다 —
    // CSS가 모션을 **다시 갖지 않는다**. 키프레임이 돌아오면 조항 1이 또 깨지고
    // (진행 중 progress를 못 읽어 중단 지점에서 점프한다) 드래그가 다시 같은
    // transform을 놓고 다투게 된다.
    it('CSS가 등장·퇴장 모션을 갖지 않는다 (명제 조항 1)', () => {
      const source = readFileSync(
        resolve(__dirname, '../../_internal/sheetFloat.css.ts'),
        'utf-8'
      );

      // BottomSheet.css.ts 자체는 모션을 갖지 않는다. float 루프는 _internal로 갔고
      // 거기만 읽으면 여기에 keyframes가 되살아나도 못 잡는다.
      const own = readFileSync(
        resolve(__dirname, 'BottomSheet.css.ts'),
        'utf-8'
      );
      expect(own).not.toMatch(/keyframes/);
      expect(own).not.toMatch(/animation:/);

      // 허용되는 CSS 모션은 열린 동안의 float 루프 하나뿐이다. 등장·퇴장이 아니라
      // 쉬는 자리 주변의 반복이라 되돌릴 상태가 없다.
      expect(source.match(/keyframes\(/g)).toHaveLength(1);
      expect(source.match(/animation:/g)).toHaveLength(1);
      expect(source).toMatch(/&\[data-floating\]'?:\s*\{\s*animation:/);
      expect(source).not.toMatch(/export const \w*Exit\w* = style/);
    });

    it('시트 시작 위치를 타임라인이 소유한다 — 화면 아래 밖에서 시작한다', () => {
      render(<BottomSheet {...defaultProps} />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(0%, 100%)'
      );
    });
  });

  describe('축소 선호 — 드래그 복귀', () => {
    /** jsdom은 matchMedia를 구현하지 않는다 — 축소 선호 경로를 열려면 깔아야 한다. */
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

    it('문턱 아래에서 놓으면 트윈 없이 즉시 쉬는 자리로 붙는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 160 }] });
      expect(sheet.style.transform).toContain('60px');

      fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 160 }] });

      // 게이트가 트윈을 끝 상태로 확정하고 죽인다 — 중간 어딘가에 멈추지 않는다.
      expect(sheet.style.transform).not.toContain('60px');
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    // 드래그 effect의 deps에 onClose가 있어서, 소비자가 인라인 화살표를 넘기면
    // 부모 리렌더마다 effect가 다시 돈다. 진입 때 무조건 복귀 트윈을 걸면 손가락이
    // 아직 내려가 있는데 시트를 끌어올린다 — 채널 분리로 막은 싸움이 같은 `y`
    // 채널 안에서 재발한다. 축소 선호를 깔아 둔 이유: jsdom엔 rAF 티커가 없어
    // 평소엔 트윈이 한 프레임도 안 돌아 이 결함이 관측되지 않는다. 게이트는
    // 트윈을 즉시 끝 상태로 확정하므로 y=0이 곧바로 보인다.
    it('드래그 중 부모가 리렌더해도 복귀 트윈이 손가락을 끌어올리지 않는다', () => {
      const { rerender } = render(
        <BottomSheet {...defaultProps} onClose={() => {}} enableDrag />
      );
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 160 }] });
      expect(sheet.style.transform).toContain('60px');

      // onClose identity가 바뀌어 드래그 effect가 다시 돈다.
      rerender(<BottomSheet {...defaultProps} onClose={() => {}} enableDrag />);

      expect(sheet.style.transform).toContain('60px');
    });
  });

  describe('드래그와 타임라인의 채널 분리', () => {
    it('드래그는 y(px)에 쓰고 타임라인의 yPercent를 지우지 않는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 160 }] });

      // 두 채널이 한 transform으로 합성된다 — 손가락이 60px 끌었고 타임라인의
      // 100%는 그대로 남아 있다. 예전처럼 style.transform에 직접 쓰면
      // yPercent가 지워져 시트가 튀었다.
      expect(sheet.style.transform).toContain('60px');
      expect(sheet.style.transform).toContain('100%');
    });

    it('위로 끌면 아무 채널도 움직이지 않는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');
      const before = sheet.style.transform;

      fireEvent.touchStart(sheet, { touches: [{ clientY: 300 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 100 }] });

      expect(sheet.style.transform).toBe(before);
    });
  });

  describe('등장: bounce · stagger · float', () => {
    type Host = HTMLElement & { __bottomSheetTimeline?: gsap.core.Timeline };
    type TweenLike = gsap.core.Tween & {
      vars: gsap.TweenVars & { startAt?: gsap.TweenVars };
    };

    const timelineOf = (sheet: HTMLElement) => {
      const timeline = (sheet as Host).__bottomSheetTimeline;
      expect(timeline).toBeDefined();
      return timeline!;
    };
    const tweensOn = (timeline: gsap.core.Timeline, target: Element) =>
      (timeline.getChildren() as TweenLike[]).filter(
        (t) => t.targets()[0] === target
      );

    const items = Array.from({ length: 10 }, (_, i) => <p key={i}>항목 {i}</p>);

    describe('bounce', () => {
      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('시트 트윈이 둘이다. 1단 settle·slow로 지나치고, 2단 drift·base로 앉는다', () => {
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(
          400
        );
        render(<BottomSheet {...defaultProps} />);
        const sheet = screen.getByRole('dialog');
        const [up, settle, ...rest] = tweensOn(timelineOf(sheet), sheet);

        expect(rest).toHaveLength(0);
        expect(up.vars.ease).toBe(gsapEasing.settle);
        expect(up.duration()).toBeCloseTo(gsapDuration.slow, 5);
        expect(up.startTime()).toBe(0);
        expect(settle.vars.ease).toBe(gsapEasing.drift);
        expect(settle.duration()).toBeCloseTo(gsapDuration.base, 5);
        expect(settle.startTime()).toBeCloseTo(gsapDuration.slow, 5);
        expect(settle.vars.yPercent).toBe(0);
        // 16px / 400px = 4%
        expect(up.vars.yPercent).toBeCloseTo(-4, 5);
      });

      it('시트 높이가 0이면 넘침 없이 yPercent 100 → 0이다', () => {
        render(<BottomSheet {...defaultProps} />);
        const sheet = screen.getByRole('dialog');
        const tweens = tweensOn(timelineOf(sheet), sheet);

        expect(tweens).toHaveLength(1);
        expect(tweens[0].vars.yPercent).toBe(0);
        expect(tweens[0].vars.ease).toBe(gsapEasing.settle);
      });

      it('등장 타임라인은 y(px)를 쓰지 않는다. 드래그와 restToY0의 채널이다', () => {
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(
          400
        );
        render(
          <BottomSheet {...defaultProps} title="제목">
            {items}
          </BottomSheet>
        );
        const sheet = screen.getByRole('dialog');

        const tweens = tweensOn(timelineOf(sheet), sheet);
        expect(tweens).toHaveLength(2);
        for (const t of tweens) {
          expect(t.vars).not.toHaveProperty('y');
          expect(t.vars.startAt).not.toHaveProperty('y');
        }
      });
    });

    describe('stagger', () => {
      type StaggerHost = HTMLElement & {
        __bottomSheetStagger?: gsap.core.Timeline;
      };
      /** 내용 시차는 등장 타임라인 밖의 별도 타임라인이다(닫을 때 되감지 않으려고). */
      const staggerOf = (sheet: HTMLElement) => {
        const stagger = (sheet as StaggerHost).__bottomSheetStagger;
        expect(stagger).toBeDefined();
        return stagger!;
      };
      const renderItems = () => {
        render(
          <BottomSheet {...defaultProps} title="제목">
            {items}
          </BottomSheet>
        );
        const sheet = screen.getByRole('dialog');
        return {
          sheet,
          timeline: timelineOf(sheet),
          stagger: staggerOf(sheet),
        };
      };

      it('내용의 직계 자식에 y 24 → 0은 snap·slow, opacity는 settle·fast로 분리해 건다', () => {
        const { stagger } = renderItems();
        const first = screen.getByText('항목 0');
        const [rise, fade] = tweensOn(stagger, first);

        expect(rise.vars.startAt?.y).toBe(24);
        expect(rise.vars.y).toBe(0);
        expect(rise.vars.ease).toBe(gsapEasing.snap);
        expect(rise.duration()).toBeCloseTo(gsapDuration.slow, 5);
        expect(fade.vars.startAt?.opacity).toBe(0);
        expect(fade.vars.opacity).toBe(1);
        expect(fade.vars.ease).toBe(gsapEasing.settle);
        expect(fade.duration()).toBeCloseTo(gsapDuration.fast, 5);
      });

      it('시차 타임라인은 등장이 1단(slow)의 60% 지점을 정방향으로 지날 때 처음부터 돈다', () => {
        const { timeline, stagger } = renderItems();

        act(() => {
          timeline.time(gsapDuration.slow * 0.6 - 0.05);
        });
        expect(stagger.paused()).toBe(true);

        act(() => {
          timeline.time(gsapDuration.slow * 0.6 + 0.05);
        });
        expect(stagger.paused()).toBe(false);
      });

      it('시차는 0.045초이고 9번째부터는 8번째와 같은 시각에 시작한다', () => {
        const { stagger } = renderItems();
        const startOf = (i: number) =>
          tweensOn(stagger, screen.getByText(`항목 ${i}`))[0].startTime();

        expect(startOf(0)).toBe(0);
        expect(startOf(1) - startOf(0)).toBeCloseTo(0.045, 5);
        expect(startOf(7) - startOf(0)).toBeCloseTo(0.045 * 7, 5);
        expect(startOf(8)).toBeCloseTo(startOf(7), 5);
        expect(startOf(9)).toBeCloseTo(startOf(7), 5);
      });

      it('헤더와 핸들은 대상이 아니다', () => {
        const { sheet, timeline, stagger } = renderItems();

        for (const tl of [timeline, stagger]) {
          expect(tweensOn(tl, screen.getByRole('heading'))).toHaveLength(0);
          expect(
            tweensOn(tl, screen.getByTestId('bottomsheet-handle'))
          ).toHaveLength(0);
        }
        expect(tweensOn(timeline, sheet).length).toBeGreaterThan(0);
      });

      it('자식 요소가 없으면(문자열 children) 이 단계를 건너뛴다', () => {
        render(<BottomSheet {...defaultProps} title="제목" />);
        const sheet = screen.getByRole('dialog');
        const targets = (timelineOf(sheet).getChildren() as TweenLike[]).map(
          (t) => t.targets()[0]
        );

        // 시트 안쪽 요소에는 아무것도 걸리지 않는다(시트 자신과 백드롭뿐)
        expect(targets.some((t) => t !== sheet && sheet.contains(t))).toBe(
          false
        );
        expect((sheet as StaggerHost).__bottomSheetStagger).toBeUndefined();
      });

      it('Compound의 BottomSheet.Content 직계 자식에도 걸린다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Content>
              <p>가</p>
              <p>나</p>
            </BottomSheet.Content>
          </BottomSheet>
        );
        const sheet = screen.getByRole('dialog');

        expect(tweensOn(staggerOf(sheet), screen.getByText('나'))).toHaveLength(
          2
        );
      });

      describe('닫기', () => {
        afterEach(() => {
          vi.restoreAllMocks();
        });

        const openAndClose = () => {
          vi.spyOn(
            HTMLElement.prototype,
            'offsetHeight',
            'get'
          ).mockReturnValue(400);
          const view = render(
            <BottomSheet {...defaultProps} title="제목">
              {items}
            </BottomSheet>
          );
          const sheet = screen.getByRole('dialog');
          const timeline = timelineOf(sheet);
          const stagger = staggerOf(sheet);
          act(() => {
            timeline.progress(1);
          });
          const close = () =>
            view.rerender(
              <BottomSheet {...defaultProps} title="제목" open={false}>
                {items}
              </BottomSheet>
            );
          const reopen = () =>
            view.rerender(
              <BottomSheet {...defaultProps} title="제목">
                {items}
              </BottomSheet>
            );
          return { sheet, timeline, stagger, close, reopen };
        };

        it('역재생되는 등장 타임라인은 시트 구간(500ms)이고 내용 시차가 안에 없다', () => {
          const { sheet, timeline } = openAndClose();

          expect(timeline.duration()).toBeCloseTo(
            gsapDuration.slow + gsapDuration.base,
            5
          );
          expect(tweensOn(timeline, screen.getByText('항목 0'))).toHaveLength(
            0
          );
          expect(tweensOn(timeline, sheet).length).toBeGreaterThan(0);
        });

        it('닫으면 내용은 되감기지 않고 끝 상태로 확정되어 시트에 실려 내려간다', () => {
          const { timeline, stagger, close } = openAndClose();
          const first = screen.getByText('항목 0');
          // 시차 도중에 닫는다
          act(() => {
            stagger.progress(0.3);
          });

          close();

          expect(timeline.reversed()).toBe(true);
          expect(stagger.progress()).toBe(1);
          expect(first.style.opacity).toBe('1');
          expect(first.style.transform).not.toContain('24');
        });

        it('역재생이 시차 지점을 지나도 시차가 다시 돌지 않는다', () => {
          const { timeline, stagger, close } = openAndClose();
          close();

          act(() => {
            timeline.progress(0.2);
          });

          expect(stagger.progress()).toBe(1);
        });

        it('시차 지점 아래까지 내려갔다가 다시 열면 지점을 지날 때 시차가 다시 돈다', () => {
          const { timeline, stagger, close, reopen } = openAndClose();
          close();
          act(() => {
            timeline.progress(0.2);
          });

          reopen();
          expect(timeline.reversed()).toBe(false);
          act(() => {
            timeline.progress(1);
          });

          expect(stagger.progress()).toBe(0);
          expect(stagger.paused()).toBe(false);
          expect(screen.getByText('항목 0').style.opacity).toBe('0');
        });

        it('시차 지점 위에서 다시 열면 시차가 다시 돌지 않고 내용이 그대로 있다', () => {
          // 이유: 시트가 이미 시차 지점을 지난 높이라 내용이 사라졌다 다시 뜨면 번쩍인다
          const { timeline, stagger, close, reopen } = openAndClose();
          close();
          act(() => {
            timeline.progress(0.8);
          });

          reopen();
          act(() => {
            timeline.progress(1);
          });

          expect(stagger.progress()).toBe(1);
          expect(screen.getByText('항목 0').style.opacity).toBe('1');
        });
      });
    });

    describe('float', () => {
      it('등장이 끝나면 data-floating이 붙는다', () => {
        render(<BottomSheet {...defaultProps} enableDrag />);
        const sheet = screen.getByRole('dialog');

        expect(sheet).not.toHaveAttribute('data-floating');

        act(() => {
          timelineOf(sheet).progress(1);
        });
        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).not.toHaveAttribute('data-float-paused');
      });

      it('잡으면 data-floating은 남고 멈춤이 붙는다. 놓는 이벤트에서 바로 풀린다', () => {
        render(<BottomSheet {...defaultProps} enableDrag />);
        const sheet = screen.getByRole('dialog');
        act(() => {
          timelineOf(sheet).progress(1);
        });

        fireEvent.mouseDown(sheet, { button: 0, clientY: 100 });
        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).toHaveAttribute('data-float-paused');

        // 복귀 트윈(150ms)이 끝나기 전에 풀린다
        fireEvent.mouseUp(document, { clientY: 110 });
        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).not.toHaveAttribute('data-float-paused');
      });

      it('터치도 같다', () => {
        render(<BottomSheet {...defaultProps} enableDrag />);
        const sheet = screen.getByRole('dialog');
        act(() => {
          timelineOf(sheet).progress(1);
        });

        fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).toHaveAttribute('data-float-paused');

        fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 110 }] });
        expect(sheet).not.toHaveAttribute('data-float-paused');
      });

      it('놓은 직후 부모가 리렌더해 복귀 트윈이 죽어도 멈춤이 풀려 있다 (M1)', () => {
        const { rerender } = render(
          <BottomSheet {...defaultProps} onClose={() => {}} enableDrag />
        );
        const sheet = screen.getByRole('dialog');
        act(() => {
          timelineOf(sheet).progress(1);
        });

        fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
        fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 110 }] });
        // 새 onClose 함수: 드래그 effect가 정리되며 복귀 트윈을 죽인다
        rerender(
          <BottomSheet {...defaultProps} onClose={() => {}} enableDrag />
        );

        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).not.toHaveAttribute('data-float-paused');
      });

      it('드래그 도중 닫혔다 다시 열려도 등장이 끝나면 float이 돌고 멈춤이 없다 (M2)', () => {
        const { rerender } = render(
          <BottomSheet {...defaultProps} enableDrag />
        );
        const sheet = screen.getByRole('dialog');
        const timeline = timelineOf(sheet);
        act(() => {
          timeline.progress(0.5);
        });

        fireEvent.mouseDown(sheet, { button: 0, clientY: 100 });
        // 놓는 이벤트 없이 닫힌다
        rerender(<BottomSheet {...defaultProps} enableDrag open={false} />);
        expect(sheet).toHaveAttribute('data-float-paused');
        rerender(<BottomSheet {...defaultProps} enableDrag />);
        act(() => {
          timeline.progress(1);
        });

        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).not.toHaveAttribute('data-float-paused');
      });

      it('닫기를 시작하면 data-floating은 남고 멈춤이 붙는다', () => {
        const { rerender } = render(<BottomSheet {...defaultProps} />);
        const sheet = screen.getByRole('dialog');
        act(() => {
          timelineOf(sheet).progress(1);
        });
        expect(sheet).toHaveAttribute('data-floating');

        rerender(<BottomSheet {...defaultProps} open={false} />);

        expect(sheet).toHaveAttribute('data-floating');
        expect(sheet).toHaveAttribute('data-float-paused');
      });

      describe('축소 선호(트윈이 즉시 확정된다)', () => {
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

        it('게이트가 끝 상태로 확정하면 켜지고, 잡으면 멈추고, 놓으면 풀린다', () => {
          render(<BottomSheet {...defaultProps} enableDrag />);
          const sheet = screen.getByRole('dialog');
          expect(sheet).toHaveAttribute('data-floating');

          fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
          expect(sheet).toHaveAttribute('data-floating');
          expect(sheet).toHaveAttribute('data-float-paused');

          fireEvent.touchMove(sheet, { touches: [{ clientY: 160 }] });
          expect(sheet).toHaveAttribute('data-float-paused');

          fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 160 }] });
          expect(sheet).not.toHaveAttribute('data-float-paused');
        });

        it('문턱을 넘겨 놓아 부모가 닫으면 멈춘다', () => {
          const { rerender } = render(
            <BottomSheet {...defaultProps} enableDrag />
          );
          const sheet = screen.getByRole('dialog');

          fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
          fireEvent.touchMove(sheet, { touches: [{ clientY: 300 }] });
          fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 300 }] });
          expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
          rerender(<BottomSheet {...defaultProps} enableDrag open={false} />);

          expect(sheet).toHaveAttribute('data-floating');
          expect(sheet).toHaveAttribute('data-float-paused');
        });

        it('내용 시차도 끝 상태로 확정된다', () => {
          render(
            <BottomSheet {...defaultProps} title="제목">
              {items}
            </BottomSheet>
          );
          const first = screen.getByText('항목 0');

          expect(first.style.opacity).toBe('1');
          expect(first.style.transform).toBe('translate(0, 0)');
          expect(
            (
              screen.getByRole('dialog') as HTMLElement & {
                __bottomSheetStagger?: gsap.core.Timeline;
              }
            ).__bottomSheetStagger!.progress()
          ).toBe(1);
        });
      });

      it('CSS의 float keyframes는 translate만 쓰고 0%·100%가 쉬는 자리(0 0)다', () => {
        const source = readFileSync(
          resolve(__dirname, '../../_internal/sheetFloat.css.ts'),
          'utf-8'
        );
        const body = /keyframes\(\{([\s\S]*?)\n\}\);/.exec(source)![1];
        const frames = [...body.matchAll(/'([^']+)':\s*\{([^}]*)\}/g)];
        const declared = frames.flatMap((f) =>
          [...f[2].matchAll(/(\w+):/g)].map((m) => m[1])
        );

        expect(declared.length).toBeGreaterThan(0);
        expect(new Set(declared)).toEqual(new Set(['translate']));
        const rest = frames.find((f) => f[1] === '0%, 100%');
        expect(rest?.[2]).toMatch(/translate:\s*'0 0'/);
      });

      it('멈춤 규칙은 animation 단축 속성 뒤에 있어 play-state를 리셋당하지 않는다', () => {
        const source = readFileSync(
          resolve(__dirname, '../../_internal/sheetFloat.css.ts'),
          'utf-8'
        );
        const floating = source.indexOf("'&[data-floating]'");
        const paused = source.indexOf("'&[data-float-paused]'");

        expect(floating).toBeGreaterThan(-1);
        expect(paused).toBeGreaterThan(floating);
        expect(source).toMatch(/animationPlayState:\s*'paused'/);
      });
    });
  });

  describe('둥실거림 배선', () => {
    it('아래 시트는 floatClass.bottom을 붙이고 옆 시트의 것은 안 붙인다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');

      expect(sheet.className).toMatch(/floatClass_bottom__/);
      expect(sheet.className).not.toMatch(/floatClass_(left|right)__/);
      expect(sheet.className).toMatch(/sheetFloat_sheetFloat__/);
    });
  });

  describe('className 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      render(<BottomSheet {...defaultProps} className="custom-class" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('custom-class');
    });
  });

  describe('Compound API 테스트', () => {
    describe('BottomSheet.Header', () => {
      it('BottomSheet.Header가 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>Header Content</BottomSheet.Header>
            <BottomSheet.Content>Body Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(screen.getByText('Header Content')).toBeInTheDocument();
      });

      it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header showClose>Header</BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(
          screen.getByRole('button', { name: /닫기/i })
        ).toBeInTheDocument();
      });

      it('showClose 닫기 버튼 클릭 시 onClose가 호출된다', async () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header showClose>Header</BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        const closeButton = screen.getByRole('button', { name: /닫기/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('BottomSheet.Title', () => {
      it('BottomSheet.Title이 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>
              <BottomSheet.Title>제목입니다</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(screen.getByText('제목입니다')).toBeInTheDocument();
      });

      it('BottomSheet.Title이 h2 요소로 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>
              <BottomSheet.Title>제목</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        const title = screen.getByText('제목');
        expect(title.tagName).toBe('H2');
      });

      it('BottomSheet.Title이 dialog의 accessible name이 된다 (compound 경로)', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>
              <BottomSheet.Title>제목입니다</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(
          screen.getByRole('dialog', { name: '제목입니다' })
        ).toBeInTheDocument();
      });

      it('aria-labelledby를 직접 주면 BottomSheet.Title이 있어도 그 값이 우선한다', () => {
        render(
          <BottomSheet {...defaultProps} aria-labelledby="external-label">
            <span id="external-label">외부 레이블</span>
            <BottomSheet.Header>
              <BottomSheet.Title>내부 제목</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(
          screen.getByRole('dialog', { name: '외부 레이블' })
        ).toBeInTheDocument();
      });

      it('Title에 소비자 id를 줘도 dialog의 접근 가능 이름이 유지된다', () => {
        // Title의 id는 컴포넌트가 소유한다. 소비자 id가 이기면 루트의
        // aria-labelledby가 허공을 가리켜 접근 가능 이름이 조용히 사라진다.
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>
              <BottomSheet.Title id="my-heading">탈퇴 확인</BottomSheet.Title>
            </BottomSheet.Header>
          </BottomSheet>
        );
        expect(screen.getByRole('dialog')).toHaveAccessibleName('탈퇴 확인');
      });

      it('Title이 없으면 dangling IDREF가 되지만 이름 계산이 깨지지 않는다', () => {
        // compound 경로의 루트는 항상 생성 titleId를 가리킨다. 그 id를 가진
        // 요소가 없으면 accname 1.2는 그 단계를 건너뛴다 — 이름은 빈 문자열이고
        // id 문자열이 이름으로 새어 나오지 않는다. 라이브러리가 이 동작을 바꾸는
        // 날 여기서 잡힌다.
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Content>제목 없는 본문</BottomSheet.Content>
          </BottomSheet>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAccessibleName('');
      });
    });

    describe('BottomSheet.Content', () => {
      it('BottomSheet.Content가 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Content>내용입니다</BottomSheet.Content>
          </BottomSheet>
        );
        expect(screen.getByText('내용입니다')).toBeInTheDocument();
      });

      it('복잡한 컴포넌트를 Content로 렌더링할 수 있다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Content>
              <div>
                <button>버튼 1</button>
                <button>버튼 2</button>
              </div>
            </BottomSheet.Content>
          </BottomSheet>
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
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header showClose>
              <BottomSheet.Title>제목</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>내용</BottomSheet.Content>
          </BottomSheet>
        );
        expect(screen.getByText('제목')).toBeInTheDocument();
        expect(screen.getByText('내용')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /닫기/i })
        ).toBeInTheDocument();
      });

      it('showHandle과 함께 사용할 수 있다', () => {
        render(
          <BottomSheet {...defaultProps} showHandle>
            <BottomSheet.Header>
              <BottomSheet.Title>제목</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>내용</BottomSheet.Content>
          </BottomSheet>
        );
        const sheet = screen.getByRole('dialog');
        const handle = sheet.querySelector(
          '[data-testid="bottomsheet-handle"]'
        );
        expect(handle).toBeInTheDocument();
      });
    });
  });
});
