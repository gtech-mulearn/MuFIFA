import { NextResponse } from "next/server";

async function verifyDiscordSubmission(muid, email, hashtag) {
  if (!muid || !email || !hashtag) {
    return {
      hasError: true,
      statusCode: 400,
      message: {
        general: ["muid, email, and hashtag are required parameters."],
      },
      response: {},
    };
  }

  const url = `https://mulearn.org/api/v1/integrations/mufifa/verify-task/?muid=${muid}&email=${email}&hashtag=${hashtag.replace("#", "%23")}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      try {
        const errorData = await res.json();
        return errorData;
      } catch {
        return {
          hasError: true,
          statusCode: res.status,
          message: {
            general: [`µLearn API returned status code ${res.status}`],
          },
          response: {},
        };
      }
    }

    return await res.json();
  } catch (error) {
    console.error("Error calling external µLearn verification API:", error);
    return {
      hasError: true,
      statusCode: 502,
      message: {
        general: ["µLearn verification server is temporarily unreachable."],
      },
      response: {},
    };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const muid = searchParams.get("muid");
  const email = searchParams.get("email");
  const hashtag = searchParams.get("hashtag");

  const result = await verifyDiscordSubmission(muid, email, hashtag);
  return NextResponse.json(result, {
    status: result.statusCode || (result.hasError ? 400 : 200),
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const muid = body.muid || "";
    const email = body.email || "";
    const hashtag = body.hashtag || "";

    const result = await verifyDiscordSubmission(muid, email, hashtag);
    return NextResponse.json(result, {
      status: result.statusCode || (result.hasError ? 400 : 200),
    });
  } catch (error) {
    return NextResponse.json(
      {
        hasError: true,
        statusCode: 500,
        message: {
          general: ["Internal server error parsing request body."],
        },
        response: {},
      },
      { status: 500 },
    );
  }
}
