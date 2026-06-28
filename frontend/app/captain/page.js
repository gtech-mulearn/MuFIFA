"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePlayer } from "@/components/PlayerContext";
import { TEAM_FLAGS } from "@/utils/constants";
import Header from "../tasks/components/Header/Header";

export default function CaptainDashboard() {
  const { player, loading: playerLoading } = usePlayer();
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("not_joined");

  // Tasks Modal State
  const [selectedMember, setSelectedMember] = useState(null); // { user_id, name }
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState("");

  const handleViewTasks = async (member) => {
    setSelectedMember(member);
    setCompletedTasks([]);
    setLoadingTasks(true);
    setTasksError("");
    try {
      const res = await fetch(`/api/v1/captain/member-tasks?userId=${encodeURIComponent(member.user_id)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedTasks(data.completedTasks || []);
      } else {
        setTasksError(data.error || "Failed to load completed tasks.");
      }
    } catch (err) {
      console.error(err);
      setTasksError("Failed to fetch tasks from the server.");
    } finally {
      setLoadingTasks(false);
    }
  };


  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    setError("");
    try {
      const queryParams = new URLSearchParams({
        filter,
        search: debouncedSearch,
      });
      const res = await fetch(`/api/v1/captain/members?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.members || []);
      } else {
        setError(data.error || "Failed to load team members.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch team members from the server.");
    } finally {
      setLoadingMembers(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    if (player && (player.role === "captain" || player.role === "vicecaptain")) {
      fetchMembers();
    }
  }, [player, fetchMembers]);

  const handleToggleWhatsApp = async (memberId, currentJoinedStatus) => {
    setTogglingId(memberId);
    setError("");
    setSuccess("");
    const newStatus = !currentJoinedStatus;

    try {
      const res = await fetch("/api/v1/captain/toggle-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
          joined: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // If filtering by not_joined or joined, remove the item from local list when toggled out
        if (filter === "not_joined" && newStatus === true) {
          setMembers((prev) => prev.filter((m) => m.id !== memberId));
        } else if (filter === "joined" && newStatus === false) {
          setMembers((prev) => prev.filter((m) => m.id !== memberId));
        } else {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === memberId ? { ...m, whatsapp_joined: newStatus } : m
            )
          );
        }
        setSuccess(`Status updated successfully.`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };



  if (playerLoading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!player || (player.role !== "captain" && player.role !== "vicecaptain")) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 shrink-0 mb-4 text-rose-500">
          <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Access Denied</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Only registered team captains or vice-captains are permitted to view this squad management page.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 cursor-pointer px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const totalMembers = members.length;
  const joinedWhatsAppCount = members.filter((m) => m.whatsapp_joined).length;

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10">
      {/* Stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/60 via-[#030207]/40 to-[#030207]/80 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        <div className="relative z-10">
          <Header
            title="CAPTAIN"
            highlightedTitle="SQUAD"
            subtitle="View your squad members list, invite them to join the team WhatsApp group, and manage group membership status."
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 w-full relative z-10 flex-1 flex flex-col gap-6">
        {/* Team Card & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Jersey & Flag Badge */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[150px] relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-[100%] bg-transparent overflow-hidden pointer-events-none select-none z-0">
              {player.team && (
                <img
                  src={`/Jersey/${player.team === "Netherlands" ? "Netherland" : player.team}.svg`}
                  alt="Team Jersey"
                  className="absolute left-[90px] top-1/2 -translate-y-1/2 h-[110%] w-auto object-contain object-left opacity-90"
                />
              )}
            </div>

            <div className="flex flex-col gap-1 z-10">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-extrabold">
                Your Squad Team
              </span>
              <div className="mt-3 flex items-center gap-6">
                {player.team && (
                  <span
                    className={`fi fi-${TEAM_FLAGS[player.team] || "un"} rounded-md border border-white/10 shrink-0 shadow-md`}
                    style={{
                      width: "64px",
                      height: "44px",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}
              </div>
            </div>
            <span className="text-sm font-bold tracking-widest text-white uppercase mt-4 z-10">
              {player.team}
            </span>
          </div>

          {/* Stats 1: Total Members */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[150px]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-extrabold">
                Total Registrations
              </span>
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                Active Players
              </h4>
            </div>
            <div className="text-3xl md:text-4xl font-extrabold text-white mt-auto">
              {loadingMembers ? "-" : totalMembers}
            </div>
          </div>

          {/* Stats 2: WhatsApp Verified */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[150px]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-extrabold">
                WhatsApp Status
              </span>
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                Joined Group
              </h4>
            </div>
            <div className="text-3xl md:text-4xl font-extrabold text-emerald-400 mt-auto flex items-baseline gap-2">
              <span>{loadingMembers ? "-" : joinedWhatsAppCount}</span>
              {totalMembers > 0 && !loadingMembers && (
                <span className="text-xs font-semibold text-slate-500">
                  / {totalMembers} ({Math.round((joinedWhatsAppCount / totalMembers) * 100)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs py-2.5 px-4 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-400 font-bold hover:opacity-85">×</button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs py-2.5 px-4 rounded-xl flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="text-emerald-400 font-bold hover:opacity-85">×</button>
          </div>
        )}

        {/* Squad Members Table */}
        <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">
                Squad Members List
              </h3>
              <span className="text-[9px] text-slate-500 italic block mt-0.5">
                Data caches for 1 hour on server
              </span>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="rounded-xl px-4 py-2 text-xs transition-colors bg-black/40 border border-white/10 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 w-full sm:w-48"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer bg-black/40 border border-white/10 text-slate-300 focus:outline-none focus:border-violet-500/50"
              >
                <option value="not_joined">Not Joined WhatsApp</option>
                <option value="joined">Joined WhatsApp</option>
                <option value="all">All Members</option>
              </select>
            </div>
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-slate-400">
              No players are currently assigned to your team.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400">
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Member Name</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Username ID</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">Tasks Completed</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">WhatsApp Group</th>
                  </tr>

                </thead>
                <tbody className="divide-y divide-white/5">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name (Profile link) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <a
                          href={`/profile/${member.user_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-100 hover:text-cyan-400 transition-colors hover:underline"
                        >
                          {member.name}
                        </a>
                        {member.role === "captain" && (
                          <span className="ml-2 inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                            Captain
                          </span>
                        )}
                        {member.role === "vicecaptain" && (
                          <span className="ml-2 inline-flex items-center rounded bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-black text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                            Vice Captain
                          </span>
                        )}
                      </td>

                      {/* Username ID */}
                      <td className="px-4 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                        @{member.user_id}
                      </td>

                      {/* Tasks Completed Button */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewTasks(member)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 active:bg-violet-500/30"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <span>{member.completed_tasks_count || 0} Tasks</span>
                        </button>
                      </td>

                      {/* Joined WhatsApp toggle */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={member.whatsapp_joined}
                              disabled={togglingId === member.id}
                              onChange={() => handleToggleWhatsApp(member.id, member.whatsapp_joined)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 transition-colors peer-disabled:opacity-50"></div>
                            <span className="ml-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-400 peer-checked:text-emerald-400 transition-colors min-w-[70px] text-left">
                              {member.whatsapp_joined ? "Joined" : "Not Joined"}
                            </span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Tasks Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-all duration-300">
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setSelectedMember(null)}
          />
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#131927] to-[#0d101d] border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black tracking-wider text-white uppercase">
                  Completed Tasks
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Showing task activity for <span className="text-cyan-400 font-bold">@{selectedMember.user_id}</span> ({selectedMember.name})
                </p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="cursor-pointer text-slate-400 hover:text-white text-2xl font-bold transition-colors w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loadingTasks ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400 font-medium">Fetching completed tasks...</span>
                </div>
              ) : tasksError ? (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-3 px-4 rounded-xl text-center font-bold">
                  {tasksError}
                </div>
              ) : completedTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  This member hasn't completed any tasks yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 text-[10px] uppercase tracking-wider">
                        <th className="px-3 py-2.5 font-bold">Task Name / Hashtag</th>
                        <th className="px-3 py-2.5 font-bold">Category</th>
                        <th className="px-3 py-2.5 font-bold text-center">Points</th>
                        <th className="px-3 py-2.5 font-bold text-right">Completed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {completedTasks.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-3">
                            <div className="font-bold text-slate-200 text-xs">{t.title}</div>
                            {t.hashtag && (
                              <div className="text-[10px] text-cyan-400 font-mono mt-0.5 font-bold uppercase">
                                {t.hashtag}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center rounded bg-slate-800/80 px-2 py-0.5 text-[9px] font-extrabold text-slate-300 border border-white/5 uppercase tracking-wide">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className="font-bold text-emerald-400">+{t.pointsAwarded}</span>
                            <span className="text-[10px] text-slate-500 font-semibold"> / {t.maxPoints}</span>
                          </td>
                          <td className="px-3 py-3 text-right text-slate-400 font-mono whitespace-nowrap">
                            {new Date(t.completedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/10 pt-4 mt-4 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="cursor-pointer px-5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

