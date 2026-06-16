import { Hono } from "hono";
import { cors } from "hono/cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
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
        error: { code: "UNAUTHORIZED", message: "Unauthorized request API key mismatch." },
      },
      401,
    );
  }
  await next();
};

const TEAM_WHATSAPP_LINKS: Record<string, string> = {
  Brazil: "https://chat.whatsapp.com/EV8id4d16MGIXdmmpDtx7g",
  Argentina: "https://chat.whatsapp.com/BhddYg7jtG24SpEP9XmYvf",
  Portugal: "https://chat.whatsapp.com/Ec6u5gbzXaBLsKJOVdMSgB",
  Germany: "https://chat.whatsapp.com/KwNWCzEWyCJA24NmeacfLM",
  France: "https://chat.whatsapp.com/LY2EOqz9pXYClO7ZfIwybU",
  England: "https://chat.whatsapp.com/KnJcWM2Bb7M32TnT68LtUI",
  Spain: "https://chat.whatsapp.com/DAIaHMOjt3P6DrAdaD3EDv",
  Netherlands: "https://chat.whatsapp.com/BFLIlE9IdenBzj7R4zfGW9",
  Belgium: "https://chat.whatsapp.com/H8ibvdnnBSaLORa4gguG5M",
  Croatia: "https://chat.whatsapp.com/FkLUDYocKur6EWkSCSKNaN",
  Uruguay: "https://chat.whatsapp.com/DEYKZdZ65NG15zhIaxpAcK",
  Japan: "https://chat.whatsapp.com/Ccg1WGLaize3hgcVLUqZHF",
};

const TEAM_FLAGS: Record<string, string> = {
  Brazil: "br",
  Argentina: "ar",
  Portugal: "pt",
  Germany: "de",
  France: "fr",
  England: "gb-eng",
  Spain: "es",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
};

function getNewUserEmailHtml(player: any, ticketUrl: string) {
  const { name, user_id, team } = player;
  const teamLabel = TEAM_FLAGS[team] || team || "Assigned Team";
  const whatsappUrl = TEAM_WHATSAPP_LINKS[team] || "https://chat.whatsapp.com/";
  const displayId = user_id.startsWith("@") ? user_id : `@${user_id}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Pass Confirmed | μFIFA</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #090a0f;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            box-sizing: border-box;
            padding: 40px 20px;
            background: 
              radial-gradient(circle at top right, rgba(79, 70, 229, 0.15), transparent 40%),
              radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.15), transparent 40%),
              #090a0f;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background: rgba(19, 25, 39, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo-text {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #ffffff;
            margin: 0;
            text-transform: uppercase;
          }
          .logo-subtext {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.25em;
            color: #06b6d4;
            margin: 4px 0 0 0;
            text-transform: uppercase;
          }
          .greeting {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 16px 0;
          }
          .message {
            font-size: 15px;
            line-height: 1.7;
            color: #94a3b8;
            margin: 0 0 24px 0;
          }
          .highlight-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 28px;
            text-align: left;
          }
          .highlight-item {
            font-size: 14px;
            margin: 8px 0;
            color: #cbd5e1;
          }
          .highlight-label {
            font-weight: 600;
            color: #06b6d4;
            display: inline-block;
            width: 100px;
          }
          .ticket-wrap {
            margin: 32px 0;
            text-align: center;
          }
          .ticket-img {
            max-width: 100%;
            height: auto;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(6, 182, 212, 0.15);
          }
          .cta-wrap {
            text-align: center;
            margin: 32px 0 24px 0;
          }
          .btn-primary {
            display: inline-block;
            padding: 14px 28px;
            border-radius: 14px;
            background: #25d366;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            box-shadow: 0 8px 24px rgba(37, 211, 102, 0.3);
            transition: all 0.2s ease;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            padding-top: 28px;
            text-align: center;
          }
          .footer-title {
            font-size: 13px;
            font-weight: 700;
            color: #94a3b8;
            margin: 0 0 6px 0;
            letter-spacing: 0.05em;
          }
          .footer-desc {
            font-size: 11px;
            line-height: 1.6;
            color: #64748b;
            margin: 0 0 16px 0;
          }
          .footer-desc a {
            color: #06b6d4;
            text-decoration: none;
          }
          .footer-copyright {
            font-size: 10px;
            color: #475569;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1 class="logo-text">μFIFA'26</h1>
              <p class="logo-subtext">Arena Access Pass</p>
            </div>

            <!-- Greetings & Message -->
            <div class="greeting">Hello ${name},</div>
            <div class="message">
              Welcome to <strong>μFIFA'26</strong>! We are absolutely thrilled to have you onboard for the ultimate celebration of innovation, sportsmanship, and peer achievement. Your registration is officially confirmed!
            </div>
            
            <div class="message">
              Below is your digital arena access pass. You have also been credited with <strong>10 μPoints</strong> in your account as a registration milestone reward. Keep practicing and get ready for the kickoff!
            </div>

            <!-- Highlight Details -->
            <div class="highlight-box">
              <div class="highlight-item">
                <span class="highlight-label">Player ID:</span> ${displayId}
              </div>
            </div>

            <!-- Access Pass Image -->
            <div class="ticket-wrap">
              <img src="${ticketUrl || "cid:ticket_image"}" class="ticket-img" alt="μFIFA '26 Arena Access Pass" width="500">
            </div>

            <!-- Squad Call to Action -->
            <div class="message" style="text-align: center; margin-bottom: 12px;">
              Ready to connect with your team? Join your official squad channel on WhatsApp:
            </div>
            <div class="cta-wrap">
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                Join ${teamLabel} Squad
              </a>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-title">μLearn Foundation</div>
              <div class="footer-desc">
                Empowering next-generation professionals through peer learning, building in public, and micro-networking. Discover more opportunities at <a href="https://mulearn.org" target="_blank" rel="noopener noreferrer">mulearn.org</a>.
              </div>
              <p class="footer-copyright">
                &copy; 2026 μLearn Foundation. All rights reserved.<br>
                This is an automated confirmation email. Please do not reply directly.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getOtpEmailHtml(name: string, otp: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email | μFIFA</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #090a0f;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            box-sizing: border-box;
            padding: 40px 20px;
            background: 
              radial-gradient(circle at top right, rgba(79, 70, 229, 0.12), transparent 40%),
              radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.12), transparent 40%),
              #090a0f;
          }
          .container {
            max-width: 480px;
            margin: 0 auto;
            background: rgba(19, 25, 39, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          .header {
            text-align: center;
            margin-bottom: 28px;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #ffffff;
            margin: 0;
            text-transform: uppercase;
          }
          .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 16px 0;
            text-align: left;
          }
          .message {
            font-size: 14px;
            line-height: 1.6;
            color: #94a3b8;
            margin: 0 0 24px 0;
            text-align: left;
          }
          .otp-box {
            display: inline-block;
            padding: 16px 28px;
            border-radius: 14px;
            background: rgba(6, 182, 212, 0.08);
            border: 1px solid rgba(6, 182, 212, 0.25);
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 0.3em;
            color: #06b6d4;
            margin: 8px 0 24px 0;
            text-shadow: 0 0 12px rgba(6, 182, 212, 0.3);
          }
          .note {
            font-size: 12px;
            color: #64748b;
            margin: 0 0 28px 0;
          }
          .footer {
            margin-top: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            padding-top: 24px;
            text-align: center;
          }
          .footer-title {
            font-size: 12px;
            font-weight: 700;
            color: #94a3b8;
            margin: 0 0 6px 0;
          }
          .footer-desc {
            font-size: 10px;
            line-height: 1.5;
            color: #64748b;
            margin: 0 0 12px 0;
          }
          .footer-desc a {
            color: #06b6d4;
            text-decoration: none;
          }
          .footer-copyright {
            font-size: 9px;
            color: #475569;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1 class="logo-text">μFIFA'26</h1>
            </div>

            <!-- Greetings & Message -->
            <div class="greeting">Hello ${name},</div>
            <div class="message">
              Thank you for starting your registration for <strong>μFIFA'26</strong>! Use the verification code below to confirm your email address and secure your spot in the arena:
            </div>

            <!-- OTP Code -->
            <div class="otp-box">${otp}</div>

            <div class="note">
              This code is valid for 10 minutes. If you did not request this verification, please ignore this email.
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-title">μLearn Foundation</div>
              <div class="footer-desc">
                Discover professional peer learning communities and micro-networking circles at <a href="https://mulearn.org" target="_blank" rel="noopener noreferrer">mulearn.org</a>.
              </div>
              <p class="footer-copyright">
                &copy; 2026 μLearn Foundation. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

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

app.post("/api/v1/send-otp", checkApiKey, async (c: any) => {
  try {
    const rawText = await c.req.text();
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr: any) {
      return c.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: `Invalid JSON body: ${parseErr.message}` },
        },
        400,
      );
    }

    const { email, name } = parsed;
    if (!email) {
      return c.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Email is required" },
        },
        400,
      );
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `"noreply@mulearn.org" <noreply@mulearn.org>`;

    if (!host || !user || !pass) {
      return c.json(
        {
          success: false,
          error: { code: "SMTP_CONFIG_ERROR", message: "SMTP credentials not configured" },
        },
        500,
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const OTP_TTL_MS = 10 * 60 * 1000;
    const OTP_RESEND_MS = 2 * 60 * 1000;
    const expiresAt = now + OTP_TTL_MS;
    const resendAvailableAt = now + OTP_RESEND_MS;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailSubject = "Verify your registration OTP | μFIFA";
    const mailText = `Hello ${name || "User"}, use the OTP ${otp} to verify your email.`;
    const mailHtml = getOtpEmailHtml(name || "User", otp);

    const info = await transporter.sendMail({
      from,
      to: email,
      subject: mailSubject,
      text: mailText,
      html: mailHtml
    });

    return c.json({
      success: true,
      otp,
      resendAvailableAt,
      expiresAt,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error("Failed to generate and send OTP email:", error);
    return c.json(
      {
        success: false,
        error: { code: "EMAIL_SEND_FAILED", message: error.message },
      },
      500,
    );
  }
});

app.post("/api/v1/send-ticket", checkApiKey, async (c: any) => {
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

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `"noreply@mulearn.org" <noreply@mulearn.org>`;

    if (!host || !user || !pass) {
      return c.json(
        {
          success: false,
          error: { code: "SMTP_CONFIG_ERROR", message: "SMTP credentials not configured" },
        },
        500,
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

    if (player.id) {
      try {
        const dbRes = await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticket_url: publicUrl,
          }),
        });
        if (!dbRes.ok) {
          console.warn(`[Supabase DB] Failed to save ticket_url:`, await dbRes.text());
        }
      } catch (dbErr: any) {
        console.warn(`[Supabase DB] Failed to update registration row:`, dbErr.message);
      }
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });

    const displayUserId = player.user_id.startsWith("@") ? player.user_id : `@${player.user_id}`;
    const teamLabel = TEAM_FLAGS[player.team] || player.team;
    const whatsappUrl = TEAM_WHATSAPP_LINKS[player.team] || "https://chat.whatsapp.com/";

    const subjectLine = `Access Pass Confirmed - ${displayUserId} | μFIFA`;
    const textContent = `Hello ${player.name}, welcome to μFIFA'26! Your arena access pass has been confirmed under Player ID ${displayUserId} playing for ${teamLabel}. You can view your access pass online here: ${publicUrl}. Join your squad WhatsApp group here: ${whatsappUrl}`;
    const htmlContent = getNewUserEmailHtml(player, publicUrl);

    const info = await transporter.sendMail({
      from,
      to: player.email,
      subject: subjectLine,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: "ticket.png",
          content: pngBuffer,
          cid: "ticket_image"
        }
      ]
    });

    return c.json({
      success: true,
      ticketUrl: publicUrl,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error("Failed to generate and send ticket email:", error);
    return c.json(
      {
        success: false,
        error: { code: "EMAIL_SEND_FAILED", message: error.message },
      },
      500,
    );
  }
});

app.post("/api/v1/ticket-email", checkApiKey, async (c: any) => {
  // Alias for send-ticket
  try {
    const body = await c.req.json();
    // Re-map fields if necessary for ticket-email backward compatibility
    const player = {
      id: body.id,
      name: body.name || body.playerName,
      email: body.email || body.recipientEmail,
      user_id: body.user_id || body.recipientEmail?.split("@")[0] || "player",
      team: body.team || "Brazil",
      created_at: body.created_at
    };
    
    const supabaseUrl = body.supabaseUrl || process.env.SUPABASE_URL;
    const supabaseKey = body.supabaseKey || process.env.SUPABASE_KEY;

    // Call the exact same logic
    const reqMock = {
      json: async () => ({ player, supabaseUrl, supabaseKey })
    };
    
    // We can just construct a new Context or call our implementation helper
    // For simplicity, we execute the exact same call inline:
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

    let publicUrl = "";
    if (uploadRes.ok) {
      publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
      
      if (player.id) {
        try {
          await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`, {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ticket_url: publicUrl,
            }),
          });
        } catch {}
      }
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `"noreply@mulearn.org" <noreply@mulearn.org>`;

    if (!host || !user || !pass) {
      return c.json({ success: false, error: { code: "SMTP_CONFIG_ERROR", message: "SMTP not configured" } }, 500);
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
    const displayUserId = player.user_id.startsWith("@") ? player.user_id : `@${player.user_id}`;
    const teamLabel = TEAM_FLAGS[player.team] || player.team;
    const whatsappUrl = TEAM_WHATSAPP_LINKS[player.team] || "https://chat.whatsapp.com/";

    const subjectLine = `Access Pass Confirmed - ${displayUserId} | μFIFA`;
    const textContent = `Hello ${player.name}, welcome to μFIFA'26! Your arena access pass has been confirmed under Player ID ${displayUserId} playing for ${teamLabel}. You can view your access pass online here: ${publicUrl}. Join your squad WhatsApp group here: ${whatsappUrl}`;
    const htmlContent = getNewUserEmailHtml(player, publicUrl);

    const info = await transporter.sendMail({
      from,
      to: player.email,
      subject: subjectLine,
      text: textContent,
      html: htmlContent,
      attachments: [{ filename: "ticket.png", content: pngBuffer, cid: "ticket_image" }]
    });

    return c.json({
      success: true,
      ticketUrl: publicUrl,
      messageId: info.messageId
    });
  } catch (error: any) {
    return c.json({ success: false, error: { code: "EMAIL_SEND_FAILED", message: error.message } }, 500);
  }
});

const port = parseInt(process.env.PORT || "3005", 10);
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

export default app;
