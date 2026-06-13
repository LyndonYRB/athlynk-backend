# Athlynk Backend

Node.js + Express API for Athlynk.

## Stack

- Express 5
- PostgreSQL 16
- Prisma
- JWT auth
- bcryptjs password hashing
- multer local uploads

## Local Setup

The Docker database maps host port `5433` to container port `5432`.

Expected `.env` for local development:

```env
PORT=4000
DATABASE_URL="postgresql://fitfriends:fitfriends_pw@127.0.0.1:5433/fitfriends"
JWT_ACCESS_SECRET="fitfriends_super_secret_change_me_123456789"
CLIENT_URL="http://localhost:5173"
```

Start from a clean local setup:

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d
npm run prisma:migrate
npm run dev
```

The API runs at `http://localhost:4000`.

## Local Data Helpers

Seed demo users:

```powershell
npm run seed
```

Reset only the local `fitfriends` database:

```powershell
npm run db:reset:local
```

The reset script refuses to run unless `DATABASE_URL` points at `localhost` or `127.0.0.1` and the `fitfriends` database.

## API Endpoints

Health:
- `GET /health`

Auth/current user:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /me`

Profile/preferences:
- `GET /profile/me`
- `PATCH /profile/me`
- `GET /preferences`
- `PATCH /preferences`

Photos:
- `POST /photos`
- `PATCH /profile/me/photos`
- `DELETE /photos/:id`
- Static files served from `/uploads/<filename>`

Discover/users:
- `GET /discover`
- `GET /users/:id`

Social:
- `POST /swipes`
- `POST /connections`
- `GET /connections`

Messages:
- `GET /conversations`
- `GET /conversations/:userId/messages`
- `POST /conversations/:userId/messages`

Safety:
- `POST /blocks`
- `POST /reports`

Protected routes require:

```text
Authorization: Bearer <accessToken>
```

## Smoke Test Commands

Health:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:4000/health
```

Register and save token:

```powershell
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$register = Invoke-RestMethod -Method Post -Uri http://localhost:4000/auth/register -ContentType "application/json" -Body (@{
  email = "test+$stamp@example.com"
  phone = "555$($stamp.Substring($stamp.Length - 7))"
  password = "password123"
} | ConvertTo-Json)
$token = $register.accessToken
$register
```

Login:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/auth/login -ContentType "application/json" -Body (@{
  email = $register.user.email
  password = "password123"
} | ConvertTo-Json)
$token = $login.accessToken
```

Current user:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:4000/auth/me -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Get -Uri http://localhost:4000/me -Headers @{ Authorization = "Bearer $token" }
```

Create or update profile:

```powershell
$profileBody = @{
  name = "Lyndon"
  age = 30
  gender = "male"
  location = "New York, NY"
  skill = "intermediate"
  availability = @("morning", "evening")
  bio = "Looking for workout partners."
  interests = @("strength", "running")
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri http://localhost:4000/profile/me -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $profileBody
Invoke-RestMethod -Method Get -Uri http://localhost:4000/profile/me -Headers @{ Authorization = "Bearer $token" }
```

Preferences:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:4000/preferences -Headers @{ Authorization = "Bearer $token" }

$prefsBody = @{
  preferredActivities = @("strength", "running")
  genderPref = "any"
  ageMin = 18
  ageMax = 60
  radius = 25
  availabilityFilterOn = $false
  availabilityPref = @()
  skillPref = "any"
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri http://localhost:4000/preferences -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $prefsBody
```

Create a second user:

```powershell
$otherRegister = Invoke-RestMethod -Method Post -Uri http://localhost:4000/auth/register -ContentType "application/json" -Body (@{
  email = "partner+$stamp@example.com"
  phone = "559$($stamp.Substring($stamp.Length - 7))"
  password = "password123"
} | ConvertTo-Json)
$otherToken = $otherRegister.accessToken
$otherUserId = $otherRegister.user.id

$otherProfileBody = @{
  name = "Alex"
  age = 28
  gender = "male"
  location = "Brooklyn, NY"
  skill = "intermediate"
  availability = @("evening")
  bio = "Strength training partner."
  interests = @("strength", "running")
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri http://localhost:4000/profile/me -Headers @{ Authorization = "Bearer $otherToken" } -ContentType "application/json" -Body $otherProfileBody
```

Discover and user detail:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/discover?activities=strength&skill=intermediate&ageMin=18&ageMax=60&gender=male&availability=evening" -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/users/$otherUserId" -Headers @{ Authorization = "Bearer $token" }
```

Connect and message:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4000/swipes -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body (@{ targetUserId = $otherUserId; action = "like" } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri http://localhost:4000/connections -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body (@{ targetUserId = $otherUserId } | ConvertTo-Json)
Invoke-RestMethod -Method Get -Uri http://localhost:4000/connections -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post -Uri "http://localhost:4000/conversations/$otherUserId/messages" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body (@{ text = "Hey, want to train this week?" } | ConvertTo-Json)
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/conversations/$otherUserId/messages" -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Get -Uri http://localhost:4000/conversations -Headers @{ Authorization = "Bearer $token" }
```

Photo upload:

```powershell
$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
$photoPath = Join-Path $PWD "tmp-test-photo.png"
[IO.File]::WriteAllBytes($photoPath, [Convert]::FromBase64String($pngBase64))

$photo = Invoke-RestMethod -Method Post -Uri http://localhost:4000/photos -Headers @{ Authorization = "Bearer $token" } -Form @{ photo = Get-Item $photoPath }
Invoke-RestMethod -Method Patch -Uri http://localhost:4000/profile/me/photos -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body (@{ photoIds = @($photo.id) } | ConvertTo-Json)
Invoke-RestMethod -Method Delete -Uri "http://localhost:4000/photos/$($photo.id)" -Headers @{ Authorization = "Bearer $token" }

Remove-Item $photoPath
```

Reports and blocks:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4000/reports -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body (@{ targetUserId = $otherUserId; reason = "spam"; details = "Optional details" } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri http://localhost:4000/blocks -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body (@{ targetUserId = $otherUserId } | ConvertTo-Json)
```

Block behavior is mutual. After either user blocks the other, both users are filtered from each other's discover, connections, and conversations. Profile, connection, and message attempts between the two users return `403`.

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/discover" -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/discover" -Headers @{ Authorization = "Bearer $otherToken" }

try { Invoke-RestMethod -Method Get -Uri "http://localhost:4000/users/$otherUserId" -Headers @{ Authorization = "Bearer $token" } } catch { $_.Exception.Response.StatusCode.value__ }
try { Invoke-RestMethod -Method Post -Uri "http://localhost:4000/conversations/$($register.user.id)/messages" -Headers @{ Authorization = "Bearer $otherToken" } -ContentType "application/json" -Body (@{ text = "Can you see this?" } | ConvertTo-Json) } catch { $_.Exception.Response.StatusCode.value__ }
```
