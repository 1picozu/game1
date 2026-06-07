// 스켈레톤 UI: 깜빡이는 회색 플레이스홀더
export default function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* 포스터 영역 */}
      <div style={{
        width: '100%',
        paddingBottom: '140%',
        position: 'relative',
        background: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>
        <div className="skeleton-shimmer" style={{
          position: 'absolute',
          inset: 0,
        }} />
      </div>
      {/* 텍스트 영역 */}
      <div style={{
        padding: '8px 10px',
        background: '#161824',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}>
        <div className="skeleton-shimmer" style={{
          width: '70%', height: 12, borderRadius: 6,
        }} />
        <div className="skeleton-shimmer" style={{
          width: '40%', height: 8, borderRadius: 6,
        }} />
      </div>

      <style>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.10) 40%,
            rgba(255,255,255,0.04) 80%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
