import { Hono } from "hono";
import { cors } from "hono/cors";
import dotenv from "dotenv";
import { serve } from "@hono/node-server";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

dotenv.config();

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
      ].filter(Boolean);

      if (allowedOrigins.includes(origin) || !origin) {
        return origin;
      }

      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return origin;
      }

      return null;
    },
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  const origin = c.req.header("origin");
  const referer = c.req.header("referer");
  const accept = c.req.header("accept");
  const secFetchMode = c.req.header("sec-fetch-mode");

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3001",
  ].filter(Boolean);

  const isAllowedUrl = (url: string) => {
    return allowedOrigins.includes(url);
  };

  let isBlocked = false;

  if (origin && !isAllowedUrl(origin)) {
    isBlocked = true;
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!isAllowedUrl(refOrigin)) {
        isBlocked = true;
      }
    } catch {
      if (
        !allowedOrigins.some((o) => referer.startsWith(o!)) &&
        !referer.startsWith("http://localhost:") &&
        !referer.startsWith("http://127.0.0.1:")
      ) {
        isBlocked = true;
      }
    }
  }

  if (
    c.req.path !== "/" &&
    (secFetchMode === "navigate" || (accept && accept.includes("text/html")))
  ) {
    isBlocked = true;
  }

  if (isBlocked) {
    if (origin) {
      c.res.headers.set("Access-Control-Allow-Origin", origin);
      c.res.headers.set("Access-Control-Allow-Credentials", "true");
    }
    return c.json(
      {
        success: false,
        error: `POI CHAVU MYRE...TASK CHEY ALLEL PIDICHU BLOCK AAKKUM`,
      },
      403,
    );
  }

  await next();
});

const checkApiKey = async (c: any, next: any) => {
  const backendApiKey = process.env.BACKEND_API_KEY || "test";
  const apiKey = c.req.header("X-Internal-API-Key");
  if (backendApiKey && apiKey !== backendApiKey) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized request API key mismatch.",
        },
      },
      401,
    );
  }
  await next();
};

async function generateTicketPng(player: any) {
  const { name, user_id, created_at } = player;

  const dateObj = created_at ? new Date(created_at) : new Date();
  const issuedOn = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const ticketPath = path.join(process.cwd(), "public", "ticket.png");
  if (!fs.existsSync(ticketPath)) {
    throw new Error(`ticket.png not found at: ${ticketPath}`);
  }

  const baseImage = await loadImage(ticketPath);
  const width = baseImage.width;
  const height = baseImage.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImage, 0, 0, width, height);

  const displayUserId = user_id.startsWith("@") ? user_id : `@${user_id}`;

  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "#2A1E17";
  ctx.textAlign = "left";
  ctx.fillText(name, 510, 582);

  ctx.font = "bold 38px Arial";
  ctx.fillStyle = "#E53935";
  ctx.textAlign = "left";
  ctx.fillText(displayUserId, 470, 742);

  ctx.font = "bold 30px Arial";
  ctx.fillStyle = "#2A1E17";
  ctx.textAlign = "left";
  ctx.fillText(issuedOn, 430, 898);

  const pngBuffer = await canvas.encode("png");
  return pngBuffer;
}

app.get("/", (c) => {
  return c.json({ message: "ElevUp API is running" });
});

app.post("/api/v1/generate-ticket", checkApiKey, async (c: any) => {
  try {
    const { player, supabaseUrl, supabaseKey } = await c.req.json();
    if (!player || !player.email || !player.user_id) {
      return c.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Player details are required" },
        },
        400,
      );
    }
    if (!supabaseUrl || !supabaseKey) {
      return c.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Supabase configuration is required" },
        },
        400,
      );
    }

    const pngBuffer = await generateTicketPng(player);

    const bucketName = "tickets";
    const filePath = `tickets/${player.user_id}.png`;

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
    } catch (err: any) {
      console.warn(`[Supabase Storage] Bucket '${bucketName}' creation warning:`, err.message);
    }

    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: new Uint8Array(pngBuffer),
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("[Supabase Storage] Upload failed on backend:", errorText);
      return c.json(
        {
          success: false,
          error: { code: "STORAGE_UPLOAD_FAILED", message: `Failed to upload ticket image: ${errorText}` },
        },
        500,
      );
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
    console.log(`[Supabase Storage] Backend ticket uploaded successfully: ${publicUrl}`);

    return c.json({
      success: true,
      ticketUrl: publicUrl,
      ticketBase64: pngBuffer.toString("base64")
    });
  } catch (error: any) {
    console.error("Failed to generate ticket on backend:", error);
    return c.json(
      {
        success: false,
        error: { code: "TICKET_GENERATION_FAILED", message: error.message },
      },
      500,
    );
  }
});

const port = parseInt(process.env.PORT || "3005", 10);
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
