"use client";

import { useState, useEffect } from "react";

export interface WishItem {
  id: string;
  name: string;
  message: string;
  relationship?: string;
  attendance?: "Hadir" | "Ragu-ragu" | "Tidak Hadir";
  createdAt: string;
}

export function WishesManager() {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 1. Initial Load from LocalStorage Cache
    try {
      const cached = localStorage.getItem("wedding_wishes_backup");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWishes(parsed);
        }
      }
    } catch {}

    // 2. Fetch from Cloud DB
    loadWishes();
    const interval = setInterval(loadWishes, 8000);
    return () => clearInterval(interval);
  }, []);

  async function loadWishes() {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/db?type=wishes&t=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setWishes(json.data);
        try {
          localStorage.setItem("wedding_wishes_backup", JSON.stringify(json.data));
        } catch {}
      }
    } catch {
      // API failed
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleDelete(id: string) {
    const updated = wishes.filter((w) => w.id !== id);
    setWishes(updated);
    try {
      localStorage.setItem("wedding_wishes_backup", JSON.stringify(updated));
    } catch {}

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          type: "wishes",
          item: { id },
        }),
      });
    } catch {
      // Fallback
    }
  }

  async function handleClearAll() {
    if (confirm("Apakah Anda yakin ingin menghapus semua ucapan tamu?")) {
      setWishes([]);
      try {
        localStorage.removeItem("wedding_wishes_backup");
      } catch {}

      try {
        await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "set",
            type: "wishes",
            item: [],
          }),
        });
      } catch {
        // Fallback
      }
    }
  }

  const filteredWishes = wishes.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.message.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3
            className="text-base font-bold font-serif text-[#F1F0EC] flex items-center gap-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E0C98F" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Moderasi Ucapan Tamu Undangan ({wishes.length})</span>
          </h3>
          <p className="text-[11px] text-[#9E9D98] mt-0.5">
            Lihat dan kelola ucapan serta doa yang dikirimkan oleh para tamu undangan secara real-time.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadWishes}
            disabled={isRefreshing}
            className="text-[11px] py-1.5 px-3 bg-[#28292F] border border-[#35373E] text-[#E0C98F] hover:bg-[#32343B] rounded-xl cursor-pointer transition-all flex items-center gap-1 font-bold disabled:opacity-50"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isRefreshing ? "animate-spin" : ""}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span>Sync Cloud</span>
          </button>

          {wishes.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[11px] py-1.5 px-3 bg-[#28292F] border border-rose-800/60 text-rose-400 hover:bg-rose-950/40 rounded-xl cursor-pointer transition-all font-bold"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      {wishes.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Cari pengirim ucapan atau isi doa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-[#2E313D] bg-[#1A1C22] text-[#F1F0EC] placeholder-[#636674] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none transition-all"
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#727585" strokeWidth="2" className="absolute left-3 top-3">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      )}

      {/* Wishes List */}
      {filteredWishes.length === 0 ? (
        <div className="bg-[#202125] border border-[#2D2E34] p-8 text-center text-xs text-[#9E9D98] italic rounded-2xl">
          {wishes.length === 0
            ? "Belum ada ucapan yang masuk dari tamu undangan. Ucapan yang dikirim di web akan muncul di sini secara real-time."
            : "Tidak ada ucapan yang cocok dengan pencarian Anda."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWishes.map((w) => (
            <div
              key={w.id}
              className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs space-y-2.5 hover:border-[#3A3D47] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-7 h-7 rounded-full bg-[#C8A96B]/20 border border-[#806A42] flex items-center justify-center text-[#E0C98F] text-xs font-bold font-serif">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-[#F1F0EC] font-serif text-sm">{w.name}</span>
                  {w.relationship && (
                    <span className="text-[9px] bg-[#141519] text-[#A1A4B2] border border-[#2E313D] px-2 py-0.5 rounded-md font-mono">
                      {w.relationship}
                    </span>
                  )}
                  {w.attendance && (
                    <span
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        w.attendance === "Hadir"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                          : w.attendance === "Ragu-ragu"
                          ? "bg-amber-950 text-amber-300 border border-amber-700"
                          : "bg-rose-950 text-rose-300 border border-rose-700"
                      }`}
                    >
                      {w.attendance}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#9E9D98] font-mono">{w.createdAt}</span>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-[#8A8C94] hover:text-rose-400 p-1.5 hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors"
                    title="Hapus Ucapan"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#E5E3DF] leading-relaxed bg-[#17181D] p-3.5 rounded-xl border border-[#282A33]">
                &quot;{w.message}&quot;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
