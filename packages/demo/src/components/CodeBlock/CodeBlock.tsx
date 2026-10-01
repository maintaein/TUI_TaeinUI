import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
  showLineNumbers = true,
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
      <div className={styles.header}>
        <span className={styles.language}>{language}</span>
        <button
          className={styles.copyButton}
          onClick={handleCopy}
          aria-label="코드 복사"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span className={styles.copyText}>{copied ? '복사됨!' : '복사'}</span>
        </button>
      </div>
      <div className={styles.codeContainer}>
        <SyntaxHighlighter
          language={language}
          style={vs}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            borderRadius: '0 0 0.5rem 0.5rem',
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
