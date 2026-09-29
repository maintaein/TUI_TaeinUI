import type { Meta, StoryObj } from '@storybook/react';
import { List, ListItem } from '@taein-ui/core';

const meta = {
  title: 'Layout/List',
  component: List,
  parameters: {
    layout: 'padded',
  },
  args: {
    children: '',
  },
  tags: ['autodocs'],
  argTypes: {
    spacing: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    divider: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시
export const Default: Story = {
  render: () => (
    <List>
      <ListItem label="이름" value="홍길동" />
      <ListItem label="이메일" value="hong@example.com" />
      <ListItem label="전화번호" value="010-1234-5678" />
    </List>
  ),
};

// Spacing 예시
export const Spacing: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>None - 간격 없음</h3>
        <List spacing="none">
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일" value="hong@example.com" />
          <ListItem label="전화번호" value="010-1234-5678" />
        </List>
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Small - 작은 간격</h3>
        <List spacing="sm">
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일" value="hong@example.com" />
          <ListItem label="전화번호" value="010-1234-5678" />
        </List>
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Medium - 중간 간격 (기본값)</h3>
        <List spacing="md">
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일" value="hong@example.com" />
          <ListItem label="전화번호" value="010-1234-5678" />
        </List>
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Large - 큰 간격</h3>
        <List spacing="lg">
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일" value="hong@example.com" />
          <ListItem label="전화번호" value="010-1234-5678" />
        </List>
      </div>
    </div>
  ),
};

// Divider 예시
export const WithDivider: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '3rem' }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: '1rem' }}>구분선 없음 (기본값)</h3>
        <List>
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일" value="hong@example.com" />
          <ListItem label="전화번호" value="010-1234-5678" />
          <ListItem label="주소" value="서울특별시 강남구" />
        </List>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: '1rem' }}>구분선 있음</h3>
        <List divider>
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일" value="hong@example.com" />
          <ListItem label="전화번호" value="010-1234-5678" />
          <ListItem label="주소" value="서울특별시 강남구" />
        </List>
      </div>
    </div>
  ),
};

// Layout 예시
export const Layout: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>
          Horizontal - 좌우 배치 (기본값)
        </h3>
        <List divider>
          <ListItem label="이름" value="홍길동" layout="horizontal" />
          <ListItem
            label="이메일"
            value="hong@example.com"
            layout="horizontal"
          />
          <ListItem
            label="전화번호"
            value="010-1234-5678"
            layout="horizontal"
          />
        </List>
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Vertical - 상하 배치</h3>
        <List divider>
          <ListItem label="이름" value="홍길동" layout="vertical" />
          <ListItem label="이메일" value="hong@example.com" layout="vertical" />
          <ListItem label="전화번호" value="010-1234-5678" layout="vertical" />
        </List>
      </div>
    </div>
  ),
};

// Align 예시
export const Align: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Start - 시작점 정렬</h3>
        <List divider>
          <ListItem
            label="제목"
            value="긴 텍스트 예시입니다. 여러 줄로 표시될 수 있습니다. 정렬 방식을 확인하세요."
            align="start"
          />
          <ListItem label="짧은 제목" value="짧은 내용" align="start" />
        </List>
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Center - 중앙 정렬 (기본값)</h3>
        <List divider>
          <ListItem
            label="제목"
            value="긴 텍스트 예시입니다. 여러 줄로 표시될 수 있습니다. 정렬 방식을 확인하세요."
            align="center"
          />
          <ListItem label="짧은 제목" value="짧은 내용" align="center" />
        </List>
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>End - 끝점 정렬</h3>
        <List divider>
          <ListItem
            label="제목"
            value="긴 텍스트 예시입니다. 여러 줄로 표시될 수 있습니다. 정렬 방식을 확인하세요."
            align="end"
          />
          <ListItem label="짧은 제목" value="짧은 내용" align="end" />
        </List>
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Baseline - 베이스라인 정렬</h3>
        <List divider>
          <ListItem
            label="제목"
            value="긴 텍스트 예시입니다. 여러 줄로 표시될 수 있습니다. 정렬 방식을 확인하세요."
            align="baseline"
          />
          <ListItem label="짧은 제목" value="짧은 내용" align="baseline" />
        </List>
      </div>
    </div>
  ),
};

// LabelWidth 예시
export const LabelWidth: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '3rem' }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: '1rem' }}>Auto Width (기본값)</h3>
        <List divider>
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일 주소" value="hong@example.com" />
          <ListItem label="전화" value="010-1234-5678" />
        </List>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: '1rem' }}>Fixed Width (100px)</h3>
        <List divider>
          <ListItem label="이름" value="홍길동" labelWidth="100px" />
          <ListItem
            label="이메일 주소"
            value="hong@example.com"
            labelWidth="100px"
          />
          <ListItem label="전화" value="010-1234-5678" labelWidth="100px" />
        </List>
      </div>
    </div>
  ),
};

// 사용자 프로필 예시
export const UserProfile: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
      }}
    >
      <h2 style={{ margin: '0 0 1.5rem 0' }}>사용자 프로필</h2>
      <List divider spacing="lg">
        <ListItem label="이름" value="홍길동" labelWidth="120px" />
        <ListItem label="이메일" value="hong@example.com" labelWidth="120px" />
        <ListItem label="전화번호" value="010-1234-5678" labelWidth="120px" />
        <ListItem label="부서" value="개발팀" labelWidth="120px" />
        <ListItem label="직급" value="선임 개발자" labelWidth="120px" />
        <ListItem label="입사일" value="2020년 3월 15일" labelWidth="120px" />
      </List>
    </div>
  ),
};

// 주문 상세 정보 예시
export const OrderDetails: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
      }}
    >
      <h2 style={{ margin: '0 0 1.5rem 0' }}>주문 상세 정보</h2>
      <List divider spacing="md">
        <ListItem
          label="주문 번호"
          value="ORD-20231215-001"
          labelWidth="120px"
        />
        <ListItem
          label="주문 일자"
          value="2023년 12월 15일"
          labelWidth="120px"
        />
        <ListItem
          label="상품명"
          value="무선 블루투스 이어폰"
          labelWidth="120px"
        />
        <ListItem label="수량" value="2개" labelWidth="120px" />
        <ListItem label="가격" value="89,000원" labelWidth="120px" />
        <ListItem label="배송비" value="무료" labelWidth="120px" />
        <ListItem
          label="총 결제 금액"
          value={
            <strong style={{ fontSize: '1.2em', color: '#0066ff' }}>
              178,000원
            </strong>
          }
          labelWidth="120px"
        />
      </List>
    </div>
  ),
};

// 설정 메뉴 예시
export const SettingsMenu: Story = {
  render: () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1.5rem 0' }}>설정</h2>
      <List divider>
        <ListItem
          label="알림 설정"
          value={
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" defaultChecked />
              <span>알림 받기</span>
            </label>
          }
          layout="vertical"
          align="start"
        />
        <ListItem
          label="언어 설정"
          value={
            <select
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            >
              <option>한국어</option>
              <option>English</option>
              <option>日本語</option>
            </select>
          }
          layout="vertical"
          align="start"
        />
      </List>
    </div>
  ),
};

// 통계 정보 예시
export const Statistics: Story = {
  render: () => (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1.5rem 0' }}>이번 달 통계</h2>
      <List spacing="lg">
        <ListItem
          label="총 방문자 수"
          value={
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '2em',
                  fontWeight: 'bold',
                  color: '#0066ff',
                }}
              >
                12,345
              </div>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                전월 대비 +12%
              </div>
            </div>
          }
          labelWidth="150px"
        />
        <ListItem
          label="신규 가입자"
          value={
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '2em',
                  fontWeight: 'bold',
                  color: '#00c853',
                }}
              >
                1,234
              </div>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                전월 대비 +8%
              </div>
            </div>
          }
          labelWidth="150px"
        />
        <ListItem
          label="총 매출"
          value={
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '2em',
                  fontWeight: 'bold',
                  color: '#ff6d00',
                }}
              >
                ₩45,678,900
              </div>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                전월 대비 +15%
              </div>
            </div>
          }
          labelWidth="150px"
        />
      </List>
    </div>
  ),
};

// 혼합 레이아웃 예시
export const MixedLayout: Story = {
  render: () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1.5rem 0' }}>프로젝트 정보</h2>
      <List divider spacing="lg">
        <ListItem
          label="프로젝트명"
          value="TUI - TaeinUI"
          layout="horizontal"
          labelWidth="120px"
        />
        <ListItem
          label="상태"
          value={
            <span style={{ color: '#00c853', fontWeight: 'bold' }}>
              진행 중
            </span>
          }
          layout="horizontal"
          labelWidth="120px"
        />
        <ListItem
          label="설명"
          value="React와 TypeScript 기반의 재사용 가능한 컴포넌트 라이브러리입니다. Vanilla Extract CSS를 사용하여 타입 안전한 스타일링을 제공합니다."
          layout="vertical"
          align="start"
        />
        <ListItem
          label="기술 스택"
          value={
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '16px',
                  fontSize: '0.9em',
                }}
              >
                React
              </span>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '16px',
                  fontSize: '0.9em',
                }}
              >
                TypeScript
              </span>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '16px',
                  fontSize: '0.9em',
                }}
              >
                Vanilla Extract
              </span>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '16px',
                  fontSize: '0.9em',
                }}
              >
                Storybook
              </span>
            </div>
          }
          layout="vertical"
          align="start"
        />
        <ListItem
          label="시작일"
          value="2023년 12월 1일"
          layout="horizontal"
          labelWidth="120px"
        />
        <ListItem
          label="종료 예정일"
          value="2024년 1월 31일"
          layout="horizontal"
          labelWidth="120px"
        />
      </List>
    </div>
  ),
};

// 인터랙티브 플레이그라운드
export const Interactive: Story = {
  args: {
    spacing: 'md',
    divider: false,
  },
  render: (args) => (
    <List {...args}>
      <ListItem label="이름" value="홍길동" labelWidth="100px" />
      <ListItem label="이메일" value="hong@example.com" labelWidth="100px" />
      <ListItem label="전화번호" value="010-1234-5678" labelWidth="100px" />
      <ListItem label="주소" value="서울특별시 강남구" labelWidth="100px" />
    </List>
  ),
};
