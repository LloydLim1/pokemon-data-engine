'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { storeUser } from '@/lib/auth';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [section, setSection] = useState('3ISC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setUsername('');
    setPassword('');
    setSection('3ISC');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('USERNAME and PASSWORD are required.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      let data: { access_token: string; username: string; id: string };

      if (mode === 'login') {
        data = await api.login(username.trim(), password);
      } else {
        data = await api.register(username.trim(), password, section.trim() || undefined);
      }

      storeUser({ id: data.id, username: data.username, access_token: data.access_token });
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === 'register';

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--pk-bg)',
        padding: '1.5rem',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(239,68,68,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: 'linear-gradient(145deg, #0d1120, #0a0e1a)',
          border: '2px solid rgba(239,68,68,0.4)',
          borderRadius: '1rem',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 0 40px rgba(239,68,68,0.15), 0 20px 60px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
      >
        {/* Pokéball SVG logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 40 40"
            aria-hidden="true"
            style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.45))' }}
          >
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" />
            <path d="M2 20 A18 18 0 0 1 38 20" fill="#DC2626" />
            <path d="M38 20 A18 18 0 0 1 2 20" fill="#F8FAFC" />
            <line x1="2" y1="20" x2="38" y2="20" stroke="#111" strokeWidth="2.5" />
            <circle cx="20" cy="20" r="5" fill="#111" />
            <circle cx="20" cy="20" r="2.8" fill="#F8FAFC" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            margin: '0 0 0.25rem',
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
            color: 'var(--pk-red)',
            letterSpacing: '0.12em',
            textAlign: 'center',
          }}
        >
          POKEMON DATA ENGINE
        </h1>

        {/* Subtitle / mode label */}
        <p
          style={{
            margin: '0 0 1.75rem',
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(0.52rem, 1.5vw, 0.62rem)',
            color: 'var(--pk-text-muted)',
            letterSpacing: '0.1em',
            textAlign: 'center',
          }}
        >
          {isRegister ? 'CREATE ACCOUNT' : 'TRAINER LOGIN'}
        </p>

        {/* Error box */}
        {error && (
          <div
            role="alert"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '0.5rem',
              padding: '0.625rem 0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.5rem',
                color: 'var(--pk-red)',
                letterSpacing: '0.08em',
                marginBottom: '0.25rem',
              }}
            >
              ERROR
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                color: 'rgba(239,68,68,0.9)',
                lineHeight: 1.5,
              }}
            >
              {error}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="login-username"
              style={{
                display: 'block',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.5rem',
                color: 'var(--pk-text-muted)',
                letterSpacing: '0.1em',
                marginBottom: '0.4rem',
              }}
            >
              USERNAME
            </label>
            <input
              id="login-username"
              type="text"
              className="pk-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={loading}
              placeholder="TRAINER NAME"
              style={{ width: '100%', fontSize: '16px' }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: isRegister ? '1rem' : '1.5rem' }}>
            <label
              htmlFor="login-password"
              style={{
                display: 'block',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.5rem',
                color: 'var(--pk-text-muted)',
                letterSpacing: '0.1em',
                marginBottom: '0.4rem',
              }}
            >
              PASSWORD
            </label>
            <input
              id="login-password"
              type="password"
              className="pk-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              disabled={loading}
              placeholder="••••••••"
              style={{ width: '100%', fontSize: '16px' }}
            />
          </div>

          {/* Register-only: Section */}
          {isRegister && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="login-section"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '0.5rem',
                  color: 'var(--pk-text-muted)',
                  letterSpacing: '0.1em',
                  marginBottom: '0.4rem',
                }}
              >
                SECTION <span style={{ color: 'var(--pk-text-muted)', opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                id="login-section"
                type="text"
                className="pk-input"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                disabled={loading}
                placeholder="3ISC"
                style={{ width: '100%', fontSize: '16px' }}
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading
                ? 'rgba(139,0,0,0.4)'
                : 'linear-gradient(135deg, #CC0000, #8B0000)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '0.5rem',
              color: loading ? 'rgba(255,255,255,0.5)' : '#fff',
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background 0.15s ease, opacity 0.15s ease',
              boxShadow: loading ? 'none' : '0 0 16px rgba(239,68,68,0.3)',
            }}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {loading && (
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2 A10 10 0 0 1 22 12" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {loading
              ? (isRegister ? 'CREATING ACCOUNT...' : 'LOGGING IN...')
              : (isRegister ? 'CREATE ACCOUNT' : 'LOG IN')
            }
          </button>
        </form>

        {/* Mode toggle */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          {isRegister ? (
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--pk-text-muted)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.5rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'color 0.15s ease',
              }}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Already registered? Log In
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('register')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--pk-text-muted)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.5rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'color 0.15s ease',
              }}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              New trainer? Create Account
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
