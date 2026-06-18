import { COMPANY_ADDRESS, COPYRIGHT_TEXT } from "./constants";

// Generates the HTML layout for the one-time password (OTP) verification email.
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
            <div class="header">
              <h1 class="logo-text">μFIFA'26</h1>
            </div>

            <div class="greeting">Hello ${name},</div>
            <div class="message">
              Thank you for starting your registration for <strong>μFIFA'26</strong>! Use the verification code below to confirm your email address and secure your spot in the arena:
            </div>

            <div class="otp-box">${otp}</div>

            <div class="note">
              This code is valid for 5 minutes. If you did not request this verification, please ignore this email.
            </div>

            <div class="footer">
              <div class="footer-title">μLearn Foundation</div>
              <div class="footer-desc">
                Discover professional peer learning communities and micro-networking circles at <a href="https://mulearn.org" target="_blank" rel="noopener noreferrer">mulearn.org</a>.
              </div>
              <p class="footer-copyright">
                ${COPYRIGHT_TEXT}<br>
                ${COMPANY_ADDRESS}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export { getOtpEmailHtml };
