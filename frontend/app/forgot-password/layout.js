export const metadata = {
  title: "Forgot Password",
  description:
    "Reset your µFIFA '26 account password. Enter your registered email to receive password recovery instructions.",
  openGraph: {
    title: "Forgot Password | µFIFA '26",
    description: "Reset your µFIFA '26 account password.",
    url: "https://mufifa.mulearn.org/forgot-password",
  },
  twitter: {
    title: "Forgot Password | µFIFA '26",
    description: "Reset your µFIFA '26 account password.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({ children }) {
  return children;
}
