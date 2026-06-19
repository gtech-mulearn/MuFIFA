import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Leaderboard",
  description:
    "Live µFIFA '26 leaderboard rankings. See the top players, nation standings, and squad domain scores updated in real time across Coder, Creative, Maker, and Strategist disciplines.",
  url: "/leaderboard",
});

export default function LeaderboardLayout({ children }) {
  return children;
}
