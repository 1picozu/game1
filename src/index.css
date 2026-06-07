@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

body {
  font-family: 'Noto Sans KR', sans-serif;
  background-color: #13141c;
  color: #e8eaf2;           /* 기본 텍스트 밝게 */
  min-height: 100vh;
  font-weight: 500;         /* 전체 기본 굵기 올림 */
  -webkit-font-smoothing: antialiased;
}

body.light {
  background-color: #f4f6fb;
  color: #0d0f1a;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #1a1c25; }
::-webkit-scrollbar-thumb { background: #3a3f5c; border-radius: 3px; }

/* ── GNB ── */
.gnb {
  background: rgba(19, 20, 28, 0.97);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(74, 158, 255, 0.2);
}
body.light .gnb {
  background: rgba(255,255,255,0.97);
  border-bottom: 1px solid rgba(74,158,255,0.3);
}

/* ── 게임 배지 ── */
.badge-lol       { background:#c8a84b22; color:#e0c060; border:1px solid #c8a84b66; font-weight:700; }
.badge-valorant  { background:#ff4e5022; color:#ff7b7d; border:1px solid #ff4e5066; font-weight:700; }
.badge-pubg      { background:#f5a62322; color:#f5a623; border:1px solid #f5a62366; font-weight:700; }
.badge-overwatch { background:#f9931222; color:#f99312; border:1px solid #f9931266; font-weight:700; }
.badge-starcraft { background:#4a9eff22; color:#4a9eff; border:1px solid #4a9eff66; font-weight:700; }
.badge-default   { background:#7c5cfc22; color:#b09ffe; border:1px solid #7c5cfc66; font-weight:700; }

/* ── 티어 색상 ── */
.tier-challenger { color:#f5d020; font-weight:800; }
.tier-master     { color:#d070e0; font-weight:800; }
.tier-diamond    { color:#80c8ff; font-weight:700; }
.tier-emerald    { color:#00e69a; font-weight:700; }
.tier-platinum   { color:#80d8da; font-weight:700; }
.tier-gold       { color:#f0c860; font-weight:700; }
.tier-silver     { color:#c0ccd8; font-weight:700; }
.tier-bronze     { color:#c88040; font-weight:700; }

/* ── 카드 ── */
.card {
  background: #1d1f2a;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 12px;
}
body.light .card {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.09);
}
.card-inner {
  background: #23253200;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
}
body.light .card-inner {
  background: #f6f8fc;
  border: 1px solid rgba(0,0,0,0.07);
}

/* ── 피드 아이템 ── */
.feed-item {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  color: #e8eaf2;
}
.feed-item:hover {
  background: rgba(74,158,255,0.07);
  border-color: rgba(74,158,255,0.25);
  transform: translateX(2px);
}

/* ── 인풋 ── */
.ggg-input {
  background: #0e0f17;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 6px;
  color: #f0f2ff;
  padding: 7px 11px;
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  transition: border-color 0.2s;
  font-family: 'Noto Sans KR', sans-serif;
}
body.light .ggg-input {
  background: #f4f6fb;
  border-color: rgba(0,0,0,0.14);
  color: #0d0f1a;
}
.ggg-input:focus { outline:none; border-color:#4a9eff; }

.ggg-select {
  background: #0e0f17;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 6px;
  color: #f0f2ff;
  padding: 7px 11px;
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  transition: border-color 0.2s;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
}
body.light .ggg-select {
  background: #f4f6fb;
  border-color: rgba(0,0,0,0.14);
  color: #0d0f1a;
}
.ggg-select:focus { outline:none; border-color:#4a9eff; }

/* ── 버튼 ── */
.btn-primary {
  background: linear-gradient(135deg,#4a9eff,#7c5cfc);
  border: none; border-radius: 8px; color:#fff;
  font-weight:700; padding:10px 24px; cursor:pointer;
  transition: opacity 0.2s, transform 0.1s;
  font-family:'Noto Sans KR',sans-serif;
}
.btn-primary:hover  { opacity:0.88; transform:translateY(-1px); }
.btn-primary:active { transform:translateY(0); }

/* ── 게임 카드 ── */
.game-card {
  border-radius: 12px; overflow:hidden; cursor:pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255,255,255,0.08);
}
.game-card:hover {
  transform: translateY(-7px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0,0,0,0.55);
}

/* ── 팀 결과 ── */
.team-card { border-radius:12px; padding:16px; animation:fadeInUp 0.4s ease forwards; }
.team-a { background:linear-gradient(135deg,rgba(74,158,255,0.14),rgba(74,158,255,0.05)); border:1px solid rgba(74,158,255,0.35); }
.team-b { background:linear-gradient(135deg,rgba(255,71,87,0.14),rgba(255,71,87,0.05));  border:1px solid rgba(255,71,87,0.35); }

/* ── 라이브 점 ── */
.live-dot { width:8px; height:8px; background:#00d68f; border-radius:50%; animation:livePulse 1.6s ease-in-out infinite; display:inline-block; }

/* ── 네비 버튼 ── */
.nav-btn {
  padding:6px 11px; border-radius:6px; font-size:12px; font-weight:700;
  cursor:pointer; background:transparent; border:none; color:#9095b0;
  transition:all 0.2s; font-family:'Noto Sans KR',sans-serif; white-space:nowrap;
}
.nav-btn:hover, .nav-btn.active {
  background:rgba(74,158,255,0.14); color:#4a9eff;
}
body.light .nav-btn { color:#606480; }
body.light .nav-btn:hover, body.light .nav-btn.active {
  background:rgba(74,158,255,0.12); color:#2a7ae8;
}

/* ── 섹션 제목 ── */
.section-title {
  font-family:'Rajdhani',sans-serif; font-weight:700; font-size:19px;
  letter-spacing:0.5px; color:#f0f2ff;
}
body.light .section-title { color:#0d0f1a; }

/* ── VS 배지 ── */
.vs-badge {
  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
  border-radius:999px; padding:6px 14px;
  font-family:'Rajdhani',sans-serif; font-weight:700; font-size:20px; color:#9095b0;
}

/* ── 공통 텍스트 가독성 강화 ── */
p, span, div, li { color: inherit; }

/* 서브 텍스트 */
.sub-text   { color:#b0b8d0; font-weight:500; }
.muted-text { color:#7a8098; font-weight:500; }

/* ── 스켈레톤 ── */
.skeleton-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.04) 80%);
  background-size:200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

/* ── 애니메이션 ── */
@keyframes fadeInUp {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes livePulse {
  0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(0,214,143,0.5); }
  50%     { opacity:0.7; box-shadow:0 0 0 5px rgba(0,214,143,0); }
}
@keyframes pulseGlow {
  0%,100% { opacity:1; }
  50%     { opacity:0.5; }
}

/* light mode cards */
body.light .card      { background:#fff; }
body.light .card-inner{ background:#f4f6fb; }
body.light .section-title { color:#0d0f1a; }
body.light .feed-item { color:#0d0f1a; }
body.light .nav-btn   { color:#606480; }

/* ── select 드롭다운 옵션 강제 다크 스타일 ── */
select { color-scheme: dark; }
select option {
  background: #1a1c28 !important;
  color: #f0f2ff !important;
  font-weight: 600;
}
.ggg-select option {
  background: #1a1c28 !important;
  color: #f0f2ff !important;
}

/* ── 전체 글씨 가독성 강화 ── */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 카드 내부 텍스트 기본 밝기 상향 */
.card p, .card span, .card div, .card li { color: inherit; }

/* 피드 아이템 제목 강화 */
.feed-item .title { font-weight: 700; color: #f0f2ff; }

/* 게시판 본문 텍스트 */
.board-content { color: #d0d4e4; font-weight: 500; line-height: 1.85; }
