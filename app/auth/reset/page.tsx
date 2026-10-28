'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (err) {
      setError(err.message);
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
