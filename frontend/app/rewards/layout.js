import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Rewards Marketplace",
  description:
    "Claim real-life match tickets, profile cosmetic upgrades, and digital assets. Use your earned µPoints to unlock exclusive rewards.",
  url: "/rewards",
});

export default function RewardsLayout({ children }) {
  return children;
}
