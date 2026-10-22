import { useNavigate } from 'react-router-dom';
import { Button } from '@taein-ui/core';
import * as t from '../../components/DocText';
import * as styles from './ErrorPage.css';

interface ErrorPageProps {
  type?: '404' | '500' | 'generic';
}

const CONTENT = {
  '404': {
    title: '404',
    message:
      '주소가 바뀌었거나 없는 페이지입니다. 홈에서 다시 찾아가거나 이전 페이지로 돌아가 주십시오.',
  },
  '500': {
    title: '500',
    message:
      '서버에 문제가 생겼습니다. 잠시 후 다시 시도하시거나 홈으로 돌아가 주십시오.',
  },
  generic: {
    title: '오류',
    message:
      '화면을 그리는 중에 문제가 생겼습니다. 홈으로 돌아가 다시 시작해 주십시오.',
  },
};

export function ErrorPage({ type = 'generic' }: ErrorPageProps) {
  const navigate = useNavigate();
  const { title, message } = CONTENT[type];

  return (
    <div className={styles.container}>
      <section className={styles.frame}>
        <h1 className={`${t.display} ${styles.title}`}>{title}</h1>
        <p className={`${t.lead} ${styles.message}`}>{message}</p>
        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </Button>
          <Button variant="light" size="lg" onClick={() => navigate(-1)}>
            이전 페이지
          </Button>
        </div>
      </section>
    </div>
  );
}
