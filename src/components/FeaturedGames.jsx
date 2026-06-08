import { useState, useEffect } from 'react';
import { FEATURED_GAMES } from '../hooks/useRawgGames';
import { useApp } from '../store/AppContext';
import GameDetailModal from './GameDetailModal';

const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY || '';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'MOBA':'#c8a84b','Tactical':'#6ecbce','Battle Royale':'#ff4757',
};

// RAWG에서 게임 이미지 가져오기 (API 키 있을 때만)
async function fetchGameImage(rawgId) {
  if (!RAWG_KEY || !rawgId) return null;
  try {
    const r = await fetch(`https://api.rawg.io/api/games/${rawgId}?key=${RAWG_KEY}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d.background_image || null;
  } catch { return null; }
}

const TOP_GAMES = [...FEATURED_GAMES]
  .sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0))
  .slice(0, 5);

export default function FeaturedGames() {
  const { navigate }    = useApp();
  const [hovered,       setHovered]       = useState(null);
  const [selectedGame,  setSelectedGame]  = useState(null);
  // 런타임 이미지 상태: { [gameId]: url }
  const [liveImgs,      setLiveImgs]      = useState({});

  // API 키 있으면 각 게임 이미지 갱신
  useEffect(() => {
    if (!RAWG_KEY) return;
    TOP_GAMES.forEach(g => {
      if (!g.rawgId) return;
      fetchGameImage(g.rawgId).then(url => {
        if (url) setLiveImgs(prev => ({ ...prev, [g.id]: url }));
      });
    });
  }, []);

  const getImg = (g) => liveImgs[g.id] || g.img;

  return (
    <div style={{ marginBottom:28 }}>
      {selectedGame && <GameDetailModal game={selectedGame} onClose={() => setSelectedGame(null)} />}

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <span className="section-title">🏆 지금 가장 인기 있는 게임</span>
        <span
          onClick={() => navigate('games')}
          style={{ marginLeft:'auto', fontSize:12, color:'#4a9eff', cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:600 }}
        >전체 목록 →</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
        {TOP_GAMES.map((game, idx) => {
          const color  = game.color || '#4a9eff';
          const isHov  = hovered === game.id;
          const imgSrc = getImg(game);

          return (
            <div key={game.id}
              onMouseEnter={() => setHovered(game.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelectedGame(game)}
              style={{
                borderRadius:14, overflow:'hidden', cursor:'pointer',
                border:`1px solid ${isHov ? color+'88' : 'rgba(255,255,255,0.07)'}`,
                transform: isHov ? 'translateY(-6px) scale(1.02)' : 'none',
                boxShadow: isHov ? `0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px ${color}44` : '0 4px 16px rgba(0,0,0,0.2)',
                transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                animation:`fadeInUp 0.4s ${idx*0.07}s ease both`,
              }}
            >
              {/* 포스터 */}
              <div style={{ position:'relative', paddingBottom:'133%', overflow:'hidden', background:'#111' }}>
                <img
                  src={imgSrc}
                  alt={game.name}
                  style={{
                    position:'absolute', inset:0, width:'100%', height:'100%',
                    objectFit:'cover',
                    transition:'transform 0.4s ease',
                    transform: isHov ? 'scale(1.07)' : 'scale(1)',
                  }}
                  onError={e => {
                    if (game.imgFallback && e.currentTarget.src !== game.imgFallback) {
                      e.currentTarget.src = game.imgFallback;
                    }
                  }}
                />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}/>

                {/* 랭킹 */}
                <div style={{ position:'absolute', top:8, left:8, width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#f0c330,#c8a84b)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Rajdhani', fontWeight:700, fontSize:13, color:'#1a1200' }}>{idx+1}</div>

                {/* 메타크리틱 */}
                {game.metacritic && (
                  <div style={{ position:'absolute', top:8, right:8, background: game.metacritic>=75?'rgba(0,214,143,0.2)':'rgba(245,166,35,0.2)', border:`1px solid ${game.metacritic>=75?'rgba(0,214,143,0.5)':'rgba(245,166,35,0.5)'}`, borderRadius:6, padding:'2px 6px', fontFamily:'Rajdhani', fontWeight:700, fontSize:13, color: game.metacritic>=75?'#00d68f':'#f5a623', backdropFilter:'blur(4px)' }}>
                    {game.metacritic}
                  </div>
                )}

                {/* 장르 */}
                <div style={{ position:'absolute', bottom:8, left:8, right:8 }}>
                  <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:3 }}>
                    {game.genres.slice(0,2).map(g=>(
                      <span key={g} style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}33`:'rgba(255,255,255,0.1)', color:GENRE_COLOR[g]||'#c8cce0', border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.2)'}55`, fontWeight:700 }}>{g}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 하단 */}
              <div style={{ padding:'10px 10px 12px', background:'linear-gradient(160deg,#1c1e26,#14151e)', borderTop:`2px solid ${color}55` }}>
                <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:12, color:'#fff', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={game.name}>{game.name}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:2 }}>
                    {[1,2,3,4,5].map(s=>(<span key={s} style={{ fontSize:9, color: s<=Math.round(game.rating||0)?'#f0c330':'rgba(255,255,255,0.2)' }}>★</span>))}
                  </div>
                  <span style={{ fontSize:10, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>{game.released?.slice(0,4)}</span>
                </div>

                {/* 호버 시 */}
                <div style={{
                  maxHeight: isHov ? 36 : 0,
                  overflow:'hidden', transition:'max-height 0.3s ease, opacity 0.3s ease',
                  opacity: isHov ? 1 : 0, marginTop: isHov ? 8 : 0,
                }}>
                  <div style={{ padding:'5px 10px', background:`${color}22`, border:`1px solid ${color}55`, borderRadius:6, fontSize:11, color, fontFamily:'Noto Sans KR', fontWeight:700, textAlign:'center' }}>
                    🔍 상세 정보 보기
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
