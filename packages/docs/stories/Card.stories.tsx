import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@taein-ui/core';

// Compound API (Card) - 기본 컴포넌트

const meta = {
  title: 'Data Display/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: ' ',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['outlined', 'elevated', 'filled'],
      description: '카드 스타일',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    hoverLift: {
      control: 'boolean',
      description: '마우스를 올리면 떠오르고 누르면 눌린다 (기본 꺼짐)',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시 (Compound API)
export const Default: Story = {
  args: { children: null },
  render: () => (
    <Card style={{ width: '300px' }}>
      <Card.Body>기본 카드 내용입니다.</Card.Body>
    </Card>
  ),
};

// Variant 옵션
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Card variant="outlined" style={{ width: '200px' }}>
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>Outlined</h3>
          <p>테두리가 있는 카드</p>
        </Card.Body>
      </Card>
      <Card variant="elevated" style={{ width: '200px' }}>
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>Elevated</h3>
          <p>그림자가 있는 카드</p>
        </Card.Body>
      </Card>
      <Card variant="filled" style={{ width: '200px' }}>
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>Filled</h3>
          <p>배경색이 있는 카드</p>
        </Card.Body>
      </Card>
    </div>
  ),
};

// 떠오르는 호버 (선택). onClick만 있는 카드는 떠오르지 않는다
export const HoverLift: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Card variant="outlined" style={{ width: '200px' }}>
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>기본</h3>
          <p>호버해도 그대로</p>
        </Card.Body>
      </Card>
      <Card variant="outlined" hoverLift style={{ width: '200px' }}>
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>hoverLift</h3>
          <p>호버하면 떠오름</p>
        </Card.Body>
      </Card>
      <Card
        variant="outlined"
        hoverLift
        onClick={() => alert('클릭!')}
        style={{ width: '200px' }}
      >
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>onClick + hoverLift</h3>
          <p>클릭도 되고 떠오름</p>
        </Card.Body>
      </Card>
    </div>
  ),
};

// Padding 옵션 (Card.Body에서 제어)
export const Paddings: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Card variant="outlined" style={{ width: '150px' }}>
        <Card.Body padding="sm">
          <div style={{ backgroundColor: '#f0f0f0' }}>Padding: sm</div>
        </Card.Body>
      </Card>
      <Card variant="outlined" style={{ width: '150px' }}>
        <Card.Body padding="md">
          <div style={{ backgroundColor: '#f0f0f0' }}>Padding: md</div>
        </Card.Body>
      </Card>
      <Card variant="outlined" style={{ width: '150px' }}>
        <Card.Body padding="lg">
          <div style={{ backgroundColor: '#f0f0f0' }}>Padding: lg</div>
        </Card.Body>
      </Card>
    </div>
  ),
};

// Header와 Footer (Compound API)
export const WithHeaderAndFooter: Story = {
  render: () => (
    <Card style={{ width: '400px' }}>
      <Card.Header>
        <Card.Title>카드 제목</Card.Title>
        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
          부제목
        </p>
      </Card.Header>
      <Card.Body>
        <p>
          카드 본문 내용입니다. Header와 Footer를 사용하여 카드를 구조화할 수
          있습니다.
        </p>
      </Card.Body>
      <Card.Footer>
        <div
          style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}
        >
          <button style={{ padding: '8px 16px', cursor: 'pointer' }}>
            취소
          </button>
          <button
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            확인
          </button>
        </div>
      </Card.Footer>
    </Card>
  ),
};

// 이미지가 있는 카드 (Compound API)
export const WithImage: Story = {
  render: () => (
    <Card style={{ width: '300px' }}>
      <Card.Image
        src="https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400"
        alt="고양이"
      />
      <Card.Body>
        <h3 style={{ marginTop: 0 }}>귀여운 고양이</h3>
        <p>이미지와 함께 표시되는 카드입니다.</p>
      </Card.Body>
    </Card>
  ),
};

// 이미지 + 오버레이 (Compound API 강점)
export const WithImageOverlay: Story = {
  render: () => (
    <Card variant="elevated" style={{ width: '300px' }}>
      <Card.Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
        alt="산"
      >
        <Card.ImageOverlay>
          <span
            style={{
              backgroundColor: '#ff5722',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            NEW
          </span>
        </Card.ImageOverlay>
      </Card.Image>
      <Card.Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Card.Title>이미지 오버레이</Card.Title>
          <span
            style={{
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
            }}
          >
            Hot
          </span>
        </div>
      </Card.Header>
      <Card.Body padding="md">
        <p style={{ margin: 0, color: '#666' }}>
          Compound API로 이미지 위에 오버레이를 추가하고, 헤더에 뱃지를 넣을 수
          있습니다.
        </p>
      </Card.Body>
    </Card>
  ),
};

// 이미지 + Header + Footer
export const CompleteCard: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <Card.Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
        alt="산"
      />
      <Card.Header>
        <Card.Title>자연 풍경</Card.Title>
        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
          아름다운 산
        </p>
      </Card.Header>
      <Card.Body>
        <p>
          완벽한 구성의 카드입니다. 이미지, 헤더, 본문, 푸터를 모두 포함합니다.
        </p>
      </Card.Body>
      <Card.Footer>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '14px', color: '#666' }}>2024-01-08</span>
          <button
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            더 보기
          </button>
        </div>
      </Card.Footer>
    </Card>
  ),
};

// 클릭 가능한 카드
export const Clickable: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Card
        onClick={() => alert('카드 1 클릭!')}
        style={{ width: '200px', cursor: 'pointer' }}
      >
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>클릭 가능 카드 1</h3>
          <p>이 카드를 클릭해보세요!</p>
        </Card.Body>
      </Card>
      <Card
        onClick={() => alert('카드 2 클릭!')}
        variant="outlined"
        style={{ width: '200px', cursor: 'pointer' }}
      >
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>클릭 가능 카드 2</h3>
          <p>호버 효과가 있습니다.</p>
        </Card.Body>
      </Card>
      <Card
        onClick={() => alert('카드 3 클릭!')}
        variant="filled"
        style={{ width: '200px', cursor: 'pointer' }}
      >
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>클릭 가능 카드 3</h3>
          <p>클릭 시 알림이 표시됩니다.</p>
        </Card.Body>
      </Card>
    </div>
  ),
};

// 비활성화된 카드
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Card disabled style={{ width: '200px' }}>
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>비활성화 카드</h3>
          <p>이 카드는 비활성화 상태입니다.</p>
        </Card.Body>
      </Card>
      <Card onClick={() => {}} disabled style={{ width: '200px' }}>
        <Card.Body>
          <h3 style={{ marginTop: 0 }}>클릭 불가</h3>
          <p>클릭할 수 없습니다.</p>
        </Card.Body>
      </Card>
    </div>
  ),
};

// 사용 예시: 제품 카드 (Compound API)
export const ProductCards: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        padding: '24px',
        backgroundColor: '#f5f5f5',
      }}
    >
      {[
        {
          id: 1,
          image:
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          title: '무선 헤드폰',
          price: '₩129,000',
          rating: '4.5',
        },
        {
          id: 2,
          image:
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          title: '스마트 워치',
          price: '₩299,000',
          rating: '4.8',
        },
        {
          id: 3,
          image:
            'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
          title: '선글라스',
          price: '₩89,000',
          rating: '4.3',
        },
      ].map((product) => (
        <Card
          key={product.id}
          onClick={() => alert(`${product.title} 상세 보기`)}
          style={{ width: '280px' }}
        >
          <Card.Image src={product.image} alt={product.title} />
          <Card.Body padding="md">
            <h3 style={{ margin: '0 0 8px' }}>{product.title}</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#1976d2',
                }}
              >
                {product.price}
              </span>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {product.rating}
              </span>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  ),
};

// 사용 예시: 블로그 카드 (Compound API)
export const BlogCards: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        backgroundColor: '#f5f5f5',
        maxWidth: '600px',
      }}
    >
      {[
        {
          id: 1,
          image:
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600',
          title: 'React 18의 새로운 기능',
          excerpt:
            'React 18에서 도입된 동시성 렌더링과 자동 배칭에 대해 알아봅니다.',
          date: '2024-01-05',
          readTime: '5분',
        },
        {
          id: 2,
          image:
            'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600',
          title: 'TypeScript 실전 가이드',
          excerpt:
            '타입스크립트를 실무에서 효과적으로 활용하는 방법을 소개합니다.',
          date: '2024-01-03',
          readTime: '8분',
        },
      ].map((post) => (
        <Card
          key={post.id}
          onClick={() => alert(`${post.title} 읽기`)}
          variant="outlined"
        >
          <Card.Image src={post.image} alt={post.title} />
          <Card.Body padding="md">
            <h3 style={{ margin: '0 0 8px' }}>{post.title}</h3>
            <p style={{ margin: '0 0 12px', color: '#666' }}>{post.excerpt}</p>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                fontSize: '14px',
                color: '#999',
              }}
            >
              <span>{post.date}</span>
              <span>{post.readTime}</span>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  ),
};

// 사용 예시: 프로필 카드 (Compound API)
export const ProfileCard: Story = {
  render: () => (
    <Card style={{ width: '300px' }}>
      <Card.Header>
        <div style={{ textAlign: 'center' }}>
          <img
            src="https://i.pravatar.cc/150?img=1"
            alt="프로필"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              marginBottom: '8px',
            }}
          />
          <Card.Title>홍길동</Card.Title>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
            프론트엔드 개발자
          </p>
        </div>
      </Card.Header>
      <Card.Body>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px', color: '#666' }}>
            웹 개발을 사랑하는 개발자입니다. React와 TypeScript를 주로
            사용합니다.
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              paddingTop: '16px',
              borderTop: '1px solid #eee',
            }}
          >
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>1.2K</div>
              <div style={{ fontSize: '12px', color: '#666' }}>팔로워</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>345</div>
              <div style={{ fontSize: '12px', color: '#666' }}>팔로잉</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>89</div>
              <div style={{ fontSize: '12px', color: '#666' }}>게시물</div>
            </div>
          </div>
        </div>
      </Card.Body>
      <Card.Footer>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              flex: 1,
              padding: '8px',
              cursor: 'pointer',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
            }}
          >
            메시지
          </button>
          <button
            style={{
              flex: 1,
              padding: '8px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1976d2',
              color: 'white',
            }}
          >
            팔로우
          </button>
        </div>
      </Card.Footer>
    </Card>
  ),
};

// Flat API (Card) - 간단한 사용

// Flat API 기본
export const FlatAPIBasic: Story = {
  render: () => (
    <Card
      header={<h3 style={{ margin: 0 }}>Flat API</h3>}
      footer={
        <div
          style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}
        >
          <button style={{ padding: '8px 16px', cursor: 'pointer' }}>
            취소
          </button>
          <button
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            확인
          </button>
        </div>
      }
      variant="outlined"
      style={{ width: '300px' }}
    >
      <p style={{ margin: 0 }}>
        header, footer, image props로 간단하게 카드를 구성합니다.
      </p>
    </Card>
  ),
};

// Flat API 이미지
export const FlatAPIWithImage: Story = {
  render: () => (
    <Card
      image="https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400"
      imageAlt="고양이"
      header={<h3 style={{ margin: 0 }}>이미지 카드</h3>}
      variant="elevated"
      style={{ width: '300px' }}
    >
      <p style={{ margin: 0, color: '#666' }}>
        image prop으로 이미지를 간단히 추가할 수 있습니다.
      </p>
    </Card>
  ),
};

// Flat API 클릭 가능
export const FlatAPIClickable: Story = {
  render: () => (
    <Card
      header={<h3 style={{ margin: 0 }}>클릭 가능</h3>}
      onClick={() => alert('Card 클릭!')}
      variant="filled"
      style={{ width: '300px' }}
    >
      <p style={{ margin: 0 }}>onClick prop으로 클릭 이벤트를 추가합니다.</p>
    </Card>
  ),
};

// ============================================
// API 비교
// ============================================

// API 비교 가이드
export const APIComparison: Story = {
  render: () => (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <h2 style={{ marginTop: 0 }}>Card API 선택 가이드</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            padding: '16px',
            border: '2px solid #4caf50',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 12px', color: '#4caf50' }}>
            Card (Flat API)
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
            <li>간단한 카드 레이아웃</li>
            <li>기본 header/footer/image 구조</li>
            <li>빠른 프로토타이핑</li>
            <li>복잡한 커스터마이징 불필요</li>
          </ul>
        </div>

        <div
          style={{
            padding: '16px',
            border: '2px solid #2196f3',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 12px', color: '#2196f3' }}>
            Card (Compound API)
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
            <li>Header에 Badge, 버튼 등 추가</li>
            <li>이미지 위 오버레이 배치</li>
            <li>복잡한 레이아웃 구성</li>
            <li>완전한 커스터마이징 필요</li>
          </ul>
        </div>
      </div>

      <h3>코드 비교</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 8px' }}>Flat API</h4>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}
          >
            {`<Card
  header={<h3>제목</h3>}
  image="/img.jpg"
  footer={<Button>확인</Button>}
>
  내용
</Card>`}
          </pre>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px' }}>Compound API</h4>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}
          >
            {`<Card>
  <Card.Image src="/img.jpg">
    <Card.ImageOverlay>
      NEW
    </Card.ImageOverlay>
  </Card.Image>
  <Card.Header>
    <Card.Title>제목</Card.Title>
    <Badge>Hot</Badge>
  </Card.Header>
  <Card.Body>내용</Card.Body>
</Card>`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
