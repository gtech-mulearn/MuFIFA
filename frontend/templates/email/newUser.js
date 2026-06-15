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
            margin: 0 auto 20px auto;
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
            <img src="cid:ticket_image" width="404" height="223" alt="μFifa '26 - Arena Access Pass" style="display: block; width: 404px; height: 223px; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; box-shadow: 0 0 40px rgba(6,182,212,0.25); margin: 0 auto 20px auto; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;">

            <div class="button-wrap">
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="button">
                Join ${teamLabel} WhatsApp Group
              </a>
            </div>

            <p class="note">
              Keep this pass for reference. You have also been credited with 10 μPoints.
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
