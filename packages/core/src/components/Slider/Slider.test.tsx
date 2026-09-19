import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Slider } from './Slider';

describe('Slider', () => {
  describe('렌더링 테스트', () => {
    it('기본적으로 렌더링된다', () => {
      render(<Slider label="볼륨" />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByLabelText('볼륨')).toBeInTheDocument();
    });

    it('label을 렌더링한다', () => {
      render(<Slider label="밝기 조절" />);

      expect(screen.getByText('밝기 조절')).toBeInTheDocument();
    });

    it('기본값은 0이다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('0');
    });

    it('value prop으로 초기값을 설정할 수 있다', () => {
      render(<Slider label="슬라이더" value={50} onChange={() => {}} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50');
    });

    it('현재 값을 표시한다', () => {
      render(<Slider label="볼륨" value={75} onChange={() => {}} showValue />);

      expect(screen.getByText('75')).toBeInTheDocument();
    });
  });

  describe('min/max/step prop 테스트', () => {
    it('min 값을 설정할 수 있다', () => {
      render(<Slider label="슬라이더" min={10} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '10');
    });

    it('max 값을 설정할 수 있다', () => {
      render(<Slider label="슬라이더" max={200} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '200');
    });

    it('step 값을 설정할 수 있다', () => {
      render(<Slider label="슬라이더" step={5} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '5');
    });

    it('기본 min은 0이다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
    });

    it('기본 max는 100이다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '100');
    });

    it('기본 step은 1이다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '1');
    });
  });

  describe('size prop 테스트', () => {
    it('size="sm"을 적용한다', () => {
      render(<Slider label="슬라이더" size="sm" />);

      const container = screen.getByRole('slider').closest('div');
      expect(container?.className).toContain('sm');
    });

    it('size="md"를 기본값으로 적용한다', () => {
      render(<Slider label="슬라이더" />);

      const container = screen.getByRole('slider').closest('div');
      expect(container?.className).toContain('md');
    });

    it('size="lg"를 적용한다', () => {
      render(<Slider label="슬라이더" size="lg" />);

      const container = screen.getByRole('slider').closest('div');
      expect(container?.className).toContain('lg');
    });
  });

  describe('disabled prop 테스트', () => {
    it('disabled 상태를 적용한다', () => {
      render(<Slider label="슬라이더" disabled />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });

    it('disabled 상태에서는 onChange가 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" disabled onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      await user.click(slider);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('이벤트 핸들러 테스트', () => {
    it('값 변경 시 onChange가 호출된다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;

      const event = new Event('input', { bubbles: true });
      Object.defineProperty(slider, 'value', { writable: true, value: 75 });
      slider.dispatchEvent(event);

      expect(handleChange).toHaveBeenCalled();
    });

    it('onChange에 올바른 값이 전달된다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;

      const event = new Event('input', { bubbles: true });
      Object.defineProperty(slider, 'value', { writable: true, value: 75 });
      slider.dispatchEvent(event);

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('접근성 테스트', () => {
    it('role="slider"를 가진다', () => {
      render(<Slider label="슬라이더" />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('aria-label이 설정된다', () => {
      render(<Slider label="볼륨 조절" />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-label', '볼륨 조절');
    });

    it('aria-valuemin이 설정된다', () => {
      render(<Slider label="슬라이더" min={10} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '10');
    });

    it('aria-valuemax가 설정된다', () => {
      render(<Slider label="슬라이더" max={200} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemax', '200');
    });

    it('aria-valuenow가 현재 값으로 설정된다', () => {
      render(<Slider label="슬라이더" value={50} onChange={() => {}} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('aria-disabled가 disabled 상태를 반영한다', () => {
      render(<Slider label="슬라이더" disabled />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Arrow Right 키로 값을 증가시킬 수 있다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('Arrow Left 키로 값을 감소시킬 수 있다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('Arrow Up 키로 값을 증가시킬 수 있다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('Arrow Down 키로 값을 감소시킬 수 있다', () => {
      const handleChange = vi.fn();

      render(<Slider label="슬라이더" value={50} onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('Home 키로 최소값으로 이동할 수 있다', () => {
      const handleChange = vi.fn();

      render(
        <Slider label="슬라이더" value={50} min={10} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
      });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });

    it('End 키로 최대값으로 이동할 수 있다', () => {
      const handleChange = vi.fn();

      render(
        <Slider label="슬라이더" value={50} max={200} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      slider.dispatchEvent(event);

      expect(slider).toHaveFocus();
    });
  });

  describe('helper text 테스트', () => {
    it('helperText를 렌더링한다', () => {
      render(
        <Slider label="볼륨" helperText="0부터 100까지 조절할 수 있습니다" />
      );

      expect(
        screen.getByText('0부터 100까지 조절할 수 있습니다')
      ).toBeInTheDocument();
    });

    it('helperText가 slider와 연결된다', () => {
      render(<Slider label="볼륨" helperText="도움말 텍스트" />);

      const slider = screen.getByRole('slider');
      const helperText = screen.getByText('도움말 텍스트');

      expect(slider).toHaveAccessibleDescription('도움말 텍스트');
      expect(helperText.id).toBeTruthy();
    });
  });

  describe('marks prop 테스트', () => {
    it('marks를 렌더링한다', () => {
      const marks = [
        { value: 0, label: '0%' },
        { value: 50, label: '50%' },
        { value: 100, label: '100%' },
      ];

      render(<Slider label="슬라이더" marks={marks} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('marks 없이도 렌더링된다', () => {
      render(<Slider label="슬라이더" />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('min과 max가 같을 때 렌더링된다', () => {
      render(<Slider label="슬라이더" min={50} max={50} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('음수 값을 지원한다', () => {
      render(
        <Slider
          label="슬라이더"
          min={-100}
          max={100}
          value={-50}
          onChange={() => {}}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('-50');
    });

    it('소수점 step을 지원한다', () => {
      render(<Slider label="슬라이더" step={0.1} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '0.1');
    });

    it('className을 추가할 수 있다', () => {
      render(<Slider label="슬라이더" className="custom-slider" />);

      const container = screen.getByRole('slider').parentElement?.parentElement;
      expect(container?.className).toContain('custom-slider');
    });

    it('value와 onChange가 동시에 제공되면 제어 컴포넌트로 동작한다', () => {
      const ControlledSlider = () => {
        const [value, setValue] = React.useState(50);
        return (
          <Slider
            label="제어 슬라이더"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(Number(e.target.value))
            }
          />
        );
      };

      render(<ControlledSlider />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50');
    });
  });

  describe('trackColor prop 테스트', () => {
    it('기본 fill 트랙이 렌더링된다', () => {
      const { container } = render(
        <Slider label="슬라이더" value={50} onChange={() => {}} />
      );

      const fillTrack = container.querySelector('[class*="sliderFillTrack"]');
      expect(fillTrack).toBeInTheDocument();
      expect(fillTrack).toHaveStyle({ '--slider-fill-scale': '0.5' });
    });

    it('trackColor로 fill 트랙 색상을 변경할 수 있다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={50}
          onChange={() => {}}
          trackColor="#ff0000"
        />
      );

      const fillTrack = container.querySelector('[class*="sliderFillTrack"]');
      expect(fillTrack).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('value가 min일 때 fill 채움 비율이 0이다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={0}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );

      const fillTrack = container.querySelector('[class*="sliderFillTrack"]');
      expect(fillTrack).toHaveStyle({ '--slider-fill-scale': '0' });
    });

    it('value가 max일 때 fill 채움 비율이 1이다', () => {
      const { container } = render(
        <Slider
          label="슬라이더"
          value={100}
          min={0}
          max={100}
          onChange={() => {}}
        />
      );

      const fillTrack = container.querySelector('[class*="sliderFillTrack"]');
      expect(fillTrack).toHaveStyle({ '--slider-fill-scale': '1' });
    });
  });

  describe('required prop 테스트', () => {
    it('required 표시를 렌더링한다', () => {
      render(<Slider label="필수 슬라이더" required />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('required 속성이 slider에 설정된다', () => {
      render(<Slider label="필수 슬라이더" required />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('required');
    });
  });

  describe('showValue prop 테스트', () => {
    it('showValue가 true일 때 현재 값을 표시한다', () => {
      render(<Slider label="볼륨" value={60} onChange={() => {}} showValue />);

      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('showValue가 false일 때 값을 표시하지 않는다', () => {
      render(
        <Slider label="볼륨" value={60} onChange={() => {}} showValue={false} />
      );

      expect(screen.queryByText('60')).not.toBeInTheDocument();
    });

    it('기본값은 showValue={false}이다', () => {
      render(<Slider label="볼륨" value={60} onChange={() => {}} />);

      expect(screen.queryByText('60')).not.toBeInTheDocument();
    });
  });
});
