'use client';

import React from 'react';
import { ConfidenceBar } from '@/components/ui/ConfidenceBar';
import type { Engine3Response } from '@/types';

interface PredictionResultProps {
  readonly result: Engine3Response;
  readonly battlerA: string;
  readonly battlerB: string;
}

const MODEL_LABELS: Record<string, string> = {
  logistic_regression: 'Logistic',
  random_forest: 'Rnd Forest',
  gradient_boost: 'Grad Boost',
  svm: 'SVM',
  neural_network: 'Neural Net',
  knn: 'KNN',
  decision_tree: 'Dec. Tree',
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
};

export function PredictionResult({ result, battlerA, battlerB }: PredictionResultProps) {
  const confidencePct = result.confidence > 1 ? result.confidence : result.confidence * 100;
  const votes = result.model_votes ?? {};
  const voteEntries = Object.entries(votes);
  const votesForA = voteEntries.filter(([, v]) => v === battlerA).length;
  const votesForB = voteEntries.filter(([, v]) => v === battlerB).length;
  const isA = result.predicted_winner === battlerA;
  const isLegendary = confidencePct >= 80;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Winner banner */}
      <div
        className={isLegendary ? 'holo-card' : ''}
        style={{
          borderRadius: '1rem',
          border: `2px solid ${isA ? 'rgba(239,68,68,0.6)' : 'rgba(104,144,240,0.6)'}`,
          background: isA
            ? 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(185,28,28,0.08))'
            : 'linear-gradient(135deg, rgba(104,144,240,0.15), rgba(59,130,246,0.08))',
          padding: 'clamp(1.25rem, 3vw, 2rem)',
          textAlign: 'center',
          boxShadow: `0 0 32px ${isA ? 'rgba(239,68,68,0.25)' : 'rgba(104,144,240,0.25)'}`,
          position: 'relative',
        }}
      >
        {isLegendary && (
          <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontSize: '0.6rem', fontFamily: 'var(--font-pixel)', color: 'var(--pk-gold)', textShadow: '0 0 8px var(--pk-gold-glow)', letterSpacing: '0.05em' }}>
            LEGENDARY
          </div>
        )}
        <p style={{ fontSize: '0.6rem', fontFamily: 'var(--font-pixel)', letterSpacing: '0.1em', color: 'var(--pk-text-muted)', marginBottom: '0.5rem' }}>
          PREDICTED WINNER
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-body)',
            color: isA ? '#FCA5A5' : '#93C5FD',
            textShadow: `0 0 20px ${isA ? 'rgba(239,68,68,0.6)' : 'rgba(104,144,240,0.6)'}`,
            margin: '0 0 1rem',
            textTransform: 'capitalize',
          }}
        >
          {result.predicted_winner}
        </h2>
        <div style={{ maxWidth: '300px', margin: '0 auto 1rem' }}>
          <ConfidenceBar
            value={result.confidence}
            label="Confidence"
            height="lg"
            color={isA ? 'red' : 'blue'}
          />
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--pk-text-muted)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          {result.reason}
        </p>
      </div>

      {/* Vote tally */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ borderRadius: '0.75rem', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.62rem', fontFamily: 'var(--font-pixel)', color: 'var(--pk-text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
            {battlerA || 'Team A'}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FCA5A5', margin: 0, fontFamily: 'var(--font-body)' }}>{votesForA}</p>
          <p style={{ fontSize: '0.62rem', color: 'var(--pk-text-dim)', marginTop: '0.2rem' }}>votes</p>
        </div>
        <div style={{ borderRadius: '0.75rem', background: 'rgba(104,144,240,0.1)', border: '1px solid rgba(104,144,240,0.3)', padding: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.62rem', fontFamily: 'var(--font-pixel)', color: 'var(--pk-text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
            {battlerB || 'Team B'}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#93C5FD', margin: 0, fontFamily: 'var(--font-body)' }}>{votesForB}</p>
          <p style={{ fontSize: '0.62rem', color: 'var(--pk-text-dim)', marginTop: '0.2rem' }}>votes</p>
        </div>
      </div>

      {/* Model votes grid */}
      {voteEntries.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.62rem', fontFamily: 'var(--font-pixel)', color: 'var(--pk-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Model Votes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
            {voteEntries.map(([model, vote]) => {
              const votedA = vote === battlerA;
              const shortLabel = MODEL_LABELS[model.toLowerCase()] ?? model.replaceAll('_', ' ');
              return (
                <div
                  key={model}
                  style={{
                    borderRadius: '0.5rem',
                    border: `1px solid ${votedA ? 'rgba(239,68,68,0.35)' : 'rgba(104,144,240,0.35)'}`,
                    background: votedA ? 'rgba(220,38,38,0.1)' : 'rgba(104,144,240,0.1)',
                    padding: '0.625rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    textAlign: 'center',
                  }}
                >
                  {/* Pokéball icon — red filled if voted A, blue if B */}
                  <svg width="20" height="20" viewBox="0 0 40 40" aria-hidden="true">
                    <path d="M4 20 A16 16 0 0 1 36 20" fill={votedA ? '#DC2626' : '#6890F0'} />
                    <path d="M36 20 A16 16 0 0 1 4 20" fill="#F8FAFC" />
                    <line x1="4" y1="20" x2="36" y2="20" stroke="#111" strokeWidth="2" />
                    <circle cx="20" cy="20" r="4" fill="#111" />
                    <circle cx="20" cy="20" r="2.2" fill="#F8FAFC" />
                  </svg>
                  <span style={{ fontSize: '0.65rem', color: 'var(--pk-text-muted)', lineHeight: 1.3 }}>{shortLabel}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: votedA ? '#FCA5A5' : '#93C5FD', textTransform: 'capitalize' }}>
                    {vote}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
