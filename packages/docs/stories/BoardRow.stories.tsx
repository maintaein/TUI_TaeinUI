import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BoardRow } from '@taein-ui/core';

const meta = {
  title: 'Layout/BoardRow',
  component: BoardRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    title: '',
    children: '',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'filled'],
      description: '아코디언 스타일',
    },
    defaultExpanded: {
      control: 'boolean',
      description: '기본 펼침 상태',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
} satisfies Meta<typeof BoardRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시
export const Default: Story = {
  args: {
    title: '질문입니다',
    children: '답변 내용이 여기에 표시됩니다.',
  },
};

// 펼쳐진 상태
export const Expanded: Story = {
  args: {
    title: '펼쳐진 아코디언',
    children: '이 아코디언은 기본적으로 펼쳐져 있습니다.',
    defaultExpanded: true,
  },
};

// Variant - Default
export const VariantDefault: Story = {
  name: 'Variant: Default',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <BoardRow title="Default 스타일" variant="default">
        배경색이 투명한 기본 스타일입니다.
      </BoardRow>
      <BoardRow title="또 다른 질문" variant="default" defaultExpanded>
        펼쳐진 상태의 Default 스타일입니다.
      </BoardRow>
    </div>
  ),
};

// Variant - Outlined
export const VariantOutlined: Story = {
  name: 'Variant: Outlined',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <BoardRow title="Outlined 스타일" variant="outlined">
        테두리가 있는 아웃라인 스타일입니다.
      </BoardRow>
      <BoardRow title="또 다른 질문" variant="outlined" defaultExpanded>
        펼쳐진 상태의 Outlined 스타일입니다.
      </BoardRow>
    </div>
  ),
};

// Variant - Filled
export const VariantFilled: Story = {
  name: 'Variant: Filled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <BoardRow title="Filled 스타일" variant="filled">
        배경색이 있는 채워진 스타일입니다.
      </BoardRow>
      <BoardRow title="또 다른 질문" variant="filled" defaultExpanded>
        펼쳐진 상태의 Filled 스타일입니다.
      </BoardRow>
    </div>
  ),
};

// 비활성화 상태
export const Disabled: Story = {
  args: {
    title: '비활성화된 아코디언',
    children: '이 아코디언은 비활성화되어 클릭할 수 없습니다.',
    disabled: true,
  },
};

// FAQ 예시 (다중 아코디언)
export const FAQExample: Story = {
  name: 'FAQ 예시',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <BoardRow title="배송은 얼마나 걸리나요?" variant="outlined">
        <p>일반 배송은 주문 후 2-3일 정도 소요됩니다.</p>
        <p>제주도 및 도서산간 지역은 추가 1-2일이 소요될 수 있습니다.</p>
      </BoardRow>
      <BoardRow title="반품은 어떻게 하나요?" variant="outlined">
        <p>제품 수령 후 7일 이내에 반품이 가능합니다.</p>
        <ul>
          <li>제품이 미개봉 상태여야 합니다</li>
          <li>택배비는 고객 부담입니다</li>
          <li>제품 하자 시 무료 반품 가능</li>
        </ul>
      </BoardRow>
      <BoardRow title="결제 방법은 무엇이 있나요?" variant="outlined">
        <p>다양한 결제 방법을 지원합니다:</p>
        <ul>
          <li>신용카드/체크카드</li>
          <li>계좌이체</li>
          <li>간편결제 (카카오페이, 네이버페이 등)</li>
        </ul>
      </BoardRow>
      <BoardRow title="회원가입 혜택이 있나요?" variant="outlined">
        <p>회원가입 시 다음과 같은 혜택을 받으실 수 있습니다:</p>
        <ul>
          <li>첫 구매 10% 할인 쿠폰</li>
          <li>적립금 5% 제공</li>
          <li>무료 배송 쿠폰 (월 1회)</li>
        </ul>
      </BoardRow>
    </div>
  ),
};

// 복잡한 컨텐츠 예시
export const ComplexContent: Story = {
  name: '복잡한 컨텐츠',
  render: () => (
    <BoardRow title="상세 정보 보기" variant="filled" defaultExpanded>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h4 style={{ marginTop: 0, marginBottom: '8px' }}>제품 사양</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  브랜드
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  TUI
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  제조국
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  대한민국
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  품질보증
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  1년
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4 style={{ marginTop: 0, marginBottom: '8px' }}>배송 정보</h4>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            - 배송비: 3,000원 (50,000원 이상 무료)
            <br />
            - 배송 기간: 2-3일
            <br />- 배송사: CJ대한통운
          </p>
        </div>
      </div>
    </BoardRow>
  ),
};

// Controlled Mode 예시
export const ControlledMode: Story = {
  name: 'Controlled Mode',
  render: () => {
    const ControlledExample = () => {
      const [expanded, setExpanded] = useState(false);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              {expanded ? '접기' : '펼치기'}
            </button>
          </div>
          <BoardRow
            title="외부에서 제어되는 아코디언"
            variant="outlined"
            expanded={expanded}
            onChange={setExpanded}
          >
            <p>이 아코디언은 외부 버튼으로 제어됩니다.</p>
            <p>현재 상태: {expanded ? '펼침' : '접힘'}</p>
          </BoardRow>
        </div>
      );
    };

    return <ControlledExample />;
  },
};

// 중첩된 컨텐츠 예시
export const NestedContent: Story = {
  name: '중첩된 컨텐츠',
  render: () => (
    <BoardRow title="1단계: 메인 카테고리" variant="outlined" defaultExpanded>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p>메인 카테고리의 설명입니다.</p>
        <BoardRow title="2단계: 서브 카테고리 A" variant="filled">
          <p>서브 카테고리 A의 내용입니다.</p>
        </BoardRow>
        <BoardRow title="2단계: 서브 카테고리 B" variant="filled">
          <p>서브 카테고리 B의 내용입니다.</p>
        </BoardRow>
      </div>
    </BoardRow>
  ),
};

// 긴 컨텐츠 예시
export const LongContent: Story = {
  name: '긴 컨텐츠',
  render: () => (
    <BoardRow title="이용약관" variant="outlined">
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <h4>제1조 (목적)</h4>
        <p>
          이 약관은 회사가 제공하는 서비스의 이용과 관련하여 회사와 이용자의
          권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
        <h4>제2조 (정의)</h4>
        <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
        <ol>
          <li>"서비스"란 회사가 제공하는 모든 서비스를 의미합니다.</li>
          <li>
            "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를
            말합니다.
          </li>
          <li>"회원"이란 회사와 서비스 이용계약을 체결한 자를 말합니다.</li>
        </ol>
        <h4>제3조 (약관의 게시와 개정)</h4>
        <p>
          회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에
          게시합니다. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할
          수 있습니다.
        </p>
        <h4>제4조 (서비스의 제공 및 변경)</h4>
        <p>회사는 다음과 같은 업무를 수행합니다:</p>
        <ol>
          <li>재화 또는 용역에 대한 정보 제공 및 구매계약의 체결</li>
          <li>구매계약이 체결된 재화 또는 용역의 배송</li>
          <li>기타 회사가 정하는 업무</li>
        </ol>
      </div>
    </BoardRow>
  ),
};

// Interactive Playground
export const Interactive: Story = {
  name: '인터랙티브 플레이그라운드',
  args: {
    title: '아코디언 제목을 수정해보세요',
    children: '내용도 수정할 수 있습니다. 다양한 옵션을 시도해보세요!',
    variant: 'outlined',
    defaultExpanded: false,
    disabled: false,
  },
};
