import { NextResponse } from "next/server";

async function handleProxy(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get("path");

    if (!targetPath) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST_ERROR",
            message: "Missing 'path' query parameter specifying the target resource.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    // Retrieve backend API base URL from env
    const backendBaseUrl = process.env.BACKEND_API_BASE_URL || "http://localhost:5000/api/v1";
    const targetUrl = `${backendBaseUrl}/${targetPath}`;

    const method = request.method;

    // Construct headers to relay to the backend service
    const headers = new Headers();
    headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");

    // Relay authorization headers if present
    const auth = request.headers.get("Authorization");
    if (auth) {
      headers.set("Authorization", auth);
    }

    const fetchOptions = {
      method,
      headers,
      next: { revalidate: 0 }, // Do not cache proxied API requests
    };

    // Forward request payload body if present (for non-GET/HEAD methods)
    if (method !== "GET" && method !== "HEAD") {
      const bodyText = await request.text();
      if (bodyText) {
        fetchOptions.body = bodyText;
      }
    }

    const backendResponse = await fetch(targetUrl, fetchOptions);
    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Next.js catch-all proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_GATEWAY_ERROR",
          message: "Failed to communicate with registration database server. Make sure backend is running.",
          details: null,
        },
      },
      { status: 502 }
    );
  }
}

export async function GET(request) { return handleProxy(request); }
export async function POST(request) { return handleProxy(request); }
export async function PUT(request) { return handleProxy(request); }
export async function DELETE(request) { return handleProxy(request); }
export async function PATCH(request) { return handleProxy(request); }
