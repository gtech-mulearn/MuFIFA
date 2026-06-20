"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

const THEME = {
  page: "bg-[#f4f7fb] text-slate-900",
  panel: "bg-white/95 border border-slate-200/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
  panelSoft: "bg-white border border-slate-200/90 shadow-[0_14px_32px_rgba(15,23,42,0.05)]",
  input: "bg-white border border-slate-300 text-slate-700 placeholder:text-slate-400 focus:border-sky-500/70",
  accent: "text-sky-700",
  accentBg: "bg-sky-50 border-sky-200",
  muted: "text-slate-500",
  line: "border-slate-200/90",
};

const TEAM_CODES = {
  Brazil: "br",
  Argentina: "ar",
  Portugal: "pt",
  Germany: "de",
  France: "fr",
  England: "gb-eng",
  Spain: "es",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
};

const TEAM_FLAGS = Object.fromEntries(
  Object.entries(TEAM_CODES).map(([team, code]) => [team, code])
);

export { TEAM_FLAGS, THEME };

const ROLE_COLORS = {
  superadmin: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-sky-50 text-sky-700 border-sky-200",
  viewer: "bg-slate-100 text-slate-600 border-slate-200",
};

export { ROLE_COLORS };

function DashboardIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15M7.5 16.5v-6m4.5 6v-10.5m4.5 10.5v-3.75" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.5v-1.125A3.375 3.375 0 0011.625 15h-3.75A3.375 3.375 0 004.5 18.375V19.5M16.5 7.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0ZM10.125 7.875a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0ZM19.5 19.5v-1.125A3.375 3.375 0 0016.875 15.1" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c2.62 1.79 5.333 2.615 8.25 3V12c0 5.065-3.438 8.793-8.25 9.75C7.188 20.793 3.75 17.065 3.75 12V6.75c2.917-.385 5.63-1.21 8.25-3Z" />
    </svg>
  );
}

function PredictionsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CreateTaskIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TestStatIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 00-2 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6m-6-4h6m-6 8h3" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function SearchTestIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602zM10.5 7v7m-3.5-3.5h7" />
    </svg>
  );
}


function Sidebar({ admin, collapsed, setCollapsed }) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/admin", icon: <DashboardIcon /> },
    { name: "Users", href: "/admin/users", icon: <UsersIcon /> },
    { name: "Predictions", href: "/admin/predictions", icon: <PredictionsIcon /> },
    { name: "Tasks", href: "/admin/tasks", icon: <TasksIcon /> },
    { name: "Create Task", href: "/admin/tasks/create", icon: <CreateTaskIcon /> },
    { name: "Test Stat", href: "/admin/test-stat", icon: <TestStatIcon /> },
    { name: "Send Email", href: "/admin/email", icon: <EmailIcon /> },
    { name: "API Search Test", href: "/admin/external-test", icon: <SearchTestIcon /> },
  ];


  if (admin?.role === "superadmin") {
    links.push({ name: "Admins", href: "/admin/admins", icon: <ShieldIcon /> });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full border-r ${THEME.line} bg-white/90 backdrop-blur-xl flex-col z-40 transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.92))] pointer-events-none" />

        <div className="relative h-16 flex items-center border-b border-slate-200/90 px-4 gap-3">
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-[0.18em] text-slate-900 uppercase">
                µFifa Admin
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Operations
              </span>
            </div>
          )}
        </div>

        <nav className="relative flex-1 flex flex-col gap-1.5 p-3 mt-2">
          {links.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href) &&
                  !links.some(
                    (other) =>
                      other.href !== link.href &&
                      other.href.startsWith(link.href) &&
                      pathname.startsWith(other.href)
                  );

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "border-sky-200 bg-sky-50 text-sky-700 shadow-[0_10px_24px_rgba(14,165,233,0.08)]"
                    : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
                title={collapsed ? link.name : undefined}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-current">
                  {link.icon}
                </span>
                {!collapsed && <span>{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="relative h-12 flex items-center justify-center border-t border-slate-200/90 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </aside>

      {/* Mobile Bottom Tab Nav */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t ${THEME.line} bg-white/95 backdrop-blur-md flex items-center justify-around px-2 py-1 z-40 shadow-[0_-8px_30px_rgba(15,23,42,0.08)]`}
      >
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href) &&
                !links.some(
                  (other) =>
                    other.href !== link.href &&
                    other.href.startsWith(link.href) &&
                    pathname.startsWith(other.href)
                );

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? "text-sky-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-200 ${
                isActive ? "bg-sky-50 text-sky-600" : "bg-transparent text-current"
              }`}>
                {link.icon}
              </span>
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function TopBar({ admin, collapsed }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/v1/admin/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    router.push("/admin/login");
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 border-b ${THEME.line} bg-white/88 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-30 transition-all duration-300 left-0 ${
        collapsed ? "md:left-16" : "md:left-60"
      }`}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:block h-9 w-px bg-slate-200" />
        <div>
          <h2 className="text-xs md:text-sm font-semibold tracking-[0.14em] text-slate-900 uppercase">
            Control Panel
          </h2>
          <p className="text-[10px] md:text-[11px] text-slate-500">Administrative overview</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 rounded-full border border-slate-200 bg-slate-50 p-1 md:px-3 md:py-1.5">
          <span className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-white">
            {admin?.username?.slice(0, 2) || "AD"}
          </span>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs text-slate-700">{admin?.username}</span>
            <span
              className={`w-fit text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                ROLE_COLORS[admin?.role] || ROLE_COLORS.viewer
              }`}
            >
              {admin?.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 px-2.5 py-2 md:px-3 md:py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          title="Sign out"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/admin/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.admin) {
            setAdmin(data.admin);
          }
        }
      } catch (err) {
        console.error("Admin auth check error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [isLoginPage]);

  if (isLoginPage) {
    return (
      <div className={`min-h-screen font-sans ${THEME.page}`}>
        {children}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${THEME.page}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 tracking-[0.2em] uppercase">Loading</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminContext.Provider value={admin}>
      <div className={`min-h-screen relative overflow-hidden font-sans ${THEME.page}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(226,232,240,0.9),_transparent_30%)]" />
        <Sidebar admin={admin} collapsed={collapsed} setCollapsed={setCollapsed} />
        <TopBar admin={admin} collapsed={collapsed} />
        <main
          className={`relative pt-16 pb-16 md:pb-0 min-h-screen transition-all duration-300 pl-0 ${
            collapsed ? "md:pl-16" : "md:pl-60"
          }`}
        >
          <div className="p-4 sm:p-6 md:p-8">{children}</div>
        </main>
      </div>
    </AdminContext.Provider>
  );
}
