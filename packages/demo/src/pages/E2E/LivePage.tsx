import { EditableLivePreview } from '../../components/LivePreview/EditableLivePreview';

// 회귀 e2e 전용 시험 페이지. 내비·검색 색인에 없고, 스펙이 편집기에 코드를 채워 구성을 만든다.
export function LivePage() {
  return (
    <main style={{ padding: '2rem' }}>
      <EditableLivePreview code="" centered={false} padding="md" />
    </main>
  );
}
