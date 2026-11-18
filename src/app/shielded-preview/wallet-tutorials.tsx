'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import b from './governance-bento.module.css';
import s from './wallet-tutorials.module.css';

const tutorials = [
  { id: 'vizor-desktop', title: 'Vizor on desktop', duration: '2:00' },
  { id: 'vizor-mobile', title: 'Vizor on mobile', duration: '2:04' },
  { id: 'zodl-mobile', title: 'Zodl on mobile', duration: '1:46' },
] as const;
const media = '/tutorials/nu7-1';

export default function WalletTutorials() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<(typeof tutorials)[number] | null>(null);

  return (
    <section className={`${b.card} ${s.section}`} id="wallet-tutorials" aria-labelledby="wallet-tutorials-title" tabIndex={-1}>
      <header className={b.header}>
        <h3 id="wallet-tutorials-title">Video tutorials</h3>
        <span className={b.meta}>English audio &amp; captions</span>
      </header>
      <ul className={s.gallery}>
        {tutorials.map((tutorial) => (
          <li key={tutorial.id}>
            <button type="button" className={s.tile} aria-haspopup="dialog" aria-label={`Watch ${tutorial.title}`}
              onClick={() => { setActive(tutorial); dialog.current?.showModal(); }}>
              <Image unoptimized className={s.cover} src={`${media}/${tutorial.id}.jpg`} width={1280} height={720} alt="" />
              <span className={s.caption}>
                <span className={s.play} aria-hidden="true">▶</span>
                <span>{tutorial.title}</span>
                <span className={s.duration}>{tutorial.duration}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <dialog ref={dialog} className={s.dialog} aria-labelledby="wallet-tutorial-title"
        onClose={() => setActive(null)}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        {active && <div className={s.player}>
          <div className={s.toolbar}>
            <h4 id="wallet-tutorial-title">{active.title}</h4>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close video">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <video key={active.id} aria-label={active.title} controls playsInline autoPlay preload="metadata"
            width={1920} height={1080} poster={`${media}/${active.id}.jpg`} src={`${media}/${active.id}.mp4`}>
            <track kind="captions" srcLang="en" label="English" src={`${media}/${active.id}.vtt`} />
          </video>
        </div>}
      </dialog>
    </section>
  );
}
