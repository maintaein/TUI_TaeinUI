import type { Values } from './Customize';

/** 켜진 prop을 `p={expr}`로 쓰는 표기. 아이콘 같은 ReactNode용. import가 필요하면 함께 적는다 */
export interface Notation {
  expr: string;
  import?: { name: string; from: string };
}

export interface CodeSpec {
  component: string;
  /** `children` 값은 속성이 아니라 안쪽 글자가 된다. `children`이 없으면 안쪽 없이 `/>`로 닫는다 */
  values: Values;
  /** 이 값과 같은 prop은 코드에서 뺀다(거짓은 늘 뺀다) */
  defaults: Values;
  /** prop별 사용자 정의 표기. 참일 때 `p={expr}`로 쓴다 */
  notation?: Record<string, Notation>;
  /** `children` 글 안에 쓴 컴포넌트처럼 prop이 아닌 곳에서 쓰는 import */
  imports?: { name: string; from: string }[];
}

const CORE = '@taein-ui/core';

/** 조작판 값으로 JSX 문자열을 만든다. 문자열은 `p="v"`, 참은 `p`, 거짓은 생략 */
export const codeOf = ({
  component,
  values,
  defaults,
  notation = {},
  imports: extra = [],
}: CodeSpec): string => {
  const used: Notation[] = extra.map((e) => ({ expr: '', import: e }));
  const attrs = Object.entries(values).flatMap(([prop, value]) => {
    if (prop === 'children' || value === defaults[prop]) return [];
    if (value === false) return [];
    const custom = notation[prop];
    if (custom && value === true) {
      used.push(custom);
      return [`${prop}={${custom.expr}}`];
    }
    return [value === true ? prop : `${prop}="${value}"`];
  });

  const imports: string[] = [];
  // core에서 가져오는 이름은 컴포넌트와 한 줄로 합친다
  const byModule = new Map<string, string[]>([[CORE, [component]]]);
  for (const n of used)
    if (n.import)
      byModule.set(n.import.from, [
        ...(byModule.get(n.import.from) ?? []),
        n.import.name,
      ]);
  for (const [from, names] of byModule)
    imports.push(`import { ${names.join(', ')} } from '${from}';`);

  const selfClosing = !('children' in values);
  const open =
    attrs.length > 2
      ? `<${component}\n  ${attrs.join('\n  ')}\n${selfClosing ? '/>' : '>'}`
      : `<${component}${attrs.map((a) => ` ${a}`).join('')}${selfClosing ? ' />' : '>'}`;
  const head = `${imports.join('\n')}\n\n${open}`;
  if (selfClosing) return head;
  const text = String(values.children ?? '') || ' ';
  return `${head}\n  ${text}\n</${component}>`;
};
