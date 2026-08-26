/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: DATABASE WEB UNDANGAN PERNIKAHAN
 * ==============================================================================
 * Skrip ini berfungsi sebagai REST API backend gratis menggunakan Google Sheets.
 * Menyimpan data: Tamu Undangan, RSVP Kehadiran, Ucapan & Doa, dan Bot Config.
 *
 * CARA PEMASANGAN:
 * 1. Buka Google Drive (drive.google.com) dan buat "Google Spreadsheet" baru.
 * 2. Beri nama file, misal: "Database Undangan Pernikahan".
 * 3. Di menu atas, klik "Extensions" (Ekstensi) > "Apps Script".
 * 4. Hapus semua kode default di editor, lalu PASTE SELURUH KODE INI.
 * 5. Klik tombol "Save" (ikon disket / Ctrl+S).
 * 6. Klik tombol "Deploy" (Terapkan) di kanan atas > pilih "New deployment" (Penerapan baru).
 * 7. Pada ikon Gerigi (Select type) > pilih "Web app".
 * 8. Isi formulir:
 *    - Description: "Web App Undangan"
 *    - Execute as: "Me" (Email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja)  <-- PENTING!
 * 9. Klik "Deploy", lalu klik "Authorize access" dan pilih akun Google Anda.
 *    (Jika muncul 'Google hasn't verified this app', klik 'Advanced' > 'Go to Untitled project (unsafe)').
 * 10. Salin "Web app URL" (akhiran /exec) dan masukkan ke file .env.local atau Vercel:
 *     GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/xxxxxx/exec
 * ==============================================================================
 */

// ID SPREADSHEET GOOGLE DRIVE ANDA
var SPREADSHEET_ID = "1rEuceSMYaarwmnG97U9DtaI2i197Dd4XsBV666H06mw";

function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getId()) return ss;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Fungsi manual untuk inisialisasi tabel pertama kali (Bisa diklik 'Run' / 'Jalankan' di Apps Script)
function initDatabase() {
  var ss = getSpreadsheet();
  getGuestsSheet(ss);
  getRsvpsSheet(ss);
  getWishesSheet(ss);
  getConfigSheet(ss);
  Logger.log("Database initialized successfully!");
}

// Menangani permintaan GET (Membaca Data)
function doGet(e) {
  try {
    var ss = getSpreadsheet();
    var type = (e && e.parameter && e.parameter.type) ? e.parameter.type : "all";

    // Auto initialize sheets if not present
    var data = {
      guests: getGuests(ss),
      rsvps: getRsvps(ss),
      wishes: getWishes(ss),
      config: getConfig(ss),
    };

    var response = {
      success: true,
      persistent: true,
      provider: "google_sheets",
      data: type === "all" ? data : (data[type] || []),
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Menangani permintaan POST (Menyimpan / Menulis Data)
function doPost(e) {
  try {
    var ss = getSpreadsheet();
    var contents = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(contents);

    var action = payload.action || "sync";
    var data = payload.data || payload;

    if (action === "sync" && data) {
      if (Array.isArray(data.guests)) saveGuests(ss, data.guests);
      if (Array.isArray(data.rsvps)) saveRsvps(ss, data.rsvps);
      if (Array.isArray(data.wishes)) saveWishes(ss, data.wishes);
      if (data.config) saveConfig(ss, data.config);
    } else if (action === "add" && payload.type && payload.item) {
      if (payload.type === "rsvps") appendRsvp(ss, payload.item);
      if (payload.type === "wishes") appendWish(ss, payload.item);
      if (payload.type === "guests") appendGuest(ss, payload.item);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Data berhasil disimpan ke Google Sheets",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// TAB: TAMU UNDANGAN (GUESTS)
// ==========================================
function getGuestsSheet(ss) {
  var sheet = ss.getSheetByName("Tamu Undangan");
  if (!sheet) {
    sheet = ss.insertSheet("Tamu Undangan");
    var headers = ["ID", "Kode Undangan", "Nama Tamu", "Nomor WhatsApp", "Kategori", "Template Pesan", "Status WA", "Status Check-In", "Jam Check-In", "Pax (Jumlah)", "Waktu Dibuat"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#D4AF37").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getGuests(ss) {
  var sheet = getGuestsSheet(ss);
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var guests = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[2]) continue;
    guests.push({
      id: String(r[0] || ""),
      code: String(r[1] || ""),
      name: String(r[2] || ""),
      phone: String(r[3] || ""),
      category: String(r[4] || "Tamu VIP"),
      template: String(r[5] || "Formal"),
      status: String(r[6] || "pending"),
      checkedIn: r[7] === "Hadir" || r[7] === true || r[7] === "true",
      checkInTime: String(r[8] || ""),
      pax: Number(r[9]) || 1,
      createdAt: String(r[10] || ""),
    });
  }
  return guests;
}

function saveGuests(ss, guests) {
  var sheet = getGuestsSheet(ss);
  sheet.clearContents();
  var headers = ["ID", "Kode Undangan", "Nama Tamu", "Nomor WhatsApp", "Kategori", "Template Pesan", "Status WA", "Status Check-In", "Jam Check-In", "Pax (Jumlah)", "Waktu Dibuat"];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#D4AF37").setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);

  if (guests.length > 0) {
    var rows = guests.map(function(g) {
      return [
        String(g.id || ""),
        String(g.code || ""),
        String(g.name || ""),
        String(g.phone || ""),
        String(g.category || "Tamu VIP"),
        String(g.template || "Formal"),
        String(g.status || "pending"),
        g.checkedIn ? "Hadir" : "Belum",
        String(g.checkInTime || ""),
        Number(g.pax) || 1,
        String(g.createdAt || new Date().toLocaleString("id-ID")),
      ];
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function appendGuest(ss, g) {
  var sheet = getGuestsSheet(ss);
  sheet.appendRow([
    String(g.id || Date.now()),
    String(g.code || ""),
    String(g.name || ""),
    String(g.phone || ""),
    String(g.category || "Tamu VIP"),
    String(g.template || "Formal"),
    String(g.status || "pending"),
    g.checkedIn ? "Hadir" : "Belum",
    String(g.checkInTime || ""),
    Number(g.pax) || 1,
    String(g.createdAt || new Date().toLocaleString("id-ID")),
  ]);
}

// ==========================================
// TAB: RSVP KEHADIRAN (RSVPS)
// ==========================================
function getRsvpsSheet(ss) {
  var sheet = ss.getSheetByName("RSVP Kehadiran");
  if (!sheet) {
    sheet = ss.insertSheet("RSVP Kehadiran");
    var headers = ["ID", "Nama Tamu", "Konfirmasi Kehadiran", "Jumlah Tamu (Pax)", "Sesi Acara", "Catatan / Pesan", "Status Check-In", "Waktu RSVP"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#2E7D32").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getRsvps(ss) {
  var sheet = getRsvpsSheet(ss);
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var rsvps = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[1]) continue;
    rsvps.push({
      id: String(r[0] || ""),
      name: String(r[1] || ""),
      attendance: String(r[2] || "Hadir"),
      status: String(r[2] || "Hadir"),
      guestCount: Number(r[3]) || 1,
      pax: Number(r[3]) || 1,
      session: String(r[4] || "Sesi 1"),
      notes: String(r[5] || ""),
      checkedIn: r[6] === "Hadir" || r[6] === true || r[6] === "true",
      createdAt: String(r[7] || ""),
    });
  }
  return rsvps;
}

function saveRsvps(ss, rsvps) {
  var sheet = getRsvpsSheet(ss);
  sheet.clearContents();
  var headers = ["ID", "Nama Tamu", "Konfirmasi Kehadiran", "Jumlah Tamu (Pax)", "Sesi Acara", "Catatan / Pesan", "Status Check-In", "Waktu RSVP"];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#2E7D32").setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);

  if (rsvps.length > 0) {
    var rows = rsvps.map(function(r) {
      return [
        String(r.id || ""),
        String(r.name || ""),
        String(r.attendance || r.status || "Hadir"),
        Number(r.guestCount || r.pax) || 1,
        String(r.session || "Sesi 1"),
        String(r.notes || ""),
        r.checkedIn ? "Hadir" : "Belum",
        String(r.createdAt || new Date().toLocaleString("id-ID")),
      ];
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function appendRsvp(ss, r) {
  var sheet = getRsvpsSheet(ss);
  sheet.appendRow([
    String(r.id || Date.now()),
    String(r.name || ""),
    String(r.attendance || r.status || "Hadir"),
    Number(r.guestCount || r.pax) || 1,
    String(r.session || "Sesi 1"),
    String(r.notes || ""),
    r.checkedIn ? "Hadir" : "Belum",
    String(r.createdAt || new Date().toLocaleString("id-ID")),
  ]);
}

// ==========================================
// TAB: UCAPAN & DOA (WISHES)
// ==========================================
function getWishesSheet(ss) {
  var sheet = ss.getSheetByName("Ucapan & Doa");
  if (!sheet) {
    sheet = ss.insertSheet("Ucapan & Doa");
    var headers = ["ID", "Nama Pengirim", "Pesan Ucapan / Doa", "Hubungan / Relasi", "Disetujui", "Waktu Pengiriman"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1565C0").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getWishes(ss) {
  var sheet = getWishesSheet(ss);
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var wishes = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[1]) continue;
    wishes.push({
      id: String(r[0] || ""),
      name: String(r[1] || ""),
      message: String(r[2] || ""),
      relationship: String(r[3] || "Kerabat"),
      is_approved: r[4] !== false && r[4] !== "false",
      createdAt: String(r[5] || ""),
    });
  }
  return wishes;
}

function saveWishes(ss, wishes) {
  var sheet = getWishesSheet(ss);
  sheet.clearContents();
  var headers = ["ID", "Nama Pengirim", "Pesan Ucapan / Doa", "Hubungan / Relasi", "Disetujui", "Waktu Pengiriman"];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1565C0").setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);

  if (wishes.length > 0) {
    var rows = wishes.map(function(w) {
      return [
        String(w.id || ""),
        String(w.name || ""),
        String(w.message || ""),
        String(w.relationship || "Kerabat"),
        w.is_approved !== false ? "Ya" : "Tidak",
        String(w.createdAt || new Date().toLocaleString("id-ID")),
      ];
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function appendWish(ss, w) {
  var sheet = getWishesSheet(ss);
  sheet.appendRow([
    String(w.id || Date.now()),
    String(w.name || ""),
    String(w.message || ""),
    String(w.relationship || "Kerabat"),
    w.is_approved !== false ? "Ya" : "Tidak",
    String(w.createdAt || new Date().toLocaleString("id-ID")),
  ]);
}

// ==========================================
// TAB: PENGATURAN (CONFIG)
// ==========================================
function getConfigSheet(ss) {
  var sheet = ss.getSheetByName("Pengaturan");
  if (!sheet) {
    sheet = ss.insertSheet("Pengaturan");
    var headers = ["Key", "JSON Value"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#424242").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getConfig(ss) {
  var sheet = getConfigSheet(ss);
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { provider: "fonnte", waToken: "", customServerUrl: "" };

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === "bot_config" && rows[i][1]) {
      try {
        return JSON.parse(rows[i][1]);
      } catch(e) {}
    }
  }
  return { provider: "fonnte", waToken: "", customServerUrl: "" };
}

function saveConfig(ss, config) {
  var sheet = getConfigSheet(ss);
  sheet.clearContents();
  sheet.appendRow(["Key", "JSON Value"]);
  sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#424242").setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);
  sheet.appendRow(["bot_config", JSON.stringify(config)]);
}
