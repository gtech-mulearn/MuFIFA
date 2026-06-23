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

  const handleMessageClick = (memberId, phone, currentJoinedStatus) => {
    // Automatically set whatsapp_joined to true on message click if it is currently false
    if (!currentJoinedStatus) {
      handleToggleWhatsApp(memberId, currentJoinedStatus);
    }
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
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
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Phone Number</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">WhatsApp Group</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Message</th>
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

                      {/* Phone Number */}
                      <td className="px-4 py-3.5 font-mono text-slate-300 whitespace-nowrap">
                        {member.phone}
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

                      {/* Direct WhatsApp link button */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleMessageClick(member.id, member.phone, member.whatsapp_joined)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.799-4.389 9.802-9.799.002-2.622-1.02-5.086-2.88-6.949C16.31 1.993 13.85 1.01 11.233 1.01c-5.412 0-9.805 4.39-9.808 9.8-.001 1.83.488 3.618 1.417 5.176l-.99 3.613 3.7-.97c1.51.822 2.911 1.225 4.505 1.225zm11.206-8.238c-.3-.15-1.772-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.174-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.795-1.49-1.778-1.665-2.078-.175-.3-.018-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5s.05-.375-.025-.525c-.075-.15-.676-1.625-.926-2.225-.244-.582-.49-.5-.676-.51-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8 1.016-1.12 1.222-1.6 2.875-1.6 3.025 0 .15.5 2.223 2.1 2.9 1.6.677 2.1.527 2.95.452.85-.075 2.75-1.124 3.125-2.125.375-1 .375-1.875.25-2.075-.125-.2-.45-.3-.75-.45z"/>
                          </svg>
                          Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
