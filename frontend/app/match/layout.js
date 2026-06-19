import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Match Predictions",
  description:
    "Predict FIFA World Cup 2026 match outcomes on the µFIFA platform. Earn µPoints for correct scores, track live odds, and compete against other players.",
  url: "/match",
  noIndex: true,
});

export default function MatchLayout({ children }) {
  return children;
}
