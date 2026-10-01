import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/themes/prism-tomorrow.css';
import * as styles from './EditableCodeBlock.css';

export interface EditableCodeBlockProps {
  code: string;
  onCodeChange: (code: string) => void;
  language?: string;
}

function highlight(code: string): string {
  const grammar =
    Prism.languages['tsx'] ||
    Prism.languages['jsx'] ||
    Prism.languages['javascript'];
  return Prism.highlight(code, grammar, 'tsx');
}

export function EditableCodeBlock({
  code,
  onCodeChange,
}: EditableCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>EDITABLE EXAMPLE</span>
        <button
          className={styles.copyButton}
          onClick={handleCopy}
          aria-label="코드 복사"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span className={styles.copyText}>{copied ? '복사됨!' : '복사'}</span>
        </button>
      </div>
      <div className={styles.editorContainer}>
        <Editor
          value={code}
          onValueChange={onCodeChange}
          highlight={highlight}
          padding={16}
          className={styles.editor}
          style={{
            color: '#1e1e1e',
            backgroundColor: '#ffffff',
          }}
        />
      </div>
    </div>
  );
}
