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
      createdAt: new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB",
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
    link.setAttribute("download", `Data_RSVP_Pernikahan_Anam_Angi.csv`);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#202125] p-4 border border-[#2D2E34] text-center rounded-2xl shadow-xs">
          <p className="text-[10.5px] uppercase tracking-wider text-[#9E9D98] font-bold">Total Respon</p>
          <p className="text-2xl font-bold font-serif text-[#F1F0EC] mt-1">{totalResponses}</p>
        </div>

        <div className="bg-[#202125] p-4 border border-emerald-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10.5px] uppercase tracking-wider text-emerald-400 font-bold">Tamu Hadir (PAX)</p>
          <p className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            {attendingCount} <span className="text-xs font-semibold text-emerald-300">({totalPax} Orang)</span>
          </p>
        </div>

        <div className="bg-[#202125] p-4 border border-amber-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10.5px] uppercase tracking-wider text-amber-400 font-bold">Ragu-Ragu</p>
          <p className="text-2xl font-bold font-serif text-amber-400 mt-1">{uncertainCount}</p>
        </div>

        <div className="bg-[#202125] p-4 border border-rose-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10.5px] uppercase tracking-wider text-rose-400 font-bold">Tidak Hadir</p>
          <p className="text-2xl font-bold font-serif text-rose-400 mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Filter, Search & Actions Bar */}
      <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Cari nama tamu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] placeholder-[#71717A] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9E9D98" strokeWidth="2" className="absolute left-3 top-3">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <div className="flex gap-2.5 w-full md:w-auto flex-wrap">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 md:w-40 text-xs py-2.5 px-3 rounded-xl border border-[#35373E] bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Ragu-ragu">Ragu-ragu</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs py-2.5 px-4 font-bold whitespace-nowrap bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tambah RSVP</span>
            </button>

            <button
              onClick={exportCSV}
              className="text-xs py-2.5 px-3.5 font-bold whitespace-nowrap bg-[#28292F] border border-[#35373E] text-[#F1F0EC] hover:bg-[#32343B] rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* RSVP Table / List */}
      <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs uppercase tracking-[2px] font-bold text-[#E0C98F] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Daftar Konfirmasi Kehadiran ({filteredRSVPs.length})</span>
          </h4>
          <button
            onClick={loadRSVPs}
            className="text-[11px] text-[#E0C98F] hover:underline cursor-pointer font-bold flex items-center gap-1"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span>Sync Cloud</span>
          </button>
        </div>

        {filteredRSVPs.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#9E9D98] italic">
            Belum ada data konfirmasi RSVP.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRSVPs.map((r) => (
              <div
                key={r.id}
                className="p-3.5 border border-[#35373E] rounded-xl bg-[#28292F] flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F1F0EC] font-serif text-sm">{r.name}</span>
                    <span
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        r.attendance === "Hadir"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                          : r.attendance === "Ragu-ragu"
                          ? "bg-amber-950 text-amber-300 border border-amber-700"
                          : "bg-rose-950 text-rose-300 border border-rose-700"
                      }`}
                    >
                      {r.attendance}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#9E9D98] flex items-center gap-4">
                    {r.attendance === "Hadir" && (
                      <span>Jumlah: <strong className="text-[#E0C98F]">{r.guestCount} Orang (PAX)</strong></span>
                    )}
                    <span>Waktu: {r.createdAt}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-[#9E9D98] hover:text-rose-400 p-1.5 cursor-pointer transition-colors"
                  title="Hapus"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Add RSVP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="max-w-sm w-full p-6 border border-[#35373E] rounded-2xl space-y-4 bg-[#202125] text-[#F1F0EC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#35373E] pb-3">
              <h3 className="text-base font-bold font-serif text-[#F1F0EC]">Tambah RSVP Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#9E9D98] hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddManual} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase text-[#E0C98F] font-bold mb-1">Nama Tamu</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 border border-[#35373E] rounded-xl bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#E0C98F] font-bold mb-1">Status Kehadiran</label>
                <select
                  value={manualAttendance}
                  onChange={(e) => setManualAttendance(e.target.value as any)}
                  className="w-full text-xs py-2.5 px-3 border border-[#35373E] rounded-xl bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Ragu-ragu">Ragu-ragu</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                </select>
              </div>

              {manualAttendance === "Hadir" && (
                <div>
                  <label className="block text-[10px] uppercase text-[#E0C98F] font-bold mb-1">Jumlah Tamu (PAX)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={manualPax}
                    onChange={(e) => setManualPax(Number(e.target.value))}
                    className="w-full text-xs py-2.5 px-3 border border-[#35373E] rounded-xl bg-[#28292F] text-[#F1F0EC] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs flex-1 py-2.5 bg-[#28292F] border border-[#35373E] text-[#9E9D98] hover:bg-[#32343B] rounded-xl cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button type="submit" className="text-xs flex-1 py-2.5 font-bold bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl cursor-pointer transition-all">
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
