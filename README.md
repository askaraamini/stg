# Aksaraa

A Next.js app for kids' learning — scan books, take quizzes, track progress.

## Tech Stack

- **Next.js 16.2.10** (Turbopack) — **read `node_modules/next/dist/docs/` before coding; this version has breaking changes from earlier Next.js**
- React 19, TypeScript 5
- Tailwind CSS 3.4 with custom theme tokens
- Supabase (auth + storage)
- Prisma (PostgreSQL)
- PM2 (production process manager)
- Plus Jakarta Sans, Material Symbols

## Prerequisites

- Node.js >= 20
- npm
- Supabase project (for auth & storage)
- PostgreSQL (via Supabase or local)

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev                   # → http://localhost:3000
```

## Build & Production

```bash
npm run build   # production build
npm run start   # serve production build on port 3000
```

## Project Structure

```
app/
├── dashboard/      # Home tab — layout, scores, missions
├── library/        # Koleksi — subject list + [subject] detail page
├── scan/           # Camera scanning flow
├── learn/          # Quiz & reflection
├── exam/           # Exam page
├── misi/           # Missions page
├── profile/        # User profile
├── review/         # Review completed materials
├── register/       # Registration
├── login/          # Login
└── api/            # Backend routes (sessions, quiz, upload, etc.)
lib/                # Shared utilities, stores, db clients
components/         # Shared UI components
prisma/             # Database schema
whatsapp-service/   # WhatsApp notification service (Node.js)
```

## Environment Variables

Copy `.env.example` → `.env.local` and set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DATABASE_URL` | PostgreSQL connection string |

## Deployment

See [`AGENTS.md`](./AGENTS.md) for complete VPS deployment procedure.
