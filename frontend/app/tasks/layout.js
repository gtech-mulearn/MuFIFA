import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Arena Challenges",
  description:
    "Complete sequential arena progression challenges to earn µPoints, unlock achievement tiers, and level up your team in the µFIFA World Cup 2026.",
  url: "/tasks",
  noIndex: true,
});

export default function TasksLayout({ children }) {
  return children;
}
