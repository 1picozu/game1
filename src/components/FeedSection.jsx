import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { GAME_BADGE_CLASS } from '../mockData';

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `${diff}초 전`;
  if (diff < 3600)  return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

function FeedItem({ post, onOpen, isNew }) {
  const badgeClass = GAME_BADGE_CLASS[post.game] || 'badge-default';
  const [cur, max] = post.slots.split('/').map(Number);
  const isFull = cur >= max;
  const [hl, setHl] = useState(isNew);
  useEffect(() => { if (isNew) { const t=setTimeout(()=>setHl(false),2500); return()=>clearTimeout(t); } },[isNew]);

  return (
    <div className="feed-item" onClick={() => onOpen(post)}
      style={{ background:hl?'rgba(74,158,255,0.08)':undefined, borderColor:hl?'rgba(74,158,255,0.3)':undefined, transition:'all 0.5s ease' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:4 }}>
        <span className={badgeClass} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, flexShrink:0, fontWeight:600 }}>{post.game}</span>
        <span style={{ fontSize:13, fontWeight:500, flex:1, lineHeight:1.4 }}>{post.title}</span>
        {isNew && <span style={{ fontSize:9, background:'rgba(0,214,143,0.2)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.4)', padding:'1px 5px', borderRadius:999, flexShrink:0, fontWeight:700 }}>NEW</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, color:isFull?'#ff4757':'#8a8fa8' }}>👥 {post.slots}{isFull?' (마감)':''}</span>
        <span style={{ fontSize:11, color:'#8a8fa8' }}>🕐 {post.time}</span>
        <span style={{ fontSize:11, color:'#5a5f78' }}>{timeAgo(post.createdAt)}</span>
        {post.tag && <span style={{ fontSize:10, background:'rgba(124,92,252,0.15)', color:'#9b7ffe', border:'1px solid rgba(124,92,252,0.25)', padding:'1px 6px', borderRadius:999 }}>{post.tag}</span>}
        {(post.comments||[]).length>0 && <span style={{ fontSize:10, color:'#5a5f78' }}>💬 {post.comments.length}</span>}
      </div>
    </div>
  );
}

// ── 게임친구 찾기 단독 피드 ─────────────────────────────────────────
export function FriendsFeed({ compact=false }) {
  const { state, navigate } = useApp();
  const { friendsPosts } = state;
  const prevLen = useRef(friendsPosts.length);
  const [newIds, setNewIds] = useState(new Set());

  useEffect(() => {
    if (friendsPosts.length > prevLen.current) {
      const ids = new Set(friendsPosts.slice(0, friendsPosts.length - prevLen.current).map(p=>p.id));
      setNewIds(ids);
      setTimeout(() => setNewIds(new Set()), 3000);
    }
    prevLen.current = friendsPosts.length;
  }, [friendsPosts]);

  // compact=true면 6개, false면 전체 (무한 스크롤 대신 전체 표시)
  const display = compact ? friendsPosts.slice(0, 6) : friendsPosts;

  return (
    <div className="card p-4">
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span className="live-dot"/>
        <span className="section-title">게임친구 찾기</span>
        <span style={{ marginLeft:'auto', fontSize:11, background:'rgba(74,158,255,0.1)', color:'#4a9eff', border:'1px solid rgba(74,158,255,0.25)', padding:'2px 8px', borderRadius:999 }}>{friendsPosts.length}개</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {display.map(post => (
          <FeedItem key={post.id} post={post} isNew={newIds.has(post.id)}
            onOpen={p => navigate('post-detail', { post:p, feed:'friends' })} />
        ))}
      </div>
      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        <button onClick={() => navigate('create-post', { mode:'friends' })} style={{ flex:1, padding:'8px', background:'rgba(74,158,255,0.08)', border:'1px solid rgba(74,158,255,0.2)', borderRadius:8, color:'#4a9eff', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'background 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(74,158,255,0.15)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(74,158,255,0.08)'}
        >+ 새 파티 만들기</button>
        {compact && <button onClick={()=>navigate('friends')} style={{ padding:'8px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR' }}>전체 보기</button>}
      </div>
    </div>
  );
}

// ── 게임 내전 찾기 단독 피드 ────────────────────────────────────────
export function ScrimFeed({ compact=false }) {
  const { state, navigate } = useApp();
  const { scrimPosts } = state;
  const prevLen = useRef(scrimPosts.length);
  const [newIds, setNewIds] = useState(new Set());

  useEffect(() => {
    if (scrimPosts.length > prevLen.current) {
      const ids = new Set(scrimPosts.slice(0, scrimPosts.length - prevLen.current).map(p=>p.id));
      setNewIds(ids);
      setTimeout(() => setNewIds(new Set()), 3000);
    }
    prevLen.current = scrimPosts.length;
  }, [scrimPosts]);

  const display = compact ? scrimPosts.slice(0, 6) : scrimPosts;

  return (
    <div className="card p-4">
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span className="live-dot" style={{ background:'#ff4757' }}/>
        <span className="section-title">게임 내전 찾기</span>
        <span style={{ marginLeft:'auto', fontSize:11, background:'rgba(255,71,87,0.1)', color:'#ff4757', border:'1px solid rgba(255,71,87,0.25)', padding:'2px 8px', borderRadius:999 }}>{scrimPosts.length}개</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {display.map(post => (
          <FeedItem key={post.id} post={post} isNew={newIds.has(post.id)}
            onOpen={p => navigate('post-detail', { post:p, feed:'scrim' })} />
        ))}
      </div>
      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        <button onClick={() => navigate('create-post', { mode:'scrim' })} style={{ flex:1, padding:'8px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.2)', borderRadius:8, color:'#ff4757', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'background 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.15)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,71,87,0.08)'}
        >+ 내전 방 만들기</button>
        {compact && <button onClick={()=>navigate('scrim')} style={{ padding:'8px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR' }}>전체 보기</button>}
      </div>
    </div>
  );
}

// ── 홈 화면용 2열 통합 (compact) ────────────────────────────────────
export default function FeedSection({ compact=false }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
      <FriendsFeed compact={compact} />
      <ScrimFeed   compact={compact} />
    </div>
  );
}
