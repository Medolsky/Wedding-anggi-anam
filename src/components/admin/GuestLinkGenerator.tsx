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
  template?: string;
  status?: "pending" | "sending" | "sent" | "copied" | "sent_and_copied" | "failed";
  checkedIn?: boolean;
  checkInTime?: string;
  pax?: number;
  createdAt: string;
  isCopied?: boolean;
  isSentWa?: boolean;
  copiedAt?: string;
  sentWaAt?: string;
}

export function GuestLinkGenerator() {
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Tamu VIP");
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
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    loadCloudGuests();
  }, []);

  async function loadCloudGuests() {
    try {
      const res = await fetch(`/api/db?type=guests&t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((g: any) => ({
          ...g,
          isSentWa: g.isSentWa || g.status === "sent" || g.status === "sent_and_copied",
          isCopied: g.isCopied || g.status === "copied" || g.status === "sent_and_copied",
        }));
        setGuests(mapped);
      }

      const cfgRes = await fetch(`/api/db?type=config&t=${Date.now()}`, { cache: "no-store" });
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
    return name.trim();
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;

    const trimmedName = guestName.trim();
    const newGuest: GeneratedGuest = {
      id: Date.now().toString(),
      code: trimmedName,
      name: trimmedName,
      phone: phone.trim() ? formatPhoneNumber(phone.trim()) : undefined,
      category,
      template: "Standar",
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
          template: "Standar",
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

  async function handleDelete(id: string) {
    const targetGuest = guests.find((g) => g.id === id);
    const updated = guests.filter((g) => g.id !== id);
    setGuests(updated);

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          type: "guests",
          item: {
            id,
            name: targetGuest?.name,
            code: targetGuest?.code,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to delete guest from cloud DB:", err);
    }
  }

  function getGuestUrl(name: string) {
    // Clean & compact short link (readable, no %20 clutter, no long code params)
    const safeName = (name || "Tamu Undangan").trim().replace(/&/g, "%26").replace(/\s+/g, "+");
    return `${origin}/?to=${encodeURI(safeName)}`;
  }

  function getWaMessage(name: string, codeOrTmpl?: string, code?: string) {
    const url = getGuestUrl(name);

    const cleanName = name.trim();
    let guestDisplayName = cleanName;
    if (/^Bapak\/Ibu\s+/i.test(cleanName)) {
      guestDisplayName = cleanName.replace(/^Bapak\/Ibu\s+/i, "");
    }

    const hasPartnerOrFamily = /(&|dan\s+|partner|keluarga|istri|suami|pasangan)/i.test(guestDisplayName);
    const guestWithPartner = hasPartnerOrFamily ? guestDisplayName : `${guestDisplayName} & Partner`;

    return `Assalamu’alaikum Wr. Wb.

*Yth. Bapak/Ibu ${guestDisplayName}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i *${guestWithPartner}*, Untuk menghadiri acara pernikahan kami. 

*Misbakhul Anam Roziqin & Angi Sulistia*

Kami mengundang Bapak/Ibu untuk hadir dan turut memberikan doa restu pada:

*🗓️Sabtu, 10 Oktober 2026*
*⏱️ 08.00 s/d Selesai*
*💍Balai Ikabama, Kota Depok*

Undangan lengkap beserta informasi acara dapat diakses melalui tautan berikut:

🔗 ${url}

Kami berharap Bapak/Ibu dapat hadir dan menjadi bagian dari hari bahagia kami.

Mohon maaf apabila undangan ini disampaikan melalui pesan digital.

Terima kasih atas perhatian dan doa yang diberikan.

Wassalamu’alaikum Wr. Wb.

*Anam & Angi*`;
  }

  async function handleCopy(name: string, id: string) {
    const url = getGuestUrl(name);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);

      const timeStr =
        new Date().toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB";

      const updated = guests.map((g) => {
        if (g.id === id) {
          const isAlreadySent = g.isSentWa || g.status === "sent" || g.status === "sent_and_copied";
          const nextStatus = isAlreadySent ? ("sent_and_copied" as const) : ("copied" as const);
          return {
            ...g,
            status: nextStatus,
            isCopied: true,
            copiedAt: timeStr,
          };
        }
        return g;
      });
      saveGuests(updated);
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
    const message = getWaMessage(guest.name, guest.code);

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
        const timeStr =
          new Date().toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB";
        const isAlreadyCopied = guest.isCopied || guest.status === "copied" || guest.status === "sent_and_copied";
        const nextStatus = isAlreadyCopied ? ("sent_and_copied" as const) : ("sent" as const);

        const updated = guests.map((g) =>
          g.id === guest.id
            ? {
                ...g,
                status: nextStatus,
                isSentWa: true,
                sentWaAt: timeStr,
              }
            : g
        );
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
    const text = getWaMessage(guest.name, guest.code);
    const encodedText = encodeURIComponent(text);
    const cleanNum = guest.phone ? formatPhoneNumber(guest.phone) : "";
    const waUrl = cleanNum
      ? `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    
    window.open(waUrl, "_blank");

    const timeStr =
      new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";

    const isAlreadyCopied = guest.isCopied || guest.status === "copied" || guest.status === "sent_and_copied";
    const nextStatus = isAlreadyCopied ? ("sent_and_copied" as const) : ("sent" as const);

    // Automatically mark status as sent to WA
    const updated = guests.map((g) =>
      g.id === guest.id
        ? {
            ...g,
            status: nextStatus,
            isSentWa: true,
            sentWaAt: timeStr,
          }
        : g
    );
    saveGuests(updated);
  }

  async function handleCopyFullMessage(guest: GeneratedGuest) {
    const text = getWaMessage(guest.name, guest.code);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(`msg-${guest.id}`);
      setTimeout(() => setCopiedId(null), 2000);

      const timeStr =
        new Date().toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB";

      const isAlreadySent = guest.isSentWa || guest.status === "sent" || guest.status === "sent_and_copied";
      const nextStatus = isAlreadySent ? ("sent_and_copied" as const) : ("copied" as const);

      const updated = guests.map((g) =>
        g.id === guest.id
          ? {
              ...g,
              status: nextStatus,
              isCopied: true,
              copiedAt: timeStr,
            }
          : g
      );
      saveGuests(updated);
    } catch {
      alert("Gagal menyalin pesan");
    }
  }

  function toggleGuestStatus(id: string) {
    const updated = guests.map((g) => {
      if (g.id === id) {
        let nextStatus: GeneratedGuest["status"] = "sent";
        let isSentWa = true;
        let isCopied = false;

        if (g.status === "sent") {
          nextStatus = "copied";
          isSentWa = false;
          isCopied = true;
        } else if (g.status === "copied") {
          nextStatus = "sent_and_copied";
          isSentWa = true;
          isCopied = true;
        } else if (g.status === "sent_and_copied") {
          nextStatus = "pending";
          isSentWa = false;
          isCopied = false;
        }

        return { ...g, status: nextStatus, isSentWa, isCopied };
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
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

            <button
              type="submit"
              className="py-2.5 px-5 text-xs font-bold bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl cursor-pointer transition-all shadow-sm h-[38px] flex items-center justify-center gap-1.5"
            >
              + Tambah ke Daftar
            </button>
          </div>

          {/* Single Unified Template Info Badge with Interactive Preview */}
          <div className="bg-[#1C1D21] border border-[#2D2E34] rounded-xl overflow-hidden transition-all">
            <div className="p-3 flex items-center justify-between flex-wrap gap-2 text-[11px] text-[#A1A4B2]">
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <span className="text-[#F1F0EC] font-semibold">Template Pesan WhatsApp Resmi (Berlaku untuk Semua Tamu)</span>
                <span className="text-[10px] bg-[#28292F] text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-[#35373E]">
                  Standar Tunggal
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                className="text-[10.5px] text-[#E0C98F] hover:text-[#F3E5AB] font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                {showTemplatePreview ? "Sembunyikan Format ▲" : "Lihat Format Pesan ▼"}
              </button>
            </div>
            {showTemplatePreview && (
              <div className="px-3.5 pb-3.5 pt-1 border-t border-[#2D2E34]/70 bg-[#16171A]">
                <p className="text-[10px] text-[#8E909A] mb-2">
                  * Nama tamu dan tautan undangan akan terisi otomatis sesuai data masing-masing:
                </p>
                <pre className="text-[11px] text-[#E5E3DF] font-mono whitespace-pre-wrap leading-relaxed bg-[#202125] p-3 rounded-lg border border-[#2B2C32] select-all">
                  {getWaMessage("Bapak Budi Santoso", "GUEST-001")}
                </pre>
              </div>
            )}
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

          const isSent = g.isSentWa || g.status === "sent" || g.status === "sent_and_copied";
          const isCopied = g.isCopied || g.status === "copied" || g.status === "sent_and_copied";

          const matchStatus =
            filterStatus === "all"
              ? true
              : filterStatus === "checkedIn"
              ? g.checkedIn
              : filterStatus === "sent"
              ? isSent
              : filterStatus === "copied"
              ? isCopied
              : filterStatus === "pending"
              ? !isSent && !isCopied && !g.checkedIn
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
                    className="text-xs py-2.5 px-3 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none flex-1 sm:w-40"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">⏳ Belum Diproses</option>
                    <option value="sent">✓ Sudah Kirim WA</option>
                    <option value="copied">📋 Sudah Salin Link</option>
                    <option value="checkedIn">🎟️ Hadir di Lokasi</option>
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
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle: Grid (Multi-Kolom) vs List (1 Kolom) */}
                <div className="flex items-center bg-[#17181D] p-0.5 rounded-xl border border-[#2B2E38]">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === "grid"
                        ? "bg-[#C8A96B] text-[#0A0B0D] shadow-xs"
                        : "text-[#8A8C94] hover:text-white"
                    }`}
                    title="Tampilan Grid (Beberapa Undangan per Baris)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span className="text-[10.5px]">Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === "list"
                        ? "bg-[#C8A96B] text-[#0A0B0D] shadow-xs"
                        : "text-[#8A8C94] hover:text-white"
                    }`}
                    title="Tampilan List (1 Undangan per Baris)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <span className="text-[10.5px]">List</span>
                  </button>
                </div>

                <button
                  onClick={async () => {
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
                    onClick={async () => {
                      if (confirm("Apakah Anda yakin ingin menghapus SEMUA daftar tamu dari database?")) {
                        setGuests([]);
                        try {
                          await fetch("/api/db", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "set",
                              type: "guests",
                              item: [],
                            }),
                          });
                        } catch (err) {
                          console.error("Failed to clear guests from cloud:", err);
                        }
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
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5"
                    : "space-y-3"
                }
              >
                {filteredGuests.map((g) => {
                  const isSent = g.isSentWa || g.status === "sent" || g.status === "sent_and_copied";
                  const isCopied = g.isCopied || g.status === "copied" || g.status === "sent_and_copied";

                  const cardTheme = g.checkedIn
                    ? "border-emerald-600/90 bg-[#0E2015] shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : isSent && isCopied
                    ? "border-emerald-700/80 bg-[#14231A] shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                    : isSent
                    ? "border-emerald-800/70 bg-[#16211C]"
                    : isCopied
                    ? "border-sky-900/80 bg-[#141B24]"
                    : "border-[#2D2E34] bg-[#202125]";

                  return (
                    <div
                      key={g.id}
                      className={`p-3.5 sm:p-4 border rounded-2xl flex flex-col justify-between gap-3 shadow-xs transition-all hover:border-[#C8A96B]/50 ${cardTheme}`}
                    >
                      <div className="space-y-2">
                        {/* Row 1: Name, Category, Created Time */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4
                                className="text-sm font-bold text-[#F1F0EC] font-serif tracking-wide truncate max-w-full"
                                title={g.name}
                              >
                                {g.name}
                              </h4>
                              <span className="text-[9px] bg-[#28292F] border border-[#35373E] text-[#E0C98F] px-2 py-0.5 rounded-full font-semibold shrink-0">
                                {g.category}
                              </span>
                              {g.code && g.code !== g.name && !g.code.startsWith("GUEST-") && (
                                <span className="text-[9px] bg-[#28292F] border border-[#35373E] text-[#A1A4B2] px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                                  {g.code}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] text-[#9E9D98] font-mono shrink-0">
                            {g.createdAt}
                          </span>
                        </div>

                        {/* Row 2: Status Badges (WA Sent & Link Copied) & Phone */}
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Status WA Badge (Interactive click-to-cycle) */}
                            <button
                              onClick={() => toggleGuestStatus(g.id)}
                              title="Klik untuk ubah status pengiriman"
                              className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
                                g.checkedIn
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                  : isSent
                                  ? "bg-emerald-900/90 text-emerald-200 border border-emerald-500 shadow-xs"
                                  : "bg-amber-950/90 text-amber-300 border border-amber-700 hover:bg-amber-900"
                              }`}
                            >
                              {g.checkedIn ? (
                                <span>✓ HADIR ({g.checkInTime || "Check-In"})</span>
                              ) : isSent ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>✓ Terkirim WA</span>
                                </>
                              ) : (
                                <>
                                  <span>⏳</span>
                                  <span>Belum Kirim</span>
                                </>
                              )}
                            </button>

                            {/* Link Copied Badge Indicator */}
                            {isCopied && (
                              <span
                                className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-sky-950/90 text-sky-300 border border-sky-600 flex items-center gap-1 shadow-xs"
                                title={`Link undangan telah disalin ${g.copiedAt ? `(${g.copiedAt})` : ""}`}
                              >
                                <span>📋</span>
                                <span>Link Disalin</span>
                              </span>
                            )}
                          </div>

                          {g.phone && (
                            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" />
                              </svg>
                              <span className="font-bold">+{formatPhoneNumber(g.phone)}</span>
                            </div>
                          )}
                        </div>

                        {/* Row 3: Link preview box */}
                        <div
                          className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-mono truncate border select-all cursor-pointer transition-colors ${
                            isCopied
                              ? "bg-[#161D26] text-sky-300 border-sky-800/80 hover:border-sky-500"
                              : "bg-[#1C1D21] text-[#E0C98F] border-[#2B2C32] hover:border-[#C8A96B]/50"
                          }`}
                          title="Klik untuk menyalin link"
                          onClick={() => handleCopy(g.name, g.id)}
                        >
                          {getGuestUrl(g.name)}
                        </div>

                        {/* QR Preview (if active) */}
                        {qrPreviewId === g.id && (
                          <div className="flex flex-col items-center gap-2 p-3 bg-white border border-[#35373E] rounded-2xl my-1 animate-fadeIn">
                            <QRCodeCanvas
                              data={g.name}
                              size={140}
                              className="rounded-lg"
                            />
                            <span className="text-[11px] font-bold text-[#18181B] bg-[#F4F4F6] px-3 py-1 rounded-lg border border-[#E4E4E7] text-center max-w-[240px] truncate">
                              {g.name}
                            </span>
                            <p className="text-[9.5px] text-[#71717A]">Scan saat check-in tamu</p>
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Actions */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#2B2C32]/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Direct 1-Click WhatsApp Button */}
                          <button
                            onClick={() => handleDirectWaWeb(g)}
                            className={`text-[10.5px] py-1.5 px-2.5 flex items-center gap-1 font-black rounded-xl cursor-pointer transition-all active:scale-95 shrink-0 ${
                              isSent
                                ? "bg-[#1E7E34] hover:bg-[#25D366] text-white border border-emerald-500 shadow-sm"
                                : "bg-[#25D366] hover:bg-[#20ba59] text-[#0A0B0D] shadow-xs"
                            }`}
                            title={isSent ? "Sudah pernah dikirim ke WA. Klik untuk kirim ulang." : "Kirim langsung via WhatsApp Web"}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.771.889 2.796.889 3.183 0 5.77-2.587 5.77-5.766.001-3.18-2.585-5.776-5.77-5.776zm0 10.455c-.93 0-1.745-.278-2.493-.728l-.178-.107-1.574.413.42-1.534-.117-.186c-.496-.789-.758-1.564-.757-2.547.001-2.584 2.102-4.686 4.689-4.686 2.586 0 4.688 2.102 4.688 4.687 0 2.585-2.102 4.688-4.689 4.688z" />
                            </svg>
                            <span>{isSent ? "✓ Terkirim" : "Kirim WA"}</span>
                          </button>

                          {/* Copy Message */}
                          <button
                            onClick={() => handleCopyFullMessage(g)}
                            className={`text-[10px] py-1.5 px-2 rounded-xl cursor-pointer transition-all shrink-0 border ${
                              copiedId === `msg-${g.id}`
                                ? "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold"
                                : isCopied
                                ? "bg-[#1E293B] text-sky-300 border-sky-700/80 hover:bg-[#27354A]"
                                : "bg-[#28292F] hover:bg-[#32343B] border-[#35373E] text-[#E5E3DF] hover:text-white"
                            }`}
                            title="Salin template pesan WhatsApp"
                          >
                            {copiedId === `msg-${g.id}` ? "✓ Tersalin!" : isCopied ? "✓ Pesan" : "Pesan"}
                          </button>

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopy(g.name, g.id)}
                            className={`text-[10px] py-1.5 px-2 rounded-xl cursor-pointer transition-all shrink-0 border ${
                              copiedId === g.id
                                ? "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold"
                                : isCopied
                                ? "bg-[#1E293B] text-sky-300 border-sky-700/80 hover:bg-[#27354A]"
                                : "bg-[#28292F] hover:bg-[#32343B] border-[#35373E] text-[#C5C4C0] hover:text-white"
                            }`}
                            title="Salin link undangan"
                          >
                            {copiedId === g.id ? "✓ Tersalin!" : isCopied ? "✓ Link" : "Link"}
                          </button>

                          {/* Toggle QR */}
                          <button
                            type="button"
                            onClick={() => setQrPreviewId(qrPreviewId === g.id ? null : g.id)}
                            className={`text-[10px] py-1.5 px-2 rounded-xl cursor-pointer font-bold transition-all shrink-0 flex items-center gap-1 ${
                              qrPreviewId === g.id
                                ? "bg-[#C8A96B] text-black font-black"
                                : "bg-[#28292F] hover:bg-[#32343B] text-[#E0C98F] border border-[#35373E]"
                            }`}
                            title="Tampilkan / Sembunyikan QR Code"
                          >
                            <span>QR</span>
                          </button>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="text-[#8A8C94] hover:text-rose-400 p-1.5 hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors shrink-0"
                          title="Hapus Tamu"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
      </div>
    );
  })()}
</div>
);
}
