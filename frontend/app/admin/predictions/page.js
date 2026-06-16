"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { THEME } from "../layout";

// Country code lookup for flag-icons (fi fi-{code})
const COUNTRY_CODES = {
  Brazil: "br",
  Argentina: "ar",
  France: "fr",
  Germany: "de",
  England: "gb-eng",
  Spain: "es",
  Portugal: "pt",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
  Mexico: "mx",
  USA: "us",
  "United States": "us",
  Canada: "ca",
  Italy: "it",
  Switzerland: "ch",
  Denmark: "dk",
  Poland: "pl",
  Sweden: "se",
  Norway: "no",
  Serbia: "rs",
  Morocco: "ma",
  Senegal: "sn",
  Ghana: "gh",
  Cameroon: "cm",
  "South Korea": "kr",
  Korea: "kr",
  Australia: "au",
  Iran: "ir",
  Saudi: "sa",
  "Saudi Arabia": "sa",
  Qatar: "qa",
  Ecuador: "ec",
  Wales: "gb-wls",
  Tunisia: "tn",
  Czechia: "cz",
  "Czech Republic": "cz",
  Hungary: "hu",
  Romania: "ro",
  Slovakia: "sk",
  Slovenia: "si",
  Austria: "at",
  Ukraine: "ua",
  Turkey: "tr",
  "Costa Rica": "cr",
  Panama: "pa",
  Chile: "cl",
  Colombia: "co",
  Peru: "pe",
  Bolivia: "bo",
  Paraguay: "py",
  Venezuela: "ve",
  Honduras: "hn",
  Guatemala: "gt",
  Cuba: "cu",
  Jamaica: "jm",
  "New Zealand": "nz",
  Algeria: "dz",
  Egypt: "eg",
  Nigeria: "ng",
  "Ivory Coast": "ci",
  "Cote d'Ivoire": "ci",
  Mali: "ml",
  "South Africa": "za",
  Zambia: "zm",
  Zimbabwe: "zw",
  Greece: "gr",
  Finland: "fi",
  Scotland: "gb-sct",
  Ireland: "ie",
  "Northern Ireland": "gb-nir",
};

function getCountryCode(teamName) {
  if (!teamName) return null;
  if (COUNTRY_CODES[teamName]) return COUNTRY_CODES[teamName];
  const key = Object.keys(COUNTRY_CODES).find((k) =>
    teamName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(teamName.toLowerCase())
  );
  return key ? COUNTRY_CODES[key] : null;
}

function CountryFlag({ teamName }) {
  const code = getCountryCode(teamName);
  return code ? (
    <span
      className={`fi fi-${code} rounded-sm shadow-sm border border-slate-200 shrink-0`}
      style={{ width: "20px", height: "15px", display: "inline-block" }}
      title={teamName}
    />
  ) : (
    <span className="w-5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm inline-block shrink-0" />
  );
}

function getPredictionStatus(pred, match) {
  const actualHome = match?.score?.fullTime?.home;
  const actualAway = match?.score?.fullTime?.away;

  if (actualHome === null || actualHome === undefined || actualAway === null || actualAway === undefined) {
    return { status: "PENDING", label: "Pending", bg: "bg-slate-100 text-slate-600 border-slate-200" };
  }

  let actualOutcome = "draw";
  if (actualHome > actualAway) actualOutcome = "home_win";
  else if (actualAway > actualHome) actualOutcome = "away_win";

  const predHome = Number(pred.predicted_home_goals);
  const predAway = Number(pred.predicted_away_goals);
  const predOutcome = pred.predicted_outcome;

  const isExactScore = (predHome === actualHome && predAway === actualAway);
  const isCorrectOutcome = (predOutcome === actualOutcome);

  if (isExactScore) {
    return { status: "EXACT_SCORE", label: "Exact Score", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  } else if (isCorrectOutcome) {
    return { status: "CORRECT_OUTCOME", label: "Correct Outcome", bg: "bg-sky-50 text-sky-700 border-sky-200" };
  } else {
    return { status: "INCORRECT", label: "Incorrect", bg: "bg-rose-50 text-rose-700 border-rose-200" };
  }
}

export default function AdminPredictionsPage() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [error, setError] = useState("");
  const [awardingId, setAwardingId] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Award points based on correctness: Exact Score (+25), Correct Outcome (+2), Incorrect (-1)
  const handleAwardPoints = async (pred) => {
    const userId = pred.user?.id;
    if (!userId) {
      alert("This player does not have a valid registration.");
      return;
    }

    setAwardingId(pred.user_id);
    try {
      const statusObj = getPredictionStatus(pred, selectedMatch);
      let pointsDelta = 0;
      if (statusObj.status === "EXACT_SCORE") {
        pointsDelta = 25;
      } else if (statusObj.status === "CORRECT_OUTCOME") {
        pointsDelta = 2;
      } else if (statusObj.status === "INCORRECT") {
        pointsDelta = -1;
      }

      const currentPoints = Number(pred.user?.mu_points || 0);
      // Points cannot go below 0 according to schema validation constraints
      const newPoints = Math.max(0, currentPoints + pointsDelta);

      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mu_points: newPoints }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPredictions((prev) =>
          prev.map((p) => {
            if (p.user_id === pred.user_id) {
              return {
                ...p,
                user: {
                  ...p.user,
                  mu_points: newPoints,
                },
              };
            }
            return p;
          })
        );
      } else {
        alert(data.error?.message || "Failed to award points.");
      }
    } catch (err) {
      console.error("Award points error:", err);
      alert("Network error. Failed to award points.");
    } finally {
      setAwardingId(null);
    }
  };

  // Client Side Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch all matches
  const fetchMatchesList = useCallback(async () => {
    setLoadingMatches(true);
    setError("");
    try {
      const res = await fetch("/api/v1/matches");
      const data = await res.json();
      if (data.success && data.data?.matches) {
        const sorted = data.data.matches.sort(
          (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
        );
        setMatches(sorted);
 
        // Preselect the last live/completed match, or the first match as fallback
        if (sorted.length > 0) {
          setSelectedMatchId((prev) => {
            if (prev && sorted.some((m) => String(m.id) === prev)) {
              return prev;
            }
            const happened = sorted.filter(
              (m) => m.status === "FINISHED" || m.status === "IN_PLAY" || m.status === "PAUSED"
            );
            return happened.length > 0
              ? String(happened[happened.length - 1].id)
              : String(sorted[0].id);
          });
        }
      } else {
        setError(data.error?.message || "Failed to fetch matches.");
      }
    } catch (err) {
      console.error("Matches fetch error:", err);
      setError("Failed to fetch matches.");
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    fetchMatchesList();
  }, [fetchMatchesList]);

  // Find currently selected match object
  const selectedMatch = useMemo(() => {
    return matches.find((m) => String(m.id) === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  // Fetch predictions for the selected match (fetch all for client-side stats & pagination)
  const fetchPredictionsList = useCallback(async () => {
    if (!selectedMatchId) return;
    setLoadingPredictions(true);
    setError("");
    try {
      const res = await fetch(
        `/api/v1/admin/predictions?match_id=${selectedMatchId}&limit=1000`
      );
      const data = await res.json();
      if (data.success) {
        setPredictions(data.data || []);
        setCurrentPage(1); // Reset page on match change
      } else {
        setError(data.error?.message || "Failed to fetch predictions.");
      }
    } catch (err) {
      console.error("Predictions fetch error:", err);
      setError("Failed to fetch predictions.");
    } finally {
      setLoadingPredictions(false);
    }
  }, [selectedMatchId]);

  useEffect(() => {
    fetchPredictionsList();
  }, [fetchPredictionsList]);

  // Categorize matches for the dropdown selection
  const groupedMatches = useMemo(() => {
    const liveOrCompleted = [];
    const upcoming = [];

    matches.forEach((m) => {
      const isLiveOrCompleted =
        m.status === "FINISHED" || m.status === "IN_PLAY" || m.status === "PAUSED";
      if (isLiveOrCompleted) {
        liveOrCompleted.push(m);
      } else {
        upcoming.push(m);
      }
    });

    return { liveOrCompleted, upcoming };
  }, [matches]);

  // Calculate metrics based on ALL predictions of the selected match
  const metrics = useMemo(() => {
    const total = predictions.length;
    let exact = 0;
    let correct = 0;
    let incorrect = 0;
    let pending = 0;

    predictions.forEach((p) => {
      const statusObj = getPredictionStatus(p, selectedMatch);
      if (statusObj.status === "EXACT_SCORE") exact++;
      else if (statusObj.status === "CORRECT_OUTCOME") correct++;
      else if (statusObj.status === "INCORRECT") incorrect++;
      else if (statusObj.status === "PENDING") pending++;
    });

    const activeCount = total - pending;
    const accuracy = activeCount > 0 ? Math.round(((exact + correct) / activeCount) * 100) : 0;

    return {
      total,
      exact,
      correct,
      incorrect,
      pending,
      accuracy,
    };
  }, [predictions, selectedMatch]);

  // Filtered predictions based on search and statusFilter
  const filteredPredictions = useMemo(() => {
    return predictions.filter((p) => {
      // 1. Search filter (name, email, or team)
      const name = p.user?.name || "";
      const email = p.user?.email || "";
      const squadTeam = p.user?.team || "";
      const query = search.toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        squadTeam.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter === "ALL") return true;
      const statusObj = getPredictionStatus(p, selectedMatch);
      return statusObj.status === statusFilter;
    });
  }, [predictions, search, statusFilter, selectedMatch]);

  // Paginated predictions
  const paginatedPredictions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPredictions.slice(start, start + itemsPerPage);
  }, [filteredPredictions, currentPage]);

  const totalPages = Math.ceil(filteredPredictions.length / itemsPerPage);

  const getOutcomeLabel = (outcome) => {
    if (outcome === "home_win") return "Home Win";
    if (outcome === "away_win") return "Away Win";
    if (outcome === "draw") return "Draw";
    return outcome;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
            Predictions Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze prediction data, track user accuracy metrics, and review correct outcomes.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              fetchMatchesList();
              fetchPredictionsList();
            }}
            className="cursor-pointer bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-2"
          >
            <svg
              className={`w-3.5 h-3.5 ${(loadingMatches || loadingPredictions) ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs py-2.5 px-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Main Grid Selector & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Selector Card */}
        <div className={`${THEME.panel} rounded-2xl p-5 flex flex-col gap-4 lg:col-span-1`}>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Select Match
            </label>
            <div className="relative mt-1.5">
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 text-xs transition-colors cursor-pointer appearance-none focus:outline-none ${THEME.input}`}
                disabled={loadingMatches}
              >
                {loadingMatches ? (
                  <option>Loading matches...</option>
                ) : (
                  <>
                    {groupedMatches.liveOrCompleted.length > 0 && (
                      <optgroup label="Completed / Live Matches">
                        {groupedMatches.liveOrCompleted.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.homeTeam.shortName || m.homeTeam.name} vs{" "}
                            {m.awayTeam.shortName || m.awayTeam.name} (
                            {m.score?.fullTime?.home ?? 0} - {m.score?.fullTime?.away ?? 0})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {groupedMatches.upcoming.length > 0 && (
                      <optgroup label="Upcoming Matches">
                        {groupedMatches.upcoming.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.homeTeam.shortName || m.homeTeam.name} vs{" "}
                            {m.awayTeam.shortName || m.awayTeam.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {selectedMatch && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <span>Match Info</span>
                <span className={`px-2 py-0.5 rounded text-[9px] ${
                  selectedMatch.status === "FINISHED"
                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                    : selectedMatch.status === "IN_PLAY" || selectedMatch.status === "PAUSED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                    : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                }`}>
                  {selectedMatch.status}
                </span>
              </div>

              {/* Match Display */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full gap-2 text-xs">
                  {/* Home */}
                  <div className="flex-1 flex flex-col items-center text-center gap-1.5 min-w-0">
                    <CountryFlag teamName={selectedMatch.homeTeam.name} />
                    <span className="font-semibold text-slate-800 truncate w-full">
                      {selectedMatch.homeTeam.shortName || selectedMatch.homeTeam.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center px-2">
                    <span className="text-base font-black tracking-wider text-slate-900 font-mono">
                      {selectedMatch.status === "SCHEDULED" || selectedMatch.status === "TIMED" ? (
                        <span className="text-slate-400 font-normal text-xs uppercase">VS</span>
                      ) : (
                        `${selectedMatch.score?.fullTime?.home ?? 0} - ${selectedMatch.score?.fullTime?.away ?? 0}`
                      )}
                    </span>
                  </div>

                  {/* Away */}
                  <div className="flex-1 flex flex-col items-center text-center gap-1.5 min-w-0">
                    <CountryFlag teamName={selectedMatch.awayTeam.name} />
                    <span className="font-semibold text-slate-800 truncate w-full">
                      {selectedMatch.awayTeam.shortName || selectedMatch.awayTeam.name}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono mt-1 text-center">
                  {new Date(selectedMatch.utcDate).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Card: Total Predictions */}
          <div className={`${THEME.panel} rounded-2xl p-5 flex flex-col justify-between`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Predictions
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-800 font-mono">
                {metrics.total}
              </span>
              <span className="text-xs text-slate-400">predictions submitted</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2.5 mt-3">
              Pending review: <span className="font-bold text-slate-700">{metrics.pending}</span>
            </div>
          </div>

          {/* Card: Accuracy */}
          <div className={`${THEME.panel} rounded-2xl p-5 flex flex-col justify-between`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Accuracy Rate
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-sky-700 font-mono">
                {metrics.accuracy}%
              </span>
              <span className="text-xs text-slate-400">correct outcome %</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2.5 mt-3">
              For completed outcomes
            </div>
          </div>

          {/* Card: Exact Scores */}
          <div className={`${THEME.panel} rounded-2xl p-5 flex flex-col justify-between`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Exact Score Matches
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {metrics.exact}
              </span>
              <span className="text-xs text-slate-400">correct scores</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2.5 mt-3">
              Perfect predictions
            </div>
          </div>

          {/* Card: Correct Outcomes */}
          <div className={`${THEME.panel} rounded-2xl p-5 flex flex-col justify-between`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Correct Outcomes
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-sky-600 font-mono">
                {metrics.correct}
              </span>
              <span className="text-xs text-slate-400">outcome only matches</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2.5 mt-3">
              Excludes exact scores
            </div>
          </div>
        </div>
      </div>

      {/* Predictions Search / Filters & Table */}
      <div className="flex flex-col gap-4">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player name, email, or squad team"
            className={`flex-1 min-w-[200px] rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`rounded-xl px-3 py-2.5 text-xs transition-colors cursor-pointer appearance-none focus:outline-none ${THEME.input}`}
          >
            <option value="ALL">All Predictions</option>
            <option value="EXACT_SCORE">Exact Score Matches</option>
            <option value="CORRECT_OUTCOME">Correct Outcome Matches</option>
            <option value="INCORRECT">Incorrect Predictions</option>
            <option value="PENDING">Pending Matches</option>
          </select>
        </div>

        {/* Predictions Table Panel */}
        <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
          {loadingPredictions ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <svg className="w-8 h-8 opacity-40 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-xs font-semibold">No predictions matches your filters.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200/90 text-slate-500 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">Player</th>
                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">Squad Team</th>
                    <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">Current Points</th>
                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">Predicted Score</th>
                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">Predicted Outcome</th>
                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">Correctness</th>
                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">Actions</th>
                    <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPredictions.map((pred, idx) => {
                    const statusObj = getPredictionStatus(pred, selectedMatch);
                    
                    let buttonLabel = "N/A";
                    let buttonStyle = "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed";
                    
                    if (statusObj.status === "EXACT_SCORE") {
                      buttonLabel = "+25 Points";
                      buttonStyle = "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer";
                    } else if (statusObj.status === "CORRECT_OUTCOME") {
                      buttonLabel = "+2 Points";
                      buttonStyle = "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 cursor-pointer";
                    } else if (statusObj.status === "INCORRECT") {
                      buttonLabel = "-1 Point";
                      buttonStyle = "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer";
                    }

                    return (
                      <tr
                        key={`${pred.user_id}-${idx}`}
                        className="border-b border-slate-200/70 hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">
                              {pred.user?.name || "Unknown Player"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {pred.user?.email || pred.user_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-semibold whitespace-nowrap">
                          {pred.user?.team || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800 font-mono font-bold whitespace-nowrap">
                          {pred.user?.mu_points ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap font-mono font-bold text-slate-800">
                          {pred.predicted_home_goals} - {pred.predicted_away_goals}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-50 text-slate-600 border-slate-200">
                            {getOutcomeLabel(pred.predicted_outcome)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusObj.bg}`}>
                            {statusObj.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {pred.user?.id ? (
                            <button
                              onClick={() => handleAwardPoints(pred)}
                              disabled={awardingId === pred.user_id || statusObj.status === "PENDING"}
                              className={`disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border transition-all font-sans ${buttonStyle}`}
                            >
                              {awardingId === pred.user_id ? "Awarding..." : buttonLabel}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 font-mono whitespace-nowrap">
                          {new Date(pred.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Client Side Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white font-medium"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-medium font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
