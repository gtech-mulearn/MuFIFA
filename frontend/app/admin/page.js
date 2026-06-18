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
    players:
      "M4.5 19.5v-1.125A3.375 3.375 0 017.875 15h3.75A3.375 3.375 0 0115 18.375V19.5M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0Z",
    squads: "M3.75 15.75h16.5M7.5 15.75V9.375m4.5 6.375V6.75m4.5 9V11.25",
    domains:
      "M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9ZM8.25 12h7.5M12 8.25v7.5",
    trend: "M4.5 15.75 9 11.25l3 3L19.5 6.75M19.5 6.75H14.25M19.5 6.75V12",
  };

  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[type]} />
    </svg>
  );
}

function TeamBadge({ team }) {
  const code = TEAM_FLAGS[team];
  return code ? (
    <span
      className={`fi fi-${code} rounded-sm shadow-sm border border-slate-200 shrink-0`}
      style={{ width: "16px", height: "12px" }}
      title={team}
      role="img"
      aria-label={`${team} flag`}
    />
  ) : (
    <span className="inline-flex min-w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
      {team.slice(0, 2)}
    </span>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div
      className={`${THEME.panel} rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-transform duration-300 hover:-translate-y-0.5`}
    >
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
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
              <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">
                #
              </th>
              <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">
                Team
              </th>
              <th
                className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                onClick={() => handleSort("count")}
              >
                Members{" "}
                <SortIcon col="count" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                onClick={() => handleSort("points")}
              >
                Points{" "}
                <SortIcon col="points" sortKey={sortKey} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => (
              <tr
                key={team.name}
                className="border-b border-slate-200/70 hover:bg-slate-50 transition-colors"
              >
                <td className="px-5 py-3 text-slate-500 font-mono">
                  {idx + 1}
                </td>
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
          const pct =
            totalUsers > 0 ? ((d.count / totalUsers) * 100).toFixed(1) : 0;
          const color = DOMAIN_COLORS[d.name] || "#94a3b8";
          return (
            <div key={d.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {d.name}
                </span>
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

function RegistrationTrendChart({ trends, fallback }) {
  const [filter, setFilter] = useState("7d"); // "24h" | "7d"
  const [sliderVal, setSliderVal] = useState(24); // slider ranges from 0 (oldest) to 24 (most recent)
  const [currentTimeText, setCurrentTimeText] = useState("");

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
    setCurrentTimeText(formatted);
  }, []);

  const apiKeyMap = {
    "24h": "hourly",
    "7d": "weekly",
  };

  const fullTrend = trends?.[apiKeyMap[filter]] || (filter === "7d" ? fallback : []) || [];
  
  // Slice activeTrend based on filter and sliderVal
  const activeTrend = filter === "24h" ? fullTrend.slice(sliderVal, sliderVal + 24) : fullTrend;

  const maxCount = Math.max(...activeTrend.map((d) => d.count), 1);
  const gridLines = [maxCount, Math.round(maxCount / 2), 0];

  return (
    <div className={`${THEME.panel} rounded-2xl p-5 mt-6 relative overflow-hidden flex flex-col`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            Registration Trend
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {filter === "24h"
              ? "Hourly signups over the last 24 hours (Hours in X-axis, users count in Y-axis)"
              : "Daily signups over the last 7 days"}
          </p>
        </div>
        
        {/* Toggle Filter Buttons */}
        <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[10px] font-bold">
          {[
            { key: "24h", label: "24 Hours" },
            { key: "7d", label: "7 Days" }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1 rounded-md transition-all uppercase tracking-wider cursor-pointer ${
                filter === t.key
                  ? "bg-white text-sky-700 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-900 border border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart and X-Axis Container */}
      <div className="relative flex flex-col pl-10 pr-2 mt-2">
        {/* The Chart (Grid & Bars) */}
        <div className="relative h-36 flex items-end">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
            {gridLines.map((val, idx) => (
              <div key={idx} className="w-full flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-400 w-8 text-right select-none -ml-10">
                  {val}
                </span>
                <div className="flex-1 border-t border-slate-100 border-dashed" />
              </div>
            ))}
          </div>

          {/* Bars Container */}
          <div className="relative w-full h-full flex items-end gap-1 sm:gap-2 z-10">
            {activeTrend.map((d, idx) => {
              const height = (d.count / maxCount) * 100;

              return (
                <div
                  key={d.date || idx}
                  className="flex-1 flex flex-col justify-end items-center h-full group relative min-w-[4px]"
                >
                  {/* Bar Value Tooltip on Hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                     {d.count} {d.count === 1 ? "signup" : "signups"}
                     {filter === "24h" && <span className="text-slate-400 block text-[8px] font-normal">{d.date}</span>}
                  </div>

                  {/* The Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-500 ease-out bg-gradient-to-t from-sky-600/90 to-sky-400 hover:from-sky-500 hover:to-sky-300 shadow-sm cursor-pointer ${
                      filter === "24h" ? "max-w-[12px]" : "max-w-[36px] rounded-t-md"
                    }`}
                    style={{
                      height: `${Math.max(height, 5)}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis Labels Row */}
        <div className="flex w-full mt-2 gap-1 sm:gap-2 text-[8px] sm:text-[9px] text-slate-400 font-mono select-none">
          {activeTrend.map((d, idx) => {
            let formattedLabel = d.label;
            if (filter === "7d") {
              const parts = d.date.split("-");
              const day = parts[2] || "";
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const month = parts[1] ? monthNames[parseInt(parts[1], 10) - 1] : "";
              formattedLabel = `${day} ${month}`;
            }

            return (
              <div key={idx} className="flex-1 text-center truncate">
                {formattedLabel}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slider Controls for 24h filter */}
      {filter === "24h" && fullTrend.length > 24 && (
        <div className="flex flex-col gap-2 mt-4 border-t border-slate-100/80 pt-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span>Slide to view previous hours:</span>
            <span className="font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
              Showing: {activeTrend[0]?.label} to {activeTrend[23]?.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase select-none">Earlier</span>
            <input
              type="range"
              min="0"
              max={fullTrend.length - 24}
              value={sliderVal}
              onChange={(e) => setSliderVal(parseInt(e.target.value, 10))}
              className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 font-bold uppercase select-none">Recent</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-[9px] text-slate-400/95 font-mono select-none border-t border-slate-100/80 pt-3">
        <span>* All times are represented in your local timezone ({typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Local"})</span>
        {currentTimeText && (
          <span className="font-bold text-slate-500">Current Time: {currentTimeText}</span>
        )}
      </div>
    </div>
  );
}

function TaskCompletionsTable({ taskStats }) {
  if (!taskStats || taskStats.length === 0) return null;

  return (
    <div className={`${THEME.panel} rounded-2xl overflow-hidden mt-6 bg-white`}>
      <div className="px-5 py-4 border-b border-slate-200/90 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            Task Completions Overview
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Completion count for each active challenge</p>
        </div>
        <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 font-mono">
          Challenge Stats
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200/90 text-slate-500 bg-slate-50/50">
              <th className="text-left px-5 py-3 font-bold uppercase tracking-wider w-20">
                Task ID
              </th>
              <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">
                Challenge Name
              </th>
              <th className="text-right px-5 py-3 font-bold uppercase tracking-wider w-36">
                Times Completed
              </th>
            </tr>
          </thead>
          <tbody>
            {taskStats.map((task) => (
              <tr
                key={task.id}
                className="border-b border-slate-200/70 hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-5 py-3 text-slate-500 font-mono font-semibold">
                  #{task.id}
                </td>
                <td className="px-5 py-3 text-slate-800 font-semibold truncate max-w-xs sm:max-w-md">
                  {task.title}
                </td>
                <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[11px] shadow-sm">
                    {task.count.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          setError(
            data.error?.message || data.error || "Failed to load stats.",
          );
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
        </div>
      </div>

      <RegistrationTrendChart trends={stats.trends} fallback={stats.dailyTrend} />
      <TaskCompletionsTable taskStats={stats.taskStats} />
    </div>
  );
}
