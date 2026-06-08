import { useState, useEffect, useRef } from 'react';
import { gameListData } from '../mockData';

const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE_URL = 'https://api.rawg.io/api';
const PAGE_SIZE = 40;

// ── 19금·성인 콘텐츠 필터 ────────────────────────────────────────────
const ADULT_KEYWORDS = [
  'hentai','adult','erotic','nudity','sexual','xxx','18+','ecchi','lewd',
  'nsfw','porn','sex ','naked','lingerie','strip','bikini girl',
];
const BLOCKED_TAGS = ['sexual-content','nudity','hentai','adult','erotic'];

function isAdultGame(raw) {
  const name   = (raw.name || '').toLowerCase();
  const tags   = (raw.tags || []).map(t => t.slug);
  if (ADULT_KEYWORDS.some(k => name.includes(k))) return true;
  if (BLOCKED_TAGS.some(t => tags.includes(t)))   return true;
  return false;
}

function getDateRange() {
  const now  = new Date();
  // 출시된 게임만 (과거 5년 ~ 오늘)
  const from = new Date(now.getFullYear() - 5, 0, 1);
  const today = now.toISOString().slice(0, 10);
  const fmt  = d => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: today };
}

// Steam App ID 추출 (stores 필드 또는 clip URL에서)
function extractSteamAppId(raw) {
  // stores 배열에서 Steam 링크 파싱
  const stores = raw.stores || [];
  for (const s of stores) {
    const url = s.url || '';
    const m   = url.match(/store\.steampowered\.com\/app\/(\d+)/i);
    if (m) return m[1];
  }
  // clip url에서도 시도
  const clip = raw.clip?.clip || '';
  const m2   = clip.match(/\/(\d{4,})\//);
  if (m2) return m2[1];
  return null;
}

// 신뢰도 높은 게임 커버 이미지 선택
function getBestGameImage(raw) {
  // 1순위: Steam 앱 ID가 있으면 Steam CDN 커버 이미지 (가장 정확)
  const steamId = extractSteamAppId(raw);
  if (steamId) {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/library_600x900.jpg`;
  }

  // 2순위: RAWG background_image (API에서 주는 이미지, 보통 맞음)
  if (raw.background_image) {
    // RAWG 이미지 URL에 crop 파라미터 추가해 더 깔끔하게
    return raw.background_image;
  }

  // 3순위: 게임 ID 시드로 일관된 플레이스홀더
  return `https://picsum.photos/seed/game${raw.id}/300/400`;
}

export function normalizeGame(raw) {
  return {
    id:         raw.id,
    name:       raw.name,
    img:        getBestGameImage(raw),
    steamId:    extractSteamAppId(raw),
    metacritic: raw.metacritic ?? null,
    rating:     raw.rating ? Math.round(raw.rating * 10) / 10 : null,
    released:   raw.released ?? null,
    genres:     (raw.genres   || []).map(g => g.name),
    platforms:  (raw.platforms || []).map(p => p.platform.name),
    isApiData:  true,
    description: raw.description_raw || '',
  };
}

function normalizeFallback(m) {
  return { ...m, metacritic:null, rating:null, released:null, genres:[], platforms:[], isApiData:false, description:'' };
}

async function fetchPage(pageNum, extraParams = '') {
  const { from, to } = getDateRange();
  // -released: 최근 출시일 내림차순, exclude_additions: DLC 제외
  const url = `${BASE_URL}/games?key=${RAWG_API_KEY}&dates=${from},${to}&ordering=-released&page=${pageNum}&page_size=${PAGE_SIZE}&exclude_additions=true${extraParams}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const clean = (data.results || [])
    .filter(r => !isAdultGame(r))
    // 오늘 이후 출시 예정 게임 제외
    .filter(r => r.released && r.released <= to)
    .map(normalizeGame);
  return { results: clean, hasNext: !!data.next, count: data.count || 0 };
}

export function useRawgGames() {
  const [games,       setGames]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offline,     setOffline]     = useState(false);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [done,        setDone]        = useState(false);
  const initialized = useRef(false);
  const aborted     = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    aborted.current = false;
    loadAll();
    return () => { aborted.current = true; };
  }, []);

  async function loadAll() {
    if (!RAWG_API_KEY) {
      setGames(gameListData.map(normalizeFallback));
      setOffline(true); setLoading(false); setDone(true);
      return;
    }
    setLoading(true);
    try {
      const first = await fetchPage(1);
      if (aborted.current) return;
      setGames(first.results);
      setTotalCount(first.count);
      setLoadedCount(first.results.length);
      setLoading(false);
      if (!first.hasNext) { setDone(true); return; }

      setLoadingMore(true);
      const pages = Array.from({ length: 24 }, (_, i) => i + 2);
      let allGames = [...first.results];

      for (let i = 0; i < pages.length; i += 5) {
        if (aborted.current) break;
        const batch = pages.slice(i, i + 5);
        const results = await Promise.allSettled(batch.map(p => fetchPage(p)));
        if (aborted.current) break;
        for (const r of results) {
          if (r.status === 'fulfilled') allGames.push(...r.value.results);
        }
        // 중복 제거
        const seen = new Set(); allGames = allGames.filter(g => { if(seen.has(g.id)) return false; seen.add(g.id); return true; });
        setGames([...allGames]);
        setLoadedCount(allGames.length);
        if (i + 5 < pages.length) await new Promise(r => setTimeout(r, 150));
      }
      setLoadingMore(false); setDone(true);
    } catch (err) {
      console.warn('[RAWG]', err.message);
      if (!games.length) { setGames(gameListData.map(normalizeFallback)); setOffline(true); }
      setLoading(false); setLoadingMore(false); setDone(true);
    }
  }

  return { games, loading, loadingMore, offline, hasMore: false, loadMore:()=>{}, totalCount, loadedCount, done };
}

// ── 게임 검색 API ──────────────────────────────────────────────────────
export async function searchGamesAPI(query) {
  const key = import.meta.env.VITE_RAWG_API_KEY || '';
  if (!key || !query.trim()) return [];
  try {
    const url = `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(query)}&page_size=20&ordering=-rating`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).filter(r => !isAdultGame(r)).map(normalizeGame);
  } catch { return []; }
}

// ── 이달의 신작 (메인화면 5개) ────────────────────────────────────────
// 인지도 높은 대형 타이틀 고정 리스트
export const FEATURED_GAMES = [
  { id:'lol',  name:'리그 오브 레전드',
    img:'https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S1_2560x1440-80471666c140f790f28dff68d72c384b',
    imgFallback:'https://www.leagueoflegends.com/static/open-graph-b580f0e87f30b7a9c99f7cf4e02fc38e.jpg',
    metacritic:87, rating:4.1, released:'2009-10-27', genres:['MOBA','Action'], platforms:['PC'], color:'#c8a84b',
    description:'전 세계 1억명이 즐기는 5대5 MOBA. 160개 이상의 챔피언과 다양한 전략.' },
  { id:'val',  name:'발로란트',
    img:'https://cdn1.epicgames.com/offer/cbd5b3d310a54b12bf3fe8c41994174f/EGS_Valorant_RiotGames_S1_2560x1440-b55e4ebe5d7e2e4909f2c7325d1e0d18',
    imgFallback:'https://www.valorant.com/static/img/og/valorant_og.jpg',
    metacritic:80, rating:4.0, released:'2020-06-02', genres:['Shooter','Tactical'], platforms:['PC'], color:'#ff4e50',
    description:'라이엇게임즈의 전술적 5대5 FPS. 독특한 능력과 정밀한 에임 실력이 핵심.' },
  { id:'pubg', name:'배틀그라운드',
    img:'https://cdn.cloudflare.steamstatic.com/steam/apps/578080/library_600x900.jpg',
    imgFallback:'https://cdn.cloudflare.steamstatic.com/steam/apps/578080/header.jpg',
    metacritic:86, rating:3.9, released:'2017-12-21', genres:['Shooter','Battle Royale'], platforms:['PC','Xbox','PS5'], color:'#f5a623',
    description:'배틀로얄 장르의 원조. 100명 중 최후의 1인이 되기 위한 생존 전투.' },
  { id:'ow2',  name:'오버워치 2',
    img:'https://cdn1.epicgames.com/offer/0a84818055e740a7be9a5bfcfce7f4c4/EGS_Overwatch2_BlizzardEntertainment_S1_2560x1440-3e18b7fb7acbc893a99571b13fdc52fb',
    imgFallback:'https://bnetcmsus-a.akamaihd.net/cms/gallery/NFOPBR9DV21A1539195002625.jpg',
    metacritic:76, rating:3.7, released:'2022-10-04', genres:['Shooter','Action'], platforms:['PC','Xbox','PS5'], color:'#f99312',
    description:'팀 기반 히어로 FPS. 40개 이상 영웅의 조합으로 전략적 팀플레이 필요.' },
  { id:'elden',name:'엘든 링',
    img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg',
    imgFallback:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
    metacritic:96, rating:4.5, released:'2022-02-25', genres:['RPG','Action'], platforms:['PC','Xbox','PS5'], color:'#c8a84b',
    description:'FromSoftware × 조지 RR 마틴. GOTY 2022 수상. 오픈월드 액션 RPG의 정수.' },
];
