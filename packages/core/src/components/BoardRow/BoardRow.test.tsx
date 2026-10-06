import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardRow } from './BoardRow';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

describe('BoardRow', () => {
  describe('렌더링 테스트', () => {
    it('기본 BoardRow가 렌더링된다', () => {
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      expect(screen.getByText('제목')).toBeInTheDocument();
      expect(screen.getByText('내용')).toBeInTheDocument();
    });

    it('title이 ReactNode 타입을 지원한다', () => {
      render(
        <BoardRow
          title={
            <div>
              <strong>강조 제목</strong>
            </div>
          }
        >
          내용
        </BoardRow>
      );

      expect(screen.getByText('강조 제목')).toBeInTheDocument();
    });

    it('children이 ReactNode 타입을 지원한다', () => {
      render(
        <BoardRow title="제목">
          <div>
            <p>첫 번째 문단</p>
            <p>두 번째 문단</p>
          </div>
        </BoardRow>
      );

      expect(screen.getByText('첫 번째 문단')).toBeInTheDocument();
      expect(screen.getByText('두 번째 문단')).toBeInTheDocument();
    });
  });

  describe('펼침/접힘 상태 테스트', () => {
    it('기본적으로 접힌 상태로 렌더링된다', () => {
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('defaultExpanded가 true면 펼쳐진 상태로 렌더링된다', () => {
      render(
        <BoardRow title="제목" defaultExpanded>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('제목 클릭 시 펼쳐진다', () => {
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('펼쳐진 상태에서 제목 클릭 시 접힌다', () => {
      render(
        <BoardRow title="제목" defaultExpanded>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('controlled mode 테스트', () => {
    it('expanded prop이 있으면 controlled mode로 동작한다', () => {
      const handleChange = vi.fn();

      render(
        <BoardRow title="제목" expanded={false} onChange={handleChange}>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      expect(handleChange).toHaveBeenCalledWith(true);
      // controlled mode이므로 상태는 외부에서 관리
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('expanded prop이 변경되면 상태가 업데이트된다', () => {
      const { rerender } = render(
        <BoardRow title="제목" expanded={false}>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <BoardRow title="제목" expanded={true}>
          <div>내용</div>
        </BoardRow>
      );

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Enter 키로 펼침/접힘을 토글한다', async () => {
      const user = userEvent.setup();
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      button.focus();

      expect(button).toHaveAttribute('aria-expanded', 'false');

      await act(async () => {
        await user.keyboard('{Enter}');
      });

      expect(button).toHaveAttribute('aria-expanded', 'true');

      await act(async () => {
        await user.keyboard('{Enter}');
      });

      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('Space 키로 펼침/접힘을 토글한다', async () => {
      const user = userEvent.setup();
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      button.focus();

      expect(button).toHaveAttribute('aria-expanded', 'false');

      await act(async () => {
        await user.keyboard(' ');
      });

      expect(button).toHaveAttribute('aria-expanded', 'true');

      await act(async () => {
        await user.keyboard(' ');
      });

      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('접근성 테스트', () => {
    it('제목 버튼에 button role이 있다', () => {
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      expect(screen.getByRole('button', { name: /제목/ })).toBeInTheDocument();
    });

    it('내용 영역에 region role이 있다', () => {
      render(
        <BoardRow title="제목" defaultExpanded>
          <div>내용</div>
        </BoardRow>
      );

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('aria-expanded 속성이 있다', () => {
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toHaveAttribute('aria-expanded');
    });

    it('aria-controls 속성이 내용 영역 id를 가리킨다', () => {
      render(
        <BoardRow title="제목" defaultExpanded>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      const region = screen.getByRole('region');

      const controlsId = button.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      expect(region).toHaveAttribute('id', controlsId!);
    });

    it('aria-labelledby 속성이 제목 버튼 id를 가리킨다', () => {
      render(
        <BoardRow title="제목" defaultExpanded>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      const region = screen.getByRole('region');

      const buttonId = button.getAttribute('id');
      expect(buttonId).toBeTruthy();
      expect(region).toHaveAttribute('aria-labelledby', buttonId!);
    });
  });

  describe('disabled 상태 테스트', () => {
    it('disabled가 true면 버튼이 비활성화된다', () => {
      render(
        <BoardRow title="제목" disabled>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toBeDisabled();
    });

    it('disabled 상태에서는 클릭해도 펼쳐지지 않는다', () => {
      render(
        <BoardRow title="제목" disabled>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      // disabled이므로 클릭 이벤트가 발생하지 않음
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('variant prop 테스트', () => {
    it('variant="default"일 때 적절한 클래스가 적용된다', () => {
      render(
        <BoardRow title="제목" variant="default">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button.parentElement).toHaveClass(/variantStyles_default/);
    });

    it('variant="outlined"일 때 적절한 클래스가 적용된다', () => {
      render(
        <BoardRow title="제목" variant="outlined">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button.parentElement).toHaveClass(/variantStyles_outlined/);
    });

    it('variant="filled"일 때 적절한 클래스가 적용된다', () => {
      render(
        <BoardRow title="제목" variant="filled">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button.parentElement).toHaveClass(/variantStyles_filled/);
    });

    it('기본값은 "default"이다', () => {
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button.parentElement).toHaveClass(/variantStyles_default/);
    });
  });

  describe('icon 표시 테스트', () => {
    it('접힌 상태일 때 아이콘이 있다', () => {
      render(
        <BoardRow title="제목">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('펼쳐진 상태일 때 아이콘이 회전한다', () => {
      render(
        <BoardRow title="제목" defaultExpanded>
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      const iconContainer = button.querySelector('svg')?.parentElement;
      expect(iconContainer).toHaveClass(/iconExpanded/);
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      render(
        <BoardRow title="제목" className="custom-class">
          <div>내용</div>
        </BoardRow>
      );

      const button = screen.getByRole('button', { name: /제목/ });
      expect(button.parentElement).toHaveClass('custom-class');
    });
  });

  describe('HTML 속성 전달 테스트', () => {
    it('data 속성이 전달된다', () => {
      render(
        <BoardRow title="제목" data-testid="board-row">
          <div>내용</div>
        </BoardRow>
      );

      expect(screen.getByTestId('board-row')).toBeInTheDocument();
    });
  });

  describe('복합 시나리오 테스트', () => {
    it('여러 BoardRow를 사용할 수 있다 (FAQ 예시)', () => {
      render(
        <div>
          <BoardRow title="질문 1">
            <div>답변 1</div>
          </BoardRow>
          <BoardRow title="질문 2">
            <div>답변 2</div>
          </BoardRow>
          <BoardRow title="질문 3">
            <div>답변 3</div>
          </BoardRow>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      // 첫 번째만 펼치기
      fireEvent.click(buttons[0]);
      expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
      expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
      expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');

      // 두 번째도 펼치기 (다중 열림)
      fireEvent.click(buttons[1]);
      expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
      expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
      expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');
    });

    it('내용 영역에 복잡한 컨텐츠를 표시할 수 있다', () => {
      render(
        <BoardRow title="상세 정보" defaultExpanded>
          <div>
            <h3>제목</h3>
            <p>설명</p>
            <ul>
              <li>항목 1</li>
              <li>항목 2</li>
            </ul>
            <button>액션 버튼</button>
          </div>
        </BoardRow>
      );

      expect(screen.getByText('제목')).toBeInTheDocument();
      expect(screen.getByText('설명')).toBeInTheDocument();
      expect(screen.getByText('항목 1')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '액션 버튼' })
      ).toBeInTheDocument();
    });
  });
});

describe('BoardRow 모션 잠금', () => {
  // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
  // 읽는다. BoardRow.css.ts 소스 텍스트에서 직접 확인한다(Card/Chip과 동일 관례).
  const cssSource = readFileSync(
    resolve(__dirname, './BoardRow.css.ts'),
    'utf-8'
  );

  /**
   * header의 `:not(:disabled)` 가드가 붙은 상태 블록을 꺼낸다. 파일 첫 매치를
   * 그냥 쓰면 앞에 같은 모양의 블록이 하나 끼어드는 날 조용히 엉뚱한 곳을
   * 검사하므로, 그런 블록이 몇 개인지까지 같이 고정한다(리뷰 F4).
   */
  const guardedBlock = (state: 'hover' | 'active'): string => {
    const blocks = [
      ...cssSource.matchAll(
        new RegExp(
          `'&:${state}:not\\(:disabled\\)': \\{([\\s\\S]*?)\\n {4}\\},`,
          'g'
        )
      ),
    ];
    // 이 파일에서 가드가 붙은 상태 블록은 header의 것 하나뿐이다.
    expect(blocks, `:${state} 블록 개수가 달라졌다`).toHaveLength(1);
    return blocks[0][1];
  };

  it('좌측 막대가 없다: boardRow에 ::before·position: relative가 없고 rowExpanded도 없다', () => {
    // 리뷰 1번: 펼쳤을 때 왼쪽에 생기는 파란선을 지운다(사용자 결정 (A)).
    // 무엇을 뒤집으면 빨개지는가: ::before 막대나 그 짝 rowExpanded를 되살리면.
    // position: relative는 막대(absolute)만을 위한 것이었다.
    expect(cssSource).not.toContain('::before');
    expect(cssSource).not.toContain('rowExpanded');
    expect(cssSource).not.toContain('globalStyle');
    const rootBlock = cssSource.match(
      /export const boardRow = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(rootBlock, 'boardRow 블록을 찾지 못했다').toBeDefined();
    expect(rootBlock).not.toContain("position: 'relative'");
  });

  it('header hover가 fast/settle을, 새로 생긴 :active가 fast/exit를 쓴다(리터럴 ease 없음)', () => {
    const headerBlock = cssSource.match(
      /export const header = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(headerBlock, 'header 블록을 찾지 못했다').toBeDefined();
    expect(headerBlock).not.toMatch(
      /transition: `background-color \$\{themeContract\.animation\.duration\.base\} ease`/
    );
    expect(headerBlock).toContain('themeContract.animation.easing.settle');

    const hoverBlock = guardedBlock('hover');
    expect(hoverBlock).toContain('themeContract.animation.duration.fast');

    const activeBlock = guardedBlock('active');
    expect(activeBlock).toContain('themeContract.color.surface.active');
    // 배경색 단독 채널이면 article 4 위반이다(리뷰 F3) — scale이 companion.
    expect(activeBlock).toContain("transform: 'scale(0.995)'");
    expect(activeBlock).toContain('themeContract.animation.duration.fast');
    expect(activeBlock).toContain('themeContract.animation.easing.exit');
  });

  it('header의 :hover·:active가 :not(:disabled)로 막혀 있다(리뷰 F1)', () => {
    // 배치 공통 제약: disabled에는 전이를 주지 않는다. :disabled 블록이 뒤에
    // 있어 backgroundColor는 되돌아가지만, 가드가 없으면 :hover의 전이 자체는
    // 비활성 헤더에도 그대로 걸린다. Button·IconButton은 이미 같은 가드를 쓰고
    // Card는 pointerEvents: none으로 막는데 header만 둘 다 없었다.
    // 무엇을 뒤집으면 빨개지는가: 셀렉터를 ':hover'/':active'로 되돌리면.
    const headerBlock = cssSource.match(
      /export const header = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(headerBlock, 'header 블록을 찾지 못했다').toBeDefined();
    expect(headerBlock).toContain("'&:hover:not(:disabled)'");
    expect(headerBlock).toContain("'&:active:not(:disabled)'");
    expect(headerBlock).not.toMatch(/^ {2}':hover': \{/m);
    expect(headerBlock).not.toMatch(/^ {2}':active': \{/m);
  });

  it('header :hover 블록에 transitionTimingFunction이 없다(리뷰 C3)', () => {
    // 포인터를 떼도 요소는 여전히 :hover에 매치된다. 이 블록의 타이밍 함수
    // 롱핸드가 header의 transition 숏핸드를 이기고 속성별 목록을 값 하나로
    // 무너뜨려서, 되돌아오는 전이까지 그 커브가 지배했다 — header가
    // transform에 준 snap 오버슛이 포인터 사용자에게 한 번도 재생되지
    // 않았다(크로미엄 실측).
    // 무엇을 뒤집으면 빨개지는가: header의 :hover에
    // transitionTimingFunction: settle을 되돌려 놓으면 여기가 빨개진다.
    expect(guardedBlock('hover')).not.toContain('transitionTimingFunction');
  });

  it('iconContainer(쉐브론) 회전이 snap을 쓴다. 198°까지 갔다 180°에 앉는다', () => {
    // 무엇을 뒤집으면 빨개지는가: transition의 easing을 settle이나 리터럴 ease로
    // 되돌리면. 오버슈트 이징은 transform에만 건다(animationBoundary 규칙).
    const iconBlock = cssSource.match(
      /export const iconContainer = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(iconBlock, 'iconContainer 블록을 찾지 못했다').toBeDefined();
    expect(iconBlock).not.toMatch(
      /transition: `transform \$\{themeContract\.animation\.duration\.base\} ease`/
    );
    expect(iconBlock).toContain(
      'transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}`'
    );
    expect(iconBlock).not.toContain('easing.settle');
  });

  it('contentWrapper는 grid·전이 없이 overflow: hidden만 갖는다(높이는 GSAP이 쓴다)', () => {
    // 무엇을 뒤집으면 빨개지는가: grid-template-rows 전이를 되살리면. 1fr을 넘는
    // 값은 내용 높이에서 잘려 넘침(bouncy)이 원리적으로 불가능했다.
    const wrapperBlock = cssSource.match(
      /export const contentWrapper = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(wrapperBlock, 'contentWrapper 블록을 찾지 못했다').toBeDefined();
    expect(wrapperBlock).toContain("overflow: 'hidden'");
    expect(wrapperBlock).not.toContain('grid');
    expect(wrapperBlock).not.toContain('transition');
    expect(cssSource).not.toContain('wrapperExpanded');
    expect(cssSource).not.toContain('gridTemplateRows');
  });
});

describe('BoardRow 펼침·접힘 모션', () => {
  type Host = HTMLElement & {
    __boardRowTimeline?: gsap.core.Timeline;
    __boardRowStagger?: gsap.core.Timeline;
  };
  type TweenLike = gsap.core.Tween & {
    vars: gsap.TweenVars & { startAt?: gsap.TweenVars };
  };

  const CONTENT_HEIGHT = 120;
  const EXPAND_OVERSHOOT = 8;
  const COLLAPSE_SWELL = 12;

  // jsdom은 레이아웃이 없다. 내용 높이(scrollHeight)는 보급하고, 지금 높이는
  // 인라인 height가 있으면 그 값(GSAP이 실제로 쓴 값)을, 없으면(auto) 내용
  // 높이를 돌려준다. GSAP과 컴포넌트 코드는 실제 그대로 돈다.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(
      CONTENT_HEIGHT
    );
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        const inline = (this as HTMLElement).style.height;
        const height = inline ? Number.parseFloat(inline) : CONTENT_HEIGHT;
        return { height } as DOMRect;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderRow = (props: { defaultExpanded?: boolean } = {}) => {
    render(
      <BoardRow title="제목" {...props}>
        <p>첫째</p>
        <p>둘째</p>
        <p>셋째</p>
      </BoardRow>
    );
    const button = screen.getByRole('button', { name: /제목/ });
    const region = screen.getByRole('region', { hidden: true });
    const wrapper = region.parentElement as Host;
    return { button, region, wrapper };
  };

  const timelineOf = (wrapper: Host) => {
    expect(wrapper.__boardRowTimeline).toBeDefined();
    return wrapper.__boardRowTimeline!;
  };
  const tweensOn = (timeline: gsap.core.Timeline, target: Element) =>
    (timeline.getChildren() as TweenLike[]).filter(
      (t) => t.targets()[0] === target
    );

  // 전역 루트 타임라인을 손으로 조금씩 민다(jsdom엔 rAF 티커가 없다). 살아 있는
  // 타임라인은 시작 순서대로 끝까지 흐른다. 죽은 것은 흐르지 않는다: 늦게 끼어드는
  // 콜백이 있다면 여기서 새 타임라인의 끝 상태를 덮어쓴다.
  const runToEnd = (root: gsap.core.Timeline) => {
    act(() => {
      for (let i = 0; i < 200; i++) root.totalTime(root.totalTime() + 0.02);
    });
  };

  const stubReduced = () =>
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

  it('펼침: 높이 트윈 둘. 1단은 h+8까지 settle·slow, 2단은 h로 drift·base. 끝에 인라인 height가 없다', () => {
    const { button, wrapper } = renderRow();
    fireEvent.click(button);

    const timeline = timelineOf(wrapper);
    const [over, settle, ...rest] = tweensOn(timeline, wrapper);
    expect(rest).toHaveLength(0);
    expect(over.vars.startAt?.height).toBe(0);
    expect(over.vars.height).toBe(CONTENT_HEIGHT + EXPAND_OVERSHOOT);
    expect(over.vars.ease).toBe(gsapEasing.settle);
    expect(over.duration()).toBeCloseTo(gsapDuration.slow, 5);
    expect(over.startTime()).toBe(0);
    expect(settle.vars.height).toBe(CONTENT_HEIGHT);
    expect(settle.vars.ease).toBe(gsapEasing.drift);
    expect(settle.duration()).toBeCloseTo(gsapDuration.base, 5);
    expect(settle.startTime()).toBeCloseTo(gsapDuration.slow, 5);

    // 끝나면 auto로 돌아간다. 고정 px로 남으면 내용이 바뀔 때 잘린다.
    act(() => {
      timeline.progress(1);
    });
    expect(wrapper.style.height).toBe('');
  });

  it('접힘: 1단은 지금값+12까지 drift, 2단은 0까지 exit. 길이는 펼침의 0.65배다', () => {
    const { button, wrapper } = renderRow();
    fireEvent.click(button);
    const expand = timelineOf(wrapper);
    const expandDuration = expand.duration();
    act(() => {
      expand.progress(1);
    });

    fireEvent.click(button);
    const collapse = timelineOf(wrapper);
    expect(collapse).not.toBe(expand);
    const [swell, fold, ...rest] = tweensOn(collapse, wrapper);
    expect(rest).toHaveLength(0);
    expect(swell.vars.startAt?.height).toBe(CONTENT_HEIGHT);
    expect(swell.vars.height).toBe(CONTENT_HEIGHT + COLLAPSE_SWELL);
    expect(swell.vars.ease).toBe(gsapEasing.drift);
    expect(swell.duration()).toBeCloseTo(gsapDuration.base * 0.65, 5);
    expect(fold.vars.height).toBe(0);
    expect(fold.vars.ease).toBe(gsapEasing.exit);
    expect(fold.duration()).toBeCloseTo(gsapDuration.slow * 0.65, 5);
    expect(collapse.duration()).toBeCloseTo(expandDuration * 0.65, 5);

    act(() => {
      collapse.progress(1);
    });
    expect(wrapper.style.height).toBe('0px');
  });

  it('펼치는 도중 접으면 새 접힘의 시작값이 그 순간의 높이다(0도 h도 아니다)', () => {
    const { button, wrapper } = renderRow();
    fireEvent.click(button);
    const expand = timelineOf(wrapper);
    act(() => {
      expand.pause().progress(0.2);
    });
    const mid = Number.parseFloat(wrapper.style.height);
    expect(mid).toBeGreaterThan(0);
    expect(mid).not.toBe(CONTENT_HEIGHT);

    fireEvent.click(button);
    const collapse = timelineOf(wrapper);
    expect(collapse).not.toBe(expand);
    const [swell] = tweensOn(collapse, wrapper);
    expect(swell.vars.startAt?.height).toBe(mid);
    expect(swell.vars.height).toBe(mid + COLLAPSE_SWELL);
  });

  it('마운트 시에는 트윈이 없다. 닫힌 채 시작하면 높이 0, 열린 채 시작하면 auto', () => {
    const closed = renderRow();
    expect(closed.wrapper.__boardRowTimeline).toBeUndefined();
    expect(closed.wrapper.style.height).toBe('0px');
    cleanup();

    const open = renderRow({ defaultExpanded: true });
    expect(open.wrapper.__boardRowTimeline).toBeUndefined();
    expect(open.wrapper.style.height).toBe('');
  });

  it('StrictMode가 effect를 다시 돌려도 마운트 때 트윈이 없다', () => {
    render(
      <StrictMode>
        <BoardRow title="제목">
          <p>내용</p>
        </BoardRow>
      </StrictMode>
    );
    const wrapper = screen.getByRole('region', { hidden: true })
      .parentElement as Host;
    expect(wrapper.__boardRowTimeline).toBeUndefined();
  });

  it('축소 선호: 트윈 없이 끝 상태다. 펼침은 인라인 height 없음, 접힘은 0', () => {
    stubReduced();
    const { button, wrapper } = renderRow();

    fireEvent.click(button);
    expect(wrapper.style.height).toBe('');

    fireEvent.click(button);
    expect(wrapper.style.height).toBe('0px');
  });

  it('inert: 처음 닫힘이면 있고, 펼치기 시작하면 바로 떼고, 접힘이 끝나면 다시 붙는다', () => {
    const { button, region, wrapper } = renderRow();
    expect(region).toHaveAttribute('inert');

    fireEvent.click(button);
    expect(region).not.toHaveAttribute('inert');
    act(() => {
      timelineOf(wrapper).progress(1);
    });
    expect(region).not.toHaveAttribute('inert');

    fireEvent.click(button);
    // 접히는 중에는 아직 안 붙는다.
    expect(region).not.toHaveAttribute('inert');
    act(() => {
      timelineOf(wrapper).progress(1);
    });
    expect(region).toHaveAttribute('inert');

    // 다시 펼치기 시작하면 즉시 뗀다.
    fireEvent.click(button);
    expect(region).not.toHaveAttribute('inert');
  });

  it('inert: 처음부터 열려 있으면 없고, 축소 선호에서는 접히자마자 붙는다', () => {
    const open = renderRow({ defaultExpanded: true });
    expect(open.region).not.toHaveAttribute('inert');
    cleanup();

    stubReduced();
    const { button, region } = renderRow({ defaultExpanded: true });
    fireEvent.click(button);
    expect(region).toHaveAttribute('inert');
    fireEvent.click(button);
    expect(region).not.toHaveAttribute('inert');
  });

  it('내용 시차: contentInner의 직계 자식이 위에서(y -24) 0으로 snap으로 내려오고, 접을 때는 끝 상태로 확정된다', () => {
    const { button, region, wrapper } = renderRow();
    const inner = region.firstElementChild as HTMLElement;
    fireEvent.click(button);

    const stagger = wrapper.__boardRowStagger;
    expect(stagger).toBeDefined();
    const items = Array.from(inner.children);
    expect(items).toHaveLength(3);
    for (const item of items) {
      const rise = tweensOn(stagger!, item).find((t) => t.vars.y === 0);
      expect(rise, '직계 자식마다 y 트윈이 있어야 한다').toBeDefined();
      expect(rise!.vars.startAt?.y).toBe(-24);
      expect(rise!.vars.ease).toBe(gsapEasing.snap);
    }

    // 접으면 시차가 끝 상태로 확정된다(내용이 그대로 높이에 잘린다).
    fireEvent.click(button);
    expect(stagger!.progress()).toBe(1);
    for (const item of items) {
      expect((item as HTMLElement).style.opacity).toBe('1');
    }

    // 완전히 접힌 뒤 다시 펼치면 새 시차다.
    act(() => {
      timelineOf(wrapper).progress(1);
    });
    fireEvent.click(button);
    expect(wrapper.__boardRowStagger).not.toBe(stagger);
  });

  it('접히는 도중 다시 펼치면 시차를 돌리지 않는다. 내용이 opacity 1·y 0 그대로다(번쩍임 방지)', () => {
    const { button, region, wrapper } = renderRow();
    const items = Array.from(region.firstElementChild!.children);
    fireEvent.click(button);
    act(() => {
      timelineOf(wrapper).progress(1);
    });
    const stagger = wrapper.__boardRowStagger;

    // 접히는 도중(높이가 0이 아니다)에 다시 펼친다.
    fireEvent.click(button);
    act(() => {
      timelineOf(wrapper).pause().progress(0.3);
    });
    expect(Number.parseFloat(wrapper.style.height)).toBeGreaterThan(1);
    fireEvent.click(button);

    expect(wrapper.__boardRowStagger).toBe(stagger);
    for (const item of items) {
      expect((item as HTMLElement).style.opacity).toBe('1');
      expect((item as HTMLElement).style.transform).not.toContain('24');
    }
  });

  it('펼침 중간에 접고 끝까지 진행하면 높이 0·inert다(이전 펼침의 clearProps가 늦게 끼어들지 않는다)', () => {
    const { button, region, wrapper } = renderRow();
    fireEvent.click(button);
    const expand = timelineOf(wrapper);
    const root = expand.parent!;
    act(() => {
      expand.progress(0.1);
    });

    fireEvent.click(button);
    expect(timelineOf(wrapper)).not.toBe(expand);
    runToEnd(root);

    expect(wrapper.style.height).toBe('0px');
    expect(region).toHaveAttribute('inert');
  });

  it('접힘 중간에 펼치고 끝까지 진행하면 인라인 height·inert가 없다(이전 접힘의 onComplete가 늦게 끼어들지 않는다)', () => {
    const { button, region, wrapper } = renderRow({ defaultExpanded: true });
    fireEvent.click(button);
    const collapse = timelineOf(wrapper);
    const root = collapse.parent!;
    act(() => {
      collapse.progress(0.3);
    });

    fireEvent.click(button);
    expect(timelineOf(wrapper)).not.toBe(collapse);
    runToEnd(root);

    expect(wrapper.style.height).toBe('');
    expect(region).not.toHaveAttribute('inert');
  });

  it('도는 도중 축소 선호가 켜지면 진행 중 트윈을 끝 상태로 확정한다', () => {
    let matches = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal(
      'matchMedia',
      (media: string): MediaQueryList =>
        ({
          get matches() {
            return matches;
          },
          media,
          addEventListener: (_: string, l: () => void) => listeners.add(l),
          removeEventListener: (_: string, l: () => void) =>
            listeners.delete(l),
        }) as unknown as MediaQueryList
    );
    const { button, region, wrapper } = renderRow();

    // 펼침 도중
    fireEvent.click(button);
    act(() => {
      timelineOf(wrapper).pause().progress(0.3);
    });
    expect(wrapper.style.height).not.toBe('');
    act(() => {
      matches = true;
      listeners.forEach((l) => l());
    });
    expect(wrapper.style.height).toBe('');
    expect(wrapper.__boardRowStagger!.progress()).toBe(1);

    // 접힘 도중
    matches = false;
    act(() => {
      listeners.forEach((l) => l());
    });
    fireEvent.click(button);
    act(() => {
      timelineOf(wrapper).pause().progress(0.3);
    });
    expect(region).not.toHaveAttribute('inert');
    act(() => {
      matches = true;
      listeners.forEach((l) => l());
    });
    expect(wrapper.style.height).toBe('0px');
    expect(region).toHaveAttribute('inert');
  });
});
