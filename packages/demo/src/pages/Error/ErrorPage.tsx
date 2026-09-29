import { useNavigate, useRouteError } from 'react-router-dom';
import { Button } from '@taein-ui/core';
import * as styles from './ErrorPage.css';

interface ErrorPageProps {
  type?: '404' | '500' | 'generic';
  title?: string;
  message?: string;
}

export function ErrorPage({
  type = 'generic',
  title,
  message,
}: ErrorPageProps) {
  const navigate = useNavigate();
  const error = useRouteError() as { statusText?: string; message?: string };

  const getErrorContent = () => {
    if (title && message) {
      return { title, message };
    }

    switch (type) {
      case '404':
        return {
          title: '404',
          subtitle: 'Page Not Found',
          message:
            '이 페이지는 TUI에 존재하지 않습니다. 홈으로 돌아가거나, 뒤로 가기를 해주세요.',
        };
      case '500':
        return {
          title: '500',
          subtitle: 'Internal Error',
          message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        };
      default:
        return {
          title: 'Error',
          subtitle: 'Something went wrong',
          message:
            error?.statusText ||
            error?.message ||
            '예상치 못한 오류가 발생했습니다. 홈으로 돌아가거나 다시 시도해주세요.',
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className={styles.container}>
      {/* 백그라운드 */}
      <div className={styles.backgroundShapes}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
        <div className={styles.shape4} />
        <div className={styles.shape5} />
        <div className={styles.shape6} />
        <div className={styles.shape7} />
        <div className={styles.shape8} />
      </div>

      {/* 메인 컨텐츠 */}
      <div className={styles.content}>
        <div className={styles.errorCode}>{content.title}</div>
        {content.subtitle && (
          <div className={styles.errorSubtitle}>{content.subtitle}</div>
        )}
        <p className={styles.errorMessage}>{content.message}</p>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </Button>
          <Button variant="light" size="lg" onClick={() => navigate(-1)}>
            이전 페이지
          </Button>
        </div>

        <div className={styles.gridLines}>
          <div className={styles.gridLineHorizontal} />
          <div className={styles.gridLineVertical} />
        </div>
      </div>

      <div className={styles.floatingIcons}>
        <div className={styles.icon1}>
          <svg viewBox="0 0 40 40" fill="none">
            <rect
              x="4"
              y="4"
              width="32"
              height="32"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="12"
              y="12"
              width="16"
              height="16"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
        </div>
        <div className={styles.icon2}>
          <svg viewBox="0 0 40 40" fill="none">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="20" cy="20" r="8" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        <div className={styles.icon3}>
          <svg viewBox="0 0 40 40" fill="none">
            <path
              d="M8 32L20 8L32 32H8Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M14 26L20 16L26 26H14Z"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
