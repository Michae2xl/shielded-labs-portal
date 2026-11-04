import type { ReactNode } from 'react';
import s from './context-notice.module.css';

export default function ContextNotice({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div role="note" className={`${s.notice} ${className}`}>{children}</div>;
}
