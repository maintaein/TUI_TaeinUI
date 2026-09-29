import { StrictMode, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import '@taein-ui/core/styles.css';
import { AppRouter } from './routes';
import './styles/global.css';

inject();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

// startTransition으로 초기 렌더를 non-urgent로 처리
// → 브라우저가 Long Task를 50ms 단위로 yield하여 TBT 감소
startTransition(() => {
  root.render(
    <StrictMode>
      <AppRouter />
    </StrictMode>
  );
});
