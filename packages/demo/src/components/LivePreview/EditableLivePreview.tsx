import { useState, Component, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { EditableCodeBlock } from '../EditableCodeBlock';
import { useCodeEval } from '../../hooks/useCodeEval';
import * as styles from './LivePreview.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError: (error: string) => void;
  resetKey: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RenderErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export interface EditableLivePreviewProps {
  code: string;
  centered: boolean;
  padding: 'none' | 'sm' | 'md' | 'lg';
}

export function EditableLivePreview({
  code: initialCode,
  centered,
  padding,
}: EditableLivePreviewProps) {
  const [editedCode, setEditedCode] = useState(initialCode);
  const [renderError, setRenderError] = useState<string | null>(null);
  const { element, error: evalError } = useCodeEval(editedCode);

  const error = evalError || renderError;
  const hasError = error !== null;

  const handleCodeChange = (newCode: string) => {
    setEditedCode(newCode);
    setRenderError(null);
  };

  return (
    <>
      <div
        className={`${styles.preview} ${centered ? styles.previewCentered : ''} ${
          styles.previewPadding[padding]
        } ${hasError ? styles.previewEmpty : ''}`}
      >
        {!hasError && element && (
          <RenderErrorBoundary onError={setRenderError} resetKey={editedCode}>
            {element}
          </RenderErrorBoundary>
        )}
      </div>
      {hasError && (
        <div className={styles.errorBar}>
          <CircleAlert className={styles.errorIcon} />
          {error}
        </div>
      )}
      <EditableCodeBlock code={editedCode} onCodeChange={handleCodeChange} />
    </>
  );
}
