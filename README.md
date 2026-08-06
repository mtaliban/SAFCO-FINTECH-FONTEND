# SAFCO FINTECH LMS - Frontend

**Next.js 14 + React 18 + TypeScript + Tailwind CSS** frontend for the SAFCO FINTECH Learning Management System.

Connects to the [backend API](https://github.com/mtaliban/SAFCO-FINTECH-BACKEND) at `localhost:8000/api/v1`.

---

## 🚀 Quick Start (Docker - recommended)

Assumes the [backend](https://github.com/mtaliban/SAFCO-FINTECH-BACKEND) is already running (`docker compose -f docker-compose-core.yml up -d` from backend folder).

```bash
docker compose -f docker-compose.dev.yml up
```

Open **http://localhost:3002** in your browser.

---

## 🧑‍💻 Local Dev (without Docker)

```bash
npm install --legacy-peer-deps
npm run dev
```

Then open **http://localhost:3002**

---

## 🔑 Test credentials (from backend seeder)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@safcofintech.co.tz` | `Admin@2026!` |
| Trainer | `yustino.nyendeza@safcofintech.co.tz` | `Trainer@2026!` |

---

## 📱 Pages built (Module 1)

### Public
- `/` — Landing page
- `/login` — Email/phone + password login (plus Google/Microsoft OAuth)
- `/register` — Full registration with role selection
- `/forgot-password` — Request password reset link
- `/verify-otp` — OTP verification (email or SMS)

### Dashboard (authenticated)
- `/dashboard` — Overview, profile completion, upcoming modules
- `/dashboard/profile` — Update profile, upload picture (S3 backend)
- `/dashboard/security` — 2FA setup (Google Authenticator TOTP + recovery codes)
- `/dashboard/history` — Login history (device, browser, IP, location)

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand (with persist middleware)
- **Data fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation
- **HTTP client:** Axios with interceptors
- **Auth:** Sanctum bearer tokens in cookies
- **UI icons:** Lucide React
- **Notifications:** react-hot-toast
- **Real-time (ready):** socket.io-client, mqtt.js for Kahoot live features

---

## 🐳 Docker

Two compose files provided:

- `docker-compose.yml` — production build (multi-stage, standalone Next.js)
- `docker-compose.dev.yml` — dev with hot reload and volume mounts

---

## 🧭 Directory Layout

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/            # login, register, forgot-password, verify-otp
│   │   ├── (dashboard)/       # protected dashboard routes
│   │   ├── layout.tsx         # root layout
│   │   ├── page.tsx           # landing page
│   │   └── providers.tsx      # React Query + Toaster
│   ├── components/
│   │   └── layout/Sidebar.tsx
│   ├── lib/
│   │   ├── api.ts             # Axios client + interceptors
│   │   ├── auth.ts            # auth API + cookie helpers
│   │   └── utils.ts           # cn() className helper
│   ├── store/
│   │   └── auth.ts            # Zustand auth store
│   ├── types/
│   │   └── index.ts           # TypeScript types (User, ApiResponse, etc.)
│   └── styles/
│       └── globals.css        # Tailwind + custom components
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 📡 API Proxy

`next.config.js` proxies `/api/*` requests to the backend (avoids CORS in dev).
The backend URL is set via `NEXT_PUBLIC_API_URL` in `.env.local`.

---

## 🎯 Roadmap

- ✅ Module 1: Authentication & Profile (this milestone)
- ⏳ Module 2: Course Management UI
- ⏳ Module 7: Live Kahoot-Style Quiz UI (WebSockets + MQTT)
- ⏳ Modules 3–15: coming
