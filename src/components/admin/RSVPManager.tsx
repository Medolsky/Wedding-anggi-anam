"use client";

import { useState, useEffect } from "react";

export interface RSVPItem {
  id: string;
  name: string;
  attendance: "Hadir" | "Ragu-ragu" | "Tidak Hadir";
  guestCount: number;
  session: string;
  wishes?: string;
  createdAt: string;
}

export function RSVPManager() {
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for manual RSVP entry
  const [manualName, setManualName] = useState("");
  const [manualAttendance, setManualAttendance] = useState<"Hadir" | "Ragu-ragu" | "Tidak Hadir">("Hadir");
  const [manualPax, setManualPax] = useState(2);
  const [manualSession, setManualSession] = useState("Akad & Resepsi");

  useEffect(() => {
    loadRSVPs();
  }, []);

  async function loadRSVPs() {
    try {
      const res = await fetch("/api/db?type=rsvps");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map((item: any) => ({
          id: item.id || Date.now().toString(),
          name: item.name,
          attendance: item.status === "Hadir" ? "Hadir" : "Tidak Hadir",
          guestCount: item.pax || 1,
          session: item.notes || "Akad & Resepsi",
          createdAt: item.createdAt || "Baru saja",
        }));
        setRsvps(formatted);
      }
    } catch {
      // API failed
    }
  }

  async function saveRSVPs(updated: RSVPItem[]) {
    setRsvps(updated);
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newItem: RSVPItem = {
      id: Date.now().toString(),
      name: manualName.trim(),
      attendance: manualAttendance,
      guestCount: manualAttendance === "Hadir" ? Number(manualPax) : 0,
      session: manualSession,
      createdAt: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          type: "rsvps",
          item: {
            id: newItem.id,
            name: newItem.name,
            pax: newItem.guestCount,
            status: newItem.attendance,
            notes: newItem.session,
            createdAt: newItem.createdAt,
          },
        }),
      });
    } catch {
      // Fallback
    }

    const updated = [newItem, ...rsvps];
    saveRSVPs(updated);
    setShowAddModal(false);
    setManualName("");
  }

  async function handleDelete(id: string) {
    const itemToDelete = rsvps.find((r) => r.id === id);
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          type: "rsvps",
          item: itemToDelete,
        }),
      });
    } catch {
      // Fallback
    }

    const updated = rsvps.filter((r) => r.id !== id);
    saveRSVPs(updated);
  }

  function exportCSV() {
    if (rsvps.length === 0) {
      alert("Belum ada data RSVP untuk di-export");
      return;
    }

    const headers = ["Nama", "Status Kehadiran", "Jumlah Orang (PAX)", "Sesi Acara", "Waktu Konfirmasi"];
    const rows = rsvps.map((r) => [
      `"${r.name}"`,
      `"${r.attendance}"`,
      r.guestCount,
      `"${r.session}"`,
      `"${r.createdAt}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_RSVP_Pernikahan_Angi_Anam.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Summary Metrics
  const totalResponses = rsvps.length;
  const attendingCount = rsvps.filter((r) => r.attendance === "Hadir").length;
  const totalPax = rsvps
    .filter((r) => r.attendance === "Hadir")
    .reduce((sum, r) => sum + (r.guestCount || 1), 0);
  const uncertainCount = rsvps.filter((r) => r.attendance === "Ragu-ragu").length;
  const absentCount = rsvps.filter((r) => r.attendance === "Tidak Hadir").length;

  // Filtered List
  const filteredRSVPs = rsvps.filter((r) => {
    const matchesFilter = filter === "all" || r.attendance === filter;
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 border border-[#d4af37]/40 text-center rounded-xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-[#66615c] font-semibold">Total Respon</p>
          <p className="text-2xl font-bold font-serif text-[#2a2723]">{totalResponses}</p>
        </div>

        <div className="bg-emerald-50 p-3.5 border border-emerald-400/50 text-center rounded-xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">Tamu Hadir (PAX)</p>
          <p className="text-2xl font-bold font-serif text-emerald-700">
            {attendingCount} <span className="text-xs font-normal text-emerald-600">({totalPax} Orang)</span>
          </p>
        </div>

        <div className="bg-amber-50 p-3.5 border border-amber-400/50 text-center rounded-xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">Ragu-Ragu</p>
          <p className="text-2xl font-bold font-serif text-amber-700">{uncertainCount}</p>
        </div>

        <div className="bg-rose-50 p-3.5 border border-rose-400/50 text-center rounded-xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">Tidak Hadir</p>
          <p className="text-2xl font-bold font-serif text-rose-700">{absentCount}</p>
        </div>
      </div>

      {/* Filter, Search & Actions Bar */}
      <div className="bg-white p-4 border border-[#d4af37]/30 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <input
            type="text"
            placeholder="🔍 Cari nama tamu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 text-xs py-2 px-3 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 md:w-36 text-xs py-2 px-3 rounded-xl border border-[#d4af37]/40 bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Ragu-ragu">Ragu-ragu</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs py-2 px-3 font-bold whitespace-nowrap bg-[#d4af37] text-white hover:bg-[#b8860b] rounded-xl cursor-pointer transition-all"
            >
              + Tambah RSVP
            </button>

            <button
              onClick={exportCSV}
              className="text-xs py-2 px-3 font-semibold whitespace-nowrap bg-white border border-[#d4af37]/40 text-[#2a2723] hover:bg-[#f7ebbf]/40 rounded-xl cursor-pointer transition-all"
            >
              📥 CSV
            </button>
          </div>
        </div>
      </div>

      {/* RSVP Table / List */}
      <div className="bg-white p-4 border border-[#d4af37]/30 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs uppercase tracking-[2px] font-bold text-[#b8860b]">
            Daftar Konfirmasi Kehadiran ({filteredRSVPs.length})
          </h4>
          <button
            onClick={loadRSVPs}
            className="text-[10px] text-[#8a662d] hover:underline cursor-pointer font-bold"
          >
            🔄 Sync Cloud
          </button>
        </div>

        {filteredRSVPs.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#66615c]">
            Belum ada data konfirmasi RSVP.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRSVPs.map((r) => (
              <div
                key={r.id}
                className="p-3 border border-[#d4af37]/20 rounded-xl bg-[#faf8f5] flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2a2723] font-serif">{r.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        r.attendance === "Hadir"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-400"
                          : r.attendance === "Ragu-ragu"
                          ? "bg-amber-100 text-amber-700 border border-amber-400"
                          : "bg-rose-100 text-rose-700 border border-rose-400"
                      }`}
                    >
                      {r.attendance}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#66615c] flex gap-3">
                    {r.attendance === "Hadir" && (
                      <span>👥 Jumlah: <strong className="text-[#b8860b]">{r.guestCount} Orang</strong></span>
                    )}
                    <span>🕒 {r.createdAt}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-[#999] hover:text-red-500 text-sm p-1 cursor-pointer transition-colors"
                  title="Hapus"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Add RSVP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="max-w-sm w-full p-5 border border-[#d4af37]/50 rounded-2xl space-y-4 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
              <h3 className="text-base font-bold font-serif text-[#2a2723]">Tambah RSVP Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#999] hover:text-[#2a2723] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddManual} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase text-[#b8860b] font-semibold mb-1">Nama Tamu</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#d4af37]/40 rounded-xl bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#b8860b] font-semibold mb-1">Status Kehadiran</label>
                <select
                  value={manualAttendance}
                  onChange={(e) => setManualAttendance(e.target.value as any)}
                  className="w-full text-xs py-2 px-3 border border-[#d4af37]/40 rounded-xl bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Ragu-ragu">Ragu-ragu</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                </select>
              </div>

              {manualAttendance === "Hadir" && (
                <div>
                  <label className="block text-[10px] uppercase text-[#b8860b] font-semibold mb-1">Jumlah Tamu (PAX)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={manualPax}
                    onChange={(e) => setManualPax(Number(e.target.value))}
                    className="w-full text-xs py-2 px-3 border border-[#d4af37]/40 rounded-xl bg-[#faf8f5] text-[#2a2723] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs flex-1 py-2 bg-white border border-[#d4af37]/40 text-[#66615c] hover:bg-[#faf8f5] rounded-xl cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button type="submit" className="text-xs flex-1 py-2 font-bold bg-[#d4af37] text-white hover:bg-[#b8860b] rounded-xl cursor-pointer transition-all">
                  Simpan RSVP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
