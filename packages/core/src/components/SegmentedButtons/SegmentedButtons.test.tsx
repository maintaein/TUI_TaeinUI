import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedButtons } from './SegmentedButtons';

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
        expect(screen.getByText(option.label)).toBeInTheDocument();
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

      const option1Label = screen.getByText('옵션 1');
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
      const firstButton = screen.getByText('옵션 1').closest('label');
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

      const firstButton = screen.getByText('옵션 1').closest('label');
      firstButton?.focus();

      await user.keyboard('{ArrowRight}');

      const secondButton = screen.getByText('옵션 2').closest('label');
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

      const secondButton = screen.getByText('옵션 2').closest('label');
      secondButton?.focus();

      await user.keyboard('{ArrowLeft}');

      const firstButton = screen.getByText('옵션 1').closest('label');
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

      const firstButton = screen.getByText('옵션 1').closest('label');
      firstButton?.focus();

      await user.keyboard('{ArrowLeft}');

      const lastButton = screen.getByText('옵션 3').closest('label');
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

      const lastButton = screen.getByText('옵션 3').closest('label');
      lastButton?.focus();

      await user.keyboard('{ArrowRight}');

      const firstButton = screen.getByText('옵션 1').closest('label');
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

      expect(screen.getByTestId('icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('icon-2')).toBeInTheDocument();
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

      expect(screen.getByTestId('icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('icon-2')).toBeInTheDocument();

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
   * M3 T3d — 인디케이터 x/width/scaleX가 GSAP 소유로 넘어간 뒤의 테스트.
   *
   * jsdom은 레이아웃이 없어 getBoundingClientRect가 항상 0을 준다(환경
   * 보급 필요, Modal.test.tsx 선례). GSAP 티커는 rAF 기반이라 가짜 타이머로
   * 못 돌린다 — 실제 타임라인/트윈을 `.progress()`로 seek해서 단언한다
   * (무모킹, Snackbar.test.tsx 선례). 트윈은 공개 API로 안 나가고
   * `__indicatorTimeline`이라는 테스트 전용 통로로만 읽는다.
   */
  describe('GSAP 인디케이터 (M3 T3d)', () => {
    type IndicatorTimelineHost = HTMLElement & {
      __indicatorTimeline?: gsap.core.Timeline;
    };

    const getIndicator = (container: HTMLElement): IndicatorTimelineHost =>
      container.querySelector(
        '[class*="SegmentedButtons_activeIndicator__"]'
      ) as IndicatorTimelineHost;

    // GSAP이 쓰는 transform 문자열 포맷은 .set()과 .to()가 다르다
    // (.set: "translate(0, 0)", .to: "translate3d(7.79px, 0px, 0px) scale(1.05, 1)")
    // — 둘 다 잡히게 단위(px)와 3d 접미사를 선택적으로 둔다.
    const readX = (el: HTMLElement): number => {
      const match = el.style.transform.match(/translate(?:3d)?\(([-\d.]+)/);
      return match ? Number(match[1]) : 0;
    };
    const readScaleX = (el: HTMLElement): number => {
      const match = el.style.transform.match(/scale\(([-\d.]+)/);
      return match ? Number(match[1]) : 1;
    };
    const readWidth = (el: HTMLElement): number =>
      Number.parseFloat(el.style.width || '0');

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

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    const rects = {
      '옵션 1': { left: 0, width: 80 },
      '옵션 2': { left: 84, width: 80 },
      '옵션 3': { left: 168, width: 80 },
    };

    it('마운트 시엔 미끄러지거나 늘어나지 않는다 (위험 4)', () => {
      installLabelRects(rects);
      const { container } = render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );
      const indicator = getIndicator(container);

      expect(readX(indicator)).toBe(0);
      expect(readWidth(indicator)).toBe(80);
      expect(readScaleX(indicator)).toBe(1);
      // 첫 배치는 gsap.set이라 타임라인이 아예 안 생긴다.
      expect(indicator.__indicatorTimeline).toBeUndefined();
    });

    it('value가 options에 없으면 인디케이터가 폭 0으로 숨는다', () => {
      installLabelRects(rects);
      const { container } = render(
        <SegmentedButtons
          options={options}
          value="nonexistent"
          onChange={() => {}}
        />
      );
      const indicator = getIndicator(container);

      expect(readWidth(indicator)).toBe(0);
    });

    it(
      '선택이 옮겨가면 현재 위치에서 이어받는다 — 중단해도 처음부터 다시 ' +
        '시작하지 않는다 (Article 1③ 핵심 잠금)',
      () => {
        installLabelRects(rects);
        const { container, rerender } = render(
          <SegmentedButtons
            options={options}
            value="option1"
            onChange={() => {}}
          />
        );
        const indicator = getIndicator(container);

        rerender(
          <SegmentedButtons
            options={options}
            value="option2"
            onChange={() => {}}
          />
        );
        const timeline1 = indicator.__indicatorTimeline;
        expect(timeline1).toBeDefined();
        const xWidthTween1 = timeline1!.getChildren()[0] as gsap.core.Tween;

        act(() => {
          timeline1!.progress(0.5);
        });
        const xAtInterrupt = readX(indicator);
        // 절반쯤 왔으니 0(옵션1)과 84(옵션2) 사이 어딘가여야 한다.
        expect(xAtInterrupt).toBeGreaterThan(0);
        expect(xAtInterrupt).toBeLessThan(84);

        // option2가 끝나기 전에 option3으로 또 옮겨간다 — 다중 목표 중단.
        rerender(
          <SegmentedButtons
            options={options}
            value="option3"
            onChange={() => {}}
          />
        );
        const timeline2 = indicator.__indicatorTimeline;
        expect(timeline2).toBeDefined();
        expect(timeline2).not.toBe(timeline1);

        act(() => {
          timeline2!.progress(0.001);
        });
        const xJustAfterInterrupt = readX(indicator);

        // 새 트윈은 0도 84도 아니라 "중단 당시의 현재 값"에서 이어받는다 —
        // 진행이 0.1%뿐이니 xAtInterrupt에서 거의 안 움직였어야 한다.
        expect(xJustAfterInterrupt).toBeGreaterThan(0);
        expect(Math.abs(xJustAfterInterrupt - xAtInterrupt)).toBeLessThan(10);

        // 중단된 이전 트윈은 죽었다 — overwrite:'auto'가 실제로 정리했다는
        // 구조적 증거다.
        expect(xWidthTween1.parent).toBeNull();
      }
    );

    it('오른쪽으로 이동할 땐 진행 중 늘어나고 transformOrigin이 left center다', () => {
      installLabelRects(rects);
      const { container, rerender } = render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );
      const indicator = getIndicator(container);

      rerender(
        <SegmentedButtons
          options={options}
          value="option2"
          onChange={() => {}}
        />
      );
      const timeline = indicator.__indicatorTimeline!;

      act(() => {
        timeline.progress(0.3); // 전체 300ms 중 앞 40%(120ms) 구간 안
      });
      // transformOrigin은 타임라인이 최소 한 번 렌더된 뒤에야 DOM에 반영된다.
      expect(indicator.style.transformOrigin).toBe('0% 50%'); // left center
      expect(readScaleX(indicator)).toBeGreaterThan(1);

      act(() => {
        timeline.progress(1);
      });
      expect(readScaleX(indicator)).toBeCloseTo(1, 2);
    });

    it('왼쪽으로 이동할 땐 transformOrigin이 right center다', () => {
      installLabelRects(rects);
      const { container, rerender } = render(
        <SegmentedButtons
          options={options}
          value="option3"
          onChange={() => {}}
        />
      );
      const indicator = getIndicator(container);

      rerender(
        <SegmentedButtons
          options={options}
          value="option2"
          onChange={() => {}}
        />
      );

      act(() => {
        indicator.__indicatorTimeline!.progress(0.3);
      });
      expect(indicator.style.transformOrigin).toBe('100% 50%'); // right center
    });

    it('모션 축소 선호에서는 인디케이터가 목표 위치로 즉시 이동한다', () => {
      installReducedMotion();
      installLabelRects(rects);
      const { container, rerender } = render(
        <SegmentedButtons
          options={options}
          value="option1"
          onChange={() => {}}
        />
      );
      const indicator = getIndicator(container);

      rerender(
        <SegmentedButtons
          options={options}
          value="option2"
          onChange={() => {}}
        />
      );

      // gateMotion이 즉시 progress(1) 후 kill한다 — seek 없이도 이미 도착해
      // 있고, 늘어남(overshoot)도 안 보인다.
      expect(readX(indicator)).toBeCloseTo(84, 0);
      expect(readScaleX(indicator)).toBeCloseTo(1, 2);
      expect(indicator.__indicatorTimeline!.parent).toBeNull();
    });
  });
});
