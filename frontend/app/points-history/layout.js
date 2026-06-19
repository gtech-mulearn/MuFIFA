import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Points History",
  description:
    "Track your µPoints earnings from completed challenges, match predictions, and referrals. See your full points timeline.",
  url: "/points-history",
  noIndex: true,
});

export default function PointsHistoryLayout({ children }) {
  return children;
}
