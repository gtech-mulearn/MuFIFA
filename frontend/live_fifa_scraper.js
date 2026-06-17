/**
 * LiveScore Football Data Scraper
 * --------------------------------
 * Fetches live/scheduled/finished football match data from
 * LiveScore's public CDN API (no auth required).
 *
 * Usage:
 *   node test.js                   → today's matches
 *   node test.js 20260617          → matches for a specific date (YYYYMMDD)
 *   node test.js --live            → only live matches
 *   node test.js --worldcup        → only FIFA World Cup 2026 matches
 */

const BASE_API = "https://prod-cdn-public-api.livescore.com/v1/api/app/date/soccer";

// Match status codes from the API
const STATUS_MAP = {
  NS: "Not Started",
  "1H": "1st Half",
  HT: "Half Time",
  "2H": "2nd Half",
  FT: "Full Time",
  AET: "After Extra Time",
  PEN: "Penalties",
  LIVE: "Live",
  POST: "Postponed",
  CANC: "Cancelled",
  SUSP: "Suspended",
  AP: "After Penalties",
};

/**
 * Format a raw Esd date integer (e.g. 20260617210000) into a readable time string.
 */
function formatKickoff(esd) {
  if (!esd) return "TBD";
  const str = String(esd);
  // Format: YYYYMMDDHHMMSS
  const hours = str.substring(8, 10);
  const mins = str.substring(10, 12);
  return `${hours}:${mins} UTC`;
}

/**
 * Get today's date in YYYYMMDD format.
 */
function getTodayDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/**
 * Fetch matches from LiveScore API for a given date.
 */
async function fetchMatches(date, page = 1) {
  const url = `${BASE_API}/${date}/${page}?locale=en&MD=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`API returned ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Parse the raw API response into a clean, structured format.
 */
function parseMatches(data) {
  if (!data || !data.Stages) return [];

  const allMatches = [];

  for (const stage of data.Stages) {
    const competition = stage.Cnm || "Unknown";
    const country = stage.CompD || stage.Csnm || "Unknown";
    const stageName = stage.Snm || "";
    const compId = stage.CompId || "";

    if (!stage.Events) continue;

    for (const event of stage.Events) {
      const homeTeam = event.T1?.[0]?.Nm || "TBD";
      const awayTeam = event.T2?.[0]?.Nm || "TBD";
      const homeAbbr = event.T1?.[0]?.Abr || "";
      const awayAbbr = event.T2?.[0]?.Abr || "";

      // Score: Tr1 = home goals, Tr2 = away goals
      const homeScore = event.Tr1 ?? null;
      const awayScore = event.Tr2 ?? null;

      const status = event.Eps || "NS";
      const statusText = STATUS_MAP[status] || status;
      const kickoff = formatKickoff(event.Esd);
      const matchId = event.Eid;

      // Live minute (if available)
      const minute = event.Epr || null;

      // TV channels
      const tvChannels = [];
      if (event.Media?.["112"]) {
        for (const m of event.Media["112"]) {
          if (m.type === "TV_CHANNEL" && m.eventId) {
            tvChannels.push(m.eventId);
          }
        }
      }

      allMatches.push({
        matchId,
        competition,
        country,
        stage: stageName,
        compId,
        homeTeam,
        homeAbbr,
        awayTeam,
        awayAbbr,
        homeScore,
        awayScore,
        status,
        statusText,
        kickoff,
        minute,
        tvChannels,
        isWorldCup: competition.toLowerCase().includes("world cup"),
        isLive: ["1H", "2H", "HT", "LIVE"].includes(status),
        isFinished: ["FT", "AET", "PEN", "AP"].includes(status),
      });
    }
  }

  return allMatches;
}

/**
 * Pretty-print a match for the console.
 */
function printMatch(match, index) {
  const scorePart =
    match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore} - ${match.awayScore}`
      : "vs";

  const liveBadge = match.isLive ? " 🔴 LIVE" : "";
  const finishedBadge = match.isFinished ? " ✅" : "";
  const minuteBadge = match.minute ? ` (${match.minute}')` : "";

  console.log(
    `  ${String(index + 1).padStart(2, " ")}. ${match.homeTeam} ${scorePart} ${match.awayTeam}` +
      `${liveBadge}${minuteBadge}${finishedBadge}`
  );
  console.log(
    `      ⏱  ${match.kickoff}  |  ${match.statusText}  |  ${match.competition} — ${match.stage}`
  );

  if (match.tvChannels.length > 0) {
    console.log(`      📺  ${match.tvChannels.join(", ")}`);
  }

  console.log();
}

/**
 * Print a summary table of all matches.
 */
function printSummaryTable(matches) {
  console.log("\n┌─────────────────────────────────────────────────────────────────────────┐");
  console.log("│                        MATCH SUMMARY TABLE                             │");
  console.log("├───────────────────────────┬───────────┬───────────┬─────────────────────┤");
  console.log("│ Match                     │ Score     │ Status    │ Competition         │");
  console.log("├───────────────────────────┼───────────┼───────────┼─────────────────────┤");

  for (const m of matches) {
    const matchStr = `${m.homeAbbr || m.homeTeam.substring(0, 3).toUpperCase()} vs ${m.awayAbbr || m.awayTeam.substring(0, 3).toUpperCase()}`;
    const scoreStr =
      m.homeScore !== null ? `${m.homeScore} - ${m.awayScore}` : m.kickoff;
    const statusStr = m.isLive ? `LIVE ${m.minute || ""}'` : m.statusText;
    const compStr = m.competition.length > 19 ? m.competition.substring(0, 17) + ".." : m.competition;

    console.log(
      `│ ${matchStr.padEnd(25)} │ ${scoreStr.padEnd(9)} │ ${statusStr.padEnd(9)} │ ${compStr.padEnd(19)} │`
    );
  }

  console.log("└───────────────────────────┴───────────┴───────────┴─────────────────────┘\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI flags
  const dateArg = args.find((a) => /^\d{8}$/.test(a));
  const onlyLive = args.includes("--live");
  const onlyWorldCup = args.includes("--worldcup");
  const jsonOutput = args.includes("--json");

  const date = dateArg || getTodayDate();

  console.log(`\n⚽ LiveScore Football Scraper`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📅 Date: ${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`);
  if (onlyLive) console.log(`🔴 Filter: Live matches only`);
  if (onlyWorldCup) console.log(`🏆 Filter: FIFA World Cup 2026 only`);
  console.log();

  try {
    // Fetch page 1 (contains all matches for the day)
    const data = await fetchMatches(date);
    let matches = parseMatches(data);

    // Apply filters
    if (onlyLive) {
      matches = matches.filter((m) => m.isLive);
    }
    if (onlyWorldCup) {
      matches = matches.filter((m) => m.isWorldCup);
    }

    if (matches.length === 0) {
      console.log("  No matches found for the given filters.\n");
      return;
    }

    // JSON output mode
    if (jsonOutput) {
      console.log(JSON.stringify(matches, null, 2));
      return;
    }

    // Group matches by competition
    const grouped = {};
    for (const match of matches) {
      const key = `${match.country} — ${match.competition}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(match);
    }

    // Print grouped matches
    let globalIndex = 0;
    for (const [comp, compMatches] of Object.entries(grouped)) {
      console.log(`\n🏟  ${comp}`);
      console.log(`${"─".repeat(comp.length + 4)}`);
      for (const match of compMatches) {
        printMatch(match, globalIndex++);
      }
    }

    // Stats
    const liveCount = matches.filter((m) => m.isLive).length;
    const finishedCount = matches.filter((m) => m.isFinished).length;
    const scheduledCount = matches.filter((m) => !m.isLive && !m.isFinished).length;

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(
      `📊 Total: ${matches.length} matches | 🔴 Live: ${liveCount} | ✅ Finished: ${finishedCount} | ⏳ Scheduled: ${scheduledCount}`
    );
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Print summary table for World Cup matches if there are any
    const worldCupMatches = matches.filter((m) => m.isWorldCup);
    if (worldCupMatches.length > 0) {
      console.log("🏆 FIFA WORLD CUP 2026 MATCHES");
      printSummaryTable(worldCupMatches);
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
