<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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
