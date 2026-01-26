# FitFriends Backend — Developer Setup + Frontend Integration

This document is for **any developer** (frontend or backend) to run the backend locally and integrate the FitFriends UI with the API.

---

## Architecture (How everything connects)

**React Frontend (Vite)**  
→ sends HTTP requests (JSON + file upload)  
→ **Node.js + Express API** (`http://localhost:4000`)  
→ **Prisma ORM** (database client + schema/migrations)  
→ **PostgreSQL** (running locally in Docker container on `localhost:5432`)

**Photos flow**  
Frontend uploads image → `POST /photos` → server saves file to `uploads/` → DB stores photo URL → UI loads image via `http://localhost:4000/uploads/<filename>`

---

## Tech Stack (Backend)

- **Node.js**: runtime to run JavaScript server
- **Express**: REST API routing (endpoints like `/auth/login`, `/profile`)
- **PostgreSQL 16**: relational database for users, profiles, photos
- **Docker Desktop + Docker Compose**: runs PostgreSQL locally as a container (no manual DB install)
- **Prisma ORM**: defines DB schema, runs migrations, provides DB queries
- **bcrypt**: secure password hashing
- **jsonwebtoken (JWT)**: login tokens (Authorization header)
- **multer**: file uploads (photos)
- **dotenv**: loads `.env` configuration variables into `process.env`

---

# PART 1 — Run Backend Locally (Step-by-step)

## A) Prerequisites

Install:
- Node.js (LTS recommended)
- Docker Desktop

Verify:
```bash
node -v
docker -v
docker compose version
```

## B) Clone repo + install dependencies

```bash
git clone <BACKEND_REPO_URL>
cd fitfriends-backend
npm install
```

## C) Create `.env` (REQUIRED)

### What is `.env`?
A local configuration file containing environment variables (settings + secrets).  
It is **NOT committed to GitHub**, so each developer creates it locally.

```bash
touch .env
```

### open .env and paste:
```bash
PORT=4000
DATABASE_URL="postgresql://fitfriends:fitfriends_pw@localhost:5432/fitfriends"
JWT_ACCESS_SECRET="fitfriends_super_secret_change_me_123456789"
```

## D) Start PostgreSQL (Docker)

From the backend root folder (same place as `docker-compose.yml`):

```bash
docker compose up -d
docker ps
```

## E) Create DB tables (Prisma migrations)

This applies the Prisma schema to PostgreSQL and creates the required tables.

```bash
npx prisma migrate dev
npx prisma generate
```

## F) Start API server

Run the backend in development mode (auto-restarts on code changes):

```bash
npm run dev
```
