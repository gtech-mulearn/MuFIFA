const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

// 1. Load project environment variables
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const envLocalPath = path.join(__dirname, "..", ".env.local");

  const loadFile = (filePath) => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.substring(0, firstEqual).trim();
            const val = trimmed.substring(firstEqual + 1).trim();
            process.env[key] = val;
          }
        }
      });
    }
  };

  loadFile(envPath);
  loadFile(envLocalPath);
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables are missing.");
  process.exit(1);
}

// 2. Setup SMTP transporter
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP credentials are not fully configured in environment variables.",
    );
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

// 3. Generate random 8-character password
function generatePassword() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 4. Send email helper
async function sendEmail(transporter, player, password) {
  const smtpFrom =
    process.env.SMTP_FROM ||
    `"mailer@mufifa.mulearn.org" <mailer@mufifa.mulearn.orglearn.org>`;
  const fromAddress = `"mailer@mufifa.mulearn.org" <${
    smtpFrom.includes("<") ? smtpFrom.split("<")[1].replace(">", "") : smtpFrom
  }>`;

  const displayUserId = player.user_id.startsWith("@")
    ? player.user_id
    : `@${player.user_id}`;
  const subjectLine = `Your Arena Access Password | μFIFA`;
  const textContent = `Hello ${player.name},

Welcome to μFIFA'26! We have updated the arena login system to use passwords. 

Your account login details are:
- Player ID: ${displayUserId}
- Password: ${password}

Please use this password to log in. You can reset it on the login page using your registered email and phone number if needed.

Best regards,
μFIFA Arena Team`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Arena Password | μFIFA</title>
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
            <div class="greeting">Hello ${player.name},</div>
            <div class="message">
              Welcome to <strong>μFIFA'26</strong>! We have updated the arena login system to use passwords. A secure 8-digit password has been generated for your account. Use this password along with your Player ID to log in:
            </div>
            <div class="password-box">${password}</div>
            <div class="note">
              <strong>Player ID:</strong> ${displayUserId}<br><br>
              Please use the password above to access your pass and predictions dashboard. Keep this password safe. If you ever forget it, you can reset it on the login page using your registered email and phone number.
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

  await transporter.sendMail({
    from: fromAddress,
    to: player.email,
    subject: subjectLine,
    text: textContent,
    html: htmlContent,
  });
}

// 5. Main execution routine
async function main() {
  let transporter;
  try {
    transporter = getTransporter();
  } catch (err) {
    console.error("Transporter Setup Failed:", err.message);
    process.exit(1);
  }

  console.log("Fetching users with NULL password_hash...");
  try {
    const fetchUrl = `${supabaseUrl}/rest/v1/registrations?password_hash=is.null&select=*`;
    const res = await fetch(fetchUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch players: ${await res.text()}`);
    }

    const players = await res.json();
    console.log(
      `Found ${players.length} players requiring password initialization.\n`,
    );

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      console.log(
        `[${i + 1}/${players.length}] Processing player: ${player.email} (${player.user_id})`,
      );

      try {
        // A. Patch password_hash in Supabase
        const patchUrl = `${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`;
        const patchRes = await fetch(patchUrl, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password_hash: hashedPassword,
          }),
        });

        if (!patchRes.ok) {
          throw new Error(`Database patch failed: ${await patchRes.text()}`);
        }

        // B. Send confirmation email
        await sendEmail(transporter, player, plainPassword);
        console.log(`   - Success: Saved password and sent email.`);
      } catch (playerErr) {
        console.error(
          `   - Error processing player ${player.email}:`,
          playerErr.message,
        );
      }
    }

    console.log("\nPassword initialization process complete.");
  } catch (err) {
    console.error("Batch Execution Error:", err.message);
  }
}

main();
