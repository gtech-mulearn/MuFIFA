"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TeamFlag } from "./MatchCard";

export default function CorrectPredictorsModal({ match, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictors, setPredictors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!match?.id) return;

    const fetchCorrectPredictors = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/predictions/${match.id}/correct`);
        const data = await res.json();
        if (res.ok && data.success) {
          setPredictors(data.data?.correctPredictors ?? []);
        } else {
          setError(data.error?.message || "Failed to load correct predictions.");
        }
      } catch (err) {
        console.error("Error fetching correct predictors:", err);
        setError("Failed to fetch correct predictions.");
      } finally {
        setLoading(false);
      }
    };

    fetchCorrectPredictors();
  }, [match?.id]);

  if (!match) return null;

  const homeDisplayName = match.homeTeam?.name || "Home Team";
  const awayDisplayName = match.awayTeam?.name || "Away Team";
  const homeScore = match.score?.fullTime?.home ?? 0;
  const awayScore = match.score?.fullTime?.away ?? 0;

  // Filter predictors by search query (case-insensitive)
  const filteredPredictors = predictors.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exactScoreCount = predictors.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300 animate-fade-in">
      {/* Modal Card */}
      <div 
        className="w-full max-w-2xl bg-gradient-to-b from-[#131927] to-[#0d101d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 relative flex flex-col gap-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col gap-1 pr-10">
            <span className="text-[10px] text-[#06B6D4] font-bold uppercase tracking-widest">
              Match Winners
            </span>
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">
              Correct Predictions
            </h2>
          </div>

          {/* Match Scoreboard display */}
          <div className="bg-black/35 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <TeamFlag teamName={match.homeTeam?.name} />
              <span className="text-xs font-bold text-white truncate">
                {homeDisplayName}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl flex items-center gap-2 shrink-0">
              <span className="text-base font-extrabold text-white tabular-nums">
                {homeScore}
              </span>
              <span className="text-slate-500 font-bold text-xs">:</span>
              <span className="text-base font-extrabold text-white tabular-nums">
                {awayScore}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0">
              <span className="text-xs font-bold text-white truncate text-right">
                {awayDisplayName}
              </span>
              <TeamFlag teamName={match.awayTeam?.name} />
            </div>
          </div>

          {/* Stats Bar */}
          {!loading && !error && predictors.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-1">
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
                <span className="text-[9px] text-[#00E676] font-bold uppercase tracking-wider">
                  {exactScoreCount} Exact Score Winners (+25 pts)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Search Input */}
        {!loading && !error && predictors.length > 0 && (
          <div className="px-6 pt-4 pb-2">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search player name or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/45 border border-white/5 focus:border-[#4F46E5]/50 outline-none text-xs text-white placeholder-slate-500 pl-11 pr-4 py-3 rounded-xl transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-slate-400 hover:text-white text-[10px] font-bold"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 scrollbar-thin scrollbar-thumb-white/5 hover:scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-slate-400 font-medium">Fetching correct predictions...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="text-red-400 font-bold">!</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">{error}</p>
                <p className="text-[10px] text-slate-500 mt-1">Please close and try again later.</p>
              </div>
            </div>
          ) : predictors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">No Winners Yet</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Nobody predicted the outcome of this match correctly, or the match results are still pending.
                </p>
              </div>
            </div>
          ) : filteredPredictors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <span className="text-xs">No matching players found.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
              {filteredPredictors.map((p) => {
                // Extract initial for avatar fallback
                const initial = p.name ? p.name.charAt(0).toUpperCase() : "?";

                return (
                  <Link
                    key={p.user_id}
                    href={`/profile/${encodeURIComponent(p.user_id)}`}
                    className="bg-black/35 hover:bg-black/55 border border-white/5 hover:border-[#4F46E5]/40 hover:shadow-[0_0_15px_rgba(79,70,229,0.15)] p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer group/card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-inner bg-gradient-to-tr from-emerald-600 to-teal-400">
                        {initial}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <span className="text-xs font-bold text-white group-hover/card:text-[#06B6D4] truncate block transition-colors">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 truncate max-w-[90px]">
                            @{p.user_id}
                          </span>
                          {p.team && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="text-[9px] text-slate-400 font-medium truncate max-w-[100px] uppercase">
                                {p.team}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/25 text-[#00E676] shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                        EXACT SCORE
                      </span>
                      <span className="text-[8px] text-slate-500 font-semibold font-mono">
                        Predicted: {p.predictedScore}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
