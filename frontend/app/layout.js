import { Outfit } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import Script from "next/script";
import LayoutContent from "@/components/LayoutContent";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  metadataBase: new URL("https://mufifa.mulearn.org"),
  title: {
    default: "µFifa '26",
    template: "%s | µFifa '26",
  },
  description:
    "For the Game. For the Spirit. A Flagship Gamified Hackathon by µLearn Foundation & µLearn MCE. Complete technical drills, wager µ-Point, and lead your squad to the top of the standings.",
  keywords: [
    "µFifa",
    "mulearn",
    "hackathon",
    "gamified",
    "football",
    "fifa",
    "coding",
    "challenges",
    "MCE",
    "sports",
    "tech",
    "squads",
  ],
  authors: [{ name: "µLearn MCE", url: "https://mulearn.org" }],
  creator: "µLearn Foundation & µLearn MCE",
  publisher: "µLearn MCE",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "µFifa '26 | Gamified Hackathon",
    description:
      "For the Game. For the Spirit. A Flagship Gamified Hackathon by µLearn Foundation & µLearn MCE. Complete technical drills, wager µ-Points, and lead your squad to the top of the standings.",
    url: "https://mufifa.mulearn.org",
    siteName: "µFifa '26",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/MMP_Banner.jpg",
        width: 800,
        height: 600,
        alt: "µFifa '26",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "µFifa '26 | Gamified Hackathon",
    description:
      "For the Game. For the Spirit. A Flagship Gamified Hackathon by µLearn Foundation & µLearn MCE. Complete technical drills, wager µ-Points, and lead your squad to the top of the standings.",
    images: ["/MMP_Banner.jpg"],
    creator: "@mulearn",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

function LayoutShell({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#090A0F] text-slate-100 font-sans relative">
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "x70gvmvnxk");
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({ children }) {
  return (
    <LayoutShell>
      <LayoutContent>{children}</LayoutContent>
    </LayoutShell>
  );
}
