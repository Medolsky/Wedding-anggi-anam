"use client";

import { useState, useEffect } from "react";
import { weddingData } from "@/data/weddingData";

export interface GeneratedGuest {
  id: string;
  name: string;
  phone?: string;
  category: string;
  template: "Formal" | "Hangat" | "Singkat";
  status?: "pending" | "sending" | "sent" | "failed";
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

  // WA Gateway State (Local Bot / Meta Cloud API / Fonnte / Wablas)
  const [provider, setProvider] = useState<"local" | "meta" | "fonnte" | "wablas">("local");
  const [waToken, setWaToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [customServerUrl, setCustomServerUrl] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      const savedGuests = localStorage.getItem("wevitation_admin_guests");
      if (savedGuests) {
        try {
          setGuests(JSON.parse(savedGuests));
        } catch {
          setGuests([]);
        }
      }

      const savedToken = localStorage.getItem("wevitation_wa_token");
      if (savedToken) setWaToken(savedToken);

      const savedPhoneId = localStorage.getItem("wevitation_meta_phone_id");
      if (savedPhoneId) setPhoneNumberId(savedPhoneId);

      const savedCustomUrl = localStorage.getItem("wevitation_custom_server_url");
      if (savedCustomUrl) setCustomServerUrl(savedCustomUrl);

      const savedProvider = localStorage.getItem("wevitation_wa_provider");
      if (savedProvider) setProvider(savedProvider as any);
    }
  }, []);

  function saveGuests(updated: GeneratedGuest[]) {
    setGuests(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("wevitation_admin_guests", JSON.stringify(updated));
    }
  }

  function saveConfig(
    token: string,
    phoneId: string,
    prov: "local" | "meta" | "fonnte" | "wablas",
    cUrl: string
  ) {
    setWaToken(token);
    setPhoneNumberId(phoneId);
    setProvider(prov);
    setCustomServerUrl(cUrl);
    if (typeof window !== "undefined") {
      localStorage.setItem("wevitation_wa_token", token);
      localStorage.setItem("wevitation_meta_phone_id", phoneId);
      localStorage.setItem("wevitation_wa_provider", prov);
      localStorage.setItem("wevitation_custom_server_url", cUrl);
    }
  }

  function formatPhoneNumber(num: string): string {
    let cleaned = num.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return cleaned;
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;

    const newGuest: GeneratedGuest = {
      id: Date.now().toString(),
      name: guestName.trim(),
      phone: phone.trim() ? formatPhoneNumber(phone.trim()) : undefined,
      category,
      template,
      status: "pending",
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
          name,
          phone: rawPhone ? formatPhoneNumber(rawPhone) : undefined,
          category,
          template,
          status: "pending",
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
      alert(`✓ Berhasil mengimpor ${newGuests.length} nama & nomor tamu!`);
    }
  }

  function handleDelete(id: string) {
    const updated = guests.filter((g) => g.id !== id);
    saveGuests(updated);
  }

  function getGuestUrl(name: string) {
    const encoded = encodeURIComponent(name);
    return `${origin}/?to=${encoded}`;
  }

  function getWaMessage(name: string, tmpl: "Formal" | "Hangat" | "Singkat" = "Formal") {
    const url = getGuestUrl(name);

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
        setGuests((prev) =>
          prev.map((g) => (g.id === guest.id ? { ...g, status: "sent" as const } : g))
        );
        return true;
      } else {
        setGuests((prev) =>
          prev.map((g) => (g.id === guest.id ? { ...g, status: "failed" as const } : g))
        );
        alert(`Notice: ${data.error || "Pesan gagal terkirim. Pastikan server bot lokal berjalan."}`);
        return false;
      }
    } catch {
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, status: "failed" as const } : g))
      );
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
      {/* Bot Gateway Setup Banner */}
      <div className="gold-card-pro p-4 border border-[#d4af37]/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#260c09]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#f3e5ab]">
              🤖 Bot WA Lokal Self-Hosted (100% Gratis &amp; Unlimited)
            </span>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
              {provider === "local" ? "✓ Bot Lokal Aktif" : provider}
            </span>
          </div>
          <p className="text-[11px] text-white/70 mt-0.5">
            Jalankan <code className="bg-black/50 px-1 py-0.5 rounded text-[#f3e5ab]">npm run wa-bot</code> di terminal untuk kirim ribuan undangan 100% gratis tanpa bayar sepeser pun.
          </p>
        </div>

        <button
          onClick={() => setShowTokenInput(!showTokenInput)}
          className="btn-modern-secondary text-xs py-1.5 px-3 font-semibold whitespace-nowrap cursor-pointer"
        >
          ⚙️ Pengaturan Provider
        </button>
      </div>

      {/* Provider & Token Config Modal / Input Box */}
      {showTokenInput && (
        <div className="gold-card-pro p-4 border border-[#d4af37]/50 rounded-2xl space-y-3 bg-[#1e0a08]">
          <h4 className="text-xs uppercase tracking-wider font-bold text-[#d4af37]">
            ⚙️ Pengaturan Server WhatsApp Bot Gateway
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase text-[#d4af37] font-semibold mb-1">
                Provider Bot Pengirim
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="form-input text-xs py-2 px-3 bg-[#1c0a08] rounded-xl w-full"
              >
                <option value="local">🤖 Bot Lokal Self-Hosted (100% Gratis &amp; Unlimited)</option>
                <option value="meta">Meta Official Cloud API (Gratis 1.000 msgs/bulan)</option>
                <option value="fonnte">Fonnte WA Gateway</option>
                <option value="wablas">Wablas WA Gateway</option>
              </select>
            </div>

            {/* Custom Tunnel / Server URL Input - Always Visible */}
            <div className="bg-[#120605] p-3 rounded-xl border border-[#d4af37]/30 space-y-1">
              <label className="block text-[11px] uppercase text-[#f3e5ab] font-bold">
                🔗 URL Server Bot Custom (Localtunnel / Tunnel)
              </label>
              <input
                type="text"
                placeholder="Paste URL Localtunnel (contoh: https://many-rice-enter.loca.lt)"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                className="form-input text-xs py-2 px-3 font-mono rounded-lg w-full bg-[#1c0a08]"
              />
              <p className="text-[10px] text-white/60">
                Tempel URL Localtunnel di atas (contoh: <code className="text-[#d4af37]">https://many-rice-enter.loca.lt</code>) agar Admin Panel Netlify online dapat terhubung ke bot laptop Anda!
              </p>
            </div>

            {provider === "meta" && (
              <div>
                <label className="block text-[10px] uppercase text-[#d4af37] font-semibold mb-0.5">
                  Meta Phone Number ID
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 104829381928301"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="form-input text-xs py-1.5 px-3 font-mono"
                />
              </div>
            )}

            {provider !== "local" && (
              <div>
                <label className="block text-[10px] uppercase text-[#d4af37] font-semibold mb-0.5">
                  API Token Key
                </label>
                <input
                  type="text"
                  placeholder="Masukkan Token API..."
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  className="form-input text-xs py-1.5 px-3 font-mono"
                />
              </div>
            )}

            <button
              onClick={() => {
                saveConfig(waToken, phoneNumberId, provider, customServerUrl);
                setShowTokenInput(false);
                alert("✓ Pengaturan Provider WA Bot berhasil disimpan!");
              }}
              className="btn-modern-primary text-xs py-2 px-4 font-bold w-full mt-2"
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
          className="btn-modern-secondary text-xs py-2.5 px-4 font-bold flex-1 flex items-center justify-center gap-1.5"
        >
          📋 {showBulkInput ? "Tutup Impor" : "Impor Banyak Tamu (Copas List)"}
        </button>

        {pendingWithPhoneCount > 0 && (
          <button
            onClick={handleBulkAutoBlast}
            disabled={isBlasting}
            className="btn-modern-primary text-xs py-2.5 px-4 font-extrabold flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-xl flex items-center justify-center gap-1.5 cursor-pointer hover:from-emerald-500 hover:to-teal-500"
          >
            {isBlasting
              ? `⏳ Sending ${blastProgress.current}/${blastProgress.total}`
              : `🚀 KIRIM MASSAL OTOMATIS (${pendingWithPhoneCount})`}
          </button>
        )}
      </div>

      {/* Bulk Import Textarea Card */}
      {showBulkInput && (
        <div className="gold-card-pro p-5 border border-[#d4af37]/50 rounded-2xl space-y-3 bg-[#1c0a08]">
          <h4 className="text-sm font-bold font-serif text-[#f3e5ab]">
            📋 Copy-Paste Banyak Nama &amp; No HP Tamu Sekaligus
          </h4>
          <p className="text-xs text-white/70">
            Paste daftar nama dan nomor HP tamu dari Excel / WhatsApp / Catatan.
            <br />
            <span className="text-[#d4af37] font-semibold">Format per baris:</span> Nama Tamu, 08123456789
          </p>

          <textarea
            rows={5}
            placeholder={`Bapak Andi, 081234567890
Siti Aminah, 085712345678
Budi Santoso, 081987654321`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="form-input text-xs p-3 font-mono leading-relaxed"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBulkInput(false)}
              className="btn-modern-secondary text-xs py-2 px-4"
            >
              Batal
            </button>
            <button
              onClick={handleBulkImport}
              className="btn-modern-primary text-xs py-2 px-5 font-bold"
            >
              ✓ Impor ke Daftar
            </button>
          </div>
        </div>
      )}

      {/* Single Input Form Card */}
      <div className="gold-card-pro p-5 md:p-6 border border-[#d4af37]/40 shadow-xl rounded-2xl">
        <h3
          className="text-lg md:text-xl font-bold font-serif text-[#f3e5ab] mb-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ➕ Tambah Satu Tamu
        </h3>

        <form onSubmit={handleGenerate} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#d4af37] font-semibold mb-1">
                Nama Tamu Undangan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Bapak Andi dan Keluarga"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="form-input text-xs py-2 px-3.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#d4af37] font-semibold mb-1">
                Nomor WhatsApp (Opsional)
              </label>
              <input
                type="tel"
                placeholder="Contoh: 08123456789 atau 628123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input text-xs py-2 px-3.5 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-center">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#d4af37] font-semibold mb-1">
                Kategori Tamu
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input text-xs py-2 px-3 rounded-xl bg-[#1c0a08]"
              >
                <option value="Tamu VIP">Tamu VIP</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Teman Anam">Teman Anam</option>
                <option value="Teman Angi">Teman Angi</option>
                <option value="Rekan Kerja">Rekan Kerja</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#d4af37] font-semibold mb-1">
                Template Pesan
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as any)}
                className="form-input text-xs py-2 px-3 rounded-xl bg-[#1c0a08]"
              >
                <option value="Formal">Formal (Sopan)</option>
                <option value="Hangat">Hangat (Teman/Sahabat)</option>
                <option value="Singkat">Singkat &amp; Padat</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-modern-primary py-2.5 px-5 text-xs font-bold col-span-2 md:col-span-1 mt-4 md:mt-5"
            >
              + Tambah ke Daftar
            </button>
          </div>
        </form>
      </div>

      {/* Guest Links & WA Sender Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs uppercase tracking-[2px] font-bold text-[#d4af37]">
            Daftar Kirim Undangan ({guests.length})
          </h4>
          {guests.length > 0 && (
            <button
              onClick={() => saveGuests([])}
              className="text-[10px] text-red-400 hover:underline cursor-pointer"
            >
              Hapus Semua
            </button>
          )}
        </div>

        {guests.length === 0 ? (
          <div className="gold-card-pro p-6 text-center text-xs text-white/60 rounded-xl">
            Belum ada daftar tamu. Gunakan tombol "Impor Banyak Tamu" di atas untuk memasukkan seluruh daftar nama &amp; nomor HP sekaligus.
          </div>
        ) : (
          <div className="space-y-3">
            {guests.map((g) => (
              <div
                key={g.id}
                className={`gold-card-pro p-4 border rounded-xl flex flex-col gap-2.5 ${
                  g.status === "sent" ? "border-emerald-500/40 bg-emerald-950/10" : "border-[#d4af37]/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-serif">{g.name}</span>
                    <span className="text-[9px] bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f3e5ab] px-2 py-0.5 rounded-full font-semibold">
                      {g.category}
                    </span>
                    {g.status === "sent" && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                        ✓ Terkirim Bot
                      </span>
                    )}
                    {g.status === "failed" && (
                      <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ Gagal
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/50">{g.createdAt}</span>
                </div>

                {g.phone && (
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <span>📱 WA Target:</span>
                    <span className="font-bold">+{g.phone}</span>
                  </div>
                )}

                <div className="bg-[#120605] p-2 rounded-lg text-[10px] font-mono text-[#f3e5ab] truncate border border-white/10">
                  {getGuestUrl(g.name)}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    {/* Single Auto Bot Send Button */}
                    {g.phone && (
                      <button
                        onClick={() => handleSingleAutoSend(g)}
                        disabled={sendingId === g.id || isBlasting}
                        className="btn-modern-primary text-[10px] py-1.5 px-3 flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-md font-extrabold cursor-pointer hover:from-emerald-500 hover:to-teal-500"
                      >
                        {sendingId === g.id ? "⏳..." : "⚡ Kirim Bot"}
                      </button>
                    )}

                    {/* Direct WA Web Launcher Button */}
                    <button
                      onClick={() => handleDirectWaWeb(g)}
                      className="btn-modern-secondary text-[10px] py-1.5 px-3 flex items-center gap-1"
                    >
                      <span>💬 Buka WA App</span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopy(g.name, g.id)}
                      className="btn-modern-secondary text-[10px] py-1.5 px-3 flex items-center gap-1"
                    >
                      {copiedId === g.id ? "✓ Tersalin!" : "📋 Salin Link"}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-white/40 hover:text-red-400 text-xs p-1 cursor-pointer transition-colors"
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
    </div>
  );
}
