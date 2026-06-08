import { useState, useEffect } from 'react';

const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE     = 'https://api.rawg.io/api';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'Simulation':'#a0d468','Fighting':'#c8a84b','Arcade':'#ff9ff3','Platformer':'#54a0ff',
  'Indie':'#9b59b6','Casual':'#00d2d3','Massively Multiplayer':'#e74c3c','MOBA':'#c8a84b','Tactical':'#6ecbce',
};
function gcolor(g=[]) { for(const x of g) if(GENRE_COLOR[x]) return GENRE_COLOR[x]; return '#4a9eff'; }

// ── RAWG 상세 데이터 ─────────────────────────────────────────────
async function fetchRawgDetail(id) {
  if (!RAWG_KEY || !id || typeof id === 'string') return { detail:null, movies:[], screenshots:[] };
  try {
    const [d, m, s] = await Promise.allSettled([
      fetch(`${BASE}/games/${id}?key=${RAWG_KEY}`).then(r=>r.json()),
      fetch(`${BASE}/games/${id}/movies?key=${RAWG_KEY}`).then(r=>r.json()),
      fetch(`${BASE}/games/${id}/screenshots?key=${RAWG_KEY}&page_size=6`).then(r=>r.json()),
    ]);
    return {
      detail:      d.status==='fulfilled' ? d.value : null,
      movies:      m.status==='fulfilled' ? (m.value?.results||[]) : [],
      screenshots: s.status==='fulfilled' ? (s.value?.results||[]) : [],
    };
  } catch { return { detail:null, movies:[], screenshots:[] }; }
}

// ── YouTube 검색 API로 영상 ID 가져오기 ──────────────────────────
// (직접 iframe은 RAWG movies API or YouTube oEmbed 경유)
function buildYTSearchUrl(name) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' official trailer')}`;
}

// YouTube 노쿠키 임베드 ID 결정:
// 1순위 RAWG movies에서 YouTube ID 파싱
// 2순위 미리 세팅된 유명 게임 ID
const KNOWN_YT = {
  '리그 오브 레전드': 'BGtROJeMur4',
  '발로란트':        'e_E9W2vsRbQ',
  '배틀그라운드':    'PKRMk7dSQmI',
  '오버워치 2':      'dZl1yGUetjI',
  '엘든 링':         'E3Huy2cdih0',
};

function parseYTIdFromUrl(url='') {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Claude API: 한국어 소개 + 최근 업데이트 3개 ─────────────────
async function fetchAIInfo(gameName, genres) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content:
`게임 "${gameName}" (장르: ${genres.join(', ')})에 대해 JSON만 반환해. 다른 텍스트 없이:
{
  "intro": "게임 소개 3~4문장 (한국어, 특징/세계관/플레이 방식 포함)",
  "highlights": ["핵심 특징 1","핵심 특징 2","핵심 특징 3"],
  "news": [
    {"title":"최근 업데이트/패치/이벤트 제목 1","desc":"한 줄 요약"},
    {"title":"최근 업데이트/패치/이벤트 제목 2","desc":"한 줄 요약"},
    {"title":"최근 업데이트/패치/이벤트 제목 3","desc":"한 줄 요약"}
  ],
  "verdict": "한 줄 총평 (한국어)",
  "youtubeId": "공식 트레일러 YouTube ID 11자리 (모르면 빈 문자열)"
}` }]
      })
    });
    if (!res.ok) throw new Error('fail');
    const data = await res.json();
    const raw = data.content?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g,'').trim());
  } catch {
    return {
      intro: `${gameName}은(는) 전 세계 수백만 명의 게이머들이 즐기는 타이틀입니다. 다양한 플랫폼에서 플레이 가능하며 꾸준한 업데이트로 새로운 콘텐츠를 제공합니다.`,
      highlights: ['멀티플레이 지원','정기적인 업데이트','글로벌 커뮤니티'],
      news: [
        { title:'최근 패치 업데이트', desc:'밸런스 조정 및 버그 수정 적용' },
        { title:'신규 콘텐츠 추가', desc:'새로운 아이템 및 이벤트 오픈' },
        { title:'시즌 업데이트', desc:'신규 시즌 시작 및 랭크 리셋' },
      ],
      verdict: '많은 유저들이 꾸준히 즐기는 검증된 타이틀.',
      youtubeId: '',
    };
  }
}

// ── 구매 링크 자동 감지 ──────────────────────────────────────────
function getStoreLinks(game) {
  const name  = encodeURIComponent(game.name);
  const plats = (game.platforms||[]).join(' ').toLowerCase();
  const links = [];
  // 비스팀 게임 감지
  const isRiot    = /리그 오브 레전드|발로란트|롤|lol|valorant/i.test(game.name);
  const isBlizzard= /오버워치|디아블로|스타크래프트|하스스톤|히어로즈|overwatch|diablo|starcraft/i.test(game.name);

  if (isRiot)     links.push({ label:'Riot Games 클라이언트', icon:'⚔️', color:'#d4a843', bg:'rgba(212,168,67,0.12)', url:`https://www.riotgames.com/ko` });
  if (isBlizzard) links.push({ label:'Battle.net에서 플레이', icon:'💙', color:'#0080ff', bg:'rgba(0,128,255,0.12)', url:`https://us.battle.net/shop/ko-kr/catalog?q=${name}` });

  if (!isRiot && !isBlizzard) {
    if (/pc|windows/i.test(plats) || game.genres?.some(g=>/RPG|Shooter|Strategy|Indie|Action/i.test(g))) {
      links.push({ label:'Steam에서 구매', icon:'🟦', color:'#1b9aff', bg:'rgba(27,154,255,0.1)', url:`https://store.steampowered.com/search/?term=${name}` });
      links.push({ label:'Epic Games에서 구매', icon:'⬛', color:'#c8c8c8', bg:'rgba(200,200,200,0.08)', url:`https://store.epicgames.com/browse?q=${name}` });
    }
  }
  if (/playstation|ps5|ps4/i.test(plats)) links.push({ label:'PlayStation Store', icon:'🔵', color:'#0057af', bg:'rgba(0,87,175,0.12)', url:`https://store.playstation.com/search/${name}` });
  if (/xbox/i.test(plats))                links.push({ label:'Xbox에서 구매', icon:'🟢', color:'#107c10', bg:'rgba(16,124,16,0.1)', url:`https://www.xbox.com/search?q=${name}` });
  if (/nintendo|switch/i.test(plats))     links.push({ label:'Nintendo eShop', icon:'🔴', color:'#e60012', bg:'rgba(230,0,18,0.1)', url:`https://www.nintendo.com/search/?q=${name}` });

  if (links.length === 0) {
    links.push({ label:'Steam에서 구매', icon:'🟦', color:'#1b9aff', bg:'rgba(27,154,255,0.1)', url:`https://store.steampowered.com/search/?term=${name}` });
    links.push({ label:'Epic Games에서 구매', icon:'⬛', color:'#c8c8c8', bg:'rgba(200,200,200,0.08)', url:`https://store.epicgames.com/browse?q=${name}` });
  }
  return links;
}

function metaColor(s) {
  if(s>=75) return '#00d68f';
  if(s>=50) return '#f5a623';
  return '#ff4757';
}

// ── 메인 모달 ────────────────────────────────────────────────────
export default function GameDetailModal({ game, onClose }) {
  const color      = gcolor(game.genres);
  const mc         = game.metacritic;
  const mcColor    = mc ? metaColor(mc) : null;
  const storeLinks = getStoreLinks(game);

  const [aiInfo,       setAiInfo]       = useState(null);
  const [aiLoading,    setAiLoading]    = useState(true);
  const [rawgData,     setRawgData]     = useState(null);
  const [rawgLoading,  setRawgLoading]  = useState(true);
  const [ytId,         setYtId]         = useState(null);
  const [activeImg,    setActiveImg]    = useState(game.img);

  const platforms = [...new Set((game.platforms||[]).slice(0,6).map(p=>{
    if(/pc|windows/i.test(p))         return '💻 PC';
    if(/playstation 5|ps5/i.test(p))  return '🎮 PS5';
    if(/playstation 4|ps4/i.test(p))  return '🎮 PS4';
    if(/xbox series/i.test(p))        return '🟢 Xbox Series';
    if(/xbox one/i.test(p))           return '🟢 Xbox One';
    if(/xbox/i.test(p))               return '🟢 Xbox';
    if(/nintendo|switch/i.test(p))    return '🔴 Switch';
    if(/mac/i.test(p))                return '🍎 Mac';
    if(/android/i.test(p))            return '📱 Android';
    if(/ios/i.test(p))                return '📱 iOS';
    return p.slice(0,14);
  }))];

  // 스크롤 잠금
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

  // AI 정보 로드
  useEffect(() => {
    fetchAIInfo(game.name, game.genres||[]).then(info => {
      setAiInfo(info);
      setAiLoading(false);
      // AI가 준 YouTube ID 우선, 그 다음 known 맵
      const id = info?.youtubeId || KNOWN_YT[game.name] || '';
      if (id) setYtId(id);
    });
  }, [game.name]);

  // RAWG 상세 (screenshots, movies)
  useEffect(() => {
    fetchRawgDetail(game.id).then(({ detail, movies, screenshots }) => {
      setRawgData({ detail, movies, screenshots });
      setRawgLoading(false);
      // RAWG movies에서 YouTube ID 파싱 (AI보다 더 신뢰)
      for (const mov of movies) {
        const id = parseYTIdFromUrl(mov.data?.max || mov.data?.['480'] || '');
        if (id) { setYtId(id); break; }
      }
      // 스크린샷이 있으면 첫 번째로 메인 이미지 교체
      if (screenshots.length > 0) setActiveImg(screenshots[0].image);
    });
  }, [game.id]);

  const screenshots = rawgData?.screenshots || [];
  const allImages   = [
    { url: game.img, label: '커버' },
    ...screenshots.map((s,i) => ({ url: s.image, label: `스크린샷 ${i+1}` })),
  ];

  return (
    <div
      onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,0.92)',
        backdropFilter:'blur(10px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'12px',
        animation:'fadeIn 0.2s ease',
        overflowY:'auto',
      }}
    >
      <div style={{
        width:'100%', maxWidth:1080,
        background:'#0d0e18',
        borderRadius:20,
        border:`1px solid ${color}44`,
        boxShadow:`0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px ${color}22`,
        overflow:'hidden',
        animation:'slideUp 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        position:'relative',
      }}>

        {/* ── 닫기 버튼 ── */}
        <button onClick={onClose} style={{
          position:'absolute', top:16, right:16, zIndex:20,
          width:40, height:40, borderRadius:'50%',
          background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.2)',
          color:'#fff', fontSize:20, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'background 0.2s',
        }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.7)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0.7)'}
        >✕</button>

        {/* ── 메인 이미지 (크게) ── */}
        <div style={{ position:'relative', width:'100%', height:460, overflow:'hidden', background:'#000' }}>
          <img
            src={activeImg}
            alt={game.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'opacity 0.3s' }}
            onError={e=>{
              if(game.imgFallback && e.currentTarget.src!==game.imgFallback) {
                e.currentTarget.src=game.imgFallback;
              } else {
                e.currentTarget.src=`https://picsum.photos/seed/game${game.id}/1080/460`;
              }
            }}
          />
          {/* 하단 그라디언트 */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(13,14,24,1) 100%)' }}/>

          {/* 메타크리틱 — 대형 */}
          {mc && (
            <div style={{
              position:'absolute', top:16, left:16,
              background:`${mcColor}22`, border:`2px solid ${mcColor}88`,
              borderRadius:14, padding:'12px 20px', textAlign:'center',
              backdropFilter:'blur(8px)',
            }}>
              <div style={{ fontFamily:'Rajdhani', fontWeight:800, fontSize:52, color:mcColor, lineHeight:1 }}>{mc}</div>
              <div style={{ fontSize:10, color:mcColor, opacity:0.9, letterSpacing:2, fontWeight:700, marginTop:2 }}>METACRITIC</div>
            </div>
          )}

          {/* 장르 뱃지 */}
          <div style={{ position:'absolute', bottom:22, left:24, right:70 }}>
            <div style={{ display:'flex', gap:7, marginBottom:10, flexWrap:'wrap' }}>
              {(game.genres||[]).slice(0,4).map(g=>(
                <span key={g} style={{
                  fontSize:11, padding:'4px 11px', borderRadius:6,
                  background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}33`:'rgba(255,255,255,0.15)',
                  color:GENRE_COLOR[g]||'#c8cce0',
                  border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.2)'}55`,
                  fontWeight:700, backdropFilter:'blur(4px)',
                }}>{g}</span>
              ))}
            </div>
            <h2 style={{
              fontFamily:'Noto Sans KR', fontWeight:800, fontSize:34,
              color:'#fff', margin:0, lineHeight:1.2,
              textShadow:'0 2px 16px rgba(0,0,0,0.8)',
            }}>{game.name}</h2>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8 }}>
              {game.released && <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontFamily:'Noto Sans KR' }}>📅 {game.released}</span>}
              {game.rating   && (
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  {[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:15, color:s<=Math.round(game.rating)?'#f0c330':'rgba(255,255,255,0.2)' }}>★</span>)}
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontFamily:'Rajdhani', fontWeight:600 }}>{game.rating}/5.0</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 썸네일 스트립 ── */}
        {allImages.length > 1 && (
          <div style={{ display:'flex', gap:6, padding:'10px 20px', background:'rgba(0,0,0,0.4)', overflowX:'auto' }}>
            {allImages.map((img,i)=>(
              <div key={i} onClick={()=>setActiveImg(img.url)}
                style={{
                  width:80, height:50, borderRadius:6, overflow:'hidden', flexShrink:0,
                  cursor:'pointer', border:`2px solid ${activeImg===img.url?color:'rgba(255,255,255,0.1)'}`,
                  transition:'border-color 0.2s',
                }}
              >
                <img src={img.url} alt={img.label} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.currentTarget.style.display='none';}}/>
              </div>
            ))}
          </div>
        )}

        {/* ── 콘텐츠 영역 (세로 한 화면, 탭 없음) ── */}
        <div style={{ padding:'24px 28px 32px', display:'flex', flexDirection:'column', gap:28 }}>

          {/* ── 섹션 1: 기본 정보 그리드 ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
            {[
              { label:'출시일',   val: game.released||'미정',      icon:'📅' },
              { label:'평점',     val: game.rating?`${game.rating}/5.0`:'-', icon:'⭐' },
              { label:'플랫폼',   val: platforms.join(' · ')||'-', icon:'🖥️' },
              { label:'장르',     val: (game.genres||[]).slice(0,3).join(', ')||'-', icon:'🎯' },
            ].map(r=>(
              <div key={r.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:11, color:'#5a5f78', marginBottom:5, fontFamily:'Noto Sans KR', fontWeight:600 }}>{r.icon} {r.label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf2', fontFamily:'Noto Sans KR' }}>{r.val}</div>
              </div>
            ))}
          </div>

          {/* ── 섹션 2: AI 한국어 소개 ── */}
          <div style={{ background:`${color}0d`, border:`1px solid ${color}33`, borderRadius:14, padding:'18px 22px' }}>
            <div style={{ fontSize:13, color:color, fontWeight:700, marginBottom:12, fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', gap:6 }}>
              📝 게임 소개
              {aiLoading && <span style={{ fontSize:11, color:'#5a5f78', fontWeight:400 }}>AI가 분석 중...</span>}
            </div>
            {aiLoading ? (
              <div style={{ display:'flex', gap:8, alignItems:'center', color:'#5a5f78', fontSize:13, fontFamily:'Noto Sans KR' }}>
                <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> 잠시만요...
              </div>
            ) : (
              <>
                <p style={{ fontSize:15, color:'#d0d4e4', lineHeight:1.9, margin:'0 0 14px', fontFamily:'Noto Sans KR', fontWeight:500 }}>{aiInfo?.intro}</p>
                {aiInfo?.highlights && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {aiInfo.highlights.map((h,i)=>(
                      <span key={i} style={{ fontSize:12, padding:'5px 13px', borderRadius:999, background:`${color}1a`, border:`1px solid ${color}44`, color, fontFamily:'Noto Sans KR', fontWeight:600 }}>✓ {h}</span>
                    ))}
                  </div>
                )}
                {aiInfo?.verdict && (
                  <div style={{ marginTop:12, fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR', fontStyle:'italic', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
                    💬 {aiInfo.verdict}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── 섹션 3: 유튜브 트레일러 (실제 임베드) ── */}
          <div>
            <div style={{ fontSize:13, color:'#8a8fa8', fontWeight:700, marginBottom:12, fontFamily:'Noto Sans KR' }}>🎬 공식 트레일러</div>
            <div style={{ width:'100%', aspectRatio:'16/9', borderRadius:14, overflow:'hidden', background:'#000', border:`1px solid ${color}33` }}>
              {ytId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
                  title={`${game.name} 트레일러`}
                  style={{ width:'100%', height:'100%', border:'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                /* YouTube ID 없을 때: 게임 이미지 위에 YouTube 검색 버튼 */
                <div style={{ position:'relative', width:'100%', height:'100%' }}>
                  <img src={game.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.3 }} onError={e=>{e.currentTarget.style.display='none';}}/>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                    <div style={{ fontSize:56 }}>🎬</div>
                    <p style={{ fontFamily:'Noto Sans KR', fontSize:15, color:'rgba(255,255,255,0.7)', margin:0 }}>공식 YouTube 영상 보기</p>
                    <a href={buildYTSearchUrl(game.name)} target="_blank" rel="noopener noreferrer"
                      style={{ padding:'12px 30px', background:'#ff0000', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, textDecoration:'none', fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', gap:8 }}
                    >▶ YouTube에서 검색</a>
                  </div>
                </div>
              )}
            </div>
            {/* 추가 영상 링크 */}
            <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
              {[
                { label:'공식 트레일러',  q:`${game.name} official trailer` },
                { label:'게임플레이',    q:`${game.name} gameplay 2025` },
                { label:'리뷰/평가',     q:`${game.name} review` },
              ].map(item=>(
                <a key={item.label} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.q)}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:12, padding:'6px 14px', background:'rgba(255,0,0,0.1)', border:'1px solid rgba(255,0,0,0.25)', borderRadius:6, color:'#ff6b6b', textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:600, transition:'background 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,0,0,0.2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,0,0,0.1)'}
                >▶ {item.label}</a>
              ))}
            </div>
          </div>

          {/* ── 섹션 4: AI 최근 업데이트 소식 ── */}
          <div>
            <div style={{ fontSize:13, color:'#8a8fa8', fontWeight:700, marginBottom:12, fontFamily:'Noto Sans KR' }}>
              📰 최근 업데이트 소식
              <span style={{ fontSize:11, color:'#5a5f78', fontWeight:400, marginLeft:8 }}>AI 요약</span>
            </div>
            {aiLoading ? (
              <div style={{ display:'flex', gap:8, alignItems:'center', color:'#5a5f78', fontSize:13, fontFamily:'Noto Sans KR', padding:'16px 0' }}>
                <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> AI가 최신 소식 수집 중...
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(aiInfo?.news||[]).map((n,i)=>(
                  <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'14px 16px' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, fontWeight:700, color, fontFamily:'Rajdhani' }}>{i+1}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf2', fontFamily:'Noto Sans KR', marginBottom:4 }}>{n.title}</div>
                      <div style={{ fontSize:13, color:'#9098b8', fontFamily:'Noto Sans KR', fontWeight:500, lineHeight:1.6 }}>{n.desc}</div>
                    </div>
                  </div>
                ))}
                {/* 나무위키/Reddit 링크 */}
                <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                  {[
                    { label:'나무위키', url:`https://namu.wiki/w/${encodeURIComponent(game.name)}`, color:'#00c060' },
                    { label:'Reddit',   url:`https://www.reddit.com/search/?q=${encodeURIComponent(game.name)}`, color:'#ff4500' },
                    { label:'RAWG',     url:`https://rawg.io/games/${encodeURIComponent(game.name.toLowerCase().replace(/\s/g,'-'))}`, color:'#4a9eff' },
                  ].map(l=>(
                    <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:12, padding:'5px 12px', background:`${l.color}11`, border:`1px solid ${l.color}33`, borderRadius:6, color:l.color, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:700 }}
                    >{l.label} →</a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 섹션 5: 구매하기 ── */}
          <div>
            <div style={{ fontSize:13, color:'#8a8fa8', fontWeight:700, marginBottom:12, fontFamily:'Noto Sans KR' }}>🛒 구매하기</div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {storeLinks.map(s=>(
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'15px 20px', background:s.bg, border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#f0f2ff', textDecoration:'none', fontFamily:'Noto Sans KR', fontSize:15, fontWeight:700, transition:'transform 0.15s, opacity 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateX(6px)';e.currentTarget.style.opacity='0.88';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.opacity='1';}}
                >
                  <span style={{ fontSize:24 }}>{s.icon}</span>
                  <div>
                    <div>{s.label}</div>
                    <div style={{ fontSize:11, opacity:0.55, fontWeight:400, marginTop:2 }}>"{game.name}" 검색 →</div>
                  </div>
                  <span style={{ marginLeft:'auto', opacity:0.4, fontSize:20 }}>→</span>
                </a>
              ))}
            </div>
          </div>

        </div>{/* end content */}
      </div>{/* end modal */}

      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
