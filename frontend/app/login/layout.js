import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Login",
  description:
    "Sign in to your µFIFA '26 player account. Access your dashboard, track your µPoints, and compete on live leaderboards.",
  url: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }) {
  return children;
}
