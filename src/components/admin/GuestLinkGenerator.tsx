"use client";

import { useState, useEffect } from "react";
import { weddingData } from "@/data/weddingData";
import { QRCodeCanvas } from "@/components/ui/QRCodeCanvas";

export interface GeneratedGuest {
  id: string;
  code?: string;
  name: string;
  phone?: string;
  category: string;
  template: "Formal" | "Hangat" | "Singkat";
  status?: "pending" | "sending" | "sent" | "failed";
  checkedIn?: boolean;
  checkInTime?: string;
  pax?: number;
  createdAt: string;
}

export function GuestLinkGenerator() {
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Tamu VIP");
  const [template, setTemplate] = useState<"Formal" | "Hangat" | "Singkat">("Formal");
  const [guests, setGuests] = useState<GeneratedGuest[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  // Bulk Import & Auto-Blast States
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState({ current: 0, total: 0 });

  // WA Gateway State
  const [provider, setProvider] = useState<"local" | "meta" | "fonnte" | "wablas">("fonnte");
  const [waToken, setWaToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [customServerUrl, setCustomServerUrl] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // QR Preview
  const [qrPreviewId, setQrPreviewId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    loadCloudGuests();
  }, []);

  async function loadCloudGuests() {
    try {
      const res = await fetch("/api/db?type=guests");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setGuests(json.data);
      }

      const cfgRes = await fetch("/api/db?type=config");
      const cfgJson = await cfgRes.json();
      if (cfgJson.success && cfgJson.data) {
        if (cfgJson.data.customServerUrl) setCustomServerUrl(cfgJson.data.customServerUrl);
        if (cfgJson.data.provider) setProvider(cfgJson.data.provider);
        if (cfgJson.data.waToken) setWaToken(cfgJson.data.waToken);
      }
    } catch {
      // API failed
    }
  }

  async function saveGuests(updated: GeneratedGuest[]) {
    setGuests(updated);

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          type: "guests",
          item: updated,
        }),
      });
    } catch {
      // Fallback
    }
  }

  async function saveConfig(
    token: string,
    phoneId: string,
    prov: "local" | "meta" | "fonnte" | "wablas",
    cUrl: string
  ) {
    setWaToken(token);
    setPhoneNumberId(phoneId);
    setProvider(prov);
    setCustomServerUrl(cUrl);

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          type: "config",
          item: { waToken: token, phoneNumberId: phoneId, provider: prov, customServerUrl: cUrl },
        }),
      });
    } catch {
      // Fallback
    }
  }

  function formatPhoneNumber(num: string): string {
    let cleaned = num.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return cleaned;
  }

  function generateUniqueCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase() || "VIP";
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanName}-${rand}`;
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;

    const code = generateUniqueCode(guestName.trim());
    const newGuest: GeneratedGuest = {
      id: Date.now().toString(),
      code,
      name: guestName.trim(),
      phone: phone.trim() ? formatPhoneNumber(phone.trim()) : undefined,
      category,
      template,
      status: "pending",
      checkedIn: false,
      pax: 1,
      createdAt: new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB",
    };

    const updated = [newGuest, ...guests];
    saveGuests(updated);
    setGuestName("");
    setPhone("");
  }

  // Bulk Import Parser
  function handleBulkImport() {
    if (!bulkText.trim()) return;

    const lines = bulkText.split("\n");
    const newGuests: GeneratedGuest[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let name = "";
      let rawPhone = "";

      if (trimmed.includes(",")) {
        const parts = trimmed.split(",");
        name = parts[0].trim();
        rawPhone = parts.slice(1).join("").trim();
      } else if (trimmed.includes("-")) {
        const parts = trimmed.split("-");
        name = parts[0].trim();
        rawPhone = parts.slice(1).join("").trim();
      } else if (trimmed.includes("\t")) {
        const parts = trimmed.split("\t");
        name = parts[0].trim();
        rawPhone = parts.slice(1).join("").trim();
      } else {
        name = trimmed;
      }

      if (name) {
        newGuests.push({
          id: (Date.now() + index).toString(),
          code: generateUniqueCode(name),
          name,
          phone: rawPhone ? formatPhoneNumber(rawPhone) : undefined,
          category,
          template,
          status: "pending",
          checkedIn: false,
          pax: 1,
          createdAt: new Date().toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB",
        });
      }
    });

    if (newGuests.length > 0) {
      const updated = [...newGuests, ...guests];
      saveGuests(updated);
      setBulkText("");
      setShowBulkInput(false);
      alert(`✓ Berhasil mengimpor ${newGuests.length} nama & nomor tamu ke Cloud DB!`);
    }
  }

  function handleDelete(id: string) {
    const updated = guests.filter((g) => g.id !== id);
    saveGuests(updated);
  }

  function getGuestUrl(name: string, code?: string) {
    const encodedName = encodeURIComponent(name);
    const codeParam = code ? `&code=${encodeURIComponent(code)}` : "";
    return `${origin}/?to=${encodedName}${codeParam}`;
  }

  function getWaMessage(name: string, tmpl: "Formal" | "Hangat" | "Singkat" = "Formal", code?: string) {
    const url = getGuestUrl(name, code);

    if (tmpl === "Singkat") {
      return `Halo *${name}*,

Tanpa mengurangi rasa hormat, kami mengundang kamu untuk hadir di acara pernikahan kami:

*${weddingData.couple.groom.nickname} & ${weddingData.couple.bride.nickname}*
🗓 Sabtu, 10 Oktober 2026
📍 BALAI IKABAMA, Depok

Link Undangan Digital:
${url}

Terima kasih atas doa restunya!
- Anam & Angi`;
    }

    if (tmpl === "Hangat") {
      return `Assalamu'alaikum Wr. Wb.

Dear *${name}*,

Semoga sehat dan bahagia selalu! 🌸
Dengan penuh rasa syukur, kami ingin mengundang kamu untuk hadir menjadi bagian dari hari bahagia pernikahan kami:

*${weddingData.couple.groom.nickname} & ${weddingData.couple.bride.nickname}*
(Misbakhul Anam Roziqin & Angi Sulistia)

🗓 *Sabtu, 10 Oktober 2026*
📍 *BALAI IKABAMA*, Depok

Informasi lengkap acara, peta lokasi, dan konfirmasi kehadiran (RSVP) dapat dilihat pada link berikut:
${url}

Kehadiran dan doa restumu sangat berarti bagi perjalanan kehidupan baru kami. Sampai jumpa di hari H!

Warm regards,
*Anam & Angi*`;
    }

    return `Bismillah-ir-Rahman-ir-Rahim

Kepada Yth.
*${name}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:

*${weddingData.couple.groom.nickname} & ${weddingData.couple.bride.nickname}*
(Misbakhul Anam Roziqin & Angi Sulistia)

🗓 *Sabtu, 10 Oktober 2026*
📍 *BALAI IKABAMA*, Depok

Berikut link undangan digital kami untuk informasi lengkap acara & RSVP:
${url}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih.
Wassalamu'alaikum Wr. Wb.

Hormat kami,
*Anam & Angi*`;
  }

  async function handleCopy(name: string, id: string) {
    const url = getGuestUrl(name);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Gagal menyalin link");
    }
  }

  // Single Background Auto Send
  async function handleSingleAutoSend(guest: GeneratedGuest) {
    if (!guest.phone) {
      alert("Masukkan nomor WhatsApp terlebih dahulu untuk kirim otomatis.");
      return false;
    }

    setSendingId(guest.id);
    const message = getWaMessage(guest.name, guest.template);

    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: guest.phone,
          message: message,
          apiKey: waToken,
          phoneNumberId: phoneNumberId,
          provider: provider,
          customServerUrl: customServerUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const updated = guests.map((g) => (g.id === guest.id ? { ...g, status: "sent" as const } : g));
        saveGuests(updated);
        return true;
      } else {
        const updated = guests.map((g) => (g.id === guest.id ? { ...g, status: "failed" as const } : g));
        saveGuests(updated);
        setShowTokenInput(true);
        alert(`Notice: ${data.error || "Pesan gagal terkirim. Pengaturan URL bot otomatis dibuka di bawah."}`);
        return false;
      }
    } catch {
      const updated = guests.map((g) => (g.id === guest.id ? { ...g, status: "failed" as const } : g));
      saveGuests(updated);
      setShowTokenInput(true);
      return false;
    } finally {
      setSendingId(null);
    }
  }

  // 1-Click Automated Bulk Auto-Blast Loop across all pending guests
  async function handleBulkAutoBlast() {
    const targetGuests = guests.filter((g) => g.phone && g.status !== "sent");

    if (targetGuests.length === 0) {
      alert("Semua tamu dengan nomor WA sudah terkirim atau belum ada daftar nomor WA.");
      return;
    }

    if (
      !confirm(
        `Siap mengirim undangan 100% otomatis via ${
          provider === "local" ? "Bot Lokal Self-Hosted (Unlimited)" : provider
        } ke ${targetGuests.length} tamu sekaligus?`
      )
    ) {
      return;
    }

    setIsBlasting(true);
    setBlastProgress({ current: 0, total: targetGuests.length });

    let successCount = 0;
    for (let i = 0; i < targetGuests.length; i++) {
      const currentGuest = targetGuests[i];
      setBlastProgress({ current: i + 1, total: targetGuests.length });

      const ok = await handleSingleAutoSend(currentGuest);
      if (ok) successCount++;

      // Safe delay 1.2s between calls
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    setIsBlasting(false);
    alert(`🎉 SELESAI! Berhasil mengirim ${successCount} dari ${targetGuests.length} undangan secara 100% otomatis!`);
  }

  function handleDirectWaWeb(guest: GeneratedGuest) {
    const text = getWaMessage(guest.name, guest.template, guest.code);
    const encodedText = encodeURIComponent(text);
    const cleanNum = guest.phone ? formatPhoneNumber(guest.phone) : "";
    const waUrl = cleanNum
      ? `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    
    window.open(waUrl, "_blank");

    // Automatically mark status as sent
    const updated = guests.map((g) => (g.id === guest.id ? { ...g, status: "sent" as const } : g));
    saveGuests(updated);
  }

  async function handleCopyFullMessage(guest: GeneratedGuest) {
    const text = getWaMessage(guest.name, guest.template, guest.code);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(`msg-${guest.id}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Gagal menyalin pesan");
    }
  }

  function toggleGuestStatus(id: string) {
    const updated = guests.map((g) => {
      if (g.id === id) {
        const nextStatus = g.status === "sent" ? ("pending" as const) : ("sent" as const);
        return { ...g, status: nextStatus };
      }
      return g;
    });
    saveGuests(updated);
  }

  const pendingWithPhoneCount = guests.filter((g) => g.phone && g.status !== "sent").length;

  return (
    <div className="space-y-6">
      {/* Fonnte Token & Bot Config Card */}
      <div className="bg-[#202125] border border-[#2D2E34] rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-[#F1F0EC] flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E0C98F" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>{provider === "fonnte" ? "Fonnte WA Gateway" : provider === "local" ? "Pure Bot WA (Nomor Baru)" : provider.toUpperCase()}</span>
            </span>
            <span className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              waToken
                ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                : "bg-amber-950 text-amber-300 border border-amber-700"
            }`}>
              {waToken ? "Token Aktif" : "Token Belum Diisi"}
            </span>
          </div>

          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="text-xs py-1.5 px-3 font-semibold whitespace-nowrap cursor-pointer bg-[#28292F] hover:bg-[#32343B] text-[#E0C98F] border border-[#35373E] rounded-xl transition-all flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>{showTokenInput ? "Tutup" : "Pengaturan"}</span>
          </button>
        </div>

        {/* Token Fonnte — Inline Quick Input */}
        <div className="flex items-center gap-2.5">
          <label className="text-[10px] uppercase text-[#E0C98F] font-bold whitespace-nowrap">Token Fonnte:</label>
          <input
            type="text"
            placeholder="Paste token Fonnte Anda di sini..."
            value={waToken}
            onChange={(e) => setWaToken(e.target.value)}
            className="flex-1 text-xs py-2 px-3 font-mono rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] placeholder-[#71717A] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
          />
          <button
            onClick={async () => {
              await saveConfig(waToken, phoneNumberId, provider, customServerUrl);
              alert("Token berhasil disimpan!");
            }}
            className="text-[11px] py-2 px-4 font-bold bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl cursor-pointer transition-all whitespace-nowrap shadow-sm flex items-center gap-1"
          >
            <span>Simpan</span>
          </button>
        </div>

        {provider === "fonnte" && !waToken && (
          <p className="text-[10.5px] text-amber-300 bg-amber-950/40 border border-amber-700/60 rounded-xl px-3.5 py-2">
            Token Fonnte belum diisi. Dapatkan token di <strong>fonnte.com</strong> → Dashboard → API Token, lalu paste di atas.
          </p>
        )}
      </div>

      {/* Expanded Provider Config */}
      {showTokenInput && (
        <div className="bg-white border border-[#d4af37]/40 rounded-2xl shadow-sm p-4 space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-bold text-[#b8860b]">
            ⚙️ Pengaturan Server WhatsApp Bot Gateway
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase text-[#b8860b] font-semibold mb-1">
                Provider Bot Pengirim
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full text-xs py-2 px-3 bg-[#faf8f5] border border-[#d4af37]/40 rounded-xl text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              >
                <option value="fonnte">🌐 Fonnte WA Gateway (Token Aktif)</option>
                <option value="local">🤖 Pure Bot WA Nomor Baru (npm run wa-pure-bot)</option>
                <option value="meta">Meta Official Cloud API (Gratis 1.000 msgs/bulan)</option>
                <option value="wablas">Wablas WA Gateway</option>
              </select>
            </div>

            {/* Custom Tunnel URL */}
            <div className="bg-[#faf8f5] p-3 rounded-xl border border-[#d4af37]/30 space-y-1">
              <label className="block text-[11px] uppercase text-[#b8860b] font-bold">
                🔗 URL Server Bot Custom (Localtunnel / Cloudflare)
              </label>
              <input
                type="text"
                placeholder="Paste URL Tunnel (contoh: https://xxx.trycloudflare.com)"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                className="w-full text-xs py-2 px-3 font-mono rounded-lg border border-[#d4af37]/40 bg-white text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>

            {provider === "meta" && (
              <div>
                <label className="block text-[10px] uppercase text-[#b8860b] font-semibold mb-0.5">
                  Meta Phone Number ID
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 104829381928301"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 font-mono border border-[#d4af37]/40 rounded-lg bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                />
              </div>
            )}

            {provider !== "local" && (
              <div>
                <label className="block text-[10px] uppercase text-[#b8860b] font-semibold mb-0.5">
                  API Token Key
                </label>
                <input
                  type="text"
                  placeholder="Masukkan Token API..."
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 font-mono border border-[#d4af37]/40 rounded-lg bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={() => {
                saveConfig(waToken, phoneNumberId, provider, customServerUrl);
                setShowTokenInput(false);
                alert("✓ Pengaturan Provider WA Bot berhasil disimpan!");
              }}
              className="w-full text-xs py-2 px-4 font-bold bg-[#d4af37] text-white hover:bg-[#b8860b] rounded-xl cursor-pointer transition-all mt-2"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Top Bar: Import & Bulk Auto-Blast */}
      <div className="flex gap-2.5">
        <button
          onClick={() => setShowBulkInput(!showBulkInput)}
          className="text-xs py-2.5 px-4 font-bold flex-1 flex items-center justify-center gap-1.5 bg-[#202125] border border-[#35373E] text-[#F1F0EC] hover:bg-[#28292F] rounded-xl cursor-pointer transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span>{showBulkInput ? "Tutup Impor" : "Impor Banyak Tamu (Copas List)"}</span>
        </button>

        {pendingWithPhoneCount > 0 && (
          <button
            onClick={handleBulkAutoBlast}
            disabled={isBlasting}
            className="text-xs py-2.5 px-4 font-extrabold flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all"
          >
            {isBlasting ? (
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                <span>Sending {blastProgress.current}/{blastProgress.total}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>KIRIM MASSAL OTOMATIS ({pendingWithPhoneCount})</span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Bulk Import Textarea Card */}
      {showBulkInput && (
        <div className="bg-[#202125] border border-[#2D2E34] rounded-2xl shadow-xs p-5 space-y-3">
          <h4 className="text-sm font-bold font-serif text-[#F1F0EC] flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E0C98F" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <span>Copy-Paste Banyak Nama &amp; No HP Tamu Sekaligus</span>
          </h4>
          <p className="text-xs text-[#9E9D98]">
            Paste daftar nama dan nomor HP tamu dari Excel / WhatsApp / Catatan.
            <br />
            <span className="text-[#E0C98F] font-bold">Format per baris:</span> Nama Tamu, 08123456789
          </p>

          <textarea
            rows={5}
            placeholder={`Bapak Andi, 081234567890
Siti Aminah, 085712345678
Budi Santoso, 081987654321`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full text-xs p-3 font-mono leading-relaxed border border-[#35373E] rounded-xl bg-[#28292F] text-[#F1F0EC] placeholder-[#71717A] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBulkInput(false)}
              className="text-xs py-2 px-4 bg-[#28292F] border border-[#35373E] text-[#9E9D98] hover:bg-[#32343B] rounded-xl cursor-pointer transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleBulkImport}
              className="text-xs py-2 px-5 font-bold bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl cursor-pointer transition-all"
            >
              Impor ke Daftar
            </button>
          </div>
        </div>
      )}

      {/* Single Input Form Card */}
      <div className="bg-[#202125] border border-[#2D2E34] rounded-2xl shadow-xs p-5 md:p-6 space-y-4">
        <h3
          className="text-lg font-bold font-serif text-[#F1F0EC] flex items-center gap-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E0C98F" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Tambah Satu Tamu</span>
        </h3>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-[#E0C98F] font-bold mb-1">
                Nama Tamu Undangan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Bapak Andi dan Keluarga"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] placeholder-[#71717A] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-[#E0C98F] font-bold mb-1">
                Nomor WhatsApp (Opsional)
              </label>
              <input
                type="tel"
                placeholder="Contoh: 08123456789 atau 628123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] placeholder-[#71717A] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-center">
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-[#E0C98F] font-bold mb-1">
                Kategori Tamu
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
              >
                <option value="Tamu VIP">Tamu VIP</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Teman Anam">Teman Anam</option>
                <option value="Teman Angi">Teman Angi</option>
                <option value="Rekan Kerja">Rekan Kerja</option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-[#E0C98F] font-bold mb-1">
                Template Pesan
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as any)}
                className="w-full text-xs py-2.5 px-3 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
              >
                <option value="Formal">Formal (Sopan)</option>
                <option value="Hangat">Hangat (Teman/Sahabat)</option>
                <option value="Singkat">Singkat &amp; Padat</option>
              </select>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 text-xs font-bold col-span-2 md:col-span-1 mt-4 md:mt-5 bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl cursor-pointer transition-all shadow-sm"
            >
              + Tambah ke Daftar
            </button>
          </div>
        </form>
      </div>

      {/* Filtered Guests Computation */}
      {(() => {
        const filteredGuests = guests.filter((g) => {
          const matchSearch =
            !searchQuery.trim() ||
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (g.phone && g.phone.includes(searchQuery)) ||
            (g.code && g.code.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchCat = filterCategory === "all" || g.category === filterCategory;

          const matchStatus =
            filterStatus === "all"
              ? true
              : filterStatus === "checkedIn"
              ? g.checkedIn
              : filterStatus === "sent"
              ? g.status === "sent"
              : filterStatus === "pending"
              ? g.status === "pending" || !g.status
              : true;

          return matchSearch && matchCat && matchStatus;
        });

        return (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-[#202125] p-4 border border-[#2D2E34] rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Cari nama / No WA / Kode Barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] placeholder-[#71717A] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9E9D98" strokeWidth="2" className="absolute left-3 top-3">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="text-xs py-2.5 px-3 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none flex-1 sm:w-36"
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="Tamu VIP">Tamu VIP</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Teman Anam">Teman Anam</option>
                    <option value="Teman Angi">Teman Angi</option>
                    <option value="Rekan Kerja">Rekan Kerja</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-xs py-2.5 px-3 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none flex-1 sm:w-36"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Belum Kirim</option>
                    <option value="sent">Terkirim Bot</option>
                    <option value="checkedIn">Checked-In (Hadir)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs uppercase tracking-[2px] font-bold text-[#E0C98F] flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <span>Daftar Undangan ({filteredGuests.length} dari {guests.length})</span>
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (guests.length > 0) {
                      await saveGuests(guests);
                    }
                    await loadCloudGuests();
                  }}
                  className="text-[11px] text-[#E0C98F] bg-[#28292F] hover:bg-[#32343B] px-3 py-1 rounded-xl border border-[#35373E] cursor-pointer font-bold transition-all flex items-center gap-1"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                  <span>Sync Cloud</span>
                </button>

                {guests.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Yakin ingin menghapus seluruh daftar tamu?")) {
                        saveGuests([]);
                      }
                    }}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer font-bold px-2 py-1"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
            </div>

            {filteredGuests.length === 0 ? (
              <div className="bg-[#202125] border border-[#2D2E34] p-8 text-center text-xs text-[#9E9D98] italic rounded-2xl">
                {guests.length === 0
                  ? "Belum ada daftar tamu. Gunakan tombol 'Impor Banyak Tamu' di atas."
                  : "Tidak ada tamu yang cocok dengan pencarian / filter Anda."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGuests.map((g) => (
              <div
                key={g.id}
                className={`bg-[#202125] p-4.5 border rounded-2xl flex flex-col gap-3 shadow-xs transition-all ${
                  g.status === "sent" ? "border-emerald-800/70 bg-[#161F1A]" : "border-[#2D2E34]"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#F1F0EC] font-serif">{g.name}</span>
                    <span className="text-[9px] bg-[#28292F] border border-[#35373E] text-[#E0C98F] px-2.5 py-0.5 rounded-full font-semibold">
                      {g.category}
                    </span>
                    <span className="text-[9px] bg-[#28292F] border border-[#35373E] text-[#A1A4B2] px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {g.code || g.id}
                    </span>
                    
                    {/* Status Badge with Click-to-Toggle feature */}
                    <button
                      onClick={() => toggleGuestStatus(g.id)}
                      title="Klik untuk ubah status terkirim/belum"
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold cursor-pointer transition-all ${
                        g.checkedIn
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                          : g.status === "sent"
                          ? "bg-emerald-900/80 text-emerald-200 border border-emerald-600 hover:bg-emerald-800"
                          : "bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900"
                      }`}
                    >
                      {g.checkedIn
                        ? `✓ HADIR (${g.checkInTime || "Check-In"})`
                        : g.status === "sent"
                        ? "✓ Terkirim WA"
                        : "⏳ Belum Kirim"}
                    </button>
                  </div>
                  <span className="text-[10px] text-[#9E9D98]">{g.createdAt}</span>
                </div>

                {g.phone && (
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    <span>Nomor WA:</span>
                    <span className="font-bold">+{formatPhoneNumber(g.phone)}</span>
                  </div>
                )}

                <div className="bg-[#1C1D21] p-2.5 rounded-xl text-[10.5px] font-mono text-[#E0C98F] truncate border border-[#2B2C32]">
                  {getGuestUrl(g.name, g.code)}
                </div>

                {/* QR Code Preview Toggle */}
                {qrPreviewId === g.id && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-white border border-[#35373E] rounded-2xl">
                    <QRCodeCanvas
                      data={g.code || g.id}
                      size={160}
                      className="rounded-lg"
                    />
                    <span className="text-[10px] font-mono font-bold text-[#18181B] bg-[#F4F4F6] px-3 py-1 rounded-lg border border-[#E4E4E7]">
                      {g.code || g.id}
                    </span>
                    <p className="text-[10px] text-[#71717A]">QR Code unik tamu untuk scan saat check-in.</p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* Direct 1-Click WhatsApp Button (Prominent Green) */}
                    <button
                      onClick={() => handleDirectWaWeb(g)}
                      className="text-[11px] py-2 px-3.5 flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-[#0A0B0D] font-black rounded-xl cursor-pointer shadow-md shadow-[#25D366]/20 transition-all active:scale-95"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.771.889 2.796.889 3.183 0 5.77-2.587 5.77-5.766.001-3.18-2.585-5.776-5.77-5.776zm0 10.455c-.93 0-1.745-.278-2.493-.728l-.178-.107-1.574.413.42-1.534-.117-.186c-.496-.789-.758-1.564-.757-2.547.001-2.584 2.102-4.686 4.689-4.686 2.586 0 4.688 2.102 4.688 4.687 0 2.585-2.102 4.688-4.689 4.688z" />
                      </svg>
                      <span>Kirim WA (1-Klik)</span>
                    </button>

                    {/* Copy Full Message Button */}
                    <button
                      onClick={() => handleCopyFullMessage(g)}
                      className="text-[10.5px] py-2 px-3 flex items-center gap-1.5 bg-[#28292F] border border-[#35373E] text-[#E5E3DF] hover:text-white hover:bg-[#32343B] rounded-xl cursor-pointer transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{copiedId === `msg-${g.id}` ? "Pesan Tersalin!" : "Salin Pesan"}</span>
                    </button>

                    {/* Copy Link Only Button */}
                    <button
                      onClick={() => handleCopy(g.name, g.id)}
                      className="text-[10.5px] py-2 px-3 flex items-center gap-1.5 bg-[#28292F] border border-[#35373E] text-[#C5C4C0] hover:text-white hover:bg-[#32343B] rounded-xl cursor-pointer transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>{copiedId === g.id ? "Link Tersalin!" : "Salin Link"}</span>
                    </button>

                    {/* QR Code Preview Toggle */}
                    <button
                      type="button"
                      onClick={() => setQrPreviewId(qrPreviewId === g.id ? null : g.id)}
                      className="text-[10.5px] py-2 px-2.5 bg-[#28292F] hover:bg-[#32343B] text-[#E0C98F] border border-[#35373E] rounded-xl cursor-pointer font-bold transition-all flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      <span>{qrPreviewId === g.id ? "Tutup QR" : "QR"}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-[#8A8C94] hover:text-rose-400 p-2 cursor-pointer transition-colors"
                    title="Hapus Tamu"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })()}
</div>
);
}
