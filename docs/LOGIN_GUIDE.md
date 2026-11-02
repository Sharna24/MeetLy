# Meetly: Login with a BRAC University account, from A to Z

This guide takes you from an empty computer to a working, testable login. It explains **what** to do and **why**.

**What you will have at the end**

- A "Sign in with Google" button that only lets in BRAC University accounts (`@g.bracu.ac.bd` students, `@bracu.ac.bd` faculty).
- The user saved in a PostgreSQL database the first time they log in.
- A "Complete your profile" page (department, student ID, bio).
- A home page that only logged-in users can open, and a working logout.
- Automated tests that check the login rules.

---

## 0. How the login works (read this first)

```
 Browser (React)                Google                 Backend (NestJS)            PostgreSQL
      |                           |                          |                         |
 1.   |-- click "Sign in" ------->|                          |                         |
 2.   |<-- ID token (proof) ------|                          |                         |
 3.   |-- POST /auth/google {token} ------------------------>|                         |
 4.   |                           |<-- "is this token real?" |                         |
 5.   |                           |--- yes, email = x@... -->|                         |
 6.   |                           |             domain allowed? find or create user -->|
 7.   |<-- cookie "token" (login) + user data ---------------|                         |
 8.   |-- GET /auth/me (cookie is sent automatically) ------>|                         |
```

**Why this design?**

- **You never handle passwords.** Google does the login. Your server only decides who is allowed in.
- **The domain check happens on the server (step 6).** A check only in the browser can be skipped by anyone. The server is the one place users cannot change.
- **The login is a cookie marked `httpOnly`.** Scripts running in the page cannot read it, which protects against some attacks.
- **The ID token is verified by Google's library.** This confirms the token is genuine, was made for *your* app, and has not expired.

**Why PostgreSQL?** Users, friends, pokes and routines are linked to each other and have strict rules. A relational database is a good fit. Tables are created for you from the Model classes while you develop.

---

## 1. Install the tools

| Tool | Why | Get it |
|------|-----|--------|
| Node.js 22 LTS (includes npm) | runs the backend and builds the frontend | nodejs.org |
| Git | version control and GitHub | git-scm.com |
| Docker Desktop **or** PostgreSQL | the database (see section 3) | docker.com / postgresql.org |
| VS Code | editor | code.visualstudio.com |

Check in a terminal:
```bash
node -v      # v22.x or newer
npm -v
git --version
```

---

## 2. Get the project and put it on GitHub

1. Unzip `meetly-starter.zip`. You get a `meetly` folder:
```
meetly/
├── backend/             NestJS API (Models, Controllers, Services)
├── frontend/            React app (Views)
├── docs/                SRS, plan, diagrams, this guide
├── docker-compose.yml   local PostgreSQL
├── .gitignore           keeps secrets and junk out of GitHub
└── README.md
```
2. On github.com, create a new **empty** repository called `meetly` (do not add a README, you already have one).
3. In a terminal, inside the `meetly` folder:
```bash
git init
git add .
git commit -m "feat: starter project with Google login"
git branch -M main
git remote add origin https://github.com/<your-username>/meetly.git
git push -u origin main
```
`.gitignore` already excludes `node_modules`, build folders and `.env` files, so your secrets will not be uploaded.

Teammates then run `git clone` and follow sections 3 to 8 on their own computers.

---

## 3. PostgreSQL: set up the database

A database is where the app stores users permanently. The app expects:

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `meetly` |
| User | `meetly` |
| Password | `meetly` |

These are development-only values. Use real secrets when you deploy.

Pick **one** option.

### Option A: Docker (easiest)

1. Start Docker Desktop.
2. In the `meetly` folder:
```bash
docker compose up -d
```
This downloads PostgreSQL and starts it with the settings above, in the background.
3. Check it is running: `docker compose ps` should show `meetly-db` as running.
4. Stop it later with `docker compose stop`. Your data is kept. `docker compose down -v` deletes the data too.

### Option B: Install PostgreSQL on your computer

1. Install from postgresql.org. Remember the password you set for the `postgres` user.
2. Open **SQL Shell (psql)**, or pgAdmin's Query Tool, and run:
```sql
CREATE USER meetly WITH PASSWORD 'meetly';
CREATE DATABASE meetly OWNER meetly;
```

### Option C: A free hosted database (Neon or Supabase)

Create a project, copy its **connection string** (it starts with `postgres://` or `postgresql://`), and use it as `DATABASE_URL` in section 5. If it asks for SSL, add `?sslmode=require` at the end of the string.

### Do I need to create tables?

**No.** The backend creates the `users` table the first time it starts, from the Model in `backend/src/models/user.entity.ts` (the setting `synchronize: true` in `app.module.ts`). This is convenient for development. Before a real launch, switch to migrations instead.

### Looking inside the database

With Docker:
```bash
docker compose exec db psql -U meetly -d meetly
```
With a local install:
```bash
psql -h localhost -U meetly -d meetly
```
Or use a free app like **DBeaver** or **pgAdmin** with the settings in the table above.

Useful commands:
```sql
\dt                                   -- list tables
\d users                              -- show the columns of "users"
SELECT email, role, "profileComplete" FROM users;
DELETE FROM users WHERE email = 'you@g.bracu.ac.bd';   -- start fresh for a test
\q                                    -- quit
```

Make yourself an admin (the admin dashboard comes later):
```sql
UPDATE users SET role = 'admin' WHERE email = 'you@g.bracu.ac.bd';
```

---

## 4. Google Cloud: get a Client ID

Google must know about your app before it will show the sign-in button. **Why:** the Client ID tells Google which app is asking, and Google puts it inside every token so your server can check the token was made for your app.

1. Go to **console.cloud.google.com** and sign in with any Google account.
2. Top bar: **Select a project, then New project**. Name it `Meetly`, click **Create**.
3. Open the menu, then **APIs & Services, then OAuth consent screen** (it may be called **Google Auth Platform**).
   - User type: **External** (the Internal option is only for the university's own admin).
   - App name `Meetly`, your email as support and developer contact, then save. You can skip the optional parts.
4. Open **Credentials, then Create credentials, then OAuth client ID**.
   - Application type: **Web application**. Name: `Meetly web`.
   - **Authorized JavaScript origins**: add `http://localhost:5173`
   - Leave "Authorized redirect URIs" empty (the button does not use them).
   - Click **Create** and copy the **Client ID** (it ends with `.apps.googleusercontent.com`). You do not need the client secret.
5. **Test users.** New apps start in **Testing** mode: only emails you list can sign in.
   - Go to **OAuth consent screen (Audience), then Test users, then Add users**.
   - Add your BRAC email and your teammates' emails.
   - When you want everyone at BRAC to log in, click **Publish app**. Basic email and profile sign-in does not need Google's review.
6. When you deploy, come back and add your real website address (for example `https://meetly.vercel.app`) to the authorized origins.

---

## 5. Environment files (the settings)

Environment files keep secrets out of the code. They are **never** committed to GitHub; only the `.example` files are.

In the `meetly` folder:

**Mac / Linux**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
**Windows (Command Prompt)**
```bat
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Edit **`backend/.env`**:

| Variable | Meaning | What to put |
|----------|---------|-------------|
| `PORT` | port of the API | `3000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CLIENT_URL` | where the website runs; the API only accepts requests from here (CORS) | `http://localhost:5173` |
| `DATABASE_URL` | how to reach PostgreSQL | `postgres://meetly:meetly@localhost:5432/meetly` |
| `JWT_SECRET` | secret used to sign login cookies; anyone who knows it can fake a login | a long random string (below) |
| `GOOGLE_CLIENT_ID` | from section 4 | `xxxx.apps.googleusercontent.com` |
| `STUDENT_DOMAIN` | email domain that becomes a student | `g.bracu.ac.bd` |
| `FACULTY_DOMAIN` | email domain that becomes faculty | `bracu.ac.bd` |

Make a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Edit **`frontend/.env`**:

| Variable | What to put |
|----------|-------------|
| `VITE_API_URL` | `http://localhost:3000` |
| `VITE_GOOGLE_CLIENT_ID` | the **same** Client ID |

> Check the two domains with your own email. Students are assumed to use `@g.bracu.ac.bd` and faculty `@bracu.ac.bd`. If your university uses different ones, change them here. No code changes are needed.

---

## 6. Run the backend

```bash
cd backend
npm install
npm run start:dev
```
`npm install` downloads the libraries (only needed the first time). When it works you will see these two lines at the end:
```
Nest application successfully started
Meetly API running on http://localhost:3000
```
Quick check: open http://localhost:3000/auth/me in a browser. You should see `"Not logged in"` with status 401. That is correct: you have not logged in yet.

If it does not start, see **Troubleshooting** (section 10). The most common causes are the database not running or a wrong `DATABASE_URL`.

---

## 7. Run the automated tests

Keep the database running, then:
```bash
cd backend
npm test
```
These tests **pretend to be Google** (they replace the Google check with a fake one), so they test *your* rules without needing a real login. They check that:

- a personal Gmail account is rejected (403) and gets no cookie;
- a look-alike address such as `x@g.bracu.ac.bd.evil.com` is rejected;
- an unverified email is rejected (401);
- a fake or missing token is rejected;
- `/auth/me` and `/users/me` need a login;
- a student email creates a **student**, and a faculty email creates **faculty** (not yet verified);
- the full flow works: login, `/auth/me`, complete the profile, logout;
- a user cannot change their own `role` or `email` through the profile form;
- logging in twice does not create two users.

You should see **9 passed**. The tests only touch rows whose email starts with `e2e-` and delete them afterwards.

---

## 8. Run the frontend and test with a real Google account

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**.

### Manual test checklist

| # | Do this | You should see |
|---|---------|----------------|
| 1 | Open the site while logged out | the Login page |
| 2 | Click **Sign in with Google**, choose your `@g.bracu.ac.bd` account | the "Complete your profile" page |
| 3 | Fill department (and student ID), click **Save and continue** | the Home page showing your details |
| 4 | Refresh the page | you stay logged in |
| 5 | Click **Log out** | back on the Login page |
| 6 | Log in again | straight to Home (profile is remembered) |
| 7 | Try a personal Gmail (add it as a Google test user first) | the red message "Please sign in with your BRAC University Google account" |
| 8 | Look in the database (section 3) | one row with your email, `student`, `profileComplete = true` |

**Do not have a BRAC account handy to test?** Temporarily set `STUDENT_DOMAIN=gmail.com` in `backend/.env` and restart the backend. Now your Gmail logs in as a student. **Change it back before real use.**

---

## 9. How the code is organised (and why)

This follows the MVC structure from your project plan.

```
backend/src/
├── models/        M: user.entity.ts          what a "user" is (one table)
├── controllers/   C: auth.controller.ts      receives requests: /auth/google, /auth/me, /auth/logout
│                     users.controller.ts     PATCH /users/me (save profile)
├── services/         auth.service.ts         the login rules (domain check, find or create user)
│                     users.service.ts        database reads and writes for users
│                     google-verifier.service.ts   asks Google "is this token real?"
├── dtos/          update-profile.dto.ts      which profile fields are allowed, and limits
├── common/guards/ jwt-auth.guard.ts          blocks a route unless the login cookie is valid
├── modules/       auth.module.ts, users.module.ts   wire the pieces together (NestJS needs this)
├── app.module.ts                              database, config and login-token setup
└── main.ts                                    starts the server (CORS, cookies, validation)

frontend/src/
├── pages/         V: Login.tsx, SetupProfile.tsx, Home.tsx
├── context/       AuthContext.tsx            remembers "who is logged in" for every page
├── routes/        ProtectedRoute.tsx         sends logged-out users to /login
├── services/      api.ts                     one place that talks to the backend
└── types/         user.ts                    the shape of a user in TypeScript
```

**Why controllers stay thin:** they only take the request and return the result. The rules live in services, so they are easy to test and reuse.

**Why `GoogleVerifier` is its own class:** the tests swap it for a fake, so you can test without Google.

**Why the profile form only accepts three fields:** `UpdateProfileDto` lists `department`, `studentId` and `bio`. With `whitelist: true` (in `main.ts`), anything else the browser sends, such as `role: "admin"`, is thrown away.

**Why faculty start unverified:** anyone with a staff email would otherwise get faculty features. The `isVerified` column lets an admin approve faculty later (feature 16 in your plan).

### Adding the next feature the same way

1. **Model**: new file in `models/` (for example `routine-entry.entity.ts`). The table appears automatically in development.
2. **Service**: the logic, in `services/`.
3. **Controller**: the routes, in `controllers/`. Add `@UseGuards(JwtAuthGuard)` so only logged-in users can use them. Use `req.user.sub` as the current user's id.
4. **Module**: register the controller, service and entity (copy `users.module.ts`).
5. **Page**: a new file in `frontend/src/pages/`, calling the API through `services/api.ts`. Add its route in `App.tsx`.

---

## 10. Troubleshooting

| Problem | Cause and fix |
|---------|---------------|
| Backend: `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL is not running. Start Docker (`docker compose up -d`) or your local PostgreSQL. |
| Backend: `password authentication failed` | `DATABASE_URL` user or password does not match the database. |
| Backend: `JWT_SECRET` or config error | `backend/.env` is missing, or you forgot to copy `.env.example` to `.env`. |
| Port 5432 already in use | Another PostgreSQL is running. Stop it, or change the left number in `docker-compose.yml` (for example `"5433:5432"`) and use port 5433 in `DATABASE_URL`. |
| Google button does not appear | `VITE_GOOGLE_CLIENT_ID` is wrong or missing. Restart `npm run dev` after editing `.env`. |
| Google says `origin_mismatch` or error 400 | `http://localhost:5173` is not in the authorized JavaScript origins, or you opened the site on a different port or address. The address must match exactly. |
| Google says "Access blocked" or "not a test user" | The app is in Testing mode. Add the email under Test users, or publish the app. |
| Login says "Invalid Google token" | The Client ID in `backend/.env` differs from the one in `frontend/.env`. |
| Login says "Please sign in with your BRAC University Google account" | The email's domain does not match `STUDENT_DOMAIN` or `FACULTY_DOMAIN`. |
| Red message "Cannot reach the server" | The backend is not running, or `VITE_API_URL` is wrong. |
| Login works, but you are logged out on refresh | CORS or cookie problem. `CLIENT_URL` must be exactly `http://localhost:5173`, and use `localhost` (not `127.0.0.1`) in both URLs. |
| `npm test` fails to connect | The database is not running, or `DATABASE_URL` is wrong. |
| Changed `.env` but nothing changed | Restart the backend or frontend. They read `.env` only at startup. |

---

## 11. Before you deploy (later)

- Set `NODE_ENV=production`. The cookie then becomes `secure` (HTTPS only), and the automatic table creation turns off, so use migrations.
- Use a strong `JWT_SECRET` and a hosted database with its own password. Never reuse the development values.
- Add your real website address to the Google authorized origins and to `CLIENT_URL`.
- If the frontend and API are on **different domains**, change the cookie to `sameSite: 'none'` (it requires HTTPS) in `auth.controller.ts`, or put both under one domain.
- Publish the Google app so everyone at the university can sign in.
- Never commit `.env`. If a secret is ever pushed to GitHub, change it immediately.

---

## Quick command summary

```bash
# once
docker compose up -d                          # database
cp backend/.env.example backend/.env          # then edit it
cp frontend/.env.example frontend/.env        # then edit it
cd backend && npm install && cd ../frontend && npm install && cd ..

# every day (two terminals)
cd backend && npm run start:dev               # API   http://localhost:3000
cd frontend && npm run dev                    # site  http://localhost:5173

# check the login rules
cd backend && npm test
```
