"use client";

import React, { useState, useEffect } from "react";
import { TEAM_FLAGS, THEME } from "./layout";

const DOMAIN_COLORS = {
  Coder: "#38bdf8",
  Creative: "#14b8a6",
  Maker: "#22c55e",
  Strategist: "#f59e0b",
};

function MetricIcon({ type }) {
  const icons = {
    players: "M4.5 19.5v-1.125A3.375 3.375 0 017.875 15h3.75A3.375 3.375 0 0115 18.375V19.5M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0Z",
    squads: "M3.75 15.75h16.5M7.5 15.75V9.375m4.5 6.375V6.75m4.5 9V11.25",
    domains: "M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9ZM8.25 12h7.5M12 8.25v7.5",
    trend: "M4.5 15.75 9 11.25l3 3L19.5 6.75M19.5 6.75H14.25M19.5 6.75V12",
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[type]} />
    </svg>
  );
}

function TeamBadge({ team }) {
  const code = TEAM_FLAGS[team];
  return code ? (
    <span className={`fi fi-${code} rounded-sm shadow-sm border border-slate-200 shrink-0`} style={{ width: '16px', height: '12px' }} title={team} role="img" aria-label={`${team} flag`} />
  ) : (
    <span className="inline-flex min-w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
      {team.slice(0, 2)}
    </span>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div className={`${THEME.panel} rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-transform duration-300 hover:-translate-y-0.5`}>
      <div
        className="absolute -top-10 -right-8 w-28 h-28 rounded-full opacity-25"
        style={{ filter: "blur(34px)", background: accent }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </span>
        <span className="text-slate-500">{icon}</span>
      </div>
      <span className="relative text-3xl font-bold text-slate-900 tracking-tight">
        {value}
      </span>
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }) {
  return (
    <svg
      className={`w-3 h-3 inline-block ml-1 transition-transform ${sortKey === col ? "text-sky-300" : "text-slate-600"} ${sortKey === col && sortDir === "asc" ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function TeamTable({ teamStats }) {
  const [sortKey, setSortKey] = useState("points");
  const [sortDir, setSortDir] = useState("desc");

  const sorted = [...teamStats].sort((a, b) => {
    const mul = sortDir === "desc" ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * mul;
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
      <div className="px-5 py-4 border-b border-slate-200/90">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
          Squad Standings
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200/90 text-slate-500">
              <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">#</th>
              <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">Team</th>
              <th
                className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                onClick={() => handleSort("count")}
              >
                Members <SortIcon col="count" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                onClick={() => handleSort("points")}
              >
                Points <SortIcon col="points" sortKey={sortKey} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => (
              <tr
                key={team.name}
                className="border-b border-slate-200/70 hover:bg-slate-50 transition-colors"
              >
                <td className="px-5 py-3 text-slate-500 font-mono">{idx + 1}</td>
                <td className="px-5 py-3 text-slate-800 font-semibold">
                  <span className="mr-3 inline-flex align-middle">
                    <TeamBadge team={team.name} />
                  </span>
                  {team.name}
                </td>
                <td className="px-5 py-3 text-right text-slate-600 font-mono">
                  {team.count}
                </td>
                <td className="px-5 py-3 text-right font-mono font-bold text-sky-700">
                  {team.points.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DomainBreakdown({ domainStats, totalUsers }) {
  return (
    <div className={`${THEME.panel} rounded-2xl p-5`}>
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700 mb-4">
        Domain Distribution
      </h3>
      <div className="flex flex-col gap-3">
        {domainStats.map((d) => {
          const pct = totalUsers > 0 ? ((d.count / totalUsers) * 100).toFixed(1) : 0;
          const color = DOMAIN_COLORS[d.name] || "#94a3b8";
          return (
            <div key={d.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">{d.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {d.count} ({pct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyTrend({ dailyTrend }) {
  const maxCount = Math.max(...dailyTrend.map((d) => d.count), 1);

  return (
    <div className={`${THEME.panel} rounded-2xl p-5`}>
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700 mb-4">
        Registration Trend (7 Days)
      </h3>
      <div className="flex items-end gap-2 h-32">
        {dailyTrend.map((d) => {
          const height = (d.count / maxCount) * 100;
          const label = d.date.slice(5);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-slate-500 font-mono">{d.count}</span>
              <div className="w-full flex justify-center">
                <div
                  className="w-full max-w-[28px] rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    background: "linear-gradient(180deg, rgba(56,189,248,0.95), rgba(29,78,216,0.72))",
                  }}
                />
              </div>
              <span className="text-[8px] text-slate-600 font-mono">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/v1/admin/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.error?.message || data.error || "Failed to load stats.");
        }
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-3 px-4 rounded-xl">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
          Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Live tournament statistics and registration overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Players"
          value={stats.totalUsers}
          icon={<MetricIcon type="players" />}
          accent="rgba(56,189,248,0.38)"
        />
        <StatCard
          label="Active Squads"
          value={stats.totalTeams}
          icon={<MetricIcon type="squads" />}
          accent="rgba(20,184,166,0.36)"
        />
        <StatCard
          label="Domains"
          value={stats.domainStats.length}
          icon={<MetricIcon type="domains" />}
          accent="rgba(34,197,94,0.32)"
        />
        <StatCard
          label="Today"
          value={stats.dailyTrend[stats.dailyTrend.length - 1]?.count || 0}
          icon={<MetricIcon type="trend" />}
          accent="rgba(245,158,11,0.28)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TeamTable teamStats={stats.teamStats} />
        </div>

        <div className="flex flex-col gap-6">
          <DomainBreakdown
            domainStats={stats.domainStats}
            totalUsers={stats.totalUsers}
          />
          <DailyTrend dailyTrend={stats.dailyTrend} />
        </div>
      </div>
    </div>
  );
}
