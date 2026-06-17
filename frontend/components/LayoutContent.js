"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Sidebar from "@/app/tasks/components/Sidebar/Sidebar";

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // State for Arena layout shell
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [player, setPlayer] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Identify all routes that should render within the Arena Layout
  const isArenaRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/match") ||
    pathname.startsWith("/profile");

  // Fetch player details if on an Arena route
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          setPlayer(data.data);
        } else {
          setPlayer(null);
        }
      } catch (err) {
        console.error("Arena layout auth fetch error:", err);
        setPlayer(null);
      } finally {
        setCheckingAuth(false);
      }
    }
    if (isArenaRoute) {
      checkAuth();
    } else {
      setCheckingAuth(false);
    }
  }, [pathname, isArenaRoute]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (res.ok) {
        setPlayer(null);
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Close mobile sidebar on page navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  if (isAdmin || pathname === "/development") {
    // Admin and development routes render their own layout — no public chrome
    return <>{children}</>;
  }

  if (isArenaRoute && checkingAuth) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isArenaRoute && player) {
    // Return immersive Arena dashboard shell with collapsible fixed sidebar
    return (
      <div className="min-h-screen bg-[#030207] text-white flex font-sans relative overflow-hidden w-full">
        {/* Mobile Drawer Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-35 md:hidden backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR (Fixed & Collapsible) */}
        <div className={`fixed top-0 left-0 h-screen w-64 z-40 transition-transform duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "md:-translate-x-full" : "md:translate-x-0"}`}>
          <Sidebar player={player} handleLogout={handleLogout} />
        </div>

        {/* Floating Sidebar Toggle Button for Desktop */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex fixed top-6 z-50 p-2.5 border border-white/5 hover:border-white/10 bg-slate-900/80 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer items-center justify-center shrink-0 shadow-lg shadow-black/40"
          style={{ 
            left: sidebarCollapsed ? "24px" : "280px",
            transition: "left 300ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>

        {/* RIGHT MAIN CONTAINER */}
        <div className={`flex-1 min-w-0 overflow-y-auto flex flex-col relative z-10 transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-0" : "md:ml-64"
        }`}>
          {/* MOBILE MENU TRIGGER BAR */}
          <div className="md:hidden flex items-center justify-between bg-[#0b0916]/85 border-b border-white/5 p-4 backdrop-blur-md relative z-20">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 border border-white/10 hover:border-white/20 bg-slate-900/60 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="h-8 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
            </div>

            <div className="w-9 h-9" />
          </div>

          <main className="flex-1 w-full relative">
            {children}
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  // Standard public layout (Landing pages, Login/Register)
  return (
    <>
      <Navbar />
      <Ticker />
      <main className="flex-1 flex flex-col w-full relative">{children}</main>
      <Footer />
    </>
  );
}
