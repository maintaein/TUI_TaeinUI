import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { IconButton } from '@taein-ui/core';
import * as styles from './IntroductionPage.css';

/** 설치 명령 한 줄과 복사 단추 */
export function InstallChip({ command }: { command: string }) {
  const [done, setDone] = useState(false);
  const [head, ...rest] = command.split(' ');
  return (
    <span className={styles.install}>
      <span>
        {head}{' '}
        <span className={styles.installDim}>{rest.slice(0, -1).join(' ')}</span>{' '}
        {rest.slice(-1)}
      </span>
      <IconButton
        size="sm"
        aria-label={done ? '복사됨' : '설치 명령 복사'}
        onClick={() => {
          navigator.clipboard?.writeText(command).then(
            () => {
              setDone(true);
              window.setTimeout(() => setDone(false), 1500);
            },
            () => undefined
          );
        }}
      >
        {done ? <Check /> : <Copy />}
      </IconButton>
    </span>
  );
}
