import { useState } from 'react';
import { useApp } from '../store/AppContext';

const GAMES = ['리그오브레전드','발로란트','PUBG','오버워치 2','스타크래프트 2','디아블로 4','배틀그라운드','로스트아크','직접 입력'];
const TIERS = ['챌린저','마스터','다이아','에메랄드','플래티넘','골드','실버','브론즈','무관'];

export default function CreatePost() {
  const { state, navigate, addFriendsPost, addScrimPost } = useApp();
  const { pageParams, user } = state;
  const mode = pageParams.mode || 'friends';
  const isFriends = mode === 'friends';
  const accentColor = isFriends ? '#4a9eff' : '#ff4757';

  const [form, setForm] = useState({
    game: '리그오브레전드', customGame: '',
    title: '', time: '', customTime: '',
    maxSlots: isFriends ? 4 : 10,
    tier: '골드', customTier: '',
    tag: '', desc: '',
  });
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())            e.title = '방 제목을 입력해주세요.';
    if (form.title.trim().length < 2)  e.title = '제목은 2자 이상 입력해주세요.';
    return e;
  };

  const handleSubmit = () => {
    if (!user) { navigate('login'); return; }
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const finalGame = form.game === '직접 입력' ? (form.customGame.trim() || '기타') : form.game;
    const finalTime = form.time.trim() || '협의';
    const finalTier = form.tier;

    const post = {
      game:   finalGame,
      title:  form.title.trim(),
      time:   finalTime,
      slots:  `1/${form.maxSlots}`,
      tier:   finalTier,
      tag:    form.tag.trim() || null,
      desc:   form.desc.trim(),
      author: user.nickname,
    };

    if (isFriends) addFriendsPost(post);
    else           addScrimPost(post);

    setSubmitted(true);
    setTimeout(() => navigate(isFriends ? 'friends' : 'scrim'), 1400);
  };

  const iS = {
    width:'100%', background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(255,255,255,0.12)', borderRadius:8,
    color:'#f0f2ff', padding:'10px 13px', fontSize:13, fontWeight:500,
    fontFamily:'Noto Sans KR', transition:'border-color 0.2s', outline:'none', boxSizing:'border-box',
  };
  const fi = e => e.currentTarget.style.borderColor = accentColor;
  const fo = e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';

  const TIME_PRESETS = ['지금 바로','30분 후','1시간 후','오늘 저녁 7시','오늘 저녁 8시','오늘 저녁 9시','오늘 밤 10시','오늘 밤 11시','내일 오전'];

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'32px 16px', animation:'fadeInUp 0.3s ease' }}>
      <button onClick={()=>navigate(isFriends?'friends':'scrim')} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', marginBottom:20, fontFamily:'Noto Sans KR', fontWeight:600, padding:0 }}
        onMouseEnter={e=>e.currentTarget.style.color=accentColor} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
      >← {isFriends ? '게임친구 찾기' : '게임 내전 찾기'}로 돌아가기</button>

      {submitted ? (
        <div style={{ textAlign:'center', padding:'50px 20px', background:`${accentColor}11`, border:`1px solid ${accentColor}44`, borderRadius:16, animation:'fadeInUp 0.4s ease' }}>
          <div style={{ fontSize:44, marginBottom:14 }}>🎉</div>
          <div style={{ fontFamily:'Noto Sans KR', fontWeight:800, fontSize:20, color: accentColor, marginBottom:8 }}>{isFriends ? '파티' : '내전 방'} 생성 완료!</div>
          <div style={{ fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>잠시 후 목록으로 이동합니다...</div>
        </div>
      ) : (
        <div className="card p-6">
          {/* 헤더 */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div style={{ width:38, height:38, borderRadius:10, fontSize:20, background:`${accentColor}22`, border:`1px solid ${accentColor}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>{isFriends?'🎮':'⚔️'}</div>
            <div>
              <div className="section-title" style={{ fontSize:17 }}>{isFriends ? '새 파티 만들기' : '내전 방 만들기'}</div>
              <div style={{ fontSize:12, color:'#8a8fa8', marginTop:2, fontFamily:'Noto Sans KR' }}>{isFriends ? '같이 게임할 파티원을 모집하세요' : '5대5 내전 참가자를 모집하세요'}</div>
            </div>
          </div>

          {!user && (
            <div style={{ padding:'12px 14px', background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.3)', borderRadius:8, marginBottom:18, fontSize:13, color:'#f5a623', fontFamily:'Noto Sans KR', fontWeight:600 }}>
              ⚠️ 로그인 후 글을 작성할 수 있습니다.{' '}
              <button onClick={()=>navigate('login')} style={{ color:'#4a9eff', background:'none', border:'none', cursor:'pointer', fontFamily:'Noto Sans KR', fontSize:13, fontWeight:700 }}>로그인 →</button>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* 게임 선택 */}
            <div>
              <div style={{ fontSize:12, color:'#b0b8d0', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700 }}>게임 *</div>
              <select className="ggg-select" value={form.game} onChange={e=>set('game',e.target.value)} style={iS}>
                {GAMES.map(g=><option key={g}>{g}</option>)}
              </select>
              {form.game==='직접 입력' && (
                <input value={form.customGame} onChange={e=>set('customGame',e.target.value)} placeholder="게임 이름을 직접 입력하세요" style={{ ...iS, marginTop:8 }} onFocus={fi} onBlur={fo}/>
              )}
            </div>

            {/* 방 제목 */}
            <div>
              <div style={{ fontSize:12, color:'#b0b8d0', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700 }}>방 제목 *</div>
              <input value={form.title} onChange={e=>{set('title',e.target.value);setErrors({});}}
                placeholder={isFriends ? '예) 골드 이상 솔랭 같이 하실 분~' : '예) 에메랄드+ 5대5 내전 모집'}
                style={{ ...iS, borderColor: errors.title ? '#ff4757' : 'rgba(255,255,255,0.12)' }}
                onFocus={fi} onBlur={fo}/>
              {errors.title && <div style={{ fontSize:11, color:'#ff4757', marginTop:4, fontFamily:'Noto Sans KR', fontWeight:600 }}>⚠ {errors.title}</div>}
            </div>

            {/* 2열 그리드 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {/* 플레이 시간 — 직접 입력 텍스트필드 + 빠른 선택 */}
              <div>
                <div style={{ fontSize:12, color:'#b0b8d0', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700 }}>플레이 시간</div>
                <input
                  value={form.time}
                  onChange={e=>set('time',e.target.value)}
                  placeholder="예) 오늘 저녁 8시, 지금 바로, 주말 오후"
                  style={iS} onFocus={fi} onBlur={fo}
                />
                {/* 빠른 선택 칩 */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:7 }}>
                  {TIME_PRESETS.map(t=>(
                    <button key={t} type="button" onClick={()=>set('time',t)} style={{
                      padding:'3px 9px', fontSize:10, fontFamily:'Noto Sans KR',
                      background: form.time===t ? `${accentColor}33` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${form.time===t ? accentColor : 'rgba(255,255,255,0.12)'}`,
                      borderRadius:999, color: form.time===t ? accentColor : '#8a8fa8',
                      cursor:'pointer', fontWeight:600, transition:'all 0.15s',
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* 최대 인원 */}
              <div>
                <div style={{ fontSize:12, color:'#b0b8d0', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700 }}>최대 인원 ({form.maxSlots}명)</div>
                <input type="range" min={isFriends?2:4} max={isFriends?8:10} step={isFriends?1:2} value={form.maxSlots}
                  onChange={e=>set('maxSlots',Number(e.target.value))}
                  style={{ width:'100%', marginTop:8, accentColor }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#7a8098', marginTop:2, fontFamily:'Noto Sans KR' }}>
                  <span>{isFriends?'2명':'4명'}</span><span>{isFriends?'8명':'10명'}</span>
                </div>
              </div>

              {/* 최소 티어 */}
              <div>
                <div style={{ fontSize:12, color:'#b0b8d0', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700 }}>최소 티어</div>
                <select value={form.tier} onChange={e=>set('tier',e.target.value)}
                  style={{ ...iS, cursor:'pointer', colorScheme:'dark', WebkitAppearance:'auto' }}
                  onFocus={fi} onBlur={fo}
                >
                  {TIERS.map(t=><option key={t} style={{ background:'#1a1c28', color:'#f0f2ff', fontWeight:600 }}>{t}</option>)}
                </select>
              </div>

              {/* 태그 */}
              <div>
                <div style={{ fontSize:12, color:'#b0b8d0', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700 }}>태그 (선택)</div>
                <input value={form.tag} onChange={e=>set('tag',e.target.value)} placeholder="예) 마이크 필수, 즐겜" style={iS} onFocus={fi} onBlur={fo} maxLength={15}/>
              </div>
            </div>

            {/* 상세 설명 */}
            <div>
              <div style={{ fontSize:12, color:'#b0b8d0', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700 }}>상세 설명 (선택)</div>
              <textarea value={form.desc} onChange={e=>set('desc',e.target.value)}
                placeholder="추가로 전달할 내용을 자유롭게 적어주세요." rows={3}
                style={{ ...iS, resize:'vertical', lineHeight:1.7 }} onFocus={fi} onBlur={fo}/>
            </div>

            <button onClick={handleSubmit} style={{
              width:'100%', padding:'13px',
              background:`linear-gradient(135deg,${accentColor},${isFriends?'#7c5cfc':'#ff6b35'})`,
              border:'none', borderRadius:10, color:'#fff',
              fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'opacity 0.2s',
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity='0.88'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >{isFriends ? '🎮 파티 만들기' : '⚔️ 내전 방 만들기'}</button>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
