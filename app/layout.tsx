import type { Metadata } from 'next';
import { Press_Start_2P, JetBrains_Mono } from 'next/font/google';
import { Nav } from '@/components/nav';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Arcade Vault · Portal Retro',
  description:
    'Plataforma de juegos online donde los jugadores compiten por los puntajes más altos',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${pressStart2P.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AuthProvider>
          <div className="av-bg" />
          <div className="av-noise" />
          <div
            className="av-app"
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100%',
            }}
          >
            <Nav />
            <main className="av-main">{children}</main>
            <footer
              style={{
                borderTop: '1px solid var(--line)',
                padding: '20px 32px',
                textAlign: 'center',
                color: 'var(--ink-faint)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.16em',
              }}
            >
              © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
