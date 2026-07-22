import { NextResponse } from "next/server";

/**
 * Next.js API Route for Automated Background WhatsApp Message Delivery
 * Supports 100% Free Unlimited Local Bot Gateway (port 5001 or Localtunnel/Pinggy URL), Meta Cloud API, Fonnte, and Wablas
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      phone,
      message,
      apiKey,
      provider = "local",
      phoneNumberId,
      customServerUrl,
    } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp dan pesan wajib diisi" },
        { status: 400 }
      );
    }

    // Clean phone number format
    let targetPhone = phone.replace(/\D/g, "");
    if (targetPhone.startsWith("0")) {
      targetPhone = "62" + targetPhone.slice(1);
    }

    // 1. 100% FREE Unlimited Local Bot Gateway Server (localhost:5001 or Localtunnel / Pinggy URL)
    if (provider === "local") {
      const serverUrl = customServerUrl || "http://localhost:5001";
      const targetEndpoint = `${serverUrl.replace(/\/$/, "")}/send-message`;

      try {
        const response = await fetch(targetEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Bypass-Tunnel-Remainder": "true",
            "bypass-tunnel-reminder": "true",
            "ngrok-skip-browser-warning": "true",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            phone: targetPhone,
            message: message,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          return NextResponse.json({
            success: true,
            message: "✓ Pesan WhatsApp berhasil terkirim 100% otomatis via Bot Lokal!",
            data,
          });
        } else {
          return NextResponse.json({
            success: false,
            error:
              data.error ||
              "Bot Lokal belum terhubung. Pastikan 'npm run wa-bot' berjalan.",
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          needToken: true,
          error: `Server Bot Lokal (${serverUrl}) belum berjalan atau tidak terjangkau. (Error: ${err.message})`,
        });
      }
    }

    // 2. Meta Official WhatsApp Cloud API
    if (provider === "meta") {
      const token = apiKey;
      const phoneId = phoneNumberId || process.env.META_WA_PHONE_NUMBER_ID;

      if (!token || !phoneId) {
        return NextResponse.json({
          success: false,
          needToken: true,
          error:
            "Meta Cloud API Access Token atau Phone Number ID belum diisi.",
        });
      }

      const metaUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      const response = await fetch(metaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: targetPhone,
          type: "text",
          text: {
            preview_url: true,
            body: message,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        return NextResponse.json({
          success: true,
          message: "Pesan WhatsApp berhasil terkirim via Meta Cloud API!",
          data,
        });
      } else {
        return NextResponse.json({
          success: false,
          error:
            data.error?.message ||
            "Gagal mengirim via Meta WA Cloud API. Periksa Token / Phone ID.",
        });
      }
    }

    // 3. Fonnte Gateway Provider
    if (provider === "fonnte" && apiKey) {
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: targetPhone,
          message: message,
        }),
      });

      const data = await response.json();
      if (data.status) {
        return NextResponse.json({
          success: true,
          message: "Pesan WhatsApp berhasil terkirim via Fonnte Gateway!",
          data,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: data.reason || "Gagal mengirim via WA Gateway Fonnte",
        });
      }
    }

    // 4. Wablas Gateway Provider
    if (provider === "wablas" && apiKey) {
      const response = await fetch("https://wablas.com/api/send-message", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: targetPhone,
          message: message,
        }),
      });

      const data = await response.json();
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({
      success: false,
      needToken: true,
      error: "WhatsApp API Token belum diisi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}
