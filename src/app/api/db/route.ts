import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

import fs from "fs";
import path from "path";
import initialGuests from "@/data/initialGuests.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Universal Cloud Database API Route for Wedding Invitation App
 * Supports: Vercel Postgres / Neon, Google Sheets (Apps Script), Supabase SQL, and JSONBin.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

const sql = POSTGRES_URL ? neon(POSTGRES_URL) : null;
let isPostgresInitialized = false;

const supabase =
  SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-supabase-project")
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// Global cloud memory store for instant real-time sync across multi-devices
let cloudStore: {
  guests: any[];
  rsvps: any[];
  wishes: any[];
  config: any;
} = (globalThis as any).__weddingStore || {
  guests: initialGuests || [],
  config: {
    customServerUrl: "",
    provider: "fonnte",
    waToken: "",
  },
  rsvps: [],
  wishes: [],
};
if (!cloudStore.guests || cloudStore.guests.length === 0) {
  cloudStore.guests = (initialGuests as any[]) || [];
}
(globalThis as any).__weddingStore = cloudStore;

// Optional external free Cloud Database Integration (Google Sheets / JSONBin.io / Supabase / KV)
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

async function initPostgresTables() {
  if (!sql || isPostgresInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT NOT NULL,
        phone TEXT,
        category TEXT DEFAULT 'Tamu VIP',
        template TEXT DEFAULT 'Formal',
        status TEXT DEFAULT 'pending',
        checked_in BOOLEAN DEFAULT FALSE,
        check_in_time TEXT,
        pax INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS rsvps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'Hadir',
        pax INTEGER DEFAULT 1,
        session TEXT DEFAULT 'Sesi 1',
        notes TEXT,
        checked_in BOOLEAN DEFAULT FALSE,
        check_in_time TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS wishes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        relationship TEXT DEFAULT 'Kerabat',
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `;
    isPostgresInitialized = true;
  } catch (err) {
    console.error("Postgres auto-init table error:", err);
  }
}

async function fetchFromExternalCloud() {
  // 1. Try Vercel Postgres / Neon if configured
  if (sql) {
    try {
      await initPostgresTables();
      const [guests, rsvps, wishes, configRows] = await Promise.all([
        sql`SELECT * FROM guests ORDER BY created_at DESC`,
        sql`SELECT * FROM rsvps ORDER BY created_at DESC`,
        sql`SELECT * FROM wishes ORDER BY created_at DESC`,
        sql`SELECT * FROM config WHERE key = 'bot_config' LIMIT 1`,
      ]);

      if (Array.isArray(guests)) {
        cloudStore.guests = guests.map((g: any) => ({
          ...g,
          checkedIn: g.checked_in,
          checkInTime: g.check_in_time,
        }));
      }
      if (Array.isArray(rsvps)) {
        cloudStore.rsvps = rsvps.map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone || "",
          guestCount: r.pax || 1,
          pax: r.pax || 1,
          status: r.status || "Hadir",
          attendance: r.status || "Hadir",
          session: r.notes || "Akad & Resepsi",
          notes: r.notes || "",
          checkedIn: r.checked_in,
          checkInTime: r.check_in_time,
          createdAt: r.created_at
            ? new Date(r.created_at).toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }) + " WIB"
            : r.createdAt || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
        }));
      }
      if (Array.isArray(wishes)) {
        cloudStore.wishes = wishes.map((w: any) => ({
          id: w.id,
          name: w.name,
          message: w.message,
          relationship: w.relationship || "Kerabat",
          is_approved: w.is_approved !== false,
          createdAt: w.created_at
            ? new Date(w.created_at).toISOString()
            : w.createdAt || new Date().toISOString(),
          created_at: w.created_at || w.createdAt || new Date().toISOString(),
        }));
      }
      if (Array.isArray(configRows) && configRows.length > 0 && configRows[0].value) {
        cloudStore.config = configRows[0].value;
      }

      return cloudStore;
    } catch (err) {
      console.error("Vercel Postgres fetch exception:", err);
    }
  }

  // 2. Try Google Apps Script (Google Sheets / Google Drive) if configured
  if (GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?type=all&t=${Date.now()}`, {
        redirect: "follow",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (Array.isArray(json.data.guests)) cloudStore.guests = json.data.guests;
          if (Array.isArray(json.data.rsvps)) cloudStore.rsvps = json.data.rsvps;
          if (Array.isArray(json.data.wishes)) {
            cloudStore.wishes = json.data.wishes.map((w: any) => ({
              ...w,
              createdAt: w.createdAt || w.created_at || new Date().toISOString(),
              created_at: w.created_at || w.createdAt || new Date().toISOString(),
            }));
          }
          if (json.data.config) cloudStore.config = json.data.config;
          return cloudStore;
        }
      }
    } catch (err) {
      console.error("Google Script fetch exception:", err);
    }
  }

  // 3. Try Supabase Cloud SQL if configured
  if (supabase) {
    try {
      const [guestsRes, rsvpsRes, wishesRes, configRes] = await Promise.all([
        supabase.from("guests").select("*").order("created_at", { ascending: false }),
        supabase.from("rsvps").select("*").order("created_at", { ascending: false }),
        supabase.from("wishes").select("*").order("created_at", { ascending: false }),
        supabase.from("config").select("*").eq("key", "bot_config").maybeSingle(),
      ]);

      if (guestsRes.error) console.error("Supabase Guests Error:", guestsRes.error);
      if (rsvpsRes.error) console.error("Supabase RSVPs Error:", rsvpsRes.error);
      if (wishesRes.error) console.error("Supabase Wishes Error:", wishesRes.error);

      if (!guestsRes.error && Array.isArray(guestsRes.data)) {
        cloudStore.guests = guestsRes.data.map((g) => ({
          ...g,
          checkedIn: g.checked_in,
          checkInTime: g.check_in_time,
        }));
      }
      if (!rsvpsRes.error && Array.isArray(rsvpsRes.data)) {
        cloudStore.rsvps = rsvpsRes.data.map((r) => ({
          ...r,
          checkedIn: r.checked_in,
          checkInTime: r.check_in_time,
          guestCount: r.pax || 1,
          attendance: r.status || "Hadir",
        }));
      }
      if (!wishesRes.error && Array.isArray(wishesRes.data)) {
        cloudStore.wishes = wishesRes.data.map((w: any) => ({
          ...w,
          createdAt: w.created_at || w.createdAt || new Date().toISOString(),
          created_at: w.created_at || w.createdAt || new Date().toISOString(),
        }));
      }
      if (!configRes.error && configRes.data?.value) {
        cloudStore.config = configRes.data.value;
      }

      return cloudStore;
    } catch (err) {
      console.error("Supabase fetch exception:", err);
    }
  }

  // 4. Fallback to JSONBin if configured
  if (JSONBIN_BIN_ID && JSONBIN_API_KEY) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: { "X-Master-Key": JSONBIN_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          cloudStore = { ...cloudStore, ...data.record };
        }
      }
    } catch {
      // Fallback
    }
  }

  return cloudStore;
}

async function saveToExternalCloud(updatedStore: any) {
  cloudStore = updatedStore;

  // Persist to local JSON file
  try {
    const filePath = path.join(process.cwd(), "src/data/initialGuests.json");
    if (updatedStore.guests && Array.isArray(updatedStore.guests)) {
      fs.writeFileSync(filePath, JSON.stringify(updatedStore.guests, null, 2));
    }
  } catch {}

  // 1. Save to Vercel Postgres / Neon if configured
  if (sql) {
    try {
      await initPostgresTables();

      if (updatedStore.guests) {
        const guestIds = updatedStore.guests.map((g: any) => String(g.id || "")).filter(Boolean);
        if (guestIds.length > 0) {
          for (const g of updatedStore.guests) {
            await sql`
              INSERT INTO guests (id, code, name, phone, category, template, status, checked_in, check_in_time, pax)
              VALUES (${g.id || Date.now().toString()}, ${g.code || g.name || g.id}, ${g.name}, ${g.phone || null}, ${g.category || "Tamu VIP"}, ${g.template || "Formal"}, ${g.status || "pending"}, ${!!g.checkedIn}, ${g.checkInTime || null}, ${g.pax || 1})
              ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                category = EXCLUDED.category,
                template = EXCLUDED.template,
                status = EXCLUDED.status,
                checked_in = EXCLUDED.checked_in,
                check_in_time = EXCLUDED.check_in_time,
                pax = EXCLUDED.pax;
            `;
          }
          // Remove orphan guests that were deleted
          try {
            const allPg = await sql`SELECT id FROM guests`;
            if (Array.isArray(allPg)) {
              const activeSet = new Set(guestIds);
              const orphans = allPg.map((r: any) => String(r.id)).filter((id: string) => !activeSet.has(id));
              for (const oId of orphans) {
                await sql`DELETE FROM guests WHERE id = ${oId}`;
              }
            }
          } catch {}
        } else {
          await sql`TRUNCATE TABLE guests`;
        }
      }

      if (updatedStore.rsvps) {
        const rsvpIds = updatedStore.rsvps.map((r: any) => String(r.id || "")).filter(Boolean);
        if (rsvpIds.length > 0) {
          for (const r of updatedStore.rsvps) {
            await sql`
              INSERT INTO rsvps (id, name, status, pax, notes, checked_in, check_in_time)
              VALUES (${r.id || Date.now().toString()}, ${r.name}, ${r.status || r.attendance || "Hadir"}, ${r.pax || r.guestCount || 1}, ${r.notes || ""}, ${!!r.checkedIn}, ${r.checkInTime || null})
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                status = EXCLUDED.status,
                pax = EXCLUDED.pax,
                notes = EXCLUDED.notes,
                checked_in = EXCLUDED.checked_in,
                check_in_time = EXCLUDED.check_in_time;
            `;
          }
        } else {
          await sql`TRUNCATE TABLE rsvps`;
        }
      }

      if (updatedStore.wishes) {
        const wishIds = updatedStore.wishes.map((w: any) => String(w.id || "")).filter(Boolean);
        if (wishIds.length > 0) {
          for (const w of updatedStore.wishes) {
            await sql`
              INSERT INTO wishes (id, name, message, relationship, is_approved)
              VALUES (${w.id || Date.now().toString()}, ${w.name}, ${w.message || ""}, ${w.relationship || "Kerabat"}, ${w.is_approved !== false})
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                message = EXCLUDED.message,
                relationship = EXCLUDED.relationship,
                is_approved = EXCLUDED.is_approved;
            `;
          }
        } else {
          await sql`TRUNCATE TABLE wishes`;
        }
      }

      if (updatedStore.config) {
        await sql`
          INSERT INTO config (key, value)
          VALUES ('bot_config', ${JSON.stringify(updatedStore.config)})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        `;
      }
    } catch (err) {
      console.error("Vercel Postgres save exception:", err);
    }
  }

  // 2. Save to Google Apps Script (Google Sheets / Google Drive) if configured
  if (GOOGLE_SCRIPT_URL) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", data: updatedStore }),
        redirect: "follow",
      });
    } catch (err) {
      console.error("Google Script save exception:", err);
    }
  }

  // 3. Save to Supabase Cloud SQL if configured
  if (supabase) {
    try {
      if (updatedStore.guests) {
        if (updatedStore.guests.length === 0) {
          await supabase.from("guests").delete().neq("id", "___dummy___");
        } else {
          const sqlGuests = updatedStore.guests.map((g: any) => ({
            id: String(g.id || Date.now()),
            code: g.code || g.name || g.id,
            name: g.name,
            phone: g.phone || null,
            category: g.category || "Tamu VIP",
            template: g.template || "Standar",
            status: g.status || "pending",
            checked_in: !!g.checkedIn,
            check_in_time: g.checkInTime || null,
            pax: g.pax || 1,
          }));
          const { error: guestErr } = await supabase.from("guests").upsert(sqlGuests);
          if (guestErr) console.error("Supabase Save Guests Error:", guestErr);

          // Synchronize/delete orphan guests in Supabase that are no longer in updatedStore.guests
          try {
            const { data: existingRows } = await supabase.from("guests").select("id");
            if (Array.isArray(existingRows)) {
              const activeIdSet = new Set(sqlGuests.map((g: any) => String(g.id)));
              const orphanIds = existingRows.map((r: any) => String(r.id)).filter((id: string) => !activeIdSet.has(id));
              for (const orphanId of orphanIds) {
                await supabase.from("guests").delete().eq("id", orphanId);
              }
            }
          } catch (delErr) {
            console.error("Supabase orphan guests deletion error:", delErr);
          }
        }
      }

      if (updatedStore.rsvps) {
        const sqlRsvps = updatedStore.rsvps.map((r: any) => ({
          id: r.id || Date.now().toString(),
          name: r.name,
          status: r.status || "Hadir",
          pax: r.pax || 1,
          notes: r.notes || "",
          checked_in: !!r.checkedIn,
          check_in_time: r.checkInTime || null,
        }));
        await supabase.from("rsvps").upsert(sqlRsvps);
      }

      if (updatedStore.wishes) {
        const sqlWishes = updatedStore.wishes.map((w: any) => ({
          id: w.id || Date.now().toString(),
          name: w.name,
          message: w.message || "",
          relationship: w.relationship || "Kerabat",
          is_approved: w.is_approved !== false,
        }));
        await supabase.from("wishes").upsert(sqlWishes);
      }

      if (updatedStore.config) {
        await supabase.from("config").upsert({
          key: "bot_config",
          value: updatedStore.config,
        });
      }
    } catch {
      // Fallback below
    }
  }

  // 4. Save to JSONBin if configured
  if (JSONBIN_BIN_ID && JSONBIN_API_KEY) {
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": JSONBIN_API_KEY,
        },
        body: JSON.stringify(cloudStore),
      });
    } catch {
      // Fallback
    }
  }
}

async function saveSingleCheckInToCloud(matchedGuest: any, matchedRsvp: any, updatedStore: any) {
  cloudStore = updatedStore;
  (globalThis as any).__weddingStore = updatedStore;

  try {
    const filePath = path.join(process.cwd(), "src/data/initialGuests.json");
    fs.writeFileSync(filePath, JSON.stringify(updatedStore.guests, null, 2));
  } catch {}

  // 1. Save targeted single guest & rsvp to Vercel Postgres / Neon
  if (sql) {
    try {
      await initPostgresTables();
      if (matchedGuest) {
        await sql`
          INSERT INTO guests (id, code, name, phone, category, template, status, checked_in, check_in_time, pax)
          VALUES (${matchedGuest.id || Date.now().toString()}, ${matchedGuest.code || matchedGuest.name || matchedGuest.id}, ${matchedGuest.name}, ${matchedGuest.phone || null}, ${matchedGuest.category || "Tamu VIP"}, ${matchedGuest.template || "Formal"}, ${matchedGuest.status || "pending"}, ${!!matchedGuest.checkedIn}, ${matchedGuest.checkInTime || null}, ${matchedGuest.pax || 1})
          ON CONFLICT (id) DO UPDATE SET
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            category = EXCLUDED.category,
            template = EXCLUDED.template,
            status = EXCLUDED.status,
            checked_in = EXCLUDED.checked_in,
            check_in_time = EXCLUDED.check_in_time,
            pax = EXCLUDED.pax;
        `;
      }
      if (matchedRsvp) {
        await sql`
          INSERT INTO rsvps (id, name, status, pax, notes, checked_in, check_in_time)
          VALUES (${matchedRsvp.id || Date.now().toString()}, ${matchedRsvp.name}, ${matchedRsvp.status || matchedRsvp.attendance || "Hadir"}, ${matchedRsvp.pax || matchedRsvp.guestCount || 1}, ${matchedRsvp.notes || ""}, ${!!matchedRsvp.checkedIn}, ${matchedRsvp.checkInTime || null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            status = EXCLUDED.status,
            pax = EXCLUDED.pax,
            notes = EXCLUDED.notes,
            checked_in = EXCLUDED.checked_in,
            check_in_time = EXCLUDED.check_in_time;
        `;
      }
    } catch (err) {
      console.error("Vercel Postgres single check-in save exception:", err);
    }
  }

  // 2. Save to Google Apps Script asynchronously
  if (GOOGLE_SCRIPT_URL) {
    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", data: updatedStore }),
      redirect: "follow",
    }).catch((err) => console.error("Google Script single save exception:", err));
  }

  // 3. Save targeted single guest & rsvp to Supabase
  if (supabase) {
    try {
      if (matchedGuest) {
        await supabase.from("guests").upsert([{
          id: matchedGuest.id || Date.now().toString(),
          code: matchedGuest.code || matchedGuest.name || matchedGuest.id,
          name: matchedGuest.name,
          phone: matchedGuest.phone || null,
          category: matchedGuest.category || "Tamu VIP",
          template: matchedGuest.template || "Formal",
          status: matchedGuest.status || "pending",
          checked_in: !!matchedGuest.checkedIn,
          check_in_time: matchedGuest.checkInTime || null,
          pax: matchedGuest.pax || 1,
        }]);
      }
      if (matchedRsvp) {
        await supabase.from("rsvps").upsert([{
          id: matchedRsvp.id || Date.now().toString(),
          name: matchedRsvp.name,
          status: matchedRsvp.status || "Hadir",
          pax: matchedRsvp.pax || 1,
          notes: matchedRsvp.notes || "",
          checked_in: !!matchedRsvp.checkedIn,
          check_in_time: matchedRsvp.checkInTime || null,
        }]);
      }
    } catch (err) {
      console.error("Supabase single check-in save exception:", err);
    }
  }

  // 4. Save to JSONBin asynchronously
  if (JSONBIN_BIN_ID && JSONBIN_API_KEY) {
    fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY,
      },
      body: JSON.stringify(updatedStore),
    }).catch(() => {});
  }
}

function normalizeGuestString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[+]/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\bdan\b/gi, "&")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripGuestDecorations(str: string): string {
  let s = normalizeGuestString(str);
  let prev = "";
  // Strip leading Indonesian honorifics
  while (prev !== s) {
    prev = s;
    s = s.replace(/^(yth|kepada yth|bapak ibu|bapak|ibu|bpk ibu|bpk|sdr|sdri|kak|om|tante)\s+/gi, "");
  }
  // Strip trailing partner & family
  s = s.replace(/\s+(&)\s+(partner|pasangan|keluarga|istri|suami)$/gi, "");
  s = s.replace(/\s+(partner|pasangan|keluarga|istri|suami)$/gi, "");
  return s.trim();
}

function cleanRawGuestInput(raw: string): string {
  let cleaned = (raw || "").trim();
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://") || cleaned.includes("?")) {
    try {
      const u = new URL(cleaned, "https://wedding.local");
      const param =
        u.searchParams.get("to") ||
        u.searchParams.get("t") ||
        u.searchParams.get("name") ||
        u.searchParams.get("code") ||
        u.searchParams.get("guest");
      if (param) cleaned = param;
    } catch {
      const m = cleaned.match(/[?&](?:to|t|name|code|guest)=([^&]+)/i);
      if (m && m[1]) cleaned = m[1];
    }
  }

  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {}
  cleaned = cleaned.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  if (/%[0-9a-fA-F]{2}/.test(cleaned)) {
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch {}
    cleaned = cleaned.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  }
  return cleaned;
}

function findBestGuestMatch(guests: any[], searchStr: string): any | null {
  if (!searchStr || !Array.isArray(guests) || guests.length === 0) return null;

  const cleaned = cleanRawGuestInput(searchStr);
  if (!cleaned) return null;

  const rawSearch = cleaned.toLowerCase();
  const normSearch = normalizeGuestString(cleaned);
  const strippedSearch = stripGuestDecorations(cleaned);

  // 1. Exact ID
  const byId = guests.find((g) => String(g.id || "").trim().toLowerCase() === rawSearch);
  if (byId) return byId;

  // 2. Exact Code
  const byCode = guests.find((g) => String(g.code || "").trim().toLowerCase() === rawSearch);
  if (byCode) return byCode;

  // 3. Exact Name
  const byName = guests.find((g) => String(g.name || "").trim().toLowerCase() === rawSearch);
  if (byName) return byName;

  // 4. Normalized Name / Code (ignores & vs dan, extra spaces, casing)
  if (normSearch) {
    const byNorm = guests.find(
      (g) =>
        normalizeGuestString(g.name) === normSearch ||
        normalizeGuestString(g.code) === normSearch
    );
    if (byNorm) return byNorm;
  }

  // 5. Stripped Salutation & Partner (only if meaningful length >= 3)
  if (strippedSearch && strippedSearch.length >= 3) {
    const byStripped = guests.find((g) => stripGuestDecorations(g.name) === strippedSearch);
    if (byStripped) return byStripped;
  }

  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";

  const data = await fetchFromExternalCloud();

  // Check if using persistent database
  const isUsingDB = !!POSTGRES_URL || !!GOOGLE_SCRIPT_URL || !!supabase || !!(JSONBIN_BIN_ID && JSONBIN_API_KEY);
  const provider = POSTGRES_URL
    ? "vercel_postgres"
    : GOOGLE_SCRIPT_URL
    ? "google_sheets"
    : supabase
    ? "supabase"
    : JSONBIN_BIN_ID
    ? "jsonbin"
    : "memory";

  if (type === "verify") {
    const toParam = (searchParams.get("to") || searchParams.get("name") || "").trim();
    const codeParam = (searchParams.get("code") || "").trim();

    if (!toParam && !codeParam) {
      return NextResponse.json({
        success: true,
        valid: false,
        reason: "empty_query",
        message: "Silakan gunakan link undangan resmi yang telah dibagikan.",
      });
    }

    const guests = data.guests || [];
    if (guests.length === 0) {
      return NextResponse.json({
        success: true,
        valid: true,
        guest: { name: cleanRawGuestInput(toParam) || "Tamu Undangan" },
      });
    }

    const matched =
      (codeParam && findBestGuestMatch(guests, codeParam)) ||
      (toParam && findBestGuestMatch(guests, toParam));

    if (matched) {
      return NextResponse.json({
        success: true,
        valid: true,
        guest: {
          id: matched.id,
          name: matched.name,
          code: matched.code || matched.id,
          category: matched.category || "Tamu VIP",
          pax: matched.pax || 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      valid: false,
      reason: "not_found",
      message: "Nama atau tautan tidak ditemukan dalam daftar tamu resmi.",
    });
  }

  const cacheHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" };
  if (type === "guests") return NextResponse.json({ success: true, data: data.guests, persistent: isUsingDB, provider }, { headers: cacheHeaders });
  if (type === "rsvps") return NextResponse.json({ success: true, data: data.rsvps, persistent: isUsingDB, provider }, { headers: cacheHeaders });
  if (type === "wishes") return NextResponse.json({ success: true, data: data.wishes, persistent: isUsingDB, provider }, { headers: cacheHeaders });
  if (type === "config") return NextResponse.json({ success: true, data: data.config, persistent: isUsingDB, provider }, { headers: cacheHeaders });

  return NextResponse.json({ success: true, data, persistent: isUsingDB, provider }, { headers: cacheHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, item, type } = body;

    const currentStore = await fetchFromExternalCloud();

    if (action === "add" && type && item) {
      if (type === "wishes") {
        item.createdAt = item.createdAt || item.created_at || new Date().toISOString();
        item.created_at = item.created_at || item.createdAt;
      }
      const list = currentStore[type as "guests" | "rsvps" | "wishes"] || [];
      const updatedList = [item, ...list];
      const newStore = { ...currentStore, [type]: updatedList };

      cloudStore = newStore;
      (globalThis as any).__weddingStore = newStore;

      // Fast Targeted Insert
      if (type === "guests") {
        try {
          const filePath = path.join(process.cwd(), "src/data/initialGuests.json");
          fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2));
        } catch {}

        if (sql) {
          try {
            await initPostgresTables();
            await sql`
              INSERT INTO guests (id, code, name, phone, category, template, status, checked_in, check_in_time, pax)
              VALUES (${item.id || Date.now().toString()}, ${item.code || item.name || item.id}, ${item.name}, ${item.phone || null}, ${item.category || "Tamu VIP"}, ${item.template || "Standar"}, ${item.status || "pending"}, ${!!item.checkedIn}, ${item.checkInTime || null}, ${item.pax || 1})
              ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                category = EXCLUDED.category,
                template = EXCLUDED.template,
                status = EXCLUDED.status,
                checked_in = EXCLUDED.checked_in,
                check_in_time = EXCLUDED.check_in_time,
                pax = EXCLUDED.pax;
            `;
          } catch (err) {
            console.error("Postgres add guest error:", err);
          }
        }

        if (supabase) {
          try {
            await supabase.from("guests").upsert([{
              id: String(item.id || Date.now()),
              code: item.code || item.name || item.id,
              name: item.name,
              phone: item.phone || null,
              category: item.category || "Tamu VIP",
              template: item.template || "Standar",
              status: item.status || "pending",
              checked_in: !!item.checkedIn,
              check_in_time: item.checkInTime || null,
              pax: item.pax || 1,
            }]);
          } catch (err) {
            console.error("Supabase add guest error:", err);
          }
        }
      } else if (type === "rsvps") {
        if (sql) {
          try {
            await initPostgresTables();
            await sql`
              INSERT INTO rsvps (id, name, status, pax, notes, checked_in, check_in_time)
              VALUES (${item.id || Date.now().toString()}, ${item.name}, ${item.status || item.attendance || "Hadir"}, ${item.pax || item.guestCount || 1}, ${item.notes || item.session || ""}, ${!!item.checkedIn}, ${item.checkInTime || null})
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                status = EXCLUDED.status,
                pax = EXCLUDED.pax,
                notes = EXCLUDED.notes,
                checked_in = EXCLUDED.checked_in,
                check_in_time = EXCLUDED.check_in_time;
            `;
          } catch (err) {
            console.error("Postgres add rsvp error:", err);
          }
        }
        if (supabase) {
          try {
            await supabase.from("rsvps").upsert([{
              id: item.id || Date.now().toString(),
              name: item.name,
              status: item.status || item.attendance || "Hadir",
              pax: item.pax || item.guestCount || 1,
              notes: item.notes || item.session || "",
              checked_in: !!item.checkedIn,
              check_in_time: item.checkInTime || null,
            }]);
          } catch (err) {
            console.error("Supabase add rsvp error:", err);
          }
        }
      } else if (type === "wishes") {
        if (sql) {
          try {
            await initPostgresTables();
            await sql`
              INSERT INTO wishes (id, name, message, relationship, is_approved)
              VALUES (${item.id || Date.now().toString()}, ${item.name}, ${item.message || ""}, ${item.relationship || "Kerabat"}, ${item.is_approved !== false})
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                message = EXCLUDED.message,
                relationship = EXCLUDED.relationship,
                is_approved = EXCLUDED.is_approved;
            `;
          } catch (err) {
            console.error("Postgres add wish error:", err);
          }
        }
        if (supabase) {
          try {
            await supabase.from("wishes").upsert([{
              id: item.id || Date.now().toString(),
              name: item.name,
              message: item.message || "",
              relationship: item.relationship || "Kerabat",
              is_approved: item.is_approved !== false,
            }]);
          } catch (err) {
            console.error("Supabase add wish error:", err);
          }
        }
      }

      if (GOOGLE_SCRIPT_URL) {
        fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync", data: newStore }),
          redirect: "follow",
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, data: updatedList, item });
    }

    if ((action === "update" || action === "edit") && type && item) {
      const targetId = String(item.id || "").trim();
      const targetName = String(item.name || "").trim();

      const list = currentStore[type as "guests" | "rsvps" | "wishes"] || [];
      const updatedList = list.map((i: any) => {
        const rowId = String(i.id || "").trim();
        const rowName = String(i.name || "").trim();
        if ((targetId && rowId === targetId) || (targetName && rowName === targetName)) {
          return { ...i, ...item };
        }
        return i;
      });

      const newStore = { ...currentStore, [type]: updatedList };
      cloudStore = newStore;
      (globalThis as any).__weddingStore = newStore;

      if (type === "guests") {
        try {
          const filePath = path.join(process.cwd(), "src/data/initialGuests.json");
          fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2));
        } catch {}

        if (sql) {
          try {
            await initPostgresTables();
            await sql`
              UPDATE guests SET
                name = ${item.name},
                code = ${item.code || item.name},
                phone = ${item.phone || null},
                category = ${item.category || "Tamu VIP"},
                template = ${item.template || "Standar"},
                status = ${item.status || "pending"},
                checked_in = ${!!item.checkedIn},
                check_in_time = ${item.checkInTime || null},
                pax = ${item.pax || 1}
              WHERE id = ${targetId} OR name = ${targetName}
            `;
          } catch (err) {
            console.error("Postgres update guest error:", err);
          }
        }

        if (supabase) {
          try {
            await supabase.from("guests").update({
              name: item.name,
              code: item.code || item.name,
              phone: item.phone || null,
              category: item.category || "Tamu VIP",
              template: item.template || "Standar",
              status: item.status || "pending",
              checked_in: !!item.checkedIn,
              check_in_time: item.checkInTime || null,
              pax: item.pax || 1,
            }).match(targetId ? { id: targetId } : { name: targetName });
          } catch (err) {
            console.error("Supabase update guest error:", err);
          }
        }
      } else if (type === "rsvps") {
        if (sql) {
          try {
            await initPostgresTables();
            await sql`
              UPDATE rsvps SET
                name = ${item.name},
                status = ${item.status || item.attendance || "Hadir"},
                pax = ${item.pax || item.guestCount || 1},
                notes = ${item.notes || item.session || ""}
              WHERE id = ${targetId} OR name = ${targetName}
            `;
          } catch (err) {
            console.error("Postgres update rsvp error:", err);
          }
        }

        if (supabase) {
          try {
            await supabase.from("rsvps").update({
              name: item.name,
              status: item.status || item.attendance || "Hadir",
              pax: item.pax || item.guestCount || 1,
              notes: item.notes || item.session || "",
            }).match(targetId ? { id: targetId } : { name: targetName });
          } catch (err) {
            console.error("Supabase update rsvp error:", err);
          }
        }
      } else if (type === "wishes") {
        if (sql) {
          try {
            await initPostgresTables();
            await sql`
              UPDATE wishes SET
                name = ${item.name},
                message = ${item.message || ""},
                relationship = ${item.relationship || "Kerabat"}
              WHERE id = ${targetId}
            `;
          } catch (err) {
            console.error("Postgres update wish error:", err);
          }
        }

        if (supabase) {
          try {
            await supabase.from("wishes").update({
              name: item.name,
              message: item.message || "",
              relationship: item.relationship || "Kerabat",
            }).match({ id: targetId });
          } catch (err) {
            console.error("Supabase update wish error:", err);
          }
        }
      }

      if (GOOGLE_SCRIPT_URL) {
        fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync", data: newStore }),
          redirect: "follow",
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, data: updatedList, item });
    }

    if (action === "set" && type) {
      const newStore = { ...currentStore, [type]: item };
      cloudStore = newStore;
      (globalThis as any).__weddingStore = newStore;

      if (Array.isArray(item) && item.length === 0) {
        if (sql) {
          try {
            if (type === "wishes") await sql`TRUNCATE TABLE wishes`;
            if (type === "guests") await sql`TRUNCATE TABLE guests`;
            if (type === "rsvps") await sql`TRUNCATE TABLE rsvps`;
          } catch (err) {
            console.error("Postgres truncate error:", err);
          }
        }
        if (supabase) {
          try {
            await supabase.from(type).delete().neq("id", "___dummy___");
          } catch {}
        }
      }

      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    if (action === "delete" && type && item) {
      const targetId = String(item.id || "").trim();
      const targetName = String(item.name || "").trim();
      const targetCode = String(item.code || "").trim();
      const targetMessage = String(item.message || "").trim();

      const list = currentStore[type as "guests" | "rsvps" | "wishes"] || [];
      const updatedList = list.filter((i: any) => {
        const rowId = String(i.id || "").trim();
        const rowName = String(i.name || "").trim();
        const rowCode = String(i.code || "").trim();
        const rowMsg = String(i.message || i.notes || "").trim();
        if (targetId && rowId === targetId) return false;
        if (targetCode && rowCode === targetCode) return false;
        if (targetName && targetMessage && rowName === targetName && rowMsg === targetMessage) return false;
        if (type === "guests" && targetName && rowName === targetName) return false;
        if (type === "rsvps" && targetName && rowName === targetName) return false;
        return true;
      });

      const newStore = { ...currentStore, [type]: updatedList };
      cloudStore = newStore;
      (globalThis as any).__weddingStore = newStore;

      if (type === "guests") {
        try {
          const filePath = path.join(process.cwd(), "src/data/initialGuests.json");
          fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2));
        } catch {}
      }

      if (sql) {
        try {
          if (type === "wishes") {
            if (targetId) await sql`DELETE FROM wishes WHERE id = ${targetId}`;
            if (targetName && targetMessage) await sql`DELETE FROM wishes WHERE name = ${targetName} AND message = ${targetMessage}`;
          }
          if (type === "guests") {
            if (targetId) await sql`DELETE FROM guests WHERE id = ${targetId}`;
            if (targetCode) await sql`DELETE FROM guests WHERE code = ${targetCode}`;
            if (targetName && !targetId) await sql`DELETE FROM guests WHERE name = ${targetName}`;
          }
          if (type === "rsvps") {
            if (targetId) await sql`DELETE FROM rsvps WHERE id = ${targetId}`;
            if (targetName && !targetId) await sql`DELETE FROM rsvps WHERE name = ${targetName}`;
          }
        } catch (err) {
          console.error("Postgres delete error:", err);
        }
      }

      if (supabase) {
        try {
          if (targetId) await supabase.from(type).delete().eq("id", targetId);
          if (type === "guests" && targetCode) {
            await supabase.from("guests").delete().eq("code", targetCode);
          }
          if (type === "guests" && targetName && !targetId) {
            await supabase.from("guests").delete().eq("name", targetName);
          }
          if (targetName && targetMessage && type === "wishes") {
            await supabase.from(type).delete().eq("name", targetName).eq("message", targetMessage);
          }
          if (type === "rsvps" && targetName && !targetId) {
            await supabase.from("rsvps").delete().eq("name", targetName);
          }
        } catch (err) {
          console.error("Supabase delete error:", err);
        }
      }

      if (GOOGLE_SCRIPT_URL) {
        fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync", data: newStore }),
          redirect: "follow",
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, data: updatedList });
    }

    if (action === "checkin") {
      const rawCode = (item?.code || item?.id || item?.name || "").toString().trim();
      const guests = currentStore.guests || [];

      // Find the single best matching guest using robust tiered logic
      let matchedGuest = findBestGuestMatch(guests, rawCode);

      const checkInTime =
        new Date().toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB";

      let updatedGuests: any[];

      if (matchedGuest) {
        if (matchedGuest.checkedIn) {
          return NextResponse.json({
            success: true,
            alreadyCheckedIn: true,
            message: `⚠️ Tamu "${matchedGuest.name}" sudah pernah check-in sebelumnya pada ${
              matchedGuest.checkInTime || "jam yang tercatat"
            }.`,
            guest: matchedGuest,
            guests: currentStore.guests,
            rsvps: currentStore.rsvps,
          });
        }

        matchedGuest = {
          ...matchedGuest,
          checkedIn: true,
          checkInTime,
          pax: item?.pax || matchedGuest.pax || 1,
        };

        // ONLY update this single matched guest in the list
        updatedGuests = guests.map((g: any) => (g.id === matchedGuest.id ? matchedGuest : g));
      } else {
        // Not in pre-registered list, create new guest entry with clean decoded name
        const assignedName = cleanRawGuestInput(rawCode) || "Tamu Undangan";
        matchedGuest = {
          id: "guest-" + Date.now().toString(),
          code: assignedName,
          name: assignedName,
          category: "Tamu Undangan",
          template: "Standar",
          checkedIn: true,
          checkInTime,
          pax: item?.pax || 1,
          createdAt:
            new Date().toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }) + " WIB",
        };
        updatedGuests = [matchedGuest, ...guests];
      }

      // Sync and deduplicate RSVP for matchedGuest
      const rsvps = currentStore.rsvps || [];
      const existingRsvpIndex = rsvps.findIndex(
        (r: any) =>
          (r.id && r.id === matchedGuest.id) ||
          (r.name && r.name.trim().toLowerCase() === matchedGuest.name.trim().toLowerCase())
      );

      const rsvpItem = {
        id: String(matchedGuest.id || Date.now()),
        name: matchedGuest.name,
        status: "Hadir",
        attendance: "Hadir",
        checkedIn: true,
        checkInTime: matchedGuest.checkInTime,
        pax: matchedGuest.pax || 1,
        guestCount: matchedGuest.pax || 1,
        session: "Sesi 1 (Akad & Resepsi)",
        notes: "Checked-In via Scanner Barcode",
        createdAt:
          existingRsvpIndex >= 0 && rsvps[existingRsvpIndex].createdAt
            ? rsvps[existingRsvpIndex].createdAt
            : new Date().toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }) + " WIB",
      };

      let updatedRsvps: any[];
      if (existingRsvpIndex >= 0) {
        updatedRsvps = [...rsvps];
        updatedRsvps[existingRsvpIndex] = { ...updatedRsvps[existingRsvpIndex], ...rsvpItem };
      } else {
        updatedRsvps = [rsvpItem, ...rsvps];
      }

      const newStore = { ...currentStore, guests: updatedGuests, rsvps: updatedRsvps };

      // Persist check-in
      await saveSingleCheckInToCloud(matchedGuest, rsvpItem, newStore);

      return NextResponse.json({
        success: true,
        alreadyCheckedIn: false,
        message: `✓ Check-in Berhasil! Selamat Datang ${matchedGuest.name}`,
        guest: matchedGuest,
        guests: updatedGuests,
        rsvps: updatedRsvps,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action or type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Cloud DB Error" }, { status: 500 });
  }
}
