import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import GNB from './components/GNB';
import HeroBanner from './components/HeroBanner';
import FeedSection from './components/FeedSection';
import FeaturedGames from './components/FeaturedGames';
import GameList from './components/GameList';
import ToastNotification from './components/ToastNotification';

import PostDetail    from './pages/PostDetail';
import CreatePost    from './pages/CreatePost';
import LoginPage     from './pages/LoginPage';
import FriendsPage   from './pages/FriendsPage';
import ScrimPage     from './pages/ScrimPage';
import BalancerPage  from './pages/BalancerPage';
import BoardPage     from './pages/BoardPage';
import MyPage        from './pages/MyPage';
import GameInfoPage  from './pages/GameInfoPage';
import TrackerPage   from './pages/TrackerPage';

function HomePage() {
  return (
    <>
      <HeroBanner />
      <FeedSection compact={true} />
      <FeaturedGames />
      <GameList />
    </>
  );
}

function GamesPage() {
  const { navigate } = useApp();
  return (
    <div style={{ maxWidth:1400, margin:'0 auto', padding:'28px 16px', animation:'fadeInUp 0.3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
        >← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span className="section-title">전체 게임 목록</span>
      </div>
      <GameList fullPage />
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function Router() {
  const { state } = useApp();
  switch (state.page) {
    case 'home':        return <HomePage />;
    case 'games':       return <GamesPage />;
    case 'friends':     return <FriendsPage />;
    case 'scrim':       return <ScrimPage />;
    case 'balancer':    return <BalancerPage />;
    case 'board':       return <BoardPage />;
    case 'gameinfo':    return <GameInfoPage />;
    case 'tracker':     return <TrackerPage />;
    case 'post-detail': return <PostDetail />;
    case 'create-post': return <CreatePost />;
    case 'login':       return <LoginPage />;
    case 'mypage':      return <MyPage />;
    default:            return <HomePage />;
  }
}

function AppShell() {
  const { state } = useApp();
  const isFullscreen = ['login'].includes(state.page);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('gamegg-theme') !== 'light');
  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
    localStorage.setItem('gamegg-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div style={{ minHeight:'100vh' }}>
      <GNB darkMode={darkMode} toggleDark={()=>setDarkMode(d=>!d)} />
      <ToastNotification />
      {isFullscreen ? <Router /> : (
        <main className="max-w-7xl mx-auto px-4 py-6"><Router /></main>
      )}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'20px 24px', textAlign:'center', fontSize:12, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
        © 2025 GAME.GG — 게이머를 위한 게임 정보 허브
      </footer>
    </div>
  );
}

export default function App() {
  return <AppProvider><AppShell /></AppProvider>;
}
