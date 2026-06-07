import { createContext, useContext, useReducer } from 'react';
import { friendsFeedData, scrimFeedData } from '../mockData';

let nextId = 1000;
let nextCommentId = 5000;
let nextBoardId = 8000;

// ── localStorage 기반 가상 회원 DB ────────────────────────────────
function loadUsers() {
  try { return JSON.parse(localStorage.getItem('gamegg_users') || '[]'); }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem('gamegg_users', JSON.stringify(users));
}
function loadCurrentUser() {
  try { return JSON.parse(localStorage.getItem('gamegg_current_user') || 'null'); }
  catch { return null; }
}

// ── 게시판 초기 데이터 ──────────────────────────────────────────────
const BOARD_INIT = [
  { id: nextBoardId++, category:'자유', title:'롤 S15 근황 어때요?', content:'이번 시즌 메타가 너무 바뀐 것 같아서 적응이 힘드네요 ㅋㅋ 다들 현재 티어 어디에요? 저는 골드 찍고 슬금슬금 내려가는 중...', author:'Faker팬', tier:'골드', createdAt: new Date(Date.now()-3600000*5).toISOString(), views:142, likes:23, comments:[] },
  { id: nextBoardId++, category:'공략', title:'발로란트 조이트 공략 총정리 (입문자용)', content:'조이트 입문자를 위한 포지션, 스킬 사용법, 팁 정리했어요. 스모크 커버 구도부터 원타 각도까지 전부 담았습니다. 궁금한 거 댓글로 물어보세요!', author:'ValorantPro', tier:'다이아', createdAt: new Date(Date.now()-3600000*10).toISOString(), views:891, likes:157, comments:[
    { id: nextCommentId++, author:'뉴비유저', content:'정말 도움됐어요! 감사합니다', createdAt: new Date(Date.now()-3600000*2).toISOString() },
    { id: nextCommentId++, author:'실버탈출러', content:'원타 각도 부분이 특히 좋네요', createdAt: new Date(Date.now()-3600000).toISOString() },
  ] },
  { id: nextBoardId++, category:'유머', title:'ㅋㅋ 오늘 내전에서 생긴 일', content:'팀원이 "나 탑할게" 해놓고 정글 들어가서 레드 스틸 하더니 미드로 가서 CS 먹음 ㅋㅋㅋㅋ 거짓말 아님 실화임. 결국 우리팀 전원 탑 안감 ㅋㅋ', author:'억울한정글', tier:'실버', createdAt: new Date(Date.now()-3600000*2).toISOString(), views:503, likes:89, comments:[
    { id: nextCommentId++, author:'공감백퍼', content:'ㅋㅋㅋㅋㅋ 나도 이런 팀원 있었는데', createdAt: new Date(Date.now()-1800000).toISOString() },
  ] },
  { id: nextBoardId++, category:'질문', title:'PUBG 초보 총기 추천해주세요', content:'시작한지 이틀됐는데 무슨 총 들어야 하나요? AR은 M416이 좋다고 하는데 드롭 아이템이라 자주 없더라고요. 초반에 뭘 써야 할지 모르겠어요', author:'뉴비유저123', tier:'브론즈', createdAt: new Date(Date.now()-7200000).toISOString(), views:67, likes:8, comments:[] },
  { id: nextBoardId++, category:'자유', title:'게임 친구 만들기 진짜 어렵다', content:'내전 구하려고 여기저기 들어가봐도 다들 지인끼리만 하더라고요... GAME.GG 같은 플랫폼이 더 활성화됐으면 좋겠어요. 다들 친하게 지내요!', author:'솔로게이머', tier:'플래티넘', createdAt: new Date(Date.now()-86400000).toISOString(), views:234, likes:41, comments:[] },
  { id: nextBoardId++, category:'공략', title:'오버워치2 지원 역할 시작하는 법', content:'지원 입문러들이 제일 많이 하는 실수 모아봤어요. 힐 욕심, 무리한 단독행동, 궁극기 타이밍 미스... 하나씩 설명드릴게요.', author:'힐봇마스터', tier:'마스터', createdAt: new Date(Date.now()-3600000*8).toISOString(), views:677, likes:102, comments:[] },
  { id: nextBoardId++, category:'유머', title:'랭크게임 하다가 진짜 어이없는 거', content:'상대팀 원딜이 자기 팀 플래시 써달라고 채팅 치고 있음 ㅋㅋㅋ 뭔 게임이야 이게', author:'피식유발자', tier:'골드', createdAt: new Date(Date.now()-3600000*1).toISOString(), views:320, likes:55, comments:[] },
  { id: nextBoardId++, category:'자유', title:'오늘 처음으로 챌린저 달성했어요!', content:'3년 걸렸네요. 매 시즌마다 다이아에서 막혔는데 이번엔 드디어 뚫었어요. 다들 포기하지 마세요 ㅠㅠ 하다 보면 올라갑니다!', author:'드디어챌린저', tier:'챌린저', createdAt: new Date(Date.now()-3600000*3).toISOString(), views:1204, likes:387, comments:[
    { id: nextCommentId++, author:'부럽다', content:'축하드려요!! 저도 언젠가는...', createdAt: new Date(Date.now()-3000000).toISOString() },
  ] },
];

const initialState = {
  page: 'home',
  pageParams: {},

  friendsPosts: friendsFeedData.map(p => ({
    ...p, id: nextId++,
    createdAt: new Date(Date.now() - Math.random() * 7200000).toISOString(),
    author: p.author || ['Shadow','IronWolf','StarBurst','NightOwl','BlueFire'][Math.floor(Math.random()*5)],
    tier: p.tier || ['골드','실버','플래티넘','다이아'][Math.floor(Math.random()*4)],
    desc: p.desc || '',
    joinedBy: [],
    comments: [],
  })),
  scrimPosts: scrimFeedData.map(p => ({
    ...p, id: nextId++,
    createdAt: new Date(Date.now() - Math.random() * 7200000).toISOString(),
    author: p.author || ['NightHawk','IceDragon','BlazeKing','StormRider','VoidWalker'][Math.floor(Math.random()*5)],
    tier: p.tier || ['에메랄드','다이아','마스터','플래티넘'][Math.floor(Math.random()*4)],
    desc: p.desc || '',
    joinedBy: [],
    comments: [],
  })),

  boardPosts: BOARD_INIT,
  user: loadCurrentUser(),
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, page: action.page, pageParams: action.params || {} };

    // ── 피드 게시글 ───────────────────────────────────────────────
    case 'ADD_FRIENDS_POST': {
      const post = { ...action.post, id: ++nextId, createdAt: new Date().toISOString(), joinedBy: [], comments: [] };
      return { ...state, friendsPosts: [post, ...state.friendsPosts] };
    }
    case 'ADD_SCRIM_POST': {
      const post = { ...action.post, id: ++nextId, createdAt: new Date().toISOString(), joinedBy: [], comments: [] };
      return { ...state, scrimPosts: [post, ...state.scrimPosts] };
    }
    case 'JOIN_POST': {
      const { postId, feed, userId } = action;
      const key = feed === 'friends' ? 'friendsPosts' : 'scrimPosts';
      return {
        ...state,
        [key]: state[key].map(p => {
          if (p.id !== postId) return p;
          const [cur, max] = p.slots.split('/').map(Number);
          if (cur >= max || (p.joinedBy||[]).includes(userId)) return p;
          return { ...p, slots: `${cur+1}/${max}`, joinedBy: [...(p.joinedBy||[]), userId] };
        }),
      };
    }
    case 'LEAVE_POST': {
      const { postId, feed, userId } = action;
      const key = feed === 'friends' ? 'friendsPosts' : 'scrimPosts';
      return {
        ...state,
        [key]: state[key].map(p => {
          if (p.id !== postId) return p;
          const [cur, max] = p.slots.split('/').map(Number);
          return { ...p, slots: `${Math.max(1,cur-1)}/${max}`, joinedBy: (p.joinedBy||[]).filter(id => id !== userId) };
        }),
      };
    }
    case 'ADD_FEED_COMMENT': {
      const { postId, feed, comment } = action;
      const key = feed === 'friends' ? 'friendsPosts' : 'scrimPosts';
      const newComment = { ...comment, id: ++nextCommentId, createdAt: new Date().toISOString() };
      return {
        ...state,
        [key]: state[key].map(p => p.id === postId ? { ...p, comments: [...(p.comments||[]), newComment] } : p),
      };
    }

    // ── 게시판 ───────────────────────────────────────────────────
    case 'ADD_BOARD_POST': {
      const post = { ...action.post, id: ++nextBoardId, createdAt: new Date().toISOString(), views: 0, likes: 0, comments: [] };
      return { ...state, boardPosts: [post, ...state.boardPosts] };
    }
    case 'ADD_BOARD_COMMENT': {
      const { postId, comment } = action;
      const newComment = { ...comment, id: ++nextCommentId, createdAt: new Date().toISOString() };
      return {
        ...state,
        boardPosts: state.boardPosts.map(p => p.id === postId ? { ...p, comments: [...(p.comments||[]), newComment] } : p),
      };
    }
    case 'LIKE_BOARD_POST':
      return { ...state, boardPosts: state.boardPosts.map(p => p.id === action.postId ? { ...p, likes: (p.likes||0)+1 } : p) };
    case 'INC_VIEW':
      return { ...state, boardPosts: state.boardPosts.map(p => p.id === action.postId ? { ...p, views: (p.views||0)+1 } : p) };

    // ── 인증 ─────────────────────────────────────────────────────
    case 'LOGIN':
      localStorage.setItem('gamegg_current_user', JSON.stringify(action.user));
      return { ...state, user: action.user, toast: { msg: `${action.user.nickname}님 환영합니다! 🎮`, type: 'success' } };
    case 'LOGOUT':
      localStorage.removeItem('gamegg_current_user');
      return { ...state, user: null, toast: { msg: '로그아웃되었습니다.', type: 'info' } };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const navigate         = (page, params={}) => dispatch({ type:'NAVIGATE', page, params });
  const addFriendsPost   = post   => dispatch({ type:'ADD_FRIENDS_POST', post });
  const addScrimPost     = post   => dispatch({ type:'ADD_SCRIM_POST', post });
  const joinPost         = (postId, feed, userId) => dispatch({ type:'JOIN_POST', postId, feed, userId });
  const leavePost        = (postId, feed, userId) => dispatch({ type:'LEAVE_POST', postId, feed, userId });
  const addFeedComment   = (postId, feed, comment) => dispatch({ type:'ADD_FEED_COMMENT', postId, feed, comment });
  const addBoardPost     = post   => dispatch({ type:'ADD_BOARD_POST', post });
  const addBoardComment  = (postId, comment) => dispatch({ type:'ADD_BOARD_COMMENT', postId, comment });
  const likeBoardPost    = postId => dispatch({ type:'LIKE_BOARD_POST', postId });
  const incView          = postId => dispatch({ type:'INC_VIEW', postId });
  const login            = user   => dispatch({ type:'LOGIN', user });
  const logout           = ()     => dispatch({ type:'LOGOUT' });
  const clearToast       = ()     => dispatch({ type:'CLEAR_TOAST' });

  // 회원가입: localStorage 기반
  const signup = ({ nickname, password }) => {
    const users = loadUsers();
    if (users.find(u => u.nickname === nickname)) return { ok:false, msg:'이미 사용 중인 닉네임입니다.' };
    if (nickname.trim().length < 2) return { ok:false, msg:'닉네임은 2자 이상이어야 합니다.' };
    if (password.length < 4)        return { ok:false, msg:'비밀번호는 4자 이상이어야 합니다.' };
    saveUsers([...users, { id: Date.now(), nickname: nickname.trim(), password }]);
    return { ok:true };
  };

  // 로그인: 반드시 가입된 계정이어야 함
  const loginWithCreds = ({ nickname, password }) => {
    const users = loadUsers();
    const found = users.find(u => u.nickname === nickname && u.password === password);
    if (!found) return { ok:false, msg:'닉네임 또는 비밀번호가 일치하지 않습니다.' };
    login({ id: found.id, nickname: found.nickname });
    return { ok:true };
  };

  return (
    <AppContext.Provider value={{
      state, navigate,
      addFriendsPost, addScrimPost, joinPost, leavePost, addFeedComment,
      addBoardPost, addBoardComment, likeBoardPost, incView,
      login, logout, clearToast, signup, loginWithCreds,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
