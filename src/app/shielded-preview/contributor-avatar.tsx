'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import manifest from '@/lib/shielded-preview/avatar-manifest.json';
import s from './development.module.css';

const avatars = manifest as Record<string, { src: string; source: string; profileUrl: string }>;
export default function ContributorAvatar({ name, login, size = 36 }: { name: string; login: string | null; size?: number }) {
  const src = login ? avatars[login.toLowerCase()]?.src : undefined;
  const [failed, setFailed] = useState<string | null>(null);
  const initials = name.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?';
  return <span className={s.avatar} style={{ width: size, height: size }} role="img" aria-label={src && failed !== src ? `${name}, GitHub avatar` : `${name}, initials`}>
    {src && failed !== src ? <img src={src} width={size} height={size} alt="" loading="lazy" onError={() => setFailed(src)}/> : <span aria-hidden="true">{initials}</span>}
  </span>;
}
