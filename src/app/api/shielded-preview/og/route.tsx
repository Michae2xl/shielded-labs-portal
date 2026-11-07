import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { formatZec, type NsmReading } from '@/lib/shielded-preview/nsm/balance';
import { getNsmBalance } from '@/lib/shielded-preview/nsm/provider';
import { clip, shareCard, type ShareCard } from '@/lib/shielded-preview/share';

export const dynamic = 'force-dynamic';
// The portal's own typeface and shield; the image renderer reads WOFF, not the WOFF2 the pages use.
type Font = { name: string; data: Buffer; weight: 400 | 500; style: 'normal' };
type Assets = { fonts: Font[]; shield: string };
let assets: Promise<Assets> | undefined;
const asset = (path: string) => readFile(join(process.cwd(), 'public', path));
const loadAssets = () => assets ??= Promise.all([
  Promise.all(([400, 500] as const).map(async weight => ({ name: 'Inter', data: await asset(`fonts/og/inter-latin-${weight}-normal.woff`), weight, style: 'normal' as const }))),
  asset('logos/shielded-labs.png').then(data => `data:image/png;base64,${data.toString('base64')}`),
]).then(([fonts, shield]) => ({ fonts, shield }));

const INK = '#f4f4f4';
const MUTED = '#9b9b9b';
const FAINT = '#6f6f6f';
const titleSize = (title: string) => title.length <= 18 ? 104 : title.length <= 32 ? 84 : title.length <= 52 ? 68 : 56;

function Mark({ shield, size }: { shield: string; size: 'small' | 'large' }) {
  const large = size === 'large';
  return <div style={{ display: 'flex', alignItems: 'center', flexDirection: large ? 'column' : 'row', gap: large ? 34 : 18 }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={shield} alt="" width={large ? 136 : 50} height={large ? 136 : 50}/>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: large ? 'center' : 'flex-start', gap: large ? 14 : 4 }}>
      <div style={{ display: 'flex', fontSize: large ? 66 : 25, fontWeight: 500, letterSpacing: large ? 15 : 5, paddingLeft: large ? 15 : 0, color: INK, lineHeight: 1 }}>SHIELDED</div>
      <div style={{ display: 'flex', fontSize: large ? 30 : 14, fontWeight: 500, letterSpacing: large ? 23 : 9, paddingLeft: large ? 23 : 0, color: MUTED, lineHeight: 1 }}>LABS</div>
    </div>
  </div>;
}

function Chip({ label }: { label: string }) {
  return <div style={{ display: 'flex', padding: '11px 22px', border: '1.5px solid #343434', borderRadius: 999, fontSize: 17, letterSpacing: 3, color: '#cfcfcf', textTransform: 'uppercase' }}>{label}</div>;
}

/** The frame every image shares: dark field, hairline border and a soft light from the upper right. */
function Frame({ children }: { children: React.ReactNode }) {
  return <div style={{ width: '100%', height: '100%', display: 'flex', padding: 26, background: '#060606', fontFamily: 'Inter', color: INK }}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '46px 56px 50px', border: '1.5px solid #222', borderRadius: 30, backgroundColor: '#0d0d0d', backgroundImage: 'radial-gradient(circle at 88% 0%, #1f1f1f 0%, #0d0d0d 58%)' }}>{children}</div>
  </div>;
}

function Balance({ reading }: { reading: NsmReading }) {
  const [whole, fraction] = formatZec(reading.balanceZat).split('.');
  const size = whole.length > 4 ? 100 : 120;
  const unit = 38;
  // Inter's baseline sits 0.137em above the bottom of a line box at line-height 1.
  const lift = Math.round(0.137 * (size - unit));
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', fontSize: 28, color: MUTED }}>NSM balance</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', fontSize: size, fontWeight: 500, lineHeight: 1, letterSpacing: -4 }}>
      <span>{whole}</span><span style={{ color: '#8c8c8c' }}>.{fraction}</span><span style={{ marginLeft: 22, marginBottom: lift, fontSize: unit, letterSpacing: 1, color: MUTED }}>ZEC</span>
    </div>
    <div style={{ display: 'flex', fontSize: 25, color: FAINT }}>{`Block ${reading.height.toLocaleString('en-US')} · +${formatZec(reading.removedSinceActivationZat)} ZEC removed since NU7`}</div>
  </div>;
}

function Brand({ shield }: { shield: string }) {
  return <Frame>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Mark shield={shield} size="large"/>
    </div>
  </Frame>;
}

/** The share image: the shield, a chip naming the kind of page, its title and one short line; the NSM shows its balance. */
function Card({ card, reading, shield }: { card: ShareCard; reading: NsmReading | null; shield: string }) {
  const title = clip(card.title, 90);
  return <Frame>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Mark shield={shield} size="small"/>
      {card.chip ? <Chip label={card.chip}/> : null}
    </div>
    {reading ? <Balance reading={reading}/> : <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', maxWidth: 1000, fontSize: titleSize(title), fontWeight: 500, lineHeight: 1.04, letterSpacing: titleSize(title) >= 84 ? -3.5 : -2, textWrap: 'balance' }}>{title}</div>
      <div style={{ display: 'flex', fontSize: 28, color: MUTED }}>{card.subtitle}</div>
    </div>}
  </Frame>;
}

export async function GET(request: Request) {
  if(process.env.SHIELDED_LABS_PREVIEW!=='1')return new Response('Not found',{status:404});
  const card = shareCard(Object.fromEntries(new URL(request.url).searchParams));
  const [{ fonts, shield }, reading] = await Promise.all([loadAssets(), card.live === 'nsm' ? getNsmBalance().then(result => result.reading) : null]);
  const image = card.brand ? <Brand shield={shield}/> : <Card card={card} reading={reading} shield={shield}/>;
  return new ImageResponse(image, { width: 1200, height: 630, fonts, headers: { 'Cache-Control': 'public, max-age=300', 'X-Robots-Tag': 'noindex' } });
}
