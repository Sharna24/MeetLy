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

```bash
# 1. get the code
git clone https://github.com/<your-username>/meetly.git
cd meetly

# 2. install
cd backend && npm install
cd ../frontend && npm install

# 3. add your secrets (copy the example files and fill them in)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. start the database
docker compose up -d

# 5. run it! (two terminals)
cd backend && npm run start:dev      # API  -> http://localhost:3000
cd frontend && npm run dev           # App  -> http://localhost:5173
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
