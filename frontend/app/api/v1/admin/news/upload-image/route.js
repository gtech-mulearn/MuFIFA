import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

let newsBucketReady = false;

export async function POST(request) {
  try {
    // 1. Authenticate admin/superadmin
    const auth = requireRole(request, "admin", "superadmin");
    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
            message: auth.message,
            details: null,
          },
        },
        { status: auth.status }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("image");
    
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    // 3. Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG are allowed." },
        { status: 400 }
      );
    }

    // 4. Validate file size (max 5MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database configuration error." },
        { status: 503 }
      );
    }

    const bucketName = "news-images";

    // 5. Create bucket if it doesn't exist (one-time per cold start)
    if (!newsBucketReady) {
      try {
        await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: bucketName,
            name: bucketName,
            public: true,
          }),
        });
      } catch (err) {
        // Bucket likely already exists
      }
      newsBucketReady = true;
    }

    // 6. Convert file to binary buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique name
    const extension = file.name.split(".").pop() || "png";
    const filePath = `news-${Date.now()}.${extension}`;

    // 7. Upload file to Supabase Storage
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;
    const storageRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!storageRes.ok) {
      const errText = await storageRes.text();
      console.error("Supabase Storage upload error detail:", errText);
      return NextResponse.json(
        { success: false, error: "Failed to upload image to storage." },
        { status: 500 }
      );
    }

    // 8. Construct Public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;

    return NextResponse.json({
      success: true,
      image_url: publicUrl,
    });
  } catch (error) {
    console.error("News image upload handler error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process image upload." },
      { status: 500 }
    );
  }
}
