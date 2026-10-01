import { useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, Divider, Badge, Text } from '@taein-ui/core';
import {
  componentsData,
  categoryLabels,
  categoryColors,
} from '../../data/components';
import type { ComponentInfo } from '../../data/components';
import * as styles from './ComponentsOverviewPage.css';

export function ComponentsOverviewPage() {
  const navigate = useNavigate();

  const groupedComponents = componentsData.reduce<
    Record<ComponentInfo['category'], ComponentInfo[]>
  >(
    (acc, component) => {
      if (!acc[component.category]) {
        acc[component.category] = [];
      }
      acc[component.category].push(component);
      return acc;
    },
    {} as Record<ComponentInfo['category'], ComponentInfo[]>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Text variant="h1" className={styles.title}>
          컴포넌트
        </Text>
        <p className={styles.description}>
          컴포넌트 패밀리 30개를 제공합니다. 패키지의 top-level export는
          49개인데, 차이는 개별로도 import할 수 있는 하위
          컴포넌트입니다(ModalHeader, CardBody, AvatarGroup, ListItem 등). 모두
          React와 TypeScript로 작성되었으며, 접근성과 반응형을 지원합니다.
        </p>
      </header>

      {Object.entries(groupedComponents).map(([category, components]) => (
        <section key={category} className={styles.categorySection}>
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>
              {categoryLabels[category as ComponentInfo['category']]}
            </h2>
            <Badge
              variant="primary"
              size="md"
              className={styles.categoryBadgeCustom}
              style={
                {
                  '--badge-color':
                    categoryColors[category as ComponentInfo['category']],
                } as CSSProperties
              }
            >
              {components.length}개
            </Badge>
          </div>

          <div className={styles.componentsGrid}>
            {components.map((component) => (
              <Card
                key={component.name}
                variant="interactive"
                accentColor={categoryColors[component.category]}
                onClick={() => navigate(component.path)}
                className={styles.componentCardCustom}
              >
                <Card.Body padding="lg">
                  <div className={styles.componentIcon}>
                    <component.icon size={48} />
                  </div>
                  <h3 className={styles.componentName}>{component.name}</h3>
                  <p className={styles.componentDescription}>
                    {component.description}
                  </p>
                  <div className={styles.componentArrow}>
                    <ArrowRight size={24} />
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <Divider
        variant="solid"
        spacing="lg"
        className={styles.ctaSectionDivider}
      />
    </div>
  );
}
