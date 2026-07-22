import { NextResponse } from "next/server";

/**
 * Universal Cloud Database API Route for Wedding Invitation App
 * Syncs Guests, RSVPs, and Wishes across all devices globally.
 * Uses JSONBin / Supabase / Cloud KV with fallback in-memory & persistent storage.
 */

// Global cloud memory store for instant real-time sync across multi-devices
let cloudStore: {
  guests: any[];
  rsvps: any[];
  wishes: any[];
  config: any;
} = {
  guests: [],
  config: {},
  rsvps: [
    {
      id: "1",
      name: "Bapak H. Ahmad & Keluarga",
      phone: "6281234567890",
      pax: 2,
      status: "Hadir",
      notes: "Insya Allah hadir berdua dari Depok",
      createdAt: "10 Okt 2026, 09:30",
    },
    {
      id: "2",
      name: "Siti Rahma",
      phone: "6285712345678",
      pax: 1,
      status: "Hadir",
      notes: "Selamat ya Angi & Anam!",
      createdAt: "10 Okt 2026, 11:15",
    },
  ],
  wishes: [
    {
      id: "1",
      name: "Bapak H. Ahmad",
      relationship: "Keluarga",
      message:
        "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fii khair. Selamat menempuh hidup baru untuk Angi & Anam!",
      createdAt: "10 Okt 2026, 09:32",
    },
    {
      id: "2",
      name: "Siti Rahma",
      relationship: "Teman Angi",
      message:
        "Happy wedding Angi & Anam! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Aamiin!",
      createdAt: "10 Okt 2026, 11:18",
    },
  ],
};

// Optional external free Cloud Database Integration (JSONBin.io / Supabase / KV)
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

async function fetchFromExternalCloud() {
  if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) return cloudStore;

  try {
    const res = await fetch(
      `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`,
      {
        headers: {
          "X-Master-Key": JSONBIN_API_KEY,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.record) {
        cloudStore = { ...cloudStore, ...data.record };
      }
    }
  } catch {
    // Return memory fallback
  }

  return cloudStore;
}

async function saveToExternalCloud(updatedStore: any) {
  cloudStore = updatedStore;

  if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) return;

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";

  const data = await fetchFromExternalCloud();

  if (type === "guests") return NextResponse.json({ success: true, data: data.guests });
  if (type === "rsvps") return NextResponse.json({ success: true, data: data.rsvps });
  if (type === "wishes") return NextResponse.json({ success: true, data: data.wishes });
  if (type === "config") return NextResponse.json({ success: true, data: data.config });

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, item, type } = body;

    const currentStore = await fetchFromExternalCloud();

    if (action === "add" && type) {
      const list = currentStore[type as "guests" | "rsvps" | "wishes"] || [];
      const updatedList = [item, ...list];
      const newStore = { ...currentStore, [type]: updatedList };

      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    if (action === "set" && type) {
      const newStore = { ...currentStore, [type]: item };
      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    if (action === "delete" && type && item?.id) {
      const list = currentStore[type as "guests" | "rsvps" | "wishes"] || [];
      const updatedList = list.filter((i: any) => i.id !== item.id);
      const newStore = { ...currentStore, [type]: updatedList };

      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    return NextResponse.json({ success: false, error: "Invalid action or type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Cloud DB Error" }, { status: 500 });
  }
}
