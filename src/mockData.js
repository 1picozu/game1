export const TIER_SCORES = {
  챌린저: 8, 마스터: 7, 다이아: 6, 에메랄드: 5,
  플래티넘: 4, 골드: 3, 실버: 2, 브론즈: 1,
};

export const TIER_CLASS = {
  챌린저: 'tier-challenger', 마스터: 'tier-master', 다이아: 'tier-diamond',
  에메랄드: 'tier-emerald', 플래티넘: 'tier-platinum', 골드: 'tier-gold',
  실버: 'tier-silver', 브론즈: 'tier-bronze',
};

export const GAME_BADGE_CLASS = {
  '리그오브레전드': 'badge-lol',
  '발로란트':       'badge-valorant',
  'PUBG':           'badge-pubg',
  '오버워치':       'badge-overwatch',
  '스타크래프트':   'badge-starcraft',
};

export const GAMES_LIST = [
  '리그오브레전드','발로란트','PUBG','오버워치','스타크래프트','디아블로','로스트아크','피파온라인',
];

export const TIERS = ['챌린저','마스터','다이아','에메랄드','플래티넘','골드','실버','브론즈'];

export const friendsFeedData = [
  { game:'리그오브레전드', title:'솔랭 같이 하실 분~ 실버 이상 구해요', slots:'2/4', time:'지금 바로', tag:'ADC 모집', author:'달빛라이너', tier:'실버', desc:'즐겜 위주로 합니다. 목소리 채팅 가능하신 분 우대, 욕설 금지입니다.' },
  { game:'발로란트', title:'다이아 이상 랭크 듀오 구해요', slots:'1/2', time:'오늘 오후 9시', tag:'시너지 중요', author:'제로포인트', tier:'다이아', desc:'듀오 랭크 올라갈 분. 현재 다이아1 있고 마스터까지 같이 가실 분 구합니다.' },
  { game:'PUBG', title:'스쿼드 즐겜 같이해요 초보환영', slots:'2/4', time:'오늘 저녁 8시', tag:'음성채팅', author:'바람총잡이', tier:'골드', desc:'치킨 먹는게 목적이 아닌 그냥 재미있게 하려고요. 초보분들도 환영합니다!' },
  { game:'오버워치', title:'플래티넘대 힐러 구합니다', slots:'1/5', time:'지금 바로', tag:'금방 올라요', author:'불꽃탱커', tier:'플래티넘', desc:'5인팟 구성중입니다. 힐러 한 명만 더 있으면 됩니다. 포지션 고정.' },
  { game:'리그오브레전드', title:'골드 정글 파티원 구해요 저녁 10시 이후', slots:'3/5', time:'오늘 밤 10시', tag:'탑/서폿 환영', author:'은하수정글', tier:'골드', desc:'5인팟 만들어서 내전 돌리려고 합니다. 탑, 서폿, 원딜 구해요.' },
  { game:'발로란트', title:'에피소드 초반 언랭 같이 올라갈 분', slots:'1/3', time:'내일 오전 11시', tag:'마이크 필수', author:'크림슨에이스', tier:'에메랄드', desc:'신규 에피소드 시작했는데 같이 배치 돌리실 분 구합니다. 마이크 필수예요.' },
  { game:'로스트아크', title:'카제로스 레이드 공대 구인', slots:'4/8', time:'오늘 저녁 9시', tag:'1580+ 이상', author:'성검의수호자', tier:'마스터', desc:'카제로스 노말 4관문 진행예정. 죽조 없는 분들 우대합니다.' },
  { game:'피파온라인', title:'FUT 친선 같이 하실 분', slots:'1/2', time:'지금 바로', tag:'즐겜', author:'골든부츠', tier:'골드', desc:'랭크 없이 그냥 친선으로 즐겜 하실 분이요.' },
];

export const scrimFeedData = [
  { game:'리그오브레전드', title:'에메랄드 5대5 내전 참가자 모집', slots:'7/10', time:'오늘 오후 9시', tag:'자체 리그', author:'폭풍의눈', tier:'에메랄드', desc:'에메 ~ 다이아 구간 유저 모집. 팀전으로 진행하며 주 2회 정기 내전입니다.' },
  { game:'발로란트', title:'플래티넘+ 빠른 내전 지금 바로 시작', slots:'8/10', time:'지금 바로', tag:'레이팅 무관', author:'나이트섀도우', tier:'플래티넘', desc:'2자리만 남았습니다. 빠르게 채울게요. 포지션 제한 없음.' },
  { game:'오버워치', title:'골드+ 내전 팀전 모집중', slots:'4/10', time:'오늘 저녁 7시', tag:'포지션 협의', author:'빛의수호자', tier:'골드', desc:'골드 이상 내전입니다. 포지션은 서로 협의해서 정합니다. 5대5 팀전.' },
  { game:'PUBG', title:'내전 스쿼드 빠르게 채웁니다', slots:'6/8', time:'지금 바로', tag:'팀킬 금지', author:'사막의여우', tier:'플래티넘', desc:'4인 스쿼드 2팀 구성해서 좁은 존 내전 진행합니다.' },
  { game:'스타크래프트', title:'TvP 내전 상대 구합니다 다이아급', slots:'1/2', time:'오늘 밤 11시', tag:'상위 레더', author:'전략가토스', tier:'다이아', desc:'다이아3 이상 테란 또는 저그 상대방 구합니다. 3판 2선 BO3' },
  { game:'리그오브레전드', title:'5대5 유저대전 빈자리 1명 채워요', slots:'9/10', time:'오늘 오후 10시', tag:'즉시 입장', author:'미드라이너', tier:'다이아', desc:'거의 다 찼어요. 서폿 한 명만 더 있으면 됩니다. 지금 바로 참가 가능.' },
  { game:'발로란트', title:'다이아 팀 vs 팀 내전 신청받아요', slots:'3/10', time:'내일 오후 8시', tag:'팀배틀', author:'레드스톰', tier:'다이아', desc:'다이아 구간 팀 대항전입니다. 팀 단위로 신청받고 있어요.' },
  { game:'로스트아크', title:'길드전 내전 길드원 모집', slots:'5/15', time:'이번 주 토요일', tag:'길드배틀', author:'영원한전쟁', tier:'마스터', desc:'길드전 준비하는 길드입니다. 활발한 활동 원하시는 분.' },
];

export const gameListData = [
  { id:1,  name:'리그오브레전드',       color:'#c8a84b', img:'https://picsum.photos/seed/lol/200/280',    genres:[], rating:null, metacritic:null, isApiData:false },
  { id:2,  name:'발로란트',             color:'#ff4e50', img:'https://picsum.photos/seed/val/200/280',    genres:[], rating:null, metacritic:null, isApiData:false },
  { id:3,  name:'PUBG',                 color:'#f5a623', img:'https://picsum.photos/seed/pubg/200/280',   genres:[], rating:null, metacritic:null, isApiData:false },
  { id:4,  name:'오버워치 2',           color:'#f99312', img:'https://picsum.photos/seed/ow2/200/280',    genres:[], rating:null, metacritic:null, isApiData:false },
  { id:5,  name:'스타크래프트 2',       color:'#4a9eff', img:'https://picsum.photos/seed/sc2/200/280',    genres:[], rating:null, metacritic:null, isApiData:false },
  { id:6,  name:'디아블로 4',           color:'#9b3a2c', img:'https://picsum.photos/seed/d4/200/280',     genres:[], rating:null, metacritic:null, isApiData:false },
  { id:7,  name:'로스트아크',           color:'#7c5cfc', img:'https://picsum.photos/seed/la/200/280',     genres:[], rating:null, metacritic:null, isApiData:false },
  { id:8,  name:'피파온라인 4',         color:'#00d68f', img:'https://picsum.photos/seed/fifa/200/280',   genres:[], rating:null, metacritic:null, isApiData:false },
  { id:9,  name:'배틀그라운드 모바일',  color:'#f5a623', img:'https://picsum.photos/seed/bgm/200/280',    genres:[], rating:null, metacritic:null, isApiData:false },
  { id:10, name:'메이플스토리',         color:'#4a9eff', img:'https://picsum.photos/seed/maple/200/280',  genres:[], rating:null, metacritic:null, isApiData:false },
  { id:11, name:'던전앤파이터',         color:'#ff4757', img:'https://picsum.photos/seed/dnf/200/280',    genres:[], rating:null, metacritic:null, isApiData:false },
  { id:12, name:'검은사막',             color:'#8b6914', img:'https://picsum.photos/seed/bdo/200/280',    genres:[], rating:null, metacritic:null, isApiData:false },
];

export const initialPlayers = [
  { name:'페이커',   tier:'챌린저' },
  { name:'구마유시', tier:'챌린저' },
  { name:'케리아',   tier:'마스터' },
  { name:'제우스',   tier:'다이아' },
  { name:'오너',     tier:'마스터' },
  { name:'',         tier:'골드' },
  { name:'',         tier:'실버' },
  { name:'',         tier:'플래티넘' },
  { name:'',         tier:'브론즈' },
  { name:'',         tier:'에메랄드' },
];
