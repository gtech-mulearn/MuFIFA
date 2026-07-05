"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar from "@/app/tasks/components/Sidebar/Sidebar";
import { PlayerProvider, usePlayer } from "@/components/PlayerContext";
import dynamic from "next/dynamic";

const OnboardingModal = dynamic(() => import("@/components/OnboardingModal"), {
  ssr: false,
});

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // State indicating whether the desktop left sidebar is collapsed.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Identify all routes that should render within the Arena Layout
  const isArenaRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/rewards") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/match") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/points-history") ||
    pathname.startsWith("/kuzhiundo") ||
    pathname.startsWith("/captain");

  // Avoid rendering standard headers/footers for administration and sandbox development routes.
  if (isAdmin || pathname === "/development") {
    return <>{children}</>;
  }

  return (
    <PlayerProvider>
      <LayoutInner
        isArenaRoute={isArenaRoute}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        pathname={pathname}
      >
        {children}
      </LayoutInner>
    </PlayerProvider>
  );
}

function LayoutInner({
  isArenaRoute,
  sidebarCollapsed,
  setSidebarCollapsed,
  pathname,
  children,
}) {
  const { player, loading } = usePlayer();

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  const shouldRenderPublic =
    !player &&
    (pathname.startsWith("/leaderboard") ||
      pathname.startsWith("/match") ||
      pathname.startsWith("/profile"));

  if (isArenaRoute && !shouldRenderPublic) {
    return (
      <ArenaLayout
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        pathname={pathname}
      >
        {children}
      </ArenaLayout>
    );
  }

  // Standard public layout (Landing pages, Login/Register)
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col w-full relative">{children}</main>
      <Footer />
    </>
  );
}

function ArenaLayout({
  sidebarCollapsed,
  setSidebarCollapsed,
  pathname,
  children,
}) {
  const { player, loading, refreshPlayer } = usePlayer();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading && !player) {
      window.location.href = "/login";
    }
  }, [player, loading]);

  useEffect(() => {
    if (!loading && player) {
      const onboarded = localStorage.getItem("mufifa_onboarded_v1");
      // Also skip if the player already completed the WhoAmI step (field is set in DB)
      const alreadyOnboarded = onboarded && player.whoami;
      if (!alreadyOnboarded) {
        setShowOnboarding(true);
      } else {
        // Ensure localStorage is in sync so the modal never re-fires
        localStorage.setItem("mufifa_onboarded_v1", "true");
      }
    }
  }, [loading, player]);

  const xp = player?.xp_breakdown || {};
  const totalXp =
    (xp.creativity || 0) +
    (xp.branding || 0) +
    (xp.innovation || 0) +
    (xp.teamwork || 0) +
    (xp.execution || 0);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!player) {
    // Not authenticated — middleware should have caught this, but fallback
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  const mobileTabs = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: (
        <svg
          className="w-5.5 h-5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "Challenges",
      href: "/tasks",
      icon: (
        <svg
          className="w-5.5 h-5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      name: "μPredict",
      href: "/match",
      icon: (
        <svg
          className="w-5.5 h-5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20" />
        </svg>
      ),
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: (
        <svg
          className="w-5.5 h-5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },

    {
      name: "Kuzhiundo",
      href: "/kuzhiundo",
      icon: (
        <Image
          src="/challenges/kuzhiundo/kuzhiundo_logo.webp"
          alt="Kuzhiundo"
          width={22}
          height={22}
          className="object-contain"
        />
      ),
    },
  ];

  // Render the dashboard shell wrapper with sidebar navigation and main panels.
  return (
    <div className="min-h-screen bg-[#030207] text-white flex font-sans relative overflow-hidden w-full">
      {/* Sidebar segment containing desktop controls and app navigation. */}
      <div
        className={`hidden md:block fixed top-0 left-0 h-screen w-64 z-40 transition-transform duration-300 ${
          sidebarCollapsed ? "md:-translate-x-full" : "md:translate-x-0"
        }`}
      >
        <Sidebar player={player} handleLogout={handleLogout} />

        {/* Collapsible navigation drawer toggling control. */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex absolute top-6 left-full -translate-x-1/2 z-50 p-2.5 border border-white/5 hover:border-white/10 bg-slate-900/80 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer items-center justify-center shrink-0 shadow-lg shadow-black/40"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
      </div>

      {/* Content block wrapper containing primary panels. */}
      <div
        className={`flex-1 min-w-0 overflow-y-auto flex flex-col relative z-10 transition-all duration-300 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${
          sidebarCollapsed ? "md:ml-0" : "md:ml-64"
        }`}
      >
        {/* Mobile view top header bar containing navigation shortcut anchors. */}
        <div className="md:hidden flex items-center justify-between bg-[#0b0916]/85 border-b border-white/5 py-2.5 px-4 backdrop-blur-md sticky top-0 z-40">
          <Link href="/" className="h-8 flex items-center justify-center">
            <Image
              src="/Logos/logo.webp"
              alt="Logo"
              width={120}
              height={32}
              className="h-full w-auto object-contain"
              priority
            />
          </Link>

          {/* Mobile navigation layout segment wrapping total player XP level and profile avatar. */}
          <div className="flex items-center gap-3">
            {/* Player XP metrics indicator. */}
            <div
              id="mobile-header-xp"
              className="bg-[#1c1646]/60 border border-violet-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-inner select-none"
            >
              <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider">
                XP
              </span>
              <span className="text-xs font-black text-white">{totalXp}</span>
            </div>

            <Link
              id="mobile-header-profile"
              href={`/profile/${player.user_id}`}
              className="w-9 h-9 rounded-full overflow-hidden border border-violet-500/30 hover:border-violet-500/60 flex items-center justify-center bg-[#121021] hover:scale-105 active:scale-95 transition-all select-none shadow-md"
              title="View Profile"
            >
              {player.avatar_url ? (
                <Image
                  src={player.avatar_url}
                  alt="Profile"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-violet-400 bg-violet-500/10">
                  {player.name
                    ? player.name.trim().substring(0, 2).toUpperCase()
                    : "ME"}
                </div>
              )}
            </Link>
          </div>
        </div>

        <main className="flex-1 w-full relative">{children}</main>

        <Footer />
      </div>

      {/* Tabbed mobile bottom shortcuts menu. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] bg-[#0c0a18]/90 border-t border-white/5 flex items-center justify-around z-40 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
        {mobileTabs.map((item) => {
          const isActive =
            item.name === "Profile"
              ? pathname.startsWith("/profile")
              : pathname === item.href;

          return (
            <Link
              key={item.name}
              id={`mobile-tab-item-${item.name.toLowerCase().replace("μ", "u")}`}
              href={item.href}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                isActive
                  ? "text-violet-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>

      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          player={player}
          refreshPlayer={refreshPlayer}
          sidebarCollapsed={sidebarCollapsed}
        />
      )}
    </div>
  );
}
