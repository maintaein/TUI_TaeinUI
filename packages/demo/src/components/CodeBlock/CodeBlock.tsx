import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { IconButton } from '@taein-ui/core';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MONO } from '../DocText';
import * as styles from './CodeBlock.css';

// vs 테마의 일부 구문 색은 회색 우물(#F5F5F5) 위에서 2.1~3.7:1이다. 같은 색 계열로 명도만 내려 4.5:1 이상으로 맞춘다
const DARKER: Record<string, string> = {
  '#36acaa': '#0f7370',
  '#2B91AF': '#1a6b86',
  '#ff0000': '#d10000',
  '#e90': '#8a5200',
};
const theme = {
  ...Object.fromEntries(
    Object.entries(vs).map(([token, rule]) => [
      token,
      rule.color && DARKER[rule.color]
        ? { ...rule, color: DARKER[rule.color] }
        : rule,
    ])
  ),
  // vs에는 builtin이 없어 EditableCodeBlock가 들이는 prism-tomorrow의 연보라(#cc99cd)가 새어 든다. keyword와 같은 색으로 덮는다
  builtin: { color: vs.keyword.color },
};

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  fileName?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'tsx',
  showLineNumbers = false,
  fileName,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${styles.codeBlock} ${className || ''}`}>
      {fileName && <div className={styles.fileName}>{fileName}</div>}
      <div className={styles.codeContainer}>
        <SyntaxHighlighter
          language={language}
          style={theme}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem 0.5rem 1rem 1.25rem',
            background: 'transparent',
            border: 'none',
            fontSize: '0.875rem',
            lineHeight: '1.7',
            fontFamily: MONO,
          }}
          codeTagProps={{ style: { fontFamily: MONO } }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
      <span className={styles.copyCell}>
        <IconButton
          size="sm"
          aria-label={copied ? '복사됨' : '코드 복사'}
          onClick={handleCopy}
        >
          {copied ? <Check /> : <Copy />}
        </IconButton>
      </span>
    </div>
  );
}
