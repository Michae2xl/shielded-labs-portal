'use client';

import { useEffect, useRef } from 'react';
import s from './section-menu.module.css';

type MenuItem = { id: string; label: string; count?: number };

export default function SectionMenu({ items, value, onChange, label, secondary = false }: {
  items: readonly MenuItem[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  secondary?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const reveal = () => {
      const current = menu.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current || menu.scrollWidth <= menu.clientWidth) return;
      const bounds = menu.getBoundingClientRect();
      const item = current.getBoundingClientRect();
      menu.scrollTo({ left: menu.scrollLeft + item.left - bounds.left - (bounds.width - item.width) / 2, behavior: 'instant' });
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(menu);
    return () => observer.disconnect();
  }, [value]);

  return <nav ref={ref} className={`${s.menu} ${secondary ? s.secondary : s.primary}`} aria-label={label}>
    {items.map(item => <button key={item.id} type="button" aria-current={value === item.id ? 'page' : undefined} onClick={() => onChange(item.id)}>
      {item.label}{item.count !== undefined && <span>{item.count}</span>}
    </button>)}
  </nav>;
}
