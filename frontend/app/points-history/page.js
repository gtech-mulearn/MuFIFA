"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../tasks/components/Header/Header";

// Icon components for entry types
function TaskIcon() {
  return (
    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.1)]">
      <svg
        className="w-4.5 h-4.5 text-violet-400"
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
    </div>
  );
}

function PredictionIcon() {
  return (
    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
      <svg
        className="w-4.5 h-4.5 text-cyan-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
        />
      </svg>
    </div>
  );
}

function ReferralIcon() {
  return (
    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
      <svg
        className="w-4.5 h-4.5 text-amber-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    </div>
  );
}

function getTypeIcon(type) {
  switch (type) {
    case "task":
      return <TaskIcon />;
    case "prediction":
      return <PredictionIcon />;
    case "referral":
      return <ReferralIcon />;
    default:
      return <TaskIcon />;
  }
}

function getTypeLabel(type) {
  switch (type) {
    case "task":
      return "Challenge";
    case "prediction":
      return "Prediction";
    case "referral":
      return "Referral";
    default:
      return "Other";
  }
}

function getTypeBadgeStyle(type) {
  switch (type) {
    case "task":
      return "bg-violet-500/10 border-violet-500/25 text-violet-400";
    case "prediction":
      return "bg-cyan-500/10 border-cyan-500/25 text-cyan-400";
    case "referral":
      return "bg-amber-500/10 border-amber-500/25 text-amber-400";
    default:
      return "bg-white/5 border-white/10 text-slate-400";
  }
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

// Animated Greek μ component for the summary card
function MuCoinIcon({ size = "w-10 h-10" }) {
  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.35)] shrink-0`}
    >
      <span className="text-sm font-black text-slate-950 select-none">μ</span>
    </div>
  );
}

export default function PointsHistoryPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "task" | "prediction" | "referral"

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/v1/points-history");
        const json = await res.json();
        if (res.ok && json.success) {
          setData(json.data);
        } else if (res.status === 401) {
          router.push("/login");
        } else {
          setError(json.error || "Failed to load points history.");
        }
      } catch (err) {
        console.error("Failed to fetch points history:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [router]);

  const filteredHistory =
    data?.history?.filter((entry) => {
      if (filter === "all") return true;
      return entry.type === filter;
    }) || [];

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "task", label: "Challenges" },
    { key: "prediction", label: "Predictions" },
    { key: "referral", label: "Referrals" },
  ];

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Loading History...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-6 max-w-sm text-center flex flex-col items-center gap-3">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-red-300 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer mt-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10 px-4 md:px-8 pt-6">
      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/60 via-[#030207]/40 to-[#030207]/80 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* Banner Section */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        <div className="relative z-10">
          <Header
            title="POINTS"
            highlightedTitle="HISTORY"
            subtitle="Track every µPoint earned from challenges, predictions, and referrals."
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 flex-1 flex flex-col gap-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Points */}
          <div className="col-span-2 md:col-span-1 bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl flex items-center gap-4 hover:border-white/15 transition-all">
            <MuCoinIcon />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">
                Total µPoints
              </span>
              <span className="text-2xl font-black text-white mt-0.5 drop-shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                {data?.total_points || 0}
              </span>
            </div>
          </div>

          {/* Task Points */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col gap-1.5 hover:border-white/15 transition-all">
            <span className="text-[9px] font-black uppercase tracking-wider text-violet-400">
              Challenges
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-white">
                {data?.summary?.task_points || 0}
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                pts · {data?.summary?.tasks_completed || 0} done
              </span>
            </div>
          </div>

          {/* Prediction Points */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col gap-1.5 hover:border-white/15 transition-all">
            <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400">
              Predictions
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-white">
                {data?.summary?.prediction_points || 0}
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                pts · {data?.summary?.predictions_scored || 0} scored
              </span>
            </div>
          </div>

          {/* Referral Points */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col gap-1.5 hover:border-white/15 transition-all">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
              Referrals
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-white">
                {data?.summary?.referral_points || 0}
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                pts · {data?.summary?.referrals_made || 0} invited
              </span>
            </div>
          </div>
        </div>

        {/* History List Card */}
        <div className="bg-glass-card rounded-xl py-5 px-0 border border-white/10 backdrop-blur-md shadow-xl flex flex-col gap-0">
          {/* Filter Tabs & Controls */}
          <div className="px-3 sm:px-5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5">
            <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    filter === tab.key
                      ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {filteredHistory.length}{" "}
              {filteredHistory.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {/* Timeline List */}
          <div className="flex flex-col">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3.5 py-3.5 px-3 sm:px-5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group last:border-b-0"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Type Icon */}
                  {getTypeIcon(entry.type)}

                  {/* Entry Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      {/* For referrals, show the referred user's avatar + name inline */}
                      {entry.type === "referral" && entry.referral ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5.5 h-5.5 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-black text-amber-400">
                              {entry.referral.name
                                ? entry.referral.name[0].toUpperCase()
                                : "?"}
                            </span>
                          </div>
                          <Link
                            href={`/profile/${entry.referral.user_id}`}
                            className="text-xs font-bold text-slate-200 group-hover:text-white hover:underline transition-colors truncate"
                          >
                            {entry.referral.name}
                          </Link>
                          <span className="text-[9px] text-amber-500/70 font-semibold shrink-0 hidden sm:inline">
                            @{entry.referral.user_id}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                          {entry.title}
                        </span>
                      )}
                      <span
                        className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border shrink-0 ${getTypeBadgeStyle(entry.type)}`}
                      >
                        {getTypeLabel(entry.type)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {entry.type === "referral"
                        ? `Joined ${formatRelativeDate(entry.date)}`
                        : formatRelativeDate(entry.date)}
                    </span>
                  </div>

                  {/* XP Breakdown (for tasks) */}
                  {entry.type === "task" && entry.xp && (
                    <div className="hidden md:flex items-center gap-1">
                      {Object.entries(entry.xp)
                        .filter(([, val]) => val > 0)
                        .slice(0, 3)
                        .map(([key, val]) => (
                          <span
                            key={key}
                            className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-slate-400"
                            title={`${key}: ${val} XP`}
                          >
                            {key.slice(0, 3)} {val}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Prediction details */}
                  {entry.type === "prediction" && entry.details && (
                    <div className="hidden md:flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-slate-400">
                        {entry.details.predicted_home_goals}–
                        {entry.details.predicted_away_goals}
                      </span>
                    </div>
                  )}

                  {/* Points */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.points === null ? (
                      <span className="text-[10px] md:text-xs font-bold text-slate-400 italic">
                        Points will be credited
                      </span>
                    ) : (
                      <>
                        <span
                          className={`text-sm font-black ${entry.points >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {entry.points >= 0 ? "+" : ""}
                          {entry.points}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          pts
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-400">
                    No entries yet
                  </span>
                  <span className="text-[10px] text-slate-500 text-center max-w-[250px]">
                    {filter === "all"
                      ? "Complete challenges, make predictions, or invite friends to start earning µPoints."
                      : `No ${getTypeLabel(filter).toLowerCase()} entries found.`}
                  </span>
                </div>
                <Link
                  href={
                    filter === "prediction"
                      ? "/match"
                      : filter === "referral"
                        ? "/dashboard"
                        : "/tasks"
                  }
                  className="mt-2 px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                >
                  {filter === "prediction"
                    ? "Make Predictions"
                    : filter === "referral"
                      ? "Invite Friends"
                      : "Browse Challenges"}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Back to dashboard link */}
        <div className="flex justify-center mt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
