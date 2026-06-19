import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Player Dashboard",
  description:
    "Your µFIFA '26 command center. View your player stats, µPoints balance, referral program, team standings, and upcoming challenges all in one place.",
  url: "/dashboard",
  noIndex: true,
});

export default function DashboardLayout({ children }) {
  return children;
}
