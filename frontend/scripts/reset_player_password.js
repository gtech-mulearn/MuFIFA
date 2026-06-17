const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

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
  const newPassword = "Password123!";
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  console.log("Resetting password for alvindennis80 to 'Password123!'...");
  const patchUrl = `${supabaseUrl}/rest/v1/registrations?user_id=eq.alvindennis80`;
  const response = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      password_hash: hashedPassword,
      muid: null, // clear muid to test Task 2 failure first
      bio: "Test bio",
      institution: "Test College",
      avatar_url: "/playerCard/avatar/avatar_1.png"
    })
  });

  if (!response.ok) {
    console.error("Failed to reset password:", await response.text());
    return;
  }

  console.log("Successfully reset password and cleared muid for alvindennis80.");
}

main();
