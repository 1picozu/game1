import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { GAME_BADGE_CLASS, TIER_CLASS } from '../mockData';

const GAME_ACCOUNT_LABELS = {
  riot:     { name:'라이엇', icon:'⚡', color:'#c8a84b' },
  blizzard: { name:'블리자드', icon:'💙', color:'#00aeff' },
  steam:    { name:'스팀', icon:'🟦', color:'#4a9eff' },
  nexon:    { name:'넥슨', icon:'🟢', color:'#00d68f' },
  nc:       { name:'엔씨', icon:'🔴', color:'#ff4757' },
  kakao:    { name:'카카오', icon:'🟡', color:'#f5a623' },
};

function loadGameAccounts(userId) {
  try { return JSON.parse(localStorage.getItem(`gamegg_accounts_${userId}`) || '{}'); }
  catch { return {}; }
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `${diff}초 전`;
  if (diff < 3600)  return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

export default function PostDetail() {
  const { state, navigate, joinPost, leavePost, addFeedComment } = useApp();
  const { pageParams, user } = state;
  const { post: initPost, feed } = pageParams;

  if (!initPost) { navigate('home'); return null; }

  const livePost = (feed==='friends' ? state.friendsPosts : state.scrimPosts)
    .find(p => p.id === initPost.id) || initPost;

  const [cur, max] = livePost.slots.split('/').map(Number);
  const isFull     = cur >= max;
  const pct        = Math.round((cur / max) * 100);
  const badgeClass = GAME_BADGE_CLASS[livePost.game] || 'badge-default';
  const tierClass  = TIER_CLASS[livePost.tier] || '';
  const backPage   = feed === 'friends' ? 'friends' : 'scrim';
  const hasJoined  = user && (livePost.joinedBy||[]).includes(user.id);

  const [commentText, setCommentText] = useState('');

  const handleJoin  = () => { if (!user) { navigate('login'); return; } if (isFull||hasJoined) return; joinPost(livePost.id, feed, user.id); };
  const handleLeave = () => { if (!user||!hasJoined) return; leavePost(livePost.id, feed, user.id); };
  const submitComment = () => {
    if (!user) { navigate('login'); return; }
    const t = commentText.trim();
    if (!t) return;
    addFeedComment(livePost.id, feed, { author: user.nickname, content: t });
    setCommentText('');
  };

  const cardStyle = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 14px' };

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'28px 16px', animation:'fadeInUp 0.3s ease' }}>
      <button onClick={()=>navigate(backPage)} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', marginBottom:20, fontFamily:'Noto Sans KR', padding:0 }}
        onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
      >← {feed==='friends'?'게임친구 찾기':'게임 내전 찾기'}로 돌아가기</button>

      <div className="card p-6">
        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:20 }}>
          <span className={badgeClass} style={{ fontSize:12, padding:'3px 8px', borderRadius:5, flexShrink:0, fontWeight:600 }}>{livePost.game}</span>
          <h2 style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:20, lineHeight:1.4, flex:1, margin:0 }}>{livePost.title}</h2>
        </div>

        {/* 메타 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { label:'작성자', value:<span><span className={tierClass} style={{fontWeight:700}}>[{livePost.tier}]</span> {livePost.author}</span> },
            { label:'플레이 시간', value: livePost.time },
            { label:'모집 인원', value: livePost.slots },
            { label:'등록', value: timeAgo(livePost.createdAt) },
          ].map(r => (
            <div key={r.label} style={cardStyle}>
              <div style={{ fontSize:11, color:'#8a8fa8', marginBottom:4 }}>{r.label}</div>
              <div style={{ fontSize:13, color:'#e2e4ed' }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* 진행바 */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#8a8fa8', marginBottom:6 }}>
            <span>모집 현황</span>
            <span style={{ color:isFull?'#ff4757':'#00d68f', fontWeight:700 }}>{livePost.slots} {isFull?'(마감)':`(${max-cur}자리 남음)`}</span>
          </div>
          <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:isFull?'#ff4757':'linear-gradient(90deg,#4a9eff,#00d68f)', borderRadius:999, transition:'width 0.6s ease' }}/>
          </div>
        </div>

        {livePost.desc && (
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'14px 16px', marginBottom:20, fontSize:14, lineHeight:1.8, color:'#c8cce0', fontFamily:'Noto Sans KR' }}>{livePost.desc}</div>
        )}
        {livePost.tag && (
          <div style={{ marginBottom:20 }}>
            <span style={{ fontSize:12, background:'rgba(124,92,252,0.15)', color:'#9b7ffe', border:'1px solid rgba(124,92,252,0.3)', padding:'4px 10px', borderRadius:999 }}>🏷 {livePost.tag}</span>
          </div>
        )}

        {/* 참가 버튼 */}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          {hasJoined ? (
            <>
              <div style={{ flex:1, padding:'13px', borderRadius:10, background:'rgba(0,214,143,0.1)', border:'1px solid rgba(0,214,143,0.35)', color:'#00d68f', fontSize:15, fontWeight:700, textAlign:'center', fontFamily:'Noto Sans KR' }}>
                ✅ 참가 완료
              </div>
              <button onClick={handleLeave} style={{ padding:'13px 20px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:10, color:'#ff4757', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:600, transition:'background 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.18)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,71,87,0.08)'}
              >취소</button>
            </>
          ) : (
            <button onClick={handleJoin} disabled={isFull} style={{ flex:1, padding:'13px', background:isFull?'rgba(255,255,255,0.05)':'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:isFull?'1px solid rgba(255,255,255,0.1)':'none', borderRadius:10, color:isFull?'#5a5f78':'#fff', fontSize:15, fontWeight:700, cursor:isFull?'not-allowed':'pointer', fontFamily:'Noto Sans KR', transition:'opacity 0.2s' }}
              onMouseEnter={e=>{if(!isFull)e.currentTarget.style.opacity='0.88';}} onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >{isFull?'모집 마감':!user?'🔐 로그인 후 참가':'✋ 참가 신청'}</button>
          )}
          <button onClick={()=>navigate(backPage)} style={{ padding:'13px 20px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#8a8fa8', fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR' }}>목록으로</button>
        </div>

        {/* 내 게임 닉네임 표시 (참가 완료 시) */}
        {hasJoined && user && (() => {
          const accts = loadGameAccounts(user.id);
          const filledAccts = Object.entries(accts).filter(([,v])=>v&&v.trim());
          return (
            <div style={{ marginBottom:20, padding:'14px 16px', background:'rgba(74,158,255,0.06)', border:'1px solid rgba(74,158,255,0.2)', borderRadius:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a9eff', marginBottom:10, fontFamily:'Noto Sans KR' }}>
                🎮 내 게임 닉네임 (상대방에게 표시됨)
              </div>
              {filledAccts.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {filledAccts.map(([id, nick]) => {
                    const info = GAME_ACCOUNT_LABELS[id];
                    if (!info) return null;
                    return (
                      <div key={id} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:info.color+'18', border:`1px solid ${info.color}44`, borderRadius:8, fontSize:12, fontFamily:'Noto Sans KR' }}>
                        <span>{info.icon}</span>
                        <span style={{ color:'#8a8fa8' }}>{info.name}</span>
                        <span style={{ color:'#e2e4ed', fontWeight:700 }}>{nick}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize:12, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
                  게임 닉네임이 등록되지 않았어요.{' '}
                  <button onClick={()=>navigate('mypage')} style={{ background:'none', border:'none', color:'#4a9eff', cursor:'pointer', fontSize:12, padding:0, textDecoration:'underline', fontFamily:'Noto Sans KR' }}>
                    마이페이지에서 등록하기 →
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* 댓글 */}
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', marginBottom:14, fontFamily:'Noto Sans KR' }}>
            💬 댓글 <span style={{ color:'#4a9eff' }}>{(livePost.comments||[]).length}</span>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitComment()}
              placeholder={user?'댓글을 입력하세요... (Enter)':'로그인 후 댓글 작성 가능'} disabled={!user}
              style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e2e4ed', padding:'9px 12px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none' }}
              onFocus={e=>e.currentTarget.style.borderColor='#4a9eff'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
            />
            <button onClick={submitComment} style={{ padding:'9px 16px', background:'rgba(74,158,255,0.15)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, color:'#4a9eff', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:600 }}>등록</button>
          </div>
          {(livePost.comments||[]).length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px', fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>아직 댓글이 없어요. 첫 댓글을 남겨보세요!</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[...(livePost.comments||[])].reverse().map(c => (
                <div key={c.id} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#4a9eff' }}>{c.author}</span>
                    <span style={{ fontSize:11, color:'#5a5f78' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#c8cce0', lineHeight:1.6, fontFamily:'Noto Sans KR' }}>{c.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
