import { NextResponse } from "next/server";
import { kuzhiundoCache } from "@/utils/kuzhiundoCache";

const CACHE_TTL = 3600000; // 1 hour in milliseconds

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    // Check in-memory cache
    const now = Date.now();
    if (kuzhiundoCache.individuals && (now - kuzhiundoCache.individualsTimestamp < CACHE_TTL)) {
      return NextResponse.json({
        success: true,
        data: kuzhiundoCache.individuals,
        cached: true,
        expires_at: new Date(kuzhiundoCache.individualsTimestamp + CACHE_TTL).toISOString(),
      });
    }

    // Query database for all registrations
    const selectFields = "id,name,user_id,avatar_url,domain,team,socials";
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

    // Map and filter users who have linked Kuzhiundo accounts
    const mappersList = users
      .map((u) => {
        const socials = (() => {
          if (!u.socials) return {};
          if (typeof u.socials === "object") return u.socials;
          try { return JSON.parse(u.socials); } catch { return {}; }
        })();

        if (!socials.kuzhiundo_uuid) return null;

        const submissions = parseInt(socials.kuzhiundo_submissions || "0", 10);
        const points = pointsMap[u.user_id] !== undefined ? pointsMap[u.user_id] : 10;

        return {
          id: u.id,
          name: u.name,
          username: u.user_id,
          avatar_url: u.avatar_url,
          domain: u.domain || "Coder",
          team: u.team,
          submissions: submissions,
          points: points,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return b.submissions - a.submissions;
      });

    // Save to cache
    kuzhiundoCache.individuals = mappersList;
    kuzhiundoCache.individualsTimestamp = now;

    return NextResponse.json({
      success: true,
      data: mappersList,
      cached: false,
      expires_at: new Date(now + CACHE_TTL).toISOString(),
    });

  } catch (error) {
    console.error("Individuals leaderboard endpoint error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
