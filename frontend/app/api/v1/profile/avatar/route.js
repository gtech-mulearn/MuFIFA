import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { createRateLimiter, getClientIp } from "@/utils/rateLimit";

const PLAYER_COOKIE = "player_token";
const checkRate = createRateLimiter("avatar-upload", 10, 5 * 60 * 1000);
let avatarBucketReady = false;

export async function POST(request) {
  try {
    // Rate limit check
    const rateCheck = checkRate(getClientIp(request));
    if (rateCheck.limited) {
      return NextResponse.json(
        { success: false, error: `Too many uploads. Try again in ${rateCheck.retryAfter}s.` },
        { status: 429 }
      );
    }

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

    // 3. Validate file type (allow any image format)
    const isImage = file.type ? file.type.startsWith("image/") : /\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i.test(file.name);
    if (!isImage) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only image files (JPEG, PNG, WEBP, GIF, etc.) are allowed." },
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

    // 5. Create "avatars" bucket if it doesn't exist (one-time per cold start)
    if (!avatarBucketReady) {
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
        // Bucket likely already exists
      }
      avatarBucketReady = true;
    }

    // 6. Convert file to binary buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate stable name per user (overwrites previous avatar)
    const extension = file.name.split(".").pop() || "png";
    const filePath = `avatars/${decoded.id}.${extension}`;

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

    // 8. Construct Public URL with cache-bust param
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${filePath}?t=${Date.now()}`;

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
