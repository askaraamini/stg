<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Skills

- **Next.js 16** (Turbopack) — read `node_modules/next/dist/docs/` before writing any code
- **Custom Tailwind tokens** — defined in `tailwind.config.ts`. Key sizes: `headline-md` (20px), `body-md` (14px), `label-sm` (11px). Use these tokens, not arbitrary values.
- **Supabase SSR** — via `@supabase/ssr`; client at `lib/supabase/client.ts`, server at `lib/supabase/server.ts`
- **Prisma** — schema at `prisma/schema.prisma`; run `npx prisma generate` after schema changes
- **Material Symbols** — use `<span className="material-symbols-outlined">icon_name</span>` with `font-variation-settings: 'FILL' 1` for filled variant
- **Plus Jakarta Sans** — loaded via `@fontsource/plus-jakarta-sans`

## GitHub

- **Remote**: `git@github.com:askaraamini/stg.git` (branch `main`)
- **Commit style**: Conventional commits — `feat:`, `fix:`, `chore:`, `refactor:`
- **Do NOT commit**: `.env.local`, `.env.*`, `node_modules`, `.next`, `*.tsbuildinfo`

## Deployment

| Detail | Value |
|--------|-------|
| Host | `103.93.135.176` |
| User | `askaraa` |
| SSH alias | `askaraa-vps` (config in `~/.ssh/config`) |
| Key | `~/.ssh/vps_askaraa` |
| Password | `ASKARAA.mini01` |
| App path | `/home/askaraa/app` |
| Process | PM2 `aksaraa` (Next.js on port 3000) |

### Deploy steps

```bash
# 1. Commit and push to GitHub
git add -A && git commit -m "feat: description" && git push origin main

# 2. Build tarball (from project root)
tar czf /tmp/aksaraa-deploy.tar.gz \
  --exclude=node_modules --exclude=.next \
  --exclude=.git --exclude='*.tsbuildinfo' \
  -C /Users/delanataliamalau/development/Aksaraa .

# 3. Upload to VPS
scp /tmp/aksaraa-deploy.tar.gz askaraa@103.93.135.176:/home/askaraa/

# 4. SSH in, extract, build, restart
ssh askaraa@103.93.135.176 "
  cd /home/askaraa &&
  rm -rf app-old && mv app app-old &&
  mkdir app && cd app &&
  tar xzf ../aksaraa-deploy.tar.gz &&
  rm ../aksaraa-deploy.tar.gz &&
  cp ../app-old/.env.local . 2>/dev/null; cp ../app-old/.env.example . 2>/dev/null &&
  npm ci &&
  npm run build &&
  pm2 restart aksaraa
"
```

> **Note**: The VPS does not have the GitHub deploy key set up, so `git pull` won't work directly. Use the tarball method above.

## Open / Pending Items

| # | File(s) | Fix | Status |
|---|---------|-----|--------|
| 1 | `app/page.tsx` | Landing page "Notifikasi Orang Tua" deployed to VPS | ✅ deployed |
| 2 | `app/api/quiz/prompts/bahasa-inggris.txt` | Questions MUST be in BAHASA INDONESIA (allow English vocab inside text) | ✅ deployed |
| 3 | `app/misi/page.tsx:231` | Stats chip overflow: `gap-4` → `gap-1 sm:gap-4`, reduced chip padding on mobile | ✅ deployed |
| 4 | `app/library/page.tsx:245` | Card too big on mobile: `p-4` → `p-3`, `shadow-[6px_6px]` → `[4px_4px]`, `aspect-video` → `aspect-[4/3]` | ✅ deployed |
| 5 | `app/scan/hooks/useCamera.ts` | `await video.play()` + `loadeddata` before `setIsReady(true)` | ✅ deployed |
| 6 | `app/learn/components/RefleksiSection.tsx` | STT duplication: dedup check before appending `newFinal` to `accumulatedTextRef` | ✅ deployed |
| 7 | `components/ConfettiEffect.tsx:11` | Confetti behind content: `z-index:0` → `z-index:9999` | ✅ deployed |
| 8 | `app/exam/page.tsx:354`, `app/library/page.tsx:62`, `app/api/sessions/[id]/route.ts:176`, `app/dashboard/page.tsx:45` | Pass threshold 80 → 70 | ✅ deployed |
| 9 | `app/register/page.tsx`, `app/api/register/route.ts` | Optional `parent_whatsapp` field in registration form + API | ✅ deployed |
