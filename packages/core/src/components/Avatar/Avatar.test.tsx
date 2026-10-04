import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Avatar, AvatarGroup } from './Avatar';

const AVATAR_CSS = readFileSync(resolve(__dirname, './Avatar.css.ts'), 'utf-8');

/** `export const <name> = style({ ... });` 블록 본문을 돌려준다. */
const cssBlock = (name: string): string => {
  const start = AVATAR_CSS.indexOf(`export const ${name} = style({`);
  return AVATAR_CSS.slice(start, AVATAR_CSS.indexOf('\n});', start));
};

describe('Avatar', () => {
  describe('렌더링 테스트', () => {
    it('기본 Avatar가 렌더링된다', () => {
      render(<Avatar alt="테스트 사용자" />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('이미지가 제공되면 img 요소가 렌더링된다', () => {
      render(
        <Avatar src="https://example.com/avatar.jpg" alt="테스트 사용자" />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(img).toHaveAttribute('alt', '테스트 사용자');
    });

    it('이미지가 없으면 fallback 텍스트가 표시된다', () => {
      render(<Avatar alt="홍길동" />);

      expect(screen.getByText('홍')).toBeInTheDocument();
    });

    it('children이 있으면 children이 표시된다', () => {
      render(<Avatar alt="홍길동">HG</Avatar>);

      expect(screen.getByText('HG')).toBeInTheDocument();
    });
  });

  describe('size prop 테스트', () => {
    it('size="xs"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Avatar size="xs" alt="테스트" />);

      expect(container.firstChild).toHaveClass(/sizeStyles_xs/);
    });

    it('size="sm"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Avatar size="sm" alt="테스트" />);

      expect(container.firstChild).toHaveClass(/sizeStyles_sm/);
    });

    it('size="md"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Avatar size="md" alt="테스트" />);

      expect(container.firstChild).toHaveClass(/sizeStyles_md/);
    });

    it('size="lg"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Avatar size="lg" alt="테스트" />);

      expect(container.firstChild).toHaveClass(/sizeStyles_lg/);
    });

    it('size="xl"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Avatar size="xl" alt="테스트" />);

      expect(container.firstChild).toHaveClass(/sizeStyles_xl/);
    });

    it('기본값은 "md"이다', () => {
      const { container } = render(<Avatar alt="테스트" />);

      expect(container.firstChild).toHaveClass(/sizeStyles_md/);
    });
  });

  describe('variant prop 테스트', () => {
    it('variant="circular"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Avatar variant="circular" alt="테스트" />);

      expect(container.firstChild).toHaveClass(/variantStyles_circular/);
    });

    it('variant="rounded"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Avatar variant="rounded" alt="테스트" />);

      expect(container.firstChild).toHaveClass(/variantStyles_rounded/);
    });

    it('variant="square"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Avatar variant="square" alt="테스트" />);

      expect(container.firstChild).toHaveClass(/variantStyles_square/);
    });

    it('기본값은 "circular"이다', () => {
      const { container } = render(<Avatar alt="테스트" />);

      expect(container.firstChild).toHaveClass(/variantStyles_circular/);
    });
  });

  describe('이미지 로딩 실패 처리', () => {
    it('이미지 로딩 실패 시 fallback 텍스트가 표시된다', async () => {
      render(<Avatar src="invalid-image.jpg" alt="홍길동" />);

      const img = screen.getByRole('img');

      // 이미지 로딩 실패 시뮬레이션
      await act(async () => {
        img.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        expect(screen.getByText('홍')).toBeInTheDocument();
      });
    });

    it('onError 콜백이 호출된다', async () => {
      const handleError = vi.fn();
      render(
        <Avatar src="invalid-image.jpg" alt="테스트" onError={handleError} />
      );

      const img = screen.getByRole('img');
      await act(async () => {
        img.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled();
      });
    });
  });

  describe('fallback 텍스트 생성', () => {
    it('영문 이름의 첫 글자를 대문자로 표시한다', () => {
      render(<Avatar alt="john" />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('한글 이름의 첫 글자를 표시한다', () => {
      render(<Avatar alt="김철수" />);

      expect(screen.getByText('김')).toBeInTheDocument();
    });

    it('공백으로 구분된 이름의 첫 두 글자를 표시한다', () => {
      render(<Avatar alt="John Doe" />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('빈 alt일 때 물음표를 표시한다', () => {
      render(<Avatar alt="" />);

      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('상태 표시 (status badge)', () => {
    it('status가 없으면 badge가 표시되지 않는다', () => {
      const { container } = render(<Avatar alt="테스트" />);

      const badge = container.querySelector('[class*="statusBadge"]');
      expect(badge).not.toBeInTheDocument();
    });

    it('status="online"일 때 badge가 표시된다', () => {
      const { container } = render(<Avatar alt="테스트" status="online" />);

      const badge = container.querySelector('[class*="statusBadge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(/statusOnline/);
    });

    it('status="offline"일 때 badge가 표시된다', () => {
      const { container } = render(<Avatar alt="테스트" status="offline" />);

      const badge = container.querySelector('[class*="statusBadge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(/statusOffline/);
    });

    it('status="busy"일 때 badge가 표시된다', () => {
      const { container } = render(<Avatar alt="테스트" status="busy" />);

      const badge = container.querySelector('[class*="statusBadge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(/statusBusy/);
    });

    it('status="away"일 때 badge가 표시된다', () => {
      const { container } = render(<Avatar alt="테스트" status="away" />);

      const badge = container.querySelector('[class*="statusBadge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(/statusAway/);
    });
  });

  describe('상태 배지는 원형 클립 밖에 있다', () => {
    it('배지가 overflow: hidden 래퍼의 자손이 아니고 루트의 직계 자식이다', () => {
      const { container } = render(<Avatar alt="테스트" status="online" />);
      const root = container.firstChild as HTMLElement;
      const badge = container.querySelector('[class*="statusBadge"]');

      expect(badge?.closest('[class*="avatarClip"]')).toBeNull();
      expect(badge?.parentElement).toBe(root);
      expect(cssBlock('avatarClip')).toMatch(/overflow: 'hidden'/);
      expect(cssBlock('avatarClip')).toMatch(/borderRadius: 'inherit'/);
      // 루트가 클립하면 원형에서 모서리의 배지가 깎인다.
      expect(cssBlock('avatar')).not.toMatch(/overflow/);
    });

    it('이니셜 fallback과 children은 클립 래퍼 안에 있다', () => {
      const { rerender } = render(<Avatar alt="홍길동" />);
      expect(
        screen.getByText('홍').closest('[class*="avatarClip"]')
      ).not.toBeNull();

      rerender(<Avatar alt="홍길동">HG</Avatar>);
      expect(
        screen.getByText('HG').closest('[class*="avatarClip"]')
      ).not.toBeNull();
    });

    it('이미지도 클립 래퍼 안에 있다', () => {
      render(<Avatar src="https://example.com/a.jpg" alt="테스트" />);

      expect(
        screen.getByRole('img').closest('[class*="avatarClip"]')
      ).not.toBeNull();
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      const { container } = render(
        <Avatar alt="테스트" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('접근성 테스트', () => {
    it('img role이 있다', () => {
      render(<Avatar alt="테스트 사용자" />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('이미지가 있을 때 alt 속성이 있다', () => {
      render(
        <Avatar src="https://example.com/avatar.jpg" alt="테스트 사용자" />
      );

      expect(screen.getByRole('img')).toHaveAttribute('alt', '테스트 사용자');
    });

    it('이미지가 없을 때 aria-label이 있다', () => {
      render(<Avatar alt="홍길동" />);

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('aria-label', '홍길동');
    });
  });

  describe('클릭 가능 Avatar 테스트', () => {
    it('onClick이 있으면 button으로 렌더링된다', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <Avatar alt="테스트" onClick={handleClick} />
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-label', '테스트');
    });

    it('onClick 클릭 시 핸들러가 호출된다', async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <Avatar alt="테스트" onClick={handleClick} />
      );

      const button = container.querySelector('button');
      button?.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('href가 있으면 a 태그로 렌더링된다', () => {
      const { container } = render(<Avatar alt="프로필" href="/profile" />);

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/profile');
      expect(link).toHaveAttribute('aria-label', '프로필');
    });

    it('href와 target이 함께 적용된다', () => {
      const { container } = render(
        <Avatar alt="외부 링크" href="https://example.com" target="_blank" />
      );

      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('target="_blank"일 때 rel="noopener noreferrer"가 자동 적용된다', () => {
      const { container } = render(
        <Avatar alt="외부 링크" href="https://example.com" target="_blank" />
      );

      const link = container.querySelector('a');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('target이 "_blank"가 아닌 경우 rel이 설정되지 않는다', () => {
      const { container } = render(
        <Avatar alt="내부 링크" href="/profile" target="_self" />
      );

      const link = container.querySelector('a');
      expect(link).not.toHaveAttribute('rel');
    });

    it('클릭 가능 Avatar에 clickable 클래스가 적용된다', () => {
      const { container } = render(<Avatar alt="테스트" onClick={() => {}} />);

      expect(container.firstChild).toHaveClass(/clickable/);
    });

    it('onClick이 있으면 aria-* 가 버튼에 붙고 img에는 붙지 않는다', () => {
      const { container } = render(
        <Avatar
          src="https://example.com/a.jpg"
          alt="테스트"
          onClick={() => {}}
          aria-describedby="x"
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-describedby',
        'x'
      );
      expect(container.querySelector('img')).not.toHaveAttribute(
        'aria-describedby'
      );
    });

    it('onClick이 있으면 소비자의 aria-label이 alt 기반 기본 이름을 이긴다', () => {
      render(<Avatar alt="테스트" onClick={() => {}} aria-label="내 프로필" />);

      const button = screen.getByRole('button', { name: '내 프로필' });
      expect(button).toHaveAttribute('aria-label', '내 프로필');
    });

    it('href가 있으면 소비자의 aria-label이 alt 기반 기본 이름을 이긴다', () => {
      render(<Avatar alt="테스트" href="/profile" aria-label="내 프로필" />);

      const link = screen.getByRole('link', { name: '내 프로필' });
      expect(link).toHaveAttribute('aria-label', '내 프로필');
    });

    it('onClick이 없으면 aria-* 는 기존대로 img에 붙는다', () => {
      const { container } = render(
        <Avatar
          src="https://example.com/a.jpg"
          alt="테스트"
          aria-describedby="x"
        />
      );

      expect(container.querySelector('img')).toHaveAttribute(
        'aria-describedby',
        'x'
      );
      expect(container.firstChild).not.toHaveAttribute('aria-describedby');
    });

    it('onClick/href가 없으면 div로 렌더링된다', () => {
      const { container } = render(<Avatar alt="테스트" />);

      expect(container.querySelector('div')).toBeInTheDocument();
      expect(container.querySelector('button')).not.toBeInTheDocument();
      expect(container.querySelector('a')).not.toBeInTheDocument();
    });
  });
});

describe('AvatarGroup', () => {
  describe('렌더링 테스트', () => {
    it('여러 Avatar를 렌더링한다', () => {
      render(
        <AvatarGroup>
          <Avatar alt="사용자 1" />
          <Avatar alt="사용자 2" />
          <Avatar alt="사용자 3" />
        </AvatarGroup>
      );

      expect(screen.getByText('사1')).toBeInTheDocument();
      expect(screen.getAllByRole('img')).toHaveLength(3);
    });

    it('max prop으로 표시할 Avatar 수를 제한한다', () => {
      render(
        <AvatarGroup max={2}>
          <Avatar alt="사용자 1" />
          <Avatar alt="사용자 2" />
          <Avatar alt="사용자 3" />
          <Avatar alt="사용자 4" />
        </AvatarGroup>
      );

      const avatars = screen.getAllByRole('img');
      // max=2이므로 2개 + "+2" 표시용 1개 = 3개
      expect(avatars).toHaveLength(3);
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('max가 없으면 모든 Avatar를 표시한다', () => {
      render(
        <AvatarGroup>
          <Avatar alt="사용자 1" />
          <Avatar alt="사용자 2" />
          <Avatar alt="사용자 3" />
        </AvatarGroup>
      );

      expect(screen.getAllByRole('img')).toHaveLength(3);
    });

    it('max보다 적은 Avatar는 모두 표시한다', () => {
      render(
        <AvatarGroup max={5}>
          <Avatar alt="사용자 1" />
          <Avatar alt="사용자 2" />
        </AvatarGroup>
      );

      expect(screen.getAllByRole('img')).toHaveLength(2);
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });
  });

  describe('spacing prop 테스트', () => {
    it('spacing="sm"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <AvatarGroup spacing="sm">
          <Avatar alt="사용자 1" />
        </AvatarGroup>
      );

      const group = container.firstChild as HTMLElement;
      const avatar = group.firstChild as HTMLElement;
      expect(avatar).toHaveClass(/spacingStyles_sm/);
    });

    it('spacing="md"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <AvatarGroup spacing="md">
          <Avatar alt="사용자 1" />
        </AvatarGroup>
      );

      const group = container.firstChild as HTMLElement;
      const avatar = group.firstChild as HTMLElement;
      expect(avatar).toHaveClass(/spacingStyles_md/);
    });

    it('spacing="lg"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <AvatarGroup spacing="lg">
          <Avatar alt="사용자 1" />
        </AvatarGroup>
      );

      const group = container.firstChild as HTMLElement;
      const avatar = group.firstChild as HTMLElement;
      expect(avatar).toHaveClass(/spacingStyles_lg/);
    });

    it('기본값은 "md"이다', () => {
      const { container } = render(
        <AvatarGroup>
          <Avatar alt="사용자 1" />
        </AvatarGroup>
      );

      const group = container.firstChild as HTMLElement;
      const avatar = group.firstChild as HTMLElement;
      expect(avatar).toHaveClass(/spacingStyles_md/);
    });
  });

  describe('복합 시나리오 테스트', () => {
    it('그룹 내 Avatar의 크기를 일괄 조정할 수 있다', () => {
      const { container } = render(
        <AvatarGroup size="lg">
          <Avatar alt="사용자 1" />
          <Avatar alt="사용자 2" />
        </AvatarGroup>
      );

      const avatars = container.querySelectorAll('[class*="sizeStyles_lg"]');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('그룹에 className을 적용할 수 있다', () => {
      const { container } = render(
        <AvatarGroup className="custom-group">
          <Avatar alt="사용자 1" />
        </AvatarGroup>
      );

      expect(container.firstChild).toHaveClass('custom-group');
    });
  });
});
