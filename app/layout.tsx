import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Cheah Tze Juen — Software Engineer',
  icons: { icon: '/favicon.svg' },
  description:
    'Cheah Tze Juen — NUS Computer Science student, SG Digital Scholar, and software engineer. Explore my work and interests through an interactive day, from code and mountain trails to squash, Spurs and collections.',
  metadataBase: new URL('https://cheahtj.github.io'),
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
