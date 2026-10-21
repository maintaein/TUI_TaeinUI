import { useId } from 'react';
import { SegmentedButtons, Switch, TextField } from '@taein-ui/core';
import * as styles from './Customize.css';

export type Values = Record<string, string | boolean>;

/** 조작판 한 줄. prop은 코드에 쓰는 이름 그대로 레이블이 된다 */
export type Control =
  | { prop: string; kind: 'text'; label?: string }
  | { prop: string; kind: 'choice'; options: string[] }
  | { prop: string; kind: 'toggle' };

export interface CustomizeProps {
  controls: Control[];
  values: Values;
  onChange: (values: Values) => void;
}

/** 글자는 TextField, 고르기는 SegmentedButtons, 켜기는 Switch로 그린다. 켜기는 순서와 상관없이 한 격자에 모아 맨 아래에 둔다 */
export function Customize({ controls, values, onChange }: CustomizeProps) {
  const id = useId();
  const set = (prop: string, value: string | boolean) =>
    onChange({ ...values, [prop]: value });
  const toggles = controls.filter((c) => c.kind === 'toggle');

  return (
    <div className={styles.customize}>
      {controls.map((c) => {
        if (c.kind === 'text')
          return (
            <div key={c.prop} className={styles.field}>
              <TextField
                label={c.label ?? c.prop}
                size="sm"
                value={String(values[c.prop])}
                onChange={(e) => set(c.prop, e.target.value)}
              />
            </div>
          );
        if (c.kind === 'choice') {
          const labelId = `${id}-${c.prop}`;
          return (
            <div key={c.prop} className={styles.control}>
              <span id={labelId} className={styles.controlLabel}>
                {c.prop}
              </span>
              <SegmentedButtons
                aria-labelledby={labelId}
                size="sm"
                fullWidth
                options={c.options.map((o) => ({ value: o, label: o }))}
                value={String(values[c.prop])}
                onChange={(v) => set(c.prop, v)}
              />
            </div>
          );
        }
        return null;
      })}
      {toggles.length > 0 && (
        <div className={styles.switches}>
          {toggles.map((c) => (
            <Switch
              key={c.prop}
              size="sm"
              label={c.prop}
              checked={values[c.prop] === true}
              onChange={(e) => set(c.prop, e.target.checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
