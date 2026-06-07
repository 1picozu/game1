import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';

const NAV_ITEMS = [
  { label:'메인',       page:'home' },
  { label:'게임 정보',  page:'gameinfo' },
  { label:'게임 목록',  page:'games' },
  { label:'친구 찾기',  page:'friends' },
  { label:'내전 찾기',  page:'scrim' },
  { label:'게임 게시판',page:'board' },
  { label:'내 라이브러리',page:'tracker' },
  { label:'밸런스',     page:'balancer' },
];

export default function GNB({ darkMode, toggleDark }) {
  const { state, navigate, logout } = useApp();
  const { page, user } = state;
  const [scrolled,  setScrolled]  = useState(false);
  const [showMenu,  setShowMenu]  = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const fn = () => setShowMenu(false);
    setTimeout(() => document.addEventListener('click', fn), 0);
    return () => document.removeEventListener('click', fn);
  }, [showMenu]);

  return (
    <nav className="gnb sticky top-0 z-50 w-full"
      style={{ boxShadow: scrolled?'0 4px 24px rgba(0,0,0,0.5)':'none', transition:'box-shadow 0.3s' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* 로고 */}
        <button onClick={()=>navigate('home')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
          <div style={{ background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Rajdhani', fontWeight:700, fontSize:14, color:'#fff' }}>GG</div>
          <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:20, background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:1 }}>GAME.GG</span>
        </button>

        {/* 네비 */}
        <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto', scrollbarWidth:'none', flex:1, minWidth:0 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.page} className={`nav-btn ${page===item.page?'active':''}`} onClick={()=>navigate(item.page)} style={{ fontSize:12, padding:'6px 9px', whiteSpace:'nowrap' }}>
              {item.label}
            </button>
          ))}
        </div>

        {/* 우측 */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <button onClick={toggleDark} title={darkMode?'라이트 모드':'다크 모드'} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.15)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'background 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >{darkMode?'☀️':'🌙'}</button>

          {user ? (
            <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setShowMenu(m=>!m)} style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(74,158,255,0.12)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, padding:'5px 12px', cursor:'pointer', color:'#4a9eff', fontSize:13, fontWeight:700, fontFamily:'Noto Sans KR' }}>
                <span style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:700 }}>{user.nickname[0]}</span>
                {user.nickname}
              </button>
              {showMenu && (
                <div style={{ position:'absolute', top:42, right:0, background:'#1e2130', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:6, minWidth:140, zIndex:999, boxShadow:'0 8px 28px rgba(0,0,0,0.6)' }}>
                  <button onClick={()=>{navigate('tracker');setShowMenu(false);}} style={{ width:'100%', textAlign:'left', padding:'8px 12px', background:'transparent', border:'none', color:'#c8cce0', fontSize:13, cursor:'pointer', borderRadius:6, fontFamily:'Noto Sans KR', fontWeight:600 }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >📊 내 라이브러리</button>
                  <button onClick={()=>{logout();setShowMenu(false);}} style={{ width:'100%', textAlign:'left', padding:'8px 12px', background:'transparent', border:'none', color:'#ff4757', fontSize:13, cursor:'pointer', borderRadius:6, fontFamily:'Noto Sans KR', fontWeight:600 }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.1)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >로그아웃</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={()=>navigate('login')} style={{ background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:6, color:'#fff', padding:'6px 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'opacity 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >로그인</button>
          )}
        </div>
      </div>
    </nav>
  );
}
