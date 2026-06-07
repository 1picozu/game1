# 🚀 GAME.GG 배포 가이드

## 구조
```
gamegg-project/
├── src/           ← 프론트엔드 (Vercel)
├── server/        ← 백엔드 (Railway)
├── package.json   ← 프론트엔드용
└── .gitignore
```

---

## 1단계 — GitHub 업로드

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/1picozu/gamegg-project.git
git push -u origin main
```

---

## 2단계 — 백엔드: Railway

1. https://railway.app 가입 (GitHub 로그인)
2. **New Project → Deploy from GitHub repo** 선택
3. `gamegg-project` 레포 선택
4. **Settings → Root Directory** = `server` 로 변경
5. **Variables (환경변수)** 추가:

| Key | Value |
|-----|-------|
| `STEAM_API_KEY` | steamcommunity.com/dev/apikey 에서 발급 |
| `SESSION_SECRET` | 아무 랜덤 문자열 (예: abc123xyz) |
| `STEAM_RETURN_URL` | `https://[Railway도메인]/auth/steam/return` |
| `STEAM_REALM` | `https://[Railway도메인]` |
| `CLIENT_URL` | Vercel 주소 (3단계 후 입력) |
| `NODE_ENV` | `production` |

6. Deploy 후 도메인 확인 (예: `gamegg-server.railway.app`)

---

## 3단계 — 프론트엔드: Vercel

1. https://vercel.com 가입 (GitHub 로그인)
2. **New Project → Import** `gamegg-project` 레포
3. **Root Directory** = `/` (루트 그대로)
4. **Environment Variables** 추가:

| Key | Value |
|-----|-------|
| `VITE_RAWG_API_KEY` | rawg.io/apiv2 에서 발급 |
| `VITE_SERVER_URL` | `https://[Railway도메인]` |

5. Deploy 후 도메인 확인 (예: `gamegg.vercel.app`)

---

## 4단계 — Railway 환경변수 업데이트

Vercel 도메인 나오면 Railway로 돌아가서:
- `CLIENT_URL` = `https://gamegg.vercel.app` (실제 Vercel 주소)

---

## 5단계 — Steam API Key 도메인 설정

https://steamcommunity.com/dev/apikey 에서
도메인을 Vercel 주소로 변경

---

## ✅ 완료 확인

- `https://[Railway도메인]/health` → `{"status":"ok"}` 뜨면 백엔드 정상
- `https://[Vercel도메인]` → 사이트 정상 접속
- 리뷰어 랭킹 페이지에서 Steam 로그인 테스트
