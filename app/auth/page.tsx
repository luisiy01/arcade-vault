'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signIn, signUp, signInWithOAuth, resetPassword } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/games');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setError('Error al iniciar sesión con proveedor externo.');
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      router.push('/games');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Nombre de jugador requerido.');
      return;
    }
    if (password.length < 6) {
      setError('Contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    const result = await signUp(email, password, displayName);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (result.needsConfirmation) {
      setInfo('Revisa tu email para confirmar tu cuenta antes de iniciar sesión.');
    } else {
      router.push('/games');
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    const { error: err } = await signInWithOAuth(provider);
    if (err) setError(err);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Ingresa tu email para recuperar contraseña.');
      return;
    }
    setSubmitting(true);
    const { error: err } = await resetPassword(email);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setInfo('Email de recuperación enviado. Revisa tu bandeja.');
      setShowReset(false);
    }
  };

  if (loading) return null;
  if (user) return null;

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              letterSpacing: '0.16em',
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {!showReset ? (
          <>
            <div className="auth-tabs">
              <button
                className={tab === 'in' ? 'on' : ''}
                onClick={() => {
                  setTab('in');
                  setError('');
                }}
              >
                INICIAR SESIÓN
              </button>
              <button
                className={tab === 'up' ? 'on' : ''}
                onClick={() => {
                  setTab('up');
                  setError('');
                }}
              >
                CREAR CUENTA
              </button>
            </div>

            <form onSubmit={tab === 'in' ? handleSignIn : handleSignUp}>
              {tab === 'up' && (
                <div className="field slide-in">
                  <label>Nombre de jugador</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="PLAYER1"
                    maxLength={10}
                  />
                  {displayName && (
                    <div
                      className="mono"
                      style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 4 }}
                    >
                      Se mostrará como: {displayName.toUpperCase()}
                    </div>
                  )}
                </div>
              )}
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                  required
                />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div
                  style={{
                    color: 'var(--neon-magenta)',
                    fontSize: 12,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              {info && (
                <div
                  style={{
                    color: 'var(--neon-green)',
                    fontSize: 12,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {info}
                </div>
              )}

              <button
                className="btn lg"
                type="submit"
                disabled={submitting}
                style={{ width: '100%', marginTop: 8 }}
              >
                {submitting ? 'CARGANDO...' : tab === 'in' ? 'ENTRAR AL VAULT' : 'CREAR Y JUGAR'}
              </button>
            </form>

            {tab === 'in' && (
              <button
                className="btn ghost"
                type="button"
                style={{ width: '100%', marginTop: 10, fontSize: 11 }}
                onClick={() => {
                  setShowReset(true);
                  setError('');
                  setInfo('');
                }}
              >
                ¿OLVIDASTE TU CONTRASEÑA?
              </button>
            )}

            <button
              className="btn ghost"
              type="button"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => router.push('/games')}
            >
              JUGAR COMO INVITADO
            </button>

            <div className="auth-divider">O CONTINÚA CON</div>
            <div className="social">
              <button className="btn ghost" type="button" onClick={() => handleOAuth('google')}>
                ◆ GOOGLE
              </button>
              <button className="btn ghost" type="button" onClick={() => handleOAuth('github')}>
                ▣ GITHUB
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleReset} style={{ marginTop: 16 }}>
            <div className="field">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jugador@vault.gg"
                required
              />
            </div>

            {error && (
              <div
                style={{
                  color: 'var(--neon-magenta)',
                  fontSize: 12,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn lg"
              type="submit"
              disabled={submitting}
              style={{ width: '100%', marginTop: 8 }}
            >
              {submitting ? 'ENVIANDO...' : 'ENVIAR LINK DE RECUPERACIÓN'}
            </button>

            <button
              className="btn ghost"
              type="button"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => {
                setShowReset(false);
                setError('');
              }}
            >
              VOLVER AL LOGIN
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: 18,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--ink-faint)',
            letterSpacing: '0.1em',
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
