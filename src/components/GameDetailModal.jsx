import { useState, useEffect } from 'react';

const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE = 'https://api.rawg.io/api';

const STORE_LINKS = [
  { name:'Steam',       icon:'🟦', color:'#1b2838', textColor:'#c7d5e0', url:(n)=>`https://store.steampowered.com/search/?term=${encodeURIComponent(n)}`, priceUrl:(n)=>`https://store.steampowered.com/search/?term=${encodeURIComponent(n)}` },
  { name:'Epic Games',  icon:'⬛', color:'#2d2d2d', textColor:'#fff',    url:(n)=>`https://store.epicgames.com/browse?q=${encodeURIComponent(n)}` },
  { name:'GOG',         icon:'🟣', color:'#6d318b', textColor:'#fff',    url:(n)=>`https://www.gog.com/games?search=${encodeURIComponent(n)}` },
  { name:'PlayStation', icon:'🔵', color:'#003087', textColor:'#fff',    url:(n)=>`https://store.playstation.com/ko-kr/search/${encodeURIComponent(n)}` },
  { name:'Xbox',        icon:'🟢', color:'#107c10', textColor:'#fff',    url:(n)=>`https://www.xbox.com/ko-KR/Search?q=${encodeURIComponent(n)}` },
  { name:'Nintendo',    icon:'🔴', color:'#e4000f', textColor:'#fff',    url:(n)=>`https://www.nintendo.com/search/#q=${encodeURIComponent(n)}` },
  { name:'블리자드',    icon:'💙', color:'#0080ff', textColor:'#fff',    url:(n)=>`https://us.battle.net/shop/en/catalog?q=${encodeURIComponent(n)}` },
];

// RAWG 스토어 ID → 이름 매핑
const RAWG_STORE_MAP = {
  1: 'Steam', 2: 'Xbox Store', 3: 'PlayStation Store',
  4: 'App Store', 5: 'GOG', 6: 'Nintendo Store',
  7: 'Xbox 360', 8: 'Google Play', 11: 'Epic Games',
};


// ── 실시간 가격 (CheapShark API) ────────────────────────────────
async function fetchGamePrices(gameName) {
  try {
    // CheapShark: 게임 이름으로 검색 후 가격 조회
    const searchRes = await fetch(
      `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(gameName)}&limit=5`
    );
    const games = await searchRes.json();
    if (!games || games.length === 0) return null;

    // 가장 유사한 게임 선택
    const target = games.find(g =>
      g.external?.toLowerCase().includes(gameName.toLowerCase().slice(0,8))
    ) || games[0];

    // 해당 게임의 모든 스토어 딜 조회
    const dealsRes = await fetch(
      `https://www.cheapshark.com/api/1.0/games?id=${target.gameID}`
    );
    const dealData = await dealsRes.json();

    // 스토어 ID 매핑 (CheapShark)
    const storeMap = {
      '1':  { name:'Steam',        icon:'🟦', color:'#1b2838' },
      '2':  { name:'GamersGate',   icon:'🟤', color:'#333' },
      '3':  { name:'GreenManGaming',icon:'🟢', color:'#00a651' },
      '7':  { name:'GOG',          icon:'🟣', color:'#6d318b' },
      '8':  { name:'Origin',       icon:'🟠', color:'#f56c2d' },
      '11': { name:'Humble Store', icon:'🔵', color:'#cc2929' },
      '13': { name:'Uplay',        icon:'🔷', color:'#0070d1' },
      '15': { name:'Fanatical',    icon:'🔴', color:'#e31837' },
      '21': { name:'WinGameStore', icon:'⬛', color:'#333' },
      '23': { name:'GameBillet',   icon:'🎫', color:'#1e6ba8' },
      '25': { name:'Voidu',        icon:'🎮', color:'#7b2fbe' },
      '27': { name:'Epic Games',   icon:'⬛', color:'#2d2d2d' },
      '28': { name:'Games Planet', icon:'🌍', color:'#004691' },
      '29': { name:'Game Deals',   icon:'💰', color:'#f5a623' },
      '35': { name:'IndieGala',    icon:'🎪', color:'#e62429' },
      '37': { name:'Fanatical',    icon:'🔴', color:'#e31837' },
    };

    const deals = (dealData.deals || [])
      .map(d => ({
        storeID:      d.storeID,
        storeName:    storeMap[d.storeID]?.name || `Store ${d.storeID}`,
        storeIcon:    storeMap[d.storeID]?.icon || '🛒',
        storeColor:   storeMap[d.storeID]?.color || '#333',
        normalPrice:  parseFloat(d.retailPrice),
        salePrice:    parseFloat(d.price),
        savings:      parseFloat(d.savings),
        dealID:       d.dealID,
        dealUrl:      `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
      }))
      .filter(d => d.salePrice > 0)
      .sort((a, b) => a.salePrice - b.salePrice);

    return { gameName: target.external, deals, cheapestPrice: target.cheapestPrice, cheapestDealID: target.cheapestDealID };
  } catch (e) {
    console.warn('[CheapShark]', e.message);
    return null;
  }
}

async function fetchGameDetail(id) {
  const [detail, screenshots, movies] = await Promise.allSettled([
    fetch(`${BASE}/games/${id}?key=${RAWG_KEY}`).then(r=>r.json()),
    fetch(`${BASE}/games/${id}/screenshots?key=${RAWG_KEY}&page_size=12`).then(r=>r.json()),
    fetch(`${BASE}/games/${id}/movies?key=${RAWG_KEY}`).then(r=>r.json()),
  ]);
  return {
    detail:      detail.status==='fulfilled'      ? detail.value      : null,
    screenshots: screenshots.status==='fulfilled' ? screenshots.value?.results||[] : [],
    movies:      movies.status==='fulfilled'      ? movies.value?.results||[]      : [],
  };
}

// AI: 최근 소식만
async function fetchAINews(gameName, genres, released) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `게임 "${gameName}" (장르: ${genres.join(', ')}, 출시: ${released||'미상'})의 최근 패치, 업데이트, 밸런스 개선, 새 콘텐츠 소식 3개를 한국어로 알려줘. JSON만 반환:
[
  { "title": "소식 제목", "date": "2024-xx-xx", "type": "업데이트|밸런스|콘텐츠|이벤트", "summary": "2문장 요약" }
]`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return JSON.parse(text.replace(/```json|```/g,'').trim());
  } catch { return null; }
}

// AI: 소식 상세
async function fetchNewsDetail(gameName, newsTitle) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `게임 "${gameName}"의 "${newsTitle}"에 대해 한국어로 자세히 설명해줘. JSON만 반환:
{"detail":"3-4문장 상세 설명","impact":"게임 영향","players":"플레이어 참고사항"}`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return JSON.parse(text.replace(/```json|```/g,'').trim());
  } catch { return null; }
}

// AI: 게임 한글 소개
async function fetchAISummary(gameName, genres, descRaw) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `게임 "${gameName}" (장르: ${genres.join(', ')})을 한국어로 3-4문장으로 소개해줘. 영어 원문: "${(descRaw||'').slice(0,300)}". 자연스러운 한국어로만 답해줘. JSON 없이 텍스트만.`
        }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || null;
  } catch { return null; }
}

function Stars({ rating }) {
  return (
    <div style={{ position:'relative', display:'inline-block', fontSize:15 }}>
      <span style={{ color:'rgba(255,255,255,0.15)' }}>★★★★★</span>
      <span style={{ position:'absolute', left:0, top:0, overflow:'hidden', width:`${(rating/5)*100}%`, color:'#f5a623', whiteSpace:'nowrap' }}>★★★★★</span>
    </div>
  );
}

function MetaBadge({ score }) {
  if (!score) return null;
  const color = score>=75?'#00d68f':score>=50?'#f5a623':'#ff4757';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', background:`${color}18`, border:`2px solid ${color}`, borderRadius:8, padding:'6px 12px', minWidth:52, flexShrink:0 }}>
      <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:22, color, lineHeight:1 }}>{score}</span>
      <span style={{ fontSize:8, color, opacity:0.8, fontWeight:700 }}>META</span>
    </div>
  );
}

function NewsTypeBadge({ type }) {
  const map = { '업데이트':{ color:'#4a9eff', icon:'🔄' }, '밸런스':{ color:'#f5a623', icon:'⚖️' }, '콘텐츠':{ color:'#00d68f', icon:'🎁' }, '이벤트':{ color:'#7c5cfc', icon:'🎉' } };
  const info = map[type] || { color:'#8a8fa8', icon:'📢' };
  return <span style={{ fontSize:10, padding:'2px 8px', background:`${info.color}18`, border:`1px solid ${info.color}44`, borderRadius:20, color:info.color, fontFamily:'Noto Sans KR', fontWeight:600 }}>{info.icon} {type}</span>;
}

export default function GameDetailModal({ game, onClose }) {
  const [tab,           setTab]          = useState('info');
  const [detail,        setDetail]       = useState(null);
  const [screenshots,   setScreenshots]  = useState([]);
  const [movies,        setMovies]       = useState([]);
  const [activeImg,     setActiveImg]    = useState(game.img);
  const [loadingDetail, setLoadingDetail]= useState(true);
  const [news,          setNews]         = useState(null);
  const [newsLoading,   setNewsLoading]  = useState(false);
  const [newsDetail,    setNewsDetail]   = useState({});
  const [newsDetailLoading, setNDL]      = useState({});
  const [priceData,     setPriceData]    = useState(null);
  const [priceLoading,  setPriceLoading] = useState(false);
  const [summary,       setSummary]      = useState(null);
  const [summaryLoading,setSummaryLoading]= useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const fn = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    fetchGameDetail(game.id).then(({ detail, screenshots, movies }) => {
      setDetail(detail);
      setScreenshots(screenshots);
      setMovies(movies);
      setLoadingDetail(false);
      if (screenshots.length > 0) setActiveImg(screenshots[0].image);
    });
  }, [game.id]);

  // 게임 정보 탭 — AI 한글 소개 자동 로드
  useEffect(() => {
    if (tab === 'info' && !summary && !summaryLoading && (detail || game.genres.length > 0)) {
      setSummaryLoading(true);
      fetchAISummary(game.name, game.genres, detail?.description_raw).then(s => {
        setSummary(s);
        setSummaryLoading(false);
      });
    }
  }, [tab, detail]);

  // 구매 탭 — 실시간 가격 로드
  useEffect(() => {
    if (tab === 'buy' && !priceData && !priceLoading) {
      setPriceLoading(true);
      fetchGamePrices(game.name).then(data => {
        setPriceData(data);
        setPriceLoading(false);
      });
    }
  }, [tab]);

  // 최근 소식 탭
  useEffect(() => {
    if (tab === 'news' && !news && !newsLoading) {
      setNewsLoading(true);
      fetchAINews(game.name, game.genres, game.released).then(n => {
        setNews(n);
        setNewsLoading(false);
      });
    }
  }, [tab]);

  const handleNewsClick = async (idx, title) => {
    if (newsDetail[idx] !== undefined) {
      setNewsDetail(p => ({ ...p, [idx]: p[idx] ? null : 'loading' }));
      return;
    }
    setNDL(p => ({ ...p, [idx]: true }));
    const d = await fetchNewsDetail(game.name, title);
    setNewsDetail(p => ({ ...p, [idx]: d }));
    setNDL(p => ({ ...p, [idx]: false }));
  };

  const platformRaw = (game.platforms||[]).map(p => {
    if(/pc|windows/i.test(p))      return { label:'PC',          icon:'💻' };
    if(/playstation5/i.test(p))    return { label:'PS5',         icon:'🎮' };
    if(/playstation4/i.test(p))    return { label:'PS4',         icon:'🎮' };
    if(/playstation/i.test(p))     return { label:'PlayStation', icon:'🎮' };
    if(/xbox series/i.test(p))     return { label:'Xbox Series', icon:'🟢' };
    if(/xbox/i.test(p))            return { label:'Xbox',        icon:'🟢' };
    if(/nintendo|switch/i.test(p)) return { label:'Switch',      icon:'🔴' };
    if(/mac/i.test(p))             return { label:'Mac',         icon:'🍎' };
    if(/android|ios/i.test(p))     return { label:'모바일',      icon:'📱' };
    return { label:p.slice(0,10), icon:'🕹️' };
  });
  const seenP = new Set();
  const platforms = platformRaw.filter(p => { if(seenP.has(p.label)) return false; seenP.add(p.label); return true; });

  // RAWG 스토어 정보 (가격 링크용)
  const rawgStores = detail?.stores || [];

  const TABS = [
    { id:'info',  label:'게임 정보', icon:'📋' },
    { id:'news',  label:'최근 소식', icon:'📰' },
    { id:'buy',   label:'구매하기',  icon:'🛒' },
  ];

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:12, backdropFilter:'blur(10px)' }}>
      <div style={{ background:'#111320', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:'100%', maxWidth:1100, maxHeight:'96vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 40px 100px rgba(0,0,0,0.8)' }}>

        {/* ── 히어로 이미지 (크게) ── */}
        <div style={{ position:'relative', height:320, flexShrink:0, overflow:'hidden' }}>
          <img src={activeImg} alt={game.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'opacity 0.3s' }}
            onError={e=>e.currentTarget.src=`https://picsum.photos/seed/${game.id}/1100/320`}
          />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(17,19,32,0.98) 100%)' }}/>

          {/* 닫기 */}
          <button onClick={onClose} style={{ position:'absolute', top:14, right:14, width:38, height:38, borderRadius:'50%', background:'rgba(0,0,0,0.65)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>✕</button>

          {/* 트레일러 재생 버튼 */}
          {movies.length > 0 && (
            <a href={movies[0].data?.max||movies[0].data?.['480']} target="_blank" rel="noopener noreferrer"
              style={{ position:'absolute', top:'42%', left:'50%', transform:'translate(-50%,-50%)', width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.55)', color:'#fff', fontSize:24, backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.3)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
              title="트레일러 재생">▶</a>
          )}

          {/* 게임 정보 오버레이 */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 24px', display:'flex', alignItems:'flex-end', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:28, fontWeight:700, color:'#fff', fontFamily:'Noto Sans KR', lineHeight:1.2, textShadow:'0 2px 12px rgba(0,0,0,0.9)' }}>{game.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8, flexWrap:'wrap' }}>
                {game.released && <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontFamily:'Noto Sans KR' }}>📅 {game.released}</span>}
                {game.rating && (
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Stars rating={game.rating}/>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>{game.rating}/5</span>
                  </span>
                )}
                {game.genres.slice(0,3).map(g=>(
                  <span key={g} style={{ fontSize:12, padding:'3px 10px', background:'rgba(255,255,255,0.18)', borderRadius:20, color:'#fff', backdropFilter:'blur(4px)', fontFamily:'Noto Sans KR' }}>{g}</span>
                ))}
              </div>
            </div>
            <MetaBadge score={game.metacritic}/>
          </div>
        </div>

        {/* ── 트레일러 영상 (바로 표시) ── */}
        {movies.length > 0 && (
          <div style={{ padding:'0 24px', marginTop:4, flexShrink:0 }}>
            <video controls poster={movies[0].preview}
              style={{ width:'100%', borderRadius:12, background:'#000', maxHeight:280 }}
              key={movies[0].id}>
              <source src={movies[0].data?.max||movies[0].data?.['480']} type="video/mp4"/>
            </video>
          </div>
        )}

        {/* ── 스크린샷 썸네일 ── */}
        {screenshots.length > 0 && (
          <div style={{ display:'flex', gap:6, padding:'8px 24px', overflowX:'auto', scrollbarWidth:'none', flexShrink:0 }}>
            {[{image:game.img}, ...screenshots].slice(0,12).map((s,i)=>(
              <img key={i} src={s.image} alt="" onClick={()=>setActiveImg(s.image)}
                style={{ width:90, height:56, objectFit:'cover', borderRadius:6, cursor:'pointer', flexShrink:0, border:`2px solid ${activeImg===s.image?'#7c5cfc':'transparent'}`, opacity:activeImg===s.image?1:0.5, transition:'all 0.2s' }}
              />
            ))}
          </div>
        )}

        {/* ── 탭 ── */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0, background:'#111320' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'12px 22px', background:'transparent', border:'none', borderBottom:`2px solid ${tab===t.id?'#7c5cfc':'transparent'}`, color:tab===t.id?'#c8b4ff':'#5a5f78', fontSize:14, fontWeight:tab===t.id?700:400, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s', marginBottom:-1, display:'flex', alignItems:'center', gap:6 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── 탭 콘텐츠 ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* ── 게임 정보 ── */}
          {tab==='info' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* 한글 게임 소개 */}
              <div style={{ padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>게임 소개</div>
                {summaryLoading ? (
                  <div style={{ fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>🤖 AI가 한국어로 번역 중...</div>
                ) : summary ? (
                  <div style={{ fontSize:14, color:'#d0d4e8', lineHeight:1.9, fontFamily:'Noto Sans KR' }}>{summary}</div>
                ) : (
                  <div style={{ fontSize:14, color:'#d0d4e8', lineHeight:1.9, fontFamily:'Noto Sans KR' }}>
                    {detail?.description_raw?.slice(0,500) || '게임 소개를 불러오는 중...'}
                  </div>
                )}
              </div>

              {/* 기본 정보 */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
                {[
                  { label:'출시일',      value:game.released||'-',                              icon:'📅' },
                  { label:'평점',        value:game.rating?`${game.rating} / 5`:'-',            icon:'⭐' },
                  { label:'메타크리틱',  value:game.metacritic?`${game.metacritic}/100`:'-',    icon:'🏆' },
                  { label:'평균 플레이', value:detail?.playtime?`${detail.playtime}시간`:'-',   icon:'⏱️' },
                  { label:'리뷰 수',     value:detail?.reviews_count?.toLocaleString()||'-',    icon:'💬' },
                  { label:'개발사',      value:detail?.developers?.[0]?.name||'-',              icon:'🏢' },
                  { label:'배급사',      value:detail?.publishers?.[0]?.name||'-',              icon:'📦' },
                ].map(s=>(
                  <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:18, marginBottom:5 }}>{s.icon}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', fontFamily:'Rajdhani', lineHeight:1.2 }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR', marginTop:3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* 지원 플랫폼 */}
              {platforms.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>지원 플랫폼</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {platforms.map(p=>(
                      <span key={p.label} style={{ padding:'7px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:13, color:'#c8cce0', fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', gap:6 }}>
                        {p.icon} {p.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 태그 */}
              {detail?.tags?.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>태그</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {detail.tags.slice(0,20).map(t=>(
                      <span key={t.id} style={{ fontSize:11, padding:'3px 10px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:20, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>{t.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 공식 웹사이트 */}
              {detail?.website && (
                <a href={detail.website} target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', background:'rgba(74,158,255,0.1)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, color:'#4a9eff', fontSize:13, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:600, width:'fit-content' }}>
                  🌐 공식 웹사이트 방문
                </a>
              )}
            </div>
          )}

          {/* ── 최근 소식 ── */}
          {tab==='news' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ padding:'10px 14px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:8, fontSize:12, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>
                🤖 AI가 "{game.name}"의 최근 소식을 수집합니다. 각 소식을 클릭하면 상세 요약을 볼 수 있어요.
              </div>

              {newsLoading && (
                <div style={{ textAlign:'center', padding:50 }}>
                  <div style={{ fontSize:30, animation:'spin 1s linear infinite', display:'inline-block', marginBottom:14 }}>⚙️</div>
                  <div style={{ fontSize:14, color:'#7c5cfc', fontFamily:'Noto Sans KR' }}>최근 소식 수집 중...</div>
                </div>
              )}

              {!newsLoading && news && news.map((n,i)=>(
                <div key={i}>
                  <div onClick={()=>handleNewsClick(i, n.title)}
                    style={{ padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, cursor:'pointer', transition:'border-color 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(124,92,252,0.35)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexWrap:'wrap', gap:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <NewsTypeBadge type={n.type}/>
                        <span style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR' }}>{n.title}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>📅 {n.date}</span>
                        <span style={{ fontSize:12, color:'#7c5cfc', fontFamily:'Noto Sans KR' }}>{newsDetail[i]?'▲ 접기':'▼ 상세보기'}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR', lineHeight:1.7 }}>{n.summary}</div>
                  </div>

                  {newsDetailLoading[i] && (
                    <div style={{ padding:'12px 18px', background:'rgba(124,92,252,0.05)', borderRadius:'0 0 12px 12px', fontSize:13, color:'#7c5cfc', fontFamily:'Noto Sans KR', textAlign:'center' }}>AI 상세 분석 중...</div>
                  )}
                  {newsDetail[i] && !newsDetailLoading[i] && (
                    <div style={{ padding:'16px 18px', background:'rgba(124,92,252,0.06)', border:'1px solid rgba(124,92,252,0.15)', borderTop:'none', borderRadius:'0 0 12px 12px', display:'flex', flexDirection:'column', gap:12 }}>
                      {[
                        { label:'📝 상세 내용', value:newsDetail[i].detail },
                        { label:'🎮 게임 영향', value:newsDetail[i].impact },
                        { label:'💡 플레이어 참고', value:newsDetail[i].players },
                      ].filter(s=>s.value).map(s=>(
                        <div key={s.label}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#7c5cfc', marginBottom:5, fontFamily:'Noto Sans KR' }}>{s.label}</div>
                          <div style={{ fontSize:13, color:'#c8cce0', lineHeight:1.75, fontFamily:'Noto Sans KR' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {!newsLoading && !news && (
                <div style={{ textAlign:'center', padding:50, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>소식을 불러오지 못했습니다.</div>
              )}
            </div>
          )}

          {/* ── 구매하기 (실시간 가격) ── */}
          {tab==='buy' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* 실시간 가격 비교 */}
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#e2e4ed', marginBottom:4, fontFamily:'Noto Sans KR' }}>
                  💰 실시간 플랫폼별 가격
                </div>
                <div style={{ fontSize:12, color:'#5a5f78', marginBottom:14, fontFamily:'Noto Sans KR' }}>
                  CheapShark API 기준 · 가격은 USD · 클릭하면 해당 스토어로 이동
                </div>

                {priceLoading && (
                  <div style={{ textAlign:'center', padding:40 }}>
                    <div style={{ fontSize:26, animation:'spin 1s linear infinite', display:'inline-block', marginBottom:10 }}>⚙️</div>
                    <div style={{ fontSize:13, color:'#7c5cfc', fontFamily:'Noto Sans KR' }}>실시간 가격 조회 중...</div>
                  </div>
                )}

                {!priceLoading && priceData?.deals?.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {/* 최저가 배너 */}
                    <div style={{ padding:'12px 16px', background:'rgba(0,214,143,0.08)', border:'1px solid rgba(0,214,143,0.25)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                      <div style={{ fontSize:13, color:'#00d68f', fontFamily:'Noto Sans KR', fontWeight:700 }}>
                        🏆 현재 최저가: <span style={{ fontSize:18, fontFamily:'Rajdhani' }}>${priceData.deals[0].salePrice.toFixed(2)}</span>
                        <span style={{ fontSize:12, marginLeft:6, opacity:0.8 }}>({priceData.deals[0].storeName})</span>
                      </div>
                      <a href={priceData.deals[0].dealUrl} target="_blank" rel="noopener noreferrer"
                        style={{ padding:'6px 16px', background:'rgba(0,214,143,0.2)', border:'1px solid rgba(0,214,143,0.4)', borderRadius:8, color:'#00d68f', fontSize:12, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:700 }}>
                        바로 구매 →
                      </a>
                    </div>

                    {/* 스토어별 가격 리스트 */}
                    {priceData.deals.map((deal, i) => (
                      <a key={i} href={deal.dealUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:`${deal.storeColor}18`, border:`1px solid ${deal.storeColor}33`, borderRadius:12, textDecoration:'none', transition:'all 0.2s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.transform='translateX(4px)'; e.currentTarget.style.background=`${deal.storeColor}28`; }}
                        onMouseLeave={e=>{ e.currentTarget.style.transform='translateX(0)'; e.currentTarget.style.background=`${deal.storeColor}18`; }}>
                        <span style={{ fontSize:24, flexShrink:0 }}>{deal.storeIcon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR' }}>{deal.storeName}</div>
                          {deal.savings > 0 && (
                            <div style={{ fontSize:11, color:'#00d68f', fontFamily:'Noto Sans KR', marginTop:2 }}>
                              정가 ${deal.normalPrice.toFixed(2)} → 할인 중
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          {deal.savings > 1 && (
                            <div style={{ fontSize:11, background:'rgba(255,71,87,0.2)', border:'1px solid rgba(255,71,87,0.4)', color:'#ff4757', borderRadius:6, padding:'2px 8px', marginBottom:4, fontWeight:700, fontFamily:'Rajdhani' }}>
                              -{Math.round(deal.savings)}%
                            </div>
                          )}
                          <div style={{ fontSize:20, fontWeight:700, color: deal.savings > 1 ? '#00d68f' : '#e2e4ed', fontFamily:'Rajdhani' }}>
                            ${deal.salePrice.toFixed(2)}
                          </div>
                          {deal.savings > 1 && (
                            <div style={{ fontSize:11, color:'#5a5f78', textDecoration:'line-through', fontFamily:'Rajdhani' }}>
                              ${deal.normalPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize:16, color:'#5a5f78', flexShrink:0 }}>→</span>
                      </a>
                    ))}
                  </div>
                )}

                {!priceLoading && (!priceData || priceData.deals?.length === 0) && (
                  <div style={{ padding:'20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR', textAlign:'center' }}>
                    💡 이 게임은 CheapShark 가격 데이터가 없어요.<br/>아래 링크에서 직접 확인하세요.
                  </div>
                )}
              </div>

              {/* 가격 비교 외부 링크 */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <a href={`https://isthereanydeal.com/search/?q=${encodeURIComponent(game.name)}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding:'10px 18px', background:'rgba(245,166,35,0.1)', border:'1px solid rgba(245,166,35,0.3)', borderRadius:8, color:'#f5a623', fontSize:13, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:700 }}>
                  💰 IsThereAnyDeal
                </a>
                <a href={`https://www.cheapshark.com/search?q=${encodeURIComponent(game.name)}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding:'10px 18px', background:'rgba(74,158,255,0.1)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, color:'#4a9eff', fontSize:13, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:700 }}>
                  🦈 CheapShark
                </a>
              </div>

              {/* 직접 스토어 검색 */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#5a5f78', marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontFamily:'Noto Sans KR' }}>직접 스토어 검색</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:8 }}>
                  {STORE_LINKS.map(store=>(
                    <a key={store.name} href={store.url(game.name)} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:`${store.color}18`, border:`1px solid ${store.color}33`, borderRadius:8, textDecoration:'none', color:'#c8cce0', fontFamily:'Noto Sans KR', fontSize:12, fontWeight:600, transition:'all 0.2s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=`${store.color}30`}
                      onMouseLeave={e=>e.currentTarget.style.background=`${store.color}18`}>
                      <span style={{ fontSize:18 }}>{store.icon}</span>
                      <span>{store.name}</span>
                    </a>
                  ))}
                </div>
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
