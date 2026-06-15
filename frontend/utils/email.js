import nodemailer from "nodemailer";
import { getNewUserEmailHtml } from "../templates/email/newUser";
import { TEAM_FLAGS, TEAM_WHATSAPP_LINKS } from "./constants";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

// Resolve __dirname equivalent for ESM (works reliably on both local and Vercel)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

/**
 * Tries multiple candidate paths to find a file, returning the first that exists.
 */
function resolveFile(candidates) {
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

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
 * 1. Reading the SVG template (ticket.svg) which contains the base64-encoded background image
 * 2. Injecting dynamic <text> elements for player name, user ID, and issued date
 * 3. Converting the final SVG to PNG using Sharp
 *
 * This approach completely avoids @napi-rs/canvas and custom font registration issues,
 * and works reliably on Vercel since Sharp is natively supported.
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

  // Resolve ticket.svg with multiple candidate paths
  const svgCandidates = [
    path.join(__dirname, "..", "public", "ticket.svg"),
    path.join(process.cwd(), "public", "ticket.svg"),
    path.join(process.cwd(), ".next", "server", "public", "ticket.svg"),
  ];
  const svgPath = resolveFile(svgCandidates);
  console.log(`[Ticket SVG] Resolved ticket.svg path: ${svgPath}`);

  if (!svgPath) {
    throw new Error(`ticket.svg not found. Tried: ${svgCandidates.join(", ")}`);
  }

  // Read the SVG template
  let svgContent;
  try {
    svgContent = fs.readFileSync(svgPath, "utf-8");
  } catch (err) {
    console.error("[Ticket SVG] Failed to read ticket.svg:", err);
    throw err;
  }

  // Escape dynamic values for safe XML embedding
  const safeName = escapeXml(name);
  const safeUserId = escapeXml(
    user_id.startsWith("@") ? user_id : `@${user_id}`
  );
  const safeDate = escapeXml(issuedOn);

  // SVG text elements to overlay on the ticket
  // Coordinates match the original canvas positions (2128x1177 SVG viewBox)
  // Font: using sans-serif which is universally available in SVG renderers
  const textOverlay = `
  <text x="510" y="582" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900" fill="#2A1E17">${safeName}</text>
  <text x="470" y="742" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#E53935">${safeUserId}</text>
  <text x="430" y="898" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#2A1E17">${safeDate}</text>
`;

  // Inject text elements before the closing </svg> tag
  const closingTagIndex = svgContent.lastIndexOf("</svg>");
  if (closingTagIndex === -1) {
    throw new Error("Invalid SVG: no closing </svg> tag found");
  }

  const finalSvg =
    svgContent.substring(0, closingTagIndex) +
    textOverlay +
    svgContent.substring(closingTagIndex);

  console.log(
    `[Ticket SVG] SVG prepared with dynamic text. Total SVG length: ${finalSvg.length}`
  );

  // Convert SVG to PNG using Sharp
  try {
    const pngBuffer = await sharp(Buffer.from(finalSvg))
      .png()
      .toBuffer();

    console.log(
      `[Ticket SVG] PNG generated successfully. Buffer size: ${pngBuffer.length} bytes`
    );
    return pngBuffer;
  } catch (err) {
    console.error("[Ticket SVG] Sharp SVG-to-PNG conversion failed:", err);
    throw err;
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
    const info = await mailTransporter.sendMail({
      from: `"noreply@mulearn.org" <noreply@mulearn.org>`,
      to: email,
      subject: `Access Pass Confirmed - ${user_id.startsWith('@') ? user_id : '@' + user_id} | μFIFA`,
      text: `Hello ${name}, welcome to μFIFA'26! Your arena access pass has been confirmed under Player ID ${user_id.startsWith('@') ? user_id : '@' + user_id} playing for ${teamLabel}. Join your squad WhatsApp group here: ${whatsappUrl}`,
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
