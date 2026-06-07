import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';

// ── 이 사이트에만 있는 기능:
// 1. 플레이타임 직접 기록 (다른 사이트는 API만 연동, 직접 기록 불가)
// 2. 게임 버킷리스트 (하고 싶은 게임 위시리스트 + 상태 관리)
// 3. 플레이 일기 (소감/추천점수 남기기)
// 4. 연도별·장르별 플레이 통계 시각화

const GAME_STATUSES = ['플레이 중','완료','보류','위시리스트'];
const STATUS_COLOR = { '플레이 중':'#4a9eff','완료':'#00d68f','보류':'#f5a623','위시리스트':'#7c5cfc' };
const STATUS_ICON  = { '플레이 중':'🎮','완료':'✅','보류':'⏸','위시리스트':'💜' };
const GENRES_LIST  = ['Action','RPG','Shooter','Strategy','Adventure','Sports','Racing','Puzzle','Simulation','Indie'];

function loadLib()  { try { return JSON.parse(localStorage.getItem('gg_library')||'[]'); } catch { return []; } }
function saveLib(d) { localStorage.setItem('gg_library', JSON.stringify(d)); }

export default function TrackerPage() {
  const { navigate } = useApp();
  const [library, setLib]       = useState(loadLib);
  const [tab,     setTab]       = useState('library'); // library | stats | diary
  const [showAdd, setShowAdd]   = useState(false);
  const [filterSt,setFilterSt]  = useState('전체');
  const [form,    setForm]      = useState({ name:'', genre:'RPG', status:'위시리스트', hours:'', score:'', note:'' });

  useEffect(() => { saveLib(library); }, [library]);

  const addGame = () => {
    if (!form.name.trim()) return;
    setLib(l => [{
      id: Date.now(), name: form.name.trim(), genre: form.genre,
      status: form.status, hours: Number(form.hours)||0,
      score: Number(form.score)||0, note: form.note.trim(),
      addedAt: new Date().toISOString(),
    }, ...l]);
    setForm({ name:'', genre:'RPG', status:'위시리스트', hours:'', score:'', note:'' });
    setShowAdd(false);
  };

  const updateStatus = (id, status) => setLib(l => l.map(g => g.id===id ? {...g, status} : g));
  const updateHours  = (id, h)      => setLib(l => l.map(g => g.id===id ? {...g, hours:Number(h)||0} : g));
  const deleteGame   = (id)         => setLib(l => l.filter(g => g.id!==id));

  // 통계
  const totalHours   = library.reduce((s,g)=>s+(g.hours||0),0);
  const completed    = library.filter(g=>g.status==='완료').length;
  const playing      = library.filter(g=>g.status==='플레이 중').length;
  const wishlist     = library.filter(g=>g.status==='위시리스트').length;
  const genreStats   = GENRES_LIST.map(g=>({ genre:g, count:library.filter(x=>x.genre===g).length })).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
  const avgScore     = library.filter(g=>g.score>0).reduce((s,g,_,a)=>s+g.score/a.filter(x=>x.score>0).length,0);

  const filtered = filterSt==='전체' ? library : library.filter(g=>g.status===filterSt);

  const iS = { width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', padding:'8px 12px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 16px', animation:'fadeInUp 0.3s ease' }}>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
        >← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span className="section-title">📊 내 게임 라이브러리</span>
        <span style={{ fontSize:11, background:'rgba(0,214,143,0.1)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.25)', padding:'2px 8px', borderRadius:999, fontFamily:'Noto Sans KR' }}>GAME.GG 독점</span>
        <button onClick={()=>setShowAdd(true)} style={{ marginLeft:'auto', padding:'7px 18px', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR' }}>+ 게임 추가</button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'총 플레이 시간', value:`${totalHours.toLocaleString()}h`, icon:'⏱', color:'#4a9eff' },
          { label:'완료한 게임',    value:`${completed}개`,                  icon:'✅', color:'#00d68f' },
          { label:'플레이 중',      value:`${playing}개`,                    icon:'🎮', color:'#f5a623' },
          { label:'평균 평점',      value: avgScore ? `${avgScore.toFixed(1)}점` : '-',   icon:'⭐', color:'#f0c330' },
        ].map(s=>(
          <div key={s.label} style={{ background:'#1c1e26', border:`1px solid ${s.color}33`, borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:24, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#8a8fa8', marginTop:4, fontFamily:'Noto Sans KR' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div style={{ display:'flex', gap:2, marginBottom:20, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:3 }}>
        {[['library','📚 라이브러리'],['stats','📊 통계'],['diary','📝 플레이 일기']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:'9px', border:'none', borderRadius:7, background:tab===id?'rgba(74,158,255,0.2)':'transparent', color:tab===id?'#4a9eff':'#8a8fa8', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s' }}>{label}</button>
        ))}
      </div>

      {/* ── 라이브러리 탭 ── */}
      {tab==='library' && (
        <>
          {/* 필터 */}
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            {['전체', ...GAME_STATUSES].map(s=>(
              <button key={s} onClick={()=>setFilterSt(s)} style={{ padding:'5px 14px', borderRadius:999, border:`1px solid ${filterSt===s?(STATUS_COLOR[s]||'#4a9eff'):'rgba(255,255,255,0.1)'}`, background:filterSt===s?`${STATUS_COLOR[s]||'#4a9eff'}22`:'transparent', color:filterSt===s?(STATUS_COLOR[s]||'#4a9eff'):'#8a8fa8', fontSize:12, cursor:'pointer', fontFamily:'Noto Sans KR', fontWeight:700 }}>
                {STATUS_ICON[s]||'📋'} {s}
              </button>
            ))}
          </div>

          {filtered.length===0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', fontSize:14, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
              {library.length===0 ? '게임을 추가해보세요! 플레이타임, 평점, 메모를 기록할 수 있어요 🎮' : '해당 상태의 게임이 없어요.'}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {filtered.map(g=>(
                <div key={g.id} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${STATUS_COLOR[g.status]||'#4a9eff'}22`, border:`1px solid ${STATUS_COLOR[g.status]||'#4a9eff'}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{STATUS_ICON[g.status]}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:14, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</div>
                    <div style={{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>{g.genre}</span>
                      {g.score>0 && <span style={{ fontSize:11, color:'#f0c330' }}>{'★'.repeat(Math.round(g.score/2))} {g.score}/10</span>}
                      {g.note && <span style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>"{g.note}"</span>}
                    </div>
                  </div>
                  {/* 시간 입력 */}
                  <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                    <input type="number" min="0" value={g.hours||0} onChange={e=>updateHours(g.id,e.target.value)}
                      style={{ width:60, ...iS, padding:'5px 8px', textAlign:'center' }}/>
                    <span style={{ fontSize:11, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>h</span>
                  </div>
                  {/* 상태 변경 */}
                  <select value={g.status} onChange={e=>updateStatus(g.id,e.target.value)}
                    style={{ ...iS, width:110, padding:'5px 8px', cursor:'pointer', flexShrink:0 }}>
                    {GAME_STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>deleteGame(g.id)} style={{ padding:'5px 10px', background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.25)', borderRadius:6, color:'#ff4757', fontSize:12, cursor:'pointer', flexShrink:0 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── 통계 탭 ── */}
      {tab==='stats' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* 상태별 */}
          <div className="card p-5">
            <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:15, color:'#fff', marginBottom:16 }}>상태별 분포</div>
            {GAME_STATUSES.map(s=>{
              const cnt = library.filter(g=>g.status===s).length;
              const pct = library.length ? Math.round(cnt/library.length*100) : 0;
              return (
                <div key={s} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4, fontFamily:'Noto Sans KR' }}>
                    <span style={{ color:STATUS_COLOR[s], fontWeight:700 }}>{STATUS_ICON[s]} {s}</span>
                    <span style={{ color:'#8a8fa8' }}>{cnt}개 ({pct}%)</span>
                  </div>
                  <div style={{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:999 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:STATUS_COLOR[s], borderRadius:999, transition:'width 0.6s ease' }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 장르별 */}
          <div className="card p-5">
            <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:15, color:'#fff', marginBottom:16 }}>장르별 플레이</div>
            {genreStats.length===0
              ? <div style={{ color:'#5a5f78', fontSize:13, fontFamily:'Noto Sans KR' }}>게임을 추가하면 통계가 표시됩니다.</div>
              : genreStats.map(({genre,count})=>{
                const max = genreStats[0].count;
                return (
                  <div key={genre} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3, fontFamily:'Noto Sans KR' }}>
                      <span style={{ color:'#c8cce0', fontWeight:600 }}>{genre}</span>
                      <span style={{ color:'#8a8fa8' }}>{count}개</span>
                    </div>
                    <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:999 }}>
                      <div style={{ height:'100%', width:`${(count/max)*100}%`, background:'linear-gradient(90deg,#4a9eff,#7c5cfc)', borderRadius:999 }}/>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* 플레이 시간 top5 */}
          <div className="card p-5" style={{ gridColumn:'1/-1' }}>
            <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:15, color:'#fff', marginBottom:16 }}>⏱ 플레이 시간 TOP 5</div>
            {library.filter(g=>g.hours>0).sort((a,b)=>b.hours-a.hours).slice(0,5).map((g,i)=>(
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:18, color:'#f0c330', width:24, textAlign:'center' }}>{i+1}</div>
                <div style={{ flex:1, fontFamily:'Noto Sans KR', fontWeight:600, fontSize:13, color:'#fff' }}>{g.name}</div>
                <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:16, color:'#4a9eff' }}>{g.hours}h</div>
                <div style={{ width:120, height:6, background:'rgba(255,255,255,0.06)', borderRadius:999 }}>
                  <div style={{ height:'100%', width:`${(g.hours/library.filter(x=>x.hours>0).sort((a,b)=>b.hours-a.hours)[0]?.hours||1)*100}%`, background:'linear-gradient(90deg,#4a9eff,#00d68f)', borderRadius:999 }}/>
                </div>
              </div>
            ))}
            {library.filter(g=>g.hours>0).length===0 && <div style={{ color:'#5a5f78', fontSize:13, fontFamily:'Noto Sans KR' }}>플레이 시간을 기록하면 여기에 표시됩니다.</div>}
          </div>
        </div>
      )}

      {/* ── 플레이 일기 탭 ── */}
      {tab==='diary' && (
        <div>
          <div style={{ marginBottom:16, fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>소감이 있는 게임 목록 (라이브러리에서 메모가 있는 항목)</div>
          {library.filter(g=>g.note||g.score>0).length===0 ? (
            <div style={{ textAlign:'center', padding:'60px', fontSize:14, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
              게임을 추가할 때 소감이나 평점을 남겨보세요 📝
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {library.filter(g=>g.note||g.score>0).map(g=>(
                <div key={g.id} className="card" style={{ padding:'16px 18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:15, color:'#fff' }}>{g.name}</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      {g.score>0 && <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:18, color:'#f0c330' }}>{g.score}/10</span>}
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:999, background:`${STATUS_COLOR[g.status]}22`, color:STATUS_COLOR[g.status], border:`1px solid ${STATUS_COLOR[g.status]}44`, fontFamily:'Noto Sans KR' }}>{g.status}</span>
                    </div>
                  </div>
                  {g.score>0 && (
                    <div style={{ display:'flex', gap:2, marginBottom:8 }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                        <div key={n} style={{ flex:1, height:4, borderRadius:999, background: n<=g.score ? '#f0c330' : 'rgba(255,255,255,0.1)' }}/>
                      ))}
                    </div>
                  )}
                  {g.note && <div style={{ fontSize:13, color:'#a0a8c0', lineHeight:1.7, fontFamily:'Noto Sans KR', fontStyle:'italic' }}>"{g.note}"</div>}
                  <div style={{ fontSize:11, color:'#5a5f78', marginTop:8, fontFamily:'Noto Sans KR' }}>{g.genre} · {g.hours}h 플레이 · {new Date(g.addedAt).toLocaleDateString('ko-KR')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 게임 추가 모달 ── */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="card p-6" style={{ width:'100%', maxWidth:480, animation:'fadeInUp 0.25s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <span className="section-title">🎮 게임 추가</span>
              <button onClick={()=>setShowAdd(false)} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5, fontFamily:'Noto Sans KR' }}>게임 이름 *</div>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="게임 이름 입력" style={iS}
                  onFocus={e=>e.currentTarget.style.borderColor='#4a9eff'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5, fontFamily:'Noto Sans KR' }}>장르</div>
                  <select value={form.genre} onChange={e=>setForm(f=>({...f,genre:e.target.value}))} style={{ ...iS, cursor:'pointer' }}>
                    {GENRES_LIST.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5, fontFamily:'Noto Sans KR' }}>상태</div>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{ ...iS, cursor:'pointer' }}>
                    {GAME_STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5, fontFamily:'Noto Sans KR' }}>플레이 시간 (h)</div>
                  <input type="number" min="0" value={form.hours} onChange={e=>setForm(f=>({...f,hours:e.target.value}))} placeholder="0" style={iS}/>
                </div>
                <div>
                  <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5, fontFamily:'Noto Sans KR' }}>평점 (0~10)</div>
                  <input type="number" min="0" max="10" value={form.score} onChange={e=>setForm(f=>({...f,score:e.target.value}))} placeholder="0" style={iS}/>
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5, fontFamily:'Noto Sans KR' }}>소감 메모 (선택)</div>
                <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="간단한 소감을 적어보세요..." rows={3} style={{ ...iS, resize:'vertical', lineHeight:1.6 }}/>
              </div>
              <button onClick={addGame} style={{ padding:'12px', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR' }}>추가하기</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
