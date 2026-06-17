const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "update_db_task2.log");
function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
}

fs.writeFileSync(logFile, "Starting script...\n");

try {
  function loadEnv() {
    const envPath = path.join(__dirname, "..", ".env");
    const envLocalPath = path.join(__dirname, "..", ".env.local");

    const loadFile = (filePath) => {
      if (fs.existsSync(filePath)) {
        log("Loading env file: " + filePath);
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
      } else {
        log("Env file not found: " + filePath);
      }
    };

    loadFile(envPath);
    loadFile(envLocalPath);
  }

  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  log("SUPABASE_URL: " + supabaseUrl);
  log("SUPABASE_KEY: " + (supabaseKey ? "PRESENT" : "MISSING"));

  if (!supabaseUrl || !supabaseKey) {
    log("Error: Supabase environment variables are missing.");
    process.exit(1);
  }

  async function main() {
    try {
      const newGuidelines = '<ul class="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0"><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Verify your credentials by personalizing your profile settings.</span></li><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Open your Player Profile tab and click on the "Edit Details" menu.</span></li><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Input your college/institution alongside a biography describing your specialization.</span></li><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Provide your µID (µLearn ID) in your profile.</span></li><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Submit at least 1 prediction on the match dashboard (outcome doesn\'t matter).</span></li></ul>';

      log("Updating Task 2 guidelines in Supabase...");
      const patchUrl = `${supabaseUrl}/rest/v1/tasks?id=eq.2`;
      
      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      };

      // Since global fetch might be missing in older Node, let's use standard HTTPS module if fetch is missing
      if (typeof fetch === "undefined") {
        log("fetch is undefined, using https module...");
        const https = require("https");
        const url = new URL(patchUrl);
        
        const data = JSON.stringify({ guidelines: newGuidelines });
        
        const options = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname + url.search,
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Length": Buffer.byteLength(data)
          }
        };

        const req = https.request(options, (res) => {
          let body = "";
          res.on("data", (chunk) => { body += chunk; });
          res.on("end", () => {
            log("Status Code: " + res.statusCode);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              log("Successfully updated Task 2 guidelines in Supabase database.");
            } else {
              log("Failed to update guidelines. Response: " + body);
            }
          });
        });

        req.on("error", (e) => {
          log("HTTPS request error: " + e.message);
        });

        req.write(data);
        req.end();
      } else {
        log("Using global fetch...");
        const response = await fetch(patchUrl, {
          method: "PATCH",
          headers: headers,
          body: JSON.stringify({
            guidelines: newGuidelines
          })
        });

        if (!response.ok) {
          log("Failed to update guidelines: " + (await response.text()));
          process.exit(1);
        }

        log("Successfully updated Task 2 guidelines in Supabase database.");
      }
    } catch (innerErr) {
      log("Error in main: " + innerErr.message + "\n" + innerErr.stack);
    }
  }

  main();
} catch (err) {
  log("Global Error: " + err.message + "\n" + err.stack);
}
