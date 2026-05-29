'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { StatCard } from '@/components/ui/StatCard';
import { ProfessorOak } from '@/components/ui/ProfessorOak';
import { api } from '@/lib/api';
import type { PredictionWithResult, ModelMetrics } from '@/types';

const Pokeball3D = dynamic(() => import('@/components/ui/Pokeball3D').then(m => ({ default: m.Pokeball3D })), { ssr: false });

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

/* ── Pokémon-themed SVG Icons ──────────────────────────── */

function IconCrossedPokeballs({ size = 18, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g transform="rotate(-35, 7, 17)">
        <rect x="5" y="13" width="4" height="9" rx="2" fill={color} />
        <rect x="5" y="10" width="4" height="5" rx="1" fill={color} opacity="0.6" />
        <circle cx="7" cy="10" r="3.5" fill={color} />
        <path d="M3.5 10 A3.5 3.5 0 0 1 10.5 10" stroke="#fff" strokeWidth="1" fill="none" />
        <circle cx="7" cy="10" r="1.2" fill="#fff" />
      </g>
      <g transform="rotate(35, 17, 17)">
        <rect x="15" y="13" width="4" height="9" rx="2" fill={color} />
        <rect x="15" y="10" width="4" height="5" rx="1" fill={color} opacity="0.6" />
        <circle cx="17" cy="10" r="3.5" fill={color} />
        <path d="M13.5 10 A3.5 3.5 0 0 1 20.5 10" stroke="#fff" strokeWidth="1" fill="none" />
        <circle cx="17" cy="10" r="1.2" fill="#fff" />
      </g>
    </svg>
  );
}

function IconPokeballShield({ size = 18, color = '#94A3B8' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 2L4 6v5c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6L12 2Z" fill={color} opacity="0.18" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="11.5" r="4" fill={color} opacity="0.9" />
      <path d="M8 11.5 A4 4 0 0 1 16 11.5" fill="#1a2235" />
      <line x1="8" y1="11.5" x2="16" y2="11.5" stroke="#1a2235" strokeWidth="1.2" />
      <circle cx="12" cy="11.5" r="1.4" fill="#1a2235" />
      <circle cx="12" cy="11.5" r="0.7" fill={color} />
    </svg>
  );
}

function IconTarget({ size = 18, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="1.2" opacity="0.6" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <line x1="12" y1="2" x2="12" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="12" x2="6" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPokedex({ size = 16, color = '#94A3B8' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="4" y="2" width="16" height="20" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="2" x2="8" y2="22" stroke={color} strokeWidth="1" opacity="0.5" />
      <rect x="10" y="5" width="7" height="4" rx="1" fill={color} opacity="0.6" />
      <circle cx="11.5" cy="13" r="1.2" fill={color} opacity="0.8" />
      <circle cx="15.5" cy="13" r="1.2" fill={color} opacity="0.5" />
      <line x1="10" y1="17" x2="17" y2="17" stroke={color} strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      <line x1="10" y1="19.5" x2="15" y2="19.5" stroke={color} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

function IconPokeballCheck({ size = 16, color = '#94A3B8' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" />
      <path d="M2.5 12 A9.5 9.5 0 0 1 21.5 12" fill={color} opacity="0.2" />
      <line x1="2.5" y1="12" x2="21.5" y2="12" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.8" fill="var(--pk-bg-2)" stroke={color} strokeWidth="1.2" />
      <polyline points="10.2,12 11.3,13.3 13.8,10.7" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCrossedSwords({ size = 16, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <line x1="4" y1="4" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="4" x2="7" y2="7" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="5.5" y1="9" x2="9" y2="5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="19.5" cy="19.5" r="1.2" fill={color} />
      <line x1="20" y1="4" x2="4" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="4" x2="17" y2="7" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="18.5" y1="9" x2="15" y2="5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4.5" cy="19.5" r="1.2" fill={color} />
    </svg>
  );
}

function IconBullseye({ size = 16, color = '#F8D030' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.2" opacity="0.6" />
      <circle cx="12" cy="12" r="2.8" fill={color} opacity="0.9" />
    </svg>
  );
}

function ResultBadge({ b }: { readonly b: PredictionWithResult }) {
  if (b.actual_winner == null) {
    return (
      <span className="pk-vs-stamp pending">
        <svg width="10" height="10" viewBox="0 0 40 40" aria-hidden="true" style={{ animation: 'pokeball-spin 1.5s linear infinite' }}>
          <path d="M4 20 A16 16 0 0 1 36 20" fill="#6B7280" />
          <path d="M36 20 A16 16 0 0 1 4 20" fill="#374151" />
          <line x1="4" y1="20" x2="36" y2="20" stroke="#111" strokeWidth="3" />
          <circle cx="20" cy="20" r="4" fill="#111" />
        </svg>
        PENDING
      </span>
    );
  }
  if (b.correct_prediction === 1) {
    return <span className="pk-vs-stamp correct">★ CORRECT</span>;
  }
  return <span className="pk-vs-stamp wrong">✗ WRONG</span>;
}

/* Pokédex device — iconic red handheld with LCD screen left, info panel right */
function TrainerCard({
  totalPokemon, assignedPokemon, totalBattles, accuracy, loading,
}: {
  readonly totalPokemon: number | null;
  readonly assignedPokemon: number | null;
  readonly totalBattles: number | null;
  readonly accuracy: number | null;
  readonly loading: boolean;
}) {
  const accuracyPct = accuracy !== null ? accuracy * 100 : null;
  const barWidth = accuracyPct !== null ? Math.min(accuracyPct, 100) : 0;
  const stars = accuracyPct !== null ? Math.round(accuracyPct / 20) : 0;

  const idNo = totalPokemon !== null
    ? `${String(totalPokemon).padStart(3, '0')}001`
    : '———';

  return (
    <div
      aria-label="Pokédex Trainer Data"
      style={{
        width: '100%',
        maxWidth: '520px',
        background: 'linear-gradient(135deg, #CC0000 0%, #EF4444 30%, #CC0000 70%, #991111 100%)',
        borderRadius: '12px 6px 6px 12px',
        border: '3px solid #880000',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,160,160,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.06) 100%)', pointerEvents: 'none', borderRadius: 'inherit' }} />

      {/* Top indicator lights row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '6px', borderBottom: '2px solid #880000' }}>
        <div aria-hidden="true" style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #88ccff, #2266cc)', boxShadow: '0 0 8px rgba(34,102,204,0.8), 0 0 16px rgba(34,102,204,0.4)', border: '2px solid #1144aa', flexShrink: 0 }} />
        {(['#FF4444', '#FFCC00', '#44CC44'] as const).map((color, i) => (
          <div key={i} aria-hidden="true" style={{ width: '9px', height: '9px', borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}99`, border: '1px solid rgba(0,0,0,0.3)', flexShrink: 0 }} />
        ))}
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#ffcccc', letterSpacing: '0.12em', marginLeft: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          POKÉDEX
        </span>
        <div aria-hidden="true" style={{ marginLeft: 'auto', display: 'flex', gap: '3px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ width: '4px', height: '12px', background: i <= 4 ? '#ffcccc' : 'rgba(255,255,255,0.2)', borderRadius: '1px', border: '1px solid rgba(0,0,0,0.3)' }} />
          ))}
        </div>
      </div>

      {/* Main body */}
      <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
        {/* LEFT: LCD screen panel */}
        <div style={{ flex: '1 1 0', background: '#0d1a0d', border: '3px solid #1a2a1a', borderRadius: '4px', boxShadow: 'inset 0 0 12px rgba(0,0,0,0.8), inset 0 2px 4px rgba(0,0,0,0.6)', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '3px', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,60,0.025) 3px, rgba(0,255,60,0.025) 4px)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-pixel)', fontSize: '0.45rem', color: '#22cc44', letterSpacing: '0.08em', textShadow: '0 0 6px rgba(34,204,68,0.6)' }}>TRAINER DATA</p>
            <div style={{ height: '1px', background: '#22cc44', opacity: 0.4, marginBottom: '6px', boxShadow: '0 0 4px rgba(34,204,68,0.5)' }} />
            {[
              { label: 'POKÉMON', value: loading ? '—' : String(totalPokemon ?? '—') },
              { label: 'BATTLES ', value: loading ? '—' : String(totalBattles ?? ' 0') },
              { label: 'ACCURACY', value: loading ? '—' : (accuracyPct !== null ? `${accuracyPct.toFixed(1)}%` : '—') },
              { label: 'ASSIGNED', value: loading ? '—' : String(assignedPokemon ?? '—') },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.38rem', color: '#22aa44', letterSpacing: '0.04em' }}>{label}:</span>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.44rem', color: '#44ee66', textShadow: '0 0 4px rgba(68,238,102,0.5)' }}>{value}</span>
              </div>
            ))}
            <div style={{ height: '1px', background: '#22cc44', opacity: 0.3, margin: '5px 0' }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.35rem', color: '#22aa44' }}>ACC</span>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.35rem', color: '#44ee66' }}>{loading ? '—' : accuracyPct !== null ? `${accuracyPct.toFixed(0)}%` : '—'}</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(0,0,0,0.5)', border: '1px solid #22440a', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${barWidth}%`, background: barWidth >= 50 ? '#58C84A' : barWidth >= 25 ? '#E0C030' : '#E82828', transition: 'width 1s ease-out', boxShadow: `0 0 4px ${barWidth >= 50 ? 'rgba(88,200,74,0.8)' : barWidth >= 25 ? 'rgba(224,192,48,0.8)' : 'rgba(232,40,40,0.8)'}` }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: info panel */}
        <div style={{ width: '140px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ background: 'rgba(0,0,0,0.35)', border: '2px solid rgba(0,0,0,0.4)', borderRadius: '4px', padding: '7px 8px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-pixel)', fontSize: '0.35rem', color: 'rgba(255,200,200,0.6)', letterSpacing: '0.06em' }}>NAME:</p>
            <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-pixel)', fontSize: '0.48rem', color: '#ffffff', letterSpacing: '0.04em', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>DATA ENGINEER</p>
            <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-pixel)', fontSize: '0.35rem', color: 'rgba(255,200,200,0.6)', letterSpacing: '0.06em' }}>ID No:</p>
            <p style={{ margin: 0, fontFamily: 'var(--font-pixel)', fontSize: '0.48rem', color: '#ffffff', letterSpacing: '0.04em' }}>{loading ? '—' : idNo}</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(0,0,0,0.4)', borderRadius: '4px', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div aria-hidden="true" style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 0, left: '5px', right: '5px', height: '14px', background: '#CC0000', borderRadius: '4px 4px 0 0' }} />
              <div style={{ position: 'absolute', top: '9px', left: '1px', right: '1px', height: '5px', background: '#880000', borderRadius: '2px' }} />
              <div style={{ position: 'absolute', top: '13px', left: '8px', right: '8px', height: '18px', background: '#f5c9a0', borderRadius: '40% 40% 35% 35%' }} />
              <div style={{ position: 'absolute', top: '18px', left: '12px', width: '4px', height: '3px', background: '#2a1a0a', borderRadius: '2px' }} />
              <div style={{ position: 'absolute', top: '18px', right: '12px', width: '4px', height: '3px', background: '#2a1a0a', borderRadius: '2px' }} />
              <div style={{ position: 'absolute', bottom: 0, left: '7px', right: '7px', height: '14px', background: '#1a5fa0', borderRadius: '4px 4px 0 0' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
            {['#cc2200', '#cc2200', '#cc2200'].map((bg, i) => (
              <div key={i} aria-hidden="true" style={{ width: '20px', height: '10px', background: bg, borderRadius: '3px', border: '1px solid #880000', boxShadow: 'inset 0 1px 0 rgba(255,100,100,0.3), 0 1px 2px rgba(0,0,0,0.4)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <svg key={n} width="11" height="11" viewBox="0 0 14 14" aria-hidden="true">
                <polygon points="7,1 8.8,5.2 13.3,5.7 10.1,8.7 11,13.2 7,10.9 3,13.2 3.9,8.7 0.7,5.7 5.2,5.2" fill={n <= stars ? '#F8D030' : 'rgba(255,255,255,0.18)'} stroke={n <= stars ? '#B8A038' : 'rgba(0,0,0,0.2)'} strokeWidth="0.8" />
              </svg>
            ))}
          </div>
          <p style={{ margin: 0, fontFamily: 'var(--font-pixel)', fontSize: '0.32rem', color: 'rgba(255,200,200,0.5)', textAlign: 'center', letterSpacing: '0.05em' }}>TRAINER RANK</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [totalPokemon, setTotalPokemon] = useState<number | null>(null);
  const [assignedPokemon, setAssignedPokemon] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [recentBattles, setRecentBattles] = useState<PredictionWithResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [allPokemon, assigned, metricsData, history] = await Promise.allSettled([
          api.getPokemon(), api.getAssignedPokemon(), api.getAccuracyMetrics(), api.getBattleHistory(),
        ]);
        if (cancelled) return;
        if (allPokemon.status === 'fulfilled') setTotalPokemon(allPokemon.value.length);
        if (assigned.status === 'fulfilled') setAssignedPokemon(assigned.value.length);
        if (metricsData.status === 'fulfilled') setMetrics(metricsData.value);
        if (history.status === 'fulfilled') {
          const sorted = [...history.value].sort((a, b) => new Date(b.predicted_at).getTime() - new Date(a.predicted_at).getTime());
          setRecentBattles(sorted.slice(0, 5));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="pk-section">
      {/* Subtle arena floor texture */}
      <div className="pk-page-arena" aria-hidden="true" />
      <div className="pk-page-glow" aria-hidden="true" />

      {/* ── Trainer Card hero ─────────────────────────────── */}
      <header className="pk-dashboard-header">
        <TrainerCard
          totalPokemon={totalPokemon}
          assignedPokemon={assignedPokemon}
          totalBattles={metrics?.total_battles ?? null}
          accuracy={metrics?.accuracy ?? null}
          loading={loading}
        />

        {/* Battle Station */}
        <div className="pk-pokeball-station">
          {/* Station label */}
          <p style={{ margin: 0, fontSize: '0.5rem', fontFamily: 'var(--font-pixel)', color: 'var(--pk-red)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            ◆ BATTLE STATION
          </p>

          {/* 3D Pokéball */}
          <Pokeball3D size={220} loading={false} />

          {/* Game-menu quick actions */}
          <div style={{ width: '100%' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.4rem', fontFamily: 'var(--font-pixel)', color: 'var(--pk-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
              ▶ SELECT ACTION
            </p>
            <nav className="pk-quick-actions" aria-label="Quick navigation">
              <Link href="/engine1" className="pk-quick-action-item">
                <IconCrossedPokeballs size={14} color="#EF4444" />
                <span>GYM TEAM BUILDER</span>
                <span className="item-arrow">▶</span>
              </Link>
              <Link href="/engine2" className="pk-quick-action-item">
                <IconPokeballShield size={14} color="#94A3B8" />
                <span>COUNTER PICK</span>
                <span className="item-arrow">▶</span>
              </Link>
              <Link href="/engine3" className="pk-quick-action-item">
                <IconTarget size={14} color="#EF4444" />
                <span>BATTLE PREDICT</span>
                <span className="item-arrow">▶</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="pk-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <strong style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', letterSpacing: '0.06em' }}>⚠ SYSTEM ERROR: </strong>{error}
        </div>
      )}

      {/* ── Pokédex stat panels ───────────────────────── */}
      <section aria-label="Summary statistics" style={{ marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
        <p className="pk-section-label">
          <span aria-hidden="true">◆</span> TRAINER STATUS
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
          <StatCard label="Total Pokémon" value={totalPokemon ?? '—'} icon={<IconPokedex size={16} color="#94A3B8" />} loading={loading && totalPokemon === null} />
          <StatCard label="Assigned Pool" value={assignedPokemon ?? '—'} icon={<IconPokeballCheck size={16} color="#94A3B8" />} loading={loading && assignedPokemon === null} />
          <StatCard label="Total Battles" value={metrics?.total_battles ?? '—'} icon={<IconCrossedSwords size={16} color="#EF4444" />} loading={loading && metrics === null} />
          <StatCard label="Accuracy" value={metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : loading ? '—' : 'N/A'} icon={<IconBullseye size={16} color="#F8D030" />} loading={loading && metrics === null} accent />
        </div>
      </section>

      {/* ── Recent battle log ─────────────────────────── */}
      <section aria-label="Recent battle predictions">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p className="pk-section-label" style={{ margin: 0 }}>
            <span aria-hidden="true">◆</span> RECENT BATTLE LOG
          </p>
          <Link href="/history" style={{ fontSize: '0.5rem', fontFamily: 'var(--font-pixel)', color: 'var(--pk-red)', textDecoration: 'none', letterSpacing: '0.06em' }}>
            VIEW ALL ▶
          </Link>
        </div>

        <div className="pokedex-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div className="pk-loading-msg">
              <svg width="36" height="36" viewBox="0 0 40 40" aria-label="Loading" style={{ animation: 'pokeball-spin 0.9s linear infinite', display: 'block', margin: '0 auto' }}>
                <path d="M4 20 A16 16 0 0 1 36 20" fill="#DC2626" />
                <path d="M36 20 A16 16 0 0 1 4 20" fill="#F8FAFC" />
                <line x1="4" y1="20" x2="36" y2="20" stroke="#111" strokeWidth="2.5" />
                <circle cx="20" cy="20" r="4.5" fill="#111" />
                <circle cx="20" cy="20" r="2.5" fill="#F8FAFC" />
              </svg>
              <p className="pk-loading-title" style={{ color: 'var(--pk-red)' }}>LOADING BATTLE LOG...</p>
              <p className="pk-loading-sub">Scanning battle records</p>
            </div>
          ) : recentBattles.length === 0 ? (
            <ProfessorOak message="There is a time and place for everything, but not now." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="pk-table" style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Recent battles">
                <thead>
                  <tr>
                    <th style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.42rem' }}>◆ BATTLERS</th>
                    <th style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.42rem' }}>PREDICTED</th>
                    <th style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.42rem' }}>CONF</th>
                    <th style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.42rem' }}>RESULT</th>
                    <th style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.42rem' }}>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBattles.map((b, idx) => (
                    <tr key={b.match_id} className="pk-log-table-row">
                      <td style={{ fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap', position: 'relative', paddingLeft: '1.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`${SPRITE_BASE}/0.png`} alt="" width={20} height={20} style={{ imageRendering: 'pixelated', opacity: 0.6 }} loading="lazy" />
                          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', color: 'var(--pk-text-dim)', minWidth: '1rem' }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          {b.battler_a} <span style={{ color: 'var(--pk-text-dim)' }}>vs</span> {b.battler_b}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--pk-text)' }}>{b.predicted_winner}</td>
                      <td style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', fontWeight: 700, color: 'var(--pk-gold)' }}>
                        {(b.confidence_score > 1 ? b.confidence_score : b.confidence_score * 100).toFixed(1)}%
                      </td>
                      <td><ResultBadge b={b} /></td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--pk-text-dim)', fontSize: '0.72rem' }}>{formatTimestamp(b.predicted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pk-table-scroll-hint">◆ SHOWING LAST 5 RECORDS</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
