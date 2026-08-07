"use client";

import { useState, useEffect } from "react";

export interface WishItem {
  id: string;
  name: string;
  message: string;
  attendance?: "Hadir" | "Ragu-ragu" | "Tidak Hadir";
  createdAt: string;
}

export function WishesManager() {
  const [wishes, setWishes] = useState<WishItem[]>([]);

  useEffect(() => {
    loadWishes();
  }, []);

  async function loadWishes() {
    try {
      const res = await fetch("/api/db?type=wishes");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setWishes(json.data);
      }
    } catch {
      // API failed
    }
  }

  async function saveWishes(updated: WishItem[]) {
    setWishes(updated);
  }

  async function handleDelete(id: string) {
    const itemToDelete = wishes.find((w) => w.id === id);
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          type: "wishes",
          item: itemToDelete,
        }),
      });
    } catch {
      // Fallback
    }

    const updated = wishes.filter((w) => w.id !== id);
    saveWishes(updated);
  }

  async function handleClearAll() {
    if (confirm("Apakah Anda yakin ingin menghapus semua ucapan tamu?")) {
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

      saveWishes([]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 border border-[#d4af37]/30 rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <h3
            className="text-base font-bold font-serif text-[#2a2723] flex items-center gap-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>Moderasi Ucapan Tamu Undangan ({wishes.length})</span>
          </h3>
          <p className="text-[11px] text-[#66615c]">
            Lihat dan kelola ucapan serta doa yang dikirimkan oleh para tamu undangan secara real-time dari semua device.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadWishes}
            className="text-[10px] py-1.5 px-3 bg-white border border-[#d4af37]/40 text-[#2a2723] hover:bg-[#f7ebbf]/40 rounded-lg cursor-pointer transition-all"
          >
            🔄 Sync Cloud
          </button>

          {wishes.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] py-1.5 px-3 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {wishes.length === 0 ? (
        <div className="bg-white border border-[#d4af37]/20 p-8 text-center text-xs text-[#66615c] rounded-xl">
          Belum ada ucapan yang masuk dari tamu undangan.
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((w) => (
            <div
              key={w.id}
              className="bg-white p-4 border border-[#d4af37]/30 rounded-xl shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#2a2723] font-serif text-sm">{w.name}</span>
                  {w.attendance && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        w.attendance === "Hadir"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-400"
                          : w.attendance === "Ragu-ragu"
                          ? "bg-amber-100 text-amber-700 border border-amber-400"
                          : "bg-rose-100 text-rose-700 border border-rose-400"
                      }`}
                    >
                      {w.attendance}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#999]">{w.createdAt}</span>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-[#999] hover:text-red-500 text-xs p-1 cursor-pointer transition-colors"
                    title="Hapus Ucapan"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#555] italic leading-relaxed bg-[#faf8f5] p-3 rounded-lg border border-[#d4af37]/20">
                &quot;{w.message}&quot;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
