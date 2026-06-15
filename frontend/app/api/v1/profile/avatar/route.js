import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function POST(request) {
  try {
    // 1. Authenticate user
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (!match) {
      return NextResponse.json(
        { success: false, error: "Authentication required to upload avatar." },
        { status: 401 }
      );
    }

    const token = match[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Invalid session. Please log in again." },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    // 3. Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // 4. Validate file size (max 3MB)
    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 3MB limit." },
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

    // 5. Create "avatars" bucket if it doesn't exist (fail-safe)
    try {
      await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "avatars",
          name: "avatars",
          public: true,
        }),
      });
    } catch (err) {
      console.warn("Storage bucket 'avatars' creation attempt skipped/already exists:", err.message);
    }

    // 6. Convert file to binary buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique name
    const extension = file.name.split(".").pop() || "png";
    const filePath = `avatars/${decoded.id}-${Date.now()}.${extension}`;

    // 7. Upload file to Supabase Storage
    const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${filePath}`;
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
      const errText = await storageRes.ok ? "" : await storageRes.text();
      console.error("Supabase Storage upload error detail:", errText);
      return NextResponse.json(
        { success: false, error: "Failed to upload image to storage." },
        { status: 500 }
      );
    }

    // 8. Construct Public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${filePath}`;

    // 9. Update Database Row
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_url: publicUrl,
      }),
    });

    if (!dbRes.ok) {
      throw new Error(`Database patch failed: ${await dbRes.text()}`);
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
    });
  } catch (error) {
    console.error("Avatar upload handler error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process profile picture update." },
      { status: 500 }
    );
  }
}
