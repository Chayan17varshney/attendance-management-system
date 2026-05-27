# MANIT Attendance System — Backend (`AttendanceMain`)

> Production-grade attendance management platform for **Maulana Azad National Institute of Technology (MANIT), Bhopal**.
> Built on **Node.js / Express**, backed by **MongoDB**, and deployed via **PM2** in cluster mode.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Mono-Repo Architecture](#2-mono-repo-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Directory Structure](#4-directory-structure)
5. [Data Models](#5-data-models)
6. [API Reference](#6-api-reference)
7. [Middleware Pipeline](#7-middleware-pipeline)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Security Controls](#9-security-controls)
10. [Logging & Observability](#10-logging--observability)
11. [Scheduled Jobs](#11-scheduled-jobs)
12. [Environment Variables](#12-environment-variables)
13. [Getting Started](#13-getting-started)
14. [Production Deployment (PM2)](#14-production-deployment-pm2)
15. [Submodules](#15-submodules)
16. [Known Limitations & Roadmap](#16-known-limitations--roadmap)

---

## 1. Project Overview

The MANIT Attendance System is a full-stack platform that replaces paper-based class attendance for a large engineering institution. Faculty members mark attendance through a React PWA; admins manage timetables, student rosters, and faculty assignments through a separate admin panel. The backend:

- Serves the compiled React SPA as static files from `public/dist/`, acting as a unified single-origin deployment.
- Exposes a RESTful JSON API consumed by both the web frontend and (optionally) the Android APK (`src/ApkFile/Attendance.apk`).
- Enforces **geo-IP blocking** (non-India requests are rejected at the edge before any route handler runs).
- Implements **dual JWT authentication** — a separate secret and middleware for faculty vs. admin roles.
- Runs a daily **cron job** that rebuilds the Section-Faculty mapping from live timetable data.
- Proxies all report-generation requests to a co-located `AttendanceReport2` microservice on port 3000.

---

## 2. Mono-Repo Architecture

```
attendanceProd2/                  ← root (git with submodules)
├── AttendanceMain/               ← this repo — Express API + SPA host
├── AttendanceReport2/            ← submodule: report-generation microservice (Node/Express)
└── Frontend-ReportGeneration/    ← submodule: React admin report UI (Vite PWA)
```

`AttendanceMain` is the **entry point**. It:
- Hosts the compiled frontend from `public/dist/`
- Forwards all `/api/report/*` traffic to `AttendanceReport2` via `axios` reverse-proxy
- Shares the same MongoDB Atlas cluster with `AttendanceReport2`

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules, `"type": "module"`) |
| Framework | Express 4 |
| Database | MongoDB 6 via native driver + Mongoose 8 |
| Authentication | JSON Web Tokens (`jsonwebtoken`) — dual-secret strategy |
| Password hashing | bcrypt (12 rounds) |
| Rate limiting | `rate-limiter-flexible` (in-memory, 5 req/s per IP) |
| Security headers | Helmet 8 |
| Geo-IP filtering | `geoip-lite` |
| Logging | Winston 3 + `winston-daily-rotate-file` |
| Scheduled jobs | `node-cron` |
| File uploads | Multer (memory storage) |
| Excel I/O | `xlsx` (read) + `json-as-xlsx` (write) |
| API docs | Swagger UI Express (`/api-docs`) |
| Process manager | PM2 (cluster mode, 4 instances) |
| Frontend (SPA) | React 18 + Vite + Tailwind + MUI (submodule) |

---

## 4. Directory Structure

```
AttendanceMain/
├── index.js                        # Application entry point — wires all middleware & routes
├── ecosystem.config.cjs            # PM2 cluster configuration
├── generateSecrets.js              # One-time JWT secret bootstrapper
├── swagger_ver3.0.json             # OpenAPI 3.0 specification (served at /api-docs)
├── .env.example                    # Environment variable template
│
├── public/
│   └── dist/                       # Compiled React SPA (static files served by Express)
│       ├── index.html
│       ├── sw.js                   # Workbox service worker (PWA)
│       └── assets/                 # Hashed JS/CSS bundles
│
└── src/
    ├── config/
    │   ├── mongodb.js              # MongoDB connection singleton (connect / getDB / getSession)
    │   └── responseModal.js        # Shared response shape helpers
    │
    ├── errorHandle/
    │   └── error.js                # ApplicationError class (extends Error, carries HTTP code)
    │
    ├── middleware/
    │   ├── jwt.middleware.js        # Faculty JWT guard — reads Authorization header
    │   ├── jwt.admin.middleware.js  # Admin JWT guard — reads Authorization header OR cookie
    │   ├── logger.middleware.js     # Winston request logger → logs/attendance-YYYY-MM-DD.log
    │   ├── cleanLogger.js          # Separate clean-log transport → logs/cleanedLogs/
    │   ├── admin.logger.js         # Admin-specific file logger → adminlogs.txt
    │   └── request.middleware.js   # IP-based rate limiter (5 req/s)
    │
    ├── features/                   # Domain modules (MVC — controller / model / repository / routes)
    │   ├── admin/
    │   ├── attendance/
    │   ├── class/
    │   ├── course/
    │   ├── deprtment/
    │   ├── report/                 # Reverse-proxy to AttendanceReport2 microservice
    │   ├── sectionFacultyMap/
    │   ├── student/
    │   ├── subject/
    │   ├── timetable/
    │   └── user/                   # Faculty (non-admin) users
    │
    ├── helper/
    │   ├── attendanceExcelMaker.js  # Builds & streams attendance .xlsx downloads
    │   └── excelToJson.js          # Converts uploaded .xlsx files to JSON arrays
    │
    ├── data/                       # Runtime Excel seed files & generated download temps
    │   └── studentList/            # Per-section / per-batch student roster .xlsx files
    │
    └── ApkFile/
        └── Attendance.apk          # Android client (served on demand)
```

---

## 5. Data Models

All collections live in the MongoDB database specified by `DB_URL`.

### `Users` (Faculty)

| Field | Type | Notes |
|---|---|---|
| `name` | String | Full name |
| `password` | String | bcrypt hash |
| `about` | String | Short bio |
| `employeeCode` | String | Unique identifier |
| `role` | String | e.g. `"faculty"` |
| `department` | String | |
| `email` | String | |
| `phone` | String | |
| `abbreviation` | String | Short name used in timetable display |

### `Admins`

| Field | Type | Notes |
|---|---|---|
| `employeeCode` | String | Primary key |
| `name` | String | |
| `password` | String | bcrypt hash |
| `email` | String | |
| `phone` | String | |
| `role` | String | `"super"` or branch-scoped (e.g. `"CSE"`) |

> **Role scoping:** A `super` admin can modify any branch's timetable. A branch-scoped admin can only modify their own branch.

### `Attendance`

| Field | Type | Notes |
|---|---|---|
| `ownerId` | ObjectId | Faculty who owns this register |
| `subjectId` | ObjectId | |
| `course` | String | e.g. `"B.Tech"` |
| `branch` | String | e.g. `"CSE"` |
| `semester` | String/Number | |
| `section` | String | e.g. `"1"` |
| `session` | String | Academic year, e.g. `"2023"` |
| `attendance` | Array of `AttendaceItem` | Each element = one class session |
| `isMarked` | Array | Tracks which sessions have been committed |

**`AttendaceItem`**

```js
{ date: String, attendance: Array<{Scholar No., Name of Student, isPresent}>, remark: String }
```

### `TimeTable`

| Field | Type | Notes |
|---|---|---|
| `ownerId` | ObjectId | Faculty owner |
| `TimeTable` | Object `{1..7: []}` | Keyed by day-of-week (1 = Monday) |
| `assignedToMe` | Object | Replacement classes assigned to this faculty |
| `meAssignedToOther` | Object | Classes this faculty delegated out |
| `request` | Array | Incoming replacement requests |
| `meRequestedOther` | Array | Outgoing replacement requests |

**`TimeTable[day]` entry fields:** `subject`, `branch`, `semester`, `timing`, `section`, `location`, `course`, `session`, `subjectCode`, `subjectName`, `_id`.

### `SectionFacultyMap`

Rebuilt nightly by the cron job. Maps each unique `(course, session, section, branch)` tuple to a list of `{subCode, subjectName, subjectId, ownerId}` entries, enabling efficient per-student attendance lookups without scanning every faculty's attendance register.

| Field | Type |
|---|---|
| `batch` | String |
| `department` | String |
| `section` | String |
| `course` | String |
| `map` | Array of `{subCode, subjectName, subjectId, ownerId}` |

### `Students`

| Field | Type |
|---|---|
| `scholarNumber` | String |
| `StudentName` | String |
| `branch` | String |
| `section` | String |
| `batch` | String |

### `Subjects`

| Field | Type |
|---|---|
| `subjectCode` | String |
| `subjectName` | String |
| `department` | String |
| `isElective` | Boolean |

---

## 6. API Reference

Full interactive documentation is available at **`/api-docs`** (Swagger UI, OpenAPI 3.0).

### Authentication

All protected endpoints require a JWT in the `Authorization` header:

```
Authorization: <token>
```

Admin endpoints additionally accept the token as an `httpOnly` cookie named `token`.

---

### User (Faculty) — `/api/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/signIn` | — | Faculty login. Returns JWT. |
| `GET` | `/signUpMany` | Admin JWT | Bulk-create faculty accounts from roster |
| `PUT` | `/changePassword` | Faculty JWT | Change own password |

---

### Admin — `/api/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/signIn` | — | Admin login. Sets `token` cookie + returns JWT. |
| `ALL` | `/logout` | — | Clears `token` cookie |
| `POST` | `/addTimeTable` | Admin JWT | Add a single timetable entry |
| `POST` | `/removeTimeTable` | Admin JWT | Remove a timetable entry |
| `POST` | `/getTimetable` | Admin JWT | Query timetable by filter |
| `POST` | `/modifyTimetable` | Admin JWT | Update an existing timetable entry |
| `POST` | `/uploadStudentList` | Admin JWT | Bulk-import students from `.xlsx` (multipart) |
| `POST` | `/uploadTimetable` | Admin JWT | Bulk-import timetable from `.xlsx` (multipart) |
| `POST` | `/uploadFacultyList` | Admin JWT | Bulk-import faculty from `.xlsx` (multipart) |
| `POST` | `/uploadSubjectList` | Admin JWT | Bulk-import subjects from `.xlsx` (multipart) |
| `POST` | `/addElectiveList` | Admin JWT | Upload elective enrollment list |
| `GET` | `/searchFaculty` | — | Search faculty by query param |
| `GET` | `/courseFilter` | — | List available branches/courses |
| `POST` | `/attendanceByScholarId` | Admin JWT | Full attendance summary for a scholar number |

---

### Attendance — `/api/attendance`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/getAttendance` | Faculty JWT | Fetch attendance register for a subject+section |
| `POST` | `/setAttendance` | Faculty JWT | Mark attendance for a class session |
| `POST` | `/addNewList` | Admin JWT | Initialize a new attendance register |
| `POST` | `/analysis` | Faculty JWT | Per-student attendance statistics |
| `GET` | `/dashboardHelper` | Faculty JWT | Aggregate data for the faculty dashboard |
| `GET` | `/downloadAttendance` | Faculty JWT | Stream attendance as `.xlsx` download |
| `POST` | `/attendanceByScholarId` | Faculty JWT | Attendance summary for a specific scholar |

**`setAttendance` — body fields:**

```jsonc
{
  "subjectId": "<ObjectId>",
  "section": "1",
  "branch": "CSE",
  "data": [ { "Scholar No.": "...", "Name of Student": "...", "isPresent": true } ],
  "count": 1,
  "dateTime": "2025-04-01T09:00:00Z",
  "isTemp": false,   // true = replacement/proxy class
  "remark": ""
}
```

---

### Timetable — `/api/timetable`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/timeTable` | Faculty JWT | Fetch own weekly timetable |
| `POST` | `/addClass` | Faculty JWT | Add a class to own timetable |
| `POST` | `/replacement` | Faculty JWT | Request a replacement/proxy class |
| `GET` | `/requestList` | Faculty JWT | List incoming replacement requests |
| `POST` | `/acceptRequest` | Faculty JWT | Accept a replacement request |
| `POST` | `/rejectRequest` | Faculty JWT | Reject a replacement request |

---

### Student — `/api/student`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/findByScholar` | Faculty JWT | Lookup student by scholar number |
| `GET` | `/getStudentList` | Faculty JWT | List all students (filterable) |
| `POST` | `/addElectiveList` | Faculty JWT | Assign students to an elective |

---

### Subject — `/api/subject`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/getSubject` | Faculty JWT | List subjects (filtered by faculty's dept.) |
| `POST` | `/addSubject` | Admin JWT | Create a new subject |

---

### Section-Faculty Map — `/api/map`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/addMap` | Faculty JWT | Manually add a section-faculty mapping entry |

---

### Report Proxy — `/api/report`

All methods on `/**` are proxied (with full header/body/query forwarding) to the `AttendanceReport2` service on `http://localhost:3000`. Requires Admin JWT.

---

## 7. Middleware Pipeline

Every request passes through the following chain in order:

```
bodyParser.json()
bodyParser.urlencoded()
cookieParser()
cors()
express.json()
loggerMiddleware          → writes to logs/attendance-YYYY-MM-DD.log
rateLimiterMiddleware     → 5 req/s per IP (429 on breach)
geoIP guard               → 403 for non-IN traffic
helmet()                  → sets security headers (CSP, HSTS, etc.)
cleanLoggerMiddleware     → writes to logs/cleanedLogs/attendance-YYYY-MM-DD.log
ApplicationError handler  → maps ApplicationError instances to HTTP status codes
express.static()          → serves public/dist/ (SPA)
[feature routes]
SPA fallback: GET *        → returns public/dist/index.html
404 catch-all
```

Sensitive endpoints (`/signIn`, `/signUp`, `/changePassword`) are excluded from both logger middlewares to prevent credential leakage in log files.

---

## 8. Authentication & Authorization

The system uses **two completely independent JWT secrets**, each guarded by its own middleware:

| Middleware | Secret env var | Token source | Used for |
|---|---|---|---|
| `jwt.middleware.js` (`jwtAuthProf`) | `JWT_SECRET_TEACHER` | `Authorization` header | All faculty-facing endpoints |
| `jwt.admin.middleware.js` (`jwtAuthAdmin`) | `JWT_SECRET_ADMIN` | `Authorization` header **or** `token` cookie | All admin-facing endpoints |

**Token payload (faculty):**
```jsonc
{ "userID": "<ObjectId>", "iat": ..., "exp": ... }
```

**Token payload (admin):**
```jsonc
{ "userID": "<ObjectId>", "role": "super" | "<branch>", "iat": ..., "exp": ... }
```

Admin route handlers perform **inline role checks** before delegating to the controller — a branch-scoped admin (e.g. `role === "CSE"`) cannot modify timetables for another branch.

---

## 9. Security Controls

| Control | Implementation |
|---|---|
| Geo-IP blocking | `geoip-lite` — requests from outside India (`country !== "IN"`) receive HTTP 403 before hitting any route |
| Rate limiting | `rate-limiter-flexible` (in-memory) — 5 points per second per forwarded IP. HTTP 429 on breach |
| Security headers | `helmet` — sets `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, etc. |
| Password storage | `bcrypt` with cost factor 12 |
| Credential log exclusion | Logger middlewares skip URLs containing `signIn`, `signUp`, `changePassword` |
| Cookie security | Admin `token` cookie set with `httpOnly: true`, `secure: true`, `sameSite: "Lax"` |
| Secret generation | `generateSecrets.js` — one-time script writes UUID-based secrets to `.env`; does not overwrite existing values |
| File upload | Multer uses **memory storage** — files never touch disk; raw buffers are processed in-controller |

---

## 10. Logging & Observability

Three independent logging transports run concurrently:

### Request Logger (`logger.middleware.js`)
- **Destination:** `src/logs/attendance-YYYY-MM-DD.log` (daily rotation, gzip archive, 30-day retention, 10 MB max per file)
- **Format:** JSON with timestamp
- **Content:** `<url> - <body> - DateTime <date> ip:<x-forwarded-for> method:<METHOD>`

### Clean Logger (`cleanLogger.js`)
- **Destination:** `logs/cleanedLogs/attendance-YYYY-MM-DD.log` (same rotation policy)
- **Purpose:** A separate, curated log stream — same content format, physically separate so raw verbose logs can be purged independently

### Admin Logger (`admin.logger.js`)
- **Destination:** `adminlogs.txt` (flat file, no rotation)
- **Purpose:** Captures admin-panel API calls for audit

All three loggers exclude auth endpoints (`signIn`, `signUp`, `changePassword`) to prevent credential exposure.

---

## 11. Scheduled Jobs

A single `node-cron` job runs at **03:00 AM daily**:

```
cron.schedule("0 3 * * *", generateSectionFacultyMap)
```

**`generateSectionFacultyMap()` workflow:**

1. Reads all documents from the `TimeTable` collection.
2. Iterates every day and every period entry to extract `(course, session, section, branch)` tuples.
3. Deduplicates subject entries per section.
4. Atomically replaces the entire `SectionFacultyMap` collection (`deleteMany` → `insertMany`).

This mapping is the critical index that powers per-student attendance lookups without requiring cross-faculty collection scans.

---

## 12. Environment Variables

Copy `.env.example` to `.env` and fill in your values. **Never commit `.env`.**

```dotenv
# MongoDB Atlas connection string
DB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT secrets — must be different, long random strings
# Auto-generate with: node generateSecrets.js
JWT_SECRET_TEACHER=<random_secret>
JWT_SECRET_ADMIN=<different_random_secret>

# HTTP server port
PORT=5004
```

To generate secrets automatically:

```bash
node generateSecrets.js
```

This writes `JWT_SECRET_ADMIN` and `JWT_SECRET_TEACHER` to `.env` using UUIDs. It is idempotent — existing values are never overwritten.

---

## 13. Getting Started

### Prerequisites

- Node.js ≥ 18 (ES Module support required)
- MongoDB Atlas cluster (or self-hosted MongoDB ≥ 6)
- Git (with submodule support)

### Clone with submodules

```bash
git clone --recurse-submodules https://github.com/<your-org>/attendanceProd2.git
cd attendanceProd2/AttendanceMain
```

If already cloned without submodules:

```bash
git submodule update --init --recursive
```

### Install & configure

```bash
npm install

# Copy env template and fill in values
cp .env.example .env
# Edit .env with your DB_URL, JWT secrets, and PORT

# Or auto-generate JWT secrets:
node generateSecrets.js
```

### Build the frontend (optional — pre-built dist is included)

```bash
cd ../Frontend-ReportGeneration
npm install
npm run build
# Copy dist/ output into AttendanceMain/public/dist/
```

### Run in development

```bash
node --watch index.js
# or with nodemon:
npx nodemon index.js
```

The server starts on `PORT` (default `5004`). Swagger UI is accessible at `http://localhost:5004/api-docs`.

---

## 14. Production Deployment (PM2)

The `ecosystem.config.cjs` file configures PM2 to run **4 clustered instances** with auto-restart and file-watch:

```js
{
  name: "Attendance",
  script: "index.js",
  instances: "4",
  exec_mode: "cluster",
  env_file: ".env",
  autorestart: true,
  watch: true,
  ignore_watch: ["logs.txt", "node_modules", "logs", "CleanLogs.txt", "public", "cleanedlogs"]
}
```

```bash
# Start / reload
pm2 start ecosystem.config.cjs
pm2 reload Attendance

# Monitor
pm2 status
pm2 logs Attendance

# Persist across reboots
pm2 save
pm2 startup
```

> **Note on clustering and rate limiting:** `rate-limiter-flexible` is currently configured with `RateLimiterMemory`. In a multi-process PM2 cluster, each worker has its own counter. For accurate cross-process rate limiting in production, switch to `RateLimiterRedis` or `RateLimiterMongo`.

### Reverse proxy (Nginx recommended)

Terminate TLS at Nginx and proxy to `http://localhost:5004`. The backend's `geoip-lite` check reads `x-forwarded-for`, so ensure Nginx passes the real client IP:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
```

---

## 15. Submodules

| Submodule | Repo | Role |
|---|---|---|
| `AttendanceReport2` | `Yogananda1504/AttendanceReport2` | Report microservice — Express API that generates PDF/Excel attendance reports; runs on port 3000 |
| `Frontend-ReportGeneration` | `Yogananda1504/Frontend-ReportGeneration` | React 18 + Vite admin panel; output (`dist/`) is copied to `AttendanceMain/public/dist/` |

**Frontend tech highlights (`Frontend-ReportGeneration`):**
- React 18, React Router v6, Zustand (state), MUI v7, Tailwind CSS
- `html2canvas` + `html2pdf.js` + `jspdf-autotable` for client-side report rendering
- `recharts` for attendance analytics charts
- Vite PWA plugin (`vite-plugin-pwa`) — generates `sw.js` + `manifest.webmanifest` for offline support
- `@tanstack/react-table` for virtualized data tables

**Report service tech highlights (`AttendanceReport2`):**
- Separate Express 4 server with its own Mongoose models
- `swagger-jsdoc` + `swagger-ui-express` for auto-generated API docs
- `winston` + `morgan` for request logging
- `validator` for input sanitization

---

## 16. Known Limitations & Roadmap

| Area | Current State | Suggested Improvement |
|---|---|---|
| Rate limiting | In-memory per worker — not shared across PM2 cluster workers | Migrate to `RateLimiterRedis` |
| Admin role check | Inline `if/else` in route handlers | Extract to a dedicated RBAC middleware |
| CORS | `allowedHeaders: "*"` — overly permissive | Lock down to specific frontend origins in production |
| WAF | `express-waf` is installed but commented out | Re-enable and tune `strictMode` for production |
| Test suite | No tests (`npm test` exits 1) | Add Jest or Vitest unit tests for repositories and controllers |
| `AttendanceReport2` proxy | Hard-coded to `http://localhost:3000` | Move target URL to an environment variable |
| `department` routes | Module scaffolded but all routes are commented out | Implement or remove |
| Temp files | Excel downloads written to `src/data/`, then `fs.unlink`'d | Use `os.tmpdir()` to avoid polluting source tree |
| Secret rotation | `generateSecrets.js` is a one-shot script | Add a rotation workflow and invalidate old tokens |

---

## License

ISC
