import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Forgot Password",
  description:
    "Reset your µFIFA '26 account password. Enter your registered email to receive password recovery instructions.",
  url: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordLayout({ children }) {
  return children;
}
