"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MatchCard from "@/components/match/MatchCard";

const EXCLUDED_STATUSES = new Set(["POSTPONED", "CANCELLED", "SUSPENDED"]);

const TAB_STATUSES = {
  matches: new Set(["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"]),
  results: new Set(["FINISHED"]),
};

export default function MatchPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("matches");
  const [player, setPlayer] = useState(null);
  const [resultsVisible, setResultsVisible] = useState(2);

  // Silently check auth — match page is public, no redirect
  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setPlayer(data.data);
        }
      })
      .catch(() => {
        // Not authenticated — leave player null
      });
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/matches");
      const data = await res.json();
      if (res.ok && data?.success) {
        setMatches(data.data?.matches ?? []);
      } else {
        setError(data?.error?.message || "Failed to load matches");
      }
    } catch {
      setError("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Filter matches for the active tab
  const allFiltered = matches.filter((match) => {
    if (EXCLUDED_STATUSES.has(match.status)) return false;
    return TAB_STATUSES[activeTab]?.has(match.status) ?? false;
  });

  // For the matches tab, show the next 1 upcoming match first, then live matches
  // For results, paginate newest-first
  const filteredMatches =
    activeTab === "matches"
      ? allFiltered
          .slice()
          .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
          .slice(0, 1)
      : activeTab === "results"
      ? allFiltered
          .slice()
          .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
          .slice(0, resultsVisible)
      : allFiltered;

  const liveCount = matches.filter((m) => TAB_STATUSES.matches.has(m.status) && (m.status === "IN_PLAY" || m.status === "PAUSED")).length;

  return (
    <div className="w-full min-h-screen bg-[#090A0F] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12 overflow-hidden">
      {/* Decorative Gradients & Glows */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.06)_0%,#090A0F_80%)] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#090A0F] via-transparent to-[rgba(6,182,212,0.06)] pointer-events-none" />
      <div className="absolute top-[10%] right-[5%] w-[55vw] h-[55vw] bg-[#4f46e5]/8 pointer-events-none rounded-full blur-[130px]" />
      <div className="absolute bottom-[10%] left-[-10%] w-[55vw] h-[55vw] bg-[#06b6d4]/8 pointer-events-none rounded-full blur-[130px]" />

      {/* Honeycomb Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='32' viewBox='0 0 56 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 0 L56 16 L56 32 L28 32 L0 32 L0 16 Z M0 0 L28 16 L56 0' fill='none' stroke='%23ffffff' stroke-width='1.2'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Left Wavy Glow Path */}
      <svg
        className="absolute left-0 top-[20%] w-[250px] h-[500px] pointer-events-none opacity-20 hidden md:block"
        viewBox="0 0 100 500"
      >
        <path
          d="M 0 450 Q 50 350 20 250 T 80 50"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M 0 430 Q 40 340 10 240 T 70 40"
          fill="none"
          stroke="#4F46E5"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      {/* Right Wavy Glow Path */}
      <svg
        className="absolute right-0 top-[15%] w-[250px] h-[500px] pointer-events-none opacity-20 hidden md:block"
        viewBox="0 0 100 500"
      >
        <path
          d="M 100 50 Q 50 150 80 250 T 20 450"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M 100 70 Q 60 160 90 260 T 30 430"
          fill="none"
          stroke="#4F46E5"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      <div className="max-w-3xl mx-auto px-4 w-full relative z-10 flex-1 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-wide text-white uppercase">
              Match Predictions
            </h1>
            <p className="text-[10px] text-slate-400">
              Predict match outcomes and track live odds
            </p>
          </div>
          <Link
            href="/"
            className="cursor-pointer bg-glass border border-white/10 hover:border-white/25 px-4 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition-colors text-center"
          >
            Back to lobby
          </Link>
        </div>

        {/* Tab Bar */}
        <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-full max-w-sm mx-auto">
          {[
            { key: "matches", label: "Matches" },
            { key: "results", label: "Results" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setResultsVisible(2); }}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === key
                  ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
              {key === "matches" && liveCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse block" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          /* Skeleton loading grid */
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white/5 rounded-2xl h-48 border border-white/5"
              />
            ))}
          </div>
        ) : error ? (
          /* Error card */
          <div className="rounded-2xl bg-black/40 border border-red-500/30 p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <span className="text-red-400 text-lg">!</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400">{error}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Could not load match data from the server.
              </p>
            </div>
            <button
              onClick={fetchMatches}
              className="px-5 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredMatches.length === 0 ? (
          /* Empty tab message */
          <div className="py-16 text-center text-slate-500 text-sm font-medium">
            No matches available
          </div>
        ) : (
          /* Match cards */
          <div className="flex flex-col gap-4">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                player={player}
                onPredictionSaved={() => {}}
              />
            ))}
            {activeTab === "results" && resultsVisible < allFiltered.length && (
              <button
                onClick={() => setResultsVisible((v) => v + 2)}
                className="mx-auto px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Show More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
