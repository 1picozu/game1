import { useState, useEffect } from 'react';

const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE = 'https://api.rawg.io/api';

// ── 구매 사이트 (게임별 실제 판매처) ────────────────────────────
const STORE_LINKS = [
  { name:'Steam',       icon:'🟦', color:'#1b2838', textColor:'#c7d5e0', url:(n)=>`https://store.steampowered.com/search/?term=${encodeURIComponent(n)}` },
  { name:'Epic Games',  icon:'⬛', color:'#2d2d2d', textColor:'#fff',    url:(n)=>`https://store.epicgames.com/browse?q=${encodeURIComponent(n)}` },
  { name:'GOG',         icon:'🟣', color:'#6d318b', textColor:'#fff',    url:(n)=>`https://www.gog.com/games?search=${encodeURIComponent(n)}` },
  { name:'PlayStation', icon:'🔵', color:'#003087', textColor:'#fff',    url:(n)=>`https://store.playstation.com/ko-kr/search/${encodeURIComponent(n)}` },
  { name:'Xbox',        icon:'🟢', color:'#107c10', textColor:'#fff',    url:(n)=>`https://www.xbox.com/ko-KR/Search?q=${encodeURIComponent(n)}` },
  { name:'Nintendo',    icon:'🔴', color:'#e4000f', textColor:'#fff',    url:(n)=>`https://www.nintendo.com/search/#q=${encodeURIComponent(n)}` },
  { name:'블리자드',    icon:'💙', color:'#0080ff', textColor:'#fff',    url:(n)=>`https://us.battle.net/shop/en/catalog?q=${encodeURIComponent(n)}` },
];

// ── RAWG 상세 데이터 ─────────────────────────────────────────────
async function fetchGameDetail(id) {
  const [detail, screenshots, movies] = await Promise.allSettled([
    fetch(`${BASE}/games/${id}?key=${RAWG_KEY}`).then(r=>r.json()),
    fetch(`${BASE}/games/${id}/screenshots?key=${RAWG_KEY}&page_size=10`).then(r=>r.json()),
    fetch(`${BASE}/games/${id}/movies?key=${RAWG_KEY}`).then(r=>r.json()),
  ]);
  return {
    detail:      detail.status==='fulfilled'      ? detail.value      : null,
    screenshots: screenshots.status==='fulfilled' ? screenshots.value?.results||[] : [],
    movies:      movies.status==='fulfilled'      ? movies.value?.results||[]      : [],
  };
}

// ── AI: 게임 기본 정보 + 최근 소식 ──────────────────────────────
async function fetchAIGameInfo(gameName, genres, released) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `게임 "${gameName}" (장르: ${genres.join(', ')}, 출시: ${released||'미상'})에 대해 한국어로 답해줘. JSON만 반환:
{
  "summary": "3문장 게임 소개",
  "features": ["핵심 특징 1", "핵심 특징 2", "핵심 특징 3"],
  "verdict": "한줄 총평",
  "similar": ["비슷한 게임1", "비슷한 게임2", "비슷한 게임3"],
  "news": [
    {
      "title": "최근 업데이트/소식 제목",
      "date": "2024-xx-xx",
      "type": "업데이트|밸런스|콘텐츠|이벤트",
      "summary": "2문장 요약"
    }
  ]
}
news는 최근 패치, 업데이트, 밸런스 개선, 새 콘텐츠 등 3개 작성.`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return JSON.parse(text.replace(/```json|```/g,'').trim());
  } catch {
    return null;
  }
}

// ── AI: 특정 소식 상세 요약 ──────────────────────────────────────
async function fetchNewsDetail(gameName, newsTitle) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `게임 "${gameName}"의 "${newsTitle}"에 대해 한국어로 자세히 설명해줘. JSON만 반환:
{
  "detail": "3-4문장 상세 설명",
  "impact": "게임에 미치는 영향",
  "players": "플레이어가 알아야 할 점"
}`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return JSON.parse(text.replace(/```json|```/g,'').trim());
  } catch {
    return null;
  }
}

// ── 별점 ─────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div style={{ position:'relative', display:'inline-block', fontSize:16 }}>
      <span style={{ color:'rgba(255,255,255,0.15)' }}>★★★★★</span>
      <span style={{ position:'absolute', left:0, top:0, overflow:'hidden', width:`${(rating/5)*100}%`, color:'#f5a623', whiteSpace:'nowrap' }}>★★★★★</span>
    </div>
  );
}

// ── 메타크리틱 배지 ──────────────────────────────────────────────
function MetaBadge({ score }) {
  if (!score) return null;
  const color = score>=75?'#00d68f':score>=50?'#f5a623':'#ff4757';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', background:`${color}18`, border:`2px solid ${color}`, borderRadius:8, padding:'6px 12px', minWidth:54 }}>
      <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:24, color, lineHeight:1 }}>{score}</span>
      <span style={{ fontSize:8, color, opacity:0.8, fontWeight:700, letterSpacing:0.5 }}>METACRITIC</span>
    </div>
  );
}

// ── 뉴스 타입 배지 ───────────────────────────────────────────────
function NewsTypeBadge({ type }) {
  const map = {
    '업데이트': { color:'#4a9eff', icon:'🔄' },
    '밸런스':   { color:'#f5a623', icon:'⚖️' },
    '콘텐츠':   { color:'#00d68f', icon:'🎁' },
    '이벤트':   { color:'#7c5cfc', icon:'🎉' },
  };
  const info = map[type] || { color:'#8a8fa8', icon:'📢' };
  return (
    <span style={{ fontSize:10, padding:'2px 8px', background:`${info.color}18`, border:`1px solid ${info.color}44`, borderRadius:20, color:info.color, fontFamily:'Noto Sans KR', fontWeight:600 }}>
      {info.icon} {type}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════
//  메인 모달
// ══════════════════════════════════════════════════════════════════
export default function GameDetailModal({ game, onClose }) {
  const [tab,          setTab]          = useState('info');
  const [detail,       setDetail]       = useState(null);
  const [screenshots,  setScreenshots]  = useState([]);
  const [movies,       setMovies]       = useState([]);
  const [aiInfo,       setAiInfo]       = useState(null);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [activeImg,    setActiveImg]    = useState(game.img);
  const [loadingDetail,setLoadingDetail]= useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [newsDetail,   setNewsDetail]   = useState({});
  const [newsLoading,  setNewsLoading]  = useState({});

  // 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ESC 닫기
  useEffect(() => {
    const fn = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // RAWG 상세 로드
  useEffect(() => {
    fetchGameDetail(game.id).then(({ detail, screenshots, movies }) => {
      setDetail(detail);
      setScreenshots(screenshots);
      setMovies(movies);
      setLoadingDetail(false);
      if (screenshots.length > 0) setActiveImg(screenshots[0].image);
      if (movies.length > 0) setPlayingVideo(movies[0]);
    });
  }, [game.id]);

  // AI 정보 (탭 클릭 시)
  useEffect(() => {
    if ((tab === 'ai' || tab === 'news') && !aiInfo && !aiLoading) {
      setAiLoading(true);
      fetchAIGameInfo(game.name, game.genres, game.released).then(info => {
        setAiInfo(info);
        setAiLoading(false);
      });
    }
  }, [tab]);

  // 뉴스 상세 클릭
  const handleNewsClick = async (idx, title) => {
    if (newsDetail[idx]) {
      setNewsDetail(p => ({ ...p, [idx]: p[idx] === 'open' ? null : 'open' }));
      return;
    }
    setNewsLoading(p => ({ ...p, [idx]: true }));
    const d = await fetchNewsDetail(game.name, title);
    setNewsDetail(p => ({ ...p, [idx]: d }));
    setNewsLoading(p => ({ ...p, [idx]: false }));
  };

  const platformRaw = (game.platforms||[]).map(p => {
    if(/pc|windows/i.test(p))       return { label:'PC',          icon:'💻' };
    if(/playstation5/i.test(p))     return { label:'PS5',         icon:'🎮' };
    if(/playstation4/i.test(p))     return { label:'PS4',         icon:'🎮' };
    if(/playstation/i.test(p))      return { label:'PlayStation', icon:'🎮' };
    if(/xbox series/i.test(p))      return { label:'Xbox Series', icon:'🟢' };
    if(/xbox/i.test(p))             return { label:'Xbox',        icon:'🟢' };
    if(/nintendo|switch/i.test(p))  return { label:'Switch',      icon:'🔴' };
    if(/mac/i.test(p))              return { label:'Mac',         icon:'🍎' };
    if(/android|ios/i.test(p))      return { label:'모바일',       icon:'📱' };
    return { label:p.slice(0,10), icon:'🕹️' };
  });
  const seenP = new Set();
  const platforms = platformRaw.filter(p => {
    if (seenP.has(p.label)) return false;
    seenP.add(p.label);
    return true;
  });

  const TABS = [
    { id:'info',  label:'게임 정보', icon:'📋' },
    { id:'media', label:'미디어',    icon:'🎬' },
    { id:'news',  label:'최근 소식', icon:'📰' },
    { id:'ai',    label:'AI 분석',   icon:'🤖' },
    { id:'buy',   label:'구매하기',  icon:'🛒' },
  ];

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:12, backdropFilter:'blur(8px)' }}>
      <div style={{ background:'#111320', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:'100%', maxWidth:1000, maxHeight:'94vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 40px 100px rgba(0,0,0,0.8)' }}>

        {/* ── 히어로 ── */}
        <div style={{ position:'relative', height:240, flexShrink:0, overflow:'hidden' }}>
          <img src={activeImg} alt={game.name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={e=>e.currentTarget.src=`https://picsum.photos/seed/${game.id}/900/300`}
          />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(17,19,32,0.97) 100%)' }}/>

          {/* 닫기 */}
          <button onClick={onClose} style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>✕</button>

          {/* 트레일러 버튼 */}
          {movies.length > 0 && (
            <button onClick={()=>setTab('media')}
              style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.5)', color:'#fff', fontSize:20, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}
              title="트레일러 보기">▶</button>
          )}

          {/* 게임 정보 오버레이 */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 20px', display:'flex', alignItems:'flex-end', gap:14, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:24, fontWeight:700, color:'#fff', fontFamily:'Noto Sans KR', lineHeight:1.2, textShadow:'0 2px 8px rgba(0,0,0,0.9)' }}>{game.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
                {game.released && <span style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontFamily:'Noto Sans KR' }}>📅 {game.released}</span>}
                {game.rating && (
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Stars rating={game.rating}/>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>{game.rating}/5</span>
                  </span>
                )}
                {game.genres.slice(0,3).map(g=>(
                  <span key={g} style={{ fontSize:11, padding:'2px 8px', background:'rgba(255,255,255,0.15)', borderRadius:20, color:'#fff', backdropFilter:'blur(4px)', fontFamily:'Noto Sans KR' }}>{g}</span>
                ))}
              </div>
            </div>
            <MetaBadge score={game.metacritic}/>
          </div>
        </div>

        {/* 썸네일 */}
        {screenshots.length > 0 && (
          <div style={{ display:'flex', gap:5, padding:'6px 20px', background:'#0d0f1a', overflowX:'auto', scrollbarWidth:'none', flexShrink:0 }}>
            {[{image:game.img}, ...screenshots].slice(0,9).map((s,i)=>(
              <img key={i} src={s.image} alt="" onClick={()=>setActiveImg(s.image)}
                style={{ width:72, height:44, objectFit:'cover', borderRadius:5, cursor:'pointer', flexShrink:0, border:`2px solid ${activeImg===s.image?'#7c5cfc':'transparent'}`, opacity:activeImg===s.image?1:0.55, transition:'all 0.2s' }}
              />
            ))}
          </div>
        )}

        {/* 탭 */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0, background:'#111320', overflowX:'auto', scrollbarWidth:'none' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'11px 18px', background:'transparent', border:'none', borderBottom:`2px solid ${tab===t.id?'#7c5cfc':'transparent'}`, color:tab===t.id?'#c8b4ff':'#5a5f78', fontSize:13, fontWeight:tab===t.id?700:400, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s', marginBottom:-1, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>

          {/* ── 게임 정보 ── */}
          {tab==='info' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {loadingDetail ? (
                <div style={{ textAlign:'center', padding:40, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>정보 불러오는 중...</div>
              ) : (
                <>
                  {detail?.description_raw && (
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:8, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>게임 소개</div>
                      <div style={{ fontSize:13, color:'#c8cce0', lineHeight:1.85, fontFamily:'Noto Sans KR' }}>
                        {detail.description_raw.slice(0,700)}{detail.description_raw.length>700?'...':''}
                      </div>
                    </div>
                  )}

                  {/* 기본 정보 그리드 */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
                    {[
                      { label:'출시일',      value:game.released||'-',                    icon:'📅' },
                      { label:'평점',        value:game.rating?`${game.rating}/5`:'-',    icon:'⭐' },
                      { label:'메타크리틱',  value:game.metacritic||'-',                  icon:'🏆' },
                      { label:'평균 플레이', value:detail?.playtime?`${detail.playtime}h`:'-', icon:'⏱️' },
                      { label:'리뷰 수',     value:detail?.reviews_count?.toLocaleString()||'-', icon:'💬' },
                      { label:'개발사',      value:detail?.developers?.[0]?.name||'-',    icon:'🏢' },
                      { label:'배급사',      value:detail?.publishers?.[0]?.name||'-',    icon:'📦' },
                    ].map(s=>(
                      <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ fontSize:16, marginBottom:4 }}>{s.icon}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', fontFamily:'Rajdhani' }}>{s.value}</div>
                        <div style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR', marginTop:2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 플랫폼 */}
                  {platforms.length > 0 && (
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:8, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>지원 플랫폼</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {platforms.map(p=>(
                          <span key={p.label} style={{ padding:'6px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, color:'#c8cce0', fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', gap:5 }}>
                            {p.icon} {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 장르 & 태그 */}
                  {detail?.tags?.length > 0 && (
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:8, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>태그</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {detail.tags.slice(0,18).map(t=>(
                          <span key={t.id} style={{ fontSize:11, padding:'3px 10px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:20, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>{t.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail?.website && (
                    <a href={detail.website} target="_blank" rel="noopener noreferrer"
                      style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', background:'rgba(74,158,255,0.1)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, color:'#4a9eff', fontSize:13, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:600, width:'fit-content' }}>
                      🌐 공식 웹사이트
                    </a>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 미디어 ── */}
          {tab==='media' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* 트레일러 */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:12, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>🎬 트레일러 / 영상</div>
                {movies.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {movies.slice(0,3).map(m=>(
                      <div key={m.id}>
                        <div style={{ fontSize:13, color:'#c8cce0', fontFamily:'Noto Sans KR', marginBottom:8, fontWeight:600 }}>{m.name}</div>
                        <video controls poster={m.preview} style={{ width:'100%', borderRadius:10, background:'#000', maxHeight:340 }}>
                          <source src={m.data?.max||m.data?.['480']} type="video/mp4"/>
                        </video>
                      </div>
                    ))}
                  </div>
                ) : (
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(game.name+' official trailer')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', background:'rgba(255,0,0,0.08)', border:'1px solid rgba(255,0,0,0.2)', borderRadius:10, color:'#ff4444', textDecoration:'none', fontFamily:'Noto Sans KR', fontSize:14, fontWeight:600 }}>
                    ▶ YouTube에서 "{game.name}" 트레일러 보기
                  </a>
                )}
              </div>

              {/* 스크린샷 */}
              {screenshots.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:12, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>📸 스크린샷</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
                    {screenshots.map((s,i)=>(
                      <img key={i} src={s.image} alt="" onClick={()=>setActiveImg(s.image)}
                        style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', borderRadius:8, cursor:'pointer', border:'1px solid rgba(255,255,255,0.06)', transition:'transform 0.2s, opacity 0.2s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.opacity='0.8'; }}
                        onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.opacity='1'; }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 최근 소식 ── */}
          {tab==='news' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ padding:'10px 14px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:8, fontSize:12, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>
                🤖 AI가 "{game.name}"의 최근 소식을 수집합니다. 소식 클릭 시 상세 요약을 볼 수 있어요.
              </div>

              {aiLoading && (
                <div style={{ textAlign:'center', padding:40 }}>
                  <div style={{ fontSize:28, animation:'spin 1s linear infinite', display:'inline-block', marginBottom:12 }}>⚙️</div>
                  <div style={{ fontSize:14, color:'#7c5cfc', fontFamily:'Noto Sans KR' }}>최근 소식 수집 중...</div>
                </div>
              )}

              {!aiLoading && aiInfo?.news && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {aiInfo.news.map((n,i)=>(
                    <div key={i}>
                      <div onClick={()=>handleNewsClick(i, n.title)}
                        style={{ padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, cursor:'pointer', transition:'all 0.2s' }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(124,92,252,0.3)'}
                        onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}
                      >
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, flexWrap:'wrap', gap:6 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <NewsTypeBadge type={n.type}/>
                            <span style={{ fontSize:13, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR' }}>{n.title}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>📅 {n.date}</span>
                            <span style={{ fontSize:12, color:'#7c5cfc' }}>{newsDetail[i]?'▲':'▼ 상세보기'}</span>
                          </div>
                        </div>
                        <div style={{ fontSize:12, color:'#8a8fa8', fontFamily:'Noto Sans KR', lineHeight:1.6 }}>{n.summary}</div>
                      </div>

                      {/* 상세 펼치기 */}
                      {newsLoading[i] && (
                        <div style={{ padding:'12px 16px', background:'rgba(124,92,252,0.05)', borderRadius:'0 0 10px 10px', fontSize:12, color:'#7c5cfc', fontFamily:'Noto Sans KR', textAlign:'center' }}>
                          AI 상세 분석 중...
                        </div>
                      )}
                      {newsDetail[i] && !newsLoading[i] && (
                        <div style={{ padding:'14px 16px', background:'rgba(124,92,252,0.06)', border:'1px solid rgba(124,92,252,0.15)', borderTop:'none', borderRadius:'0 0 10px 10px', display:'flex', flexDirection:'column', gap:10 }}>
                          {[
                            { label:'📝 상세 내용', value:newsDetail[i].detail },
                            { label:'🎮 게임 영향', value:newsDetail[i].impact },
                            { label:'💡 플레이어 참고', value:newsDetail[i].players },
                          ].map(s=>s.value&&(
                            <div key={s.label}>
                              <div style={{ fontSize:11, fontWeight:700, color:'#7c5cfc', marginBottom:4, fontFamily:'Noto Sans KR' }}>{s.label}</div>
                              <div style={{ fontSize:13, color:'#c8cce0', lineHeight:1.7, fontFamily:'Noto Sans KR' }}>{s.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!aiLoading && !aiInfo && (
                <div style={{ textAlign:'center', padding:40, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>소식을 불러오지 못했습니다.</div>
              )}
            </div>
          )}

          {/* ── AI 분석 ── */}
          {tab==='ai' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ padding:'10px 14px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:8, fontSize:12, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>
                🤖 AI가 "{game.name}" 정보를 분석합니다.
              </div>

              {aiLoading && (
                <div style={{ textAlign:'center', padding:40 }}>
                  <div style={{ fontSize:28, animation:'spin 1s linear infinite', display:'inline-block', marginBottom:12 }}>⚙️</div>
                  <div style={{ fontSize:14, color:'#7c5cfc', fontFamily:'Noto Sans KR' }}>AI 분석 중...</div>
                </div>
              )}

              {!aiLoading && aiInfo && (
                <>
                  <div style={{ padding:'14px 18px', background:'linear-gradient(135deg,rgba(124,92,252,0.12),rgba(74,158,255,0.08))', border:'1px solid rgba(124,92,252,0.25)', borderRadius:12 }}>
                    <div style={{ fontSize:11, color:'#7c5cfc', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700 }}>AI 총평</div>
                    <div style={{ fontSize:14, color:'#e2e4ed', fontFamily:'Noto Sans KR', fontWeight:600, lineHeight:1.6 }}>"{aiInfo.verdict}"</div>
                  </div>

                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:8, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>게임 소개</div>
                    <div style={{ fontSize:13, color:'#c8cce0', lineHeight:1.85, fontFamily:'Noto Sans KR' }}>{aiInfo.summary}</div>
                  </div>

                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>핵심 특징</div>
                    {(aiInfo.features||[]).map((f,i)=>(
                      <div key={i} style={{ display:'flex', gap:10, padding:'10px 14px', background:'rgba(74,158,255,0.06)', border:'1px solid rgba(74,158,255,0.15)', borderRadius:8, marginBottom:8 }}>
                        <span style={{ color:'#4a9eff', fontWeight:700, fontFamily:'Rajdhani', minWidth:20 }}>{i+1}.</span>
                        <span style={{ fontSize:13, color:'#c8cce0', fontFamily:'Noto Sans KR', lineHeight:1.6 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>비슷한 게임</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {(aiInfo.similar||[]).map((s,i)=>(
                        <span key={i} style={{ padding:'7px 16px', background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.25)', borderRadius:20, fontSize:13, color:'#9b7ffe', fontFamily:'Noto Sans KR', fontWeight:600 }}>🎮 {s}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── 구매하기 ── */}
          {tab==='buy' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR', lineHeight:1.7 }}>
                <strong style={{ color:'#e2e4ed' }}>{game.name}</strong>을 구매할 수 있는 스토어 목록이에요. 각 스토어에서 실제 가격을 확인하세요.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
                {STORE_LINKS.map(store=>(
                  <a key={store.name} href={store.url(game.name)} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:`${store.color}22`, border:`1px solid ${store.color}44`, borderRadius:12, textDecoration:'none', color:'#e2e4ed', fontFamily:'Noto Sans KR', fontWeight:600, fontSize:14, transition:'all 0.2s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.background=`${store.color}44`; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=`${store.color}22`; e.currentTarget.style.transform='translateY(0)'; }}
                  >
                    <span style={{ fontSize:22 }}>{store.icon}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{store.name}</div>
                      <div style={{ fontSize:11, color:'#8a8fa8', marginTop:2 }}>검색하기 →</div>
                    </div>
                  </a>
                ))}
              </div>
              <div style={{ padding:'12px 16px', background:'rgba(245,166,35,0.07)', border:'1px solid rgba(245,166,35,0.2)', borderRadius:10, fontSize:12, color:'#8a8fa8', fontFamily:'Noto Sans KR', lineHeight:1.7 }}>
                💡 <strong style={{ color:'#f5a623' }}>가격 비교 팁:</strong> IsThereAnyDeal에서 여러 스토어 가격을 한번에 비교할 수 있어요.
                <a href={`https://isthereanydeal.com/search/?q=${encodeURIComponent(game.name)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', marginTop:6, color:'#4a9eff', textDecoration:'none', fontWeight:600 }}>
                  → IsThereAnyDeal에서 가격 비교하기
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.9) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
