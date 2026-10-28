'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!PASSWORD_REGEX.test(password)) {
      setError(
        'Contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos.',
      );
      return;
    }

    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (err) {
      if (err.message.toLowerCase().includes('session') || err.status === 403) {
        setError('Link inválido o expirado. Solicita un nuevo link de recuperación.');
      } else {
        setError(err.message);
      }
    } else {
      router.push('/games');
    }
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">NUEVA CONTRASEÑA</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              letterSpacing: '0.16em',
              marginTop: 6,
            }}
          >
            INGRESA TU NUEVA CONTRASEÑA
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="field">
            <label>Nueva contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-faint)',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  padding: '4px',
                }}
              >
                {showPassword ? 'OCULTAR' : 'MOSTRAR'}
              </button>
            </div>
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

          {error.includes('expirado') && (
            <button
              className="btn ghost"
              type="button"
              style={{ width: '100%', marginTop: 10, fontSize: 11 }}
              onClick={() => router.push('/auth')}
            >
              SOLICITAR NUEVO LINK
            </button>
          )}

          <button
            className="btn lg"
            type="submit"
            disabled={submitting}
            style={{ width: '100%', marginTop: 8 }}
          >
            {submitting ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
          </button>
        </form>

        <div
          style={{
            marginTop: 18,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--ink-faint)',
            letterSpacing: '0.1em',
          }}
        >
          ARCADE VAULT · RECUPERACIÓN DE ACCESO
        </div>
      </div>
    </div>
  );
}
