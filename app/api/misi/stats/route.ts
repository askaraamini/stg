import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeStats } from "@/lib/misi-stats";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const deviceId = searchParams.get("deviceId");
    const uid = userId || deviceId;
    if (!uid) {
      return NextResponse.json({ error: "userId atau deviceId diperlukan" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("sessions")
      .select("id, summary, subject, started_at")
      .eq("user_id", uid)
      .order("started_at", { ascending: false });

    if (error) {
      throw new Error(`Gagal mengambil sesi: ${error.message}`);
    }

    const stats = computeStats(data || []);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[misi-stats]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil statistik" },
      { status: 500 }
    );
  }
}
