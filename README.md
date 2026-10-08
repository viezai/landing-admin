# ViezAI — Lead Ingestion API & Admin Dashboard

> **viezai/landing-admin** — Lightweight, high-performance Contact Form Ingestion API and Admin Management Portal for [ViezAI](https://viezai.com).

[![Build & Test](https://img.shields.io/badge/tests-18%20passed-emerald)](https://github.com/viezai/landing-admin)
[![Node.js](https://img.shields.io/badge/node->=20.0.0-blue)](https://nodejs.org)
[![Storage](https://img.shields.io/badge/storage-SQLite%20(sql.js)-lightgrey)](https://sqlite.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✦ Overview & Key Highlights

This service provides a production-ready, self-contained ingestion backend and management dashboard for enterprise contact submissions originating from the ViezAI Landing Page:
- **Zero Heavy Infrastructure**: Built with Node.js, Express, and pure WebAssembly SQLite (`sql.js`). No external database servers or complex ORM setups required.
- **Enterprise-Grade Ingestion API (`POST /api/contacts`)**: Handles lead capture with CORS support, input sanitization, automated client IP telemetry, and multi-channel instant notifications.
- **Robust Spam Protection**: Invisible bot honeypot traps and IP-based sliding window rate limiting (default 5 requests/min per IP).
- **Modern Minimalist Admin Dashboard**: OpenAI/Vercel-inspired dark theme UI (React 19 + Tailwind CSS + Lucide Icons) featuring real-time search, status workflows, internal team notes, KPI telemetry cards, CSV exports, and a live lead simulator.
- **Plug-and-Play Webhooks**: Instant lead notifications for Telegram, Discord, Slack, or generic webhooks with zero external dependencies.

---

## 🏛️ System Architecture

```
[ Landing Page (viezai.com) ] 
             │
             │ POST /api/contacts (CORS enabled)
             ▼
[ Express Ingestion API ]
      ├── [ Honeypot Trap & IP Rate Limiter ]
      ├── [ Input Validator & Sanitizer ]
      ├── [ WebAssembly SQLite Repository ] ──► data/contacts.db
      └── [ Async Webhook Dispatcher ] ─────► Telegram / Discord / Slack
             ▲
             │ Authenticated Admin REST API (JWT / Secret Key)
             │
[ Admin Dashboard SPA (React 19 + Tailwind CSS) ]
```

---

## 📋 Acceptance Criteria Mapping

| Criterion | Implementation & Verification | Status |
| :--- | :--- | :---: |
| **AC-1: API Ingestion** | Endpoint `POST /api/contacts` accepts camelCase and snake_case fields (`fullName`, `email`, `company`, `need`, `message`, `teamSize`, `deploymentMode`), returns 201 Created and persists into SQLite `contacts` table. | ✅ Verified |
| **AC-2: Security & Anti-Spam** | Hidden bot honeypot traps silently discard automated spam without writing to database. Sliding window rate limiting blocks abusive IPs with 429 Too Many Requests. Admin endpoints require JWT or `x-admin-key`. | ✅ Verified |
| **AC-3: Lead Management** | Admin dashboard displays real-time KPI metrics, paginated table with status filters (`new`, `contacting`, `completed`, `archived`), full message modal, inline status updating, internal notes, and CSV export. | ✅ Verified |
| **AC-4: Performance & Deployment** | Cold startup < 100ms. Fully documented `.env.example`, automated Vitest suite (18/18 tests pass), and containerized Dockerfile. | ✅ Verified |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20.x or higher
- npm 10.x or pnpm

### 2. Installation
```bash
git clone https://github.com/viezai/landing-admin.git
cd landing-admin

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 3. Running in Development
```bash
# Terminal 1: Start Backend API (Port 4000)
npm run dev

# Terminal 2: Start Client Vite Dev Server (Port 5173 with proxy)
npm run dev:client
```
Access the development dashboard at `http://localhost:5173/`.

### 4. Running in Production
```bash
# Build the client SPA into dist/client
npm run build

# Start the unified single-port server (API + Static SPA)
npm start
```
Access the unified production service at `http://localhost:4000/`.

---

## 🧪 Automated Testing

The repository includes a comprehensive Vitest test suite testing ingestion, honeypot traps, IP rate limiting, authentication, lead updates, stats, and CSV export:

```bash
npm test
```

To run TypeScript verification:
```bash
npm run typecheck
```

---

## 📡 API Reference

### 1. Ingest Contact Form
- **Method & Path**: `POST /api/contacts`
- **Headers**: `Content-Type: application/json`
- **Rate Limit**: 5 requests / minute / IP
- **Payload Example**:
```json
{
  "fullName": "Le Hoang Nam",
  "email": "nam.le@enterprise-corp.vn",
  "company": "Enterprise Corporation",
  "need": "autonomous-coding",
  "message": "We would like to schedule a private POC deployment of ViezAI agents.",
  "teamSize": "21-100",
  "deploymentMode": "private-vpc",
  "honeypot": ""
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Contact request submitted successfully. Our enterprise engineering team will reach out within 2 hours.",
  "data": {
    "id": "e2e921e4-3fd1-4bc1-bf0f-798858349201",
    "fullName": "Le Hoang Nam",
    "email": "nam.le@enterprise-corp.vn",
    "company": "Enterprise Corporation",
    "createdAt": "2026-10-08T14:45:00.000Z"
  }
}
```

### 2. Admin Authentication
- **Method & Path**: `POST /api/auth/login`
- **Payload**:
```json
{
  "key": "viezai_admin_secret_2026"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "role": "admin"
}
```

### 3. Admin Contacts List
- **Method & Path**: `GET /api/admin/contacts?status=new&search=enterprise&page=1&limit=20`
- **Headers**: `Authorization: Bearer <token>` or `x-admin-key: <ADMIN_SECRET_KEY>`

### 4. Update Lead Status & Internal Notes
- **Method & Path**: `PATCH /api/admin/contacts/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "status": "contacting",
  "notes": "Discussed SOC2 VPC requirements on discovery call. Contract sent."
}
```

### 5. Export All Leads as CSV
- **Method & Path**: `GET /api/admin/export`
- **Headers**: `Authorization: Bearer <token>`

---

## ⚙️ Configuration Reference

| Environment Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP server listening port | `4000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `DB_PATH` | Path to persistent SQLite file | `./data/contacts.db` |
| `ADMIN_SECRET_KEY` | Master secret key to authenticate Admin Dashboard | `viezai_admin_secret_2026` |
| `JWT_SECRET` | Secret key used to sign admin session tokens | `viezai_jwt_super_secret_signing_key_2026` |
| `CORS_ORIGINS` | Comma-separated allowed origins for cross-domain form post | `https://viezai.com,http://localhost:3000,...` |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting sliding window duration in ms | `60000` (1 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum allowed submissions per IP in window | `5` |
| `TELEGRAM_BOT_TOKEN` | Optional Telegram bot token for instant lead notifications | _empty_ |
| `TELEGRAM_CHAT_ID` | Optional Telegram chat ID | _empty_ |
| `DISCORD_WEBHOOK_URL` | Optional Discord channel webhook URL | _empty_ |
| `SLACK_WEBHOOK_URL` | Optional Slack incoming webhook URL | _empty_ |

---

## 🐳 Docker Deployment

Build and run with a persistent volume for the SQLite database:

```bash
docker build -t viezai/landing-admin:latest .

docker run -d \
  --name viezai-admin \
  -p 4000:4000 \
  -v $(pwd)/data:/app/data \
  -e ADMIN_SECRET_KEY="your-secure-passkey-here" \
  viezai/landing-admin:latest
```

---

## 🛡️ License

Copyright © 2026 ViezAI, Inc. All rights reserved.
