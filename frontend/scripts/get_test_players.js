const fs = require("fs");
const path = require("path");

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

async function main() {
  const fetchUrl = `${supabaseUrl}/rest/v1/registrations?select=id,user_id,email,phone,password_hash,muid&limit=5`;
  const res = await fetch(fetchUrl, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!res.ok) {
    console.error("Failed to fetch players:", await res.text());
    return;
  }

  const players = await res.json();
  console.log("Top 5 players in DB:");
  console.log(JSON.stringify(players, null, 2));
}

main();
