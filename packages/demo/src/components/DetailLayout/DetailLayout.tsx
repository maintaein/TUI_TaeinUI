import { type ReactNode } from 'react';
import { CodeBlock } from '../CodeBlock';
import * as t from '../DocText';
import type { PropDefinition } from '../PropsTable';
import { PropsList } from '../PropsList';
import { detailMeta } from '../../data/components';
import * as styles from './DetailLayout.css';

const cx = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(' ');

function Section({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={t.h2}>{title}</h2>
      {lead && (
        <p className={cx(t.body, t.muted, styles.sectionLead)}>{lead}</p>
      )}
      {children}
    </section>
  );
}

/** 사용법의 소주제 묶음 */
export function Topics({ children }: { children: ReactNode }) {
  return <div className={styles.topics}>{children}</div>;
}

export function Topic({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className={cx(t.h3, styles.topicTitle)}>{title}</h3>
      {children}
    </section>
  );
}

export interface DetailLayoutProps {
  /** `data/components.ts`의 컴포넌트 이름. 번호와 계열을 거기서 읽는다 */
  name: string;
  lead: string;
  /** 무대(`Stage`). 캔버스 안에서 정해진 높이를 채운다 */
  stage: ReactNode;
  /** 조작판(`Customize`) */
  customize: ReactNode;
  /** 조작판 값으로 만든 코드 */
  code: string;
  props: PropDefinition[];
  /** 이렇게 씁니다 */
  usage: ReactNode;
  /** 접근성 */
  a11y: ReactNode;
}

/** 회색 캔버스(번호·계열, 이름, 리드, 무대) 아래에 직접 바꿔 보기, Props, 이렇게 씁니다, 접근성이 차례로 온다 */
export function DetailLayout({
  name,
  lead,
  stage,
  customize,
  code,
  props,
  usage,
  a11y,
}: DetailLayoutProps) {
  const { no, group } = detailMeta(name);
  return (
    <>
      <div className={styles.canvas}>
        <div className={styles.canvasHead}>
          <div className={styles.nameRow}>
            <span className={t.label}>
              {no} · {group}
            </span>
            <h1 className={cx(t.display, styles.name)}>{name}</h1>
          </div>
          <p className={cx(t.lead, t.muted, styles.leadMax)}>{lead}</p>
        </div>
        <div className={styles.canvasStage}>{stage}</div>
      </div>
      <div className={styles.docCol}>
        <Section
          title="직접 바꿔 보기"
          lead="조작판을 바꾸면 위 무대와 코드가 같이 바뀝니다."
        >
          <div className={styles.play}>
            {customize}
            <CodeBlock code={code} className={styles.flush} />
          </div>
        </Section>
        <Section title="Props">
          <PropsList props={props} />
        </Section>
        <Section title="이렇게 씁니다">{usage}</Section>
        <Section title="접근성">{a11y}</Section>
      </div>
    </>
  );
}
