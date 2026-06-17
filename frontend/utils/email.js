import nodemailer from "nodemailer";
import { getNewUserEmailHtml } from "../templates/email/newUser";
import { TEAM_FLAGS, TEAM_WHATSAPP_LINKS } from "./constants";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "SMTP credentials are not fully configured in environment variables. Email dispatch is disabled.",
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function getOtpEmailHtml(name, otp) {
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
              This code is valid for 5 minutes. If you did not request this verification, please ignore this email.
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

export async function sendRegistrationOtpEmail({ email, name, otp }) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const smtpFrom =
    process.env.SMTP_FROM ||
    `"mailer@mufifa.mulearn.org" <mailer@mufifa.mulearn.org>`;
  const fromAddress = `"mailer@mufifa.mulearn.org" <${smtpFrom.includes("<") ? smtpFrom.split("<")[1].replace(">", "") : smtpFrom}>`;

  try {
    const htmlContent = getOtpEmailHtml(name, otp);
    const textContent = `Hello ${name}, welcome to μFIFA'26! Use the Verification Code: ${otp} to verify your email and complete your registration. This Verification Code is valid for 5 minutes.`;
    const subjectLine = `Verify your registration Verification Code | μFIFA'26`;

    await transporter.sendMail({
      from: fromAddress,
      to: "sreeju@sreeju.net",
      subject: subjectLine,
      text: textContent,
      html: htmlContent,
    });

    console.log(
      `[Next.js SMTP] Verification code email sent successfully to: ${email}`,
    );
    return true;
  } catch (error) {
    console.error(
      "[Next.js SMTP] Failed to send Verification Code email:",
      error,
    );
    return false;
  }
}

export async function sendRegistrationEmail(player) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3005";
  const backendApiKey = process.env.BACKEND_API_KEY || "";
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "[Next.js SMTP] Supabase configuration missing. Cannot generate ticket.",
    );
    return false;
  }

  try {
    // 1. Call Hono backend to generate ticket and upload to Supabase storage
    const headers = {
      "Content-Type": "application/json",
    };
    if (backendApiKey) {
      headers["X-Internal-API-Key"] = backendApiKey;
    }

    console.log(
      "[Next.js SMTP] Requesting ticket PNG rendering from Hono backend...",
    );
    const response = await fetch(`${backendUrl}/api/v1/generate-ticket`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        player,
        supabaseUrl,
        supabaseKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Next.js SMTP] Hono ticket generation failed:", errorText);
      return false;
    }

    const result = await response.json();
    if (!result.success || !result.ticketUrl || !result.ticketBase64) {
      console.error(
        "[Next.js SMTP] Hono ticket generation response invalid:",
        result,
      );
      return false;
    }

    const { ticketUrl, ticketBase64 } = result;

    // 2. Patch registrations table with ticketUrl
    if (player.id) {
      try {
        const dbRes = await fetch(
          `${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ticket_url: ticketUrl,
            }),
          },
        );
        if (!dbRes.ok) {
          console.warn(
            "[Next.js SMTP] Failed to update ticket_url in registration record:",
            await dbRes.text(),
          );
        } else {
          console.log(
            "[Next.js SMTP] Ticket URL successfully updated in registration record.",
          );
        }
      } catch (dbErr) {
        console.warn(
          "[Next.js SMTP] Failed to patch registrations table:",
          dbErr.message,
        );
      }
    }

    // 3. Construct and send access pass email using local transporter
    const transporter = getTransporter();
    if (!transporter) return false;

    const smtpFrom =
      process.env.SMTP_FROM ||
      `"mailer@mufifa.mulearn.org" <mailer@mufifa.mulearn.org>`;
    const fromAddress = `"mailer@mufifa.mulearn.org" <${smtpFrom.includes("<") ? smtpFrom.split("<")[1].replace(">", "") : smtpFrom}>`;

    const displayUserId = player.user_id.startsWith("@")
      ? player.user_id
      : `@${player.user_id}`;
    const teamLabel = TEAM_FLAGS[player.team] || player.team;
    const whatsappUrl =
      TEAM_WHATSAPP_LINKS[player.team] || "https://chat.whatsapp.com/";

    const subjectLine = `Access Pass Confirmed - ${player.user_id} | μFIFA`;
    const textContent = `Hello ${player.name},

Welcome to μFIFA'26! We are thrilled to have you join us for the ultimate celebration of sportsmanship, innovation, and peer learning.

Your arena access pass has been officially confirmed:
- Player ID: ${displayUserId}
${player.plainPassword ? `- Password: ${player.plainPassword}\n` : ""}- Team: ${teamLabel}

Your digital access pass is attached to this email.

Join your official squad channel on WhatsApp here to connect with your team: ${whatsappUrl}

Best regards,
μLearn Foundation`;

    const htmlContent = getNewUserEmailHtml(player, ticketUrl);

    await transporter.sendMail({
      from: fromAddress,
      to: player.email,
      subject: subjectLine,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: "ticket.png",
          content: Buffer.from(ticketBase64, "base64"),
          cid: "ticket_image",
        },
      ],
    });

    console.log(
      `[Next.js SMTP] Ticket email sent successfully to: ${player.email}`,
    );
    return true;
  } catch (error) {
    console.error(
      "[Next.js SMTP] Failed to generate/send registration email:",
      error,
    );
    return false;
  }
}

export async function sendForgotPasswordEmail({ email, name, tempPassword }) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const smtpFrom =
    process.env.SMTP_FROM ||
    `"mailer@mufifa.mulearn.org" <mailer@mufifa.mulearn.org>`;
  const fromAddress = `"mailer@mufifa.mulearn.org" <${smtpFrom.includes("<") ? smtpFrom.split("<")[1].replace(">", "") : smtpFrom}>`;

  const subjectLine = `Password Reset | μFIFA`;
  const textContent = `Hello ${name},

Your password has been temporarily reset to: ${tempPassword}

Please log in and update your password as soon as possible.

Best regards,
μFIFA Arena Team`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #090a0f; color: #ffffff; padding: 20px; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: rgba(19, 25, 39, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
          <h2 style="color: #ffffff; text-align: center; letter-spacing: 0.15em; font-weight: 800; font-size: 24px; margin-top: 0; margin-bottom: 28px;">μFIFA'26</h2>
          <p style="font-size: 14px; color: #f1f5f9; font-weight: 700; margin-bottom: 16px;">Hello ${name},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">Your password has been temporarily reset as requested. Use the temporary password below to log in:</p>
          <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 14px; padding: 16px 28px; text-align: center; margin-bottom: 24px; box-shadow: 0 0 12px rgba(6, 182, 212, 0.3);">
            <span style="font-size: 20px; font-weight: 800; letter-spacing: 0.1em; color: #06b6d4; font-family: monospace;">${tempPassword}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 28px; line-height: 1.5;">Please log in using this temporary password and update it immediately. If you did not request this reset, please contact the administrator.</p>
          <div style="margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 24px; text-align: center;">
            <div style="font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">μLearn Foundation</div>
            <p style="font-size: 9px; color: #475569; margin: 0;">&copy; 2026 μLearn Foundation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: subjectLine,
      text: textContent,
      html: htmlContent,
    });
    console.log(`[SMTP] Forgot password email sent successfully to: ${email}`);
    return true;
  } catch (error) {
    console.error("[SMTP] Forgot password email send failed:", error);
    return false;
  }
}

export async function sendPlayerForgotPasswordEmail({ email, name, password }) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const smtpFrom =
    process.env.SMTP_FROM ||
    `"mailer@mufifa.mulearn.org" <mailer@mufifa.mulearn.org>`;
  const fromAddress = `"mailer@mufifa.mulearn.org" <${smtpFrom.includes("<") ? smtpFrom.split("<")[1].replace(">", "") : smtpFrom}>`;

  const subjectLine = `Access Password Reset | μFIFA`;
  const textContent = `Hello ${name},

Your player account password for μFIFA'26 has been reset to: ${password}

Please log in and update your profile details as needed.

Best regards,
μFIFA Arena Team`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset | μFIFA</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #090a0f;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #ffffff;
            margin: 0 0 28px 0;
          }
          .greeting {
            font-size: 16px;
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
          .password-box {
            display: inline-block;
            padding: 16px 28px;
            border-radius: 14px;
            background: rgba(6, 182, 212, 0.08);
            border: 1px solid rgba(6, 182, 212, 0.25);
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #06b6d4;
            margin: 8px 0 24px 0;
            text-shadow: 0 0 12px rgba(6, 182, 212, 0.3);
            font-family: monospace;
          }
          .note {
            font-size: 12px;
            color: #64748b;
            margin: 0 0 28px 0;
            line-height: 1.5;
            text-align: left;
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
            <h1 class="logo-text">μFIFA'26</h1>
            <div class="greeting">Hello ${name},</div>
            <div class="message">
              Your player account password has been successfully reset. Use the temporary password below to log in to the arena:
            </div>
            <div class="password-box">${password}</div>
            <div class="note">
              Please use this 8-digit password to log in. You can keep this password or update your profile details as needed. If you did not request this password reset, please contact the administrator.
            </div>
            <div class="footer">
              <div class="footer-title">μLearn Foundation</div>
              <p class="footer-copyright">
                &copy; 2026 μLearn Foundation. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: subjectLine,
      text: textContent,
      html: htmlContent,
    });
    console.log(
      `[SMTP] Player forgot password email sent successfully to: ${email}`,
    );
    return true;
  } catch (error) {
    console.error("[SMTP] Player forgot password email send failed:", error);
    return false;
  }
}
