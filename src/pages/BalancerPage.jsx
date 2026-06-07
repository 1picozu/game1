import TeamBuilder from '../components/TeamBuilder';
import { useApp } from '../store/AppContext';
import { initialPlayers } from '../mockData';

export default function BalancerPage() {
  const { navigate } = useApp();
  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 16px', animation:'fadeInUp 0.3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={() => navigate('home')} style={{
          background:'none', border:'none', color:'#8a8fa8', fontSize:13,
          cursor:'pointer', fontFamily:'Noto Sans KR', padding:0,
        }}
        onMouseEnter={e => e.currentTarget.style.color='#7c5cfc'}
        onMouseLeave={e => e.currentTarget.style.color='#8a8fa8'}
        >← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span className="section-title">⚖️ 5대5 내전 밸런스 생성기</span>
      </div>
      <TeamBuilder initialPlayers={initialPlayers} />
      <style>{`@keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
