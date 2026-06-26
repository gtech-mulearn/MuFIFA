"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TEAM_FLAGS } from "@/utils/constants";
import { usePlayer } from "@/components/PlayerContext";

// Helper function to resolve the background flag image path
const getPodiumFlagBg = (teamName) => {
  if (!teamName) return "";
  const name = teamName.toLowerCase();
  if (name === "netherlands") return "/playerCard/flag/netherlands.webp";
  if (name === "croatia") return "/playerCard/flag/crotia.webp";
  return `/playerCard/flag/${name}.webp`;
};
// Helper function to resolve the team player image path (using back/jersey SVG)
const getTeamPlayerImage = (teamName) => {
  if (!teamName) return null;
  const name = teamName.toLowerCase();
  if (name === "brazil" || name === "argentina" || name === "portugal") {
    return `/players/${name}_back.svg`;
  }
  if (name === "germany") {
    return `/players/germany_back.png`;
  }
  return null;
};

// DOMAIN_STYLES for the leaderboard rows

const DOMAIN_STYLES = {
  Coder: "bg-cyan-500/10 border-cyan-500/35 text-cyan-400",
  Creative: "bg-pink-500/10 border-pink-500/35 text-pink-400",
  Strategist: "bg-amber-500/10 border-amber-500/35 text-amber-400",
  Maker: "bg-indigo-500/10 border-indigo-500/35 text-indigo-400",
};

// Renders a styled podium card for 1st, 2nd, or 3rd place with relative flag backgrounds and shield designs.
function PodiumCard({
  rank,
  name,
  subtitle,
  team,
  flag,
  points,
  domain,
  avatarUrl,
  href,
}) {
  const isFirst = rank === 1;
  const isThird = rank === 3;

  let borderStyle = "border-white/10 hover:border-slate-400/40";
  let bgGradient = "rgba(17, 14, 32, 0.75), rgba(17, 14, 32, 0.95)";
  let cardBg = "bg-[#110e20]/60";
  let shadowStyle = "";
  let scaleStyle = "hover:-translate-y-0.5 duration-300";
  let rankText = "2nd Place";
  let rankBadgeStyle =
    "bg-slate-400/10 border-slate-400/30 text-slate-300 shadow-[0_0_10px_rgba(148,163,184,0.1)]";
  let shieldBorder = "border-slate-400 shadow-slate-400/20";
  let pointsColor = "text-white";

  if (isFirst) {
    borderStyle = "border-yellow-500/30 hover:border-yellow-500/60";
    bgGradient = "rgba(27, 21, 58, 0.75), rgba(27, 21, 58, 0.95)";
    cardBg = "bg-[#1b153a]/40";
    shadowStyle = "shadow-[0_0_25px_rgba(234,179,8,0.08)]";
    scaleStyle = "sm:scale-105 hover:-translate-y-0.5 duration-300";
    rankText = "1st Place";
    rankBadgeStyle =
      "bg-yellow-500/10 border-yellow-500/30 text-yellow-450 shadow-[0_0_12px_rgba(234,179,8,0.15)] animate-pulse";
    shieldBorder = "border-yellow-500 shadow-yellow-500/25";
    pointsColor = "text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.25)]";
  } else if (isThird) {
    borderStyle = "border-white/10 hover:border-amber-700/40";
    bgGradient = "rgba(17, 14, 32, 0.75), rgba(17, 14, 32, 0.95)";
    cardBg = "";
    shadowStyle = "";
    scaleStyle = "hover:-translate-y-0.5 duration-300";
    rankText = "3rd Place";
    rankBadgeStyle =
      "bg-amber-700/10 border-amber-700/30 text-amber-500 shadow-[0_0_10px_rgba(194,120,3,0.1)]";
    shieldBorder = "border-amber-700 shadow-amber-700/20";
    pointsColor = "text-white";
  }

  const flagBg = getPodiumFlagBg(team);
  const cardStyle = {
    backgroundImage: flagBg
      ? `linear-gradient(to bottom, ${bgGradient}), url('${flagBg}')`
      : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const shieldSize = isFirst
    ? "w-12 h-12 sm:w-20 sm:h-20"
    : "w-10 h-10 sm:w-16 sm:h-16";
  const initials = name ? name[0].toUpperCase() : "P";
  const teamPlayerImage = getTeamPlayerImage(team);

  const innerContent = (
    <>
      {avatarUrl ? (
        <div
          className={`relative rounded-full border-2 ${shieldBorder} bg-slate-900/60 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ${shieldSize}`}
        >
          <Image
            src={avatarUrl}
            alt={name || "User avatar"}
            fill
            className="object-cover"
          />
        </div>
      ) : teamPlayerImage ? (
        <div
          className={`relative flex items-center justify-center group-hover:scale-105 transition-all duration-300 ${isFirst ? "w-16 h-20 sm:w-24 sm:h-28" : "w-14 h-16 sm:w-20 sm:h-24"}`}
        >
          <Image
            src={teamPlayerImage}
            alt={team || "Team logo"}
            fill
            className="object-contain drop-shadow-[0_8px_16px_rgba(255,255,255,0.05)]"
          />
        </div>
      ) : (
        <div
          className={`relative rounded-full border-2 ${shieldBorder} bg-slate-900/60 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ${shieldSize}`}
        >
          {flag ? (
            <span
              className={`fi fi-${flag} text-2xl sm:text-4xl w-full h-full scale-[1.3]`}
              style={{ backgroundSize: "cover", backgroundPosition: "center" }}
            />
          ) : (
            <span className="text-lg font-black text-slate-300">
              {initials}
            </span>
          )}
        </div>
      )}

      <span
        className={`font-black text-white text-center break-words w-full px-1 leading-tight line-clamp-1 flex items-center justify-center ${isFirst ? "text-xs sm:text-sm mt-2 sm:mt-4 min-h-[16px] sm:min-h-[24px]" : "text-[10px] sm:text-xs mt-2 sm:mt-3 min-h-[14px] sm:min-h-[20px]"}`}
      >
        {name}
      </span>

      {subtitle && (
        <span className="text-[8px] sm:text-[10px] text-slate-400 font-semibold mt-0.5 text-center break-all w-full px-1 line-clamp-1">
          {subtitle}
        </span>
      )}

      <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-2">
        {flag && !avatarUrl && (
          <span
            className={`fi fi-${flag} rounded-sm w-2.5 h-2 sm:w-3.5 sm:h-2.5`}
          />
        )}
        {team && avatarUrl && (
          <>
            <span
              className={`fi fi-${TEAM_FLAGS[team]} rounded-sm w-2.5 h-2 sm:w-3.5 sm:h-2.5`}
            />
            <span className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-full">
              {team}
            </span>
          </>
        )}
      </div>

      {domain && (
        <span
          className={`w-fit text-[6px] sm:text-[8px] font-black uppercase tracking-wider px-1 sm:px-2 py-0 sm:py-0.5 rounded border mt-1.5 sm:mt-3 truncate ${DOMAIN_STYLES[domain] || "bg-white/5 border-white/10 text-white"}`}
        >
          {domain}
        </span>
      )}

      <div className="mt-4 sm:mt-6 text-center">
        <span className={`text-base sm:text-2xl font-black ${pointsColor}`}>
          +{points}
        </span>
        <span
          className={`text-[8px] sm:text-[10px] font-black tracking-wide ml-0.5 sm:ml-1 ${isFirst ? "text-yellow-400" : "text-violet-400"}`}
        >
          μPoints
        </span>
      </div>

      <span
        className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest mt-2 sm:mt-4 select-none ${rankBadgeStyle}`}
      >
        {rankText}
      </span>
    </>
  );

  const containerClass = `flex-1 w-full border backdrop-blur-md flex flex-col items-center relative group ${cardBg} ${borderStyle} ${shadowStyle} ${scaleStyle} rounded-xl sm:rounded-2xl p-2.5 sm:p-6 pt-4 sm:pt-8`;

  if (href) {
    return (
      <Link href={href} className={containerClass} style={cardStyle}>
        {innerContent}
      </Link>
    );
  }

  return (
    <div className={containerClass} style={cardStyle}>
      {innerContent}
    </div>
  );
}

export default function KuzhiundoLeaderboard() {
  const router = useRouter();
  const { player: contextPlayer, loading } = usePlayer();
  const [player, setPlayer] = useState(null);

  // View mode: "mappers" or "teams"
  const [viewMode, setViewMode] = useState("teams");

  // Search and timeframe state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTimeframe, setActiveTimeframe] = useState("alltime"); // "alltime" or "monthly"

  // Leaderboard lists
  const [mappersData, setMappersData] = useState([]);
  const [teamsData, setTeamsData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchLeaderboards = async (timeframe = "alltime") => {
    try {
      setDataLoading(true);
      const query = timeframe === "monthly" ? "?period=month" : "";
      const [indRes, teamRes] = await Promise.all([
        fetch(`/api/v1/kuzhiundo/leaderboard/individuals${query}`),
        fetch(`/api/v1/kuzhiundo/leaderboard/teams${query}`),
      ]);
      const indJson = await indRes.json();
      const teamJson = await teamRes.json();
      if (indJson.success) setMappersData(indJson.data || []);
      if (teamJson.success) setTeamsData(teamJson.data || []);
    } catch (err) {
      console.error("Failed to load leaderboards:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Use player from context instead of fetching /api/v1/auth/me
  useEffect(() => {
    if (!loading && contextPlayer) {
      setPlayer(contextPlayer);
    }
  }, [contextPlayer, loading]);

  useEffect(() => {
    if (player) {
      fetchLeaderboards(activeTimeframe);
    }
  }, [player, activeTimeframe]);

  // Silent auto-sync on mount if user has a linked Kuzhiundo ID
  useEffect(() => {
    async function syncKuzhiundo() {
      if (!player) return;

      if (player.id) {
        console.log(player.id);
        try {
          const syncRes = await fetch("/api/v1/kuzhiundo/sync", {
            method: "POST",
          });
          const syncJson = await syncRes.json();
          if (syncJson.success && syncJson.data && syncJson.data.delta > 0) {
            // Re-fetch to get updated points
            fetchLeaderboards(activeTimeframe);
          }
        } catch (err) {
          console.error("Auto-sync error:", err);
        }
      }
    }
    syncKuzhiundo();
  }, [player]);

  // Adjust submissions for the timeframe fetched from the API
  const processedMappersData = useMemo(() => {
    return mappersData
      .map((item) => {
        return {
          ...item,
          currentSubmissions: item.submissions,
          currentPoints: item.points,
        };
      })
      .sort((a, b) => b.currentSubmissions - a.currentSubmissions);
  }, [mappersData]);

  // Search filtered mappers
  const filteredMappers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return processedMappersData.filter((item) => {
      const name = item.name ? item.name.toLowerCase() : "";
      const username = item.username ? item.username.toLowerCase() : "";
      return name.includes(query) || username.includes(query);
    });
  }, [processedMappersData, searchQuery]);

  // Dynamic team contribution aggregation
  const teamContributions = useMemo(() => {
    return teamsData
      .map((item) => {
        return {
          ...item,
          currentPoints: item.points,
        };
      })
      .sort((a, b) => b.currentPoints - a.currentPoints);
  }, [teamsData]);

  // Filtered teams list based on search
  const filteredTeams = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return teamContributions.filter((t) => {
      const teamName = t.team ? t.team.toLowerCase() : "";
      return teamName.includes(query);
    });
  }, [teamContributions, searchQuery]);

  // Top 3 individual mappers
  const topThreeMappers = useMemo(() => {
    return filteredMappers.slice(0, 3);
  }, [filteredMappers]);

  // Top 3 team league squads
  const topThreeTeams = useMemo(() => {
    return filteredTeams.slice(0, 3);
  }, [filteredTeams]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10">
      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
        style={{
          backgroundImage: `url('/challenges/kuzhiundo/kuzhiundo_bg.webp')`,
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/60 via-[#030207]/40 to-[#030207]/80 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* Header banner with stadium background */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 shadow-2xl bg-[#090715]/40 backdrop-blur-md mb-2 z-10">
        {/* Stadium background overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{
            backgroundImage: `url('/bg_img.webp')`,
          }}
        />
        {/* Dark gradient overlay to fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        {/* Header details */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Community Initiative
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase mt-1">
            Kuzhiundo Leaderboard
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-3xl">
            Map the pits, safeguard the roads. Kerala's premier crowd-sourced
            pothole tracking mission. Earn recognition and µPoints by reporting
            road hazards.
          </p>
        </div>
      </div>

      <div className="max-w-[1680px] mx-auto px-4 md:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main leaderboard column (left) */}
          <div className="lg:col-span-2 flex flex-col gap-8 order-1 lg:order-1">
            {/* Switch between mappers and teams views */}
            <div className="flex items-center justify-center bg-[#110e20]/60 border border-white/5 p-1 rounded-2xl max-w-lg mx-auto w-full relative z-20">
              <button
                onClick={() => {
                  setViewMode("mappers");
                  setSearchQuery("");
                }}
                className={`flex-1 py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                  viewMode === "mappers"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Individual Mappers
              </button>
              <button
                onClick={() => {
                  setViewMode("teams");
                  setSearchQuery("");
                }}
                className={`flex-1 py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                  viewMode === "teams"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Team League
              </button>
            </div>

            {/* Podium and main leaderboard sections */}
            <div className="flex flex-col gap-6">
              {/* Controls for search and timeframe selection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#110e20]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                {/* Search input */}
                <div className="relative flex-1 max-w-md w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder={
                      viewMode === "mappers"
                        ? "Search name or username..."
                        : "Search team name..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>

                {/* Timeframe options */}
                <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 p-1 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                  <button
                    onClick={() => setActiveTimeframe("alltime")}
                    className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTimeframe === "alltime"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setActiveTimeframe("monthly")}
                    className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTimeframe === "monthly"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    This Month
                  </button>
                </div>
              </div>

              {/* Individual mappers leaderboard */}
              {viewMode === "mappers" &&
                (dataLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 bg-[#110e20]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                    <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Loading Individual Standings...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Top 3 individual mappers podium */}
                    {topThreeMappers.length > 0 && (
                      <div className="flex flex-row items-end justify-between w-full gap-1.5 sm:gap-4 md:gap-6 mt-4 px-1 sm:px-2">
                        {/* Second place */}
                        {topThreeMappers[1] && (
                          <PodiumCard
                            rank={2}
                            name={topThreeMappers[1].name}
                            subtitle={`@${topThreeMappers[1].username}`}
                            team={topThreeMappers[1].team}
                            points={topThreeMappers[1].currentPoints}
                            domain={topThreeMappers[1].domain}
                            avatarUrl={topThreeMappers[1].avatar_url}
                            href={`/profile/${topThreeMappers[1].id}`}
                          />
                        )}

                        {/* First place */}
                        {topThreeMappers[0] && (
                          <PodiumCard
                            rank={1}
                            name={topThreeMappers[0].name}
                            subtitle={`@${topThreeMappers[0].username}`}
                            team={topThreeMappers[0].team}
                            points={topThreeMappers[0].currentPoints}
                            domain={topThreeMappers[0].domain}
                            avatarUrl={topThreeMappers[0].avatar_url}
                            href={`/profile/${topThreeMappers[0].id}`}
                          />
                        )}

                        {/* Third place */}
                        {topThreeMappers[2] && (
                          <PodiumCard
                            rank={3}
                            name={topThreeMappers[2].name}
                            subtitle={`@${topThreeMappers[2].username}`}
                            team={topThreeMappers[2].team}
                            points={topThreeMappers[2].currentPoints}
                            domain={topThreeMappers[2].domain}
                            avatarUrl={topThreeMappers[2].avatar_url}
                            href={`/profile/${topThreeMappers[2].id}`}
                          />
                        )}
                      </div>
                    )}

                    {/* Main Leaderboard Table */}
                    <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl mt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-black/25">
                              <th className="py-3.5 px-3 md:px-6 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-12 md:w-16">
                                Rank
                              </th>
                              <th className="py-3.5 px-3 md:px-6 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                User
                              </th>
                              <th className="py-3.5 px-3 md:px-6 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-20 md:w-28">
                                Domain
                              </th>
                              <th className="py-3.5 px-3 md:px-6 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-24 md:w-36">
                                Points
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredMappers.map((item, index) => {
                              const globalRank = index + 1;
                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-white/5 transition-colors group ${
                                    player?.user_id === item.id
                                      ? "bg-violet-600/10 border-y border-violet-500/20"
                                      : ""
                                  }`}
                                >
                                  {/* Rank cell */}
                                  <td className="py-3 px-3 md:px-6 text-center font-black">
                                    {globalRank === 1 ? (
                                      <span className="text-yellow-400">
                                        1st
                                      </span>
                                    ) : globalRank === 2 ? (
                                      <span className="text-slate-300">
                                        2nd
                                      </span>
                                    ) : globalRank === 3 ? (
                                      <span className="text-amber-600">
                                        3rd
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">
                                        {globalRank}
                                      </span>
                                    )}
                                  </td>

                                  {/* User Details */}
                                  <td className="py-3 px-3 md:px-6">
                                    <Link
                                      href={`/profile/${item.id}`}
                                      className="flex items-center gap-3 group/user cursor-pointer"
                                    >
                                      <div className="relative w-9 h-9 rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden flex items-center justify-center shrink-0 group-hover/user:border-violet-500/35 transition-colors">
                                        {item.avatar_url ? (
                                          <Image
                                            src={item.avatar_url}
                                            alt={item.name || "User Avatar"}
                                            fill
                                            className="object-cover"
                                          />
                                        ) : (
                                          <span className="text-xs font-black text-slate-300">
                                            {item.name
                                              ? item.name[0].toUpperCase()
                                              : "P"}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-black text-white group-hover/user:text-violet-400 transition-colors truncate">
                                            {item.name}
                                          </span>
                                          {player?.user_id === item.id && (
                                            <span className="text-[7px] font-black text-violet-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/25">
                                              You
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span
                                            className={`fi fi-${TEAM_FLAGS[item.team]} rounded-sm shrink-0 w-3 h-2`}
                                          />
                                          <span className="text-[10px] text-slate-500 truncate font-semibold">
                                            {item.team} • @{item.username}
                                          </span>
                                        </div>
                                      </div>
                                    </Link>
                                  </td>

                                  {/* Domain cell */}
                                  <td className="py-3 px-3 md:px-6 text-center">
                                    <span
                                      className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${DOMAIN_STYLES[item.domain] || "bg-white/5 border-white/10 text-white"}`}
                                    >
                                      {item.domain}
                                    </span>
                                  </td>

                                  {/* Calculated Score */}
                                  <td className="py-3 px-3 md:px-6 text-center">
                                    <div className="flex items-center justify-center gap-1 text-sm font-black text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                                      <span>+{item.currentPoints}</span>
                                      <span className="text-[9px] font-bold text-amber-500/70">
                                        μP
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {filteredMappers.length === 0 && (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="py-12 px-6 text-center"
                                >
                                  <svg
                                    className="w-10 h-10 text-slate-600 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                                    />
                                  </svg>
                                  <p className="text-xs text-slate-400 font-semibold mt-3">
                                    No mappers found matching "{searchQuery}".
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ))}

              {/* Team league standings */}
              {viewMode === "teams" &&
                (dataLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 bg-[#110e20]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                    <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Loading Squad Standings...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Top 3 team league podium */}
                    {topThreeTeams.length > 0 && (
                      <div className="flex flex-row items-end justify-between w-full gap-1.5 sm:gap-4 md:gap-6 mt-4 px-1 sm:px-2">
                        {/* Second place */}
                        {topThreeTeams[1] && (
                          <PodiumCard
                            rank={2}
                            name={topThreeTeams[1].team}
                            subtitle={`${topThreeTeams[1].mappersCount} ACTIVE`}
                            team={topThreeTeams[1].team}
                            flag={topThreeTeams[1].flag}
                            points={topThreeTeams[1].currentPoints}
                          />
                        )}

                        {/* First place */}
                        {topThreeTeams[0] && (
                          <PodiumCard
                            rank={1}
                            name={topThreeTeams[0].team}
                            subtitle={`${topThreeTeams[0].mappersCount} ACTIVE`}
                            team={topThreeTeams[0].team}
                            flag={topThreeTeams[0].flag}
                            points={topThreeTeams[0].currentPoints}
                          />
                        )}

                        {/* Third place */}
                        {topThreeTeams[2] && (
                          <PodiumCard
                            rank={3}
                            name={topThreeTeams[2].team}
                            subtitle={`${topThreeTeams[2].mappersCount} ACTIVE`}
                            team={topThreeTeams[2].team}
                            flag={topThreeTeams[2].flag}
                            points={topThreeTeams[2].currentPoints}
                          />
                        )}
                      </div>
                    )}

                    {/* Main Teams Leaderboard Table */}
                    <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl mt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-black/25">
                              <th className="py-3.5 px-3 md:px-6 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-12 md:w-16">
                                Rank
                              </th>
                              <th className="py-3.5 px-3 md:px-6 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Squad
                              </th>
                              <th className="py-3.5 px-3 md:px-6 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-20 md:w-28">
                                Mappers
                              </th>
                              <th className="py-3.5 px-3 md:px-6 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-24 md:w-36">
                                Points
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredTeams.map((item, index) => {
                              const globalRank = index + 1;
                              return (
                                <tr
                                  key={item.team}
                                  className={`hover:bg-white/5 transition-colors group ${
                                    player?.team === item.team
                                      ? "bg-violet-600/10 border-y border-violet-500/20"
                                      : ""
                                  }`}
                                >
                                  {/* Rank cell */}
                                  <td className="py-3 px-3 md:px-6 text-center font-black">
                                    {globalRank === 1 ? (
                                      <span className="text-yellow-400">
                                        1st
                                      </span>
                                    ) : globalRank === 2 ? (
                                      <span className="text-slate-300">
                                        2nd
                                      </span>
                                    ) : globalRank === 3 ? (
                                      <span className="text-amber-600">
                                        3rd
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">
                                        {globalRank}
                                      </span>
                                    )}
                                  </td>

                                  {/* Team Name Details */}
                                  <td className="py-3 px-3 md:px-6">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`fi fi-${item.flag} rounded-sm shadow-sm border border-white/10 shrink-0`}
                                        style={{
                                          width: "18px",
                                          height: "13.5px",
                                          backgroundSize: "cover",
                                          backgroundPosition: "center",
                                        }}
                                      />
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-black text-white group-hover:text-violet-400 transition-colors truncate">
                                            {item.team}
                                          </span>
                                          {player?.team === item.team && (
                                            <span className="text-[7px] font-black text-violet-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/25">
                                              Your Squad
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Mappers enrolled */}
                                  <td className="py-3 px-3 md:px-6 text-center text-xs font-bold text-slate-400">
                                    {item.mappersCount}
                                  </td>

                                  {/* Calculated Score */}
                                  <td className="py-3 px-3 md:px-6 text-center">
                                    <div className="flex items-center justify-center gap-1 text-sm font-black text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                                      <span>+{item.currentPoints}</span>
                                      <span className="text-[9px] font-bold text-amber-500/70">
                                        μP
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {filteredTeams.length === 0 && (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="py-12 px-6 text-center"
                                >
                                  <svg
                                    className="w-10 h-10 text-slate-600 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                                    />
                                  </svg>
                                  <p className="text-xs text-slate-400 font-semibold mt-3">
                                    No squads found matching "{searchQuery}".
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ))}
            </div>
          </div>

          {/* Renders the right sidebar column containing call-to-actions. */}
          <div className="lg:col-span-1 lg:self-stretch flex flex-col gap-6 order-2 lg:order-2 lg:sticky lg:top-24">
            {/* A card that links users to the external partner platform. */}
            <div
              className="w-full border border-violet-500/20 hover:border-violet-500/35 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(27, 21, 56, 0.85), rgba(9, 11, 21, 0.95)), url('/challenges/kuzhiundo/kuzhiundo_logo.webp')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Decorative glowing backgrounds for the card. */}
              <div className="absolute right-[-40px] top-[-40px] w-48 h-48 bg-violet-600/20 rounded-full blur-[50px] pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute left-[-20px] bottom-[-20px] w-36 h-36 bg-cyan-600/10 rounded-full blur-[40px] pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                    PARTNER PLATFORM
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">
                  Help Make Kerala Roads Safer
                </h2>
                <p className="text-xs text-slate-300 max-w-lg leading-relaxed mt-1">
                  Kuzhiundo is a citizens' initiative to map and report
                  potholes. By identifying dangerous roads, you contribute to
                  saving lives and alerting authorities. Explore the heatmap,
                  report pits in your vicinity, and get rewarded!
                </p>
              </div>

              <div className="relative z-10 flex flex-col mt-8 pt-4 border-t border-white/5">
                <a
                  href="https://www.kuzhiundo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer w-full px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Visit Kuzhiundo.com</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
