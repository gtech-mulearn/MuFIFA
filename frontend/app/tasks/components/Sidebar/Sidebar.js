import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function Sidebar({ player, handleLogout }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;

  // Dynamic Level & XP calculations based on mu_points to make it feel alive
  const points = player?.mu_points || 0;
  const level = Math.floor(points / 15) + 1;
  const currentLevelXp = (points % 15) * 100;
  const nextLevelXp = 1500;
  const xpPercentage = Math.min((currentLevelXp / nextLevelXp) * 100, 100);

  const menuItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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
    // {
    //   name: "Rewards",
    //   href: "/rewards",
    //   icon: (
    //     <svg
    //       className="w-5 h-5"
    //       fill="none"
    //       stroke="currentColor"
    //       strokeWidth="2"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
    //       />
    //     </svg>
    //   ),
    // },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      href: player ? `/profile/${player.user_id}` : "#",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  if (player) {
    menuItems.push({
      name: "Kuzhiundo",
      href: "/kuzhiundo",
      icon: (
        <Image
          src="/challenges/kuzhiundo/kuzhiundo_logo.webp"
          alt="Kuzhiundo"
          width={20}
          height={20}
          className="rounded-full p-1 bg-white/90 "
        />
      ),
    });
  }

  return (
    <aside className="w-64 bg-[#05030a] border-r border-white/5 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 p-6">
      <div className="flex flex-col gap-8">
        {/* ARENA LOGO */}
        <Link
          href="/"
          className="flex items-center justify-center group mt-1 w-full"
        >
          <div className="relative w-full h-16 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/Logos/logo.webp"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* SIDEBAR NAVIGATION */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive =
              item.name === "Badges"
                ? pathname.startsWith("/profile") && currentTab === "badges"
                : item.name === "Profile"
                  ? pathname.startsWith("/profile") && currentTab !== "badges"
                  : pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-md shadow-indigo-600/15"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-200"
                  }
                >
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-[#110e20]/80 border border-white/5 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-violet-600/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[9px] font-black tracking-wider text-slate-500">
            μPoints Balance
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-black text-white">{points}</span>
            <Image
              src="/mupoints.webp"
              alt="μPoints"
              width={34}
              height={34}
              className="object-contain"
            />
          </div>
          <Link
            href="/points-history"
            className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-200 hover:text-white mt-3.5 transition-colors"
          >
            <span>View History</span>
            <svg
              className="w-2.5 h-2.5"
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
          </Link>
        </div>

        {/* PROFILE BLOCK & SIGNOUT */}
        <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            {/* Avatar Shield */}
            <div className="relative w-10 h-10 rounded-full border border-white/10 bg-slate-900/60 overflow-hidden flex items-center justify-center shrink-0">
              {player?.avatar_url ? (
                <Image
                  src={player.avatar_url}
                  alt={player.name || "Avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-sm font-black text-slate-300">
                  {player?.name ? player.name[0].toUpperCase() : "P"}
                </span>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-white truncate">
                {player?.name || "Arena Player"}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] font-black text-violet-400 uppercase leading-none bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">
                  LVL {level}
                </span>
                <span className="text-[8px] font-semibold text-slate-500 leading-none">
                  {currentLevelXp}/{nextLevelXp} XP
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full bg-[#14121a] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>

          {/* Sign In / Sign Out Button */}
          {player ? (
            <button
              onClick={handleLogout}
              className="w-full py-2 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 9l-3 3m0 0l3 3m-3-3h12.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
