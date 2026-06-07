import { useState } from 'react';
import { TIER_SCORES, TIER_CLASS } from '../mockData';

const TIERS = ['챌린저', '마스터', '다이아', '에메랄드', '플래티넘', '골드', '실버', '브론즈'];

const TIER_ICONS = {
  챌린저: '👑', 마스터: '💜', 다이아: '💎', 에메랄드: '💚',
  플래티넘: '🩵', 골드: '🏆', 실버: '🥈', 브론즈: '🥉',
};

function findBestSplit(players) {
  const n = players.length;
  const half = n / 2;
  let bestDiff = Infinity;
  let bestTeamA = [];

  const indices = players.map((_, i) => i);
  const combos = [];

  function combine(start, combo) {
    if (combo.length === half) { combos.push([...combo]); return; }
    if (start >= n) return;
    for (let i = start; i < n; i++) {
      combo.push(i);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);

  const totalScore = players.reduce((s, p) => s + (TIER_SCORES[p.tier] || 0), 0);

  for (const combo of combos) {
    const scoreA = combo.reduce((s, i) => s + (TIER_SCORES[players[i].tier] || 0), 0);
    const diff = Math.abs(scoreA - (totalScore - scoreA));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestTeamA = combo;
    }
  }

  const teamA = bestTeamA.map(i => players[i]);
  const teamBIndices = indices.filter(i => !bestTeamA.includes(i));
  const teamB = teamBIndices.map(i => players[i]);
  return { teamA, teamB, diff: bestDiff };
}

export default function TeamBuilder({ initialPlayers }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const updatePlayer = (idx, field, value) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    setResult(null);
  };

  const handleBalance = () => {
    const filled = players.map((p, i) => ({ name: p.name || `플레이어 ${i + 1}`, tier: p.tier || '골드' }));
    setLoading(true);
    setTimeout(() => {
      const res = findBestSplit(filled);
      setResult(res);
      setLoading(false);
    }, 600);
  };

  const resetAll = () => {
    setPlayers(initialPlayers.map(() => ({ name: '', tier: '골드' })));
    setResult(null);
  };

  const scoreA = result ? result.teamA.reduce((s, p) => s + (TIER_SCORES[p.tier] || 0), 0) : 0;
  const scoreB = result ? result.teamB.reduce((s, p) => s + (TIER_SCORES[p.tier] || 0), 0) : 0;

  return (
    <div className="card p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(74,158,255,0.2), rgba(124,92,252,0.2))',
            border: '1px solid rgba(74,158,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>⚔️</div>
          <div>
            <div className="section-title">5대5 내전 밸런스 생성기</div>
            <div style={{ fontSize: 12, color: '#8a8fa8', marginTop: 2 }}>
              10명의 정보를 입력하고 자동 밸런스를 맞춰보세요
            </div>
          </div>
        </div>
        <button onClick={resetAll} style={{
          fontSize: 12, color: '#8a8fa8', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
          padding: '5px 12px', cursor: 'pointer', fontFamily: 'Noto Sans KR',
        }}>초기화</button>
      </div>

      {/* Player Inputs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {players.map((player, idx) => (
          <div key={idx} className="card-inner" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: idx < 5 ? 'rgba(74,158,255,0.2)' : 'rgba(255,71,87,0.2)',
                border: `1px solid ${idx < 5 ? 'rgba(74,158,255,0.3)' : 'rgba(255,71,87,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                color: idx < 5 ? '#4a9eff' : '#ff4757',
                flexShrink: 0,
              }}>{idx + 1}</div>
              <span style={{ fontSize: 11, color: '#8a8fa8' }}>
                {idx < 5 ? '팀 A' : '팀 B'} · {TIER_ICONS[player.tier]}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="ggg-input"
                placeholder={`플레이어 ${idx + 1}`}
                value={player.name}
                onChange={e => updatePlayer(idx, 'name', e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                className="ggg-select"
                value={player.tier}
                onChange={e => updatePlayer(idx, 'tier', e.target.value)}
                style={{ width: 90, flexShrink: 0 }}
              >
                {TIERS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Score preview */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 12, color: '#8a8fa8' }}>총 점수:</span>
        {players.map((p, i) => (
          <span key={i} className={TIER_CLASS[p.tier]} style={{ fontSize: 12 }}>
            {TIER_SCORES[p.tier] || 0}
          </span>
        )).reduce((prev, curr, i) => [prev, <span key={`sep-${i}`} style={{ color: '#3a3d52', fontSize: 12 }}> · </span>, curr])}
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#e2e4ed' }}>
          합계: {players.reduce((s, p) => s + (TIER_SCORES[p.tier] || 0), 0)}점
        </span>
      </div>

      {/* Balance Button */}
      <button
        className="btn-primary"
        onClick={handleBalance}
        disabled={loading}
        style={{ width: '100%', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 0.6s linear infinite', fontSize: 16 }}>⚙️</span>
            밸런싱 계산 중...
          </>
        ) : (
          <>⚖️ 자동 밸런스화</>
        )}
      </button>

      {/* Result */}
      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            textAlign: 'center', marginBottom: 14,
            fontSize: 13, color: '#8a8fa8',
          }}>
            점수 차이: <span style={{ color: result.diff === 0 ? '#00d68f' : '#f5a623', fontWeight: 700 }}>
              {result.diff}점
            </span>
            {result.diff === 0 && ' — 완벽한 밸런스! 🎉'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'start' }}>
            {/* Team A */}
            <div className="team-card team-a">
              <div style={{
                textAlign: 'center', marginBottom: 12,
                fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16,
                color: '#4a9eff',
              }}>
                🔵 팀 A
                <div style={{ fontSize: 13, color: '#8a8fa8', fontFamily: 'Noto Sans KR', fontWeight: 400 }}>
                  총점 {scoreA}점
                </div>
              </div>
              {result.teamA.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 10px', marginBottom: 4,
                  background: 'rgba(74,158,255,0.07)', borderRadius: 6,
                  animation: `fadeInUp 0.3s ${i * 0.07}s both`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11 }}>{TIER_ICONS[p.tier]}</span>
                    <span className={TIER_CLASS[p.tier]} style={{ fontSize: 12, fontWeight: 600 }}>{p.tier}</span>
                    <span style={{ fontSize: 11, color: '#8a8fa8' }}>({TIER_SCORES[p.tier]}점)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* VS */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 8 }}>
              <div className="vs-badge">VS</div>
              {result.diff === 0 && (
                <div style={{ fontSize: 20 }}>⚖️</div>
              )}
            </div>

            {/* Team B */}
            <div className="team-card team-b">
              <div style={{
                textAlign: 'center', marginBottom: 12,
                fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16,
                color: '#ff4757',
              }}>
                🔴 팀 B
                <div style={{ fontSize: 13, color: '#8a8fa8', fontFamily: 'Noto Sans KR', fontWeight: 400 }}>
                  총점 {scoreB}점
                </div>
              </div>
              {result.teamB.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 10px', marginBottom: 4,
                  background: 'rgba(255,71,87,0.07)', borderRadius: 6,
                  animation: `fadeInUp 0.3s ${i * 0.07}s both`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11 }}>{TIER_ICONS[p.tier]}</span>
                    <span className={TIER_CLASS[p.tier]} style={{ fontSize: 12, fontWeight: 600 }}>{p.tier}</span>
                    <span style={{ fontSize: 11, color: '#8a8fa8' }}>({TIER_SCORES[p.tier]}점)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
