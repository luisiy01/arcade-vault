'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Nav() {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path: string) => {
    if (path === '/games') return pathname === '/games' || pathname === '/';
    if (path === '/library') return pathname === '/library' || pathname.startsWith('/game/');
    return pathname.startsWith(path);
  };

  return (
    <>
      <nav className="av-nav">
        <Link href="/games" className="logo">
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        <div className="links">
          <Link href="/games" className={isActive('/games') ? 'active' : ''}>
            Inicio
          </Link>
          <Link href="/library" className={isActive('/library') ? 'active' : ''}>
            Biblioteca
          </Link>
          <Link href="/hall" className={isActive('/hall') ? 'active' : ''}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={isActive('/about') ? 'active' : ''}>
            Acerca de
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <div className="user-menu" ref={userMenuRef}>
            <button className="btn ghost auth-btn" onClick={() => setUserMenu((v) => !v)}>
              {user.displayName} ▾
            </button>
            {userMenu && (
              <div className="user-dropdown">
                <div className="user-dropdown-name">{user.displayName}</div>
                <div className="user-dropdown-email">{user.email}</div>
                <button
                  className="user-dropdown-logout"
                  onClick={() => {
                    signOut();
                    setUserMenu(false);
                  }}
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}

        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">
          ≡
        </button>
      </nav>

      <div className={`av-mobile-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`av-mobile-panel${open ? ' open' : ''}`}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link
          href="/games"
          className={isActive('/games') ? 'active' : ''}
          onClick={() => setOpen(false)}
        >
          Inicio
        </Link>
        <Link
          href="/library"
          className={isActive('/library') ? 'active' : ''}
          onClick={() => setOpen(false)}
        >
          Biblioteca
        </Link>
        <Link
          href="/hall"
          className={isActive('/hall') ? 'active' : ''}
          onClick={() => setOpen(false)}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/about"
          className={isActive('/about') ? 'active' : ''}
          onClick={() => setOpen(false)}
        >
          Acerca de
        </Link>
        {user ? (
          <button
            className="mobile-logout"
            onClick={() => {
              signOut();
              setOpen(false);
            }}
          >
            Cerrar Sesión
          </button>
        ) : (
          <Link
            href="/auth"
            className={isActive('/auth') ? 'active' : ''}
            onClick={() => setOpen(false)}
          >
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: 'var(--ink-faint)',
            letterSpacing: '0.16em',
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
