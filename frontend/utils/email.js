import nodemailer from "nodemailer";
import { getNewUserEmailHtml } from "../templates/email/newUser";
import { TEAM_FLAGS, TEAM_WHATSAPP_LINKS } from "./constants";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

// Resolve __dirname equivalent for ESM (works reliably on both local and Vercel)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

let fontsRegistered = false;

/**
 * Tries multiple candidate paths to find a file, returning the first that exists.
 */
function resolveFile(candidates) {
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function registerFonts() {
  if (fontsRegistered) return;

  // Multiple candidate paths: __dirname-relative (most reliable), then cwd-based fallback
  const boldCandidates = [
    path.join(__dirname, "fonts", "Roboto-Bold.ttf"),
    path.join(process.cwd(), "utils", "fonts", "Roboto-Bold.ttf"),
    path.join(process.cwd(), ".next", "server", "utils", "fonts", "Roboto-Bold.ttf"),
  ];
  const blackCandidates = [
    path.join(__dirname, "fonts", "Roboto-Black.ttf"),
    path.join(process.cwd(), "utils", "fonts", "Roboto-Black.ttf"),
    path.join(process.cwd(), ".next", "server", "utils", "fonts", "Roboto-Black.ttf"),
  ];

  const fontBoldPath = resolveFile(boldCandidates);
  const fontBlackPath = resolveFile(blackCandidates);

  console.log(`[Canvas Fonts] __dirname = ${__dirname}`);
  console.log(`[Canvas Fonts] process.cwd() = ${process.cwd()}`);
  console.log(`[Canvas Fonts] Resolved Bold path: ${fontBoldPath}`);
  console.log(`[Canvas Fonts] Resolved Black path: ${fontBlackPath}`);

  try {
    if (fontBoldPath) {
      const boldBuffer = fs.readFileSync(fontBoldPath);
      GlobalFonts.register(boldBuffer, "RobotoBold");
      console.log("[Canvas Fonts] Registered RobotoBold successfully from buffer.");
    } else {
      console.error(`[Canvas Fonts] Roboto-Bold.ttf not found. Tried: ${boldCandidates.join(", ")}`);
    }
    if (fontBlackPath) {
      const blackBuffer = fs.readFileSync(fontBlackPath);
      GlobalFonts.register(blackBuffer, "RobotoBlack");
      console.log("[Canvas Fonts] Registered RobotoBlack successfully from buffer.");
    } else {
      console.error(`[Canvas Fonts] Roboto-Black.ttf not found. Tried: ${blackCandidates.join(", ")}`);
    }
    fontsRegistered = true;
  } catch (e) {
    console.error("[Canvas Fonts] Failed to load or register custom fonts from buffer:", e);
  }
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

export async function generateTicketPng(player) {
  // Lazy-load and register fonts inside the execution context
  registerFonts();

  const { name, user_id, created_at } = player;

  // Format the date (e.g. "Jun 15, 2026")
  const dateObj = created_at ? new Date(created_at) : new Date();
  const issuedOn = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Resolve ticket.png with multiple candidate paths
  const ticketCandidates = [
    path.join(__dirname, "..", "public", "ticket.png"),
    path.join(process.cwd(), "public", "ticket.png"),
    path.join(process.cwd(), ".next", "server", "public", "ticket.png"),
  ];
  const baseImgPath = resolveFile(ticketCandidates);
  console.log(`[Canvas Ticket] Resolved ticket.png path: ${baseImgPath}`);

  let image;
  if (!baseImgPath) {
    throw new Error(`ticket.png not found. Tried: ${ticketCandidates.join(", ")}`);
  }
  try {
    const imgBuffer = fs.readFileSync(baseImgPath);
    image = await loadImage(imgBuffer);
  } catch (err) {
    console.error("Failed to read base ticket image:", err);
    throw err;
  }

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // Draw base image
  ctx.drawImage(image, 0, 0);

  // Use custom fonts with system fallback
  const blackFont = fontsRegistered ? "48px RobotoBlack, sans-serif" : "bold 48px sans-serif";
  const boldFont38 = fontsRegistered ? "38px RobotoBold, sans-serif" : "bold 38px sans-serif";
  const boldFont30 = fontsRegistered ? "30px RobotoBold, sans-serif" : "bold 30px sans-serif";

  console.log(`[Canvas Draw] Using fonts: fontsRegistered=${fontsRegistered}, blackFont=${blackFont}`);

  // Draw Name
  ctx.fillStyle = '#2A1E17'; // Dark charcoal/brown
  ctx.font = blackFont;
  ctx.fillText(name, 510, 582);

  // Draw User ID (with @ prefix if not already present)
  const displayId = user_id.startsWith('@') ? user_id : `@${user_id}`;
  ctx.fillStyle = '#E53935'; // Red
  ctx.font = boldFont38;
  ctx.fillText(displayId, 470, 742);

  // Draw Issued On
  ctx.fillStyle = '#2A1E17'; // Dark charcoal/brown
  ctx.font = boldFont30;
  ctx.fillText(issuedOn, 430, 898);

  return canvas.toBuffer("image/png");
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
    const info = await mailTransporter.sendMail({
      from: `"μFifa'26" <${smtpFrom}>`,
      to: email,
      subject: `μFifa'26 Access Pass Confirmed - @${user_id}`,
      text: `Welcome to μFifa'26, ${name}. Your arena access pass is confirmed under Player ID @${user_id} playing for ${teamLabel}. Join your squad WhatsApp group here: ${whatsappUrl}`,
      html: getNewUserEmailHtml(player),
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
      from: `"μFifa'26" <${smtpFrom}>`,
      to: email,
      subject: "μFifa'26 Verify your registration OTP",
      text: `Hello ${name}, your registration OTP is ${otp}. It is valid for 10 minutes. You can request a new OTP after 2 minutes.`,
      html: `
        <div style="background:#090A0F;padding:32px 16px;font-family:Segoe UI,Arial,sans-serif;color:#e2e8f0;">
          <div style="max-width:480px;margin:0 auto;background:#131927;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;text-align:center;">
            <div style="font-size:24px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;">Verify Your Email</div>
            <p style="font-size:14px;line-height:1.7;color:#94a3b8;margin:16px 0 24px;">
              Hello ${name}, use the one-time password below to complete your μFifa registration.
            </p>
            <div style="display:inline-block;padding:14px 20px;border-radius:14px;background:rgba(6, 182, 212,0.12);border:1px solid rgba(6, 182, 212,0.28);font-size:28px;font-weight:800;letter-spacing:0.35em;color:#06B6D4;">
              ${otp}
            </div>
            <p style="font-size:12px;line-height:1.7;color:#94a3b8;margin:24px 0 0;">
              This OTP is valid for 10 minutes. You can request a new OTP after 2 minutes.
            </p>
          </div>
        </div>
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
