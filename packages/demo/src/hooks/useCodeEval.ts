import {
  useState,
  useEffect,
  useRef,
  useMemo,
  createElement,
  Fragment,
  type ReactElement,
} from 'react';
import { transform } from 'sucrase';
import * as Core from '@taein-ui/core';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bell,
  Check,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Download,
  Ellipsis,
  Hourglass,
  House,
  Info,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  Link,
  Mail,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Palette,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Settings,
  ShoppingCart,
  Star,
  TriangleAlert,
  User,
  X,
} from 'lucide-react';

/**
 * 코드 스니펫에서 마지막 JSX 표현식을 찾아 함수 컴포넌트 본문으로 변환한다.
 *
 * 전략: 앞에서부터 탐색하여 "statement 영역 직후의 첫 번째 빈 줄"을 분리 지점으로 사용.
 * statement 라인은 `;`로 끝나거나 `const/let/var/function`으로 시작하는 라인이다.
 * 분리 지점 위는 body(statements), 아래는 JSX(return 대상)로 분리.
 * 빈 줄이 없거나 statement가 없으면 전체가 JSX 표현식이라고 간주한다.
 */
function buildComponentBody(code: string): string {
  const trimmed = code.trim();

  // return 문이 이미 있으면 그대로 사용
  if (/\breturn\s/.test(trimmed)) {
    return trimmed;
  }

  const lines = trimmed.split('\n');

  // 앞에서부터 탐색: statement 영역 직후의 첫 번째 빈 줄을 분리 지점으로 사용
  let splitIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '' && i > 0) {
      const prevLine = lines[i - 1].trim();
      if (
        prevLine.endsWith(';') ||
        /^(const|let|var|function)\s/.test(prevLine)
      ) {
        splitIndex = i;
        break;
      }
    }
  }

  if (splitIndex === -1) {
    // 분리 지점을 못 찾으면 전체가 JSX 표현식
    return `return (${trimmed});`;
  }

  const bodyLines = lines.slice(0, splitIndex).join('\n').trim();
  const jsxLines = lines.slice(splitIndex).join('\n').trim();

  if (!jsxLines) {
    return `return (${bodyLines});`;
  }

  if (bodyLines) {
    return `${bodyLines}\nreturn (${jsxLines});`;
  }
  return `return (${jsxLines});`;
}

/** scope에 주입할 객체 맵 */
const scopeMap: Record<string, unknown> = {
  React: { createElement, Fragment, useState, useEffect, useRef, useMemo },
  createElement,
  Fragment,
  useState,
  useEffect,
  useRef,
  useMemo,
  // LivePreview code 문자열이 쓰는 lucide 아이콘만 주입 (번들 크기 때문에 쓰는 것만).
  // core와 이름이 겹치면 core가 이기도록 ...Core보다 앞에 둔다. lucide의 Icon·List는 core와 겹쳐 넣지 않는다.
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bell,
  Check,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Download,
  Ellipsis,
  Hourglass,
  House,
  Info,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  Link,
  Mail,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Palette,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Settings,
  ShoppingCart,
  Star,
  TriangleAlert,
  User,
  X,
  // core 컴포넌트 전부 주입
  ...Core,
};

const scopeKeys = Object.keys(scopeMap);
const scopeValues = Object.values(scopeMap);

interface UseCodeEvalResult {
  element: ReactElement | null;
  error: string | null;
}

/**
 * new Function 실행 시 위험한 전역을 undefined로 shadowing.
 * 데모 코드가 window/document/localStorage 등에 접근하는 것을 차단한다.
 * scopeMap에 명시된 React + Core + 주입한 lucide 아이콘만 사용 가능.
 */
const BLOCKED_GLOBALS = [
  'window',
  'document',
  'location',
  'history',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'SharedWorker',
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
] as const;

/** 코드를 트랜스파일 + 실행 (순수 계산) */
function evaluateCode(code: string): {
  element: ReactElement | null;
  error: string | null;
} {
  try {
    const body = buildComponentBody(code);
    const componentCode = `function __Preview__() { ${body} }`;

    const { code: transpiledCode } = transform(componentCode, {
      transforms: ['jsx', 'typescript'],
      jsxRuntime: 'classic',
      production: true,
    });

    // BLOCKED_GLOBALS를 파라미터명으로 추가해 undefined로 shadowing
    const fn = new Function(
      ...BLOCKED_GLOBALS,
      ...scopeKeys,
      `${transpiledCode}\nreturn createElement(__Preview__);`
    );
    const blockedValues = new Array(BLOCKED_GLOBALS.length).fill(undefined);
    const element = fn(...blockedValues, ...scopeValues) as ReactElement;

    return { element, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { element: null, error: message };
  }
}

/**
 * 코드를 동기적으로 트랜스파일 + 실행하여 React element를 반환한다.
 * 성공하면 즉시 반영하고, 에러는 300ms 디바운스 후 확정된 경우에만 표시한다.
 */
export function useCodeEval(code: string): UseCodeEvalResult {
  // 코드가 변경될 때마다 즉시 동기적으로 평가
  const evalResult = useMemo(() => evaluateCode(code), [code]);

  // 에러 디바운스: 300ms 동안 에러가 지속되면 표시
  const [debouncedError, setDebouncedError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(errorTimerRef.current);

    if (evalResult.error !== null) {
      // 실패: 300ms 후에 에러 표시
      const errorMsg = evalResult.error;
      errorTimerRef.current = setTimeout(() => {
        setDebouncedError(errorMsg);
      }, 300);
    }

    return () => clearTimeout(errorTimerRef.current);
  }, [evalResult.error]);

  // 성공 시 에러 클리어는 렌더 단계에서 직접 계산 (effect 불필요)
  // evalResult.error가 null이면 에러가 없는 것이므로 debouncedError도 무시
  const error = evalResult.error === null ? null : debouncedError;

  return useMemo(
    () => ({
      element: evalResult.element,
      error,
    }),
    [evalResult.element, error]
  );
}
