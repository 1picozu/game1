import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';

const GAME_ACCOUNTS = [
  { id:'riot',     name:'라이엇 (LoL/발로란트)', icon:'⚡', color:'#c8a84b', placeholder:'닉네임#KR1' },
  { id:'blizzard', name:'블리자드',              icon:'💙', color:'#00aeff', placeholder:'BattleTag#1234' },
  { id:'steam',    name:'스팀',                  icon:'🟦', color:'#1b2838', placeholder:'Steam 닉네임' },
  { id:'nexon',    name:'넥슨 (로아/메이플)',     icon:'🟢', color:'#00d68f', placeholder:'넥슨 ID' },
  { id:'nc',       name:'엔씨소프트',            icon:'🔴', color:'#ff4757', placeholder:'NCSoft 닉네임' },
  { id:'kakao',    name:'카카오게임즈',           icon:'🟡', color:'#f5a623', placeholder:'카카오 게임 닉네임' },
];

function loadGameAccounts(userId) {
  try { return JSON.parse(localStorage.getItem(`gamegg_accounts_${userId}`) || '{}'); }
  catch { return {}; }
}
function saveGameAccounts(userId, accounts) {
  localStorage.setItem(`gamegg_accounts_${userId}`, JSON.stringify(accounts));
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:color+'22', border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
      <div>
        <div style={{ fontSize:22, fontWeight:700, color:'#e2e4ed', fontFamily:'Rajdhani' }}>{value}</div>
        <div style={{ fontSize:12, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>{label}</div>
      </div>
    </div>
  );
}

export default function MyPage() {
  const { state, navigate } = useApp();
  const { user } = state;

  const [accounts, setAccounts] = useState({});
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState({});
  const [saved,    setSaved]    = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      const loaded = loadGameAccounts(user.id);
      setAccounts(loaded);
      setDraft(loaded);
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ maxWidth:600, margin:'80px auto', padding:'0 16px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔐</div>
        <div style={{ fontSize:20, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR', marginBottom:8 }}>로그인이 필요합니다</div>
        <div style={{ fontSize:14, color:'#5a5f78', fontFamily:'Noto Sans KR', marginBottom:24 }}>마이페이지를 이용하려면 로그인해주세요.</div>
        <button onClick={()=>navigate('login')} style={{ background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:8, color:'#fff', padding:'12px 32px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR' }}>
          로그인하러 가기
        </button>
      </div>
    );
  }

  const filledAccounts = Object.values(accounts).filter(v=>v&&v.trim()).length;
  const joinedFriends = state.friendsPosts.filter(p=>(p.joinedBy||[]).includes(user.id)).length;
  const joinedScrims  = state.scrimPosts.filter(p=>(p.joinedBy||[]).includes(user.id)).length;

  const handleSave = () => {
    const cleaned = {};
    Object.keys(draft).forEach(k => { if(draft[k]?.trim()) cleaned[k] = draft[k].trim(); });
    setAccounts(cleaned);
    saveGameAccounts(user.id, cleaned);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TABS = [
    { id:'profile',  label:'프로필',     icon:'👤' },
    { id:'accounts', label:'게임 계정',  icon:'🎮' },
    { id:'activity', label:'활동 내역',  icon:'📋' },
  ];

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 16px', animation:'fadeInUp 0.3s ease', fontFamily:'Noto Sans KR' }}>
      {/* 브레드크럼 */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
        >← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span style={{ fontSize:14, fontWeight:700, color:'#e2e4ed' }}>마이페이지</span>
      </div>

      {/* 프로필 헤더 카드 */}
      <div style={{ background:'linear-gradient(135deg, rgba(74,158,255,0.1) 0%, rgba(124,92,252,0.15) 100%)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:16, padding:'28px 32px', marginBottom:24, display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:700, color:'#fff', flexShrink:0, boxShadow:'0 4px 20px rgba(124,92,252,0.4)' }}>
          {user.nickname[0].toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:24, fontWeight:700, color:'#e2e4ed', marginBottom:4 }}>{user.nickname}</div>
          <div style={{ fontSize:13, color:'#8a8fa8', marginBottom:10 }}>GAME.GG 멤버</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, padding:'3px 10px', background:'rgba(74,158,255,0.12)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:20, color:'#4a9eff' }}>🎮 게임 계정 {filledAccounts}개 연동</span>
            <span style={{ fontSize:11, padding:'3px 10px', background:'rgba(0,214,143,0.12)', border:'1px solid rgba(0,214,143,0.3)', borderRadius:20, color:'#00d68f' }}>✅ 활동 중</span>
          </div>
        </div>
        {saved && (
          <div style={{ padding:'8px 16px', background:'rgba(0,214,143,0.15)', border:'1px solid rgba(0,214,143,0.4)', borderRadius:8, color:'#00d68f', fontSize:13, animation:'fadeInUp 0.2s ease' }}>
            ✅ 저장되었습니다!
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:12, marginBottom:24 }}>
        <StatCard label="연동된 게임 계정" value={filledAccounts} icon="🎮" color="#4a9eff" />
        <StatCard label="참가한 친구찾기" value={joinedFriends} icon="👥" color="#00d68f" />
        <StatCard label="참가한 내전" value={joinedScrims} icon="⚔️" color="#7c5cfc" />
        <StatCard label="작성한 게시글" value={state.boardPosts.filter(p=>p.author===user.nickname).length} icon="📝" color="#f5a623" />
      </div>

      {/* 탭 */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{ padding:'10px 20px', background:'transparent', border:'none', borderBottom: activeTab===tab.id ? '2px solid #7c5cfc' : '2px solid transparent', color: activeTab===tab.id ? '#7c5cfc' : '#5a5f78', fontSize:13, fontWeight: activeTab===tab.id ? 700 : 400, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s', marginBottom:-1 }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── 탭: 프로필 ── */}
      {activeTab === 'profile' && (
        <div className="card p-5">
          <h3 style={{ fontSize:15, fontWeight:700, color:'#e2e4ed', marginBottom:20, marginTop:0 }}>내 프로필 정보</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', alignItems:'center', gap:12, padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:13, color:'#5a5f78' }}>닉네임</span>
              <span style={{ fontSize:14, color:'#e2e4ed', fontWeight:600 }}>{user.nickname}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', alignItems:'center', gap:12, padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:13, color:'#5a5f78' }}>가입일</span>
              <span style={{ fontSize:14, color:'#e2e4ed' }}>{new Date(user.id).toLocaleDateString('ko-KR')}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', alignItems:'center', gap:12, padding:'14px 0' }}>
              <span style={{ fontSize:13, color:'#5a5f78' }}>연동 계정</span>
              <span style={{ fontSize:14, color:'#e2e4ed' }}>{filledAccounts}개 / {GAME_ACCOUNTS.length}개</span>
            </div>
          </div>
          <button onClick={()=>setActiveTab('accounts')} style={{ marginTop:20, padding:'10px 24px', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR' }}>
            🎮 게임 계정 관리하기
          </button>
        </div>
      )}

      {/* ── 탭: 게임 계정 ── */}
      {activeTab === 'accounts' && (
        <div className="card p-5">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#e2e4ed', marginBottom:4, marginTop:0 }}>게임 계정 연동</h3>
              <p style={{ fontSize:12, color:'#5a5f78', margin:0 }}>닉네임을 등록하면 게임친구 찾기·내전 참가 시 자동으로 표시됩니다.</p>
            </div>
            {!editing ? (
              <button onClick={()=>{ setEditing(true); setDraft({...accounts}); }}
                style={{ padding:'8px 18px', background:'rgba(74,158,255,0.12)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, color:'#4a9eff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Noto Sans KR', whiteSpace:'nowrap' }}>
                ✏️ 수정
              </button>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleSave}
                  style={{ padding:'8px 18px', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR' }}>
                  💾 저장
                </button>
                <button onClick={()=>{ setEditing(false); setDraft({...accounts}); }}
                  style={{ padding:'8px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR' }}>
                  취소
                </button>
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {GAME_ACCOUNTS.map(acct => (
              <div key={acct.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:`1px solid ${accounts[acct.id] ? acct.color+'44' : 'rgba(255,255,255,0.06)'}`, borderRadius:10, transition:'border-color 0.2s' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:acct.color+'22', border:`1px solid ${acct.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{acct.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#c8cce0', marginBottom:4 }}>{acct.name}</div>
                  {editing ? (
                    <input
                      value={draft[acct.id] || ''}
                      onChange={e=>setDraft(d=>({...d,[acct.id]:e.target.value}))}
                      placeholder={acct.placeholder}
                      style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:`1px solid ${acct.color}44`, borderRadius:6, color:'#e2e4ed', padding:'7px 10px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none', boxSizing:'border-box' }}
                      onFocus={e=>e.currentTarget.style.borderColor=acct.color}
                      onBlur={e=>e.currentTarget.style.borderColor=acct.color+'44'}
                    />
                  ) : (
                    <div style={{ fontSize:13, color: accounts[acct.id] ? '#e2e4ed' : '#3a3d52', fontWeight: accounts[acct.id] ? 600 : 400 }}>
                      {accounts[acct.id] || <span style={{ fontStyle:'italic', fontSize:12 }}>미등록</span>}
                    </div>
                  )}
                </div>
                {accounts[acct.id] && !editing && (
                  <span style={{ fontSize:11, padding:'3px 8px', background:'rgba(0,214,143,0.12)', border:'1px solid rgba(0,214,143,0.3)', borderRadius:20, color:'#00d68f', whiteSpace:'nowrap', flexShrink:0 }}>✅ 연동됨</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(124,92,252,0.06)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:8, fontSize:12, color:'#8a8fa8', lineHeight:1.7 }}>
            💡 <strong style={{ color:'#9b7ffe' }}>팁:</strong> 게임 계정을 등록해두면 게임친구 찾기·내전 참가 시 상대방이 내 닉네임을 바로 확인할 수 있어요.
          </div>
        </div>
      )}

      {/* ── 탭: 활동 내역 ── */}
      {activeTab === 'activity' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* 참가한 친구찾기 */}
          <div className="card p-5">
            <h3 style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', marginBottom:16, marginTop:0 }}>👥 참가한 게임친구 찾기</h3>
            {state.friendsPosts.filter(p=>(p.joinedBy||[]).includes(user.id)).length === 0 ? (
              <div style={{ fontSize:13, color:'#3a3d52', padding:'20px 0', textAlign:'center' }}>참가한 모집이 없습니다.</div>
            ) : (
              state.friendsPosts.filter(p=>(p.joinedBy||[]).includes(user.id)).map(p => (
                <div key={p.id} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:18 }}>🎮</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'#e2e4ed', fontWeight:600 }}>{p.title}</div>
                    <div style={{ fontSize:11, color:'#5a5f78', marginTop:2 }}>{p.game} · {p.time}</div>
                  </div>
                  <span style={{ fontSize:11, padding:'2px 8px', background:'rgba(0,214,143,0.12)', border:'1px solid rgba(0,214,143,0.3)', borderRadius:20, color:'#00d68f' }}>참가중</span>
                </div>
              ))
            )}
          </div>

          {/* 참가한 내전 */}
          <div className="card p-5">
            <h3 style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', marginBottom:16, marginTop:0 }}>⚔️ 참가한 내전</h3>
            {state.scrimPosts.filter(p=>(p.joinedBy||[]).includes(user.id)).length === 0 ? (
              <div style={{ fontSize:13, color:'#3a3d52', padding:'20px 0', textAlign:'center' }}>참가한 내전이 없습니다.</div>
            ) : (
              state.scrimPosts.filter(p=>(p.joinedBy||[]).includes(user.id)).map(p => (
                <div key={p.id} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:18 }}>⚔️</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'#e2e4ed', fontWeight:600 }}>{p.title}</div>
                    <div style={{ fontSize:11, color:'#5a5f78', marginTop:2 }}>{p.game} · {p.time}</div>
                  </div>
                  <span style={{ fontSize:11, padding:'2px 8px', background:'rgba(124,92,252,0.12)', border:'1px solid rgba(124,92,252,0.3)', borderRadius:20, color:'#7c5cfc' }}>참가중</span>
                </div>
              ))
            )}
          </div>

          {/* 작성 글 */}
          <div className="card p-5">
            <h3 style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', marginBottom:16, marginTop:0 }}>📝 내가 쓴 게시글</h3>
            {state.boardPosts.filter(p=>p.author===user.nickname).length === 0 ? (
              <div style={{ fontSize:13, color:'#3a3d52', padding:'20px 0', textAlign:'center' }}>작성한 게시글이 없습니다.</div>
            ) : (
              state.boardPosts.filter(p=>p.author===user.nickname).map(p => (
                <div key={p.id} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize:13, color:'#e2e4ed', fontWeight:600 }}>{p.title}</div>
                  <div style={{ fontSize:11, color:'#5a5f78', marginTop:2 }}>조회 {p.views} · 좋아요 {p.likes} · 댓글 {p.comments?.length || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
