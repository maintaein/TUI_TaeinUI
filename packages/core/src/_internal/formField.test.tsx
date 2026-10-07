import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './formField';
import * as core from '../index';

describe('FormField', () => {
  describe('기본 렌더링', () => {
    it('label을 렌더링한다', () => {
      render(
        <FormField label="이름">
          {({ inputId, helperId, hasHelper }) => (
            <input
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
            />
          )}
        </FormField>
      );

      expect(screen.getByText('이름')).toBeInTheDocument();
    });

    it('children render prop을 호출한다', () => {
      render(
        <FormField label="이메일">
          {({ inputId }) => <input id={inputId} data-testid="test-input" />}
        </FormField>
      );

      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('fullWidth prop을 지원한다', () => {
      const { container } = render(
        <FormField label="주소" fullWidth>
          {({ inputId }) => <input id={inputId} />}
        </FormField>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass(/fullWidth/);
    });
  });

  describe('Label 테스트', () => {
    it('label과 input이 htmlFor/id로 연결된다', () => {
      render(
        <FormField label="전화번호">
          {({ inputId }) => <input id={inputId} />}
        </FormField>
      );

      const label = screen.getByText('전화번호');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', input.id);
    });

    it('required prop이 true면 * 표시를 렌더링한다', () => {
      render(
        <FormField label="이름" required>
          {({ inputId }) => <input id={inputId} />}
        </FormField>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('required prop이 false면 * 표시를 렌더링하지 않는다', () => {
      render(
        <FormField label="이름" required={false}>
          {({ inputId }) => <input id={inputId} />}
        </FormField>
      );

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text 테스트', () => {
    it('helperText를 렌더링한다', () => {
      render(
        <FormField label="비밀번호" helperText="8자 이상 입력하세요">
          {({ inputId, helperId, hasHelper }) => (
            <input
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
            />
          )}
        </FormField>
      );

      expect(screen.getByText('8자 이상 입력하세요')).toBeInTheDocument();
    });

    it('helperText가 없으면 렌더링하지 않는다', () => {
      const { container } = render(
        <FormField label="이름">
          {({ inputId }) => <input id={inputId} />}
        </FormField>
      );

      const helperTexts = container.querySelectorAll('[class*="helperText"]');
      expect(helperTexts.length).toBe(0);
    });

    it('helper text와 input이 aria-describedby로 연결된다', () => {
      render(
        <FormField label="이메일" helperText="example@email.com 형식으로 입력">
          {({ inputId, helperId, hasHelper }) => (
            <input
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
            />
          )}
        </FormField>
      );

      const input = screen.getByRole('textbox');
      const helperText = screen.getByText('example@email.com 형식으로 입력');

      expect(input).toHaveAttribute('aria-describedby', helperText.id);
    });
  });

  describe('Error Message 테스트', () => {
    it('error와 errorMessage가 있으면 에러 메시지를 렌더링한다', () => {
      render(
        <FormField
          label="이메일"
          error
          errorMessage="올바른 이메일을 입력하세요"
        >
          {({ inputId, helperId, hasHelper, isError }) => (
            <input
              id={inputId}
              aria-invalid={isError}
              aria-describedby={hasHelper ? helperId : undefined}
            />
          )}
        </FormField>
      );

      expect(
        screen.getByText('올바른 이메일을 입력하세요')
      ).toBeInTheDocument();
    });

    it('error가 true지만 errorMessage가 없으면 메시지를 렌더링하지 않는다', () => {
      const { container } = render(
        <FormField label="이름" error>
          {({ inputId }) => <input id={inputId} />}
        </FormField>
      );

      const errorMessages = container.querySelectorAll(
        '[class*="errorMessage"]'
      );
      expect(errorMessages.length).toBe(0);
    });

    it('error 상태일 때 helperText 대신 errorMessage를 렌더링한다', () => {
      render(
        <FormField
          label="비밀번호"
          helperText="8자 이상 입력"
          error
          errorMessage="필수 입력 항목입니다"
        >
          {({ inputId, helperId, hasHelper }) => (
            <input
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
            />
          )}
        </FormField>
      );

      expect(screen.getByText('필수 입력 항목입니다')).toBeInTheDocument();
      expect(screen.queryByText('8자 이상 입력')).not.toBeInTheDocument();
    });

    it('error message와 input이 aria-describedby로 연결된다', () => {
      render(
        <FormField label="이메일" error errorMessage="필수 입력">
          {({ inputId, helperId, hasHelper, isError }) => (
            <input
              id={inputId}
              aria-invalid={isError}
              aria-describedby={hasHelper ? helperId : undefined}
            />
          )}
        </FormField>
      );

      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('필수 입력');

      expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
    });
  });

  describe('접근성 테스트', () => {
    it('render prop에 inputId를 제공한다', () => {
      let receivedInputId = '';

      render(
        <FormField label="이름">
          {({ inputId }) => {
            receivedInputId = inputId;
            return <input id={inputId} />;
          }}
        </FormField>
      );

      expect(receivedInputId).toBeTruthy();
      expect(typeof receivedInputId).toBe('string');
      expect(receivedInputId.length).toBeGreaterThan(0);
    });

    it('render prop에 helperId를 제공한다', () => {
      let receivedHelperId = '';

      render(
        <FormField label="이름" helperText="도움말">
          {({ helperId }) => {
            receivedHelperId = helperId;
            return <input />;
          }}
        </FormField>
      );

      expect(receivedHelperId).toBeTruthy();
      expect(typeof receivedHelperId).toBe('string');
      expect(receivedHelperId.length).toBeGreaterThan(0);
    });

    it('render prop에 hasHelper 플래그를 제공한다', () => {
      let receivedHasHelper = false;

      render(
        <FormField label="이름" helperText="도움말">
          {({ hasHelper }) => {
            receivedHasHelper = hasHelper;
            return <input />;
          }}
        </FormField>
      );

      expect(receivedHasHelper).toBe(true);
    });

    it('helper가 없으면 hasHelper가 false다', () => {
      let receivedHasHelper = true;

      render(
        <FormField label="이름">
          {({ hasHelper }) => {
            receivedHasHelper = hasHelper;
            return <input />;
          }}
        </FormField>
      );

      expect(receivedHasHelper).toBe(false);
    });

    it('render prop에 isError 플래그를 제공한다', () => {
      let receivedIsError = false;

      render(
        <FormField label="이름" error errorMessage="오류">
          {({ isError }) => {
            receivedIsError = isError;
            return <input aria-invalid={isError} />;
          }}
        </FormField>
      );

      expect(receivedIsError).toBe(true);
    });

    it('error가 아니면 isError가 false다', () => {
      let receivedIsError = true;

      render(
        <FormField label="이름">
          {({ isError }) => {
            receivedIsError = isError;
            return <input />;
          }}
        </FormField>
      );

      expect(receivedIsError).toBe(false);
    });
  });

  describe('복합 시나리오 테스트', () => {
    it('모든 props가 함께 작동한다', () => {
      render(
        <FormField
          label="이메일"
          required
          error
          errorMessage="올바른 이메일을 입력하세요"
          fullWidth
        >
          {({ inputId, helperId, hasHelper, isError }) => (
            <input
              id={inputId}
              type="email"
              aria-invalid={isError}
              aria-describedby={hasHelper ? helperId : undefined}
            />
          )}
        </FormField>
      );

      expect(screen.getByText('이메일')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(
        screen.getByText('올바른 이메일을 입력하세요')
      ).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('className prop을 지원한다', () => {
      const { container } = render(
        <FormField label="이름" className="custom-class">
          {({ inputId }) => <input id={inputId} />}
        </FormField>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('공개 표면', () => {
    it('공개 export에 FormField가 없다 (내부 전용이다)', () => {
      expect(core).not.toHaveProperty('FormField');
    });
  });
});
