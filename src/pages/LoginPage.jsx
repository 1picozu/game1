import { useState } from 'react';
import { useApp } from '../store/AppContext';

export default function LoginPage() {
  const { navigate, signup, loginWithCreds } = useApp();
  const [tab,      setTab]     = useState('login');
  const [nickname, setNickname]= useState('');
  const [password, setPassword]= useState('');
  const [confirm,  setConfirm] = useState('');
  const [error,    setError]   = useState('');
  const [success,  setSuccess] = useState('');

  const reset = () => { setError(''); setSuccess(''); };

  const handleLogin = () => {
    reset();
    if (!nickname.trim()) { setError('닉네임을 입력하세요.'); return; }
    if (!password)        { setError('비밀번호를 입력하세요.'); return; }
    const res = loginWithCreds({ nickname: nickname.trim(), password });
    if (!res.ok) { setError(res.msg); return; }
    navigate('home');
  };

  const handleSignup = () => {
    reset();
    if (!nickname.trim())     { setError('닉네임을 입력하세요.'); return; }
    if (!password)            { setError('비밀번호를 입력하세요.'); return; }
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    const res = signup({ nickname: nickname.trim(), password });
    if (!res.ok) { setError(res.msg); return; }
    setSuccess('회원가입이 완료됐어요! 로그인 해주세요 🎉');
    setTab('login'); setPassword(''); setConfirm('');
  };

  const inputS = {
    width:'100%', background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(255,255,255,0.12)', borderRadius:8,
    color:'#e2e4ed', padding:'11px 14px', fontSize:14,
    fontFamily:'Noto Sans KR', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s',
  };
  const fi = e => e.currentTarget.style.borderColor='#4a9eff';
  const fo = e => e.currentTarget.style.borderColor='rgba(255,255,255,0.12)';

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:400, animation:'fadeInUp 0.35s ease' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:14, margin:'0 auto 10px', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Rajdhani', fontWeight:700, fontSize:22, color:'#fff' }}>GG</div>
          <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:26, background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>GAME.GG</div>
          <div style={{ fontSize:13, color:'#8a8fa8', marginTop:4, fontFamily:'Noto Sans KR' }}>같이 게임하는 세상</div>
        </div>

        <div className="card p-6">
          {/* 탭 */}
          <div style={{ display:'flex', marginBottom:24, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:3 }}>
            {[['login','로그인'],['signup','회원가입']].map(([t,label]) => (
              <button key={t} onClick={() => { setTab(t); reset(); }} style={{
                flex:1, padding:'8px', border:'none', borderRadius:6,
                background: tab===t ? 'rgba(74,158,255,0.2)' : 'transparent',
                color: tab===t ? '#4a9eff' : '#8a8fa8',
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s',
              }}>{label}</button>
            ))}
          </div>

          {success && <div style={{ fontSize:13, color:'#00d68f', background:'rgba(0,214,143,0.08)', border:'1px solid rgba(0,214,143,0.3)', padding:'10px 14px', borderRadius:8, marginBottom:14, fontFamily:'Noto Sans KR' }}>✅ {success}</div>}
          {error   && <div style={{ fontSize:13, color:'#ff4757', background:'rgba(255,71,87,0.08)',  border:'1px solid rgba(255,71,87,0.3)',  padding:'10px 14px', borderRadius:8, marginBottom:14, fontFamily:'Noto Sans KR' }}>⚠️ {error}</div>}

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5 }}>닉네임</div>
              <input value={nickname} onChange={e=>{setNickname(e.target.value);reset();}} placeholder="게임 닉네임" style={inputS} onFocus={fi} onBlur={fo} onKeyDown={e=>e.key==='Enter'&&(tab==='login'?handleLogin():null)} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5 }}>비밀번호 {tab==='signup' && <span style={{fontSize:11,color:'#5a5f78'}}>(4자 이상)</span>}</div>
              <input type="password" value={password} onChange={e=>{setPassword(e.target.value);reset();}} placeholder="비밀번호" style={inputS} onFocus={fi} onBlur={fo} onKeyDown={e=>e.key==='Enter'&&(tab==='login'?handleLogin():null)} />
            </div>
            {tab==='signup' && (
              <div>
                <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5 }}>비밀번호 확인</div>
                <input type="password" value={confirm} onChange={e=>{setConfirm(e.target.value);reset();}} placeholder="비밀번호 재입력" style={inputS} onFocus={fi} onBlur={fo} onKeyDown={e=>e.key==='Enter'&&handleSignup()} />
              </div>
            )}

            <button onClick={tab==='login'?handleLogin:handleSignup} style={{
              width:'100%', padding:'12px', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)',
              border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700,
              cursor:'pointer', fontFamily:'Noto Sans KR', marginTop:4, transition:'opacity 0.2s',
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity='0.88'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >{tab==='login' ? '로그인' : '회원가입'}</button>

            <div style={{ textAlign:'center', fontSize:12, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
              {tab==='login'
                ? <>계정이 없나요? <button onClick={()=>{setTab('signup');reset();}} style={{color:'#4a9eff',background:'none',border:'none',cursor:'pointer',fontFamily:'Noto Sans KR',fontSize:12}}>회원가입하기</button></>
                : <>이미 계정이 있나요? <button onClick={()=>{setTab('login');reset();}} style={{color:'#4a9eff',background:'none',border:'none',cursor:'pointer',fontFamily:'Noto Sans KR',fontSize:12}}>로그인하기</button></>
              }
            </div>
            <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#5a5f78', fontSize:12, cursor:'pointer', fontFamily:'Noto Sans KR', padding:4, textAlign:'center' }}>← 메인으로 돌아가기</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
