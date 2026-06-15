import nodemailer from "nodemailer";
import { getNewUserEmailHtml } from "../templates/email/newUser";
import { TEAM_FLAGS, TEAM_WHATSAPP_LINKS } from "./constants";
import fs from "fs";
import path from "path";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

// Register custom fonts for Vercel/serverless environments where system fonts are not present
const fontBoldPath = path.join(process.cwd(), "public", "fonts", "Roboto-Bold.ttf");
const fontBlackPath = path.join(process.cwd(), "public", "fonts", "Roboto-Black.ttf");

if (fs.existsSync(fontBoldPath)) {
  GlobalFonts.registerFromPath(fontBoldPath, "RobotoBold");
}
if (fs.existsSync(fontBlackPath)) {
  GlobalFonts.registerFromPath(fontBlackPath, "RobotoBlack");
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

async function generateTicketPng(player) {
  const { name, user_id, created_at } = player;

  // Format the date (e.g. "Jun 15, 2026")
  const dateObj = created_at ? new Date(created_at) : new Date();
  const issuedOn = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const baseImgPath = path.join(process.cwd(), "public", "ticket.png");
  const image = await loadImage(baseImgPath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // Draw base image
  ctx.drawImage(image, 0, 0);

  // Draw Name
  ctx.fillStyle = '#2A1E17'; // Dark charcoal/brown
  ctx.font = "48px RobotoBlack";
  ctx.fillText(name, 510, 582);

  // Draw User ID (with @ prefix if not already present)
  const displayId = user_id.startsWith('@') ? user_id : `@${user_id}`;
  ctx.fillStyle = '#E53935'; // Red
  ctx.font = "38px RobotoBold";
  ctx.fillText(displayId, 470, 742);

  // Draw Issued On
  ctx.fillStyle = '#2A1E17'; // Dark charcoal/brown
  ctx.font = "30px RobotoBold";
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
