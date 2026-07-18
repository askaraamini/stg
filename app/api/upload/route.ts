import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET_NAME = "scan-images";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File diperlukan" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Kompresi server-side dengan sharp: max 1600px width, max 500KB
    const compressed = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    const fileName = `scan-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const supabase = createServiceClient();

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        }
      );
      if (createError) {
        throw new Error(`Gagal membuat bucket: ${createError.message}`);
      }
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, compressed, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Gagal upload ke Supabase: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl, path: data.path });
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload gagal" },
      { status: 500 }
    );
  }
}
