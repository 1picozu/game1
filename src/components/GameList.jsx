import { useEffect, useRef, useState, useCallback } from 'react';
import GameDetailModal from './GameDetailModal';
import { useRawgGames, searchGamesAPI } from '../hooks/useRawgGames';
import SkeletonCard from './SkeletonCard';
import OfflineToast from './OfflineToast';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'Simulation':'#a0d468','Fighting':'#c8a84b','Arcade':'#ff9ff3','Platformer':'#54a0ff',
  'Indie':'#5f27cd','Casual':'#00d2d3','Card':'#ff9f43','Massively Multiplayer':'#00e5ff',
};
function getGenreColor(genres=[]) { for(const g of genres) if(GENRE_COLOR[g]) return GENRE_COLOR[g]; return '#4a9eff'; }
function metaColor(s) {
  if(s>=75) return {bg:'rgba(0,214,143,0.18)',border:'rgba(0,214,143,0.5)',text:'#00d68f'};
  if(s>=50) return {bg:'rgba(245,166,35,0.18)',border:'rgba(245,166,35,0.5)',text:'#f5a623'};
  return {bg:'rgba(255,71,87,0.18)',border:'rgba(255,71,87,0.5)',text:'#ff4757'};
}

const STORE_LINKS = [
  { name:'Steam',   icon:'🟦', color:'#1b2838', textColor:'#c7d5e0', url:(n)=>`https://store.steampowered.com/search/?term=${encodeURIComponent(n)}` },
  { name:'Epic',    icon:'⬛', color:'#2d2d2d', textColor:'#fff',    url:(n)=>`https://store.epicgames.com/browse?q=${encodeURIComponent(n)}` },
  { name:'블리자드', icon:'💙', color:'#00aeff', textColor:'#fff',    url:(n)=>`https://us.battle.net/shop/en/catalog?f.productTypes=game&q=${encodeURIComponent(n)}` },
  { name:'GOG',     icon:'🟣', color:'#6d318b', textColor:'#fff',    url:(n)=>`https://www.gog.com/games?search=${encodeURIComponent(n)}` },
];

const CATEGORIES = [
  { id:'all',       label:'전체',      icon:'🎮', filter:()=>true },
  { id:'fps',       label:'FPS',       icon:'🔫', filter:(g)=>g.genres.some(x=>/Shooter/i.test(x)) },
  { id:'rpg',       label:'RPG',       icon:'⚔️',  filter:(g)=>g.genres.some(x=>/RPG/i.test(x)) },
  { id:'multi',     label:'멀티플레이', icon:'👥', filter:(g)=>g.genres.some(x=>/Massively Multiplayer/i.test(x)) },
  { id:'action',    label:'액션',      icon:'💥', filter:(g)=>g.genres.some(x=>/Action/i.test(x)) },
  { id:'strategy',  label:'전략',      icon:'🧠', filter:(g)=>g.genres.some(x=>/Strategy/i.test(x)) },
  { id:'adventure', label:'어드벤처',  icon:'🗺️',  filter:(g)=>g.genres.some(x=>/Adventure/i.test(x)) },
  { id:'sports',    label:'스포츠',    icon:'⚽', filter:(g)=>g.genres.some(x=>/Sports|Racing/i.test(x)) },
  { id:'indie',     label:'인디',      icon:'🎨', filter:(g)=>g.genres.some(x=>/Indie/i.test(x)) },
];

function getGameTags(game) {
  const tags = [];
  const name = (game.name||'').toLowerCase();
  const genres = game.genres||[];
  if (genres.some(g=>/Shooter/i.test(g))) tags.push({ label:'FPS', color:'#f5a623' });
  if (genres.some(g=>/RPG/i.test(g))) tags.push({ label:'RPG', color:'#7c5cfc' });
  if (genres.some(g=>/Massively Multiplayer/i.test(g))) tags.push({ label:'멀티', color:'#00d68f' });
  if (genres.some(g=>/Action/i.test(g)) && !tags.find(t=>t.label==='FPS')) tags.push({ label:'액션', color:'#ff4757' });
  if (genres.some(g=>/Strategy/i.test(g))) tags.push({ label:'전략', color:'#4a9eff' });
  if (genres.some(g=>/Adventure/i.test(g))) tags.push({ label:'어드벤처', color:'#00d68f' });
  if (genres.some(g=>/Indie/i.test(g))) tags.push({ label:'인디', color:'#5f27cd' });
  if (/multiplayer|online|warzone|apex|fortnite|pubg|overwatch|valorant/i.test(name))
    if (!tags.find(t=>t.label==='멀티')) tags.push({ label:'멀티', color:'#00d68f' });
  return tags.slice(0, 3);
}

// ── 구매 링크 버튼 ───────────────────────────────────────────────────
function StoreButtons({ gameName }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginTop:8 }} onClick={e=>e.stopPropagation()}>
      <button onClick={()=>setExpanded(e=>!e)}
        style={{ width:'100%', padding:'6px 8px', background:'rgba(74,158,255,0.12)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:6, color:'#4a9eff', fontSize:10, fontFamily:'Noto Sans KR', cursor:'pointer', fontWeight:600 }}>
        🛒 구매 링크 {expanded?'▲':'▼'}
      </button>
      {expanded && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:4 }}>
          {STORE_LINKS.map(s=>(
            <a key={s.name} href={s.url(gameName)} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 7px', background:s.color+'33', border:`1px solid ${s.color}55`, borderRadius:5, color:s.textColor, fontSize:10, fontFamily:'Noto Sans KR', textDecoration:'none', fontWeight:600 }}>
              {s.icon} {s.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 3D 플립 카드 ────────────────────────────────────────────────────
function FlipCard({ game, idx, onSelect }) {
  const [flipped, setFlipped] = useState(false);
  const color = getGenreColor(game.genres);
  const mc    = game.metacritic;
  const mcCol = mc ? metaColor(mc) : null;
  const tags  = getGameTags(game);
  const platforms = (game.platforms||[]).slice(0,4).map(p=>{
    if(/pc|windows/i.test(p)) return '💻 PC';
    if(/playstation|ps/i.test(p)) return '🎮 PS';
    if(/xbox/i.test(p)) return '🟢 Xbox';
    if(/nintendo|switch/i.test(p)) return '🔴 Switch';
    if(/mac/i.test(p)) return '🍎 Mac';
    if(/android|ios|mobile/i.test(p)) return '📱 모바일';
    return p.slice(0,10);
  });
  return (
    <div onClick={()=>{ if(!flipped){ onSelect && onSelect(game); } else { setFlipped(false); } }} title="클릭하면 상세정보 보기"
      style={{ perspective:900, cursor:'pointer', animation:'fadeInUp 0.4s ease both', animationDelay:`${(idx%20)*0.03}s` }}>
      <div style={{ position:'relative', width:'100%', paddingBottom:'170%', transformStyle:'preserve-3d',
        transform:flipped?'rotateY(180deg)':'rotateY(0deg)', transition:'transform 0.6s cubic-bezier(0.4,0.2,0.2,1)' }}>
        {/* 앞면 */}
        <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
          borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)', boxShadow:flipped?'none':'0 4px 20px rgba(0,0,0,0.3)' }}>
          <img src={game.img} alt={game.name} loading="lazy" decoding="async"
            style={{ width:'100%', height:'65%', objectFit:'cover', display:'block' }}
            onError={e=>{e.currentTarget.src=`https://picsum.photos/seed/${game.id}/200/280`;}}/>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'65%', background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)', pointerEvents:'none' }}>
            {mc && <div style={{ position:'absolute', top:8, right:8, background:mcCol.bg, border:`1px solid ${mcCol.border}`, borderRadius:6, padding:'3px 7px', display:'flex', flexDirection:'column', alignItems:'center', backdropFilter:'blur(6px)' }}>
              <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:15, color:mcCol.text, lineHeight:1 }}>{mc}</span>
              <span style={{ fontSize:7, color:mcCol.text, opacity:0.8 }}>META</span>
            </div>}
            {tags.length>0 && <div style={{ position:'absolute', top:8, left:8, display:'flex', flexDirection:'column', gap:3 }}>
              {tags.slice(0,2).map(tag=>(
                <span key={tag.label} style={{ fontSize:9, fontWeight:700, background:tag.color+'33', border:`1px solid ${tag.color}66`, color:tag.color, borderRadius:4, padding:'2px 5px', fontFamily:'Rajdhani', textTransform:'uppercase', backdropFilter:'blur(4px)' }}>{tag.label}</span>
              ))}
            </div>}
          </div>
          <div style={{ height:'35%', background:'#161824', borderTop:`2px solid ${color}44`, display:'flex', flexDirection:'column', justifyContent:'center', padding:'6px 10px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#e2e4ed', fontFamily:'Noto Sans KR', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }} title={game.name}>{game.name}</div>
            {game.released && <div style={{ fontSize:9, color:'#5a5f78', fontFamily:'Noto Sans KR', marginBottom:3 }}>📅 {game.released}</div>}
            {game.rating && <div style={{ position:'relative', height:3, background:'rgba(255,255,255,0.08)', borderRadius:999, marginBottom:4 }}>
              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(game.rating/5)*100}%`, background:color, borderRadius:999 }}/>
            </div>}
            <StoreButtons gameName={game.name}/>
          </div>
        </div>
        {/* 뒷면 */}
        <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
          transform:'rotateY(180deg)', borderRadius:12, overflow:'hidden',
          background:'linear-gradient(160deg,#161824 0%,#0e1020 100%)', border:`1px solid ${color}44`,
          padding:'16px 14px', display:'flex', flexDirection:'column', gap:8, overflowY:'auto' }}>
          <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:13, color:'#e2e4ed', lineHeight:1.4 }}>{game.name}</div>
          {tags.length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {tags.map(tag=>(
              <span key={tag.label} style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:tag.color+'22', color:tag.color, border:`1px solid ${tag.color}44`, fontFamily:'Rajdhani', fontWeight:700 }}>{tag.label}</span>
            ))}
          </div>}
          {mc && <div style={{ background:mcCol.bg, border:`1px solid ${mcCol.border}`, borderRadius:6, padding:'4px 10px', fontFamily:'Rajdhani', fontWeight:700, fontSize:18, color:mcCol.text, width:'fit-content' }}>{mc} <span style={{ fontSize:10, opacity:0.8 }}>META</span></div>}
          {game.released && <div style={{ fontSize:11, color:'#c8cce0', fontFamily:'Noto Sans KR', fontWeight:600 }}>📅 {game.released}</div>}
          {game.genres.length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {game.genres.slice(0,4).map(g=>(
              <span key={g} style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}22`:'rgba(255,255,255,0.06)', color:GENRE_COLOR[g]||'#8a8fa8', border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.1)'}44` }}>{g}</span>
            ))}
          </div>}
          {platforms.length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
            {[...new Set(platforms)].map(p=>(
              <span key={p} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(255,255,255,0.05)', color:'#c8cce0', border:'1px solid rgba(255,255,255,0.1)' }}>{p}</span>
            ))}
          </div>}
          <div onClick={e=>e.stopPropagation()} style={{ marginTop:'auto' }}>
            <div style={{ fontSize:10, color:'#5a5f78', marginBottom:5, fontFamily:'Noto Sans KR' }}>🛒 구매하기</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
              {STORE_LINKS.map(s=>(
                <a key={s.name} href={s.url(game.name)} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 7px', background:s.color+'33', border:`1px solid ${s.color}55`, borderRadius:5, color:s.textColor, fontSize:10, fontFamily:'Noto Sans KR', textDecoration:'none', fontWeight:600 }}>
                  {s.icon} {s.name}
                </a>
              ))}
            </div>
          </div>
          <div style={{ fontSize:10, color:'#3a3d52', textAlign:'center' }}>↩ 다시 클릭하면 앞면</div>
        </div>
      </div>
    </div>
  );
}

// ── 카테고리 바 ──────────────────────────────────────────────────────
function CategoryBar({ selected, onSelect, gameCounts }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
      {CATEGORIES.map(cat=>(
        <button key={cat.id} onClick={()=>onSelect(cat.id)}
          style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontFamily:'Noto Sans KR', cursor:'pointer',
            fontWeight:selected===cat.id?700:400,
            background:selected===cat.id?'linear-gradient(135deg,#7c5cfc,#4a9eff)':'rgba(255,255,255,0.04)',
            border:selected===cat.id?'1px solid transparent':'1px solid rgba(255,255,255,0.1)',
            color:selected===cat.id?'#fff':'#8a8fa8', transition:'all 0.2s' }}>
          {cat.icon} {cat.label}
          {gameCounts[cat.id]!==undefined && <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>({gameCounts[cat.id]})</span>}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── AI 설문형 추천 모달 ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
const SURVEY_STEPS = [
  {
    id: 'genre',
    question: '🎮 어떤 장르를 좋아하세요?',
    multi: true,
    options: [
      { label:'FPS / 슈터', value:'fps', icon:'🔫' },
      { label:'RPG',        value:'rpg', icon:'⚔️' },
      { label:'액션',       value:'action', icon:'💥' },
      { label:'전략',       value:'strategy', icon:'🧠' },
      { label:'어드벤처',   value:'adventure', icon:'🗺️' },
      { label:'멀티플레이', value:'multi', icon:'👥' },
      { label:'인디',       value:'indie', icon:'🎨' },
      { label:'스포츠',     value:'sports', icon:'⚽' },
    ],
  },
  {
    id: 'mood',
    question: '😤 지금 기분은?',
    multi: false,
    options: [
      { label:'긴장감 넘치게', value:'intense', icon:'⚡' },
      { label:'느긋하게',      value:'chill',   icon:'🌊' },
      { label:'스토리 빠져들고 싶어', value:'story', icon:'📖' },
      { label:'친구랑 같이', value:'social', icon:'👫' },
    ],
  },
  {
    id: 'platform',
    question: '💻 어떤 플랫폼?',
    multi: false,
    options: [
      { label:'PC',          value:'pc',      icon:'💻' },
      { label:'PlayStation', value:'ps',      icon:'🎮' },
      { label:'Xbox',        value:'xbox',    icon:'🟢' },
      { label:'Switch',      value:'switch',  icon:'🔴' },
      { label:'상관없음',    value:'any',     icon:'✨' },
    ],
  },
  {
    id: 'era',
    question: '📅 출시 시기 선호는?',
    multi: false,
    options: [
      { label:'최신 (2022~)',   value:'new',    icon:'🆕' },
      { label:'근작 (2018~21)', value:'recent', icon:'🕹️' },
      { label:'명작 (언제든)',  value:'classic', icon:'🏆' },
    ],
  },
];

function matchScore(game, answers) {
  let score = 0;
  const name = (game.name||'').toLowerCase();
  const genres = game.genres||[];
  const platforms = (game.platforms||[]).join(' ').toLowerCase();
  const released = game.released || '';
  const year = released ? parseInt(released.slice(0,4)) : 0;

  // 장르 매칭
  const genreMap = {
    fps:      ()=>genres.some(g=>/Shooter/i.test(g)),
    rpg:      ()=>genres.some(g=>/RPG/i.test(g)),
    action:   ()=>genres.some(g=>/Action/i.test(g)),
    strategy: ()=>genres.some(g=>/Strategy/i.test(g)),
    adventure:()=>genres.some(g=>/Adventure/i.test(g)),
    multi:    ()=>genres.some(g=>/Massively Multiplayer/i.test(g)) || /multiplayer|online/i.test(name),
    indie:    ()=>genres.some(g=>/Indie/i.test(g)),
    sports:   ()=>genres.some(g=>/Sports|Racing/i.test(g)),
  };
  const selectedGenres = answers.genre || [];
  selectedGenres.forEach(v => { if (genreMap[v]?.()) score += 3; });

  // 기분 매칭
  const mood = answers.mood;
  if (mood === 'intense') { if (genres.some(g=>/Action|Shooter/i.test(g))) score += 2; }
  if (mood === 'chill')   { if (genres.some(g=>/Puzzle|Simulation|Casual|Indie/i.test(g))) score += 2; }
  if (mood === 'story')   { if (genres.some(g=>/RPG|Adventure/i.test(g))) score += 2; }
  if (mood === 'social')  { if (genres.some(g=>/Massively Multiplayer/i.test(g)) || /multiplayer/i.test(name)) score += 2; }

  // 플랫폼 매칭
  const plat = answers.platform;
  if (plat === 'pc'  && /pc|windows/i.test(platforms)) score += 1;
  if (plat === 'ps'  && /playstation/i.test(platforms)) score += 1;
  if (plat === 'xbox'&& /xbox/i.test(platforms)) score += 1;
  if (plat === 'switch'&& /nintendo|switch/i.test(platforms)) score += 1;
  if (plat === 'any') score += 1;

  // 출시 시기
  const era = answers.era;
  if (era === 'new'    && year >= 2022) score += 2;
  if (era === 'recent' && year >= 2018 && year <= 2021) score += 2;
  if (era === 'classic') score += 1; // 아무 때나 보너스

  // 메타크리틱 보너스
  if (game.metacritic >= 85) score += 2;
  else if (game.metacritic >= 75) score += 1;

  return score;
}

function AIRecommendModal({ games, onClose }) {
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [cursor,  setCursor]  = useState(0); // 현재 보여주는 게임 인덱스
  const [passedIds, setPassedIds] = useState(new Set());
  const SHOW_COUNT = 6; // 한 번에 보여줄 게임 수

  const current = SURVEY_STEPS[step];

  const toggleOption = (val) => {
    if (current.multi) {
      setAnswers(a => {
        const prev = a[current.id] || [];
        return { ...a, [current.id]: prev.includes(val) ? prev.filter(x=>x!==val) : [...prev, val] };
      });
    } else {
      setAnswers(a => ({ ...a, [current.id]: val }));
    }
  };

  const canNext = current.multi
    ? (answers[current.id]||[]).length > 0
    : !!answers[current.id];

  const handleNext = () => {
    if (step < SURVEY_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      // 결과 계산
      const scored = games
        .map(g => ({ game:g, score:matchScore(g, answers) }))
        .filter(x => x.score > 0)
        .sort((a,b) => b.score - a.score)
        .map(x => x.game);
      setResults(scored);
      setCursor(0);
      setPassedIds(new Set());
    }
  };

  const handlePass = () => {
    // 현재 보이는 게임들을 패스 목록에 추가
    const visible = visibleGames();
    setPassedIds(prev => {
      const next = new Set(prev);
      visible.forEach(g => next.add(g.id));
      return next;
    });
    setCursor(c => c + SHOW_COUNT);
  };

  const visibleGames = useCallback(() => {
    if (!results) return [];
    const filtered = results.filter(g => !passedIds.has(g.id));
    return filtered.slice(cursor, cursor + SHOW_COUNT);
  }, [results, cursor, passedIds]);

  const remaining = results ? results.filter(g => !passedIds.has(g.id)).length - Math.min(SHOW_COUNT, results.filter(g => !passedIds.has(g.id)).length) : 0;
  const shown = visibleGames();

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(6px)' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#151720', border:'1px solid rgba(124,92,252,0.3)', borderRadius:16, width:'100%', maxWidth: results ? 900 : 520, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.6)', animation:'fadeInUp 0.3s ease' }}>

        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0', marginBottom:4 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR' }}>🤖 AI 게임 추천</div>
            {!results && <div style={{ fontSize:12, color:'#5a5f78', marginTop:2, fontFamily:'Noto Sans KR' }}>
              {step+1} / {SURVEY_STEPS.length} 단계
            </div>}
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#5a5f78', fontSize:20, cursor:'pointer', padding:4 }}>✕</button>
        </div>

        {/* 진행 바 */}
        {!results && (
          <div style={{ margin:'12px 24px', height:3, background:'rgba(255,255,255,0.06)', borderRadius:999 }}>
            <div style={{ height:'100%', width:`${((step+1)/SURVEY_STEPS.length)*100}%`, background:'linear-gradient(90deg,#7c5cfc,#4a9eff)', borderRadius:999, transition:'width 0.4s ease' }}/>
          </div>
        )}

        <div style={{ padding:'16px 24px 24px' }}>

          {/* ── 설문 단계 ── */}
          {!results && (
            <>
              <div style={{ fontSize:16, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR', marginBottom:16 }}>{current.question}</div>
              {current.multi && <div style={{ fontSize:11, color:'#5a5f78', marginBottom:12, fontFamily:'Noto Sans KR' }}>복수 선택 가능</div>}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:10, marginBottom:24 }}>
                {current.options.map(opt => {
                  const sel = current.multi
                    ? (answers[current.id]||[]).includes(opt.value)
                    : answers[current.id] === opt.value;
                  return (
                    <button key={opt.value} onClick={()=>toggleOption(opt.value)}
                      style={{ padding:'14px 12px', borderRadius:10, cursor:'pointer', textAlign:'center', fontFamily:'Noto Sans KR', transition:'all 0.2s',
                        background: sel ? 'linear-gradient(135deg,rgba(124,92,252,0.3),rgba(74,158,255,0.3))' : 'rgba(255,255,255,0.04)',
                        border: sel ? '1px solid rgba(124,92,252,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        color: sel ? '#c8b4ff' : '#8a8fa8',
                        transform: sel ? 'scale(1.03)' : 'scale(1)' }}>
                      <div style={{ fontSize:24, marginBottom:6 }}>{opt.icon}</div>
                      <div style={{ fontSize:13, fontWeight: sel ? 700 : 400 }}>{opt.label}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                {step > 0
                  ? <button onClick={()=>setStep(s=>s-1)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#8a8fa8', padding:'10px 20px', cursor:'pointer', fontFamily:'Noto Sans KR', fontSize:13 }}>← 이전</button>
                  : <div/>}
                <button onClick={handleNext} disabled={!canNext}
                  style={{ background: canNext ? 'linear-gradient(135deg,#7c5cfc,#4a9eff)' : 'rgba(255,255,255,0.06)', border:'none', borderRadius:8, color: canNext ? '#fff' : '#3a3d52', padding:'10px 28px', cursor: canNext ? 'pointer' : 'not-allowed', fontFamily:'Noto Sans KR', fontSize:14, fontWeight:700, transition:'all 0.2s' }}>
                  {step < SURVEY_STEPS.length - 1 ? '다음 →' : '✨ 추천 받기'}
                </button>
              </div>
            </>
          )}

          {/* ── 결과 ── */}
          {results && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR' }}>
                  ✨ 취향 맞춤 추천 <span style={{ color:'#7c5cfc' }}>{results.length}개</span>
                </div>
                <button onClick={()=>{ setResults(null); setStep(0); setAnswers({}); }}
                  style={{ background:'rgba(124,92,252,0.12)', border:'1px solid rgba(124,92,252,0.3)', borderRadius:8, color:'#9b7ffe', padding:'6px 14px', cursor:'pointer', fontFamily:'Noto Sans KR', fontSize:12 }}>
                  🔄 다시 설문
                </button>
              </div>

              {shown.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>😅</div>
                  더 이상 추천할 게임이 없어요. 설문을 다시 해보세요!
                </div>
              ) : (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:14, marginBottom:20 }}>
                    {shown.map((game, idx) => <FlipCard key={game.id} game={game} idx={idx} onSelect={setSelectedGame}/>)}
                  </div>

                  <div style={{ display:'flex', justifyContent:'center', gap:12, alignItems:'center' }}>
                    <button onClick={handlePass}
                      style={{ padding:'10px 28px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#8a8fa8', fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:600, transition:'all 0.2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#e2e4ed';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#8a8fa8';}}>
                      😐 패스 — 다른 게임 보기
                    </button>
                    {remaining > 0 && (
                      <span style={{ fontSize:12, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>남은 게임 {remaining}개</span>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── 메인 GameList ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
export default function GameList({ fullPage=false }) {
  const { games, loading, loadingMore, offline, totalCount, loadedCount, done } = useRawgGames();

  const [category,   setCategory]   = useState('all');
  const [selectedGame, setSelectedGame] = useState(null);
  const [search,     setSearch]     = useState('');
  const [showAI,     setShowAI]     = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null=미검색, []=검색중/결과없음
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef(null);

  const pool = fullPage ? games : games.slice(0, 10);

  const catFilter = CATEGORIES.find(c=>c.id===category)?.filter ?? (()=>true);

  // 검색 중이면 searchResults, 아니면 pool에서 카테고리 필터
  const baseGames = searchResults !== null ? searchResults : pool;
  const displayGames = baseGames.filter(g => {
    if (searchResults === null && category !== 'all' && !catFilter(g)) return false;
    return true;
  });

  // 검색어 변경 시 디바운스 처리
  const handleSearchChange = (val) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    // 1) 먼저 로컬에서 즉시 필터
    const localHits = pool.filter(g =>
      g.name.toLowerCase().includes(val.toLowerCase()) ||
      g.genres.some(gr=>gr.toLowerCase().includes(val.toLowerCase()))
    );
    setSearchResults(localHits);
    // 2) 500ms 후 API 검색으로 보완
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      const apiResults = await searchGamesAPI(val);
      // 로컬 + API 결과 합치고 중복 제거
      const merged = [...localHits];
      const ids = new Set(localHits.map(g=>g.id));
      apiResults.forEach(g=>{ if(!ids.has(g.id)){ merged.push(g); ids.add(g.id); }});
      setSearchResults(merged);
      setSearchLoading(false);
    }, 500);
  };

  const gameCounts = {};
  CATEGORIES.forEach(cat => {
    gameCounts[cat.id] = cat.id==='all' ? pool.length : pool.filter(cat.filter).length;
  });

  const progressPct = loadedCount > 0 ? Math.min(Math.round((loadedCount/1000)*100),100) : 0;

  return (
    <>
      <OfflineToast show={offline}/>
      {selectedGame && <GameDetailModal game={selectedGame} onClose={()=>setSelectedGame(null)}/>}
      {showAI && <AIRecommendModal games={pool} onClose={()=>setShowAI(false)}/>}

      <div className="card p-5 mb-8">
        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
          <span className="section-title">{fullPage?'전체 게임 목록':'이달의 인기 게임'}</span>
          {offline
            ? <span style={{ fontSize:11, background:'rgba(245,166,35,0.12)', color:'#f5a623', border:'1px solid rgba(245,166,35,0.3)', padding:'2px 8px', borderRadius:999 }}>오프라인 모드</span>
            : <span style={{ fontSize:11, background:'rgba(74,158,255,0.1)', color:'#4a9eff', border:'1px solid rgba(74,158,255,0.25)', padding:'2px 8px', borderRadius:999 }}>RAWG API</span>
          }
          {totalCount>0 && <span style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>총 {totalCount.toLocaleString()}개</span>}
          <span style={{ marginLeft:'auto', fontSize:11, color:done?'#00d68f':'#4a9eff', fontFamily:'Noto Sans KR', fontWeight:done?700:400 }}>
            {done ? `✅ ${games.length}개 로드 완료` : loading ? '로딩 중...' : `${loadedCount}개 로딩 중...`}
          </span>
        </div>

        {/* 배치 로딩 바 */}
        {!done && !loading && loadingMore && (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR', marginBottom:4 }}>
              <span>🔄 백그라운드 로딩 중 — 카테고리/검색 바로 사용 가능</span>
              <span style={{ color:'#4a9eff', fontWeight:600 }}>{loadedCount} / 1000</span>
            </div>
            <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progressPct}%`, background:'linear-gradient(90deg,#4a9eff,#7c5cfc)', borderRadius:999, transition:'width 0.4s ease' }}/>
            </div>
          </div>
        )}

        {/* 검색 + AI 버튼 */}
        {fullPage && (
          <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center' }}>
            <div style={{ flex:1, position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>🔍</span>
              <input
                value={search}
                onChange={e=>handleSearchChange(e.target.value)}
                placeholder="게임 이름 또는 장르 검색..."
                style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e2e4ed', padding:'10px 14px 10px 36px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                onFocus={e=>e.currentTarget.style.borderColor='#7c5cfc'}
                onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
              />
              {search && (
                <button onClick={()=>{ setSearch(''); setSearchResults(null); setSearchLoading(false); }}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'#5a5f78', cursor:'pointer', fontSize:14 }}>✕</button>
              )}
            </div>
            <button onClick={()=>setShowAI(true)}
              style={{ padding:'10px 18px', background:'linear-gradient(135deg,#7c5cfc,#4a9eff)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR', whiteSpace:'nowrap', flexShrink:0 }}>
              🤖 맞춤 게임 추천
            </button>
          </div>
        )}

        {/* 카테고리 바 */}
        {fullPage && games.length > 0 && (
          <CategoryBar selected={category} onSelect={cat=>{ setCategory(cat); setSearch(''); setSearchResults(null); }} gameCounts={gameCounts}/>
        )}

        {/* 검색 결과 안내 */}
        {search.trim() && (
          <div style={{ marginBottom:12, fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>
            🔍 "<span style={{ color:'#e2e4ed', fontWeight:700 }}>{search}</span>" 검색 결과:
            {searchLoading
              ? <span style={{ color:'#f5a623', fontWeight:700 }}> API 검색 중...</span>
              : <span style={{ color:'#4a9eff', fontWeight:700 }}> {displayGames.length}개</span>
            }
            {!searchLoading && displayGames.length===0 && <span style={{ color:'#5a5f78' }}> — 검색 결과가 없습니다.</span>}
          </div>
        )}

        {/* 5열 그리드 */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16 }}>
          {displayGames.map((game,idx)=><FlipCard key={game.id} game={game} idx={idx} onSelect={setSelectedGame}/>)}
          {loading && Array.from({length:fullPage?10:5}).map((_,i)=><SkeletonCard key={`sk-${i}`}/>)}
        </div>

        {/* 완료 표시 — 더 이상 로딩 없음 */}
        {fullPage && done && !loading && games.length>0 && (
          <div style={{ textAlign:'center', marginTop:24, padding:'16px', background:'rgba(0,214,143,0.04)', border:'1px solid rgba(0,214,143,0.15)', borderRadius:8 }}>
            <div style={{ fontSize:13, color:'#00d68f', fontFamily:'Noto Sans KR', fontWeight:700 }}>✅ 전체 {games.length}개 게임 로드 완료</div>
            <div style={{ fontSize:11, color:'#5a5f78', marginTop:4, fontFamily:'Noto Sans KR' }}>최신 출시순으로 정렬되어 있습니다</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </>
  );
}
