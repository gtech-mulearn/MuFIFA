import fs from "fs";

async function run() {
  let SUPABASE_URL = "";
  let SUPABASE_KEY = "";
  try {
    const env = fs.readFileSync(".env", "utf8");
    for (const line of env.split("\n")) {
      const parts = line.split("=");
      if (parts[0] === "SUPABASE_URL") SUPABASE_URL = parts[1].trim();
      if (parts[0] === "SUPABASE_KEY") SUPABASE_KEY = parts[1].trim();
    }
  } catch (e) {
    console.error("Failed to read .env", e);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing env vars: URL =", SUPABASE_URL, "KEY =", SUPABASE_KEY);
    return;
  }

  const url = `${SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  if (res.ok) {
    const data = await res.json();
    console.log("Tables:", Object.keys(data.definitions || {}));
  } else {
    console.error("Fetch failed:", await res.text());
  }
}
run();
