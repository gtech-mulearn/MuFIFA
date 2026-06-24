"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TEAM_FLAGS, THEME, useAdmin } from "../layout";

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
      {team ? team.slice(0, 2) : "??"}
    </span>
  );
}

function SortIcon({ col, sortKey, sortDir }) {
  return (
    <svg
      className={`w-3 h-3 inline-block ml-1 transition-transform ${sortKey === col ? "text-sky-600" : "text-slate-400"} ${sortKey === col && sortDir === "asc" ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function AuditCard({ label, value, icon, accent, subtitle }) {
  return (
    <div
      className={`${THEME.panel} rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5`}
    >
      <div
        className="absolute -top-10 -right-8 w-28 h-28 rounded-full opacity-20 pointer-events-none"
        style={{ filter: "blur(32px)", background: accent }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <span className="relative text-2xl font-bold text-slate-900 tracking-tight">
        {value}
      </span>
      {subtitle && (
        <span className="relative text-[10px] text-slate-500 font-medium">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default function TestStatPage() {
  const admin = useAdmin();
  const isViewer = admin?.role === "viewer";

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("calculatedTotal");
  const [sortDir, setSortDir] = useState("desc");

  // Detail Modal states
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSortKey, setMemberSortKey] = useState("totalPoints");
  const [memberSortDir, setMemberSortDir] = useState("desc");
  const [syncingTeam, setSyncingTeam] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/test-stat");
      const data = await res.json();
      if (data.success) {
        const statsData = data.data || [];
        setStats(statsData);
        // Sync selected squad data if modal is open
        setSelectedSquad((prev) => {
          if (!prev) return null;
          return statsData.find((s) => s.name === prev.name) || prev;
        });
      } else {
        setError(data.error || "Failed to load audit calculations.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred while loading audit statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSyncTeam = async (teamName) => {
    if (syncingTeam) return;
    setSyncingTeam(teamName);
    setError("");
    setSyncSuccess("");

    try {
      const res = await fetch("/api/v1/admin/test-stat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncSuccess(data.message || `Successfully synced points for ${teamName}.`);
        await fetchStats();
        setTimeout(() => setSyncSuccess(""), 5000);
      } else {
        setError(data.error || `Failed to sync points for team ${teamName}.`);
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred while syncing squad points.");
    } finally {
      setSyncingTeam(null);
    }
  };

  const [syncingUser, setSyncingUser] = useState(null);

  const handleSyncUser = async (userId, teamName) => {
    if (syncingUser) return;
    setSyncingUser(userId);
    setError("");
    setSyncSuccess("");

    try {
      const res = await fetch("/api/v1/admin/test-stat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, teamName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncSuccess(data.message || `Successfully synced points for user.`);
        await fetchStats();
        setTimeout(() => setSyncSuccess(""), 5000);
      } else {
        setError(data.error || "Failed to sync points for user.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred while syncing user points.");
    } finally {
      setSyncingUser(null);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Sort logic
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Filter & Sort stats
  const filteredStats = stats.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedStats = [...filteredStats].sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];

    // For variance column, compare by numerical value
    if (sortKey === "variance") {
      valA = (a.calculatedTotal || 0) - (a.actualSquadPoints || 0);
      valB = (b.calculatedTotal || 0) - (b.actualSquadPoints || 0);
    }

    const mul = sortDir === "desc" ? -1 : 1;
    if (typeof valA === "string") {
      return valA.localeCompare(valB || "") * mul;
    }
    return ((valA || 0) - (valB || 0)) * mul;
  });

  // Calculate audit totals
  const totalPlayers = stats.reduce((sum, s) => sum + (s.membersCount || 0), 0);
  const totalCalculatedPoints = stats.reduce((sum, s) => sum + (s.calculatedTotal || 0), 0);
  const totalTablePoints = stats.reduce((sum, s) => sum + (s.actualSquadPoints || 0), 0);
  const totalVariance = totalCalculatedPoints - totalTablePoints;
  const mismatchedCount = stats.filter(
    (s) => s.calculatedTotal !== s.actualSquadPoints
  ).length;

  // Modal Member list sort and filter
  const squadMembers = selectedSquad?.members || [];
  const filteredMembers = squadMembers.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase())
  );
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let valA = a[memberSortKey];
    let valB = b[memberSortKey];
    const mul = memberSortDir === "desc" ? -1 : 1;
    if (typeof valA === "string") {
      return valA.localeCompare(valB || "") * mul;
    }
    return ((valA || 0) - (valB || 0)) * mul;
  });

  const handleMemberSort = (key) => {
    if (memberSortKey === key) {
      setMemberSortDir(memberSortDir === "desc" ? "asc" : "desc");
    } else {
      setMemberSortKey(key);
      setMemberSortDir("desc");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
            Squad Points Audit (Test Stat)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Independent calculation of squad standings directly from registration, task completion, and prediction events.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Refresh calculations
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AuditCard
            label="Mismatched Squads"
            value={`${mismatchedCount} / ${stats.length}`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            accent={mismatchedCount > 0 ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.3)"}
            subtitle={mismatchedCount > 0 ? "Discrepancy detected in squad tables" : "All squad tables match calculated values"}
          />
          <AuditCard
            label="Total Players"
            value={totalPlayers.toLocaleString()}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.5v-1.125A3.375 3.375 0 0 0 11.625 15h-3.75M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              </svg>
            }
            accent="rgba(56,189,248,0.3)"
            subtitle="Aggregated registered members"
          />
          <AuditCard
            label="Calculated Points"
            value={totalCalculatedPoints.toLocaleString()}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 11h.01M12 14h.01M12 7h.01M15 11h.01M15 7h.01M18 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
              </svg>
            }
            accent="rgba(34,197,94,0.3)"
            subtitle="Sum of registration, tasks, & predictions"
          />
          <AuditCard
            label="Net Variance"
            value={`${totalVariance >= 0 ? "+" : ""}${totalVariance}`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
            }
            accent={totalVariance !== 0 ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.2)"}
            subtitle={`Table totals: ${totalTablePoints.toLocaleString()}`}
          />
        </div>
      )}

      {/* Table Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter squads by name..."
          className={`flex-1 max-w-sm rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs py-2.5 px-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Success Notification */}
      {syncSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs py-2.5 px-4 rounded-xl font-medium">
          {syncSuccess}
        </div>
      )}

      {/* Audit Table Panel */}
      <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedStats.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-xs text-slate-500">
            No squad statistics found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-500 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider w-12">#</th>
                  <th
                    className="text-left px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("name")}
                  >
                    Squad <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("membersCount")}
                  >
                    Players <SortIcon col="membersCount" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("basePoints")}
                  >
                    Base Reg <SortIcon col="basePoints" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("referralPoints")}
                  >
                    Referrals <SortIcon col="referralPoints" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("taskPoints")}
                  >
                    Challenges <SortIcon col="taskPoints" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("kuzhiundoPoints")}
                  >
                    Kuzhiundo <SortIcon col="kuzhiundoPoints" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("kuzhiDbSubmissions")}
                  >
                    Kuzhi DB <SortIcon col="kuzhiDbSubmissions" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("kuzhiApiSubmissions")}
                  >
                    Kuzhi API <SortIcon col="kuzhiApiSubmissions" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("predictionPoints")}
                  >
                    Predictions <SortIcon col="predictionPoints" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none bg-sky-50/30"
                    onClick={() => handleSort("calculatedTotal")}
                  >
                    Calculated <SortIcon col="calculatedTotal" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none bg-slate-100/30"
                    onClick={() => handleSort("totalPlayersPoints")}
                  >
                    Players Sum <SortIcon col="totalPlayersPoints" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("actualSquadPoints")}
                  >
                    Table Points <SortIcon col="actualSquadPoints" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-center px-5 py-3 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                    onClick={() => handleSort("variance")}
                  >
                    Variance <SortIcon col="variance" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="text-center px-5 py-3 font-bold uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((team, idx) => {
                  const variance = team.calculatedTotal - team.actualSquadPoints;
                  const isMatch = variance === 0;

                  return (
                    <tr
                      key={team.name}
                      onClick={() => {
                        setSelectedSquad(team);
                        setMemberSearch("");
                        setMemberSortKey("totalPoints");
                        setMemberSortDir("desc");
                      }}
                      className="border-b border-slate-200/70 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="px-5 py-3.5 text-slate-800 font-semibold whitespace-nowrap">
                        <span className="mr-3 inline-flex align-middle">
                          <TeamBadge team={team.name} />
                        </span>
                        {team.name}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600 font-mono">
                        {team.membersCount}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                        {team.basePoints}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                        {team.referralPoints}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                        {team.taskPoints}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                        {team.kuzhiundoPoints || 0}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                        {team.kuzhiDbSubmissions || 0}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                        {team.kuzhiApiSubmissions || 0}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                        {team.predictionPoints}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-sky-700 bg-sky-50/20">
                        {team.calculatedTotal.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-700 bg-slate-50/10">
                        {(team.totalPlayersPoints || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                        {team.actualSquadPoints.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {isMatch ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            Match
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full border shadow-sm ${
                              variance > 0
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {variance > 0 ? `+${variance}` : variance}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSquad(team);
                              setMemberSearch("");
                              setMemberSortKey("totalPoints");
                              setMemberSortDir("desc");
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
                          >
                            Audit Members
                          </button>
                          {!isMatch && (
                            <button
                              onClick={() => handleSyncTeam(team.name)}
                              disabled={syncingTeam !== null || isViewer}
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white transition-all cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              {syncingTeam === team.name ? (
                                <>
                                  <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                "Sync Points"
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Squad Detail Modal */}
      {selectedSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setSelectedSquad(null)} />
          
          <div className="relative w-full max-w-[95vw] lg:max-w-6xl bg-white border border-slate-200/90 shadow-[0_24px_60px_rgba(15,23,42,0.15)] rounded-2xl p-6 overflow-hidden flex flex-col max-h-[85vh] z-10">
            {/* Visual background blob */}
            <div
              className="absolute -top-10 -right-8 w-40 h-40 rounded-full opacity-10 pointer-events-none"
              style={{ filter: "blur(40px)", background: "rgba(56,189,248,0.8)" }}
            />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/90 mb-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900 flex items-center gap-2">
                  <TeamBadge team={selectedSquad.name} />
                  {selectedSquad.name} Squad Point Breakdown
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Detailed contribution points for all {squadMembers.length} squad members.
                </p>
              </div>
              <button
                onClick={() => setSelectedSquad(null)}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search member by name..."
                className={`flex-1 rounded-xl px-4 py-2 text-xs transition-colors focus:outline-none ${THEME.input}`}
              />
            </div>

            {/* Modal Members Table */}
            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 border border-slate-200/80 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200/90 text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wider w-12 text-center">#</th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("name")}
                    >
                      Member <SortIcon col="name" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("basePoints")}
                    >
                      Base Reg <SortIcon col="basePoints" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("referredByCount")}
                    >
                      FK Ref <SortIcon col="referredByCount" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("tasksReferralCount")}
                    >
                      Tasks Ref <SortIcon col="tasksReferralCount" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("referralPoints")}
                    >
                      Referral Pts <SortIcon col="referralPoints" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("taskPoints")}
                    >
                      Challenges <SortIcon col="taskPoints" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("kuzhiundoPoints")}
                    >
                      Kuzhiundo <SortIcon col="kuzhiundoPoints" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("kuzhiDbSubmissions")}
                    >
                      Kuzhi DB <SortIcon col="kuzhiDbSubmissions" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("kuzhiApiSubmissions")}
                    >
                      Kuzhi API <SortIcon col="kuzhiApiSubmissions" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                      onClick={() => handleMemberSort("predictionPoints")}
                    >
                      Predictions <SortIcon col="predictionPoints" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none bg-sky-50/30"
                      onClick={() => handleMemberSort("totalPoints")}
                    >
                      Total Contrib <SortIcon col="totalPoints" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                    <th
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-right cursor-pointer hover:text-slate-900 transition-colors select-none bg-slate-100/30"
                      onClick={() => handleMemberSort("muPoints")}
                    >
                      Stored Points <SortIcon col="muPoints" sortKey={memberSortKey} sortDir={memberSortDir} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedMembers.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="text-center py-8 text-slate-400">
                        No members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    sortedMembers.map((m, idx) => (
                      <tr key={m.user_id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="px-4 py-2.5 text-slate-800">
                          <div className="font-semibold">{m.name}</div>
                          {m.kuzhiundoUuid && (
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5" title={`UUID: ${m.kuzhiundoUuid}`}>
                              🔗 Kuzhiundo: {m.kuzhiundoSubmissions} report(s)
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.basePoints}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.referredByCount}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.tasksReferralCount}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.referralPoints}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.taskPoints}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.kuzhiundoPoints || 0}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.kuzhiDbSubmissions || 0}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.kuzhiApiSubmissions || 0}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.predictionPoints}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-sky-700 bg-sky-50/10">{m.totalPoints}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-600 bg-slate-50/5">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{m.muPoints}</span>
                            {m.totalPoints !== m.muPoints && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSyncUser(m.user_id, selectedSquad.name);
                                }}
                                disabled={syncingUser === m.user_id || isViewer}
                                className="text-[9px] font-black uppercase bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white px-1.5 py-0.5 rounded cursor-pointer transition-colors shadow-sm"
                                title="Sync this user's points in DB"
                              >
                                {syncingUser === m.user_id ? "..." : "Fix"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {sortedMembers.length > 0 && (
                  <tfoot className="sticky bottom-0 bg-slate-50 border-t border-slate-200/90 font-bold text-slate-800">
                    <tr>
                      <td colSpan="2" className="px-4 py-2.5">Squad Total</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + m.basePoints, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + m.referredByCount, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + m.tasksReferralCount, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + m.referralPoints, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + m.taskPoints, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + (m.kuzhiundoPoints || 0), 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + (m.kuzhiDbSubmissions || 0), 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + (m.kuzhiApiSubmissions || 0), 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {sortedMembers.reduce((sum, m) => sum + m.predictionPoints, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sky-700 bg-sky-50/30">
                        {sortedMembers.reduce((sum, m) => sum + m.totalPoints, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-800 bg-slate-100/30">
                        {sortedMembers.reduce((sum, m) => sum + m.muPoints, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-200/90 pt-4 mt-4">
              {selectedSquad.calculatedTotal !== selectedSquad.actualSquadPoints && (
                <button
                  onClick={() => handleSyncTeam(selectedSquad.name)}
                  disabled={syncingTeam !== null || isViewer}
                  className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {syncingTeam === selectedSquad.name ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Syncing Discrepancies...
                    </>
                  ) : (
                    "Sync Squad Discrepancies"
                  )}
                </button>
              )}
              <button
                onClick={() => setSelectedSquad(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer bg-white"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
