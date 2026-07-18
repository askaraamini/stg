import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, pin, kelas, deviceId, parentWhatsapp } = await request.json();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }
    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN harus 6 digit angka" }, { status: 400 });
    }
    if (!kelas) {
      return NextResponse.json({ error: "Pilih kelas terlebih dahulu" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if email already exists — use maybeSingle to avoid PGRST116 on miss
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    // Hash PIN
    let hashedPin: string;
    try {
      hashedPin = await bcrypt.hash(pin, 10);
    } catch {
      console.error("[register] bcrypt hash failed");
      return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }

    // Insert profile and return created row
    const insertData: Record<string, unknown> = {
      name,
      email,
      pin: hashedPin,
      class: kelas,
    };
    if (parentWhatsapp) {
      insertData.parent_whatsapp = parentWhatsapp;
    }

    const { data: profile, error: createError } = await supabase
      .from("profiles")
      .insert(insertData)
      .select("id, name, class")
      .single();

    if (createError) {
      console.error("[register] Insert failed:", createError.message);
      return NextResponse.json({ error: "Gagal mendaftar, coba lagi" }, { status: 500 });
    }

    if (!profile || !profile.id) {
      console.error("[register] Insert returned no profile");
      return NextResponse.json({ error: "Gagal mendaftar, coba lagi" }, { status: 500 });
    }

    // Migrate sessions from deviceId to real userId
    if (deviceId) {
      const { error: migrateError } = await supabase
        .from("sessions")
        .update({ user_id: profile.id })
        .eq("user_id", deviceId);

      if (migrateError) {
        console.warn("[register] Session migration failed:", migrateError.message);
      }
    }

    return NextResponse.json({ userId: profile.id, name: profile.name, class: profile.class });
  } catch (error) {
    console.error("[register] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mendaftar" },
      { status: 500 }
    );
  }
}
