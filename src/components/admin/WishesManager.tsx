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
      <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3
            className="text-base font-bold font-serif text-[#F1F0EC] flex items-center gap-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E0C98F" strokeWidth="2">
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
            className="text-[11px] py-1.5 px-3 bg-[#28292F] border border-[#35373E] text-[#E0C98F] hover:bg-[#32343B] rounded-xl cursor-pointer transition-all flex items-center gap-1 font-bold"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {wishes.length === 0 ? (
        <div className="bg-[#202125] border border-[#2D2E34] p-8 text-center text-xs text-[#9E9D98] italic rounded-2xl">
          Belum ada ucapan yang masuk dari tamu undangan.
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((w) => (
            <div
              key={w.id}
              className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#F1F0EC] font-serif text-sm">{w.name}</span>
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
                  <span className="text-[10px] text-[#9E9D98]">{w.createdAt}</span>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-[#9E9D98] hover:text-rose-400 p-1 cursor-pointer transition-colors"
                    title="Hapus Ucapan"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#C5C4C0] italic leading-relaxed bg-[#28292F] p-3.5 rounded-xl border border-[#35373E]">
                &quot;{w.message}&quot;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
