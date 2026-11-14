<div align="center">

# 🌸 Meetly 🌸

### ✨ find the overlap between your free time and your friends' ✨

( ˘▽˘)っ♨ *"are you free right now? let's get chai!"* ♡

![made with love](https://img.shields.io/badge/made%20with-love-ffb6c1?style=for-the-badge)
![status](https://img.shields.io/badge/status-in%20progress-c3b1e1?style=for-the-badge)
![BRACU](https://img.shields.io/badge/for-BRAC%20University-b5ead7?style=for-the-badge)
[![live on Render](https://img.shields.io/badge/live-on%20Render-a0d8ef?style=for-the-badge)](https://meetly-501n.onrender.com)

**🌐 Try it: [meetly-501n.onrender.com](https://meetly-501n.onrender.com)**

</div>

---

## 🍡 What is Meetly?

Meetly is a cozy little social app for BRAC University students and faculty. 🎀
Share your class routine, see which friends are free in your gaps, and send them a **poke** to hang out! 💌

## 🌐 Using the live site

- Sign in with your **BRAC University Google account** (`@g.bracu.ac.bd` for students, `@bracu.ac.bd` for faculty).
- While our Google app is in testing mode, only accounts on the team's test-user list can sign in. Ask the team to add your email.
- Meetly runs on free hosting that naps when nobody is using it 😴 The first visit after a quiet spell can take about a minute to wake up.

## 🌷 What can it do?

### ✅ Working now
- 🔑 **Sign in with Google**: BRAC accounts only, and students and faculty get the right role (faculty wait for admin verification)
- 🙂 **Set up your profile**: department, student ID (or initial for faculty) and a short bio
- 📅 **Routine and free-time engine** (backend): add, edit and delete classes with clash checks, and your free gaps are worked out for you
- 🧭 **App layout** with a sidebar menu (pages that aren't built yet say "coming soon")

### 🛠️ Coming next
- 📅 **Routine page** to build your week in the app and see your free time
- 👯 **See who's free** at the same time as you
- 💌 **Poke friends** with a hangout idea (they can say yes, no, or "how about later?")
- 🧑‍🏫 **Find faculty** who are free, and which room they're in
- 💬 **Chat** and share photos and instants 📸
- 🐾 **Stay safe** with trusted friends and an SOS button 🆘
- 🔒 **Stay private** with ghost mode, block and report

## 🧁 Made with

| 🎀 | Tech |
|----|------|
| Frontend | React + TypeScript + Vite ⚛️ |
| Backend | NestJS (Node.js) 🐈 |
| Database | PostgreSQL 🐘 (hosted on Neon) |
| Login | Google Sign-In (BRAC accounts only) 🔑 |
| Hosting | Render ☁️ |

## 🍓 Run it on your computer
### 🧰 What you need first
- [Node.js](https://nodejs.org) 22 or newer
- [Git](https://git-scm.com)
- [PostgreSQL](https://www.postgresql.org/download/) 16 or newer (or Docker)
- A Google OAuth **Client ID**: ask the team for our shared one (it already allows `http://localhost:5173`), or create your own with [`docs/LOGIN_GUIDE.md`](docs/LOGIN_GUIDE.md)

### 1. Get the code
```bash
git clone https://github.com/sakibhossain0/MeetLy.git
cd MeetLy
```

### 2. Set up the database
**With PostgreSQL installed:** open *SQL Shell (psql)* and run
```sql
CREATE USER meetly WITH PASSWORD 'meetly';
CREATE DATABASE meetly OWNER meetly;
```
**Or with Docker:**
```bash
docker compose up -d
```
The tables are created automatically when the backend starts.

### 3. Start the backend (terminal 1)
```bash
cd backend
npm install
cp .env.example .env
```
On Windows Command Prompt, use `copy .env.example .env` instead.

Open `backend/.env` and set `JWT_SECRET` (any long random string) and `GOOGLE_CLIENT_ID`. This makes a good secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Then:
```bash
npm run start:dev
```
You should see `Meetly API running on http://localhost:3000`.

### 4. Start the frontend (terminal 2)
```bash
cd frontend
npm install
cp .env.example .env
```
Open `frontend/.env` and set `VITE_GOOGLE_CLIENT_ID` to the **same** Client ID. Then:
```bash
npm run dev
```

### 5. Open it
Go to http://localhost:5173 and sign in with your BRAC University Google account ♡

### ✅ Run the tests (optional)
With the database running:
```bash
cd backend
npm test
```
You should see `26 passed` across 3 test suites (login rules, the routine API and the free-time maths).

📖 Stuck? The full step-by-step guide (database, Google setup, testing, troubleshooting) is in [`docs/LOGIN_GUIDE.md`](docs/LOGIN_GUIDE.md).

## 🚀 How it's deployed

```
browser ──▶ meetly-501n.onrender.com        (Render static site: the React app)
                 │
                 └─ /api/* ──▶ meetly-api-gi40.onrender.com   (Render web service: NestJS)
                                      │
                                      └──▶ Neon PostgreSQL
```

| Part | Where | Settings |
|------|-------|----------|
| Frontend | Render **Static Site** | root `frontend` · build `npm ci && npm run build` · publish `dist` |
| Backend | Render **Web Service** (free) | root `backend` · build `npm ci && npm run build` · start `npm run start:prod` |
| Database | **Neon** (PostgreSQL 16, Singapore) | its connection string goes in the backend's `DATABASE_URL` |

**Environment variables** are set in the Render dashboard and never committed:
- Frontend: `VITE_API_URL=/api`, `VITE_GOOGLE_CLIENT_ID`
- Backend: `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CLIENT_URL` (the live site's address), `NODE_ENV`, `STUDENT_DOMAIN`, `FACULTY_DOMAIN`, `CURRENT_SEMESTER`

**Rewrite rules** on the static site:

| Source | Destination | Action |
|--------|-------------|--------|
| `/api/*` | `https://meetly-api-gi40.onrender.com/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

The first rule means the browser only ever talks to one address, so the login cookie keeps working. The second makes links like `/login` work when you refresh the page.

**Updating the live site:** Render isn't hooked up to GitHub pushes. After merging into `main`, open each service on Render and choose **Manual Deploy → Deploy latest commit**.

**Good to know**
- The backend runs with `NODE_ENV=development` for now, so its tables are created automatically (we don't have migrations yet). Switch to migrations before a real launch, as section 11 of [`docs/LOGIN_GUIDE.md`](docs/LOGIN_GUIDE.md) explains.
- Our Google Client ID allows `https://meetly-501n.onrender.com` and `http://localhost:5173`. New testers go under **Google Auth Platform → Audience → Test users** (100 people max). Opening sign-in to everyone needs a home page and a privacy policy first.

## 🗂️ Folders

```
MeetLy/
├── 🐈 backend/    # models, controllers, services (the brain)
├── ⚛️ frontend/   # pages and components (what you see)
└── 📚 docs/       # SRS, plan, diagrams, login guide
```



<div align="center">

made with 💖 at BRAC University

(｡♥‿♥｡) *be kind, stay safe, see you at the cafeteria!*

</div>
