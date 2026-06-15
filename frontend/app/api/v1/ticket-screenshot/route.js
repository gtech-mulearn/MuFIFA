import { NextResponse } from "next/server";
import html2canvas from "html2canvas";
import { JSDOM } from "jsdom";

/**
 * Server-side ticket screenshotter
 * Renders ticket HTML and converts to PNG using html2canvas
 */
async function renderTicketToBuffer(ticketData) {
  const { name, user_id, team, domain, created_at } = ticketData;

  // Format date
  const dateObj = new Date(created_at || new Date());
  const issuedOn = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Create HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; }
        #ticket {
          position: relative;
          width: 2128px;
          height: 1177px;
          background-image: url('file:///public/ticket.png');
          background-size: cover;
          background-position: center;
          font-family: Arial, sans-serif;
          overflow: hidden;
        }
        .text { position: absolute; font-weight: bold; }
        .name {
          left: 510px;
          top: 582px;
          font-size: 48px;
          color: #2A1E17;
          max-width: 600px;
        }
        .user-id {
          left: 470px;
          top: 742px;
          font-size: 38px;
          color: #E53935;
          max-width: 700px;
        }
        .date {
          left: 430px;
          top: 898px;
          font-size: 30px;
          color: #2A1E17;
          max-width: 800px;
        }
      </style>
    </head>
    <body>
      <div id="ticket">
        <div class="text name">${escapeHtml(name)}</div>
        <div class="text user-id">${escapeHtml(user_id)}</div>
        <div class="text date">${escapeHtml(issuedOn)}</div>
      </div>
    </body>
    </html>
  `;

  // Note: This approach has limitations on Vercel
  // For production, use the Canvas approach instead
  throw new Error("Server-side html2canvas not fully supported on Vercel. Use browser screenshot instead.");
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.name || !body.user_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, user_id" },
        { status: 400 }
      );
    }

    // Note: For Vercel, use the client-side approach instead
    return NextResponse.json(
      { 
        success: false, 
        error: "Use client-side screenshot. Call /api/v1/ticket-screenshot with html2canvas on frontend",
        hint: "POST ticket data to /api/v1/ticket-screenshot from browser client"
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Ticket Screenshot] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
