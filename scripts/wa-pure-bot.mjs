#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════
 *  🤖 PURE WA BOT — Wedding Invitation Auto-Sender
 * ═══════════════════════════════════════════════════════════
 *  Pakai nomor HP BARU (bukan yang ke-suspend).
 *  Scan QR → langsung konek → bisa kirim undangan dari web.
 *
 *  Fitur:
 *  1. QR Code di terminal → scan pakai WA nomor baru
 *  2. HTTP API Server port 5001 → web bisa panggil kirim pesan
 *  3. Auto-Reply → tamu yang balas otomatis dijawab
 *  4. Session persist → tidak perlu scan QR ulang
 *  5. Retry & reconnect otomatis
 *  6. /status endpoint → cek status koneksi dari web
 *  7. /qr endpoint → ambil QR code sebagai text
 * ═══════════════════════════════════════════════════════════
 */

import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import qrcodeTerminal from "qrcode-terminal";
import pino from "pino";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session directory terpisah dari yang lama (yang ke-suspend)
const SESSION_DIR = path.join(__dirname, "../.wa_session_new");
const LOG_FILE = path.join(__dirname, "../.wa_bot_log.txt");

// Wedding info for auto-reply
const WEDDING_URL = process.env.WEDDING_URL || "https://undangan-angi-anam.netlify.app";
const BRIDE_NAME = "Angi";
const GROOM_NAME = "Anam";

// Fonnte fallback token
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "4Sf3SH6toe8ztYykjmMV";

// ─── State ───────────────────────────────────────────────
let sock = null;
let qrCodeData = null;
let isConnected = false;
let botPhoneNumber = "Unknown";
let messagesSent = 0;
let messagesReceived = 0;
let startTime = Date.now();
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

// Track replied numbers to avoid spam (reset every 24h)
const repliedNumbers = new Map(); // phone -> lastReplyTime

// ─── Logging ─────────────────────────────────────────────
function log(msg) {
  const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch {
    // ignore
  }
}

// ─── Session Management ──────────────────────────────────
function ensureSessionDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

function clearSession() {
  if (fs.existsSync(SESSION_DIR)) {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  }
  ensureSessionDir();
  log("🗑️  Session lama dihapus. Siap scan QR baru.");
}

// ─── Auto-Reply Handler ─────────────────────────────────
async function handleIncomingMessage(msg) {
  try {
    // Skip jika bukan pesan text dari user
    if (!msg.message || msg.key.fromMe) return;
    if (!msg.key.remoteJid || msg.key.remoteJid.includes("@g.us")) return; // skip groups

    const senderJid = msg.key.remoteJid;
    const senderNumber = senderJid.replace("@s.whatsapp.net", "");
    
    // Get message text
    const textMsg =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      "";

    if (!textMsg) return;

    messagesReceived++;
    log(`📩 Pesan masuk dari +${senderNumber}: "${textMsg.substring(0, 80)}..."`);

    // Check cooldown — only reply once per number per 30 minutes
    const lastReply = repliedNumbers.get(senderNumber);
    const now = Date.now();
    if (lastReply && now - lastReply < 30 * 60 * 1000) {
      return; // already replied recently
    }

    // Auto-reply with wedding info
    const replyText = `Assalamu'alaikum Wr. Wb. 🌸

Terima kasih atas pesan Anda! 💕

Ini adalah bot otomatis undangan pernikahan *${BRIDE_NAME} & ${GROOM_NAME}*.

🗓 *Sabtu, 10 Oktober 2026*
📍 *BALAI IKABAMA*, Depok

Untuk informasi lengkap & RSVP, silakan buka:
${WEDDING_URL}

Jazakallahu Khairan atas doa & restunya! 🤲

_Pesan ini dikirim otomatis oleh bot undangan._`;

    await sock.sendMessage(senderJid, { text: replyText });
    repliedNumbers.set(senderNumber, now);
    log(`✅ Auto-reply terkirim ke +${senderNumber}`);
  } catch (err) {
    log(`⚠️  Error auto-reply: ${err.message}`);
  }
}

// ─── WhatsApp Connection ─────────────────────────────────
async function connectToWhatsApp() {
  ensureSessionDir();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Wedding Bot", "Chrome", "2.0.0"],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: 25000,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on("creds.update", saveCreds);

  // Handle connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeData = qr;
      isConnected = false;
      console.log("");
      console.log("╔═══════════════════════════════════════════════════════╗");
      console.log("║  📱 SCAN QR CODE INI DENGAN WHATSAPP NOMOR BARU:    ║");
      console.log("║  (Buka WA > Linked Devices > Link a Device)         ║");
      console.log("╚═══════════════════════════════════════════════════════╝");
      console.log("");
      qrcodeTerminal.generate(qr, { small: true });
      console.log("");
      log("⏳ Menunggu scan QR Code...");
    }

    if (connection === "open") {
      isConnected = true;
      qrCodeData = null;
      reconnectAttempts = 0;

      // Get bot's own phone number
      try {
        const me = sock.user;
        if (me) {
          botPhoneNumber = me.id.split(":")[0] || me.id.split("@")[0] || "Connected";
        }
      } catch {
        botPhoneNumber = "Connected";
      }

      console.log("");
      console.log("╔═══════════════════════════════════════════════════════╗");
      console.log("║  ✅ BOT WHATSAPP BERHASIL TERHUBUNG!                ║");
      console.log(`║  📱 Nomor Bot: +${botPhoneNumber.padEnd(38)}║`);
      console.log("║  🚀 Server API aktif di http://localhost:5001       ║");
      console.log("║  📨 Bot siap kirim & terima pesan otomatis          ║");
      console.log("╚═══════════════════════════════════════════════════════╝");
      console.log("");
      log(`✅ Bot terhubung dengan nomor +${botPhoneNumber}`);
    }

    if (connection === "close") {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = DisconnectReason;

      if (statusCode === reason.loggedOut) {
        log("🚫 Logged out dari WhatsApp. Menghapus session lama...");
        clearSession();
        setTimeout(connectToWhatsApp, 3000);
      } else if (statusCode === reason.restartRequired) {
        log("🔄 Restart required. Reconnecting...");
        connectToWhatsApp();
      } else if (statusCode === reason.badSession) {
        log("❌ Bad session. Clearing session dan reconnect...");
        clearSession();
        setTimeout(connectToWhatsApp, 3000);
      } else if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        const delay = Math.min(3000 * reconnectAttempts, 30000);
        log(`⚠️  Koneksi terputus (code: ${statusCode}). Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT} dalam ${delay/1000}s...`);
        setTimeout(connectToWhatsApp, delay);
      } else {
        log("❌ Max reconnect attempts reached. Silakan restart bot manual.");
      }
    }
  });

  // Handle incoming messages → auto-reply
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      await handleIncomingMessage(msg);
    }
  });
}

// ─── Send Message Function ───────────────────────────────
async function sendMessage(phone, message) {
  if (!isConnected || !sock) {
    throw new Error("Bot WhatsApp belum terhubung. Silakan scan QR code terlebih dahulu.");
  }

  // Clean phone number
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }

  const defaultJid = `${cleanPhone}@s.whatsapp.net`;
  let targetJid = defaultJid;

  // Verify number exists on WhatsApp
  try {
    const [result] = await sock.onWhatsApp(cleanPhone);
    if (result && result.exists) {
      targetJid = result.jid;
    } else {
      // Number not on WhatsApp, try Fonnte as fallback
      log(`⚠️  +${cleanPhone} tidak terdaftar di WA. Mencoba via Fonnte...`);
      return await sendViaFonnte(cleanPhone, message);
    }
  } catch {
    // If verification fails, just try sending anyway
  }

  // Send via Baileys
  await sock.sendMessage(targetJid, { text: message });
  messagesSent++;
  log(`✅ [TERKIRIM] Undangan → +${cleanPhone}`);

  return { method: "baileys", phone: cleanPhone };
}

// ─── Fonnte Fallback ─────────────────────────────────────
async function sendViaFonnte(phone, message) {
  if (!FONNTE_TOKEN) {
    throw new Error("Fonnte token tidak tersedia untuk fallback.");
  }

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: FONNTE_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target: phone,
      message: message,
    }),
  });

  const data = await response.json();
  if (data.status) {
    messagesSent++;
    log(`✅ [TERKIRIM via Fonnte] Undangan → +${phone}`);
    return { method: "fonnte", phone, data };
  } else {
    throw new Error(data.reason || "Fonnte gagal mengirim");
  }
}

// ─── HTTP API Server ─────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost`);
  const pathname = url.pathname;

  // ──── GET /status ────
  if (req.method === "GET" && pathname === "/status") {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      connected: isConnected,
      qrAvailable: Boolean(qrCodeData),
      botPhone: botPhoneNumber,
      messagesSent,
      messagesReceived,
      uptimeSeconds: uptime,
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    }));
    return;
  }

  // ──── GET /qr ────
  if (req.method === "GET" && pathname === "/qr") {
    if (isConnected) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ connected: true, message: "Bot sudah terhubung, tidak perlu scan QR." }));
      return;
    }
    if (qrCodeData) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ connected: false, qr: qrCodeData }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ connected: false, qr: null, message: "QR belum tersedia, menunggu koneksi..." }));
    return;
  }

  // ──── GET /reset ────
  if (req.method === "GET" && pathname === "/reset") {
    log("🔄 Reset session diminta via API...");
    isConnected = false;
    qrCodeData = null;
    try {
      if (sock) {
        sock.end(undefined);
        sock = null;
      }
    } catch { /* ignore */ }
    clearSession();
    setTimeout(connectToWhatsApp, 2000);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, message: "Session direset. QR code baru akan muncul di terminal." }));
    return;
  }

  // ──── POST /send-message ────
  if (req.method === "POST" && pathname === "/send-message") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { phone, message } = data;

        if (!phone || !message) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            success: false,
            error: "Parameter 'phone' dan 'message' wajib diisi.",
          }));
          return;
        }

        const result = await sendMessage(phone, message);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: true,
          message: `Undangan berhasil terkirim via ${result.method} ke +${result.phone}`,
          method: result.method,
        }));
      } catch (err) {
        log(`❌ [GAGAL] ${err.message}`);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: false,
          error: err.message || "Gagal mengirim pesan",
        }));
      }
    });
    return;
  }

  // ──── POST /send-bulk ────
  if (req.method === "POST" && pathname === "/send-bulk") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { contacts } = data; // Array of { phone, message }

        if (!Array.isArray(contacts) || contacts.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            success: false,
            error: "Parameter 'contacts' (array) wajib diisi.",
          }));
          return;
        }

        log(`🚀 Bulk send dimulai: ${contacts.length} kontak`);

        const results = [];
        for (let i = 0; i < contacts.length; i++) {
          const { phone, message } = contacts[i];
          try {
            const result = await sendMessage(phone, message);
            results.push({ phone, success: true, method: result.method });
          } catch (err) {
            results.push({ phone, success: false, error: err.message });
          }
          // Delay 1.5s between messages to avoid spam detection
          if (i < contacts.length - 1) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        }

        const successCount = results.filter((r) => r.success).length;
        log(`🎉 Bulk send selesai: ${successCount}/${contacts.length} berhasil`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: true,
          message: `${successCount} dari ${contacts.length} pesan berhasil terkirim`,
          results,
        }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: false,
          error: err.message || "Bulk send error",
        }));
      }
    });
    return;
  }

  // ──── Root / info page ────
  if (req.method === "GET" && (pathname === "/" || pathname === "")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
<!DOCTYPE html>
<html>
<head><title>🤖 Wedding Bot WA</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #1c0a08; color: #f3e5ab; padding: 40px; max-width: 600px; margin: 0 auto; }
  h1 { color: #d4af37; }
  .status { padding: 16px; border: 1px solid #d4af37; border-radius: 12px; margin: 16px 0; background: rgba(212,175,55,0.05); }
  .connected { border-color: #22c55e; }
  .disconnected { border-color: #ef4444; }
  code { background: rgba(0,0,0,0.4); padding: 2px 8px; border-radius: 4px; font-size: 13px; }
  a { color: #d4af37; }
</style>
</head>
<body>
  <h1>🤖 Wedding Bot WA</h1>
  <p>Pure Bot WhatsApp untuk undangan pernikahan ${BRIDE_NAME} & ${GROOM_NAME}</p>
  <div class="status ${isConnected ? 'connected' : 'disconnected'}">
    <strong>Status:</strong> ${isConnected ? '✅ Terhubung' : '❌ Belum Terhubung'}
    <br><strong>Nomor Bot:</strong> +${botPhoneNumber}
    <br><strong>Pesan Terkirim:</strong> ${messagesSent}
    <br><strong>Pesan Diterima:</strong> ${messagesReceived}
  </div>
  <h3>API Endpoints:</h3>
  <ul>
    <li><code>GET /status</code> — Cek status bot</li>
    <li><code>GET /qr</code> — Ambil QR code</li>
    <li><code>GET /reset</code> — Reset session & scan QR baru</li>
    <li><code>POST /send-message</code> — Kirim pesan (body: {phone, message})</li>
    <li><code>POST /send-bulk</code> — Kirim massal (body: {contacts: [{phone, message}]})</li>
  </ul>
</body>
</html>
    `);
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint tidak ditemukan" }));
});

// ─── Start Server ────────────────────────────────────────
const PORT = process.env.BOT_PORT || 5001;

server.listen(PORT, () => {
  console.log("");
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║                                                       ║");
  console.log("║   🤖 PURE WA BOT — Wedding Invitation Auto-Sender   ║");
  console.log("║                                                       ║");
  console.log(`║   📍 Server: http://localhost:${PORT}                  ║`);
  console.log("║   💡 Pakai nomor HP BARU (bukan yg ke-suspend)       ║");
  console.log("║   📨 Auto-reply aktif untuk pesan masuk               ║");
  console.log("║   🔄 Fonnte fallback jika nomor tidak ada di WA      ║");
  console.log("║                                                       ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("");
  log("🚀 Server Bot dimulai di port " + PORT);
  connectToWhatsApp();
});

// Graceful shutdown
process.on("SIGINT", () => {
  log("🛑 Bot dihentikan.");
  if (sock) {
    try { sock.end(undefined); } catch { /* ignore */ }
  }
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  log(`💥 Uncaught Exception: ${err.message}`);
});

process.on("unhandledRejection", (err) => {
  log(`💥 Unhandled Rejection: ${err}`);
});
