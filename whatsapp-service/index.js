const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
require("dotenv/config");

const PORT = 3001;
const HOST = "127.0.0.1";

const app = express();
app.use(express.json());

let client = null;
let qrData = null;
let isReady = false;
let connectedPhone = null;

function startBot() {
  client = new Client({
    authStrategy: new LocalAuth({ clientId: "aksaraa" }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      executablePath: "/usr/bin/google-chrome-stable",
    },
  });

  client.on("qr", async (qr) => {
    try {
      qrData = await QRCode.toDataURL(qr, { scale: 8, margin: 1 });
    } catch {
      qrData = qr;
    }
    console.log("[QR] New QR code generated. Scan with WhatsApp.");
  });

  client.on("ready", () => {
    isReady = true;
    qrData = null;
    try {
      connectedPhone = client.info?.wid?.user || client.info?.me?.user || "unknown";
    } catch {}
    console.log("[Connection] WhatsApp connected!");
  });

  client.on("authenticated", () => {
    console.log("[Auth] Authenticated");
  });

  client.on("auth_failure", (msg) => {
    console.error("[Auth] Failure:", msg);
  });

  client.on("disconnected", (reason) => {
    isReady = false;
    connectedPhone = null;
    console.log("[Connection] Disconnected:", reason);
    if (reason !== "LOGGED_OUT") {
      console.log("[Connection] Reconnecting in 5s...");
      setTimeout(startBot, 5000);
    }
  });

  client.initialize();
}

app.get("/qr", (_req, res) => {
  if (isReady) {
    return res.send(`<!DOCTYPE html>
<html><head><title>Aksaraa WhatsApp - Connected</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;text-align:center}
.card{background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1)}
.check{width:64px;height:64px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;color:white}
</style></head><body>
<div class="card"><div class="check">✓</div>
<h2>WhatsApp Terhubung!</h2>
<p>Nomor: ${connectedPhone || "unknown"}</p></div></body></html>`);
  }
  if (!qrData) {
    return res.send(`<!DOCTYPE html>
<html><head><title>Aksaraa WhatsApp - Waiting</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="3">
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;text-align:center}
.card{background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1)}
.spinner{width:48px;height:48px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}</style></head><body>
<div class="card"><div class="spinner"></div>
<h2>Menunggu QR Code...</h2>
<p>Halaman ini akan refresh otomatis</p></div></body></html>`);
  }
  res.send(`<!DOCTYPE html>
<html><head><title>Aksaraa WhatsApp - Scan QR</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;text-align:center}
.card{background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1)}
.qr img{width:280px;height:280px;image-rendering:pixelated}
.instructions{margin-top:16px;color:#6b7280;font-size:14px}
</style></head><body>
<div class="card"><h2>Scan QR Code</h2>
<div class="qr"><img src="${qrData}" alt="QR Code"></div>
<p class="instructions">Buka WhatsApp > Settings > Linked Devices > Link a Device</p>
<p class="instructions" style="font-size:12px">Halaman ini auto-refresh tiap 5 detik</p>
<script>setTimeout(function(){location.reload()},5000)</script></div></body></html>`);
});

app.get("/status", (_req, res) => {
  res.json({ ready: isReady, phone: connectedPhone });
});

app.post("/send", async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: "phone and message required" });
  }
  if (!isReady || !client) {
    return res.status(503).json({ error: "WhatsApp not connected" });
  }
  try {
    const cleaned = phone.replace(/\D/g, "");
    const formatted = cleaned.startsWith("0")
      ? `62${cleaned.slice(1)}@c.us`
      : cleaned.startsWith("62")
        ? `${cleaned}@c.us`
        : `62${cleaned}@c.us`;

    await client.sendMessage(formatted, message);
    console.log(`[Send] Message sent to ${formatted}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[Send] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

startBot();

app.listen(PORT, HOST, () => {
  console.log(`[WhatsApp Service] Running on http://${HOST}:${PORT}`);
});
