"use client";

import { useState, useEffect } from "react";

export interface WishItem {
  id: string;
  name: string;
  message: string;
  attendance: "Hadir" | "Ragu-ragu" | "Tidak Hadir";
  createdAt: string;
}

export function WishesManager() {
  const [wishes, setWishes] = useState<WishItem[]>([]);

  useEffect(() => {
    loadWishes();
  }, []);

  function loadWishes() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wevitation_wishes");
      if (saved) {
        try {
          setWishes(JSON.parse(saved));
        } catch {
          setWishes([]);
        }
      }
    }
  }

  function saveWishes(updated: WishItem[]) {
    setWishes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("wevitation_wishes", JSON.stringify(updated));
    }
  }

  function handleDelete(id: string) {
    const updated = wishes.filter((w) => w.id !== id);
    saveWishes(updated);
  }

  function handleClearAll() {
    if (confirm("Apakah Anda yakin ingin menghapus semua ucapan tamu?")) {
      saveWishes([]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="gold-card-pro p-4 border border-[#d4af37]/30 rounded-xl flex items-center justify-between">
        <div>
          <h3
            className="text-base font-bold font-serif text-[#f3e5ab]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            💌 Moderasi Ucapan Tamu Undangan ({wishes.length})
          </h3>
          <p className="text-[11px] text-white/60">
            Lihat dan kelola ucapan serta doa yang dikirimkan oleh para tamu undangan.
          </p>
        </div>

        {wishes.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn-modern-secondary text-[10px] py-1.5 px-3 text-rose-300 border-rose-500/40"
          >
            Hapus Semua
          </button>
        )}
      </div>

      {wishes.length === 0 ? (
        <div className="gold-card-pro p-8 text-center text-xs text-white/50 rounded-xl">
          Belum ada ucapan yang masuk dari tamu undangan.
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((w) => (
            <div
              key={w.id}
              className="gold-card-pro p-4 border border-[#d4af37]/30 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-serif text-sm">{w.name}</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      w.attendance === "Hadir"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                        : w.attendance === "Ragu-ragu"
                        ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                        : "bg-rose-950 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {w.attendance}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40">{w.createdAt}</span>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-white/30 hover:text-red-400 text-xs p-1 cursor-pointer"
                    title="Hapus Ucapan"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-xs text-white/85 italic leading-relaxed bg-[#120605] p-3 rounded-lg border border-white/5">
                "{w.message}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
