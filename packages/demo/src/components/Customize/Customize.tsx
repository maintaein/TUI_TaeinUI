import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Chip, SegmentedButtons, Switch, TextField } from '@taein-ui/core';
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

interface ChoiceProps {
  labelId: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * 옵션이 칸에 다 들어가면 SegmentedButtons, 넘치면 줄바꿈되는 토글 칩 줄로 그린다.
 * 칩 줄은 이름 붙은 group이고 칩은 aria-pressed 단추라 Tab과 Enter/Space로 고른다.
 * 고른 칩을 다시 눌러도 그대로다(고르기라 해제가 없다).
 * 칸이 넓어져 다시 들어갈 수 있는지는 넘쳤을 때 잰 폭(need)으로 가린다.
 * shortcut: 옵션 글자가 바뀌는 일은 없다고 보고 폭을 한 번만 잰다, 옵션이 동적이 되면 옵션이 바뀔 때 need를 지운다
 */
function Choice({ labelId, options, value, onChange }: ChoiceProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [need, setNeed] = useState(0);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const check = () => {
      const group = el.querySelector('[role="radiogroup"]');
      if (group) {
        if (group.scrollWidth > group.clientWidth) setNeed(group.scrollWidth);
      } else if (el.clientWidth >= need) setNeed(0);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [need]);

  return (
    <div ref={wrap}>
      {need === 0 ? (
        <SegmentedButtons
          aria-labelledby={labelId}
          size="sm"
          fullWidth
          options={options.map((o) => ({ value: o, label: o }))}
          value={value}
          onChange={onChange}
        />
      ) : (
        <div role="group" aria-labelledby={labelId} className={styles.chips}>
          {options.map((o) => (
            <Chip
              key={o}
              label={o}
              color="primary"
              variant="outlined"
              selected={o === value}
              onClick={() => onChange(o)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 글자는 TextField, 고르기는 SegmentedButtons(넘치면 칩 줄), 켜기는 Switch로 그린다. 켜기는 순서와 상관없이 한 격자에 모아 맨 아래에 둔다 */
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
              <Choice
                labelId={labelId}
                options={c.options}
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
