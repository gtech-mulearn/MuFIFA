import html2canvas from "html2canvas";

/**
 * Captures ticket element as PNG and returns base64 data URL
 * Works on client-side (browser)
 */
export async function captureTicketScreenshot(elementId = "ticket-container") {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    console.log("[Ticket Capture] Starting screenshot...");

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: null,
    });

    console.log("[Ticket Capture] Screenshot created:", {
      width: canvas.width,
      height: canvas.height,
      size: `${(canvas.toBlob.length / 1024).toFixed(2)}KB`,
    });

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("[Ticket Capture] Error:", error);
    throw error;
  }
}

/**
 * Sends the captured ticket screenshot via email
 * @param {Object} options
 * @param {string} options.imageBase64 - Base64 data URL of ticket image
 * @param {string} options.recipientEmail - Email address to send to
 * @param {string} options.playerName - Player name for email
 */
export async function sendTicketViaEmail(options) {
  const { imageBase64, recipientEmail, playerName } = options;

  try {
    console.log("[Ticket Email] Sending ticket to:", recipientEmail);

    const response = await fetch("/api/v1/ticket-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        recipientEmail,
        playerName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send email");
    }

    console.log("[Ticket Email] Success:", data);
    return data;
  } catch (error) {
    console.error("[Ticket Email] Error:", error);
    throw error;
  }
}

/**
 * Full flow: capture screenshot and send via email
 */
export async function captureAndEmailTicket(options) {
  const { elementId = "ticket-container", recipientEmail, playerName } = options;

  try {
    console.log("[Ticket Flow] Starting capture and email flow...");

    // Step 1: Capture screenshot
    const imageBase64 = await captureTicketScreenshot(elementId);
    console.log("[Ticket Flow] Screenshot captured, sending email...");

    // Step 2: Send via email
    const result = await sendTicketViaEmail({
      imageBase64,
      recipientEmail,
      playerName,
    });

    console.log("[Ticket Flow] Complete!");
    return result;
  } catch (error) {
    console.error("[Ticket Flow] Failed:", error);
    throw error;
  }
}
