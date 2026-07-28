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
        hour: "2-digit",
        minute: "2-digit",
      }),
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
            hour: "2-digit",
            minute: "2-digit",
          }),
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

*${weddingData.couple.bride.nickname} & ${weddingData.couple.groom.nickname}*
🗓 Sabtu, 10 Oktober 2026
📍 BALAI IKABAMA, Depok

Link Undangan Digital:
${url}

Terima kasih atas doa restunya!
- Angi & Anam`;
    }

    if (tmpl === "Hangat") {
      return `Assalamu'alaikum Wr. Wb.

Dear *${name}*,

Semoga sehat dan bahagia selalu! 🌸
Dengan penuh rasa syukur, kami ingin mengundang kamu untuk hadir menjadi bagian dari hari bahagia pernikahan kami:

*${weddingData.couple.bride.nickname} & ${weddingData.couple.groom.nickname}*
(Angi Sulistia & Misbakhul Anam Roziqin)

🗓 *Sabtu, 10 Oktober 2026*
📍 *BALAI IKABAMA*, Depok

Informasi lengkap acara, peta lokasi, dan konfirmasi kehadiran (RSVP) dapat dilihat pada link berikut:
${url}

Kehadiran dan doa restumu sangat berarti bagi perjalanan kehidupan baru kami. Sampai jumpa di hari H!

Warm regards,
*Angi & Anam*`;
    }

    return `Bismillah-ir-Rahman-ir-Rahim

Kepada Yth.
*${name}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:

*${weddingData.couple.bride.nickname} & ${weddingData.couple.groom.nickname}*
(Angi Sulistia & Misbakhul Anam Roziqin)

🗓 *Sabtu, 10 Oktober 2026*
📍 *BALAI IKABAMA*, Depok

Berikut link undangan digital kami untuk informasi lengkap acara & RSVP:
${url}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih.
Wassalamu'alaikum Wr. Wb.

Hormat kami,
*Angi & Anam*`;
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
    const text = getWaMessage(guest.name, guest.template);
    const encodedText = encodeURIComponent(text);
    let waUrl = guest.phone
      ? `https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, "_blank");
  }

  const pendingWithPhoneCount = guests.filter((g) => g.phone && g.status !== "sent").length;

  return (
    <div className="space-y-6">
      {/* Fonnte Token & Bot Config Card — Always Visible */}
      <div className="bg-white border border-[#d4af37]/40 rounded-2xl shadow-sm p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#2a2723]">
              {provider === "fonnte" ? "🌐 Fonnte WA Gateway" : provider === "local" ? "🤖 Pure Bot WA (Nomor Baru)" : `🤖 ${provider.toUpperCase()}`}
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
              waToken
                ? "bg-emerald-100 text-emerald-700 border border-emerald-400"
                : "bg-amber-100 text-amber-700 border border-amber-400"
            }`}>
              {waToken ? "✓ Token Aktif" : "⚠ Token Belum Diisi"}
            </span>
          </div>

          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="text-xs py-1.5 px-3 font-semibold whitespace-nowrap cursor-pointer bg-[#f7ebbf]/60 hover:bg-[#f7ebbf] text-[#8a662d] border border-[#d4af37]/40 rounded-lg transition-all"
          >
            ⚙️ {showTokenInput ? "Tutup" : "Pengaturan"}
          </button>
        </div>

        {/* Token Fonnte — Inline Quick Input */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase text-[#b8860b] font-bold whitespace-nowrap">Token Fonnte:</label>
          <input
            type="text"
            placeholder="Paste token Fonnte Anda di sini..."
            value={waToken}
            onChange={(e) => setWaToken(e.target.value)}
            className="flex-1 text-xs py-1.5 px-3 font-mono rounded-lg border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <button
            onClick={async () => {
              await saveConfig(waToken, phoneNumberId, provider, customServerUrl);
              alert("✅ Token berhasil disimpan!");
            }}
            className="text-[10px] py-1.5 px-3 font-bold bg-[#d4af37] text-white hover:bg-[#b8860b] rounded-lg cursor-pointer transition-all whitespace-nowrap"
          >
            💾 Simpan
          </button>
        </div>

        {provider === "fonnte" && !waToken && (
          <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5">
            ⚠️ Token Fonnte belum diisi. Dapatkan token di <strong>fonnte.com</strong> → Dashboard → API Token, lalu paste di atas.
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
          className="text-xs py-2.5 px-4 font-bold flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#d4af37]/40 text-[#2a2723] hover:bg-[#f7ebbf]/40 rounded-xl cursor-pointer transition-all"
        >
          📋 {showBulkInput ? "Tutup Impor" : "Impor Banyak Tamu (Copas List)"}
        </button>

        {pendingWithPhoneCount > 0 && (
          <button
            onClick={handleBulkAutoBlast}
            disabled={isBlasting}
            className="text-xs py-2.5 px-4 font-extrabold flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all"
          >
            {isBlasting
              ? `⏳ Sending ${blastProgress.current}/${blastProgress.total}`
              : `🚀 KIRIM MASSAL OTOMATIS (${pendingWithPhoneCount})`}
          </button>
        )}
      </div>

      {/* Bulk Import Textarea Card */}
      {showBulkInput && (
        <div className="bg-white border border-[#d4af37]/40 rounded-2xl shadow-sm p-5 space-y-3">
          <h4 className="text-sm font-bold font-serif text-[#2a2723]">
            📋 Copy-Paste Banyak Nama &amp; No HP Tamu Sekaligus
          </h4>
          <p className="text-xs text-[#66615c]">
            Paste daftar nama dan nomor HP tamu dari Excel / WhatsApp / Catatan.
            <br />
            <span className="text-[#b8860b] font-semibold">Format per baris:</span> Nama Tamu, 08123456789
          </p>

          <textarea
            rows={5}
            placeholder={`Bapak Andi, 081234567890
Siti Aminah, 085712345678
Budi Santoso, 081987654321`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full text-xs p-3 font-mono leading-relaxed border border-[#d4af37]/40 rounded-xl bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBulkInput(false)}
              className="text-xs py-2 px-4 bg-white border border-[#d4af37]/40 text-[#66615c] hover:bg-[#faf8f5] rounded-xl cursor-pointer transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleBulkImport}
              className="text-xs py-2 px-5 font-bold bg-[#d4af37] text-white hover:bg-[#b8860b] rounded-xl cursor-pointer transition-all"
            >
              ✓ Impor ke Daftar
            </button>
          </div>
        </div>
      )}

      {/* Single Input Form Card */}
      <div className="bg-white border border-[#d4af37]/40 rounded-2xl shadow-sm p-5 md:p-6">
        <h3
          className="text-lg md:text-xl font-bold font-serif text-[#2a2723] mb-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ➕ Tambah Satu Tamu
        </h3>

        <form onSubmit={handleGenerate} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#b8860b] font-semibold mb-1">
                Nama Tamu Undangan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Bapak Andi dan Keluarga"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full text-xs py-2 px-3.5 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#b8860b] font-semibold mb-1">
                Nomor WhatsApp (Opsional)
              </label>
              <input
                type="tel"
                placeholder="Contoh: 08123456789 atau 628123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs py-2 px-3.5 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-center">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#b8860b] font-semibold mb-1">
                Kategori Tamu
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              >
                <option value="Tamu VIP">Tamu VIP</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Teman Anam">Teman Anam</option>
                <option value="Teman Angi">Teman Angi</option>
                <option value="Rekan Kerja">Rekan Kerja</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#b8860b] font-semibold mb-1">
                Template Pesan
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as any)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              >
                <option value="Formal">Formal (Sopan)</option>
                <option value="Hangat">Hangat (Teman/Sahabat)</option>
                <option value="Singkat">Singkat &amp; Padat</option>
              </select>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 text-xs font-bold col-span-2 md:col-span-1 mt-4 md:mt-5 bg-[#d4af37] text-white hover:bg-[#b8860b] rounded-xl cursor-pointer transition-all shadow-md"
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
          <div className="space-y-3">
            {/* Search & Filter Bar */}
            <div className="bg-white p-3.5 border border-[#d4af37]/30 rounded-xl shadow-sm space-y-2.5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <input
                  type="text"
                  placeholder="🔍 Cari nama / No WA / Kode Barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 text-xs py-2 px-3 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                />

                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="text-xs py-2 px-3 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none flex-1 sm:w-36"
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
                    className="text-xs py-2 px-3 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none flex-1 sm:w-36"
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
              <h4 className="text-xs uppercase tracking-[2px] font-bold text-[#b8860b]">
                Daftar Undangan ({filteredGuests.length} dari {guests.length})
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (guests.length > 0) {
                      await saveGuests(guests);
                    }
                    await loadCloudGuests();
                  }}
                  className="text-[10px] text-[#8a662d] bg-[#f7ebbf]/40 hover:bg-[#f7ebbf] px-2 py-1 rounded border border-[#d4af37]/40 cursor-pointer font-bold transition-all"
                >
                  🔄 Sync Cloud
                </button>

                {guests.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Yakin ingin menghapus seluruh daftar tamu?")) {
                        saveGuests([]);
                      }
                    }}
                    className="text-[10px] text-red-500 hover:underline cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
            </div>

            {filteredGuests.length === 0 ? (
              <div className="bg-white border border-[#d4af37]/20 p-6 text-center text-xs text-[#66615c] rounded-xl">
                {guests.length === 0
                  ? "Belum ada daftar tamu. Gunakan tombol 'Impor Banyak Tamu' di atas."
                  : "Tidak ada tamu yang cocok dengan pencarian / filter Anda."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGuests.map((g) => (
              <div
                key={g.id}
                className={`bg-white p-4 border rounded-xl flex flex-col gap-2.5 shadow-sm ${
                  g.status === "sent" ? "border-emerald-400/60" : "border-[#d4af37]/30"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#2a2723] font-serif">{g.name}</span>
                    <span className="text-[9px] bg-[#f7ebbf] border border-[#d4af37]/40 text-[#8a662d] px-2 py-0.5 rounded-full font-semibold">
                      {g.category}
                    </span>
                    <span className="text-[9px] bg-[#faf8f5] border border-[#d4af37]/50 text-[#8a662d] px-2 py-0.5 rounded-full font-mono font-bold">
                      🎫 {g.code || g.id}
                    </span>
                    {g.checkedIn && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-400 px-2 py-0.5 rounded-full font-extrabold">
                        ✓ HADIR ({g.checkInTime || "Checked-In"})
                      </span>
                    )}
                    {g.status === "sent" && !g.checkedIn && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        ✓ Terkirim Bot
                      </span>
                    )}
                    {g.status === "failed" && (
                      <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ Gagal
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#66615c]">{g.createdAt}</span>
                </div>

                {g.phone && (
                  <div className="text-[11px] text-emerald-700 font-mono flex items-center gap-1.5">
                    <span>📱 WA Target:</span>
                    <span className="font-bold">+{g.phone}</span>
                  </div>
                )}

                <div className="bg-[#faf8f5] p-2 rounded-lg text-[10px] font-mono text-[#8a662d] truncate border border-[#d4af37]/30">
                  {getGuestUrl(g.name, g.code)}
                </div>

                {/* QR Code Preview Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQrPreviewId(qrPreviewId === g.id ? null : g.id)}
                    className="text-[10px] py-1.5 px-3 bg-[#f7ebbf]/60 hover:bg-[#f7ebbf] text-[#8a662d] border border-[#d4af37]/40 rounded-lg cursor-pointer font-bold transition-all flex items-center gap-1"
                  >
                    {qrPreviewId === g.id ? "🔽 Sembunyikan QR" : "📱 Lihat QR Code"}
                  </button>
                </div>

                {/* QR Code for this guest */}
                {qrPreviewId === g.id && (
                  <div className="flex flex-col items-center gap-2 p-3 bg-white border border-[#d4af37]/30 rounded-xl">
                    <QRCodeCanvas
                      data={g.code || g.id}
                      size={160}
                      className="rounded-lg"
                    />
                    <span className="text-[10px] font-mono font-bold text-[#2a2723] bg-[#faf8f5] px-3 py-1 rounded-lg border border-[#d4af37]/30">
                      {g.code || g.id}
                    </span>
                    <p className="text-[9px] text-[#66615c]">QR Code unik untuk tamu ini. Scan saat check-in.</p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    {/* Single Auto Bot Send Button */}
                    {g.phone && (
                      <button
                        onClick={() => handleSingleAutoSend(g)}
                        disabled={sendingId === g.id || isBlasting}
                        className="text-[10px] py-1.5 px-3 flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-md font-extrabold cursor-pointer hover:from-emerald-500 hover:to-teal-500 rounded-lg transition-all"
                      >
                        {sendingId === g.id ? "⏳..." : "⚡ Kirim Bot"}
                      </button>
                    )}

                    {/* Direct WA Web Launcher Button */}
                    <button
                      onClick={() => handleDirectWaWeb(g)}
                      className="text-[10px] py-1.5 px-3 flex items-center gap-1 bg-white border border-[#d4af37]/40 text-[#2a2723] hover:bg-[#f7ebbf]/40 rounded-lg cursor-pointer transition-all"
                    >
                      <span>💬 Buka WA App</span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopy(g.name, g.id)}
                      className="text-[10px] py-1.5 px-3 flex items-center gap-1 bg-white border border-[#d4af37]/40 text-[#2a2723] hover:bg-[#f7ebbf]/40 rounded-lg cursor-pointer transition-all"
                    >
                      {copiedId === g.id ? "✓ Tersalin!" : "📋 Salin Link"}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-[#999] hover:text-red-500 text-xs p-1 cursor-pointer transition-colors"
                    title="Hapus"
                  >
                    🗑️
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
