# BFHL — SRM Full Stack Challenge

REST API + Frontend for the Bajaj Finserv Health Limited engineering challenge.

## Setup

```bash
npm install
npm start          # production
npm run dev        # development with nodemon
```

Server runs on **port 3000** by default (set `PORT` env var to override).

## Endpoints

| Method | Path    | Description        |
|--------|---------|--------------------|
| GET    | `/`     | Frontend UI        |
| POST   | `/bfhl` | Main API endpoint  |

## ⚠️ Before submitting — fill in your details

Open `index.js` and replace the three constants at the top:

```js
const USER_ID             = 'fullname_ddmmyyyy';
const EMAIL_ID            = 'your.email@college.edu';
const COLLEGE_ROLL_NUMBER = 'XXXXXXXX';
```

## Deploy to Render (free)

1. Push this repo to GitHub (public).
2. Go to [render.com](https://render.com) → New → Web Service.
3. Connect your repo. Build command: `npm install`. Start command: `npm start`.
4. Set `NODE_ENV=production` env var.
5. Done — your URL is `https://<app>.onrender.com`.

## Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Sample Request

```bash
curl -X POST https://your-app.onrender.com/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data":["A->B","A->C","B->D","X->Y","Y->Z","Z->X","hello","1->2"]}'
```
