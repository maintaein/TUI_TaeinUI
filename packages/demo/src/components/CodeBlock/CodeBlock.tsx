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
          style={vs}
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
