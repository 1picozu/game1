import { useState, useEffect, useRef } from 'react';
import { gameListData } from '../mockData';

const RAWG_API_KEY   = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE_URL       = 'https://api.rawg.io/api';
const PAGE_SIZE      = 40;
const TARGET_TOTAL   = 1000;
const TOTAL_PAGES    = Math.ceil(TARGET_TOTAL / PAGE_SIZE);
const PARALLEL_BATCH = 5;

const BLOCKED_SEXUAL_TAGS = new Set([
  'nudity','sexual-content','nsfw','hentai','eroge',
  'adult-only','explicit','pornographic','ecchi',
  'adults-only','lewd','r-18','erotic',
]);
const BLOCKED_SEXUAL_NAME_KW = [
  'hentai','eroge','nsfw','xxx','oppai',
  'strip poker','ecchi','r-18','erotic game',
  'sexy nurse','succubus xxx','adult only',
];

function isAdultGame(raw) {
  if (raw.esrb_rating?.slug === 'adults-only') return true;
  const tags = raw.tags || [];
  if (tags.some(t => BLOCKED_SEXUAL_TAGS.has((t.slug||'').toLowerCase()))) return true;
  const name = (raw.name||'').toLowerCase();
  if (BLOCKED_SEXUAL_NAME_KW.some(kw => name.includes(kw))) return true;
  const genres = raw.genres || [];
  if (genres.length === 0) return true;
  return false;
}

function normalizeGame(raw) {
  return {
    id:         raw.id,
    name:       raw.name,
    img:        raw.background_image || `https://picsum.photos/seed/${raw.id}/200/280`,
    metacritic: raw.metacritic ?? null,
    rating:     raw.rating ? Math.round(raw.rating*10)/10 : null,
    released:   raw.released ?? null,
    genres:     (raw.genres   ||[]).map(g=>g.name),
    platforms:  (raw.platforms||[]).map(p=>p.platform.name),
    isApiData:  true,
  };
}

function normalizeFallback(m) {
  return {...m, metacritic:null, rating:null, released:null, genres:[], platforms:[], isApiData:false};
}

async function fetchPage(pageNum, extraParams='') {
  const today = new Date();
  const toDate = today.toISOString().slice(0,10);
  const fromDate = new Date(today.getFullYear()-1, today.getMonth(), today.getDate()).toISOString().slice(0,10);
  const url = `${BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-released&dates=${fromDate},${toDate}&page=${pageNum}&page_size=${PAGE_SIZE}&exclude_additions=true${extraParams}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return {
    results: (data.results||[]).filter(r=>!isAdultGame(r)).map(normalizeGame),
    hasNext: !!data.next,
    count:   data.count||0,
  };
}

// ── 검색 전용 fetch (API에서 직접 검색) ─────────────────────────
export async function searchGamesAPI(query) {
  if (!RAWG_API_KEY || !query.trim()) return [];
  try {
    const today = new Date();
    const toDate = today.toISOString().slice(0,10);
    const fromDate = new Date(today.getFullYear()-3, today.getMonth(), today.getDate()).toISOString().slice(0,10);
    const url = `${BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=40&ordering=-released&dates=${fromDate},${toDate}&exclude_additions=true`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results||[]).filter(r=>!isAdultGame(r)).map(normalizeGame);
  } catch {
    return [];
  }
}

export function useRawgGames() {
  const [games,       setGames]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offline,     setOffline]     = useState(false);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [done,        setDone]        = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!RAWG_API_KEY) {
      const fallback = gameListData.map(normalizeFallback);
      setGames(fallback);
      setLoadedCount(fallback.length);
      setOffline(true);
      setLoading(false);
      setDone(true);
      return;
    }

    // 1단계: 1~5페이지 병렬로 동시에 로드 (초기 200개 즉시)
    const initPages = Array.from({length: Math.min(5, TOTAL_PAGES)}, (_,i)=>i+1);
    Promise.allSettled(initPages.map(p=>fetchPage(p)))
      .then(settled => {
        const initGames = [];
        let count = 0;
        let hasNext = true;
        for (const r of settled) {
          if (r.status==='fulfilled') {
            initGames.push(...r.value.results);
            if (r.value.count) count = r.value.count;
            if (!r.value.hasNext) hasNext = false;
          }
        }
        // 중복 제거
        const seen = new Set();
        const deduped = initGames.filter(g=>{ if(seen.has(g.id)) return false; seen.add(g.id); return true; });

        setGames(deduped);
        setTotalCount(count);
        setLoadedCount(deduped.length);
        setLoading(false);

        if (!hasNext || deduped.length===0) { setDone(true); return; }

        // 2단계: 나머지 배치 백그라운드 로드
        setLoadingMore(true);
        const remainPages = Array.from({length: TOTAL_PAGES-5}, (_,i)=>i+6);
        let allGames = [...deduped];

        const loadBatch = (idx) => {
          if (idx >= remainPages.length) { setLoadingMore(false); setDone(true); return; }
          const batch = remainPages.slice(idx, idx+PARALLEL_BATCH);
          Promise.allSettled(batch.map(p=>fetchPage(p))).then(bSettled => {
            const newGames = [];
            let stop = false;
            for (const r of bSettled) {
              if (r.status==='fulfilled') {
                newGames.push(...r.value.results);
                if (!r.value.hasNext) stop = true;
              }
            }
            if (newGames.length > 0) {
              allGames = [...allGames, ...newGames];
              const s = new Set();
              allGames = allGames.filter(g=>{ if(s.has(g.id)) return false; s.add(g.id); return true; });
              setGames([...allGames]);
              setLoadedCount(allGames.length);
            }
            if (stop || allGames.length >= TARGET_TOTAL) { setLoadingMore(false); setDone(true); return; }
            setTimeout(()=>loadBatch(idx+PARALLEL_BATCH), 150);
          });
        };
        loadBatch(0);
      })
      .catch(err => {
        console.warn('[RAWG]', err.message);
        const fallback = gameListData.map(normalizeFallback);
        setGames(fallback);
        setLoadedCount(fallback.length);
        setOffline(true);
        setLoading(false);
        setDone(true);
      });
  }, []);

  return { games, loading, loadingMore, offline, hasMore:false, loadMore:()=>{}, totalCount, loadedCount, done };
}

// ── FeaturedGames 용 하드코딩 데이터 ─────────────────────────────
// 메인화면 인기 게임 섹션에서 사용 (API 로딩 전에도 즉시 표시)
export const FEATURED_GAMES = [
  // Steam 헤더 이미지 (header.jpg — 항상 로드됨)
  { id:578080,  name:'PUBG: BATTLEGROUNDS',      img:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/578080/header.jpg',   metacritic:86, rating:3.5,  released:'2017-12-21', genres:['Shooter','Massively Multiplayer'],  color:'#f5a623', platforms:['PC'] },
  { id:2357570, name:'Overwatch 2',              img:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2357570/header.jpg',  metacritic:83, rating:3.6,  released:'2023-08-10', genres:['Shooter','Massively Multiplayer'],  color:'#f99312', platforms:['PC'] },
  // 라이엇 공식 CDN 이미지
  { id:99999,   name:'League of Legends',        img:'https://www.leagueoflegends.com/static/open-graph-b580f0311e7b36d2aac0d8c0e09a6541.jpg',  metacritic:78, rating:3.8,  released:'2009-10-27', genres:['Massively Multiplayer','Strategy'], color:'#c8a84b', platforms:['PC'] },
  { id:99998,   name:'VALORANT',                 img:'https://www.valorant.com/valorant-social.jpg',                                            metacritic:80, rating:4.0,  released:'2020-06-02', genres:['Shooter','Massively Multiplayer'],  color:'#ff4757', platforms:['PC'] },
  { id:13536,   name:'Elden Ring',               img:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',  metacritic:96, rating:4.67, released:'2022-02-25', genres:['Action','RPG'],                     color:'#c8a84b', platforms:['PC','PlayStation 4','Xbox One'] },
  { id:58175,   name:'God of War',               img:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/header.jpg',  metacritic:94, rating:4.63, released:'2018-04-20', genres:['Action','Adventure'],               color:'#4a9eff', platforms:['PC','PlayStation 4'] },
  { id:3328,    name:'The Witcher 3: Wild Hunt',  img:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg',   metacritic:92, rating:4.64, released:'2015-05-18', genres:['RPG','Action'],                     color:'#7c5cfc', platforms:['PC','PlayStation 4','Xbox One'] },
  { id:28,      name:'Red Dead Redemption 2',    img:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg',  metacritic:97, rating:4.66, released:'2019-11-05', genres:['Action','Adventure'],               color:'#c8a84b', platforms:['PC','PlayStation 4','Xbox One'] },
];
