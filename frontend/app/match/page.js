"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MatchCard from "@/components/match/MatchCard";
import CorrectPredictorsModal from "@/components/match/CorrectPredictorsModal";
import Header from "../tasks/components/Header/Header";

const EXCLUDED_STATUSES = new Set(["POSTPONED", "CANCELLED", "SUSPENDED"]);

const TAB_STATUSES = {
  matches: new Set(["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"]),
  results: new Set(["FINISHED"]),
};

const FLAGS = {
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

const getInitials = (name) => {
  if (!name) return "⚽";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function TopPredictorsList({
  predictors,
  searchQuery,
  setSearchQuery,
  hasMore,
  onLoadMore,
  loading,
}) {
  const getRankStyle = (rank) => {
    if (rank === 1)
      return "bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.15)]";
    if (rank === 2)
      return "bg-[#94A3B8]/10 border-[#94A3B8]/30 text-[#E2E8F0] shadow-[0_0_8px_rgba(148,163,184,0.15)]";
    if (rank === 3) return "bg-[#D97706]/10 border-[#D97706]/30 text-[#F97316]";
    return "bg-white/5 border-white/10 text-slate-400";
  };

  const renderPodiumItem = (pred, rankPosition) => {
    if (!pred) return null;

    const config = {
      1: {
        borderClass: "border-4 border-[#FBBF24] shadow-[0_0_15px_rgba(251,191,36,0.25)]",
        badgeBg: "bg-[#FBBF24] text-black",
        standClass: "bg-gradient-to-b from-[#FBBF24]/15 via-[#FBBF24]/3 to-transparent border-t border-x border-[#FBBF24]/30 shadow-[0_-8px_24px_rgba(251,191,36,0.06)]",
        standHeight: "h-[120px] sm:h-[140px] md:h-[160px]",
        standNum: "1",
        standNumClass: "text-[#FBBF24]/10 text-7xl sm:text-8xl",
        avatarSize: "w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28",
        containerClass: "max-w-[120px] sm:max-w-[160px] md:max-w-[210px] z-10",
      },
      2: {
        borderClass: "border-4 border-[#94A3B8] shadow-[0_0_15px_rgba(148,163,184,0.15)]",
        badgeBg: "bg-[#94A3B8] text-black",
        standClass: "bg-gradient-to-b from-[#94A3B8]/10 via-[#94A3B8]/3 to-transparent border-t border-x border-[#94A3B8]/20 shadow-[0_-8px_24px_rgba(148,163,184,0.03)]",
        standHeight: "h-[90px] sm:h-[110px] md:h-[130px]",
        standNum: "2",
        standNumClass: "text-[#94A3B8]/10 text-6xl sm:text-7xl",
        avatarSize: "w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24",
        containerClass: "max-w-[105px] sm:max-w-[140px] md:max-w-[180px]",
      },
      3: {
        borderClass: "border-4 border-[#D97706] shadow-[0_0_15px_rgba(217,119,6,0.15)]",
        badgeBg: "bg-[#D97706] text-black",
        standClass: "bg-gradient-to-b from-[#D97706]/10 via-[#D97706]/3 to-transparent border-t border-x border-[#D97706]/20 shadow-[0_-8px_24px_rgba(217,119,6,0.03)]",
        standHeight: "h-[70px] sm:h-[90px] md:h-[105px]",
        standNum: "3",
        standNumClass: "text-[#D97706]/10 text-5xl sm:text-6xl",
        avatarSize: "w-12 h-12 sm:w-18 sm:h-18 md:w-20 md:h-20",
        containerClass: "max-w-[95px] sm:max-w-[130px] md:max-w-[160px]",
      }
    }[rankPosition];

    const displayCollege = pred.institution && pred.institution !== "N/A"
      ? pred.institution
      : "No College Listed";

    return (
      <div className={`flex-1 flex flex-col items-center text-center group ${config.containerClass}`}>
        {/* Avatar Container */}
        <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1">
          <div className={`rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 ${config.avatarSize} ${config.borderClass}`}>
            {pred.avatar_url ? (
              <img
                src={pred.avatar_url}
                alt={pred.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                {getInitials(pred.name)}
              </span>
            )}
          </div>
          {/* Overlapping rank badge */}
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-white/20 text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-lg ${config.badgeBg}`}>
            {rankPosition}
          </span>
        </div>

        {/* User profile info */}
        <div className="w-full flex flex-col items-center mb-2 min-h-[90px] sm:min-h-[105px] justify-end">
          <Link
            href={`/profile/${pred.user_id}`}
            className="text-[10px] sm:text-xs font-bold text-slate-200 group-hover:text-white hover:underline transition-colors truncate max-w-full"
          >
            {pred.name}
          </Link>
          <span className="text-[8px] sm:text-[9px] text-slate-500 truncate max-w-full font-semibold">
            {displayCollege}
          </span>
          <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-[7px] font-black uppercase tracking-wider border shrink-0 ${
            pred.domain?.toLowerCase() === "cybersecurity"
              ? "bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]"
              : pred.domain?.toLowerCase() === "web"
              ? "bg-[#3B82F6]/10 border-[#3B82F6]/20 text-[#3B82F6]"
              : "bg-white/5 border-white/10 text-slate-400"
          }`}>
            {pred.domain || "N/A"}
          </span>
          <span className="text-xs sm:text-sm md:text-base font-black text-[#00E676] mt-1 tracking-wide flex items-center gap-0.5">
            {pred.predictionPoints > 0 ? `+${pred.predictionPoints}` : pred.predictionPoints}{" "}
            <span className="text-[8px] text-slate-500 font-semibold uppercase">pts</span>
          </span>
        </div>

        {/* Stand Box */}
        <div className={`w-full border-t border-x rounded-t-[1.5rem] relative flex items-end justify-center pb-4 sm:pb-6 ${config.standClass} ${config.standHeight}`}>
          <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black select-none pointer-events-none ${config.standNumClass}`}>
            {config.standNum}
          </span>
          <span className="text-[8px] sm:text-[10px] text-slate-400 font-extrabold uppercase tracking-wide z-10 select-none">
            {pred.correctPredictions}/{pred.totalPredictions}
          </span>
        </div>
      </div>
    );
  };

  const hasPodium = searchQuery.trim() === "" && predictors.length >= 3;
  const listItems = hasPodium ? predictors.slice(3) : predictors;
  const listOffset = hasPodium ? 3 : 0;

  return (
    <div className="bg-glass-card rounded-2xl py-5 px-0 border border-white/10 backdrop-blur-md shadow-xl flex flex-col gap-4 w-full">
      {/* Search Bar */}
      <div className="px-4">
        <input
          type="text"
          placeholder="Search predictor by name or @username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] w-full transition-colors"
        />
      </div>

      {/* Podium stand for top 3 */}
      {hasPodium && (
        <div className="px-2 sm:px-4 pb-6 pt-4 flex justify-center items-end gap-2 sm:gap-4 border-b border-white/5 bg-white/[0.01]">
          {renderPodiumItem(predictors[1], 2)} {/* 2nd Place */}
          {renderPodiumItem(predictors[0], 1)} {/* 1st Place */}
          {renderPodiumItem(predictors[2], 3)} {/* 3rd Place */}
        </div>
      )}

      {/* Standings Table Header */}
      <div className="flex items-center justify-between py-2 px-4 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span>Rank & Player</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline">Squad</span>
          <span>Predictions</span>
          <span className="hidden sm:inline">Exact</span>
          <span className="hidden sm:inline">Accuracy</span>
          <span className="min-w-[60px] text-right">Points</span>
        </div>
      </div>

      {/* Standings Table Rows */}
      <div className="flex flex-col">
        {listItems.length > 0 ? (
          listItems.map((pred, idx) => {
            const rank = idx + 1 + listOffset;
            return (
              <div
                key={pred.user_id}
                className="flex items-center justify-between py-3.5 px-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group last:border-b-0 animate-in fade-in duration-200"
              >
                {/* Left side: Rank, Avatar, Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border shrink-0 ${getRankStyle(rank)}`}
                  >
                    {rank}
                  </span>

                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                    {pred.avatar_url ? (
                      <img
                        src={pred.avatar_url}
                        alt={pred.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400">
                        {getInitials(pred.name)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 text-left">
                    <Link
                      href={`/profile/${pred.user_id}`}
                      className="text-xs font-semibold text-slate-200 group-hover:text-white hover:underline transition-colors truncate"
                    >
                      {pred.name}
                    </Link>
                    <span className="text-[9px] font-medium text-slate-500 truncate">
                      @{pred.user_id}
                    </span>
                  </div>
                </div>

                {/* Right side: Stats */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  {/* Squad flag */}
                  {pred.team && FLAGS[pred.team] ? (
                    <span
                      className={`fi fi-${FLAGS[pred.team]} rounded-sm shadow-sm border border-white/10 shrink-0`}
                      style={{ width: "16px", height: "12px" }}
                      title={pred.team}
                    />
                  ) : (
                    <span className="hidden sm:inline-block w-4 h-3 shrink-0" />
                  )}

                  {/* Predictions Count (Correct / Total) */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-slate-200">
                      {pred.correctPredictions}
                      <span className="text-slate-500 font-normal">/{pred.totalPredictions}</span>
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider sm:hidden">
                      {pred.accuracy}%
                    </span>
                  </div>

                  {/* Exact Scores Badge */}
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {pred.exactPredictions} Exact
                  </span>

                  {/* Accuracy Badge */}
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4]">
                    {pred.accuracy}% ACC
                  </span>

                  {/* Prediction Points */}
                  <div className="flex items-center gap-0.5 min-w-[60px] justify-end">
                    <span className={`text-xs font-bold ${pred.predictionPoints > 0 ? "text-[#00E676]" : pred.predictionPoints < 0 ? "text-rose-500" : "text-slate-400"}`}>
                      {pred.predictionPoints > 0 ? `+${pred.predictionPoints}` : pred.predictionPoints}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                      pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 mx-4 text-center text-slate-500 text-xs font-bold border border-white/5 rounded-lg bg-white/[0.005]">
            No predictors found matching your search.
          </div>
        )}
      </div>

      {/* Pagination View More Button */}
      {hasMore && (
        <div className="pt-4 pb-2 text-center border-t border-white/5">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Loading More...
              </>
            ) : (
              "View More Predictors"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("matches");
  const [player, setPlayer] = useState(null);
  const [resultsVisible, setResultsVisible] = useState(2);
  const [orderedMatchIds, setOrderedMatchIds] = useState([]);
  const [selectedMatchForPredictors, setSelectedMatchForPredictors] = useState(null);

  // Top Predictors Tab State
  const [predictors, setPredictors] = useState([]);
  const [predictorsLoading, setPredictorsLoading] = useState(false);
  const [predictorsError, setPredictorsError] = useState(null);
  const [predictorsSearchQuery, setPredictorsSearchQuery] = useState("");
  const [predictorsOffset, setPredictorsOffset] = useState(0);
  const [hasMorePredictors, setHasMorePredictors] = useState(false);

  const fetchTopPredictors = async (reset = false) => {
    setPredictorsLoading(true);
    setPredictorsError(null);
    try {
      const currentOffset = reset ? 0 : predictorsOffset;
      const res = await fetch(
        `/api/v1/predictions/top?limit=12&offset=${currentOffset}&search=${encodeURIComponent(
          predictorsSearchQuery
        )}`
      );
      const data = await res.json();
      if (res.ok && data?.success) {
        if (reset) {
          setPredictors(data.data ?? []);
          setPredictorsOffset((data.data ?? []).length);
        } else {
          setPredictors((prev) => [...prev, ...(data.data ?? [])]);
          setPredictorsOffset((prev) => prev + (data.data ?? []).length);
        }
        setHasMorePredictors(data.pagination?.hasMore ?? false);
      } else {
        setPredictorsError(data?.error?.message || "Failed to load top predictors");
      }
    } catch {
      setPredictorsError("Failed to load top predictors");
    } finally {
      setPredictorsLoading(false);
    }
  };

  // Load predictors on tab switch
  useEffect(() => {
    if (activeTab === "top_predictors") {
      fetchTopPredictors(true);
    }
  }, [activeTab]);

  // Debounced search trigger for predictors
  useEffect(() => {
    if (activeTab !== "top_predictors") return;

    const delayDebounceFn = setTimeout(() => {
      fetchTopPredictors(true);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [predictorsSearchQuery]);

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

  // For the matches tab, show live matches and upcoming matches in the next 24 hours
  // For results, paginate newest-first
  const filteredMatches =
    activeTab === "matches"
      ? allFiltered
          .filter((m) => {
            if (m.status === "IN_PLAY" || m.status === "PAUSED") return true;
            const matchTime = new Date(m.utcDate).getTime();
            const diffMs = matchTime - Date.now();
            return diffMs <= 24 * 60 * 60 * 1000;
          })
          .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      : activeTab === "results"
        ? allFiltered
            .slice()
            .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
            .slice(0, resultsVisible)
        : allFiltered;

  // Next 4 matches in 24 hours for matches tab layout
  const top4Matches =
    activeTab === "matches" ? filteredMatches.slice(0, 4) : [];
  const top4Ids = top4Matches.map((m) => String(m.id));
  const top4IdsKey = top4Ids.join(",");

  useEffect(() => {
    if (top4Ids.length > 0) {
      setOrderedMatchIds((prev) => {
        const prevSet = new Set(prev);
        const isMatch =
          top4Ids.length === prev.length &&
          top4Ids.every((id) => prevSet.has(id));
        if (!isMatch) {
          return top4Ids;
        }
        return prev;
      });
    } else {
      setOrderedMatchIds([]);
    }
  }, [top4IdsKey]);

  // Derived main and row matches
  const mainMatch =
    top4Matches.find((m) => String(m.id) === String(orderedMatchIds[0])) ||
    top4Matches[0];

  const rowMatches =
    orderedMatchIds.length > 0
      ? orderedMatchIds
          .slice(1)
          .map((id) => top4Matches.find((m) => String(m.id) === String(id)))
          .filter(Boolean)
      : top4Matches.slice(1);

  const handleSwap = (clickedId) => {
    setOrderedMatchIds((prev) => {
      const currentOrder = prev.length > 0 ? prev : top4Ids;
      const copy = [...currentOrder];
      const idx = copy.indexOf(String(clickedId));
      if (idx > 0) {
        const temp = copy[0];
        copy[0] = copy[idx];
        copy[idx] = temp;
      }
      return copy;
    });
  };

  const liveCount = matches.filter(
    (m) =>
      TAB_STATUSES.matches.has(m.status) &&
      (m.status === "IN_PLAY" || m.status === "PAUSED"),
  ).length;

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10 px-4 md:px-8 pt-6">
      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.png')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/60 via-[#030207]/40 to-[#030207]/80 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* TOP N ARENA BANNER (with stadium background) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        {/* Stadium background overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.png')` }}
        />
        {/* Dark gradient overlay to fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        {/* HEADER */}
        <div className="relative z-10">
          <Header title="MATCH" highlightedTitle="PREDICTIONS" subtitle="Predict match outcomes, track live stats and climb the standings." />
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col gap-6">

        {/* Main Content Area: Grid layout for desktop column and sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Left / Main column (Match Content) */}
          <div className="lg:col-span-9 flex flex-col gap-6 w-full">
            {/* Tab Bar */}
            <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-full max-w-md mx-auto">
              {[
                { key: "matches", label: "Matches" },
                { key: "results", label: "Results" },
                { key: "top_predictors", label: "Top Predictors" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key);
                    setResultsVisible(2);
                  }}
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
            {activeTab === "top_predictors" ? (
              predictorsLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Loading Top Predictors...
                  </span>
                </div>
              ) : predictorsError ? (
                <div className="rounded-2xl bg-black/40 border border-red-500/30 p-6 flex flex-col items-center gap-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <span className="text-red-400 text-lg">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-400">{predictorsError}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Could not load predictors data from the server.
                    </p>
                  </div>
                  <button
                    onClick={fetchTopPredictors}
                    className="px-5 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <TopPredictorsList
                  predictors={predictors}
                  searchQuery={predictorsSearchQuery}
                  setSearchQuery={setPredictorsSearchQuery}
                  hasMore={hasMorePredictors}
                  onLoadMore={() => fetchTopPredictors(false)}
                  loading={predictorsLoading}
                />
              )
            ) : loading ? (
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
                {activeTab === "matches"
                  ? "No matches scheduled in the next 24 hours"
                  : "No matches available"}
              </div>
            ) : (
              /* Match cards list/row layout */
              <div className="flex flex-col gap-6">
                {activeTab === "matches" ? (
                  <>
                    {/* 1. Full-size Main Match at the top */}
                    {mainMatch && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-[#06B6D4] uppercase tracking-wider">
                          Selected Match Details
                        </span>
                        <MatchCard
                          key={`focused-${mainMatch.id}`}
                          match={mainMatch}
                          player={player}
                          onPredictionSaved={fetchMatches}
                          compact={false}
                        />
                      </div>
                    )}

                    {/* 2. Grid Row of the other 3 matches */}
                    {rowMatches.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Next Matches
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {rowMatches.map((match) => (
                            <MatchCard
                              key={`compact-${match.id}`}
                              match={match}
                              player={player}
                              onPredictionSaved={() => {}}
                              compact={true}
                              isSelected={false}
                              onClick={() => handleSwap(match.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Results Tab View: simple vertical list of concluded matches */}
                    <div className="flex flex-col gap-4">
                      {filteredMatches.map((match) => (
                        <MatchCard
                          key={`result-${match.id}`}
                          match={match}
                          player={player}
                          onPredictionSaved={() => {}}
                          compact={false}
                          onClick={() => setSelectedMatchForPredictors(match)}
                        />
                      ))}
                    </div>
                    {resultsVisible < allFiltered.length && (
                      <button
                        onClick={() => setResultsVisible((v) => v + 2)}
                        className="mx-auto px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        Show More
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right column: Guidelines & Rules (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 sticky top-6 lg:mt-[85px]">
            <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col gap-4 text-xs">
              <h3 className="font-bold text-sm text-[#06B6D4] border-b border-white/5 pb-2 uppercase tracking-wider">
                Predictions Playbook
              </h3>

              <ul className="flex flex-col gap-3.5 text-slate-300">
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] mt-1.5 shrink-0 block" />
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Exact Score: +25 μPoints
                    </strong>
                    Predict the exact goal counts for both teams (e.g.,
                    predicted 2-1 and it ended 2-1).
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0 block" />
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Correct Outcome: +2 μPoints
                    </strong>
                    Predict the winning team or draw correctly, but not goals
                    (e.g., predicted 2-1 and it ended 1-0).
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0 block" />
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Incorrect Pick: -1 μPoint
                    </strong>
                    Predicting the wrong outcome (e.g., predicted home win and
                    it ended as away win or draw).
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0 block" />
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Predictions Timeline
                    </strong>
                    Predictions open daily from{" "}
                    <strong className="text-white font-semibold">
                      10:00 AM to 10:30 PM IST
                    </strong>
                    . Editing locks instantly at match kick-off.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {selectedMatchForPredictors && (
        <CorrectPredictorsModal
          match={selectedMatchForPredictors}
          onClose={() => setSelectedMatchForPredictors(null)}
        />
      )}
    </div>
  );
}
