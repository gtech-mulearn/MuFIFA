import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Script from "next/script";

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
    "Bet Big. Build Bigger. A Flagship Gamified Hackathon by µLearn Foundation & µLearn MCE. Complete technical drills, wager µ-Coins, and lead your squad to the top of the standings.",
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
      "Bet Big. Build Bigger. A Flagship Gamified Hackathon by µLearn Foundation & µLearn MCE. Complete technical drills, wager µ-Coins, and lead your squad to the top of the standings.",
    url: "https://mufifa.mulearn.org",
    siteName: "µFifa '26",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
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
      "Bet Big. Build Bigger. A Flagship Gamified Hackathon by µLearn Foundation & µLearn MCE. Complete technical drills, wager µ-Coins, and lead your squad to the top of the standings.",
    images: ["/logo.png"],
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#04060d] text-slate-100 font-sans relative">
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "x70gvmvnxk");
          `}
        </Script>
        <Navbar />
        <Ticker />
        <main className="flex-1 flex flex-col w-full relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
