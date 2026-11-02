<div align="center">

# 🌸 Meetly 🌸

### ✨ find the overlap between your free time and your friends' ✨

( ˘▽˘)っ♨ *"are you free right now? let's get chai!"* ♡

![made with love](https://img.shields.io/badge/made%20with-love-ffb6c1?style=for-the-badge)
![status](https://img.shields.io/badge/status-in%20progress-c3b1e1?style=for-the-badge)
![BRACU](https://img.shields.io/badge/for-BRAC%20University-b5ead7?style=for-the-badge)

</div>

---

## 🍡 What is Meetly?

Meetly is a cozy little social app for BRAC University students and faculty. 🎀
Share your class routine, see which friends are free in your gaps, and send them a **poke** to hang out! 💌

## 🌷 What can it do?

- 📅 **Share your routine** and see your free time automatically
- 👯 **See who's free** at the same time as you
- 💌 **Poke friends** with a hangout idea (they can say yes, no, or "how about later?")
- 🧑‍🏫 **Find faculty** who are free, and which room they're in
- 💬 **Chat** and share photos and instants 📸
- 🐾 **Stay safe** with trusted friends and an SOS button 🆘
- 🔒 **Stay private** with ghost mode, block and report

## 🧁 Made with

| 🎀 | Tech |
|----|------|
| Frontend | React + TypeScript ⚛️ |
| Backend | NestJS (Node.js) 🐈 |
| Database | PostgreSQL 🐘 |
| Login | Google Sign-In (BRAC accounts only) 🔑 |

## 🍓 Quick start
### 🧰 What you need first
- [Node.js](https://nodejs.org) 22 or newer
- [Git](https://git-scm.com)
- [PostgreSQL](https://www.postgresql.org/download/) 16 or newer (or Docker)
- A Google OAuth **Client ID**, see [`docs/LOGIN_GUIDE.md`](docs/LOGIN_GUIDE.md)

### 1. Get the code
```bash
git clone https://github.com/YOUR-USERNAME/meetly.git
cd meetly
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
Open `backend/.env` and set `JWT_SECRET` (any long random string) and `GOOGLE_CLIENT_ID`. Then:
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
You should see `9 passed`.
```

Then open http://localhost:5173 and sign in with your BRAC University Google account ♡

📖 Stuck? The full step-by-step guide (database, Google setup, testing, troubleshooting) is in [`docs/LOGIN_GUIDE.md`](docs/LOGIN_GUIDE.md).

## 🗂️ Folders

```
meetly/
├── 🐈 backend/    # models, controllers, services (the brain)
├── ⚛️ frontend/   # pages and components (what you see)
└── 📚 docs/       # SRS, plan, diagrams
```



<div align="center">

made with 💖 at BRAC University

(｡♥‿♥｡) *be kind, stay safe, see you at the cafeteria!*

</div>
