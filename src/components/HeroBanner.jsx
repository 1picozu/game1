import { useApp } from '../store/AppContext';

const STATS = [
  { label: '등록 게임', value: '10,000+', color: '#4a9eff',  icon: '🎮' },
  { label: '할인 정보', value: '100+',    color: '#ff4757',  icon: '💸' },
  { label: '출시 예정', value: '50+',     color: '#00d68f',  icon: '🚀' },
];

const TAGS = ['게임 트레일러', '메타크리틱 점수', '할인 정보', '출시 예정작', '게임 이벤트', '구매 링크'];

export default function HeroBanner() {
  const { navigate } = useApp();

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 20,
      marginBottom: 28,
      padding: '40px 44px',
      background: 'linear-gradient(135deg, #0a0c18 0%, #0f1225 40%, #0a0c18 100%)',
      border: '1px solid rgba(74,158,255,0.12)',
    }}>
      {/* 배경 글로우 */}
      <div style={{ position:'absolute', top:-80, right:-80, width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, rgba(74,158,255,0.07) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-60, left:'30%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'radial-gradient(rgba(74,158,255,0.04) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>

      <div style={{ position:'relative', zIndex:1, maxWidth:620 }}>
        {/* 배지 */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(74,158,255,0.1)', border:'1px solid rgba(74,158,255,0.25)', borderRadius:999, padding:'4px 14px', marginBottom:18, fontSize:11, color:'#4a9eff', fontWeight:700 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#4a9eff', animation:'pulseGlow 1.5s ease infinite', display:'inline-block' }}/>
          실시간 게임 정보 업데이트 중
        </div>

        {/* 메인 헤드라인 */}
        <h1 style={{
          fontFamily: 'Noto Sans KR',
          fontWeight: 800,
          fontSize: 34,
          lineHeight: 1.25,
          marginBottom: 14,
          color: '#fff',
          letterSpacing: -0.5,
        }}>
          모든 게임 정보,<br/>
          <span style={{ background:'linear-gradient(135deg, #4a9eff, #7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            한 곳에서 확인하세요
          </span>
        </h1>

        {/* 서브 텍스트 */}
        <p style={{ fontSize:14, color:'#8a8fa8', marginBottom:22, lineHeight:1.75, fontFamily:'Noto Sans KR', fontWeight:500 }}>
          트레일러 영상부터 메타크리틱 점수, 최신 할인 정보, 출시 예정작까지<br/>
          게임에 관한 모든 것을 GAME.GG에서 한번에 찾아보세요.
        </p>

        {/* 기능 태그 */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:26 }}>
          {TAGS.map(tag => (
            <span key={tag} style={{
              fontSize:11, padding:'4px 12px', borderRadius:999,
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',
              color:'#a0a8c0', fontFamily:'Noto Sans KR', fontWeight:600,
            }}># {tag}</span>
          ))}
        </div>

        {/* CTA 버튼 */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button
            onClick={() => navigate('games')}
            style={{ background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:10, color:'#fff', padding:'11px 26px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'opacity 0.2s, transform 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.opacity='0.88';e.currentTarget.style.transform='translateY(-1px)';}}
            onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)';}}
          >🎮 게임 목록 보기</button>
          <button
            onClick={() => navigate('gameinfo')}
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#c8cce0', padding:'11px 26px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'background 0.2s, transform 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.09)';e.currentTarget.style.transform='translateY(-1px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.transform='translateY(0)';}}
          >💸 할인 · 출시 정보</button>
        </div>
      </div>

      {/* 우측 통계 카드 */}
      <div style={{ position:'absolute', right:40, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:10 }}>
        {STATS.map(stat => (
          <div key={stat.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 18px', textAlign:'center', minWidth:120 }}>
            <div style={{ fontSize:18, marginBottom:3 }}>{stat.icon}</div>
            <div style={{ fontFamily:'Rajdhani', fontWeight:800, fontSize:22, color:stat.color, lineHeight:1 }}>{stat.value}</div>
            <div style={{ fontSize:11, color:'#8a8fa8', marginTop:4, fontFamily:'Noto Sans KR' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
