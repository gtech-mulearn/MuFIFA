const BASE_URL = "https://mufifa.mulearn.org";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const playerId = decodeURIComponent(id);

  // Attempt to fetch basic player info server-side for rich OG tags
  let playerName = playerId;
  let playerTeam = "";
  let playerDomain = "";

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(playerId)}&select=name,team,domain,avatar_url&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          next: { revalidate: 300 },
        }
      );

      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0) {
          playerName = rows[0].name || playerId;
          playerTeam = rows[0].team || "";
          playerDomain = rows[0].domain || "";
        }
      }
    }
  } catch {
    // Fallback to playerId if fetch fails
  }

  const title = `${playerName}'s Player Card`;
  const teamStr = playerTeam ? ` | Team ${playerTeam}` : "";
  const domainStr = playerDomain ? ` | ${playerDomain}` : "";
  const description = `View ${playerName}'s µFIFA '26 player card${teamStr}${domainStr}. Check stats, badges, and rank on the leaderboard.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | µFIFA '26`,
      description,
      url: `${BASE_URL}/profile/${encodeURIComponent(playerId)}`,
      type: "profile",
    },
    twitter: {
      title: `${title} | µFIFA '26`,
      description,
    },
  };
}

export default function ProfileLayout({ children }) {
  return children;
}
