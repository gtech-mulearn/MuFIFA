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
  const { name, user_id, team, created_at } = player;
  const teamLabel = TEAM_FLAGS[team] || team || "Assigned Team";
  const whatsappUrl = TEAM_WHATSAPP_LINKS[team] || "https://chat.whatsapp.com/";
  const displayId = user_id.startsWith("@") ? user_id : `@${user_id}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Pass Confirmed | μFIFA</title>
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
              radial-gradient(circle at top right, rgba(79, 70, 229, 0.15), transparent 40%),
              radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.15), transparent 40%),
              #090a0f;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background: rgba(19, 25, 39, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo-text {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #ffffff;
            margin: 0;
            text-transform: uppercase;
          }
          .logo-subtext {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.25em;
            color: #06b6d4;
            margin: 4px 0 0 0;
            text-transform: uppercase;
          }
          .greeting {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 16px 0;
          }
          .message {
            font-size: 15px;
            line-height: 1.7;
            color: #94a3b8;
            margin: 0 0 24px 0;
          }
          .highlight-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 28px;
            text-align: left;
          }
          .highlight-item {
            font-size: 14px;
            margin: 8px 0;
            color: #cbd5e1;
          }
          .highlight-label {
            font-weight: 600;
            color: #06b6d4;
            display: inline-block;
            width: 100px;
          }
          .ticket-wrap {
            margin: 32px 0;
            text-align: center;
          }
          .ticket-img {
            max-width: 100%;
            height: auto;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(6, 182, 212, 0.15);
          }
          .cta-wrap {
            text-align: center;
            margin: 32px 0 24px 0;
          }
          .btn-primary {
            display: inline-block;
            padding: 14px 28px;
            border-radius: 14px;
            background: #25d366;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            box-shadow: 0 8px 24px rgba(37, 211, 102, 0.3);
            transition: all 0.2s ease;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            padding-top: 28px;
            text-align: center;
          }
          .footer-title {
            font-size: 13px;
            font-weight: 700;
            color: #94a3b8;
            margin: 0 0 6px 0;
            letter-spacing: 0.05em;
          }
          .footer-desc {
            font-size: 11px;
            line-height: 1.6;
            color: #64748b;
            margin: 0 0 16px 0;
          }
          .footer-desc a {
            color: #06b6d4;
            text-decoration: none;
          }
          .footer-copyright {
            font-size: 10px;
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
              <p class="logo-subtext">Arena Access Pass</p>
            </div>

            <!-- Greetings & Message -->
            <div class="greeting">Hello ${name},</div>
            <div class="message">
              Welcome to <strong>μFIFA'26</strong>! We are absolutely thrilled to have you onboard for the ultimate celebration of innovation, sportsmanship, and peer achievement. Your registration is officially confirmed!
            </div>
            
            <div class="message">
              Below is your digital arena access pass. You have also been credited with <strong>10 μPoints</strong> in your account as a registration milestone reward. Keep practicing and get ready for the kickoff!
            </div>

            <!-- Highlight Details -->
            <div class="highlight-box">
              <div class="highlight-item">
                <span class="highlight-label">Player ID:</span> ${displayId}
              </div>
              <div class="highlight-item">
                <span class="highlight-label">Squad:</span> ${teamLabel}
              </div>
            </div>

            <!-- Access Pass Image -->
            <div class="ticket-wrap">
              <img src="cid:ticket_image" class="ticket-img" alt="μFIFA '26 Arena Access Pass" width="500">
            </div>

            <!-- Squad Call to Action -->
            <div class="message" style="text-align: center; margin-bottom: 12px;">
              Ready to connect with your team? Join your official squad channel on WhatsApp:
            </div>
            <div class="cta-wrap">
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                Join ${teamLabel} Squad
              </a>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-title">μLearn Foundation</div>
              <div class="footer-desc">
                Empowering next-generation professionals through peer learning, building in public, and micro-networking. Discover more opportunities at <a href="https://mulearn.org" target="_blank" rel="noopener noreferrer">mulearn.org</a>.
              </div>
              <p class="footer-copyright">
                &copy; 2026 μLearn Foundation. All rights reserved.<br>
                This is an automated confirmation email. Please do not reply directly.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export { getNewUserEmailHtml };
