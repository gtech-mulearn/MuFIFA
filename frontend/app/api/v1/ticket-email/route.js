import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getNewUserEmailHtml } from "@/templates/email/newUser";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("[Ticket Email] SMTP credentials not configured");
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
 * Converts base64 data URL to Buffer
 */
function base64ToBuffer(dataUrl) {
  const base64String = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64String, "base64");
}

export async function POST(request) {
  try {
    const { imageBase64, recipientEmail, playerName } = await request.json();

    // Validate inputs
    if (!imageBase64 || !recipientEmail || !playerName) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: imageBase64, recipientEmail, playerName" 
        },
        { status: 400 }
      );
    }

    const transporter = getTransporter();
    if (!transporter) {
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 503 }
      );
    }

    // Convert base64 to buffer
    const imageBuffer = base64ToBuffer(imageBase64);

    console.log("[Ticket Email] Sending to:", recipientEmail);
    console.log("[Ticket Email] Image size:", `${(imageBuffer.length / 1024).toFixed(2)}KB`);

    // Send email
    const mailOptions = {
      from: smtpFrom,
      to: recipientEmail,
      subject: `Your Ticket - ${playerName}`,
      html: `
        <h2>Welcome ${playerName}!</h2>
        <p>Your ticket has been generated. See attached.</p>
        <p>Get ready for the game!</p>
      `,
      attachments: [
        {
          filename: `ticket-${playerName.replace(/\s+/g, '-')}.png`,
          content: imageBuffer,
          contentType: "image/png",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[Ticket Email] Sent successfully:", info.messageId);

    return NextResponse.json({
      success: true,
      message: "Ticket sent via email",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("[Ticket Email] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
