import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Community Guidelines",
  description:
    "Official µFIFA '26 Community Guidelines and Fair Play Playbook. Learn about tournament rules, the penalty system, prohibited conduct, and how to report violations.",
  url: "/community-guidelines",
});

export default function CommunityGuidelinesLayout({ children }) {
  return children;
}
