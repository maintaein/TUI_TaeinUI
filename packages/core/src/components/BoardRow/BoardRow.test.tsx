import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardRow } from './BoardRow';

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

  it('iconContainer(쉐브론) 회전이 리터럴 ease 대신 settle을 쓴다', () => {
    const iconBlock = cssSource.match(
      /export const iconContainer = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(iconBlock, 'iconContainer 블록을 찾지 못했다').toBeDefined();
    expect(iconBlock).not.toMatch(
      /transition: `transform \$\{themeContract\.animation\.duration\.base\} ease`/
    );
    expect(iconBlock).toContain('themeContract.animation.easing.settle');
  });

  it('contentWrapper의 grid-template-rows가 ease-in-out 대신 exit(접힘)/settle(펼침, wrapperExpanded 오버라이드)로 쪼개진다 — M1 근거 주석 유지', () => {
    expect(cssSource).toContain(
      'grid-template-rows는 transform·opacity가 아니라 레이아웃 속성이라 매 프레임'
    );
    expect(cssSource).toContain(
      '미리 알 수 없어서다 — max-height 근사는 점프하거나 늦게 끝나고, 높이를'
    );

    const wrapperBlock = cssSource.match(
      /export const contentWrapper = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(wrapperBlock, 'contentWrapper 블록을 찾지 못했다').toBeDefined();
    expect(wrapperBlock).not.toContain('ease-in-out');
    // 조항 3은 길이에도 걸린다(리뷰 F8) — 물러날 때(접힘)는 진입(slow)의
    // 60~70%로 짧다. calc(* 0.65) 비율이다.
    expect(wrapperBlock).toContain(
      'grid-template-rows calc(${themeContract.animation.duration.slow} * 0.65) ${themeContract.animation.easing.exit}'
    );

    const expandedBlock = cssSource.match(
      /export const wrapperExpanded = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(expandedBlock, 'wrapperExpanded 블록을 찾지 못했다').toBeDefined();
    // 펼침(진입)은 단축 없이 slow 전체 길이를 되찾는다(리뷰 F8).
    expect(expandedBlock).toContain(
      'transitionDuration: themeContract.animation.duration.slow'
    );
    expect(expandedBlock).toContain(
      'transitionTimingFunction: themeContract.animation.easing.settle'
    );
  });
});
