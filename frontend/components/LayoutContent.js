"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    // Admin routes render their own layout — no public chrome
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <Ticker />
      <main className="flex-1 flex flex-col w-full relative">{children}</main>
      <Footer />
    </>
  );
}
