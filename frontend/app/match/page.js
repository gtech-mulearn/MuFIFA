"use client";

import { useState, useEffect } from "react";
import MatchCard from "@/components/match/MatchCard";
import CorrectPredictorsModal from "@/components/match/CorrectPredictorsModal";

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
  const [orderedMatchIds, setOrderedMatchIds] = useState([]);
  const [selectedMatchForPredictors, setSelectedMatchForPredictors] = useState(null);

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
    <div className="w-full min-h-screen bg-[#090A0F] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12 overflow-hidden">
      {/* Stadium Background Image */}
      <div className="absolute inset-0 z-0 bg-[url('/stadium_bg.png')] bg-cover bg-center opacity-20 pointer-events-none" />
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
      <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex-1 flex flex-col gap-6">
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
        </div>

        {/* Main Content Area: Grid layout for desktop column and sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Left / Main column (Match Content) */}
          <div className="lg:col-span-9 flex flex-col gap-6 w-full">
            {/* Tab Bar */}
            <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-full max-w-sm mx-auto">
              {[
                { key: "matches", label: "Matches" },
                { key: "results", label: "Results" },
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
                      10:00 AM to 6:00 PM IST
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
