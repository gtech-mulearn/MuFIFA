import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";
import {
  getNewUserEmailHtml,
  TEAM_FLAGS,
  TEAM_WHATSAPP_LINKS,
} from "../templates/email/newUser";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

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

function imageToDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "application/octet-stream";
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
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
    const info = await mailTransporter.sendMail({
      from: `"μFifa'26" <${smtpFrom}>`,
      to: email,
      subject: `μFifa'26 Access Pass Confirmed - @${user_id}`,
      text: `Welcome to μFifa'26, ${name}. Your arena access pass is confirmed under Player ID @${user_id} playing for ${teamLabel}. Join your squad WhatsApp group here: ${whatsappUrl}`,
      html: getNewUserEmailHtml(player),
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
        <div style="background:#04060d;padding:32px 16px;font-family:Segoe UI,Arial,sans-serif;color:#e2e8f0;">
          <div style="max-width:480px;margin:0 auto;background:#080b15;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;text-align:center;">
            <div style="font-size:24px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;">Verify Your Email</div>
            <p style="font-size:14px;line-height:1.7;color:#94a3b8;margin:16px 0 24px;">
              Hello ${name}, use the one-time password below to complete your μFifa registration.
            </p>
            <div style="display:inline-block;padding:14px 20px;border-radius:14px;background:rgba(0,229,255,0.12);border:1px solid rgba(0,229,255,0.28);font-size:28px;font-weight:800;letter-spacing:0.35em;color:#00e5ff;">
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
