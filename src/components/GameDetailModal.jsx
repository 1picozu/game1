import { useState, useEffect } from 'react';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'Simulation':'#a0d468','Fighting':'#c8a84b','Arcade':'#ff9ff3','Platformer':'#54a0ff',
  'Indie':'#5f27cd','Casual':'#00d2d3','Massively Multiplayer':'#00e5ff',
};
function gcolor(g=[]) { for(const x of g) if(GENRE_COLOR[x]) return GENRE_COLOR[x]; return '#4a9eff'; }
function metaColor(s) {
  if(s>=75) return {bg:'rgba(0,214,143,0.18)',border:'rgba(0,214,143,0.5)',text:'#00d68f'};
  if(s>=50) return {bg:'rgba(245,166,35,0.18)',border:'rgba(245,166,35,0.5)',text:'#f5a623'};
  return {bg:'rgba(255,71,87,0.18)',border:'rgba(255,71,87,0.5)',text:'#ff4757'};
}

function getStoreLinks(game) {
  const name = encodeURIComponent(game.name);
  const plats = (game.platforms||[]).join(' ').toLowerCase();
  const links = [];
  if (/pc|windows/i.test(plats) || game.genres?.some(g=>/Shooter|RPG|Strategy|Indie/i.test(g))) {
    links.push({ name:'Steam에서 구매', icon:'🟦', color:'#1b9aff', bg:'rgba(27,154,255,0.1)', url:`https://store.steampowered.com/search/?term=${name}` });
    links.push({ name:'Epic Games에서 구매', icon:'⬛', color:'#ffffff', bg:'rgba(255,255,255,0.06)', url:`https://store.epicgames.com/browse?q=${name}` });
  }
  if (/playstation|ps/i.test(plats)) links.push({ name:'PlayStation Store', icon:'🔵', color:'#003087', bg:'rgba(0,48,135,0.15)', url:`https://store.playstation.com/search/${name}` });
  if (/xbox/i.test(plats)) links.push({ name:'Xbox Store', icon:'🟢', color:'#107c10', bg:'rgba(16,124,16,0.12)', url:`https://www.xbox.com/games/all-games?q=${name}` });
  if (/nintendo|switch/i.test(plats)) links.push({ name:'Nintendo eShop', icon:'🔴', color:'#e60012', bg:'rgba(230,0,18,0.12)', url:`https://www.nintendo.com/search/?q=${name}` });
  if (links.length === 0) {
    links.push({ name:'Steam에서 구매', icon:'🟦', color:'#1b9aff', bg:'rgba(27,154,255,0.1)', url:`https://store.steampowered.com/search/?term=${name}` });
    links.push({ name:'Epic Games에서 구매', icon:'⬛', color:'#ffffff', bg:'rgba(255,255,255,0.06)', url:`https://store.epicgames.com/browse?q=${name}` });
  }
  return links;
}

async function fetchGameAIInfo(gameName) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        messages:[{ role:'user', content:
`게임 "${gameName}"에 대해 JSON 형식으로만 답하세요. 다른 텍스트 없이 JSON만:
{
  "description":"게임 소개 2~3문장(한국어)",
  "developer":"개발사",
  "publisher":"퍼블리셔",
  "features":["특징1","특징2","특징3"],
  "recentNews":["최근 업데이트/패치/소식 1","최근 업데이트/패치/소식 2","최근 이슈나 업데이트 3"],
  "youtubeQuery":"유튜브 공식 트레일러 검색어(영어)"
}` }]
      })
    });
    if(!res.ok) throw new Error('fail');
    const data = await res.json();
    const text = data.content?.map(c=>c.text||'').join('')||'';
    return JSON.parse(text.replace(/```json|```/g,'').trim());
  } catch {
    return {
      description:`${gameName}은(는) 전 세계 수많은 게이머들에게 사랑받는 타이틀입니다.`,
      developer:'정보 없음', publisher:'정보 없음',
      features:['멀티플레이 지원','정기 업데이트','글로벌 서버'],
      recentNews:['최근 패치 업데이트 적용','밸런스 개선 및 버그 수정','새로운 콘텐츠 추가'],
      youtubeQuery:`${gameName} official trailer 2025`,
    };
  }
}

export default function GameDetailModal({ game, onClose }) {
  const color   = gcolor(game.genres);
  const mc      = game.metacritic;
  const mcCol   = mc ? metaColor(mc) : null;
  const links   = getStoreLinks(game);

  const [aiInfo,    setAiInfo]    = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [tab,       setTab]       = useState('info');

  // 유튜브 검색 URL (임베드 X → YouTube 링크)
  const ytQuery = aiInfo?.youtubeQuery || `${game.name} official trailer`;
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`;

  // 유튜브 임베드용 검색 (nocookie)
  const [ytEmbedId, setYtEmbedId] = useState(null);
  const [ytLoading, setYtLoading] = useState(false);

  const platforms = [...new Set((game.platforms||[]).slice(0,6).map(p => {
    if(/pc|windows/i.test(p))          return '💻 PC';
    if(/playstation 5|ps5/i.test(p))   return '🎮 PS5';
    if(/playstation 4|ps4/i.test(p))   return '🎮 PS4';
    if(/xbox series/i.test(p))         return '🟢 Xbox Series';
    if(/xbox one/i.test(p))            return '🟢 Xbox One';
    if(/xbox/i.test(p))                return '🟢 Xbox';
    if(/nintendo|switch/i.test(p))     return '🔴 Switch';
    if(/mac/i.test(p))                 return '🍎 Mac';
    if(/android/i.test(p))             return '📱 Android';
    if(/ios|iphone/i.test(p))          return '📱 iOS';
    return p.slice(0,14);
  }))];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    fetchGameAIInfo(game.name).then(info => { setAiInfo(info); setAiLoading(false); });
    return () => { document.body.style.overflow = ''; };
  }, [game.name]);

  useEffect(() => {
    const fn = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const TAB = [
    { id:'info', label:'📋 게임 정보' },
    { id:'trailer', label:'🎬 트레일러' },
    { id:'news', label:'📰 최근 소식' },
    { id:'buy', label:'🛒 구매하기' },
  ];

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.92)',
      backdropFilter:'blur(10px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'16px', animation:'fadeIn 0.2s ease',
    }}>
      {/* 모달 — 화면을 크게 */}
      <div style={{
        width:'100%', maxWidth:1100,
        maxHeight:'94vh',
        background:'#0e0f17',
        borderRadius:20,
        border:`1px solid ${color}55`,
        boxShadow:`0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px ${color}22`,
        overflow:'hidden',
        display:'flex', flexDirection:'column',
        animation:'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* ── 히어로 영역 ── */}
        <div style={{ position:'relative', height:320, flexShrink:0, overflow:'hidden' }}>
          <img src={game.img} alt={game.name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={e=>{e.currentTarget.src=`https://picsum.photos/seed/${game.id}/1100/320`;}}
          />
          {/* 그라디언트 오버레이 */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(14,15,23,0.97) 100%)' }}/>

          {/* 닫기 */}
          <button onClick={onClose} style={{
            position:'absolute', top:16, right:16,
            width:38, height:38, borderRadius:'50%',
            background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.2)',
            color:'#fff', fontSize:18, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background 0.2s', zIndex:10,
          }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.6)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0.7)'}
          >✕</button>

          {/* 메타크리틱 — 크게 */}
          {mc && (
            <div style={{
              position:'absolute', top:16, left:16,
              background:mcCol.bg, border:`2px solid ${mcCol.border}`,
              borderRadius:14, padding:'10px 18px',
              backdropFilter:'blur(8px)', textAlign:'center',
            }}>
              <div style={{ fontFamily:'Rajdhani', fontWeight:800, fontSize:42, color:mcCol.text, lineHeight:1 }}>{mc}</div>
              <div style={{ fontSize:10, color:mcCol.text, opacity:0.85, letterSpacing:1.5, fontWeight:700 }}>METACRITIC</div>
            </div>
          )}

          {/* 타이틀 & 메타 */}
          <div style={{ position:'absolute', bottom:20, left:24, right:24 }}>
            <div style={{ display:'flex', gap:7, marginBottom:10, flexWrap:'wrap' }}>
              {game.genres?.slice(0,3).map(g=>(
                <span key={g} style={{ fontSize:11, padding:'3px 10px', borderRadius:5, background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}33`:'rgba(255,255,255,0.15)', color:GENRE_COLOR[g]||'#c8cce0', border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.2)'}55`, fontWeight:700, letterSpacing:0.5 }}>{g}</span>
              ))}
              {game.released && <span style={{ fontSize:11, padding:'3px 10px', borderRadius:5, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.15)' }}>📅 {game.released}</span>}
            </div>
            <h2 style={{ fontFamily:'Noto Sans KR', fontWeight:800, fontSize:32, color:'#fff', margin:0, lineHeight:1.2, textShadow:'0 2px 12px rgba(0,0,0,0.7)' }}>{game.name}</h2>
            {game.rating && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                <div style={{ display:'flex', gap:2 }}>
                  {[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:16, color: s<=Math.round(game.rating)?'#f0c330':'rgba(255,255,255,0.2)' }}>★</span>)}
                </div>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.7)', fontFamily:'Rajdhani', fontWeight:600 }}>{game.rating} / 5.0</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 탭 바 ── */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0, padding:'0 20px', background:'rgba(0,0,0,0.3)' }}>
          {TAB.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'14px 20px', background:'transparent', border:'none',
              borderBottom: tab===t.id ? `2px solid ${color}` : '2px solid transparent',
              color: tab===t.id ? '#f0f2ff' : '#6a6f88',
              fontSize:14, fontWeight: tab===t.id ? 700 : 500,
              cursor:'pointer', fontFamily:'Noto Sans KR',
              transition:'all 0.2s', marginBottom:-1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── 탭 콘텐츠 ── */}
        <div style={{ overflowY:'auto', flex:1, padding:'22px 24px 28px' }}>

          {/* 정보 탭 */}
          {tab === 'info' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
              {/* 좌 */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* 스탯 */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'출시일',   val: game.released||'미정' },
                    { label:'평점',     val: game.rating ? `⭐ ${game.rating}/5.0` : '-' },
                    { label:'개발사',   val: aiLoading?'...':(aiInfo?.developer||'-') },
                    { label:'퍼블리셔', val: aiLoading?'...':(aiInfo?.publisher||'-') },
                  ].map(r=>(
                    <div key={r.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:11, color:'#5a5f78', marginBottom:5, fontFamily:'Noto Sans KR' }}>{r.label}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf2', fontFamily:'Noto Sans KR' }}>{r.val}</div>
                    </div>
                  ))}
                </div>

                {/* 플랫폼 */}
                {platforms.length > 0 && (
                  <div>
                    <div style={{ fontSize:12, color:'#8a8fa8', fontWeight:700, marginBottom:9, fontFamily:'Noto Sans KR' }}>🖥️ 지원 플랫폼</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                      {platforms.map(p=>(
                        <span key={p} style={{ fontSize:12, padding:'5px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', color:'#e0e2f0', border:'1px solid rgba(255,255,255,0.12)', fontFamily:'Noto Sans KR', fontWeight:600 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 장르 */}
                {game.genres?.length > 0 && (
                  <div>
                    <div style={{ fontSize:12, color:'#8a8fa8', fontWeight:700, marginBottom:9, fontFamily:'Noto Sans KR' }}>🎯 장르</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                      {game.genres.map(g=>(
                        <span key={g} style={{ fontSize:12, padding:'5px 12px', borderRadius:8, background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}20`:'rgba(255,255,255,0.05)', color:GENRE_COLOR[g]||'#8a8fa8', border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.1)'}44`, fontFamily:'Noto Sans KR', fontWeight:600 }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 우 */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* 소개 */}
                <div style={{ background:`${color}0d`, border:`1px solid ${color}33`, borderRadius:12, padding:'16px 18px' }}>
                  <div style={{ fontSize:12, color, fontWeight:700, marginBottom:9, fontFamily:'Noto Sans KR' }}>📝 게임 소개</div>
                  {aiLoading ? (
                    <div style={{ fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>⟳</span> AI가 정보 수집 중...
                    </div>
                  ) : (
                    <p style={{ fontSize:14, color:'#ccd0e0', lineHeight:1.85, margin:0, fontFamily:'Noto Sans KR', fontWeight:500 }}>{aiInfo?.description}</p>
                  )}
                </div>

                {/* 주요 특징 */}
                {!aiLoading && aiInfo?.features && (
                  <div>
                    <div style={{ fontSize:12, color:'#8a8fa8', fontWeight:700, marginBottom:9, fontFamily:'Noto Sans KR' }}>✨ 주요 특징</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                      {aiInfo.features.map((f,i)=>(
                        <span key={i} style={{ fontSize:12, padding:'5px 12px', borderRadius:999, background:`${color}18`, border:`1px solid ${color}44`, color, fontFamily:'Noto Sans KR', fontWeight:600 }}>✓ {f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 트레일러 탭 */}
          {tab === 'trailer' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* 유튜브 임베드 영역 */}
              <div style={{
                width:'100%', aspectRatio:'16/9',
                background:'#000', borderRadius:14, overflow:'hidden',
                border:`1px solid ${color}44`,
                position:'relative',
              }}>
                {ytEmbedId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ytEmbedId}?autoplay=1&rel=0`}
                    title={`${game.name} trailer`}
                    style={{ width:'100%', height:'100%', border:'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  /* 임베드 ID 없을 때 → 게임 이미지 + YouTube 버튼 */
                  <div style={{ position:'relative', width:'100%', height:'100%' }}>
                    <img src={game.img} alt={game.name} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.4 }} onError={e=>{e.currentTarget.style.display='none';}} />
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                      <div style={{ fontSize:48 }}>🎬</div>
                      <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:16, color:'#fff', textAlign:'center' }}>
                        {game.name} 공식 트레일러
                      </div>
                      <a href={ytSearchUrl} target="_blank" rel="noopener noreferrer" style={{
                        display:'inline-flex', alignItems:'center', gap:10,
                        padding:'12px 28px', background:'#ff0000', border:'none',
                        borderRadius:10, color:'#fff', fontSize:15, fontWeight:700,
                        textDecoration:'none', fontFamily:'Noto Sans KR',
                        boxShadow:'0 4px 20px rgba(255,0,0,0.4)',
                        transition:'transform 0.15s',
                      }}
                      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                      >▶ YouTube에서 트레일러 보기</a>
                    </div>
                  </div>
                )}
              </div>

              {/* YouTube 검색 링크 */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[
                  { label:'공식 트레일러', q:`${game.name} official trailer` },
                  { label:'게임플레이 영상', q:`${game.name} gameplay` },
                  { label:'리뷰 영상', q:`${game.name} review` },
                ].map(item => (
                  <a key={item.label} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.q)}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', background:'rgba(255,0,0,0.1)', border:'1px solid rgba(255,0,0,0.3)', borderRadius:8, color:'#ff6b6b', textDecoration:'none', fontSize:13, fontFamily:'Noto Sans KR', fontWeight:600, transition:'background 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,0,0,0.2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,0,0,0.1)'}
                  >▶ {item.label}</a>
                ))}
              </div>
            </div>
          )}

          {/* 최근 소식 탭 */}
          {tab === 'news' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>🤖 AI가 수집한 최신 정보</div>

              {aiLoading ? (
                <div style={{ textAlign:'center', padding:'50px 0' }}>
                  <span style={{ fontSize:32, display:'block', marginBottom:12, animation:'spin 1s linear infinite' }}>⟳</span>
                  <div style={{ fontSize:13, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>AI가 최신 정보를 수집하고 있습니다...</div>
                </div>
              ) : (
                <>
                  {/* 최근 소식 3개 */}
                  {(aiInfo?.recentNews||[]).map((news, i) => (
                    <div key={i} style={{ background:'rgba(74,158,255,0.06)', border:`1px solid rgba(74,158,255,0.2)`, borderRadius:12, padding:'16px 20px', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(74,158,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, marginTop:1 }}>
                        {i===0?'📌':i===1?'🔔':'📢'}
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:'#4a9eff', fontWeight:700, marginBottom:5, fontFamily:'Noto Sans KR' }}>최근 소식 {i+1}</div>
                        <p style={{ fontSize:14, color:'#ccd0e0', lineHeight:1.75, margin:0, fontFamily:'Noto Sans KR', fontWeight:500 }}>{news}</p>
                      </div>
                    </div>
                  ))}

                  {/* 외부 링크 */}
                  <div>
                    <div style={{ fontSize:12, color:'#8a8fa8', fontWeight:700, marginBottom:10, fontFamily:'Noto Sans KR' }}>🔗 더 알아보기</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        { label:'YouTube 최신 영상',    url:`https://www.youtube.com/results?search_query=${encodeURIComponent(game.name+' 2025')}`,                       color:'#ff0000', icon:'▶' },
                        { label:'나무위키 게임 정보',   url:`https://namu.wiki/w/${encodeURIComponent(game.name)}`,                                                           color:'#00c060', icon:'📖' },
                        { label:'Reddit 커뮤니티',      url:`https://www.reddit.com/search/?q=${encodeURIComponent(game.name)}`,                                              color:'#ff4500', icon:'🔴' },
                        { label:'RAWG 공식 정보',       url:`https://rawg.io/games/${encodeURIComponent(game.name.toLowerCase().replace(/\s/g,'-'))}`,                        color:'#4a9eff', icon:'🎮' },
                      ].map(l=>(
                        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                          display:'flex', alignItems:'center', gap:12,
                          padding:'13px 18px', background:`${l.color}0d`,
                          border:`1px solid ${l.color}33`, borderRadius:10,
                          color:'#e8eaf2', textDecoration:'none', fontFamily:'Noto Sans KR',
                          fontSize:13, fontWeight:600, transition:'background 0.2s',
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background=`${l.color}1e`}
                        onMouseLeave={e=>e.currentTarget.style.background=`${l.color}0d`}
                        >
                          <span style={{ color:l.color, fontSize:18 }}>{l.icon}</span>
                          {l.label}
                          <span style={{ marginLeft:'auto', color:'#5a5f78', fontSize:14 }}>→</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 구매 탭 */}
          {tab === 'buy' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>
                플랫폼에 맞는 스토어에서 구매하세요. 링크는 검색 결과로 연결됩니다.
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {links.map(s=>(
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                    display:'flex', alignItems:'center', gap:16,
                    padding:'18px 22px',
                    background:s.bg, border:`1px solid rgba(255,255,255,0.12)`,
                    borderRadius:13, color:'#f0f2ff', textDecoration:'none',
                    fontFamily:'Noto Sans KR', fontSize:16, fontWeight:700,
                    transition:'transform 0.15s, opacity 0.15s',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateX(6px)';e.currentTarget.style.opacity='0.9';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.opacity='1';}}
                  >
                    <span style={{ fontSize:26 }}>{s.icon}</span>
                    <div>
                      <div>{s.name}</div>
                      <div style={{ fontSize:12, opacity:0.6, fontWeight:400, marginTop:2 }}>"{game.name}" 검색하기 →</div>
                    </div>
                    <span style={{ marginLeft:'auto', opacity:0.5, fontSize:20 }}>→</span>
                  </a>
                ))}
              </div>
              {mc && (
                <div style={{ marginTop:8, padding:'16px 20px', background:mcCol.bg, border:`1px solid ${mcCol.border}`, borderRadius:14 }}>
                  <div style={{ fontSize:12, color:mcCol.text, fontWeight:700, fontFamily:'Noto Sans KR', marginBottom:5 }}>메타크리틱 평점</div>
                  <div style={{ fontFamily:'Rajdhani', fontWeight:800, fontSize:48, color:mcCol.text, lineHeight:1 }}>
                    {mc}<span style={{ fontSize:22, opacity:0.7 }}>/100</span>
                  </div>
                  <div style={{ fontSize:13, color:mcCol.text, opacity:0.85, marginTop:5, fontFamily:'Noto Sans KR' }}>
                    {mc>=90?'압도적으로 긍정적':mc>=75?'매우 긍정적':mc>=60?'긍정적':'보통'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(40px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
