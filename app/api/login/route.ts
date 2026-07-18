import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, pin, deviceId } = await request.json();

    if (!email || !pin) {
      return NextResponse.json({ error: "Email dan PIN diperlukan" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, pin, class")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Email tidak ditemukan" }, { status: 401 });
    }

    const valid = await bcrypt.compare(pin, profile.pin);
    if (!valid) {
      return NextResponse.json({ error: "PIN salah" }, { status: 401 });
    }

    // Migrate sessions from deviceId to real userId
    if (deviceId) {
      const { error: migrateError } = await supabase
        .from("sessions")
        .update({ user_id: profile.id })
        .eq("user_id", deviceId);

      if (migrateError) {
        console.warn("[login] Migration failed:", migrateError.message);
      }
    }

    return NextResponse.json({ userId: profile.id, name: profile.name, class: profile.class });
  } catch (error) {
    console.error("[login]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal masuk" },
      { status: 500 }
    );
  }
}
