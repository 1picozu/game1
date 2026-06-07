import { useState } from 'react';
import { useApp } from '../store/AppContext';

const CATEGORIES = ['전체','자유','공략','유머','질문'];
const CAT_COLOR  = { 자유:'#4a9eff', 공략:'#00d68f', 유머:'#f5a623', 질문:'#ff4757' };
const TIER_COLOR = { 챌린저:'#f0c330', 마스터:'#c45bcf', 다이아:'#6badf5', 에메랄드:'#00d68f', 플래티넘:'#6ecbce', 골드:'#e6bc6e', 실버:'#a8b4c0', 브론즈:'#b07040' };

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `${diff}초 전`;
  if (diff < 3600)  return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

// ── 게시글 상세 ──────────────────────────────────────────────────────
function BoardDetail({ post, onBack }) {
  const { state, navigate, addBoardComment, likeBoardPost } = useApp();
  const { user } = state;
  const livePost = state.boardPosts.find(p => p.id === post.id) || post;
  const [text, setText] = useState('');
  const catColor = CAT_COLOR[livePost.category] || '#4a9eff';

  const submitComment = () => {
    if (!user) { navigate('login'); return; }
    const t = text.trim();
    if (!t) return;
    addBoardComment(livePost.id, { author: user.nickname, content: t, tier: user.tier || '골드' });
    setText('');
  };

  return (
    <div style={{ maxWidth:800, margin:'0 auto', animation:'fadeInUp 0.3s ease' }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', marginBottom:20, fontFamily:'Noto Sans KR', padding:0 }}
        onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
      >← 목록으로 돌아가기</button>

      <div className="card p-6">
        {/* 헤더 */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:`${catColor}22`, color:catColor, border:`1px solid ${catColor}44`, fontWeight:700 }}>{livePost.category}</span>
          </div>
          <h2 style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:22, margin:'0 0 12px 0', lineHeight:1.4 }}>{livePost.title}</h2>
          <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:'#8a8fa8' }}>
            <span style={{ color: TIER_COLOR[livePost.tier]||'#8a8fa8', fontWeight:700 }}>[{livePost.tier}] {livePost.author}</span>
            <span>👁 {livePost.views}</span>
            <span>❤️ {livePost.likes}</span>
            <span>💬 {(livePost.comments||[]).length}</span>
            <span style={{ marginLeft:'auto' }}>{timeAgo(livePost.createdAt)}</span>
          </div>
        </div>

        <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.07)', marginBottom:20 }}/>

        {/* 본문 */}
        <div style={{ fontSize:15, lineHeight:1.9, color:'#d0d4e4', fontFamily:'Noto Sans KR', marginBottom:28, whiteSpace:'pre-wrap' }}>{livePost.content}</div>

        {/* 좋아요 */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <button onClick={() => { if(!user){navigate('login');return;} likeBoardPost(livePost.id); }} style={{ padding:'10px 28px', background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:999, color:'#ff4757', fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:600, transition:'background 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,71,87,0.1)'}
          >❤️ 좋아요 {livePost.likes}</button>
        </div>

        <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.07)', marginBottom:20 }}/>

        {/* 댓글 */}
        <div style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', marginBottom:14, fontFamily:'Noto Sans KR' }}>
          💬 댓글 <span style={{ color:'#4a9eff' }}>{(livePost.comments||[]).length}</span>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&submitComment()}
            placeholder={user?'댓글을 입력하세요... (Enter)':'로그인 후 작성 가능'} disabled={!user}
            style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e2e4ed', padding:'9px 12px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none' }}
            onFocus={e=>e.currentTarget.style.borderColor='#4a9eff'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
          />
          <button onClick={submitComment} style={{ padding:'9px 16px', background:'rgba(74,158,255,0.15)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, color:'#4a9eff', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:600 }}>등록</button>
        </div>

        {(livePost.comments||[]).length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px', fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>아직 댓글이 없어요. 첫 댓글을 남겨보세요!</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[...(livePost.comments||[])].reverse().map((c,i) => (
              <div key={c.id||i} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:700, color: TIER_COLOR[c.tier]||'#4a9eff' }}>{c.author}</span>
                  <span style={{ fontSize:11, color:'#5a5f78' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <div style={{ fontSize:13, color:'#c8cce0', lineHeight:1.7, fontFamily:'Noto Sans KR' }}>{c.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 글쓰기 폼 ────────────────────────────────────────────────────────
function WriteForm({ onClose }) {
  const { state, navigate, addBoardPost } = useApp();
  const { user } = state;
  const [form, setForm] = useState({ category:'자유', title:'', content:'' });
  const [err, setErr] = useState('');

  const submit = () => {
    if (!user) { navigate('login'); return; }
    if (!form.title.trim()) { setErr('제목을 입력하세요.'); return; }
    if (form.title.trim().length < 2) { setErr('제목은 2자 이상 입력하세요.'); return; }
    if (!form.content.trim()) { setErr('내용을 입력하세요.'); return; }
    addBoardPost({ ...form, title: form.title.trim(), content: form.content.trim(), author: user.nickname, tier: '골드' });
    onClose();
  };

  const iS = { width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e2e4ed', padding:'10px 14px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card p-6" style={{ width:'100%', maxWidth:580, animation:'fadeInUp 0.25s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span className="section-title">✏️ 글쓰기</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>

        {!user && <div style={{ padding:'10px 14px', background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.3)', borderRadius:8, fontSize:13, color:'#f5a623', marginBottom:16, fontFamily:'Noto Sans KR' }}>⚠️ 로그인 후 작성 가능합니다. <button onClick={()=>{onClose();navigate('login');}} style={{color:'#4a9eff',background:'none',border:'none',cursor:'pointer',fontFamily:'Noto Sans KR',fontSize:13}}>로그인 →</button></div>}

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:6 }}>카테고리</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['자유','공략','유머','질문'].map(cat => (
                <button key={cat} onClick={()=>setForm(f=>({...f,category:cat}))} style={{ padding:'5px 14px', borderRadius:6, border:`1px solid ${form.category===cat?(CAT_COLOR[cat]||'#4a9eff'):'rgba(255,255,255,0.1)'}`, background: form.category===cat?`${(CAT_COLOR[cat]||'#4a9eff')}22`:'transparent', color:form.category===cat?(CAT_COLOR[cat]||'#4a9eff'):'#8a8fa8', fontSize:12, cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:600, transition:'all 0.2s' }}>{cat}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:6 }}>제목</div>
            <input value={form.title} onChange={e=>{setForm(f=>({...f,title:e.target.value}));setErr('');}} placeholder="제목을 입력하세요" style={iS} onFocus={e=>e.currentTarget.style.borderColor='#4a9eff'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:6 }}>내용</div>
            <textarea value={form.content} onChange={e=>{setForm(f=>({...f,content:e.target.value}));setErr('');}} placeholder="내용을 입력하세요" rows={6} style={{ ...iS, resize:'vertical', lineHeight:1.7 }} onFocus={e=>e.currentTarget.style.borderColor='#4a9eff'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
          </div>
          {err && <div style={{ fontSize:12, color:'#ff4757', fontFamily:'Noto Sans KR' }}>⚠️ {err}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={submit} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR' }}>게시하기</button>
            <button onClick={onClose} style={{ padding:'12px 20px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR' }}>취소</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 게시판 메인 ──────────────────────────────────────────────────────
export default function BoardPage() {
  const { state, navigate, incView } = useApp();
  const { boardPosts } = state;
  const [activeCat, setActiveCat] = useState('전체');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showWrite, setShowWrite] = useState(false);

  const filtered = activeCat === '전체' ? boardPosts : boardPosts.filter(p => p.category === activeCat);

  const openPost = (post) => {
    incView(post.id);
    setSelectedPost(post);
  };

  if (selectedPost) {
    return (
      <div style={{ padding:'28px 0', animation:'fadeInUp 0.3s ease' }}>
        <BoardDetail post={selectedPost} onBack={()=>setSelectedPost(null)} />
        <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 16px', animation:'fadeInUp 0.3s ease' }}>
      {showWrite && <WriteForm onClose={()=>setShowWrite(false)} />}

      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
        >← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span className="section-title">게임 이야기 게시판</span>
        <button onClick={()=>setShowWrite(true)} style={{ marginLeft:'auto', padding:'7px 18px', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR' }}>✏️ 글쓰기</button>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {CATEGORIES.map(cat => {
          const color = CAT_COLOR[cat] || '#4a9eff';
          const active = activeCat === cat;
          return (
            <button key={cat} onClick={()=>setActiveCat(cat)} style={{ padding:'5px 16px', borderRadius:999, border:`1px solid ${active?color:'rgba(255,255,255,0.1)'}`, background: active?`${color}22`:'transparent', color: active?color:'#8a8fa8', fontSize:12, cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:600, transition:'all 0.2s' }}>{cat}</button>
          );
        })}
      </div>

      {/* 게시글 목록 */}
      <div className="card" style={{ overflow:'hidden' }}>
        {/* 목록 헤더 */}
        <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 80px 60px 60px 80px', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
          <span>분류</span><span>제목</span><span>작성자</span><span style={{textAlign:'center'}}>조회</span><span style={{textAlign:'center'}}>좋아요</span><span style={{textAlign:'right'}}>작성일</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', fontSize:14, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>게시글이 없습니다.</div>
        ) : (
          filtered.map((post, idx) => {
            const catColor = CAT_COLOR[post.category] || '#4a9eff';
            return (
              <div key={post.id} onClick={()=>openPost(post)} style={{
                display:'grid', gridTemplateColumns:'60px 1fr 80px 60px 60px 80px',
                padding:'13px 16px', borderBottom: idx<filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor:'pointer', transition:'background 0.15s', alignItems:'center',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:`${catColor}22`, color:catColor, border:`1px solid ${catColor}44`, fontWeight:700, display:'inline-block' }}>{post.category}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#e2e4ed', fontFamily:'Noto Sans KR', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {post.title}
                    {(post.comments||[]).length>0 && <span style={{ fontSize:11, color:'#4a9eff', marginLeft:6 }}>[{post.comments.length}]</span>}
                  </div>
                </div>
                <span style={{ fontSize:11, color: TIER_COLOR[post.tier]||'#8a8fa8', fontFamily:'Noto Sans KR', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.author}</span>
                <span style={{ fontSize:11, color:'#5a5f78', textAlign:'center' }}>{post.views}</span>
                <span style={{ fontSize:11, color:'#ff4757', textAlign:'center' }}>❤️ {post.likes}</span>
                <span style={{ fontSize:11, color:'#5a5f78', textAlign:'right' }}>{timeAgo(post.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>

      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
