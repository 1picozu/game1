import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';

const TYPE_STYLE = {
  success: { border:'rgba(0,214,143,0.4)', icon:'✅', color:'#00d68f', bg:'rgba(0,214,143,0.1)' },
  info:    { border:'rgba(74,158,255,0.4)', icon:'ℹ️',  color:'#4a9eff', bg:'rgba(74,158,255,0.1)' },
  error:   { border:'rgba(255,71,87,0.4)', icon:'❌',  color:'#ff4757', bg:'rgba(255,71,87,0.1)'  },
};

export default function ToastNotification() {
  const { state, clearToast } = useApp();
  const { toast } = state;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) { setVisible(false); return; }
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(clearToast, 400); }, 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  const s = TYPE_STYLE[toast.type] || TYPE_STYLE.info;

  return (
    <div style={{
      position:'fixed', top:70, right:20, zIndex:9999,
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition:'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      maxWidth:300,
    }}>
      <div style={{
        background:'#1e2130', borderLeft:`4px solid ${s.color}`,
        border:`1px solid ${s.border}`, borderRadius:10,
        padding:'12px 16px', display:'flex', alignItems:'center', gap:10,
        boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
      }}>
        <span style={{ fontSize:16 }}>{s.icon}</span>
        <span style={{ fontSize:13, color:'#e2e4ed', fontFamily:'Noto Sans KR' }}>{toast.msg}</span>
      </div>
    </div>
  );
}
