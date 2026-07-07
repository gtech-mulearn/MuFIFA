"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { TEAMS, FLAGS, getRankStyle, getInitials } from "../utils";
import Avatar from "../../../components/Avatar";

export default function IndividualStandings() {
  const [playersData, setPlayersData] = useState([]);
  const [playersSearchQuery, setPlayersSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [playersSortOrder, setPlayersSortOrder] = useState("desc");
  const [teamFilter, setTeamFilter] = useState("All");
  const [playersLoading, setPlayersLoading] = useState(false);
  const [hasMorePlayers, setHasMorePlayers] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(playersSearchQuery);
    }, 450);
    return () => clearTimeout(timer);
  }, [playersSearchQuery]);

  const fetchPlayers = useCallback(async (offset, reset = false) => {
    setPlayersLoading(true);
    try {
      const res = await fetch(
        `/api/v1/leaderboard/individuals?limit=12&offset=${offset}&search=${encodeURIComponent(debouncedSearchQuery)}&sort=${playersSortOrder}&team=${encodeURIComponent(teamFilter)}`,
      );
      const data = await res.json();
      if (res.ok && data.success) {
        if (reset) {
          setPlayersData(data.data);
        } else {
          setPlayersData((prev) => [...prev, ...data.data]);
        }
        setHasMorePlayers(data.pagination.hasMore);
      }
    } catch (err) {
      console.error("Failed to fetch players:", err);
    } finally {
      setPlayersLoading(false);
    }
  }, [debouncedSearchQuery, playersSortOrder, teamFilter]);

  useEffect(() => {
    fetchPlayers(0, true);
  }, [fetchPlayers]);

  return (
    <>
      <div className="px-2 sm:px-3">
        <div className="flex gap-2 w-full flex-wrap sm:flex-nowrap">
          <input
            type="text"
            placeholder="Search player name or @username..."
            value={playersSearchQuery}
            onChange={(e) => setPlayersSearchQuery(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] flex-1 transition-colors min-w-[200px]"
          />
          
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-4 py-2 bg-gradient-to-r from-[#1a1438]/80 to-[#110e20]/80 border border-violet-500/30 hover:border-violet-400/50 rounded-lg text-xs font-black uppercase tracking-wider text-violet-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all cursor-pointer shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.1)] outline-none"
          >
            <option value="All" className="bg-[#0f0c1b] text-violet-300 font-black">ALL SQUADS</option>
            {TEAMS.map((t) => (
              <option key={t} value={t} className="bg-[#0f0c1b] text-slate-200 font-bold uppercase">{t}</option>
            ))}
          </select>
          <button
            onClick={() =>
              setPlayersSortOrder((prev) =>
                prev === "desc" ? "asc" : "desc",
              )
            }
            className="px-3 py-2 bg-black/40 border border-white/10 hover:border-white/20 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            Score:{" "}
            {playersSortOrder === "desc"
              ? "High to Low ↓"
              : "Low to High ↑"}
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {playersLoading && playersData.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Loading Leaderboard...
            </span>
          </div>
        ) : playersData.length > 0 ? (
          <>
            {playersData.map((player, idx) => {
              const rank = player.rank || (idx + 1);
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-3 px-2 sm:px-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors group last:border-b-0 animate-in fade-in duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border shrink-0 ${getRankStyle(rank)}`}
                    >
                      {rank}
                    </span>

                    {(() => {
                      let eqFrame = "";
                      if (player.tasks) {
                        if (typeof player.tasks === "object") {
                          eqFrame = player.tasks.equipped_frame || "";
                        } else if (typeof player.tasks === "string") {
                          try {
                            const parsed = JSON.parse(player.tasks);
                            eqFrame = parsed.equipped_frame || "";
                          } catch (e) {}
                        }
                      }
                      return (
                        <Avatar
                          avatarUrl={player.avatar_url}
                          name={player.name}
                          equippedFrame={eqFrame}
                          sizeClass="w-7 h-7 md:w-10 md:h-10"
                          initialsSizeClass="text-[9px]"
                          borderClass="border border-white/5 bg-slate-800"
                        />
                      );
                    })()}

                    <div className="flex flex-col min-w-0 text-left">
                      <Link
                        href={`/profile/${player.user_id}`}
                        className="text-xs sm:text-sm md:text-base font-semibold text-slate-200 group-hover:text-white hover:underline transition-colors truncate"
                      >
                        {player.name}
                      </Link>
                      <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 truncate">
                        @{player.user_id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-slate-400">
                      {player.domain}
                    </span>

                    {FLAGS[player.team] && (
                      <span
                        className={`fi fi-${FLAGS[player.team]} rounded-sm shadow-sm border border-white/10`}
                        style={{ width: "16px", height: "12px" }}
                        title={player.team}
                      />
                    )}

                    <div className="flex items-center gap-0.5 min-w-[50px] justify-end">
                      <span className="text-xs sm:text-base md:text-lg font-bold text-[#06B6D4]">
                        {player.mu_points || 0}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMorePlayers && (
              <div className="pt-4 pb-2 text-center no-print border-t border-white/5">
                <button
                  onClick={() => fetchPlayers(playersData.length, false)}
                  disabled={playersLoading}
                  className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                >
                  {playersLoading ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    "View More Players"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 mx-2 sm:mx-3 text-center text-slate-500 text-xs font-bold border border-white/5 rounded-lg bg-white/[0.005]">
            No players match your search query.
          </div>
        )}
      </div>
    </>
  );
}
