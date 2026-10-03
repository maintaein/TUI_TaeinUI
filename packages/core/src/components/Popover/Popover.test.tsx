import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Popover } from './Popover';

// 조항 3: 퇴장 = 등장 * 0.65. calc(duration.slow * 0.65) = 300ms * 0.65 = 195ms.
// Popover.tsx의 EXIT_DURATION_MS와 반드시 같은 값이어야 한다.
const EXIT_DURATION_MS = 195;

describe('Popover', () => {
  describe('렌더링 테스트', () => {
    it('children(트리거)이 렌더링된다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.getByText('트리거')).toBeInTheDocument();
    });

    it('기본 상태에서 content는 표시되지 않는다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
    });
  });

  describe('클릭 열기/닫기 테스트', () => {
    it('트리거 클릭 시 content가 표시된다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });

    describe('가짜 타이머 사용', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it('트리거를 다시 클릭하면 content가 닫힌다', async () => {
        render(
          <Popover content={<div>팝오버 내용</div>}>
            <button>트리거</button>
          </Popover>
        );

        fireEvent.click(screen.getByText('트리거'));
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        fireEvent.click(screen.getByText('트리거'));
        // 퇴장 전이(195ms) 동안엔 DOM이 즉시 사라지지 않는다. transition이
        // 재생될 자리가 있어야 한다(조항 1: 일회성 @keyframes 금지의 반대편).
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(EXIT_DURATION_MS - 1);
        });
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(1);
        });
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
      });
    });
  });

  describe('바깥 클릭 닫기 테스트', () => {
    describe('가짜 타이머 사용', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it('팝오버 외부를 클릭하면 닫힌다', async () => {
        render(
          <div>
            <Popover content={<div>팝오버 내용</div>}>
              <button>트리거</button>
            </Popover>
            <button>외부 버튼</button>
          </div>
        );

        fireEvent.click(screen.getByText('트리거'));
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByText('외부 버튼'));
        act(() => {
          vi.advanceTimersByTime(EXIT_DURATION_MS);
        });
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
      });
    });

    it('closeOnOutsideClick=false이면 외부 클릭으로 닫히지 않는다', async () => {
      render(
        <div>
          <Popover content={<div>팝오버 내용</div>} closeOnOutsideClick={false}>
            <button>트리거</button>
          </Popover>
          <button>외부 버튼</button>
        </div>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByText('외부 버튼'));
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });
  });

  describe('ESC 닫기 테스트', () => {
    describe('가짜 타이머 사용', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it('Escape 키를 누르면 팝오버가 닫힌다', async () => {
        render(
          <Popover content={<div>팝오버 내용</div>}>
            <button>트리거</button>
          </Popover>
        );

        fireEvent.click(screen.getByText('트리거'));
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        act(() => {
          vi.advanceTimersByTime(EXIT_DURATION_MS);
        });
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
      });
    });

    it('closeOnEscape=false이면 Escape로 닫히지 않는다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>} closeOnEscape={false}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });
  });

  describe('position prop 테스트', () => {
    it('기본 position은 "bottom"이다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_bottom/);
    });

    it('position="top"일 때 적절한 클래스가 적용된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} position="top">
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_top/);
    });

    it('position="left"일 때 적절한 클래스가 적용된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} position="left">
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_left/);
    });

    it('position="right"일 때 적절한 클래스가 적용된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} position="right">
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_right/);
    });
  });

  describe('제어 모드 테스트', () => {
    it('open=true이면 content가 표시된다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>} open={true}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });

    it('첫 렌더링부터 open=true이면 닫힘이 아닌 열림 위치 클래스를 갖는다', () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} open={true}>
          <button>트리거</button>
        </Popover>
      );

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_bottom/);
    });

    it('open=false이면 content가 숨겨진다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>} open={false}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
    });

    it('트리거 클릭 시 onOpenChange가 호출된다', async () => {
      const handleOpenChange = vi.fn();
      render(
        <Popover
          content={<div>팝오버 내용</div>}
          open={false}
          onOpenChange={handleOpenChange}
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });

    it('ESC 시 onOpenChange(false)가 호출된다', async () => {
      const handleOpenChange = vi.fn();
      render(
        <Popover
          content={<div>팝오버 내용</div>}
          open={true}
          onOpenChange={handleOpenChange}
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('비제어 모드 테스트', () => {
    describe('가짜 타이머 사용', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it('내부 상태로 열기/닫기가 동작한다', async () => {
        render(
          <Popover content={<div>팝오버 내용</div>}>
            <button>트리거</button>
          </Popover>
        );

        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('트리거'));
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        fireEvent.click(screen.getByText('트리거'));
        act(() => {
          vi.advanceTimersByTime(EXIT_DURATION_MS);
        });
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
      });
    });

    it('onOpenChange 콜백이 호출된다', async () => {
      const handleOpenChange = vi.fn();
      render(
        <Popover
          content={<div>팝오버 내용</div>}
          onOpenChange={handleOpenChange}
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(handleOpenChange).toHaveBeenCalledWith(true);

      fireEvent.click(screen.getByText('트리거'));
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('disabled 테스트', () => {
    it('disabled 상태에서 클릭해도 열리지 않는다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>} disabled>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('트리거에 aria-haspopup="dialog"가 설정된다', () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      const trigger = container.querySelector('[aria-haspopup="dialog"]');
      expect(trigger).toBeInTheDocument();
    });

    it('닫힌 상태에서 aria-expanded="false"이다', () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      const trigger = container.querySelector('[aria-expanded="false"]');
      expect(trigger).toBeInTheDocument();
    });

    it('열린 상태에서 aria-expanded="true"이다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const trigger = container.querySelector('[aria-expanded="true"]');
      expect(trigger).toBeInTheDocument();
    });

    it('팝오버에 role="dialog"가 있다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('트리거의 aria-controls가 팝오버 id와 연결된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = screen.getByRole('dialog');
      const popoverId = popover.getAttribute('id');
      const trigger = container.querySelector('[aria-controls]');
      expect(trigger?.getAttribute('aria-controls')).toBe(popoverId);
    });
  });

  describe('포커스 관리 테스트', () => {
    it('열릴 때 팝오버 내 첫 focusable 요소에 포커스된다', async () => {
      render(
        <Popover
          content={
            <div>
              <button>첫 번째</button>
              <button>두 번째</button>
            </div>
          }
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByText('첫 번째'));
      });
    });

    it('닫힐 때 트리거에 포커스가 복귀한다', async () => {
      render(
        <Popover
          content={
            <div>
              <button>내부 버튼</button>
            </div>
          }
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByText('내부 버튼'));
      });

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByText('트리거'));
      });
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 컨테이너에 적용된다', () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} className="custom-class">
          <button>트리거</button>
        </Popover>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('arrow prop 테스트', () => {
    it('arrow=true이면 화살표가 표시된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} arrow>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const arrowEl = container.querySelector('[data-popover-arrow]');
      expect(arrowEl).toBeInTheDocument();
    });

    it('기본적으로 화살표는 표시되지 않는다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const arrowEl = container.querySelector('[data-popover-arrow]');
      expect(arrowEl).not.toBeInTheDocument();
    });
  });

  describe('모션 잠금 — @keyframes 제거 + transform-origin', () => {
    // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
    // 읽는다. Popover.css.ts 소스 텍스트에서 직접 확인한다(BoardRow와 동일 관례).
    const cssSource = readFileSync(
      resolve(__dirname, './Popover.css.ts'),
      'utf-8'
    );

    it('@keyframes(fadeIn)가 없다 — 등장·퇴장 모두 transition이다', () => {
      expect(cssSource).not.toContain('keyframes');
      expect(cssSource).not.toContain('fadeIn');
      expect(cssSource).not.toContain('animation:');
    });

    it('transition: all이 없다', () => {
      expect(cssSource).not.toMatch(/transition:\s*['`]all/);
    });

    it("'use client'가 없다", () => {
      expect(cssSource).not.toContain('use client');
    });

    it.each([
      ['top', 'bottom center'],
      ['bottom', 'top center'],
      ['left', 'right center'],
      ['right', 'left center'],
    ])(
      'position="%s"일 때 transform-origin이 화살표 쪽(%s)이다',
      (position, origin) => {
        // positionStyles·positionOpenStyles 둘 다 같은 origin이어야 펼쳐지는
        // 방향이 유지된다 — 두 변형 모두에서 확인한다.
        const closedBlock = cssSource.match(
          /export const positionStyles = styleVariants\(\{([\s\S]*?)\n\}\);/
        )?.[1];
        const openBlock = cssSource.match(
          /export const positionOpenStyles = styleVariants\(\{([\s\S]*?)\n\}\);/
        )?.[1];
        expect(closedBlock, 'positionStyles 블록을 찾지 못했다').toBeDefined();
        expect(
          openBlock,
          'positionOpenStyles 블록을 찾지 못했다'
        ).toBeDefined();

        const closedVariant = (closedBlock as string).match(
          new RegExp(`${position}: \\{([\\s\\S]*?)\\n {2}\\},`)
        )?.[1];
        const openVariant = (openBlock as string).match(
          new RegExp(`${position}: \\{([\\s\\S]*?)\\n {2}\\},`)
        )?.[1];
        expect(
          closedVariant,
          `positionStyles.${position}을 찾지 못했다`
        ).toBeDefined();
        expect(
          openVariant,
          `positionOpenStyles.${position}을 찾지 못했다`
        ).toBeDefined();

        expect(closedVariant).toContain(`transformOrigin: '${origin}'`);
        expect(openVariant).toContain(`transformOrigin: '${origin}'`);
      }
    );

    it('퇴장 전이가 calc(duration.slow * 0.65) / easing.exit이다(리터럴 ms 금지)', () => {
      expect(cssSource).toContain(
        'calc(${themeContract.animation.duration.slow} * 0.65) ${themeContract.animation.easing.exit}'
      );
      expect(cssSource).not.toMatch(/(130|195)ms/);
    });

    it.each(['top', 'bottom', 'left', 'right'])(
      'position="%s" 닫힘 transform에 scale(0.6)이 있다(오버슛이 보일 만큼 작게 시작)',
      (position) => {
        const closed = variantOf('positionStyles', position);
        expect(closed).toMatch(/transform: '[^']*scale\(0\.6\)'/);
        expect(closed).not.toContain('scale(0.95)');
      }
    );

    it.each(['top', 'bottom', 'left', 'right'])(
      'position="%s" 열림 transform은 slow/snap, opacity는 fast/settle이다(커브가 다르다)',
      (position) => {
        const list = transitionOf(variantOf('positionOpenStyles', position));
        expect(list).toContain(
          'transform ${themeContract.animation.duration.slow} ${themeContract.animation.easing.snap}'
        );
        expect(list).toContain(
          'opacity ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}'
        );
      }
    );

    /** `styleVariants` 블록에서 방향 하나의 본문만 떼어낸다 — 파일 전체를
     * 훑으면 닫힘과 열림이 섞여 어느 쪽 값인지 못 가린다. */
    const variantOf = (
      block: 'positionStyles' | 'positionOpenStyles',
      position: string
    ): string => {
      const blockBody = cssSource.match(
        new RegExp(
          `export const ${block} = styleVariants\\(\\{([\\s\\S]*?)\\n\\}\\);`
        )
      )?.[1];
      expect(blockBody, `${block} 블록을 찾지 못했다`).toBeDefined();
      const variant = (blockBody as string).match(
        new RegExp(`${position}: \\{([\\s\\S]*?)\\n {2}\\},`)
      )?.[1];
      expect(variant, `${block}.${position}을 찾지 못했다`).toBeDefined();
      return variant as string;
    };

    /** 닫힘 변형의 `transition` 백틱 안쪽만 꺼낸다 — `visibility: 'hidden'`
     * 선언과 전이 목록의 `visibility`를 구분하기 위해서다. */
    const transitionOf = (variant: string): string => {
      const list = variant.match(/transition: `([^`]*)`/)?.[1];
      expect(list, 'transition 선언을 찾지 못했다').toBeDefined();
      return list as string;
    };

    it.each(['top', 'bottom', 'left', 'right'])(
      'position="%s" 닫힘 변형이 히트 테스트와 접근성 트리에서 빠진다(리뷰 I1)',
      (position) => {
        // shouldRender가 닫은 뒤에도 노드를 195ms 더 남긴다. opacity: 0은
        // 둘 중 어느 쪽에서도 요소를 빼지 않아서, 그 사이 클릭이 보이지 않는
        // 팝오버에 먹히고 Tab이 닫힌 dialog 안으로 들어간다.
        // 무엇을 뒤집으면 빨개지는가: 두 줄 중 하나라도 지우면.
        const closed = variantOf('positionStyles', position);
        expect(closed).toContain("pointerEvents: 'none'");
        expect(closed).toContain("visibility: 'hidden'");
      }
    );

    it.each(['top', 'bottom', 'left', 'right'])(
      'position="%s" 닫힘 변형의 visibility가 퇴장 길이를 다 쓴다 — 페이드가 살아 있다(리뷰 I1)',
      (position) => {
        // visibility는 한쪽 끝이 visible이면 중간값이 전부 visible이고 p=1에서만
        // 넘어간다. 그래서 퇴장과 같은 길이를 주면 페이드가 다 보인 뒤에 숨는다.
        // 무엇을 뒤집으면 빨개지는가: 길이를 0s로 바꾸면(= 페이드가 통째로 죽는다).
        const list = transitionOf(variantOf('positionStyles', position));
        expect(list).toContain(
          'visibility calc(${themeContract.animation.duration.slow} * 0.65) ${themeContract.animation.easing.exit}'
        );
        expect(list).not.toContain('visibility 0s');
      }
    );

    it.each(['top', 'bottom', 'left', 'right'])(
      'position="%s" 열림 변형은 지연 없이 즉시 visible이다(리뷰 I1)',
      (position) => {
        // 열림 쪽 목록에 visibility가 있으면 열 때도 끝에서 넘어가 첫 프레임이
        // 안 보인다 — 등장 페이드가 죽는다.
        // 무엇을 뒤집으면 빨개지는가: 열림 transition에 visibility를 끼워 넣으면.
        const open = variantOf('positionOpenStyles', position);
        expect(open).toContain("visibility: 'visible'");
        expect(transitionOf(open)).not.toContain('visibility');
      }
    );
  });

  describe('조항 1 — 중단 가능·역재생 가능', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('퇴장 도중 다시 열면 언마운트 타이머가 취소되고 DOM이 유지된다(현재 위치에서 이어진다)', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

      // 닫는다. 퇴장 타이머(195ms)가 예약된다.
      fireEvent.click(screen.getByText('트리거'));

      // 타이머가 끝나기 전에(예: 100ms) 다시 연다. 처음부터 다시 마운트되는
      // 게 아니라 같은 DOM 노드가 계속 살아 있어야 한다(조항 1 ③).
      act(() => {
        vi.advanceTimersByTime(100);
      });
      const popoverBeforeReopen = screen.getByText('팝오버 내용');
      fireEvent.click(screen.getByText('트리거'));
      expect(screen.getByText('팝오버 내용')).toBe(popoverBeforeReopen);

      // 원래 퇴장 타이머가 그대로 발화했다면 이 시점에 사라졌을 것이다 —
      // 취소되지 않았다면 실패한다.
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });
  });
});
