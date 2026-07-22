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
const SESSION_DIR = path.join(__dirname, "../.wa_session");

function ensureSessionDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

function clearSessionDir() {
  if (fs.existsSync(SESSION_DIR)) {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  }
  ensureSessionDir();
}

let sock = null;
let qrCodeData = null;
let isConnected = false;

async function connectToWhatsApp() {
  ensureSessionDir();
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Wevitation Bot", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeData = qr;
      isConnected = false;
      console.log("\n=======================================================");
      console.log("🤖 SILAKAN SCAN QR CODE DI BAWAH DENGAN WHATSAPP HP BOT:");
      console.log("=======================================================");
      qrcodeTerminal.generate(qr, { small: true });
      console.log("=======================================================\n");
    }

    if (connection === "open") {
      isConnected = true;
      qrCodeData = null;
      console.log("\n✅ BERHASIL TERHUBUNG DENGAN WHATSAPP BOT!");
      console.log("🚀 Server Bot Lokal Siap Mengirim Ribuan Undangan di Port 5001\n");
    }

    if (connection === "close") {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      if (isLoggedOut) {
        console.log("🔄 Sesi WA terputus. Membersihkan sesi lama dan membuat QR Code baru...");
        clearSessionDir();
        setTimeout(connectToWhatsApp, 2000);
      } else {
        console.log("⚠️ Koneksi WhatsApp terputus. Hubungkan kembali dalam 3 detik...");
        setTimeout(connectToWhatsApp, 3000);
      }
    }
  });
}

// Create HTTP API Server on Port 5001
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        connected: isConnected,
        qrAvailable: Boolean(qrCodeData),
      })
    );
    return;
  }

  // Send Message Endpoint
  if (req.method === "POST" && req.url === "/send-message") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        if (!isConnected || !sock) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Bot WhatsApp Lokal belum terhubung. Silakan scan QR code di terminal.",
            })
          );
          return;
        }

        const data = JSON.parse(body);
        const { phone, message } = data;

        if (!phone || !message) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Nomor WhatsApp dan pesan wajib diisi.",
            })
          );
          return;
        }

        // Clean phone number format
        let cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.startsWith("0")) {
          cleanPhone = "62" + cleanPhone.slice(1);
        }

        const defaultJid = `${cleanPhone}@s.whatsapp.net`;
        let targetJid = defaultJid;

        // Check if number exists on WA
        try {
          const [result] = await sock.onWhatsApp(cleanPhone);
          if (result && result.exists) {
            targetJid = result.jid;
          }
        } catch {
          // Fallback to default JID
        }

        // Send message via Baileys
        await sock.sendMessage(targetJid, { text: message });

        console.log(`✅ [TERKIRIM] Undangan berhasil terkirim ke +${cleanPhone}`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: `Undangan berhasil terkirim via Bot Lokal ke +${cleanPhone}`,
          })
        );
      } catch (err) {
        console.log(`❌ [GAGAL] Pesan gagal: ${err.message}`);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: err.message || "Gagal mengirim pesan via Bot WA Lokal",
          })
        );
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`\n=======================================================`);
  console.log(`🤖 SERVER BOT LOCAL WA GATEWAY TELAH AKTIF`);
  console.log(`📍 URL Server: http://localhost:${PORT}`);
  console.log(`=======================================================\n`);
  connectToWhatsApp();
});
