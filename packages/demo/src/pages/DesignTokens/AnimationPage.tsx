import { useState } from 'react';
import { Button, duration, loop, easing } from '@taein-designsystem/core';
import { CodeBlock } from '../../components/CodeBlock';
import * as styles from './AnimationPage.css';

type DurationName = keyof typeof duration;
type LoopName = keyof typeof loop;
type EasingName = keyof typeof easing;

// 이름과 값은 토큰에서 온다. 여기엔 설명만 둔다 — 토큰이 바뀌면 Record가 타입
// 에러를 내므로 이 페이지가 옛 이름을 전시한 채 남아 있을 수 없다.
const durationNotes: Record<DurationName, string> = {
  fast: '빠른 전환 (hover, focus)',
  base: '기본 전환',
  slow: '느린 전환 (slide, fade)',
  slower: '매우 느린 전환 (복잡한 애니메이션)',
};

const loopNotes: Record<LoopName, string> = {
  fast: '짧은 한 바퀴 — LoadingSpinner 회전',
  base: '기본 한 바퀴 — Skeleton wave·pulse, Loader 진행 바',
};

const easingNotes: Record<EasingName, { source: string; description: string }> =
  {
    settle: {
      source: 'power3.out',
      description: '빠르게 나갔다 감속해 자리를 잡는다. 상태 전이 기본값',
    },
    snap: {
      source: 'back.out(1.7)',
      description: '목표를 지나쳤다 돌아온다. 피크 1.0998이라 transform 전용',
    },
    spring: {
      source: 'elastic.out(1, 0.5)',
      description: '탄성으로 출렁이다 멎는다. 피크 1.2044라 transform 전용',
    },
    exit: {
      source: 'power2.in',
      description: '가속하며 빠져나간다. 퇴장 전용 — 등장의 60~70% 길이로 쓴다',
    },
    linear: {
      source: 'none',
      description: '일정한 속도. 무한 회전처럼 끝이 없는 반복에 쓴다',
    },
    drift: {
      source: 'sine.inOut',
      description: '천천히 나갔다 천천히 든다. 끝없이 오가는 자율 루프에 쓴다',
    },
  };

const durationNames = Object.keys(duration) as DurationName[];
const loopNames = Object.keys(loop) as LoopName[];
const easingNames = Object.keys(easing) as EasingName[];

/**
 * `linear(v0,v1,...)` 샘플을 곡선 좌표로 편다.
 *
 * 토큰은 GSAP 이징을 25점으로 구운 값이라 베지에 제어점이 없다. 샘플을 그대로
 * 잇는 것이 브라우저가 실제로 그리는 곡선이다. snap·spring은 값이 1을 넘어
 * y가 음수가 되므로 viewBox 위쪽을 열어 둔다.
 */
function curvePoints(value: string): string {
  const samples = value.slice('linear('.length, -1).split(',').map(Number);
  return samples
    .map((v, i) => `${(i / (samples.length - 1)) * 100},${100 - v * 100}`)
    .join(' ');
}

export function AnimationPage() {
  const [activeDuration, setActiveDuration] = useState<DurationName>('base');
  const [activeEasing, setActiveEasing] = useState<EasingName>('settle');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAnimate = () => {
    setIsAnimating(true);
    setTimeout(
      () => setIsAnimating(false),
      Number.parseFloat(duration[activeDuration])
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>애니메이션</h1>
      <p className={styles.description}>
        TDS의 애니메이션 시스템은 일관된 Duration과 Easing을 통해 자연스러운
        모션을 제공합니다. 사용자 경험을 해치지 않는 미묘한 애니메이션을
        지향합니다.
      </p>

      {/* Duration */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Duration (지속 시간)</h2>
        <p className={styles.sectionDescription}>
          상황에 따라 적절한 애니메이션 속도를 선택하여 자연스러운 전환을
          만듭니다.
        </p>

        <div className={styles.durationGrid}>
          {durationNames.map((name) => (
            <div key={name} className={styles.durationCard}>
              <div className={styles.durationHeader}>
                <span className={styles.durationName}>duration.{name}</span>
                <span className={styles.durationValue}>{duration[name]}</span>
              </div>
              <p className={styles.durationDescription}>
                {durationNotes[name]}
              </p>
              <CodeBlock
                code={`transition: transform ${duration[name]}, opacity ${duration[name]};`}
                language="css"
                showLineNumbers={false}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Loop */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Loop (반복 주기)</h2>
        <p className={styles.sectionDescription}>
          무한 반복 한 바퀴의 길이입니다. 전이(A→B)와 다른 양이라 duration
          스케일과 따로 둡니다.
        </p>

        <div className={styles.durationGrid}>
          {loopNames.map((name) => (
            <div key={name} className={styles.durationCard}>
              <div className={styles.durationHeader}>
                <span className={styles.durationName}>loop.{name}</span>
                <span className={styles.durationValue}>{loop[name]}</span>
              </div>
              <p className={styles.durationDescription}>{loopNotes[name]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Easing */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Easing (가속도 곡선)</h2>
        <p className={styles.sectionDescription}>
          GSAP 이징을 빌드 타임에 구운 CSS linear() 곡선입니다. 런타임에 GSAP을
          싣지 않고도 같은 감각을 냅니다.
        </p>

        <div className={styles.easingList}>
          {easingNames.map((name) => (
            <div key={name} className={styles.easingRow}>
              <span className={styles.easingName}>easing.{name}</span>
              <span className={styles.easingValue}>
                {easingNotes[name].source}
              </span>
              <span className={styles.easingDescription}>
                {easingNotes[name].description}
              </span>

              <div className={styles.easingCurve}>
                <svg
                  viewBox="0 -25 100 125"
                  className={styles.easingCurveSvg}
                  role="img"
                  aria-label={`easing.${name} 곡선`}
                >
                  <line
                    x1="0"
                    y1="100"
                    x2="100"
                    y2="0"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <polyline
                    points={curvePoints(easing[name])}
                    stroke="#2563eb"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Demo */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>인터랙티브 데모</h2>
        <p className={styles.sectionDescription}>
          Duration과 Easing을 조합하여 애니메이션을 직접 테스트해보세요.
        </p>

        <div className={styles.demoContainer}>
          <div className={styles.demoControls}>
            <div className={styles.demoControlGroup}>
              <h3 className={styles.demoControlTitle}>Duration</h3>
              <div className={styles.demoButtonGroup}>
                {durationNames.map((name) => (
                  <Button
                    key={name}
                    variant={activeDuration === name ? 'primary' : 'light'}
                    size="sm"
                    onClick={() => setActiveDuration(name)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            <div className={styles.demoControlGroup}>
              <h3 className={styles.demoControlTitle}>Easing</h3>
              <div className={styles.demoButtonGroup}>
                {easingNames.map((name) => (
                  <Button
                    key={name}
                    variant={activeEasing === name ? 'primary' : 'light'}
                    size="sm"
                    onClick={() => setActiveEasing(name)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.demoPlayground}>
            <div
              className={isAnimating ? styles.demoBoxAnimated : styles.demoBox}
              style={{
                transitionDuration: duration[activeDuration],
                transitionTimingFunction: easing[activeEasing],
              }}
            />
          </div>

          <div className={styles.demoAction}>
            <Button variant="primary" onClick={handleAnimate}>
              애니메이션 실행
            </Button>
          </div>

          <CodeBlock
            code={`import { themeContract } from '@taein-designsystem/core';

export const box = style({
  transitionProperty: 'transform',
  transitionDuration: themeContract.animation.duration.${activeDuration},
  transitionTimingFunction: themeContract.animation.easing.${activeEasing},
});`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>사용 가이드라인</h2>

        <div className={styles.guidelineList}>
          <div className={styles.guidelineRow}>
            <h3 className={styles.guidelineTitle}>성능</h3>
            <p className={styles.guidelineText}>
              transform과 opacity만 애니메이션하여 60fps를 유지합니다. width,
              height, top, left는 피합니다.
            </p>
          </div>

          <div className={styles.guidelineRow}>
            <h3 className={styles.guidelineTitle}>접근성</h3>
            <p className={styles.guidelineText}>
              prefers-reduced-motion을 존중합니다. 사용자가 모션을 줄이도록
              설정했다면 애니메이션을 비활성화합니다.
            </p>
          </div>

          <div className={styles.guidelineRow}>
            <h3 className={styles.guidelineTitle}>적절한 속도</h3>
            <p className={styles.guidelineText}>
              너무 빠르면(100ms 이하) 눈에 보이지 않고, 너무 느리면(500ms 이상)
              답답합니다. 대부분 200-300ms가 적절합니다.
            </p>
          </div>

          <div className={styles.guidelineRow}>
            <h3 className={styles.guidelineTitle}>의미 있는 모션</h3>
            <p className={styles.guidelineText}>
              애니메이션은 사용자의 주의를 끌거나 상태 변화를 알리는 등 명확한
              목적이 있어야 합니다. 장식용 애니메이션은 피합니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
