import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TapFeedback } from '@/components/tap-feedback';

export const metadata: Metadata = {
  title: 'Shielded Labs',
  description: 'Shielded Labs projects, research and community resources.',
  applicationName: 'Shielded Labs Portal',
  robots: { index: false, follow: false },
  icons: { icon: '/logos/shielded-labs.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#111111' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The governance page may set its light theme on <html> before React hydrates it.
  return <html lang="en" suppressHydrationWarning><body><TapFeedback />{children}</body></html>;
}
