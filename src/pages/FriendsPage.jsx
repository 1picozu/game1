import { useApp } from '../store/AppContext';
import { FriendsFeed } from '../components/FeedSection';

export default function FriendsPage() {
  const { navigate } = useApp();
  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 16px', animation:'fadeInUp 0.3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
        >← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span className="section-title">게임친구 찾기</span>
      </div>
      <FriendsFeed compact={false} />
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
