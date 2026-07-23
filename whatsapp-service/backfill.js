require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WHATSAPP_SERVICE_URL = "http://127.0.0.1:3001/send";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[Backfill] Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

async function sendCompletionMsg(phone, name, title, subject, score, assessment) {
  const firstName = (name || "Ananda").split(" ")[0];
  const scoreLabel = score >= 70 ? "✅ LULUS" : "❌ TIDAK LULUS";

  let catatan;
  if (assessment?.what_good?.length || assessment?.to_improve?.length) {
    const lines = [];
    if (assessment.what_good?.length) {
      lines.push("✅ Sudah Mengerti:");
      lines.push(...assessment.what_good.map((p) => `  • ${p}`));
    }
    if (assessment.to_improve?.length) {
      if (lines.length) lines.push("");
      lines.push("📈 Perlu Ditingkatkan:");
      lines.push(...assessment.to_improve.map((p) => `  • ${p}`));
    }
    catatan = lines.join("\n");
  } else {
    catatan = `${firstName} menunjukkan pemahaman yang sangat baik pada sesi ini.`;
  }

  const message = [
    "📋 Laporan Belajar Harian",
    "",
    "Halo Orang Tua Tercinta, berikut adalah perkembangan belajar Ananda hari ini:",
    "",
    `👤 Nama: ${name || "Ananda"}`,
    `📚 Topik: ${subject ? `${subject} - ` : ""}${title}`,
    `💯 Skor: ${score} / 100 ${scoreLabel}`,
    "",
    `Catatan: ${catatan}`,
    "",
    "Terus dukung konsistensi dan semangat belajarnya ya, Ayah & Bunda! ❤️",
  ].join("\n");

  const res = await fetch(WHATSAPP_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WA send failed: ${err.error || res.status}`);
  }
}

async function runBackfill() {
  console.log("[Backfill] Starting...");
  const today = new Date().toISOString().split("T")[0];

  // Get today's sessions that have completed_at but not yet notified
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, user_id, title, subject, summary, parent_notified_at")
    .gte("started_at", today)
    .lte("started_at", `${today}T23:59:59.999Z`)
    .is("parent_notified_at", null);

  if (error) {
    console.error("[Backfill] DB error:", error.message);
    process.exit(1);
  }

  if (!sessions || sessions.length === 0) {
    console.log("[Backfill] No un-notified sessions today");
    return;
  }

  // Filter to sessions with completed exam
  const completed = sessions.filter((s) => {
    try {
      const summary = typeof s.summary === "string" ? JSON.parse(s.summary) : s.summary;
      return summary?.exam?.completed_at;
    } catch {
      return false;
    }
  });

  console.log(`[Backfill] Found ${completed.length} completed sessions to notify`);

  let success = 0;
  let failed = 0;

  for (const session of completed) {
    const summary = typeof session.summary === "string" ? JSON.parse(session.summary) : session.summary;
    const exam = summary?.exam;
    const assessment = summary?.assessment;

    // Fetch profile with parent_whatsapp
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, parent_whatsapp")
      .eq("id", session.user_id)
      .single();

    if (!profile?.parent_whatsapp) {
      console.log(`[Backfill] Skip ${session.id}: no parent_whatsapp`);
      continue;
    }

    try {
      await sendCompletionMsg(
        profile.parent_whatsapp,
        profile.name,
        session.title,
        session.subject,
        Number(exam.score) || 0,
        assessment,
      );

      // Flag as notified
      await supabase
        .from("sessions")
        .update({ parent_notified_at: new Date().toISOString() })
        .eq("id", session.id);

      console.log(`[Backfill] Sent to ${profile.parent_whatsapp} (session ${session.id.slice(0, 8)})`);
      success++;
    } catch (err) {
      console.error(`[Backfill] Failed for session ${session.id.slice(0, 8)}:`, err.message);
      failed++;
    }
  }

  console.log(`[Backfill] Done — ${success} sent, ${failed} failed`);
}

if (process.argv.includes("--run")) {
  runBackfill();
} else {
  console.log("[Backfill] Use --run flag to execute");
}
