require("dotenv").config();
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WHATSAPP_SERVICE_URL = "http://127.0.0.1:3001/send";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[Cron] Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

async function sendReminder(phone, name) {
  const firstName = (name || "Ananda").split(" ")[0];
  const message = [
    "⏳ Sesi Belajar Belum Selesai",
    "",
    `Halo Orang Tua Tercinta, berikut adalah update aktivitas belajar Ananda hari ini:`,
    `👤 Nama: ${name || "Ananda"}`,
    `⚠️ Status: Belum Ada Pembelajaran yang Selesai`,
    "",
    `Yuk dampingi Ananda: Sedikit dorongan dari Ayah & Bunda akan sangat membantu ${firstName} untuk menuntaskan materi hari ini. Klik aplikasi untuk melanjutkan! ❤️`,
  ].join("\n");
  try {
    const res = await fetch(WHATSAPP_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[Cron] Failed to send to ${phone}: ${err.error || res.status}`);
    } else {
      console.log(`[Cron] Reminder sent to ${phone}`);
    }
  } catch (err) {
    console.error(`[Cron] Error sending to ${phone}: ${err.message}`);
  }
}

async function runDailyCheck() {
  console.log("[Cron] Running daily check...");
  const today = new Date().toISOString().split("T")[0];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, parent_whatsapp")
    .not("parent_whatsapp", "is", null)
    .neq("parent_whatsapp", "");

  if (error) {
    console.error(`[Cron] DB error: ${error.message}`);
    return;
  }
  if (!profiles || profiles.length === 0) {
    console.log("[Cron] No profiles with parent_whatsapp");
    return;
  }

  for (const profile of profiles) {
    const { data: sessions } = await supabase
      .from("sessions")
      .select("summary")
      .eq("user_id", profile.id)
      .gte("started_at", today)
      .lte("started_at", `${today}T23:59:59.999Z`);

    const completed = (sessions || []).some((s) => {
      try {
        const summary = typeof s.summary === "string" ? JSON.parse(s.summary) : s.summary;
        return summary?.exam?.completed_at && summary?.exam?.score >= 70;
      } catch {
        return false;
      }
    });

    if (!completed) {
      await sendReminder(profile.parent_whatsapp, profile.name || "Ananda");
    }
  }
  console.log("[Cron] Daily check complete");
}

// Run daily at 10:00 UTC = 17:00 WIB
cron.schedule("0 17 * * *", runDailyCheck);

console.log("[Cron] Scheduled daily at 17:00 WIB");

// Allow manual run with --run flag
if (process.argv.includes("--run")) {
  console.log("[Cron] Manual run triggered");
  runDailyCheck();
}
