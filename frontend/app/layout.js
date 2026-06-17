import { Outfit } from "next/font/google";
import { Suspense } from "react";
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
    "Build. Compete. Conquer. A gamified experience by µLearn Foundation & µLearn MCE. Complete technical drills, wager μPoints, and lead your squad to the top of the standings.",
  keywords: [
    "µFifa",
    "mulearn",
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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "µFifa '26 | Build. Compete. Conquer.",
    description:
      "Build. Compete. Conquer. A gamified experience by µLearn Foundation & µLearn MCE. Complete technical drills, wager μPoints, and lead your squad to the top of the standings.",
    url: "https://mufifa.mulearn.org",
    siteName: "µFifa '26",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/MMP_Banner.webp",
        width: 800,
        height: 600,
        alt: "µFifa '26",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "µFifa '26",
    description:
      "Build. Compete. Conquer. A gamified experience by µLearn Foundation & µLearn MCE. Complete technical drills, wager μPoints, and lead your squad to the top of the standings.",
    images: ["/MMP_Banner.webp"],
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

export const viewport = {
  themeColor: "#090A0F",
  width: "device-width",
  initialScale: 1,
};

function LayoutShell({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "µFifa '26",
    description:
      "Build. Compete. Conquer. A gamified experience by µLearn Foundation & µLearn MCE. Complete technical drills, wager μPoints, and lead your squad to victory.",
    image: "https://mufifa.mulearn.org/MMP_Banner.webp",
    startDate: "2026-06-15T00:00:00+05:30",
    endDate: "2026-06-25T23:59:59+05:30",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    location: [
      {
        "@type": "VirtualLocation",
        url: "https://mufifa.mulearn.org",
      },
      {
        "@type": "Place",
        name: "Maran Athenaeum",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Trivandrum",
          addressRegion: "Kerala",
          addressCountry: "IN",
        },
      },
    ],
    organizer: [
      {
        "@type": "Organization",
        name: "µLearn Foundation",
        url: "https://mulearn.org",
      },
      {
        "@type": "Organization",
        name: "µLearn MCE",
        url: "https://mulearn.org",
      },
    ],
  };

  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#090A0F] text-slate-100 font-sans relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
      <Suspense fallback={
        <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      }>
        <LayoutContent>{children}</LayoutContent>
      </Suspense>
    </LayoutShell>
  );
}
