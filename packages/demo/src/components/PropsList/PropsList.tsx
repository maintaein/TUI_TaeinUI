import type { PropDefinition } from '../PropsTable';
import * as t from '../DocText';
import * as styles from './PropsList.css';

// 4칸 표 대신 읽는 목록: 이름 → 설명 → 타입·기본값. 좁은 화면에서도 설명이 밀려나지 않는다
export function PropsList({ props }: { props: PropDefinition[] }) {
  return (
    <dl className={styles.list}>
      {props.map((p) => (
        <div key={p.name} className={styles.item}>
          <dt className={styles.name}>
            <code>{p.name}</code>
            {p.required && <span className={styles.required}>필수</span>}
          </dt>
          <dd className={styles.body}>
            <p className={t.body}>{p.description}</p>
            <p className={styles.meta}>
              <span className={styles.key}>타입</span>
              <code>{p.type}</code>
              {p.default && (
                <>
                  <span className={styles.key}>기본값</span>
                  <code>{p.default}</code>
                </>
              )}
            </p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
