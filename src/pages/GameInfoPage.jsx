import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';

// ── Claude API로 정보 수집 ──────────────────────────────────────────
async function fetchAIGameInfo(topic) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `다음 주제에 대해 JSON 배열만 반환하세요. 다른 텍스트 없이 오직 JSON만. ${topic}`
        }]
      })
    });
    if (!res.ok) throw new Error('api fail');
    const data = await res.json();
    const text = data.content?.map(c => c.text||'').join('') || '[]';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch { return null; }
}

// ── 할인 데이터 (초기 20개 + 페이지네이션) ─────────────────────────
const BASE_DEALS = [
  { id:1,  game:'엘든 링',             platform:'Steam', discount:40, original:59900, current:35940, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1245620/', end:'6/30', badge:'역대최저', genre:'RPG' },
  { id:2,  game:'사이버펑크 2077',      platform:'Epic',  discount:60, original:69900, current:27960, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/cyberpunk-2077', end:'6/20', badge:'추천', genre:'RPG' },
  { id:3,  game:'레드 데드 리뎀션 2',   platform:'Steam', discount:50, original:59900, current:29950, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1174180/', end:'7/5', badge:'', genre:'Action' },
  { id:4,  game:'호그와트 레거시',       platform:'Steam', discount:35, original:69900, current:45435, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/capsule_616x353.jpg',  url:'https://store.steampowered.com/app/990080/', end:'6/25', badge:'인기', genre:'RPG' },
  { id:5,  game:'갓 오브 워',           platform:'Steam', discount:30, original:59900, current:41930, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1593500/', end:'7/1', badge:'', genre:'Action' },
  { id:6,  game:'스파이더맨 리마스터드', platform:'Epic',  discount:45, original:59900, current:32945, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/marvels-spider-man-remastered', end:'6/22', badge:'EPIC픽', genre:'Action' },
  { id:7,  game:'발할라',               platform:'Steam', discount:75, original:69900, current:17475, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2208920/capsule_616x353.jpg', url:'https://store.steampowered.com/app/2208920/', end:'6/28', badge:'최대할인', genre:'RPG' },
  { id:8,  game:'디비전 2',             platform:'Epic',  discount:85, original:49900, current:7485,  img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2841720/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/the-division-2', end:'6/18', badge:'', genre:'Shooter' },
  { id:9,  game:'바이오하자드 빌리지',   platform:'Steam', discount:50, original:59900, current:29950, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1196590/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1196590/', end:'6/29', badge:'', genre:'Action' },
  { id:10, game:'다크 소울 3',          platform:'Steam', discount:70, original:39900, current:11970, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/capsule_616x353.jpg',  url:'https://store.steampowered.com/app/374320/', end:'7/3', badge:'', genre:'RPG' },
  { id:11, game:'헤일로 인피니트',       platform:'Epic',  discount:40, original:59900, current:35940, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1240440/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/halo-infinite', end:'6/22', badge:'', genre:'Shooter' },
  { id:12, game:'드래곤 에이지 베일가드', platform:'Steam', discount:30, original:79900, current:55930, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1845910/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1845910/', end:'6/30', badge:'신작', genre:'RPG' },
  { id:13, game:'워해머 40K: 스페이스 마린 2', platform:'Steam', discount:25, original:69900, current:52425, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2183900/capsule_616x353.jpg', url:'https://store.steampowered.com/app/2183900/', end:'7/2', badge:'', genre:'Action' },
  { id:14, game:'발더스 게이트 3',       platform:'Steam', discount:20, original:79900, current:63920, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1086940/', end:'7/10', badge:'GOTY', genre:'RPG' },
  { id:15, game:'파 크라이 6',           platform:'Epic',  discount:80, original:59900, current:11980, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2369390/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/far-cry-6', end:'6/19', badge:'', genre:'Action' },
  { id:16, game:'몬스터 헌터 라이즈',    platform:'Steam', discount:55, original:49900, current:22455, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1446780/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1446780/', end:'6/26', badge:'인기', genre:'Action' },
  { id:17, game:'스타워즈 제다이 서바이버', platform:'Steam', discount:40, original:79900, current:47940, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1774580/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1774580/', end:'6/24', badge:'', genre:'Action' },
  { id:18, game:'리조트 오브 크라이시스', platform:'Epic',  discount:100, original:49900, current:0, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1659420/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/free-games', end:'6/20', badge:'무료', genre:'Action' },
  { id:19, game:'울펜슈타인 II',         platform:'Steam', discount:80, original:49900, current:9980, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/612880/capsule_616x353.jpg', url:'https://store.steampowered.com/app/612880/', end:'7/1', badge:'', genre:'Shooter' },
  { id:20, game:'심즈 4',               platform:'Steam', discount:65, original:49900, current:17465, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1222670/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1222670/', end:'6/27', badge:'', genre:'Simulation' },
  { id:21, game:'글레이도스 팰리콘',      platform:'Steam', discount:35, original:39900, current:25935, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/394080/capsule_616x353.jpg', url:'https://store.steampowered.com/app/394080/', end:'6/30', badge:'', genre:'Action' },
  { id:22, game:'워크래프트 III 리포지드', platform:'Battle.net', discount:33, original:29900, current:20033, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/490280/capsule_616x353.jpg', url:'https://us.battle.net/shop/en/product/warcraft-iii-reforged', end:'7/5', badge:'', genre:'Strategy' },
  { id:23, game:'오리 앤 더 윌 오브 더 위습스', platform:'Steam', discount:60, original:29900, current:11960, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1057090/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1057090/', end:'6/28', badge:'명작', genre:'Platformer' },
  { id:24, game:'셀레스트',              platform:'Epic',  discount:70, original:19900, current:5970, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/celeste', end:'6/22', badge:'인디명작', genre:'Indie' },
  { id:25, game:'디스코 엘리시엄',        platform:'Steam', discount:80, original:49900, current:9980, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/632470/capsule_616x353.jpg', url:'https://store.steampowered.com/app/632470/', end:'7/2', badge:'GOTY', genre:'RPG' },
  { id:26, game:'스플릿 픽션',           platform:'Steam', discount:15, original:39900, current:33915, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2456740/capsule_616x353.jpg', url:'https://store.steampowered.com/app/2456740/', end:'7/1', badge:'신작', genre:'Action' },
  { id:27, game:'홀로우 나이트',         platform:'Steam', discount:50, original:14500, current:7250, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/capsule_616x353.jpg', url:'https://store.steampowered.com/app/367520/', end:'7/10', badge:'인디명작', genre:'Indie' },
  { id:28, game:'헤이드즈 2',           platform:'Steam', discount:10, original:34900, current:31410, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1145360/', end:'6/25', badge:'얼리액세스', genre:'Indie' },
  { id:29, game:'팔월드',               platform:'Steam', discount:20, original:29900, current:23920, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1623730/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1623730/', end:'6/20', badge:'', genre:'Action' },
  { id:30, game:'렉싱턴 로드',          platform:'Epic',  discount:100, original:39900, current:0, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2138710/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/free-games', end:'6/19', badge:'무료', genre:'Action' },
  { id:31, game:'데스루프',              platform:'Steam', discount:75, original:59900, current:14975, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1252330/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1252330/', end:'7/3', badge:'', genre:'Action' },
  { id:32, game:'코드 베인',            platform:'Steam', discount:65, original:59900, current:20965, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/678960/capsule_616x353.jpg', url:'https://store.steampowered.com/app/678960/', end:'6/30', badge:'', genre:'RPG' },
  { id:33, game:'배틀필드 2042',        platform:'Steam', discount:80, original:69900, current:13980, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1517290/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1517290/', end:'6/28', badge:'', genre:'Shooter' },
  { id:34, game:'배틀필드 1',           platform:'Epic',  discount:90, original:49900, current:4990, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1048520/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/battlefield-1', end:'6/22', badge:'역대최저', genre:'Shooter' },
  { id:35, game:'파이어워치',            platform:'Steam', discount:70, original:19900, current:5970, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/383870/capsule_616x353.jpg', url:'https://store.steampowered.com/app/383870/', end:'7/5', badge:'명작', genre:'Adventure' },
  { id:36, game:'더 위처 3: 와일드 헌트', platform:'Steam', discount:70, original:49900, current:14970, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/capsule_616x353.jpg', url:'https://store.steampowered.com/app/292030/', end:'7/10', badge:'GOTY', genre:'RPG' },
  { id:37, game:'어쌔신 크리드 오리진',  platform:'Epic',  discount:80, original:59900, current:11980, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2761450/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/assassins-creed-origins', end:'6/19', badge:'', genre:'Action' },
  { id:38, game:'마블 스파이더맨 마일즈', platform:'Steam', discount:25, original:69900, current:52425, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1817070/', end:'7/2', badge:'신작', genre:'Action' },
  { id:39, game:'라이즈 오브 더 론:그들의 전쟁', platform:'Steam', discount:55, original:49900, current:22455, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1647550/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1647550/', end:'6/24', badge:'', genre:'Action' },
  { id:40, game:'쉐도우 오브 더 툼 레이더', platform:'Epic', discount:80, original:69900, current:13980, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/750920/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/shadow-of-the-tomb-raider', end:'6/20', badge:'', genre:'Action' },
  { id:41, game:'FIFA 23',              platform:'Steam', discount:85, original:79900, current:11985, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1811260/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1811260/', end:'6/30', badge:'', genre:'Sports' },
  { id:42, game:'NBA 2K24',             platform:'Steam', discount:75, original:79900, current:19975, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2338770/capsule_616x353.jpg', url:'https://store.steampowered.com/app/2338770/', end:'7/5', badge:'', genre:'Sports' },
  { id:43, game:'포르자 호라이즌 5',     platform:'Steam', discount:35, original:69900, current:45435, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1551360/', end:'7/1', badge:'', genre:'Racing' },
  { id:44, game:'니어: 오토마타',        platform:'Steam', discount:60, original:49900, current:19960, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/524220/capsule_616x353.jpg', url:'https://store.steampowered.com/app/524220/', end:'6/28', badge:'명작', genre:'RPG' },
  { id:45, game:'나이트 인 더 우즈',     platform:'Epic',  discount:75, original:19900, current:4975, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/481510/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/night-in-the-woods', end:'6/22', badge:'인디', genre:'Adventure' },
  { id:46, game:'컵헤드',               platform:'Steam', discount:40, original:19900, current:11940, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/268910/capsule_616x353.jpg', url:'https://store.steampowered.com/app/268910/', end:'7/3', badge:'명작', genre:'Indie' },
  { id:47, game:'인 선오브 배틀필드',    platform:'Steam', discount:50, original:29900, current:14950, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/394360/capsule_616x353.jpg', url:'https://store.steampowered.com/app/394360/', end:'6/30', badge:'', genre:'Strategy' },
  { id:48, game:'미드나잇 선즈',        platform:'Epic',  discount:70, original:69900, current:20970, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/368260/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/marvels-midnight-suns', end:'6/19', badge:'', genre:'Strategy' },
  { id:49, game:'스타크래프트 II',       platform:'Battle.net', discount:50, original:39900, current:19950, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2376760/capsule_616x353.jpg', url:'https://us.battle.net/shop/en/product/starcraft-ii', end:'7/10', badge:'', genre:'Strategy' },
  { id:50, game:'배트맨: 아캄 나이트',   platform:'Steam', discount:75, original:49900, current:12475, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/208650/capsule_616x353.jpg', url:'https://store.steampowered.com/app/208650/', end:'6/25', badge:'명작', genre:'Action' },
];

// 50개 추가 생성
const EXTRA_DEALS = Array.from({length:50}, (_,i) => {
  const genres = ['RPG','Action','Shooter','Strategy','Indie','Adventure','Sports','Racing','Simulation'];
  const plats  = ['Steam','Epic','Steam','Steam','Epic'];
  const disc   = [20,25,30,35,40,45,50,55,60,65,70,75,80][i%13];
  const orig   = [19900,29900,39900,49900,59900,69900,79900][i%7];
  const games  = ['배틀 형제','핸섬 로그','블러드본','프로스트펑크 2','요카이 워치','파이널 판타지 XIV','류그','캐슬 크래셔','블랙 마이스','헤비 레인','디트로이트','양 머리 랜치','언더테일','스토커 2','더스트:아 엘리시안 테일','원피스 보물 선박','아르마 3','레인보우 식스 시지','이스케이프 더 백룸','섀도우런 리턴즈','고스트 오브 쓰시마','파이널 판타지 7 리버스','데드 아일랜드 2','레인저스 오브 오버레임','핀드레드','삼국지 14','엠파이어 오브 신즈','두께 3D','루나 시스터즈','스트리트 파이터 6','모탈 컴뱃 1','제노버스 2','그랜드 킹덤','지구방위군 5','미래 전쟁','크리티컬 히트','일렉트로닉 팀','섀도우 파이어','잭앤덱스터','메탈 기어 솔리드 5','스플린터 셀 블랙리스트','F.E.A.R.','나루토 폭풍 4','디지몬 서바이브','원신임팩트','붕괴: 스타레일','명일방주','블루 아카이브','에픽세픈'];
  const name   = games[i] || `타이틀 ${i+51}`;
  const appId  = 100000 + i * 1000;
  return {
    id: 50+i+1, game: name,
    platform: plats[i%5],
    discount: disc,
    original: orig,
    current: Math.round(orig*(1-disc/100)/100)*100,
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg`,
    url: plats[i%5]==='Epic'
      ? `https://store.epicgames.com/browse?q=${encodeURIComponent(name)}`
      : `https://store.steampowered.com/search/?term=${encodeURIComponent(name)}`,
    end: `7/${(i%15)+1}`,
    badge: i%7===0?'추천':i%11===0?'역대최저':'',
    genre: genres[i%genres.length],
  };
});

const ALL_DEALS = [...BASE_DEALS, ...EXTRA_DEALS];

// ── 출시 예정 기대작 ──────────────────────────────────────────────
const UPCOMING_GAMES = [
  { title:'GTA VI', date:'2025년 하반기', genre:'Action/Open World', developer:'Rockstar Games', img:'https://images.igdb.com/igdb/image/upload/t_cover_big/co8mjk.jpg', desc:'플로리다를 배경으로 한 역대 최대 규모 오픈월드. 남녀 주인공 듀오 스토리. 출시 전부터 유튜브 트레일러 역대 최다 조회수를 기록하며 전 세계 게이머의 기대를 한몸에 받고 있음.', youtubeId:'QdBZExpgErs', hot:true, platforms:['PS5','Xbox Series X'] },
  { title:'Monster Hunter Wilds', date:'2025년 2분기', genre:'Action/RPG', developer:'Capcom', img:'https://images.igdb.com/igdb/image/upload/t_cover_big/co8nc8.jpg', desc:'살아 숨쉬는 생태계와 날씨 시스템을 도입한 몬스터 헌터 시리즈 최신작. 사막부터 밀림까지 광활한 세계와 새로운 몬스터들이 등장. PS5/PC/Xbox 멀티플랫폼.', youtubeId:'8ZKc6S4sOgU', hot:true, platforms:['PC','PS5','Xbox Series X'] },
  { title:'Hollow Knight: Silksong', date:'2025년 TBD', genre:'Action/Indie', developer:'Team Cherry', img:'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg', desc:'인디 명작 홀로우 나이트의 후속작. 호넷을 주인공으로 전혀 새로운 세계 필로리아를 탐험. 수년간 기다려온 팬들의 최대 기대작 중 하나.', youtubeId:'pFBt_HhRMJc', hot:true, platforms:['PC','Nintendo Switch'] },
  { title:'Elden Ring: Nightreign', date:'2025년 5월 30일', genre:'Action/RPG', developer:'FromSoftware', img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2622380/capsule_616x353.jpg', desc:'엘든 링 스핀오프 멀티플레이어 로그라이크. 3인 협동 플레이로 3일간의 생존을 이어가는 독특한 구조. 새로운 캐릭터 클래스와 보스 전투 포함.', youtubeId:'k5MKo7fQgJQ', hot:true, platforms:['PC','PS5','Xbox Series X'] },
  { title:'Fable', date:'2025년 하반기', genre:'RPG', developer:'Playground Games', img:'https://images.igdb.com/igdb/image/upload/t_cover_big/co7cno.jpg', desc:'마이크로소프트의 기대작 FABLE 리부트. 플레이그라운드 게임즈 개발. 영국 동화적 세계관을 현대적으로 재해석. Xbox Series X/PC 독점.', youtubeId:'8BpxLgIhXkk', hot:false, platforms:['PC','Xbox Series X'] },
  { title:'마블 vs. 캡콤 파이팅 컬렉션', date:'2025년 3분기', genre:'Fighting', developer:'Capcom', img:'https://images.igdb.com/igdb/image/upload/t_cover_big/co7c2j.jpg', desc:'마블 vs. 캡콤 클래식 시리즈를 HD로 복각한 컬렉션. X-Men vs Street Fighter부터 MvC2까지 총 6개 타이틀 수록.', youtubeId:'M3_HNqQYKnA', hot:false, platforms:['PC','PS5','Nintendo Switch'] },
  { title:'Cyberpunk 2077 오르페우스', date:'2025년 하반기 (루머)', genre:'RPG', developer:'CD Projekt Red', img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg', desc:'사이버펑크 2077의 후속 스탠드얼론 확장팩 루머. V의 새로운 이야기 또는 신규 주인공으로 Night City를 탐험. 아직 공식 확인 전.', youtubeId:'', hot:false, platforms:['PC','PS5'] },
  { title:'어쌔신 크리드 스피어 (코드명)', date:'2025년 하반기', genre:'Action/RPG', developer:'Ubisoft', img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2761450/capsule_616x353.jpg', desc:'오리엔트를 배경으로 한 어쌔신 크리드 최신작 루머. 이전작인 섀도우의 성공에 이어 새로운 배경을 탐험. 공식 발표 전이므로 정보 변동 가능.', youtubeId:'', hot:false, platforms:['PC','PS5','Xbox Series X'] },
  { title:'Rise of the Ronin 2 (루머)', date:'2026년 예상', genre:'Action/RPG', developer:'Team Ninja', img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1649740/capsule_616x353.jpg', desc:'Rise of the Ronin의 후속작 루머. 팀 닌자의 오픈월드 사무라이 액션 RPG 시리즈 확장 가능성. 아직 공식 발표 없음.', youtubeId:'', hot:false, platforms:['PS5'] },
  { title:'Ghost of Tsushima 2 (루머)', date:'2026년 예상', genre:'Action/Adventure', developer:'Sucker Punch', img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2215430/capsule_616x353.jpg', desc:'고스트 오브 쓰시마의 막대한 성공으로 후속작 개발이 유력하게 언급됨. 새로운 일본 배경 또는 진 스키의 이야기 계속 이어갈 가능성.', youtubeId:'', hot:false, platforms:['PS5','PC'] },
];

// ── 진행 중인 게임 이벤트 ──────────────────────────────────────────
const ACTIVE_EVENTS = [
  // 서브컬쳐 이벤트
  { title:'블루 아카이브 1.5주년 기념 페스티벌', type:'서브컬처', platform:'모바일/PC', start:'2025.06.01', end:'2025.07.15', status:'진행중', desc:'블루 아카이브 1.5주년 기념 대규모 업데이트. 신규 학생 2명 추가, 특별 스토리, 1.5주년 전용 픽업 가챠 및 기념 코스튬 출시. 복귀 유저 지원 이벤트 병행.', color:'#7c5cfc', icon:'🎓', url:'https://bluearchive.nexon.com/', hot:true },
  { title:'원신 5.x 버전 이벤트', type:'서브컬처', platform:'모바일/PC/PS', start:'2025.06.11', end:'2025.07.01', status:'진행중', desc:'원신 5.x 버전의 신규 맵 및 대규모 이벤트. 나타 지역 퀘스트 완결 스토리와 신규 5성 캐릭터 2명 동시 출시. 지원 이벤트 프리모젬 상시 지급.', color:'#4a9eff', icon:'⚡', url:'https://genshin.hoyoverse.com/', hot:true },
  { title:'붕괴: 스타레일 신규 버전 업데이트', type:'서브컬처', platform:'모바일/PC', start:'2025.06.18', end:'2025.07.09', status:'예정', desc:'붕괴: 스타레일 신버전 업데이트 예정. 신규 행성 개방 및 신규 캐릭터 추가. 점수 이벤트 포함.', color:'#ff4757', icon:'🌟', url:'https://hsr.hoyoverse.com/', hot:false },
  { title:'명일방주 신규 이벤트: 이터널 선', type:'서브컬처', platform:'모바일/PC', start:'2025.06.05', end:'2025.06.25', status:'진행중', desc:'명일방주 신규 스토리 이벤트. 신규 6성 오퍼레이터 무료 획득 가능. PV 영상 조회수 1000만 돌파 기념 보상 증정.', color:'#00d68f', icon:'🌺', url:'https://ak.hypergryph.com/', hot:false },
  { title:'FGO 7주년 이벤트 (예정)', type:'서브컬처', platform:'모바일', start:'2025.07.01', end:'2025.07.31', status:'예정', desc:'Fate/Grand Order 7주년 기념 대규모 이벤트 예정. 이전 주년 트렌드로 볼 때 신규 서번트 무료 획득, 성배 지급, 사이드 스토리 복각이 예상됨.', color:'#f5a623', icon:'✨', url:'https://fate-go.us/', hot:true },
  { title:'니케: 승리의 여신 2주년', type:'서브컬처', platform:'모바일/PC', start:'2025.06.20', end:'2025.07.20', status:'예정', desc:'승리의 여신: 니케 2주년 기념 이벤트. 신규 수록 캐릭터 무료 지급, 한정 의상, 콜라보 PV 예정. 업데이트 상세 내용 공개 예정.', color:'#ff6b9d', icon:'💫', url:'https://nikke.nexon.com/', hot:false },
  // 일반 게임 이벤트
  { title:'스팀 여름 세일 2025', type:'할인행사', platform:'Steam', start:'2025.06.26', end:'2025.07.10', status:'예정', desc:'스팀 연중 최대 할인 행사. 수천 개 게임 최대 90% 할인 예정. 커뮤니티 이벤트, 포인트 샵 특별 아이템, 도전과제 이벤트 동시 진행.', color:'#1b9aff', icon:'💰', url:'https://store.steampowered.com/', hot:true },
  { title:'에픽게임즈 여름 무료 게임 이벤트', type:'무료게임', platform:'Epic', start:'2025.06.15', end:'2025.07.15', status:'진행중', desc:'에픽게임즈 여름 한정 무료 게임 행사. 매주 목요일 신규 무료 게임 1~3개 배포. 고품질 AAA 타이틀 포함 예정.', color:'#00d68f', icon:'🎁', url:'https://store.epicgames.com/ko/free-games', hot:true },
  { title:'오버워치 2 시즌 15', type:'시즌업데이트', platform:'PC/PS/Xbox', start:'2025.06.18', end:'2025.09.09', status:'진행중', desc:'오버워치 2 시즌 15 시작. 신규 탱커 영웅 출시, 신규 맵 2개 추가, 배틀패스 업데이트. 기간 한정 아케이드 이벤트 병행.', color:'#f99312', icon:'⚔️', url:'https://overwatch.blizzard.com/', hot:false },
  { title:'리그 오브 레전드 미드시즌 인빅테이셔널', type:'e스포츠', platform:'PC/시청', start:'2025.06.01', end:'2025.06.22', status:'진행중', desc:'MSI 2025 한국 개최. T1, 젠지 등 한국 팀이 세계 최강 팀들과 격돌. 기간 내 인게임 이벤트 및 드랍 보상 진행.', color:'#c8a84b', icon:'🏆', url:'https://lolesports.com/', hot:true },
  { title:'PUBG 스팀 여름 이벤트', type:'게임이벤트', platform:'Steam/PC', start:'2025.06.20', end:'2025.07.20', status:'예정', desc:'배틀그라운드 여름 시즌 이벤트. 신규 시즌 아이템, 여름 한정 스킨 출시. 게임 내 미션 클리어 보상 획득 가능.', color:'#f5a623', icon:'🌊', url:'https://www.pubg.com/', hot:false },
  { title:'발로란트 에피소드 9 신규 시즌', type:'시즌업데이트', platform:'PC', start:'2025.07.01', end:'2025.09.30', status:'예정', desc:'발로란트 에피소드 9 Act 1 시작 예정. 신규 요원, 신규 맵 추가, 배틀패스 리뉴얼. 랭크 시즌 리셋 동반.', color:'#ff4e50', icon:'🎯', url:'https://playvalorant.com/', hot:false },
];

// ── 할인 카드 ──────────────────────────────────────────────────────
function DealCard({ d }) {
  const plColor = d.platform==='Steam'?'#1b9aff':d.platform==='Epic'?'#ffffff':'#00d68f';
  return (
    <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', display:'block' }}>
      <div style={{
        borderRadius:12, overflow:'hidden',
        border:'1px solid rgba(255,255,255,0.08)',
        background:'#1c1e26', cursor:'pointer',
        transition:'all 0.25s',
      }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='rgba(74,158,255,0.35)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
        <div style={{ position:'relative', height:130, overflow:'hidden' }}>
          <img src={d.img} alt={d.game} style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={e=>{e.currentTarget.style.background='#252840';e.currentTarget.style.display='none';}}
          />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)' }}/>
          <div style={{
            position:'absolute', top:8, right:8,
            background: d.discount===100?'#00d68f':'#ff4757',
            borderRadius:6, padding:'3px 10px',
            fontFamily:'Rajdhani', fontWeight:800, fontSize:17, color:'#fff'
          }}>{d.discount===100?'FREE':`-${d.discount}%`}</div>
          <div style={{ position:'absolute', top:8, left:8, background:`${plColor}22`, border:`1px solid ${plColor}55`, borderRadius:5, padding:'2px 7px', fontSize:10, fontWeight:700, color:plColor }}>
            {d.platform}
          </div>
          {d.badge && <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(0,214,143,0.85)', borderRadius:5, padding:'2px 7px', fontSize:10, fontWeight:700, color:'#fff' }}>{d.badge}</div>}
        </div>
        <div style={{ padding:'10px 12px' }}>
          <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:13, color:'#f0f2ff', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.game}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {d.discount===100
              ? <span style={{ fontFamily:'Rajdhani', fontWeight:800, fontSize:20, color:'#00d68f' }}>무료!</span>
              : <>
                  <span style={{ fontFamily:'Rajdhani', fontWeight:800, fontSize:19, color:'#ff4757' }}>₩{d.current.toLocaleString()}</span>
                  <span style={{ fontSize:11, color:'#5a5f78', textDecoration:'line-through' }}>₩{d.original.toLocaleString()}</span>
                </>
            }
          </div>
          <div style={{ fontSize:10, color:'#5a5f78', marginTop:4, fontFamily:'Noto Sans KR' }}>⏰ ~{d.end} 종료</div>
        </div>
      </div>
    </a>
  );
}

// ── 탭 선택 버튼 ──────────────────────────────────────────────────
function TabBtn({ active, onClick, children, color='#4a9eff' }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:'12px 8px', border:'none', borderRadius:10,
      background: active ? `${color}22` : 'transparent',
      color: active ? color : '#8a8fa8',
      fontSize:14, fontWeight:700, cursor:'pointer',
      fontFamily:'Noto Sans KR', transition:'all 0.2s',
      borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
    }}>{children}</button>
  );
}

// ─── 메인 ──────────────────────────────────────────────────────────
export default function GameInfoPage() {
  const { navigate } = useApp();
  const [tab, setTab] = useState('deals'); // deals | upcoming | events

  // ── 할인 페이지네이션 ──────────────────────────────────────────
  const DEALS_PER_PAGE = 20;
  const [dealPage,   setDealPage]   = useState(1);
  const [dealSearch, setDealSearch] = useState('');
  const [dealFilter, setDealFilter] = useState('전체'); // 전체/Steam/Epic

  const filteredDeals = ALL_DEALS.filter(d => {
    const matchSearch = dealSearch === '' || d.game.toLowerCase().includes(dealSearch.toLowerCase());
    const matchPlat   = dealFilter === '전체' || d.platform === dealFilter;
    return matchSearch && matchPlat;
  });
  const totalPages  = Math.ceil(filteredDeals.length / DEALS_PER_PAGE);
  const shownDeals  = filteredDeals.slice((dealPage-1)*DEALS_PER_PAGE, dealPage*DEALS_PER_PAGE);

  // 검색 시 페이지 초기화
  const handleDealSearch = (v) => { setDealSearch(v); setDealPage(1); };
  const handleDealFilter = (v) => { setDealFilter(v); setDealPage(1); };

  // ── 출시예정 AI 보충 ───────────────────────────────────────────
  const [aiUpcoming, setAiUpcoming] = useState([]);
  const [aiLoading,  setAiLoading]  = useState(false);

  const loadAIUpcoming = async () => {
    if (aiLoading || aiUpcoming.length > 0) return;
    setAiLoading(true);
    const result = await fetchAIGameInfo(`2025년에 출시 예정이거나 최근 출시된 기대작 게임 5개를 알려주세요.
JSON 배열로만 반환하세요:
[{"title":"게임명","date":"출시일/예정일","genre":"장르","developer":"개발사","desc":"2줄 한국어 설명","hot":true/false,"platforms":["PC","PS5"]}]`);
    if (result && Array.isArray(result)) setAiUpcoming(result);
    setAiLoading(false);
  };

  // 출시예정 탭 열릴 때 자동 로드
  useEffect(() => { if (tab === 'upcoming') loadAIUpcoming(); }, [tab]);

  const allUpcoming = [...UPCOMING_GAMES, ...aiUpcoming];

  // ── 이벤트 필터 ───────────────────────────────────────────────
  const [eventType, setEventType] = useState('전체');
  const EVENT_TYPES = ['전체','서브컬처','할인행사','무료게임','시즌업데이트','e스포츠','게임이벤트'];
  const shownEvents = ACTIVE_EVENTS.filter(e => eventType==='전체' || e.type===eventType);

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'24px 16px' }}>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
        >← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span className="section-title">🎮 게임 정보 센터</span>
      </div>

      {/* 탭 */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.03)', borderRadius:12, padding:4, border:'1px solid rgba(255,255,255,0.07)' }}>
        <TabBtn active={tab==='deals'}    onClick={()=>setTab('deals')}    color='#ff4757'>💸 게임 할인 정보</TabBtn>
        <TabBtn active={tab==='upcoming'} onClick={()=>setTab('upcoming')} color='#4a9eff'>🚀 출시 예정 게임</TabBtn>
        <TabBtn active={tab==='events'}   onClick={()=>setTab('events')}   color='#00d68f'>🎉 게임 이벤트</TabBtn>
      </div>

      {/* ─────── 할인 탭 ─────────────────────────────────────── */}
      {tab === 'deals' && (
        <div>
          {/* 검색 + 필터 */}
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:'1 1 240px', minWidth:0 }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#5a5f78', fontSize:14 }}>🔍</span>
              <input
                value={dealSearch}
                onChange={e=>handleDealSearch(e.target.value)}
                placeholder="게임 이름 검색..."
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f0f2ff', padding:'10px 14px 10px 36px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.currentTarget.style.borderColor='#ff4757'}
                onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
              />
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['전체','Steam','Epic'].map(p => (
                <button key={p} onClick={()=>handleDealFilter(p)} style={{
                  padding:'8px 16px', borderRadius:8, border:`1px solid ${dealFilter===p?'#ff4757':'rgba(255,255,255,0.1)'}`,
                  background: dealFilter===p?'rgba(255,71,87,0.15)':'transparent',
                  color: dealFilter===p?'#ff4757':'#8a8fa8',
                  fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR',
                }}>{p}</button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#5a5f78', fontFamily:'Noto Sans KR', whiteSpace:'nowrap' }}>
              총 {filteredDeals.length}개 · {dealPage}/{totalPages}페이지
            </div>
          </div>

          {/* 검색 결과 안내 */}
          {dealSearch && (
            <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(255,71,87,0.06)', border:'1px solid rgba(255,71,87,0.2)', borderRadius:8, fontSize:13, color:'#ff8a8a', fontFamily:'Noto Sans KR' }}>
              🔍 "{dealSearch}" 검색 결과: <strong>{filteredDeals.length}개</strong>
              {filteredDeals.length === 0 && ' — 검색 결과가 없습니다.'}
              {filteredDeals.some(d=>d.discount>0) && ` (최대 ${Math.max(...filteredDeals.map(d=>d.discount))}% 할인 포함)`}
            </div>
          )}

          {/* 그리드 */}
          {shownDeals.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', color:'#5a5f78', fontFamily:'Noto Sans KR' }}>검색 결과가 없습니다.</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:14, marginBottom:24 }}>
              {shownDeals.map(d => <DealCard key={d.id} d={d} />)}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginTop:8 }}>
              <button onClick={()=>setDealPage(1)} disabled={dealPage===1} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color: dealPage===1?'#3a3d52':'#8a8fa8', cursor:dealPage===1?'not-allowed':'pointer', fontSize:12 }}>«</button>
              <button onClick={()=>setDealPage(p=>Math.max(1,p-1))} disabled={dealPage===1} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color: dealPage===1?'#3a3d52':'#8a8fa8', cursor:dealPage===1?'not-allowed':'pointer', fontSize:12 }}>‹</button>
              {Array.from({length:Math.min(7,totalPages)}, (_,i) => {
                let page = i+1;
                if (totalPages > 7) {
                  if (dealPage <= 4) page = i+1;
                  else if (dealPage >= totalPages-3) page = totalPages-6+i;
                  else page = dealPage-3+i;
                }
                return (
                  <button key={page} onClick={()=>setDealPage(page)} style={{
                    padding:'6px 12px', borderRadius:6,
                    border:`1px solid ${dealPage===page?'#ff4757':'rgba(255,255,255,0.1)'}`,
                    background: dealPage===page?'rgba(255,71,87,0.2)':'transparent',
                    color: dealPage===page?'#ff4757':'#8a8fa8',
                    cursor:'pointer', fontSize:12, fontWeight: dealPage===page?700:400,
                  }}>{page}</button>
                );
              })}
              <button onClick={()=>setDealPage(p=>Math.min(totalPages,p+1))} disabled={dealPage===totalPages} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color: dealPage===totalPages?'#3a3d52':'#8a8fa8', cursor:dealPage===totalPages?'not-allowed':'pointer', fontSize:12 }}>›</button>
              <button onClick={()=>setDealPage(totalPages)} disabled={dealPage===totalPages} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color: dealPage===totalPages?'#3a3d52':'#8a8fa8', cursor:dealPage===totalPages?'not-allowed':'pointer', fontSize:12 }}>»</button>
            </div>
          )}
        </div>
      )}

      {/* ─────── 출시예정 탭 ──────────────────────────────────── */}
      {tab === 'upcoming' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <span className="section-title" style={{ fontSize:16 }}>🚀 2025년 기대작 출시 일정</span>
            {aiLoading && <span style={{ fontSize:12, color:'#7c5cfc', fontFamily:'Noto Sans KR', animation:'pulse 1s infinite' }}>🤖 AI가 추가 정보 수집 중...</span>}
            {!aiLoading && aiUpcoming.length===0 && (
              <button onClick={loadAIUpcoming} style={{ fontSize:12, padding:'4px 12px', background:'rgba(124,92,252,0.15)', border:'1px solid rgba(124,92,252,0.3)', borderRadius:6, color:'#9b7ffe', cursor:'pointer', fontFamily:'Noto Sans KR' }}>
                🤖 AI로 최신 정보 보강
              </button>
            )}
            {aiUpcoming.length>0 && <span style={{ fontSize:11, color:'#00d68f', fontFamily:'Noto Sans KR' }}>✅ AI 정보 {aiUpcoming.length}개 추가됨</span>}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {allUpcoming.map((u, i) => (
              <div key={i} className="card" style={{
                padding:'20px',
                border: u.hot ? '1px solid rgba(255,71,87,0.35)' : '1px solid rgba(255,255,255,0.08)',
                position:'relative', overflow:'hidden',
                animation:`fadeInUp 0.3s ${i*0.05}s ease both`,
              }}>
                {u.hot && (
                  <div style={{ position:'absolute', top:0, right:0, background:'rgba(255,71,87,0.15)', padding:'6px 14px', borderBottomLeftRadius:10, fontSize:11, color:'#ff4757', fontWeight:700 }}>🔥 HOT</div>
                )}
                <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                  {u.img && (
                    <img src={u.img} alt={u.title}
                      style={{ width:90, height:120, objectFit:'cover', borderRadius:10, flexShrink:0 }}
                      onError={e=>{e.currentTarget.style.display='none';}}
                    />
                  )}
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                      <h3 style={{ fontFamily:'Noto Sans KR', fontWeight:800, fontSize:18, margin:0, color:'#f0f2ff' }}>{u.title}</h3>
                      {u.genre && <span style={{ fontSize:11, background:'rgba(74,158,255,0.15)', color:'#4a9eff', border:'1px solid rgba(74,158,255,0.3)', padding:'2px 8px', borderRadius:999, fontFamily:'Noto Sans KR', fontWeight:600 }}>{u.genre}</span>}
                    </div>
                    <div style={{ display:'flex', gap:12, marginBottom:8, flexWrap:'wrap', fontSize:13, fontFamily:'Noto Sans KR' }}>
                      <span style={{ color:'#4a9eff', fontWeight:700 }}>📅 {u.date}</span>
                      {u.developer && <span style={{ color:'#8a8fa8' }}>🏢 {u.developer}</span>}
                    </div>
                    <p style={{ fontSize:13, color:'#c8cce0', lineHeight:1.8, margin:'0 0 10px', fontFamily:'Noto Sans KR', fontWeight:500 }}>{u.desc}</p>
                    {u.platforms && u.platforms.length > 0 && (
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                        {u.platforms.map(p => (
                          <span key={p} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,0.06)', color:'#c8cce0', border:'1px solid rgba(255,255,255,0.1)' }}>{p}</span>
                        ))}
                      </div>
                    )}
                    {u.youtubeId && (
                      <a href={`https://www.youtube.com/watch?v=${u.youtubeId}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:'#ff0000', textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:700, padding:'5px 12px', background:'rgba(255,0,0,0.1)', border:'1px solid rgba(255,0,0,0.3)', borderRadius:6 }}
                      >▶ 공식 트레일러 보기</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────── 이벤트 탭 ───────────────────────────────────── */}
      {tab === 'events' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <span className="section-title" style={{ fontSize:16 }}>🎉 현재 진행 중/예정 이벤트</span>
          </div>

          {/* 타입 필터 */}
          <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
            {EVENT_TYPES.map(t => (
              <button key={t} onClick={()=>setEventType(t)} style={{
                padding:'5px 14px', borderRadius:999,
                border:`1px solid ${eventType===t?'#00d68f':'rgba(255,255,255,0.1)'}`,
                background: eventType===t?'rgba(0,214,143,0.15)':'transparent',
                color: eventType===t?'#00d68f':'#8a8fa8',
                fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s'
              }}>{t}</button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px,1fr))', gap:14 }}>
            {shownEvents.map((ev, i) => (
              <div key={i} style={{
                borderRadius:14, padding:'18px 20px',
                background: '#1c1e26',
                border:`1px solid ${ev.color}44`,
                position:'relative', overflow:'hidden',
                animation:`fadeInUp 0.3s ${i*0.05}s ease both`,
                transition:'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.3)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
              >
                {/* 상태 뱃지 */}
                <div style={{ position:'absolute', top:14, right:14, fontSize:10, padding:'2px 8px', borderRadius:999,
                  background: ev.status==='진행중'?'rgba(0,214,143,0.2)':'rgba(74,158,255,0.2)',
                  color: ev.status==='진행중'?'#00d68f':'#4a9eff',
                  border: `1px solid ${ev.status==='진행중'?'rgba(0,214,143,0.4)':'rgba(74,158,255,0.4)'}`,
                  fontWeight:700, fontFamily:'Noto Sans KR',
                }}>
                  {ev.status==='진행중'?'● 진행중':'◎ 예정'}
                </div>

                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:`${ev.color}22`, border:`1px solid ${ev.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{ev.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:14, color:'#f0f2ff', marginBottom:3, lineHeight:1.4 }}>{ev.title}</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, color:ev.color, fontWeight:700 }}>{ev.platform}</span>
                      <span style={{ fontSize:10, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
                        {ev.start} ~ {ev.end}
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize:13, color:'#b0b8d0', lineHeight:1.7, margin:'0 0 12px', fontFamily:'Noto Sans KR', fontWeight:500 }}>{ev.desc}</p>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:10, background:`${ev.color}18`, color:ev.color, border:`1px solid ${ev.color}33`, padding:'2px 8px', borderRadius:999, fontWeight:700, fontFamily:'Noto Sans KR' }}>{ev.type}</span>
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:ev.color, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:600 }}>
                      바로가기 →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
