export const metadata = {
  title: "Dashboard",
  description:
    "Your µFIFA '26 command center. View your player stats, µPoints balance, referral program, team standings, and upcoming challenges all in one place.",
  openGraph: {
    title: "Player Dashboard | µFIFA '26",
    description:
      "Your µFIFA '26 command center — player stats, µPoints, referrals, and team standings.",
    url: "https://mufifa.mulearn.org/dashboard",
  },
  twitter: {
    title: "Player Dashboard | µFIFA '26",
    description:
      "Your µFIFA '26 command center — player stats, µPoints, referrals, and team standings.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function DashboardLayout({ children }) {
  return children;
}
