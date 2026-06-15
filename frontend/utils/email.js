import nodemailer from "nodemailer";
import { getNewUserEmailHtml } from "../templates/email/newUser";
import { TEAM_FLAGS, TEAM_WHATSAPP_LINKS } from "./constants";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// Resolve __dirname equivalent for ESM (works reliably on both local and Vercel)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;


/**
 * Escapes special XML characters in a string to prevent SVG injection.
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn(
        "SMTP credentials are not fully configured in environment variables. Email dispatch is disabled.",
      );
      return null;
    }
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === "465" || smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

/**
 * Generates a ticket PNG by:
 * 1. Loading the base ticket.png image
 * 2. Creating a Canvas overlay with dynamic text (name, user_id, date)
 * 3. Compositing the text onto the base image
 * 
 * Uses @napi-rs/canvas for consistent text rendering across platforms (Windows & Linux/Vercel)
 */
export async function generateTicketPng(player) {
  const { name, user_id, created_at } = player;

  // Format the date (e.g. "Jun 15, 2026")
  const dateObj = created_at ? new Date(created_at) : new Date();
  const issuedOn = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const ticketPath = path.join(process.cwd(), "public", "ticket.png");
  console.log(`[Ticket Canvas] Resolved ticket.png path: ${ticketPath}`);

  if (!fs.existsSync(ticketPath)) {
    throw new Error(`ticket.png not found at: ${ticketPath}`);
  }

  try {
    // Load the base ticket image
    const baseImage = await loadImage(ticketPath);
    const width = baseImage.width;
    const height = baseImage.height;

    console.log(`[Ticket Canvas] Base image loaded: ${width}x${height}`);

    // Create canvas and draw base image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Draw the base ticket image
    ctx.drawImage(baseImage, 0, 0, width, height);

    // Prepare text
    const displayUserId = user_id.startsWith("@") ? user_id : `@${user_id}`;

    // Draw player name (bold, large text)
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#2A1E17";
    ctx.textAlign = "left";
    ctx.fillText(name, 510, 582);
    console.log(`[Ticket Canvas] Drew name: "${name}" at (510, 582)`);

    // Draw user ID (bold, red text)
    ctx.font = "bold 38px Arial";
    ctx.fillStyle = "#E53935";
    ctx.textAlign = "left";
    ctx.fillText(displayUserId, 470, 742);
    console.log(`[Ticket Canvas] Drew user_id: "${displayUserId}" at (470, 742)`);

    // Draw issued date
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#2A1E17";
    ctx.textAlign = "left";
    ctx.fillText(issuedOn, 430, 898);
    console.log(`[Ticket Canvas] Drew date: "${issuedOn}" at (430, 898)`);

    // Convert canvas to PNG buffer
    const pngBuffer = await canvas.encode("png");

    console.log(
      `[Ticket Canvas] PNG generated successfully. Buffer size: ${pngBuffer.length} bytes`
    );
    return pngBuffer;
  } catch (err) {
    console.error("[Ticket Canvas] Failed to generate ticket:", err);
    throw err;
  }
}

/**
 * Uploads the generated ticket PNG to Supabase Storage and returns the public URL.
 * Also attempts to save this URL to the registration record under ticket_url.
 */
async function uploadTicketToSupabase(player, pngBuffer) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Supabase Storage] Database configuration missing. Skipping upload.");
    return null;
  }

  const { user_id, id } = player;
  const bucketName = "tickets";
  const filePath = `tickets/${user_id}.png`;

  // 1. Create bucket if it doesn't exist (fail-safe)
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
    console.warn(`[Supabase Storage] Bucket '${bucketName}' creation warning:`, err.message);
  }

  // 2. Upload file
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;
  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: pngBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Supabase Storage] Upload request failed:", errorText);
      return null;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
    console.log(`[Supabase Storage] Ticket uploaded successfully: ${publicUrl}`);

    // 3. Update registrations row if player database ID is available
    if (id) {
      try {
        const dbRes = await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${id}`, {
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
          console.warn(`[Supabase DB] Failed to save ticket_url (the column may not exist):`, await dbRes.text());
        } else {
          console.log(`[Supabase DB] Ticket URL successfully updated in registration record.`);
        }
      } catch (dbErr) {
        console.warn(`[Supabase DB] Failed to update registration row:`, dbErr.message);
      }
    }

    return publicUrl;
  } catch (err) {
    console.error("[Supabase Storage] Exception during ticket upload:", err.message);
    return null;
  }
}

export async function sendRegistrationEmail(player) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    return false;
  }

  const { name, email, user_id, team } = player;
  const teamLabel = TEAM_FLAGS[team] || team;
  const whatsappUrl = TEAM_WHATSAPP_LINKS[team] || "https://chat.whatsapp.com/";

  try {
    const pngContent = await generateTicketPng(player);
    const publicUrl = await uploadTicketToSupabase(player, pngContent);

    const info = await mailTransporter.sendMail({
      from: `"noreply@mulearn.org" <noreply@mulearn.org>`,
      to: email,
      subject: `Access Pass Confirmed - ${user_id.startsWith('@') ? user_id : '@' + user_id} | μFIFA`,
      text: `Hello ${name}, welcome to μFIFA'26! Your arena access pass has been confirmed under Player ID ${user_id.startsWith('@') ? user_id : '@' + user_id} playing for ${teamLabel}. You can view your access pass online here: ${publicUrl || 'N/A'}. Join your squad WhatsApp group here: ${whatsappUrl}`,
      html: getNewUserEmailHtml(player, { ticketUrl: publicUrl }),
      attachments: [
        {
          filename: "ticket.png",
          content: pngContent,
          cid: "ticket_image",
        },
      ],
    });
    console.log(
      `Email successfully sent to ${email}. MessageId: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    console.error("Nodemailer failed to send registration email:", error);
    return false;
  }
}

export async function sendRegistrationOtpEmail({ email, name, otp }) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    return false;
  }

  try {
    const info = await mailTransporter.sendMail({
      from: `"noreply@mulearn.org" <noreply@mulearn.org>`,
      to: email,
      subject: `Verify your registration OTP | μFIFA`,
      text: `Hello ${name}, welcome to μFIFA'26! Use the one-time password (OTP) ${otp} to verify your email and complete your registration. This OTP is valid for 10 minutes.`,
      html: `
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
      `,
    });
    console.log(
      `OTP email successfully sent to ${email}. MessageId: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    console.error("Nodemailer failed to send OTP email:", error);
    return false;
  }
}
