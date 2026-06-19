import { NextResponse } from "next/server";
import { kuzhiundoCache } from "@/utils/kuzhiundoCache";

const CACHE_TTL = 3600000; // 1 hour in milliseconds

const TEAM_FLAGS = {
  Brazil: "br",
  Argentina: "ar",
  Portugal: "pt",
  Germany: "de",
  France: "fr",
  England: "gb-eng",
  Spain: "es",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
};

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    // Check in-memory cache
    const now = Date.now();
    if (kuzhiundoCache.teams && (now - kuzhiundoCache.teamsTimestamp < CACHE_TTL)) {
      return NextResponse.json({
        success: true,
        data: kuzhiundoCache.teams,
        cached: true,
        expires_at: new Date(kuzhiundoCache.teamsTimestamp + CACHE_TTL).toISOString(),
      });
    }

    // Query database to aggregate stats
    const selectFields = "user_id,team,socials";
    const [res, completionsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/registrations?select=${selectFields}`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      }),
      fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?task_id=eq.4&select=user_id,points_awarded`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      })
    ]);

    if (!res.ok) {
      throw new Error(`Failed to query database: ${await res.text()}`);
    }
    if (!completionsRes.ok) {
      throw new Error(`Failed to query completions: ${await completionsRes.text()}`);
    }

    const users = await res.json();
    const completions = await completionsRes.json();

    const pointsMap = {};
    completions.forEach((c) => {
      pointsMap[c.user_id] = c.points_awarded;
    });

    // Initialize all teams
    const teamsMap = {};
    Object.keys(TEAM_FLAGS).forEach((teamName) => {
      teamsMap[teamName] = {
        team: teamName,
        flag: TEAM_FLAGS[teamName],
        submissions: 0,
        mappersCount: 0,
        points: 0,
      };
    });

    // Aggregate stats from users with linked Kuzhiundo accounts
    users.forEach((u) => {
      const socials = (() => {
        if (!u.socials) return {};
        if (typeof u.socials === "object") return u.socials;
        try { return JSON.parse(u.socials); } catch { return {}; }
      })();

      if (socials.kuzhiundo_uuid && u.team && teamsMap[u.team]) {
        const submissions = parseInt(socials.kuzhiundo_submissions || "0", 10);
        const points = pointsMap[u.user_id] !== undefined ? pointsMap[u.user_id] : 10;
        teamsMap[u.team].submissions += submissions;
        teamsMap[u.team].mappersCount += 1;
        teamsMap[u.team].points += points;
      }
    });

    const teamsList = Object.values(teamsMap).sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.submissions - a.submissions;
    });

    // Save to cache
    kuzhiundoCache.teams = teamsList;
    kuzhiundoCache.teamsTimestamp = now;

    return NextResponse.json({
      success: true,
      data: teamsList,
      cached: false,
      expires_at: new Date(now + CACHE_TTL).toISOString(),
    });

  } catch (error) {
    console.error("Teams leaderboard endpoint error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
