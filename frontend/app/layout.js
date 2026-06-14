import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "µFifa '26",
  description:
    "Bet Big. Build Bigger. A Flagship Gamified Hackathon by µLearn Foundation & µLearn MCE.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#04060d] text-slate-100 font-sans relative">
        {/* <Loader /> */}
        <Navbar />
        <Ticker />
        <main className="flex-1 flex flex-col w-full relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
