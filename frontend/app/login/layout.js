export const metadata = {
  title: "Login",
  description:
    "Sign in to your µFIFA '26 player account. Access your dashboard, track your µPoints, and compete on live leaderboards.",
  openGraph: {
    title: "Login | µFIFA '26",
    description:
      "Sign in to your µFIFA '26 player account to access your dashboard and compete.",
    url: "https://mufifa.mulearn.org/login",
  },
  twitter: {
    title: "Login | µFIFA '26",
    description:
      "Sign in to your µFIFA '26 player account to access your dashboard and compete.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }) {
  return children;
}
