import { getSEOMetadata } from "@/utils/seo";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const playerId = decodeURIComponent(id);

  // Attempt to fetch basic player info server-side for rich OG tags
  let playerName = playerId;
  let playerTeam = "";
  let playerDomain = "";
  let playerAvatar = "";

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
          playerAvatar = rows[0].avatar_url || "";
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

  // Make avatar URL absolute if it is relative
  let absoluteAvatarUrl = "";
  if (playerAvatar) {
    if (playerAvatar.startsWith("http://") || playerAvatar.startsWith("https://")) {
      absoluteAvatarUrl = playerAvatar;
    } else {
      absoluteAvatarUrl = `https://mufifa.mulearn.org${playerAvatar.startsWith("/") ? "" : "/"}${playerAvatar}`;
    }
  }

  const seo = getSEOMetadata({
    title,
    description,
    url: `/profile/${encodeURIComponent(playerId)}`,
    ogImage: absoluteAvatarUrl || "/MMP_Banner.webp",
  });

  // Customize values specific to profile
  seo.openGraph.type = "profile";
  if (absoluteAvatarUrl) {
    seo.openGraph.images = [
      {
        url: absoluteAvatarUrl,
        width: 800,
        height: 800,
        alt: `${playerName}'s Avatar`,
      },
    ];
    seo.twitter.images = [absoluteAvatarUrl];
  }

  return seo;
}

export default function ProfileLayout({ children }) {
  return children;
}

