import { useState, useEffect } from 'react';

export default function OfflineToast({ show }) {
  const [visible,   setVisible]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (show && !dismissed) {
      // 짧은 딜레이 후 슬라이드인
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    }
  }, [show, dismissed]);

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 70,
      right: 20,
      zIndex: 9999,
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      maxWidth: 320,
    }}>
      <div style={{
        background: '#1e2130',
        border: '1px solid rgba(245,166,35,0.4)',
        borderLeft: '4px solid #f5a623',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>⚠️</div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: '#f5a623',
            marginBottom: 3, fontFamily: 'Noto Sans KR',
          }}>오프라인 모드</div>
          <div style={{
            fontSize: 12, color: '#8a8fa8', lineHeight: 1.5,
            fontFamily: 'Noto Sans KR',
          }}>
            RAWG API 연결에 실패했습니다.<br />
            내장 데이터로 자동 전환되었습니다.
          </div>
          <div style={{
            marginTop: 8, fontSize: 11, color: '#5a5f78',
            fontFamily: 'Noto Sans KR',
          }}>
            💡 <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>
              VITE_RAWG_API_KEY
            </code> 를 .env에 설정하세요
          </div>
        </div>

        {/* Close */}
        <button
          onClick={() => { setVisible(false); setTimeout(() => setDismissed(true), 400); }}
          style={{
            background: 'transparent', border: 'none',
            color: '#5a5f78', cursor: 'pointer',
            fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0,
          }}
        >✕</button>
      </div>
    </div>
  );
}
