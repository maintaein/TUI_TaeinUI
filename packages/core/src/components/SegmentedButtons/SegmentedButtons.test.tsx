import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedButtons } from './SegmentedButtons';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { themeContract } from '../../tokens/theme.css';
import { themeTokens } from '../../tokens/contract';
import { contrastRatio, AA_TEXT, AA_UI } from '../../docs/llmsSections';

describe('SegmentedButtons', () => {
  const options = [
    { value: 'option1', label: '옵션 1' },
    { value: 'option2', label: '옵션 2' },
    { value: 'option3', label: '옵션 3' },
  ];

  describe('렌더링 테스트', () => {
    it('기본적으로 렌더링된다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '옵션 1' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '옵션 2' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '옵션 3' })).toBeInTheDocument();
    });

    it('모든 옵션을 렌더링한다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );

      options.forEach((option) => {
        expect(
          screen.getByRole('radio', { name: option.label })
        ).toBeInTheDocument();
      });
    });

    it('선택된 옵션이 체크된 상태로 표시된다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option2"
          onChange={() => {}}
        />
      );

      const selectedButton = screen.getByRole('radio', { name: '옵션 2' });
      expect(selectedButton).toBeChecked();
    });

    it('선택되지 않은 옵션은 체크되지 않은 상태로 표시된다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option2"
          onChange={() => {}}
        />
      );

      const unselectedButton1 = screen.getByRole('radio', { name: '옵션 1' });
      const unselectedButton3 = screen.getByRole('radio', { name: '옵션 3' });

      expect(unselectedButton1).not.toBeChecked();
      expect(unselectedButton3).not.toBeChecked();
    });
  });

  describe('size prop 테스트', () => {
    it('size="sm"을 적용한다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
          size="sm"
        />
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup.className).toContain('sm');
    });

    it('size="md"를 기본값으로 적용한다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup.className).toContain('md');
    });

    it('size="lg"를 적용한다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
          size="lg"
        />
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup.className).toContain('lg');
    });
  });

  describe('fullWidth prop 테스트', () => {
    it('fullWidth가 true이면 전체 너비를 사용한다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
          fullWidth
        />
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup.className).toContain('fullWidth');
    });

    it('fullWidth가 false이면 기본 너비를 사용한다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup.className).not.toContain('fullWidth');
    });
  });

  describe('disabled prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
          disabled
        />
      );

      const buttons = screen.getAllByRole('radio');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('개별 옵션을 비활성화할 수 있다', () => {
      const optionsWithDisabled = [
        { value: 'option1', label: '옵션 1' },
        { value: 'option2', label: '옵션 2', disabled: true },
        { value: 'option3', label: '옵션 3' },
      ];

      render(
        <SegmentedButtons
          options={optionsWithDisabled}
          value="option1"
          onChange={() => {}}
        />
      );

      const button2 = screen.getByRole('radio', { name: '옵션 2' });
      expect(button2).toBeDisabled();

      const button1 = screen.getByRole('radio', { name: '옵션 1' });
      const button3 = screen.getByRole('radio', { name: '옵션 3' });
      expect(button1).not.toBeDisabled();
      expect(button3).not.toBeDisabled();
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('옵션 클릭 시 onChange가 호출된다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={handleChange}
        />
      );

      const option2 = screen.getByRole('radio', { name: '옵션 2' });
      await user.click(option2);

      expect(handleChange).toHaveBeenCalledWith('option2');
    });

    it('이미 선택된 옵션을 클릭해도 onChange가 호출된다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={handleChange}
        />
      );

      const option1Label = screen
        .getByRole('radio', { name: '옵션 1' })
        .closest('label')!;
      await user.click(option1Label);

      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('disabled 상태에서는 onChange가 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={handleChange}
          disabled
        />
      );

      const option2 = screen.getByRole('radio', { name: '옵션 2' });
      await user.click(option2);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('개별 옵션이 disabled인 경우 onChange가 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const optionsWithDisabled = [
        { value: 'option1', label: '옵션 1' },
        { value: 'option2', label: '옵션 2', disabled: true },
        { value: 'option3', label: '옵션 3' },
      ];

      render(
        <SegmentedButtons
          options={optionsWithDisabled}
          value="option1"
          onChange={handleChange}
        />
      );

      const option2 = screen.getByRole('radio', { name: '옵션 2' });
      await user.click(option2);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('접근성 테스트', () => {
    it('radiogroup role을 가진다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('각 옵션은 radio role을 가진다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });

    it('aria-label을 설정할 수 있다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
          aria-label="옵션 선택"
        />
      );

      const radiogroup = screen.getByRole('radiogroup', { name: '옵션 선택' });
      expect(radiogroup).toBeInTheDocument();
    });

    it('선택된 상태가 스크린 리더에 전달된다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option2"
          onChange={() => {}}
        />
      );

      const selectedButton = screen.getByRole('radio', { name: '옵션 2' });
      expect(selectedButton).toHaveAttribute('aria-checked', 'true');
    });

    it('비활성화 상태가 스크린 리더에 전달된다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
          disabled
        />
      );

      const buttons = screen.getAllByRole('radio');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-disabled', 'true');
      });
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Tab 키로 포커스할 수 있다', async () => {
      const user = userEvent.setup();

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );

      await user.tab();
      const firstButton = screen
        .getByRole('radio', { name: '옵션 1' })
        .closest('label');
      expect(firstButton).toHaveFocus();
    });

    it('Arrow Right 키로 다음 옵션으로 이동하고 선택된다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={handleChange}
        />
      );

      const firstButton = screen
        .getByRole('radio', { name: '옵션 1' })
        .closest('label');
      firstButton?.focus();

      await user.keyboard('{ArrowRight}');

      const secondButton = screen
        .getByRole('radio', { name: '옵션 2' })
        .closest('label');
      expect(secondButton).toHaveFocus();
      expect(handleChange).toHaveBeenCalledWith('option2');
    });

    it('Arrow Left 키로 이전 옵션으로 이동하고 선택된다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option2"
          onChange={handleChange}
        />
      );

      const secondButton = screen
        .getByRole('radio', { name: '옵션 2' })
        .closest('label');
      secondButton?.focus();

      await user.keyboard('{ArrowLeft}');

      const firstButton = screen
        .getByRole('radio', { name: '옵션 1' })
        .closest('label');
      expect(firstButton).toHaveFocus();
      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('첫 번째 옵션에서 Arrow Left 키를 누르면 마지막 옵션으로 이동한다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={handleChange}
        />
      );

      const firstButton = screen
        .getByRole('radio', { name: '옵션 1' })
        .closest('label');
      firstButton?.focus();

      await user.keyboard('{ArrowLeft}');

      const lastButton = screen
        .getByRole('radio', { name: '옵션 3' })
        .closest('label');
      expect(lastButton).toHaveFocus();
      expect(handleChange).toHaveBeenCalledWith('option3');
    });

    it('마지막 옵션에서 Arrow Right 키를 누르면 첫 번째 옵션으로 이동한다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option3"
          onChange={handleChange}
        />
      );

      const lastButton = screen
        .getByRole('radio', { name: '옵션 3' })
        .closest('label');
      lastButton?.focus();

      await user.keyboard('{ArrowRight}');

      const firstButton = screen
        .getByRole('radio', { name: '옵션 1' })
        .closest('label');
      expect(firstButton).toHaveFocus();
      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('Space 키로 옵션을 선택할 수 있다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={handleChange}
        />
      );

      const secondButton = screen.getByRole('radio', { name: '옵션 2' });
      secondButton.focus();

      await user.keyboard(' ');

      expect(handleChange).toHaveBeenCalledWith('option2');
    });

    it('disabled 상태에서는 키보드 조작이 불가능하다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={handleChange}
          disabled
        />
      );

      const firstButton = screen.getByRole('radio', { name: '옵션 1' });
      firstButton.focus();

      await user.keyboard('{ArrowRight}');
      await user.keyboard(' ');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('아이콘 지원 테스트', () => {
    it('옵션에 아이콘을 표시할 수 있다', () => {
      const optionsWithIcons = [
        {
          value: 'option1',
          label: '옵션 1',
          icon: <span data-testid="icon-1">🏠</span>,
        },
        {
          value: 'option2',
          label: '옵션 2',
          icon: <span data-testid="icon-2">⭐</span>,
        },
      ];

      render(
        <SegmentedButtons
          options={optionsWithIcons}
          value="option1"
          onChange={() => {}}
        />
      );

      // 아이콘은 표시 안의 라벨 한 벌에도 있어서 진짜 라벨 범위로 좁힌다.
      const labelOf = (name: string) =>
        screen.getByRole('radio', { name }).closest('label')!;
      expect(
        within(labelOf('옵션 1')).getByTestId('icon-1')
      ).toBeInTheDocument();
      expect(
        within(labelOf('옵션 2')).getByTestId('icon-2')
      ).toBeInTheDocument();
    });

    it('아이콘만 있는 옵션을 렌더링할 수 있다', () => {
      const iconOnlyOptions = [
        {
          value: 'option1',
          label: '홈',
          icon: <span data-testid="icon-1">🏠</span>,
          iconOnly: true,
        },
        {
          value: 'option2',
          label: '즐겨찾기',
          icon: <span data-testid="icon-2">⭐</span>,
          iconOnly: true,
        },
      ];

      render(
        <SegmentedButtons
          options={iconOnlyOptions}
          value="option1"
          onChange={() => {}}
        />
      );

      // 아이콘은 표시 안의 라벨 한 벌에도 있어서 진짜 라벨 범위로 좁힌다.
      const labelOf = (name: string) =>
        screen.getByRole('radio', { name }).closest('label')!;
      expect(within(labelOf('홈')).getByTestId('icon-1')).toBeInTheDocument();
      expect(
        within(labelOf('즐겨찾기')).getByTestId('icon-2')
      ).toBeInTheDocument();

      expect(screen.queryByText('홈')).not.toBeInTheDocument();
      expect(screen.queryByText('즐겨찾기')).not.toBeInTheDocument();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('옵션이 1개만 있어도 렌더링된다', () => {
      const singleOption = [{ value: 'only', label: '유일한 옵션' }];

      render(
        <SegmentedButtons
          options={singleOption}
          value="only"
          onChange={() => {}}
        />
      );

      expect(
        screen.getByRole('radio', { name: '유일한 옵션' })
      ).toBeInTheDocument();
    });

    it('많은 옵션도 렌더링할 수 있다', () => {
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `option${i}`,
        label: `옵션 ${i + 1}`,
      }));

      render(
        <SegmentedButtons
          options={manyOptions}
          value="option0"
          onChange={() => {}}
        />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(10);
    });

    it('value가 options에 없으면 선택된 옵션이 없다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="nonexistent"
          onChange={() => {}}
        />
      );

      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).not.toBeChecked();
      });
    });

    it('className을 추가할 수 있다', () => {
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
          className="custom-class"
        />
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup.className).toContain('custom-class');
    });
  });

  describe('비제어 모드 (Uncontrolled Mode) 테스트', () => {
    it('defaultValue로 초기 선택을 설정한다', () => {
      render(<SegmentedButtons options={options} defaultValue="option2" />);

      const option2 = screen.getByRole('radio', { name: '옵션 2' });
      expect(option2).toBeChecked();
    });

    it('defaultValue 없으면 첫 번째 옵션이 선택된다', () => {
      render(<SegmentedButtons options={options} />);

      const option1 = screen.getByRole('radio', { name: '옵션 1' });
      expect(option1).toBeChecked();
    });

    it('클릭 시 내부 상태가 업데이트된다', () => {
      render(<SegmentedButtons options={options} defaultValue="option1" />);

      const option1 = screen.getByRole('radio', { name: '옵션 1' });
      const option3 = screen.getByRole('radio', { name: '옵션 3' });

      expect(option1).toBeChecked();

      // option3의 label 클릭
      const option3Label = option3.closest('label');
      if (option3Label) fireEvent.click(option3Label);

      expect(option3).toBeChecked();
      expect(option1).not.toBeChecked();
    });

    it('onChange 콜백을 호출한다', () => {
      const handleChange = vi.fn();
      render(
        <SegmentedButtons
          options={options}
          defaultValue="option1"
          onChange={handleChange}
        />
      );

      const option2 = screen.getByRole('radio', { name: '옵션 2' });
      const option2Label = option2.closest('label');
      if (option2Label) fireEvent.click(option2Label);

      expect(handleChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('제어 모드 (Controlled Mode) 테스트', () => {
    it('value prop으로 선택을 제어한다', () => {
      const { rerender } = render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={vi.fn()}
        />
      );

      const option1 = screen.getByRole('radio', { name: '옵션 1' });
      expect(option1).toBeChecked();

      rerender(
        <SegmentedButtons
          options={options}
          value="option3"
          onChange={vi.fn()}
        />
      );

      const option3 = screen.getByRole('radio', { name: '옵션 3' });
      expect(option3).toBeChecked();
    });

    it('클릭 시 onChange를 호출하지만 내부 상태는 변하지 않는다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={handleChange}
        />
      );

      const option1 = screen.getByRole('radio', { name: '옵션 1' });
      const option2 = screen.getByRole('radio', { name: '옵션 2' });

      const option2Label = option2.closest('label');
      if (option2Label) await user.click(option2Label);

      expect(handleChange).toHaveBeenCalledWith('option2');
      // 부모가 업데이트하지 않으면 여전히 option1이 선택됨
      expect(option1).toBeChecked();
    });
  });

  describe('개발 환경 경고 테스트', () => {
    it('value와 defaultValue 동시 사용 시 경고한다', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      render(
        <SegmentedButtons
          options={options}
          value="option1"
          defaultValue="option2"
          onChange={vi.fn()}
        />
      );

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          'value와 defaultValue를 동시에 사용할 수 없습니다'
        )
      );

      consoleWarn.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  /**
   * 표시를 두 가장자리 L·R의 `clip-path`로 그린다(M5 task-19, 고무).
   *
   * jsdom은 레이아웃이 없어 getBoundingClientRect가 항상 0을 준다(환경
   * 보급 필요, Modal.test.tsx 선례). GSAP 티커는 rAF 기반이라 가짜 타이머로
   * 못 돌린다, 실제 타임라인을 `.time()`으로 seek해서 단언한다
   * (무모킹, Snackbar.test.tsx 선례). 타임라인은 공개 API로 안 나가고
   * `__indicatorTimeline`이라는 테스트 전용 통로로만 읽는다.
   */
  describe('GSAP 인디케이터 (M5 task-19 고무)', () => {
    type IndicatorTimelineHost = HTMLElement & {
      __indicatorTimeline?: gsap.core.Timeline;
    };

    const getIndicator = (container: HTMLElement): IndicatorTimelineHost =>
      container.querySelector(
        '[class*="SegmentedButtons_activeIndicator__"]'
      ) as IndicatorTimelineHost;

    /** `inset(0 calc(100% - Rpx) 0 Lpx round …)`에서 두 가장자리를 읽는다. */
    const readEdges = (el: HTMLElement): { l: number; r: number } => {
      const match = el.style.clipPath.match(
        /inset\(\S+ calc\(100% - ([-\d.e]+)px\) \S+ ([-\d.e]+)px round /
      );
      if (!match) {
        throw new Error(`clip-path를 읽을 수 없다: ${el.style.clipPath}`);
      }
      return { l: Number(match[2]), r: Number(match[1]) };
    };

    /** 0.15 + 0.3이 0.44999...로 나오는 부동소수 꼬리를 걷는다. */
    const round = (seconds: number): number => Number(seconds.toFixed(6));

    /** 타임라인 자식 트윈 하나를 대상 가장자리·시점·길이·커브·끝값으로 풀어 쓴다. */
    const describeTween = (tween: gsap.core.Tween) => ({
      to: Object.fromEntries(
        Object.entries(tween.vars).filter(([key]) => key === 'l' || key === 'r')
      ),
      start: round(tween.startTime()),
      duration: round(tween.duration()),
      ease: tween.vars.ease,
    });

    /** label 텍스트별로 rect를 채워 넣는다(환경 보급, Modal.test.tsx 선례). */
    const installLabelRects = (
      rects: Record<string, { left: number; width: number }>
    ): void => {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: Element) {
          const toRect = (box: { left: number; width: number }): DOMRect =>
            ({
              left: box.left,
              top: 0,
              width: box.width,
              height: 40,
              right: box.left + box.width,
              bottom: 40,
              x: box.left,
              y: 0,
              toJSON: () => box,
            }) as DOMRect;

          if (this.tagName === 'LABEL') {
            const rect = rects[this.textContent ?? ''];
            if (rect) return toRect(rect);
          }
          return toRect({ left: 0, width: 0 });
        }
      );
    };

    /** jsdom은 matchMedia를 구현하지 않는다, 축소 선호 경로를 열려면 깔아야 한다. */
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

    /** 선호를 도중에 켜고 끌 수 있는 matchMedia. change 리스너는 EventTarget이 실제로 부른다. */
    const installTogglableReducedMotion = (initial: boolean) => {
      const query = Object.assign(new EventTarget(), {
        matches: initial,
        media: '(prefers-reduced-motion: reduce)',
        setMatches(next: boolean) {
          query.matches = next;
          query.dispatchEvent(new Event('change'));
        },
      });
      vi.stubGlobal('matchMedia', () => query as unknown as MediaQueryList);
      return query;
    };

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    const rects = {
      '옵션 1': { left: 0, width: 80 },
      '옵션 2': { left: 84, width: 80 },
      '옵션 3': { left: 168, width: 80 },
    };

    const renderAt = (value: string) => {
      const view = render(
        <SegmentedButtons options={options} value={value} onChange={() => {}} />
      );
      return {
        ...view,
        indicator: getIndicator(view.container),
        moveTo: (next: string) =>
          view.rerender(
            <SegmentedButtons
              options={options}
              value={next}
              onChange={() => {}}
            />
          ),
      };
    };

    it('마운트 시엔 선택 칸 자리에 바로 앉고 타임라인이 없다 (위험 4)', () => {
      installLabelRects(rects);
      const { indicator } = renderAt('option1');

      expect(readEdges(indicator)).toEqual({ l: 0, r: 80 });
      expect(indicator.__indicatorTimeline).toBeUndefined();
    });

    it('쉬는 자리의 clip-path가 선택 칸과 일치하고 둥근 모서리는 토큰 반경이다', () => {
      installLabelRects(rects);
      const { indicator } = renderAt('option2');

      expect(readEdges(indicator)).toEqual({ l: 84, r: 164 });
      expect(indicator.style.clipPath).toMatch(/round calc\(var\(--/);
    });

    it('쉬는 자리의 둥근 모서리는 트랙 반경(lg)에서 inset(1px)을 뺀 같은 중심의 곡선이다', () => {
      installLabelRects(rects);
      const { indicator } = renderAt('option2');

      expect(indicator.style.clipPath).toContain(
        `round calc(${themeContract.borderRadius.lg} - 1px)`
      );
    });

    it('표시는 x·width·scaleX를 더 쓰지 않는다', () => {
      installLabelRects(rects);
      const { indicator, moveTo } = renderAt('option1');
      moveTo('option2');
      act(() => {
        indicator.__indicatorTimeline!.progress(0.3);
      });

      expect(indicator.style.transform).toBe('');
      expect(indicator.style.width).toBe('');
    });

    it('value가 options에 없으면 표시가 폭 0으로 숨는다', () => {
      installLabelRects(rects);
      const { indicator } = renderAt('nonexistent');
      const { l, r } = readEdges(indicator);

      expect(r - l).toBe(0);
    });

    it('오른쪽으로 옮기면 다섯 단계가 한 타임라인에 표대로 들어간다', () => {
      installLabelRects(rects);
      const { indicator, moveTo } = renderAt('option1');
      moveTo('option2');
      const children = indicator.__indicatorTimeline!.getChildren(
        false
      ) as gsap.core.Tween[];

      expect(children.map(describeTween)).toEqual([
        // 1. 늘어남: 옛 칸과 새 칸의 합집합
        {
          to: { l: 0, r: 164 },
          start: 0,
          duration: gsapDuration.base,
          ease: gsapEasing.settle,
        },
        // 2~3. 앞 가장자리(R): fast 뒤에 새 칸 끝으로
        {
          to: { r: 164 },
          start: gsapDuration.fast,
          duration: gsapDuration.slow,
          ease: gsapEasing.settle,
        },
        // 4. 뒤 가장자리(L): 새 칸 왼쪽 + 3px 지나침
        {
          to: { l: 87 },
          start: gsapDuration.fast,
          duration: gsapDuration.slow,
          ease: gsapEasing.settle,
        },
        // 5. 풀림: 4가 끝난 뒤 새 칸 왼쪽으로
        {
          to: { l: 84 },
          start: round(gsapDuration.fast + gsapDuration.slow),
          duration: gsapDuration.fast,
          ease: gsapEasing.settle,
        },
      ]);
    });

    it('왼쪽으로 옮기면 앞 가장자리는 L, 뒤 가장자리는 R이고 3px는 반대로 지나친다', () => {
      installLabelRects(rects);
      const { indicator, moveTo } = renderAt('option3');
      moveTo('option2');
      const children = indicator.__indicatorTimeline!.getChildren(
        false
      ) as gsap.core.Tween[];

      expect(children.map((tween) => describeTween(tween).to)).toEqual([
        { l: 84, r: 248 },
        { l: 84 },
        { r: 161 },
        { r: 164 },
      ]);
    });

    it('시간을 따라가면 두 칸을 덮었다가 뒤끝이 지나쳤다 새 칸에 앉는다', () => {
      installLabelRects(rects);
      const { indicator, moveTo } = renderAt('option1');
      moveTo('option2');
      const timeline = indicator.__indicatorTimeline!;

      // 넘겨줌이 막 시작된 때: 앞 가장자리가 새 칸으로 늘어나는 중이다.
      act(() => {
        timeline.time(gsapDuration.fast);
      });
      const stretched = readEdges(indicator);
      expect(stretched.l).toBe(0);
      expect(stretched.r).toBeGreaterThan(80);
      expect(stretched.r).toBeLessThan(164);

      // 뒤 가장자리가 지나침 끝에 닿은 때: 새 칸보다 3px 안쪽이다.
      act(() => {
        timeline.time(gsapDuration.fast + gsapDuration.slow);
      });
      expect(readEdges(indicator)).toEqual({ l: 87, r: 164 });

      // 끝: 새 칸 자리.
      act(() => {
        timeline.progress(1);
      });
      expect(readEdges(indicator)).toEqual({ l: 84, r: 164 });
    });

    it('진행 중 다른 칸을 누르면 지금 가장자리에서 새 타임라인이 이어받고 손잡이는 하나다', () => {
      installLabelRects(rects);
      const { indicator, moveTo } = renderAt('option1');
      moveTo('option2');
      const timeline1 = indicator.__indicatorTimeline!;

      act(() => {
        timeline1.time(0.1);
      });
      const atInterrupt = readEdges(indicator);
      expect(atInterrupt.r).toBeGreaterThan(80);
      expect(atInterrupt.r).toBeLessThan(164);

      moveTo('option3');
      const timeline2 = indicator.__indicatorTimeline!;
      expect(timeline2).not.toBe(timeline1);
      // 이전 타임라인은 죽었다.
      expect(timeline1.parent).toBeNull();

      act(() => {
        timeline2.time(0.001);
      });
      const justAfter = readEdges(indicator);
      // 처음부터 다시 시작하지 않고(R이 80으로 돌아가지 않고) 지금 값에서 출발한다.
      expect(Math.abs(justAfter.r - atInterrupt.r)).toBeLessThan(3);

      act(() => {
        timeline2.progress(1);
      });
      expect(readEdges(indicator)).toEqual({ l: 168, r: 248 });
    });

    it('같은 칸에서 options 배열만 새로 와도 진행 중인 타임라인을 다시 시작하지 않는다', () => {
      installLabelRects(rects);
      const { indicator, moveTo, rerender } = renderAt('option1');
      moveTo('option2');
      const timeline = indicator.__indicatorTimeline;

      rerender(
        <SegmentedButtons
          options={[...options]}
          value="option2"
          onChange={() => {}}
        />
      );

      expect(indicator.__indicatorTimeline).toBe(timeline);
    });

    it('모션 축소 선호에서는 표시가 새 칸 자리로 즉시 이동한다', () => {
      installReducedMotion();
      installLabelRects(rects);
      const { indicator, moveTo } = renderAt('option1');
      moveTo('option2');

      // gateMotion이 즉시 progress(1) 후 kill한다, seek 없이도 이미 도착해
      // 있고, 지나침도 안 보인다.
      expect(readEdges(indicator)).toEqual({ l: 84, r: 164 });
      expect(indicator.__indicatorTimeline!.parent).toBeNull();
    });

    const shiftedRects = {
      '옵션 1': { left: 1, width: 80 },
      '옵션 2': { left: 85, width: 80 },
      '옵션 3': { left: 169, width: 80 },
    };

    it('같은 값인데 칸 좌표만 바뀌면 고무를 돌리지 않고 새 자리에 바로 앉는다', () => {
      installLabelRects(rects);
      const { indicator, moveTo, rerender } = renderAt('option1');
      moveTo('option2');
      const timeline = indicator.__indicatorTimeline!;
      act(() => {
        timeline.progress(1);
      });

      // 폰트 로딩 같은 이유로 칸이 1px 밀렸다.
      installLabelRects(shiftedRects);
      rerender(
        <SegmentedButtons
          options={[...options]}
          value="option2"
          onChange={() => {}}
        />
      );

      expect(readEdges(indicator)).toEqual({ l: 85, r: 165 });
      // 새 타임라인(고무 다섯 단계)을 만들지 않았다.
      expect(indicator.__indicatorTimeline).toBe(timeline);
    });

    it('같은 값에서 좌표가 바뀌면 진행 중이던 타임라인도 끊고 새 자리에 앉는다', () => {
      installLabelRects(rects);
      const { indicator, moveTo, rerender } = renderAt('option1');
      moveTo('option2');
      const timeline = indicator.__indicatorTimeline!;
      act(() => {
        timeline.time(0.1);
      });

      installLabelRects(shiftedRects);
      rerender(
        <SegmentedButtons
          options={[...options]}
          value="option2"
          onChange={() => {}}
        />
      );

      expect(readEdges(indicator)).toEqual({ l: 85, r: 165 });
      expect(timeline.parent).toBeNull();
    });

    it('타임라인이 도는 도중 모션 축소 선호가 켜지면 끝 자리로 확정하고 멈춘다', () => {
      const query = installTogglableReducedMotion(false);
      installLabelRects(rects);
      const { indicator, moveTo } = renderAt('option1');
      moveTo('option2');
      const timeline = indicator.__indicatorTimeline!;
      act(() => {
        timeline.time(0.1);
      });
      expect(readEdges(indicator)).not.toEqual({ l: 84, r: 164 });

      act(() => {
        query.setMatches(true);
      });

      expect(readEdges(indicator)).toEqual({ l: 84, r: 164 });
      expect(timeline.parent).toBeNull();
    });
  });

  describe('표시 안 라벨 한 벌 (M5 task-19 수정 1)', () => {
    const iconOptions = [
      { value: 'a', label: '가', icon: <i data-testid="ia" /> },
      { value: 'b', label: '나', icon: <i data-testid="ib" />, iconOnly: true },
      { value: 'c', label: '다', disabled: true },
    ];

    const indicatorOf = (container: HTMLElement): HTMLElement =>
      container.querySelector(
        '[class*="SegmentedButtons_activeIndicator__"]'
      ) as HTMLElement;

    const realLabels = (container: HTMLElement): HTMLElement[] =>
      Array.from(container.querySelectorAll('label'));

    const copies = (container: HTMLElement): HTMLElement[] =>
      Array.from(
        indicatorOf(container).querySelectorAll<HTMLElement>(
          '[class*="SegmentedButtons_button__"]'
        )
      );

    it('표시 안에 옵션마다 라벨이 한 벌 더 있고 보조 기술에는 숨겨진다', () => {
      const { container } = render(
        <SegmentedButtons options={iconOptions} value="a" onChange={() => {}} />
      );
      const inner = within(indicatorOf(container));

      expect(copies(container).map((el) => el.textContent)).toEqual([
        '가',
        '',
        '다',
      ]);
      expect(
        indicatorOf(container).closest('[aria-hidden="true"]')
      ).not.toBeNull();
      expect(indicatorOf(container).querySelector('input')).toBeNull();
      expect(inner.getAllByTestId('ia')).toHaveLength(1);
      expect(inner.getAllByTestId('ib')).toHaveLength(1);
    });

    it('안쪽 라벨은 진짜 라벨과 같은 클래스 목록이고 선택이 바뀌면 같이 따라간다', () => {
      const { container, rerender } = render(
        <SegmentedButtons options={iconOptions} value="a" onChange={() => {}} />
      );
      const classesOf = (els: HTMLElement[]) => els.map((el) => el.className);

      expect(classesOf(copies(container))).toEqual(
        classesOf(realLabels(container))
      );
      expect(realLabels(container)[0].className).toContain('selected');
      expect(realLabels(container)[1].className).toContain('iconOnly');
      expect(realLabels(container)[2].className).toContain('disabled');

      rerender(
        <SegmentedButtons options={iconOptions} value="b" onChange={() => {}} />
      );
      expect(classesOf(copies(container))).toEqual(
        classesOf(realLabels(container))
      );
      expect(copies(container)[1].className).toContain('selected');
      expect(copies(container)[0].className).not.toContain('selected');
    });

    it('안쪽 라벨은 label이 아니고 포커스를 받지 않는다', () => {
      const { container } = render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );

      expect(realLabels(container)).toHaveLength(3);
      expect(copies(container)).toHaveLength(3);
      copies(container).forEach((el) => {
        expect(el.tagName).not.toBe('LABEL');
        expect(el).not.toHaveAttribute('tabindex');
      });
    });
  });
});

/** vanilla-extract가 실제로 만든 CSS(jsdom에 주입된 <style>)를 CSSOM으로 읽는다. */
const segmentedRules = (): CSSStyleRule[] => {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) =>
      rule.cssText.includes('SegmentedButtons_button__')
    )
  );
  if (!sheet) throw new Error('SegmentedButtons 스타일시트를 찾지 못했다');
  return Array.from(sheet.cssRules).filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
  );
};

describe('SegmentedButtons 생성 CSS (M5 task-19 수정 1)', () => {
  const own = (className: string) =>
    segmentedRules().find((rule) =>
      new RegExp(`^\\.SegmentedButtons_${className}__\\w+$`).test(
        rule.selectorText
      )
    );
  const withSelector = (pattern: RegExp) =>
    segmentedRules().filter((rule) => pattern.test(rule.selectorText));

  it('표시 층이 진짜 라벨보다 위에 쌓인다', () => {
    const shadow = Number(
      own('indicatorShadow')?.style.getPropertyValue('z-index')
    );
    const label = Number(own('button')?.style.getPropertyValue('z-index'));

    expect(Number.isNaN(shadow)).toBe(false);
    expect(shadow).toBeGreaterThan(label);
  });

  it('진짜 라벨의 글자색은 선택 여부와 무관하다', () => {
    const selectedRules = withSelector(
      /SegmentedButtons_button__\w+\.selected$/
    );

    expect(selectedRules.length).toBeGreaterThan(0);
    selectedRules.forEach((rule) => {
      expect(rule.style.getPropertyValue('color')).toBe('');
    });
  });

  it('표시 안 글자는 활성색이고, 선택 칸 호버 빛은 진짜 라벨이 아니라 표시 안 글자에 있다', () => {
    const inner = withSelector(
      /^\.SegmentedButtons_indicatorLabels__\w+ \.SegmentedButtons_button__\w+$/
    );
    expect(
      inner.some((rule) => rule.style.getPropertyValue('color') !== '')
    ).toBe(true);

    const glow = (rule: CSSStyleRule) =>
      rule.style.getPropertyValue('text-shadow');
    const hoverGlow = segmentedRules().filter(
      (rule) =>
        /:hover/.test(rule.selectorText) &&
        glow(rule) !== '' &&
        glow(rule) !== 'none'
    );
    expect(hoverGlow).toHaveLength(1);
    expect(hoverGlow[0].selectorText).toMatch(/:has\(/);
    expect(hoverGlow[0].selectorText).toMatch(/indicatorLabels/);
  });

  it('안쪽 줄은 컨테이너와 같은 가로 배치(flex, 가로 1px, gap 4px)로 컨테이너 전체를 덮는다', () => {
    const row = own('indicatorLabels')?.style;
    const box = own('container')?.style;

    expect(row?.getPropertyValue('display')).toBe('flex');
    expect(row?.getPropertyValue('align-items')).toBe('center');
    expect(row?.getPropertyValue('gap')).toBe(box?.getPropertyValue('gap'));
    expect(row?.getPropertyValue('box-sizing')).toBe('border-box');
    expect(row?.getPropertyValue('width')).toBe('100%');
  });

  it('표시는 트랙의 축소판이다: 트랙 좌우 padding, 표시 위 간격, 표시 안 라벨 줄 가로 padding이 같은 값(1px)이다', () => {
    const box = own('container')?.style;
    const shadow = own('indicatorShadow')?.style;
    const row = own('indicatorLabels')?.style;

    // 테두리가 없어 트랙 바깥 끝이 경계다. 위아래 padding도 1px라 라벨 높이 85%가 바뀌지 않는다.
    expect(box?.getPropertyValue('padding')).toMatch(/^1px( 1px)?$/);
    expect(shadow?.getPropertyValue('top')).toBe('1px');
    expect(shadow?.getPropertyValue('height')).toBe('calc(100% - 2px)');
    expect(row?.getPropertyValue('padding')).toMatch(/^0(px)? 1px$/);
    expect(row?.getPropertyValue('top')).toBe('-1px');
    expect(row?.getPropertyValue('height')).toBe('calc(100% + 2px)');
  });
  it('트랙은 테두리 그림자 없이 회색 200 면이다', () => {
    const box = own('container')?.style;

    expect(box?.getPropertyValue('box-shadow')).toBe('');
    expect(box?.getPropertyValue('background-color')).toBe(
      themeContract.palette.gray[200]
    );
  });

  it('비선택 라벨의 기본 글자색은 회색 700이다', () => {
    expect(own('button')?.style.getPropertyValue('color')).toBe(
      themeContract.palette.gray[700]
    );
  });

  it('비활성 아닌 비선택 칸에 호버하면 글자색이 text.primary로 한 단계 진해진다', () => {
    const hover = withSelector(
      /^\.SegmentedButtons_button__\w+:hover:not\(\.disabled\):not\(\.selected\)$/
    );

    expect(hover).toHaveLength(1);
    expect(hover[0].style.getPropertyValue('color')).toBe(
      themeContract.color.text.primary
    );
  });
});

describe('SegmentedButtons 트랙 대비 (M5 task-19 수정 4)', () => {
  const { palette, color } = themeTokens;

  it('표시(primary.main)는 트랙(gray 200) 위에서 UI 요소 대비(3:1)를 만족한다', () => {
    expect(
      contrastRatio(color.primary.main, palette.gray[200])
    ).toBeGreaterThanOrEqual(AA_UI);
  });

  it('비선택 글자(gray 700)는 트랙(gray 200) 위에서 본문 대비(4.5:1)를 만족한다', () => {
    expect(
      contrastRatio(palette.gray[700], palette.gray[200])
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
