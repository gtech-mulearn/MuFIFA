import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Register",
  description:
    "Join the µFIFA World Cup 2026 — pick your nation, choose your squad domain, and start competing. Register now to earn µPoints, climb leaderboards, and build your portfolio.",
  url: "/register",
});

export default function RegisterLayout({ children }) {
  return children;
}
