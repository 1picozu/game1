export default function HeroBanner() {
  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 16,
      marginBottom: 24,
      padding: '36px 40px',
      background: 'linear-gradient(135deg, #0d0f1a 0%, #121629 50%, #0d0f1a 100%)',
      border: '1px solid rgba(74,158,255,0.15)',
    }}>
      {/* BG decoration */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,158,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}></div>
      <div style={{
        position: 'absolute', bottom: -40, left: '40%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}></div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(74,158,255,0.12)',
          border: '1px solid rgba(74,158,255,0.25)',
          borderRadius: 999,
          padding: '4px 12px',
          marginBottom: 14,
          fontSize: 11,
          color: '#4a9eff',
          fontWeight: 600,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#4a9eff',
            animation: 'pulseGlow 1.5s ease infinite',
          }}></span>
          BETA — 지금 오픈 중
        </div>
        <h1 style={{
          fontFamily: 'Rajdhani',
          fontWeight: 700,
          fontSize: 36,
          lineHeight: 1.1,
          marginBottom: 10,
          background: 'linear-gradient(135deg, #ffffff 0%, #a0b4d0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          같이 게임할 친구를<br/>지금 바로 찾아보세요
        </h1>
        <p style={{
          fontSize: 14, color: '#8a8fa8', marginBottom: 20, lineHeight: 1.6,
        }}>
          리그오브레전드, 발로란트, PUBG 등 다양한 게임의 파티원&내전을 매칭해드립니다
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            background: 'linear-gradient(135deg, #4a9eff, #7c5cfc)',
            border: 'none', borderRadius: 8,
            color: '#fff', padding: '10px 24px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Noto Sans KR',
          }}>🎮 파티원 찾기</button>
          <button style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: '#c8cce0',
            padding: '10px 24px', fontSize: 14,
            fontWeight: 500, cursor: 'pointer',
            fontFamily: 'Noto Sans KR',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >⚔️ 내전 만들기</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        position: 'absolute', right: 40, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {[
          { label: '활성 유저', value: '12,847', color: '#4a9eff' },
          { label: '진행 중 파티', value: '3,291', color: '#00d68f' },
          { label: '오늘 매칭', value: '8,540', color: '#7c5cfc' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '10px 16px',
            textAlign: 'center', minWidth: 110,
          }}>
            <div style={{
              fontFamily: 'Rajdhani', fontWeight: 700,
              fontSize: 22, color: stat.color, lineHeight: 1,
            }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#8a8fa8', marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
