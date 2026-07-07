"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { getBackendUrl } from "@/utils/api";
import { TEAMS, FLAGS, getSquadPhoto, getSquadPhotoFront, getRankStyle } from "../utils";

export default function SquadStandings({ dbStatus, setDbStatus }) {
  const [teamsData, setTeamsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const initial = TEAMS.map((team, idx) => ({
      rank: idx + 1,
      name: team,
      flag: FLAGS[team],
      count: 0,
      points: 0,
      rankTrend: "stable",
    }));
    setTeamsData(initial);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(getBackendUrl("live-stats"));
        const data = await res.json();

        if (res.ok && data.success) {
          setDbStatus("connected");
          const orgs = data.response?.organisation_count || {};
          const pts = data.response?.squad_points || {};

          const updatedTeams = TEAMS.map((teamName) => ({
            name: teamName,
            flag: FLAGS[teamName],
            count: orgs[teamName] ? Number(orgs[teamName]) : 0,
            points: pts[teamName] ? Number(pts[teamName]) : 0,
          }));

          updatedTeams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
          });

          setTeamsData((prev) => {
            return updatedTeams.map((item, idx) => {
              const newRank = idx + 1;
              const prevItem = prev.find((p) => p.name === item.name);
              let rankTrend = "stable";
              if (prevItem) {
                if (newRank < prevItem.rank) rankTrend = "up";
                else if (newRank > prevItem.rank) rankTrend = "down";
                else rankTrend = prevItem.rankTrend || "stable";
              }
              return { rank: newRank, rankTrend, ...item };
            });
          });
        } else {
          setDbStatus("error");
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setDbStatus("error");
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [setDbStatus]);

  const filteredTeams = useMemo(() => {
    return teamsData.filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamsData, searchQuery]);

  if (teamsData.length === 0) {
    return null;
  }

  return (
    <>
      <div className="px-2 sm:px-3">
        <input
          type="text"
          placeholder="Search squad country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] w-full transition-colors"
        />
      </div>

      <div className="flex flex-col">
        {!searchQuery && dbStatus !== "connecting" && teamsData.length >= 3 && (
          <div className="px-1.5 sm:px-3 pb-8 pt-4 flex justify-center items-end gap-1.5 sm:gap-4 border-b border-white/5 bg-white/[0.01]">
            <div className="flex-1 max-w-[110px] sm:max-w-[140px] md:max-w-[180px] flex flex-col items-center text-center group">
              <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1 w-20 h-20 sm:w-26 sm:h-26 md:w-48 md:h-48">
                <div className={`relative w-full h-full transition-all duration-500 ${getSquadPhotoFront(teamsData[1].name) ? "[transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]" : ""}`}>
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    <Image
                      src={getSquadPhoto(teamsData[1].name)}
                      alt={`${teamsData[1].name} jersey`}
                      fill
                      className="object-contain drop-shadow-[0_8px_16px_rgba(255,255,255,0.05)]"
                    />
                  </div>
                  {getSquadPhotoFront(teamsData[1].name) && (
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <Image
                        src={getSquadPhotoFront(teamsData[1].name)}
                        alt={`${teamsData[1].name} jersey front`}
                        fill
                        className="object-contain drop-shadow-[0_8px_16px_rgba(255,255,255,0.05)]"
                      />
                    </div>
                  )}
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#94A3B8] border border-white/20 text-black text-[10px] font-black flex items-center justify-center shadow-lg z-20">
                  2
                </span>
              </div>
              <div className="w-full bg-gradient-to-b from-slate-400/10 via-slate-500/[0.02] to-transparent border-t border-x border-slate-400/20 rounded-t-xl p-1.5 sm:p-2.5 flex flex-col items-center min-h-[90px] sm:min-h-[105px] md:min-h-[130px] justify-center">
                <span className="text-[9px] sm:text-xs md:text-sm font-bold text-slate-300 truncate max-w-full flex items-center justify-center gap-1">
                  <span
                    className={`fi fi-${teamsData[1].flag} rounded-sm shrink-0`}
                    style={{ width: "12px", height: "9px" }}
                  />
                  <span className="truncate">{teamsData[1].name}</span>
                </span>
                <span className="text-xs sm:text-sm md:text-lg font-black text-white mt-1">
                  {teamsData[1].points}{" "}
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold uppercase">
                    pts
                  </span>
                </span>
                <span className="text-[8px] sm:text-[9px] md:text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wide truncate max-w-full">
                  {teamsData[1].count} members
                </span>
              </div>
            </div>

            <div className="flex-1 max-w-[130px] sm:max-w-[160px] md:max-w-[210px] flex flex-col items-center text-center group z-10">
              <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1 w-24 h-24 sm:w-32 sm:h-32 md:w-56 md:h-56">
                <div className={`relative w-full h-full transition-all duration-500 ${getSquadPhotoFront(teamsData[0].name) ? "[transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]" : ""}`}>
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    <Image
                      src={getSquadPhoto(teamsData[0].name)}
                      alt={`${teamsData[0].name} jersey`}
                      fill
                      className="object-contain drop-shadow-[0_10px_20px_rgba(251,191,36,0.15)]"
                    />
                  </div>
                  {getSquadPhotoFront(teamsData[0].name) && (
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <Image
                        src={getSquadPhotoFront(teamsData[0].name)}
                        alt={`${teamsData[0].name} jersey front`}
                        fill
                        className="object-contain drop-shadow-[0_10px_20px_rgba(251,191,36,0.15)]"
                      />
                    </div>
                  )}
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FBBF24] border border-white/20 text-black text-[11px] font-black flex items-center justify-center shadow-lg z-20">
                  1
                </span>
              </div>
              <div className="w-full bg-gradient-to-b from-[#FBBF24]/15 via-yellow-600/[0.02] to-transparent border-t border-x border-[#FBBF24]/30 rounded-t-xl p-2 sm:p-3 flex flex-col items-center min-h-[110px] sm:min-h-[130px] md:min-h-[160px] justify-center shadow-[0_-8px_24px_rgba(251,191,36,0.06)]">
                <span className="text-[10px] sm:text-sm md:text-base font-extrabold text-[#FBBF24] truncate max-w-full flex items-center justify-center gap-1.5">
                  <span
                    className={`fi fi-${teamsData[0].flag} rounded-sm shrink-0`}
                    style={{ width: "14px", height: "10.5px" }}
                  />
                  <span className="truncate">{teamsData[0].name}</span>
                </span>
                <span className="text-sm sm:text-base md:text-2xl font-black text-white mt-1">
                  {teamsData[0].points}{" "}
                  <span className="text-[9px] sm:text-[10px] text-[#FBBF24] font-semibold uppercase">
                    pts
                  </span>
                </span>
                <span className="text-[9px] sm:text-slate-400 md:text-xs font-semibold mt-0.5 uppercase tracking-wide truncate max-w-full">
                  {teamsData[0].count} members
                </span>
              </div>
            </div>

            <div className="flex-1 max-w-[100px] sm:max-w-[130px] md:max-w-[160px] flex flex-col items-center text-center group">
              <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1 w-18 h-18 sm:w-22 sm:h-22 md:w-40 md:h-40">
                <div className={`relative w-full h-full transition-all duration-500 ${getSquadPhotoFront(teamsData[2].name) ? "[transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]" : ""}`}>
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    <Image
                      src={getSquadPhoto(teamsData[2].name)}
                      alt={`${teamsData[2].name} jersey`}
                      fill
                      className="object-contain drop-shadow-[0_6px_12px_rgba(217,119,6,0.05)]"
                    />
                  </div>
                  {getSquadPhotoFront(teamsData[2].name) && (
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <Image
                        src={getSquadPhotoFront(teamsData[2].name)}
                        alt={`${teamsData[2].name} jersey front`}
                        fill
                        className="object-contain drop-shadow-[0_6px_12px_rgba(217,119,6,0.05)]"
                      />
                    </div>
                  )}
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D97706] border border-white/20 text-black text-[10px] font-black flex items-center justify-center shadow-lg z-20">
                  3
                </span>
              </div>
              <div className="w-full bg-gradient-to-b from-amber-700/10 via-amber-800/[0.02] to-transparent border-t border-x border-amber-700/20 rounded-t-xl p-1.5 sm:p-2.5 flex flex-col items-center min-h-[75px] sm:min-h-[90px] md:min-h-[110px] justify-center">
                <span className="text-[9px] sm:text-xs md:text-sm font-bold text-amber-500 truncate max-w-full flex items-center justify-center gap-1">
                  <span
                    className={`fi fi-${teamsData[2].flag} rounded-sm shrink-0`}
                    style={{ width: "12px", height: "9px" }}
                  />
                  <span className="truncate">{teamsData[2].name}</span>
                </span>
                <span className="text-xs sm:text-sm md:text-lg font-black text-white mt-1">
                  {teamsData[2].points}{" "}
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold uppercase">
                    pts
                  </span>
                </span>
                <span className="text-[8px] sm:text-[9px] md:text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wide truncate max-w-full">
                  {teamsData[2].count} members
                </span>
              </div>
            </div>
          </div>
        )}

        {dbStatus === "connecting" ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Loading Squads...
            </span>
          </div>
        ) : filteredTeams.length > 0 ? (
          (searchQuery ? filteredTeams : filteredTeams.slice(3)).map((team) => (
            <div
              key={team.name}
              className="flex items-center justify-between py-3 px-2 sm:px-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors group last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border ${getRankStyle(team.rank)}`}
                >
                  {team.rank}
                </span>

                <div className="w-3 flex items-center justify-center">
                  {team.rankTrend === "up" && (
                    <span
                      className="text-[#00E676] text-[10px] drop-shadow-[0_0_2px_#00E676]"
                      aria-label="Rank increased"
                    >
                      ▲
                    </span>
                  )}
                  {team.rankTrend === "down" && (
                    <span
                      className="text-[#4F46E5] text-[10px] drop-shadow-[0_0_2px_#4F46E5]"
                      aria-label="Rank decreased"
                    >
                      ▼
                    </span>
                  )}
                  {team.rankTrend === "stable" && (
                    <span
                      className="text-slate-700 text-[8px]"
                      aria-label="Rank stable"
                    >
                      •
                    </span>
                  )}
                </div>

                <span className="text-xs sm:text-base font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-2">
                  <span
                    className={`fi fi-${team.flag} rounded-sm shadow-sm border border-white/10 shrink-0`}
                    style={{ width: "18px", height: "13.5px" }}
                    role="img"
                    aria-label={`${team.name} flag`}
                  />
                  <span>{team.name}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-base font-bold text-[#06B6D4]">
                    {team.points}
                  </span>
                  <span className="text-[12px] text-slate-400 uppercase tracking-wider">
                    pts
                  </span>
                </div>
                <div className="text-white/10">|</div>
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-medium text-slate-200">
                    {team.count}
                  </span>
                  <span className="text-[12px] text-slate-400 uppercase tracking-wider">
                    members
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 mx-2 sm:mx-3 text-center text-slate-500 text-xs font-bold border border-white/5 rounded-lg bg-white/[0.005]">
            No squad matches your search query.
          </div>
        )}
      </div>
    </>
  );
}
