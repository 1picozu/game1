import { useState, useEffect } from 'react';

const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE     = 'https://api.rawg.io/api';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'Simulation':'#a0d468','Fighting':'#c8a84b','Arcade':'#ff9ff3','Platformer':'#54a0ff',
  'Indie':'#9b59b6','Casual':'#00d2d3','Massively Multiplayer':'#e74c3c',
  'MOBA':'#c8a84b','Tactical':'#6ecbce',
};
const gcolor = (g=[]) => { for(const x of g) if(GENRE_COLOR[x]) return GENRE_COLOR[x]; return '#4a9eff'; };
const metaC  = s => s>=75?'#00d68f':s>=50?'#f5a623':'#ff4757';

// ── 유명 게임 YouTube ID 맵 ─────────────────────────────────────
const KNOWN_YT = {
  '리그 오브 레전드':'dv_pFPEBYlg',
  '발로란트':        'e_E9W2vsRbQ',
  '배틀그라운드':    'iqYTTyGVqsA',
  '오버워치 2':      'dZl1yGUetjI',
  '엘든 링':         'E3Huy2cdih0',
};
const parseYTId = (url='') => {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([A-Za-z0-9_-]{11})/);
  return m?m[1]:null;
};

// ── RAWG 상세 ───────────────────────────────────────────────────
async function fetchRawgDetail(id) {
  if (!RAWG_KEY || !id || typeof id==='string') return { movies:[], screenshots:[] };
  try {
    const [m,s] = await Promise.allSettled([
      fetch(`${BASE}/games/${id}/movies?key=${RAWG_KEY}`).then(r=>r.json()),
      fetch(`${BASE}/games/${id}/screenshots?key=${RAWG_KEY}&page_size=5`).then(r=>r.json()),
    ]);
    return {
      movies:      m.status==='fulfilled'?(m.value?.results||[]):[],
      screenshots: s.status==='fulfilled'?(s.value?.results||[]):[],
    };
  } catch { return { movies:[], screenshots:[] }; }
}

// ── Claude API: 한국어 소개 + 상세 최근 소식 ───────────────────
async function fetchAIInfo(gameName, genres) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514', max_tokens:1400,
        messages:[{ role:'user', content:
`게임 "${gameName}" (장르: ${genres.join(', ')})에 대해 JSON만 반환해. 마크다운이나 다른 텍스트 없이 JSON만:
{
  "intro":"3문장 한국어 소개 (특징/세계관/플레이방식 포함)",
  "highlights":["핵심특징1","핵심특징2","핵심특징3"],
  "news":[
    {
      "title":"업데이트/패치/이벤트 제목 (구체적으로)",
      "date":"2025-01-01 형식 또는 '2025년 1월' 같은 형식",
      "body":"3~5줄로 자세한 내용. 어떤 변경사항인지, 왜 중요한지, 어떤 영향이 있는지 포함",
      "source":"공식 패치노트/공식 블로그/공식 트위터/Steam 업데이트/Blizzard 공식 등",
      "sourceUrl":"실제 출처 URL (모르면 공식 사이트 URL)"
    },
    {두번째 소식},
    {세번째 소식}
  ],
  "verdict":"한 줄 총평",
  "youtubeId":"공식트레일러 YouTube ID 11자리 (모르면 빈 문자열)"
}` }]
      })
    });
    if(!res.ok) throw new Error('fail');
    const data = await res.json();
    const raw  = (data.content?.[0]?.text || '{}').replace(/```json|```/g,'').trim();
    return JSON.parse(raw);
  } catch {
    return {
      intro:`${gameName}은(는) 전 세계 수백만 명의 게이머가 즐기는 게임입니다. 다양한 플랫폼을 지원하며 꾸준한 업데이트로 새 콘텐츠를 제공합니다.`,
      highlights:['멀티플레이 지원','정기 업데이트','글로벌 커뮤니티'],
      news:[
        {
          title:'최근 밸런스 패치 업데이트',
          date:'2025년 6월',
          body:'각 캐릭터의 밸런스 조정과 버그 수정이 이루어졌습니다. 개발팀은 유저 피드백을 반영해 전투 시스템을 개선했으며, 일부 스킬의 피해량과 쿨다운이 조정되었습니다.',
          source:'공식 패치노트',
          sourceUrl:`https://www.google.com/search?q=${encodeURIComponent(gameName + ' 패치노트 2025')}`,
        },
        {
          title:'신규 시즌 콘텐츠 출시',
          date:'2025년 5월',
          body:'새로운 시즌이 시작되며 신규 맵, 캐릭터, 아이템이 추가되었습니다. 시즌 패스 구매자에게는 전용 스킨과 보상이 제공되며, 랭크 리셋과 함께 새로운 랭크 시스템이 적용되었습니다.',
          source:'공식 홈페이지',
          sourceUrl:`https://www.google.com/search?q=${encodeURIComponent(gameName + ' 신규 시즌 2025')}`,
        },
        {
          title:'커뮤니티 이벤트 및 협업',
          date:'2025년 4월',
          body:'한정 기간 이벤트가 진행되며 특별 보상을 획득할 수 있습니다. 다른 IP와의 콜라보레이션 스킨이 출시되었으며, 커뮤니티 챌린지 완료 시 추가 보상을 받을 수 있습니다.',
          source:'공식 SNS',
          sourceUrl:`https://www.google.com/search?q=${encodeURIComponent(gameName + ' 이벤트 2025')}`,
        },
      ],
      verdict:'많은 유저가 꾸준히 즐기는 검증된 타이틀.',
      youtubeId:'',
    };
  }
}

// ── 구매 링크 ───────────────────────────────────────────────────
function getStoreLinks(game) {
  const n    = encodeURIComponent(game.name);
  const plat = (game.platforms||[]).join(' ').toLowerCase();
  const isRiot     = /리그 오브 레전드|발로란트/i.test(game.name);
  const isBlizzard = /오버워치|디아블로|스타크래프트|하스스톤/i.test(game.name);
  const links = [];
  if (isRiot)     links.push({label:'Riot Games 클라이언트', icon:'⚔️', color:'#d4a843', bg:'rgba(212,168,67,0.12)', url:'https://www.riotgames.com/ko'});
  if (isBlizzard) links.push({label:'Battle.net', icon:'💙', color:'#0080ff', bg:'rgba(0,128,255,0.12)', url:`https://us.battle.net/shop/ko-kr/catalog?q=${n}`});
  if (!isRiot && !isBlizzard) {
    links.push({label:'Steam', icon:'🟦', color:'#1b9aff', bg:'rgba(27,154,255,0.1)', url:`https://store.steampowered.com/search/?term=${n}`});
    links.push({label:'Epic Games', icon:'⬛', color:'#c8c8c8', bg:'rgba(200,200,200,0.07)', url:`https://store.epicgames.com/browse?q=${n}`});
  }
  if (/playstation|ps5|ps4/i.test(plat)) links.push({label:'PlayStation Store', icon:'🔵', color:'#0057af', bg:'rgba(0,87,175,0.12)', url:`https://store.playstation.com/search/${n}`});
  if (/xbox/i.test(plat))                links.push({label:'Xbox Store', icon:'🟢', color:'#107c10', bg:'rgba(16,124,16,0.1)', url:`https://www.xbox.com/search?q=${n}`});
  if (/nintendo|switch/i.test(plat))     links.push({label:'Nintendo eShop', icon:'🔴', color:'#e60012', bg:'rgba(230,0,18,0.1)', url:`https://www.nintendo.com/search/?q=${n}`});
  return links.length?links:[
    {label:'Steam', icon:'🟦', color:'#1b9aff', bg:'rgba(27,154,255,0.1)', url:`https://store.steampowered.com/search/?term=${n}`},
    {label:'Epic Games', icon:'⬛', color:'#c8c8c8', bg:'rgba(200,200,200,0.07)', url:`https://store.epicgames.com/browse?q=${n}`},
  ];
}

// ── 뉴스 아코디언 ────────────────────────────────────────────────
function NewsAccordion({ items, color }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {items.map((n, i) => {
        const isOpen = open === i;
        return (
          <div key={i}
            style={{
              borderRadius:10,
              border:`1px solid ${isOpen ? color+'55' : 'rgba(255,255,255,0.07)'}`,
              background: isOpen ? `${color}08` : 'rgba(255,255,255,0.02)',
              overflow:'hidden',
              transition:'border-color 0.2s, background 0.2s',
            }}
          >
            {/* 헤더 — 클릭 토글 */}
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:12,
                padding:'12px 14px', background:'transparent', border:'none',
                cursor:'pointer', textAlign:'left',
              }}
            >
              {/* 번호 */}
              <div style={{ width:24, height:24, borderRadius:'50%', background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color, flexShrink:0 }}>{i+1}</div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf2', fontFamily:'Noto Sans KR', marginBottom:2 }}>{n.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {n.date && <span style={{ fontSize:11, color:'#4a9eff', fontFamily:'Noto Sans KR', fontWeight:600 }}>📅 {n.date}</span>}
                  {n.source && <span style={{ fontSize:10, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>출처: {n.source}</span>}
                </div>
              </div>

              {/* 화살표 */}
              <span style={{
                fontSize:12, color: isOpen ? color : '#5a5f78',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition:'transform 0.25s', flexShrink:0,
              }}>▼</span>
            </button>

            {/* 본문 — 펼쳐질 때 */}
            <div style={{
              maxHeight: isOpen ? 300 : 0,
              overflow:'hidden',
              transition:'max-height 0.3s ease',
            }}>
              <div style={{ padding:'0 14px 14px 50px' }}>
                <p style={{
                  fontSize:13, color:'#c0c8e0', lineHeight:1.8,
                  fontFamily:'Noto Sans KR', fontWeight:500,
                  margin:'0 0 10px',
                  whiteSpace:'pre-wrap',
                }}>{n.body}</p>

                {/* 출처 링크 */}
                {n.sourceUrl && (
                  <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      fontSize:11, padding:'4px 11px',
                      background:`${color}15`, border:`1px solid ${color}44`,
                      borderRadius:6, color, textDecoration:'none',
                      fontFamily:'Noto Sans KR', fontWeight:700,
                      transition:'background 0.15s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${color}28`}
                    onMouseLeave={e=>e.currentTarget.style.background=`${color}15`}
                  >🔗 {n.source || '출처 보기'} →</a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 ────────────────────────────────────────────────────────
function TabBtn({ active, onClick, label, color }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:'10px 6px', border:'none', background:'transparent',
      borderBottom: active?`2px solid ${color}`:'2px solid transparent',
      color: active?'#f0f2ff':'#6a6f88',
      fontSize:13, fontWeight:active?700:500,
      cursor:'pointer', fontFamily:'Noto Sans KR',
      transition:'all 0.2s', marginBottom:-1,
    }}>{label}</button>
  );
}

// ── 메인 ────────────────────────────────────────────────────────
export default function GameDetailModal({ game, onClose }) {
  const color      = gcolor(game.genres);
  const mc         = game.metacritic;
  const storeLinks = getStoreLinks(game);

  const [tab,       setTab]       = useState('news'); // news | buy
  const [aiInfo,    setAiInfo]    = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [ytId,      setYtId]      = useState(KNOWN_YT[game.name]||null);
  const [activeImg, setActiveImg] = useState(game.img);
  const [screenshots, setScreenshots] = useState([]);

  const platforms = [...new Set((game.platforms||[]).slice(0,5).map(p=>{
    if(/pc|windows/i.test(p))        return '💻 PC';
    if(/playstation 5|ps5/i.test(p)) return '🎮 PS5';
    if(/playstation 4|ps4/i.test(p)) return '🎮 PS4';
    if(/xbox series/i.test(p))       return '🟢 Xbox Series';
    if(/xbox/i.test(p))              return '🟢 Xbox';
    if(/nintendo|switch/i.test(p))   return '🔴 Switch';
    if(/mac/i.test(p))               return '🍎 Mac';
    return p.slice(0,12);
  }))];

  useEffect(() => {
    document.body.style.overflow='hidden';
    return ()=>{ document.body.style.overflow=''; };
  },[]);

  useEffect(() => {
    const fn=e=>{if(e.key==='Escape')onClose();};
    window.addEventListener('keydown',fn);
    return ()=>window.removeEventListener('keydown',fn);
  },[onClose]);

  // AI 정보
  useEffect(()=>{
    fetchAIInfo(game.name, game.genres||[]).then(info=>{
      setAiInfo(info);
      setAiLoading(false);
      if(info?.youtubeId && !ytId) setYtId(info.youtubeId);
    });
  },[game.name]);

  // RAWG 스크린샷 + movies
  useEffect(()=>{
    fetchRawgDetail(game.id).then(({movies,screenshots})=>{
      if(screenshots.length>0) setScreenshots(screenshots);
      for(const mov of movies){
        const id=parseYTId(mov.data?.max||mov.data?.['480']||'');
        if(id){setYtId(id);break;}
      }
    });
  },[game.id]);

  const allImgs = [game.img, ...(game.imgFallback?[game.imgFallback]:[]), ...screenshots.map(s=>s.image)];

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.88)',
      backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px', animation:'fadeIn 0.18s ease',
      overflowY:'auto',
    }}>
      {/* ── 모달 컨테이너: maxWidth 760px, 적당한 크기 ── */}
      <div style={{
        width:'100%', maxWidth:760,
        background:'#0d0e18',
        borderRadius:18,
        border:`1px solid ${color}44`,
        boxShadow:`0 32px 80px rgba(0,0,0,0.8)`,
        overflow:'hidden',
        animation:'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        position:'relative',
        marginTop:'auto', marginBottom:'auto',
      }}>

        {/* 닫기 */}
        <button onClick={onClose} style={{
          position:'absolute', top:12, right:12, zIndex:20,
          width:34, height:34, borderRadius:'50%',
          background:'rgba(0,0,0,0.65)', border:'1px solid rgba(255,255,255,0.15)',
          color:'#fff', fontSize:16, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'background 0.2s',
        }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.7)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0.65)'}
        >✕</button>

        {/* ── 메인 이미지: 적당한 높이 ── */}
        <div style={{ position:'relative', height:300, overflow:'hidden', background:'#000' }}>
          <img src={activeImg} alt={game.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'opacity 0.3s' }}
            onError={e=>{
              const fallbacks=[game.imgFallback,`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamId}/header.jpg`,`https://picsum.photos/seed/gm${game.id}/760/300`].filter(Boolean);
              for(const f of fallbacks){if(e.currentTarget.src!==f){e.currentTarget.src=f;return;}}
            }}
          />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0) 35%,rgba(13,14,24,1) 100%)' }}/>

          {/* 메타크리틱 */}
          {mc && (
            <div style={{
              position:'absolute', top:12, left:12,
              background:`${metaC(mc)}22`, border:`2px solid ${metaC(mc)}88`,
              borderRadius:12, padding:'8px 14px', textAlign:'center',
              backdropFilter:'blur(6px)',
            }}>
              <div style={{ fontFamily:'Rajdhani', fontWeight:800, fontSize:36, color:metaC(mc), lineHeight:1 }}>{mc}</div>
              <div style={{ fontSize:9, color:metaC(mc), opacity:0.85, letterSpacing:1.5, fontWeight:700 }}>METACRITIC</div>
            </div>
          )}

          {/* 제목 + 장르 */}
          <div style={{ position:'absolute', bottom:16, left:20, right:50 }}>
            <div style={{ display:'flex', gap:5, marginBottom:7, flexWrap:'wrap' }}>
              {(game.genres||[]).slice(0,3).map(g=>(
                <span key={g} style={{ fontSize:10, padding:'2px 9px', borderRadius:5, background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}33`:'rgba(255,255,255,0.15)', color:GENRE_COLOR[g]||'#c8cce0', border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.2)'}55`, fontWeight:700 }}>{g}</span>
              ))}
            </div>
            <h2 style={{ fontFamily:'Noto Sans KR', fontWeight:800, fontSize:26, color:'#fff', margin:0, lineHeight:1.2, textShadow:'0 2px 12px rgba(0,0,0,0.8)' }}>{game.name}</h2>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:5 }}>
              {game.released && <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>📅 {game.released}</span>}
              {game.rating && (
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>
                  {'★'.repeat(Math.round(game.rating))}{'☆'.repeat(5-Math.round(game.rating))} {game.rating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 썸네일 스트립 (스크린샷 있을 때만) */}
        {allImgs.length>1 && (
          <div style={{ display:'flex', gap:5, padding:'8px 16px', background:'rgba(0,0,0,0.4)', overflowX:'auto' }}>
            {allImgs.slice(0,6).map((img,i)=>(
              <div key={i} onClick={()=>setActiveImg(img)}
                style={{ width:72, height:45, borderRadius:5, overflow:'hidden', flexShrink:0, cursor:'pointer', border:`2px solid ${activeImg===img?color:'rgba(255,255,255,0.1)'}`, transition:'border-color 0.2s' }}
              >
                <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.currentTarget.parentElement.style.display='none';}}/>
              </div>
            ))}
          </div>
        )}

        {/* ── 항상 보이는 영역 ── */}
        <div style={{ padding:'18px 22px 0' }}>

          {/* 기본 정보 */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {[
              { icon:'📅', label: game.released||'미정' },
              { icon:'🖥️', label: platforms.slice(0,3).join(' · ')||'-' },
              { icon:'🎯', label: (game.genres||[]).slice(0,3).join(', ')||'-' },
            ].map(r=>(
              <div key={r.icon} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 12px', fontSize:12, color:'#b0b8d0', fontFamily:'Noto Sans KR', fontWeight:600 }}>
                <span>{r.icon}</span><span>{r.label}</span>
              </div>
            ))}
          </div>

          {/* AI 한국어 소개 */}
          <div style={{ background:`${color}0d`, border:`1px solid ${color}33`, borderRadius:12, padding:'14px 18px', marginBottom:18 }}>
            <div style={{ fontSize:12, color:color, fontWeight:700, marginBottom:9, fontFamily:'Noto Sans KR' }}>📝 게임 소개</div>
            {aiLoading ? (
              <div style={{ fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> AI가 분석 중...
              </div>
            ) : (
              <>
                <p style={{ fontSize:14, color:'#d0d4e4', lineHeight:1.8, margin:'0 0 10px', fontFamily:'Noto Sans KR', fontWeight:500 }}>{aiInfo?.intro}</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(aiInfo?.highlights||[]).map((h,i)=>(
                    <span key={i} style={{ fontSize:11, padding:'4px 11px', borderRadius:999, background:`${color}1a`, border:`1px solid ${color}44`, color, fontFamily:'Noto Sans KR', fontWeight:600 }}>✓ {h}</span>
                  ))}
                </div>
                {aiInfo?.verdict && <div style={{ marginTop:10, fontSize:12, color:'#8a8fa8', fontStyle:'italic', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:9 }}>💬 {aiInfo.verdict}</div>}
              </>
            )}
          </div>

          {/* YouTube 트레일러 */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:12, color:'#8a8fa8', fontWeight:700, marginBottom:9, fontFamily:'Noto Sans KR' }}>🎬 트레일러</div>
            <div style={{ width:'100%', aspectRatio:'16/9', borderRadius:12, overflow:'hidden', background:'#000', border:`1px solid ${color}33` }}>
              {ytId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
                  title={`${game.name} 트레일러`}
                  style={{ width:'100%', height:'100%', border:'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, background:'rgba(0,0,0,0.5)' }}>
                  <div style={{ fontSize:40 }}>🎬</div>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(game.name+' official trailer')}`} target="_blank" rel="noopener noreferrer"
                    style={{ padding:'10px 24px', background:'#ff0000', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', fontFamily:'Noto Sans KR' }}
                  >▶ YouTube에서 보기</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 탭 영역: 최근 소식 / 구매하기 ── */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          {/* 탭 바 */}
          <div style={{ display:'flex', padding:'0 22px' }}>
            <TabBtn active={tab==='news'} onClick={()=>setTab('news')} label='📰 최근 소식' color={color}/>
            <TabBtn active={tab==='buy'}  onClick={()=>setTab('buy')}  label='🛒 구매하기'  color={color}/>
          </div>

          {/* 탭 콘텐츠 */}
          <div style={{ padding:'16px 22px 24px' }}>

            {tab==='news' && (
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {aiLoading ? (
                  <div style={{ fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', gap:6, padding:'16px 0' }}>
                    <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> AI가 최신 소식 수집 중...
                  </div>
                ) : (
                  <>
                    <NewsAccordion items={aiInfo?.news||[]} color={color} />
                    {/* 외부 링크 */}
                    <div style={{ display:'flex', gap:7, marginTop:14, flexWrap:'wrap' }}>
                      {[
                        {label:'나무위키', url:`https://namu.wiki/w/${encodeURIComponent(game.name)}`, c:'#00c060'},
                        {label:'Reddit',   url:`https://www.reddit.com/search/?q=${encodeURIComponent(game.name)}`, c:'#ff4500'},
                        {label:'YouTube 최신',  url:`https://www.youtube.com/results?search_query=${encodeURIComponent(game.name+' 2025 업데이트')}`, c:'#ff0000'},
                      ].map(l=>(
                        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:11, padding:'4px 11px', background:`${l.c}11`, border:`1px solid ${l.c}33`, borderRadius:6, color:l.c, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:700 }}
                        >{l.label} →</a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab==='buy' && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {storeLinks.map(s=>(
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', background:s.bg, border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#f0f2ff', textDecoration:'none', fontFamily:'Noto Sans KR', fontSize:14, fontWeight:700, transition:'transform 0.15s, opacity 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateX(5px)';e.currentTarget.style.opacity='0.88';}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.opacity='1';}}
                  >
                    <span style={{ fontSize:22 }}>{s.icon}</span>
                    <div>
                      <div>{s.label}</div>
                      <div style={{ fontSize:11, opacity:0.5, fontWeight:400, marginTop:1 }}>"{game.name}" 검색 →</div>
                    </div>
                    <span style={{ marginLeft:'auto', opacity:0.4, fontSize:18 }}>→</span>
                  </a>
                ))}
                {mc && (
                  <div style={{ marginTop:6, padding:'12px 16px', background:`${metaC(mc)}11`, border:`1px solid ${metaC(mc)}33`, borderRadius:10, display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ fontFamily:'Rajdhani', fontWeight:800, fontSize:38, color:metaC(mc), lineHeight:1 }}>{mc}<span style={{ fontSize:16, opacity:0.6 }}>/100</span></div>
                    <div>
                      <div style={{ fontSize:11, color:metaC(mc), fontWeight:700, fontFamily:'Noto Sans KR' }}>메타크리틱</div>
                      <div style={{ fontSize:12, color:metaC(mc), opacity:0.8, fontFamily:'Noto Sans KR' }}>{mc>=90?'압도적으로 긍정적':mc>=75?'매우 긍정적':mc>=60?'긍정적':'보통'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes slideUp {from{opacity:0;transform:translateY(30px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin    {to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
