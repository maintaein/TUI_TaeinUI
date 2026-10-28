import { createRef } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './CopyButton';
import { loop } from '../../tokens/animation.css';

const RESET_MS = Number.parseFloat(loop.base);

/** userEvent.setup()가 붙인 클립보드를 걷어 jsdom 기본(클립보드 없음)으로 돌린다 */
const removeClipboard = (): void => {
  Object.defineProperty(navigator, 'clipboard', {
    value: undefined,
    configurable: true,
  });
};

/** 쓰기를 거절하는 클립보드. 권한이 막힌 브라우저와 같은 경로다 */
const denyClipboard = (): void => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.reject(new Error('denied')) },
    configurable: true,
  });
};

const live = () => screen.getByRole('status');
/** 지금 보이는(data-shown) 글자 */
const shown = (container: HTMLElement) =>
  container.querySelector('[data-text][data-shown]')?.textContent;
/** 클립보드 쓰기는 비동기라 결과 글자는 클릭이 끝난 뒤 마이크로태스크에서 나타난다 */
const liveText = (text: string) =>
  waitFor(() => expect(live()).toHaveTextContent(text));

afterEach(() => {
  vi.useRealTimers();
  removeClipboard();
});

describe('CopyButton', () => {
  describe('성공 경로', () => {
    it('누르면 클립보드에 value가 들어가고 live 영역이 copiedLabel을 읽고 onCopy(true)가 불린다', async () => {
      const user = userEvent.setup();
      const onCopy = vi.fn();
      const { container } = render(
        <CopyButton value="pnpm add @taein-ui/core" onCopy={onCopy} />
      );
      expect(live()).toBeEmptyDOMElement();
      await user.click(screen.getByRole('button'));
      expect(await navigator.clipboard.readText()).toBe(
        'pnpm add @taein-ui/core'
      );
      await liveText('복사됨');
      expect(shown(container)).toBe('복사됨');
      expect(onCopy).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('문구 prop을 바꿀 수 있다', async () => {
      const user = userEvent.setup();
      render(<CopyButton value="x" label="링크 복사" copiedLabel="됐습니다" />);
      await user.click(screen.getByRole('button', { name: '링크 복사' }));
      await liveText('됐습니다');
    });

    it('접근 가능한 이름은 성공 뒤에도 label이다', async () => {
      const user = userEvent.setup();
      render(<CopyButton value="x" />);
      expect(screen.getByRole('button', { name: '복사' })).toBeInTheDocument();
      await user.click(screen.getByRole('button'));
      await liveText('복사됨');
      expect(screen.getByRole('button', { name: '복사' })).toBeInTheDocument();
    });
  });

  describe('실패 경로', () => {
    it('클립보드가 없으면 live 영역이 failedLabel이고 copiedLabel은 나오지 않고 onCopy(false)다', async () => {
      const onCopy = vi.fn();
      const { container } = render(<CopyButton value="x" onCopy={onCopy} />);
      expect(navigator.clipboard).toBeUndefined();
      fireEvent.click(screen.getByRole('button'));
      await liveText('복사 실패');
      expect(live()).not.toHaveTextContent('복사됨');
      expect(shown(container)).toBe('복사 실패');
      expect(onCopy).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('클립보드가 쓰기를 거절해도 실패 경로다', async () => {
      denyClipboard();
      const onCopy = vi.fn();
      render(<CopyButton value="x" failedLabel="안 됨" onCopy={onCopy} />);
      fireEvent.click(screen.getByRole('button'));
      await liveText('안 됨');
      expect(onCopy).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('실패 뒤에도 접근 가능한 이름은 label이다', async () => {
      render(<CopyButton value="x" />);
      fireEvent.click(screen.getByRole('button'));
      await liveText('복사 실패');
      expect(screen.getByRole('button', { name: '복사' })).toBeInTheDocument();
    });
  });

  describe('되돌아옴', () => {
    // 가짜 타이머에서는 React의 효과 예약도 가짜 시계를 타서, act 밖에서 난 갱신의 효과(되돌림 타이머)가
    // 시계를 돌려야 등록된다. 누름을 act로 감싸 효과까지 끝낸 뒤 시계를 돌린다.
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    const press = (user: ReturnType<typeof userEvent.setup>) =>
      act(async () => {
        await user.click(screen.getByRole('button'));
      });

    it('loop.base 뒤에 live 영역이 비고 보이는 글자가 label로 돌아온다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { container } = render(<CopyButton value="x" />);
      await press(user);
      expect(live()).toHaveTextContent('복사됨');
      act(() => {
        vi.advanceTimersByTime(RESET_MS - 100);
      });
      expect(live()).toHaveTextContent('복사됨');
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(live()).toBeEmptyDOMElement();
      expect(shown(container)).toBe('복사');
    });

    it('실패도 같은 시간 뒤에 돌아온다', async () => {
      const { container } = render(<CopyButton value="x" />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });
      expect(live()).toHaveTextContent('복사 실패');
      act(() => {
        vi.advanceTimersByTime(RESET_MS + 100);
      });
      expect(live()).toBeEmptyDOMElement();
      expect(shown(container)).toBe('복사');
    });

    it('복사됨 동안 다시 누르면 다시 복사하고 타이머를 처음부터 센다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onCopy = vi.fn();
      render(<CopyButton value="x" onCopy={onCopy} />);
      await press(user);
      act(() => {
        vi.advanceTimersByTime(RESET_MS - 400);
      });
      await press(user);
      expect(onCopy).toHaveBeenCalledTimes(2);
      // 첫 누름 기준이면 이미 끝났을 시각이다
      act(() => {
        vi.advanceTimersByTime(RESET_MS - 400);
      });
      expect(live()).toHaveTextContent('복사됨');
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(live()).toBeEmptyDOMElement();
    });

    it('언마운트하면 타이머가 정리된다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { unmount } = render(<CopyButton value="x" />);
      await press(user);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('낭독과 호출 순서', () => {
    it('다시 눌러 같은 결과가 이어져도 live 영역 안 노드가 새로 서서 다시 읽힌다', async () => {
      const user = userEvent.setup();
      render(<CopyButton value="x" />);
      await user.click(screen.getByRole('button'));
      await liveText('복사됨');
      const first = live().firstElementChild;
      expect(first).not.toBeNull();
      await user.click(screen.getByRole('button'));
      await waitFor(() => expect(live().firstElementChild).not.toBe(first));
      expect(live()).toHaveTextContent('복사됨');
    });

    it('연속 실패도 노드가 새로 선다', async () => {
      render(<CopyButton value="x" />);
      fireEvent.click(screen.getByRole('button'));
      await liveText('복사 실패');
      const first = live().firstElementChild;
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => expect(live().firstElementChild).not.toBe(first));
      expect(live()).toHaveTextContent('복사 실패');
    });

    // 계약: demo 시연(CopyButtonPage의 rehearse)은 onClick에서 가짜 클립보드를 끼우고 마이크로태스크에서
    // 거둔다. core가 onClick 직후 같은 틱에 navigator.clipboard를 읽어야 그 가짜가 쓰인다.
    it('onClick 직후 같은 틱에 navigator.clipboard를 읽는다', async () => {
      const onCopy = vi.fn();
      render(
        <CopyButton
          value="x"
          onCopy={onCopy}
          onClick={() => {
            Object.defineProperty(navigator, 'clipboard', {
              value: { writeText: () => Promise.resolve() },
              configurable: true,
            });
            queueMicrotask(removeClipboard);
          }}
        />
      );
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
      expect(onCopy).toHaveBeenCalledWith(true);
    });
  });

  describe('입력 규칙', () => {
    it('disabled면 복사하지 않는다', async () => {
      const user = userEvent.setup();
      const onCopy = vi.fn();
      render(<CopyButton value="x" disabled onCopy={onCopy} />);
      await user.click(screen.getByRole('button'));
      expect(onCopy).not.toHaveBeenCalled();
      expect(await navigator.clipboard.readText()).toBe('');
      expect(live()).toBeEmptyDOMElement();
    });

    it('소비자 onClick이 preventDefault하면 복사하지 않는다', async () => {
      const user = userEvent.setup();
      const onCopy = vi.fn();
      render(
        <CopyButton
          value="x"
          onCopy={onCopy}
          onClick={(event) => event.preventDefault()}
        />
      );
      await user.click(screen.getByRole('button'));
      expect(onCopy).not.toHaveBeenCalled();
      expect(await navigator.clipboard.readText()).toBe('');
      expect(live()).toBeEmptyDOMElement();
    });

    it('onClick이 막지 않으면 onClick 다음에 복사한다', async () => {
      const user = userEvent.setup();
      const order: string[] = [];
      render(
        <CopyButton
          value="x"
          onCopy={() => order.push('copy')}
          onClick={() => order.push('click')}
        />
      );
      await user.click(screen.getByRole('button'));
      expect(order).toEqual(['click', 'copy']);
    });

    it('ref는 밑의 button으로 가고 className과 네이티브 속성이 닿는다', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <CopyButton value="x" ref={ref} className="mine" data-testid="cb" />
      );
      expect(ref.current).toBe(screen.getByRole('button'));
      expect(ref.current).toHaveClass('mine');
      expect(ref.current).toHaveAttribute('data-testid', 'cb');
      expect(ref.current).toHaveAttribute('type', 'button');
    });
  });

  describe('접근성 구조', () => {
    it('live 영역은 polite이고 아이콘은 장식이다', () => {
      render(<CopyButton value="x" />);
      expect(live()).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByRole('button').querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('label이 아닌 두 글자는 낭독에서 빠진다', () => {
      const { container } = render(<CopyButton value="x" />);
      const texts = [...container.querySelectorAll('[data-text]')];
      expect(texts.map((t) => t.textContent)).toEqual([
        '복사',
        '복사됨',
        '복사 실패',
      ]);
      expect(texts.map((t) => t.getAttribute('aria-hidden'))).toEqual([
        null,
        'true',
        'true',
      ]);
    });
  });

  describe('움직임 줄이기 (CSS 소스 단언)', () => {
    // jsdom은 vanilla-extract 클래스의 계산값을 못 읽는다. 소스 텍스트로 본다.
    const css = readFileSync(resolve(__dirname, 'CopyButton.css.ts'), 'utf-8');
    // 축소 모션 규칙은 [REDUCED] 상수로 건다. 그 뒤 한 블록(500자)씩 읽는다.
    const blocks = css
      .split('[REDUCED]')
      .slice(1)
      .map((rest) => rest.slice(0, 500));

    it('글자와 아이콘의 이동·회전은 축소 모션에서 transform none이고 흔들림은 animation none이다', () => {
      // 글자 스타일, 아이콘 스타일, 체크 선, 흔들림
      expect(blocks).toHaveLength(4);
      // 선택자(selectors) 앞이 블록의 최상위 규칙이다. 안쪽 '&[data-shown]'의 같은 글자와 구분한다
      expect(blocks[0].split('selectors')[0]).toMatch(/transform: 'none'/);
      expect(blocks[1].split('selectors')[0]).toMatch(/transform: 'none'/);
      // 보이는 쪽도 이동이 없어야 한다
      expect(blocks[0]).toMatch(/selectors: \{[^}]*transform: 'none'/);
      expect(blocks[1]).toMatch(/selectors: \{[^}]*transform: 'none'/);
      expect(blocks[2]).toMatch(/transition: 'none'/);
      expect(blocks[3]).toMatch(/animation: 'none'/);
    });

    it('축소 모션에서 남기는 글자·아이콘 전이는 opacity뿐이다', () => {
      for (const block of blocks.slice(0, 2)) {
        const transition = /transition: `([^`]*)`/.exec(block)?.[1];
        expect(transition).toMatch(/^opacity /);
        expect(transition).not.toMatch(/transform|,/);
      }
    });
  });
});
