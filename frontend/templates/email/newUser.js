import { TEAM_WHATSAPP_LINKS, TEAM_FLAGS } from "../../utils/constants";

function formatIssuedDate(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getNewUserEmailHtml(player, assets = {}) {
  const { name, user_id, team, domain, created_at } = player;
  const teamLabel = TEAM_FLAGS[team] || team || "Assigned Team";
  const whatsappUrl = TEAM_WHATSAPP_LINKS[team] || "https://chat.whatsapp.com/";
  const issuedOn = formatIssuedDate(created_at);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>μFifa '26 - Arena Access Pass</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #090A0F;
            color: #f1f5f9;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            padding: 32px 0;
            background:
              radial-gradient(circle at top right, rgba(79, 70, 229, 0.12), transparent 34%),
              radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.14), transparent 34%),
              #090A0F;
          }
          .container {
            max-width: 440px;
            margin: 0 auto;
            padding: 0 18px;
          }
          .intro {
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.7;
            margin: 0 0 18px 0;
          }
          .ticket {
            position: relative;
            background: rgba(32, 3, 5, 0.94);
            border: 2px dashed rgba(6, 182, 212, 0.4);
            border-radius: 28px;
            padding: 24px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.14);
          }
          .header {
            position: relative;
            display: table;
            width: 100%;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .header-left,
          .header-right {
            display: table-cell;
            vertical-align: middle;
          }
          .header-right {
            text-align: right;
          }
          .brand {
            color: #f8fafc;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }
          .brand-row {
            display: table;
            width: 100%;
          }
          .brand-lockup {
            display: inline-block;
            white-space: nowrap;
          }
          .brand-logo {
            display: inline-block;
            vertical-align: middle;
            margin-right: 6px;
          }
          .brand-separator {
            display: inline-block;
            vertical-align: middle;
            width: 1px;
            height: 18px;
            background: rgba(255, 255, 255, 0.2);
            margin: 0 8px 0 2px;
          }
          .brand-title {
            display: inline-block;
            vertical-align: middle;
          }
          .status {
            display: inline-block;
            background: rgba(6, 182, 212, 0.1);
            border: 1px solid rgba(6, 182, 212, 0.3);
            color: #06B6D4;
            padding: 5px 9px;
            border-radius: 7px;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }
          .grid {
            position: relative;
            display: table;
            width: 100%;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
          .cell {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 10px;
          }
          .label {
            display: block;
            color: #64748b;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .value {
            display: block;
            color: #f8fafc;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.4;
            word-break: break-word;
          }
          .value-cyan {
            color: #06B6D4;
          }
          .value-pink {
            color: #4F46E5;
          }
          .footer {
            position: relative;
            padding-top: 14px;
          }
          .issued-label {
            color: #475569;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 0.2em;
            text-transform: uppercase;
          }
          .issued-value {
            color: #94a3b8;
            font-size: 10px;
            font-weight: 600;
            margin-top: 4px;
          }
          .button-wrap {
            text-align: center;
            margin-top: 18px;
          }
          .button {
            display: inline-block;
            padding: 13px 22px;
            border-radius: 14px;
            background: #25d366;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            box-shadow: 0 0 22px rgba(37, 211, 102, 0.24);
          }
          .note {
            margin: 18px 0 0 0;
            color: #94a3b8;
            font-size: 11px;
            line-height: 1.7;
            text-align: center;
          }
          .footer-text {
            margin-top: 20px;
            text-align: center;
            color: #475569;
            font-size: 9px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <p class="intro">
              Your registration is confirmed. Here is your arena access pass and your squad WhatsApp joining link.
            </p>
            <div class="ticket">
              <div class="header">
                <div class="header-left">
                  <div class="brand-row">
                    <div class="brand-lockup">
                      <img src="https://drive.google.com/uc?export=view&id=1cILlNpbyz0MFe9kJznGg1a-PS17L11Gz" width="10" height="28" alt="World Cup Trophy" class="brand-logo">
                      <img src="https://drive.google.com/uc?export=view&id=1tSjhy_aDU1lu9e8iXjM7vw1ArAgmDhy6" width="62" height="28" alt="muLearn Logo" class="brand-logo">
                      <span class="brand-separator"></span>
                      <span class="brand brand-title">Arena Access Pass</span>
                    </div>
                  </div>
                </div>
                <div class="header-right">
                  <span class="status">Confirmed</span>
                </div>
              </div>

              <div class="grid">
                <div class="cell">
                  <span class="label">Player Name</span>
                  <span class="value">${name}</span>
                </div>
                <div class="cell">
                  <span class="label">Player ID</span>
                  <span class="value value-cyan">@${user_id}</span>
                </div>
              </div>

              <div class="grid">
                <div class="cell">
                  <span class="label">Selected Team</span>
                  <span class="value">${teamLabel}</span>
                </div>
                <div class="cell">
                  <span class="label">Squad Domain</span>
                  <span class="value value-pink">${domain}</span>
                </div>
              </div>

              <div class="footer">
                <div class="issued-label">Issued On</div>
                <div class="issued-value">${issuedOn}</div>
              </div>
            </div>

            <div class="button-wrap">
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="button">
                Join ${teamLabel} WhatsApp Group
              </a>
            </div>

            <p class="note">
              Keep this pass for reference. You have also been credited with 10 μ-Points.
            </p>

            <div class="footer-text">
              &copy; 2026 μLearn Foundation. All rights reserved.<br>
              This is an automated event confirmation email.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export { getNewUserEmailHtml };
