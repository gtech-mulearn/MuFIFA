"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FLAGS, getRankStyle, getInitials } from "../utils";
import Avatar from "../../../components/Avatar";

export default function CollegeStandings() {
  const [collegesData, setCollegesData] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  const [debouncedCollegeSearch, setDebouncedCollegeSearch] = useState("");
  const [expandedColleges, setExpandedColleges] = useState({});
  const [collegeMembers, setCollegeMembers] = useState({});
  const [membersLoading, setMembersLoading] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCollegeSearch(collegeSearchQuery);
    }, 450);
    return () => clearTimeout(timer);
  }, [collegeSearchQuery]);

  const fetchColleges = useCallback(async () => {
    setCollegesLoading(true);
    try {
      const res = await fetch(
        `/api/v1/leaderboard/colleges?search=${encodeURIComponent(debouncedCollegeSearch)}`,
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCollegesData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch colleges:", err);
    } finally {
      setCollegesLoading(false);
    }
  }, [debouncedCollegeSearch]);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  const toggleCollegeExpand = async (collegeName) => {
    const nextState = !expandedColleges[collegeName];
    setExpandedColleges((prev) => ({
      ...prev,
      [collegeName]: nextState,
    }));

    if (nextState && !collegeMembers[collegeName] && !membersLoading[collegeName]) {
      setMembersLoading((prev) => ({ ...prev, [collegeName]: true }));
      try {
        const res = await fetch(
          `/api/v1/leaderboard/colleges/members?college=${encodeURIComponent(collegeName)}`,
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setCollegeMembers((prev) => ({
            ...prev,
            [collegeName]: data.data,
          }));
        }
      } catch (err) {
        console.error(`Failed to fetch members for ${collegeName}:`, err);
      } finally {
        setMembersLoading((prev) => ({ ...prev, [collegeName]: false }));
      }
    }
  };

  return (
    <>
      <div className="px-2 sm:px-3">
        <input
          type="text"
          placeholder="Search college name..."
          value={collegeSearchQuery}
          onChange={(e) => setCollegeSearchQuery(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] w-full transition-colors"
        />
      </div>

      <div className="flex flex-col">
        {collegesLoading && collegesData.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#06B6D4] border-t-transparent animate-spin" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Loading Colleges...
            </span>
          </div>
        ) : collegesData.length > 0 ? (
          collegesData.map((college) => {
            const isExpanded = !!expandedColleges[college.name];
            return (
              <div key={college.name} className="flex flex-col border-b border-white/5 last:border-b-0">
                <button
                  onClick={() => toggleCollegeExpand(college.name)}
                  className="flex items-center justify-between py-3 px-2 sm:px-3 hover:bg-white/[0.02] transition-colors group text-left w-full cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border shrink-0 ${getRankStyle(college.rank)}`}
                    >
                      {college.rank}
                    </span>

                    <div className="w-7 h-7 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px]">🏛️</span>
                    </div>

                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                        {college.name}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 truncate">
                        {college.memberCount} {college.memberCount === 1 ? "player" : "players"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-0.5 min-w-[60px] justify-end">
                      <span className="text-xs sm:text-base md:text-lg font-bold text-[#06B6D4]">
                        {college.totalPoints}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold ml-0.5">
                        pts
                      </span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 sm:px-8 py-3 bg-black/40 border-t border-white/5 flex flex-col gap-2.5 transition-all duration-300 animate-in slide-in-from-top-2 duration-200">
                    <div className="text-[9px] font-black tracking-wider text-slate-500 uppercase pb-1 flex items-center gap-1">
                      <span>College Members</span>
                      <span className="w-1 h-1 rounded-full bg-[#06B6D4]/30" />
                      <span>{college.memberCount} registered</span>
                    </div>
                    {membersLoading[college.name] ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-[#06B6D4] border-t-transparent animate-spin" />
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                          Loading Members...
                        </span>
                      </div>
                    ) : collegeMembers[college.name] && collegeMembers[college.name].length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {collegeMembers[college.name].map((member, mIdx) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-200 group/member"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-[10px] font-extrabold text-slate-500 w-5 text-left">
                                #{mIdx + 1}
                              </span>

                              {(() => {
                                let eqFrame = "";
                                if (member.tasks) {
                                  if (typeof member.tasks === "object") {
                                    eqFrame = member.tasks.equipped_frame || "";
                                  } else if (typeof member.tasks === "string") {
                                    try {
                                      const parsed = JSON.parse(member.tasks);
                                      eqFrame = parsed.equipped_frame || "";
                                    } catch (e) {}
                                  }
                                }
                                return (
                                  <Avatar
                                    avatarUrl={member.avatar_url}
                                    name={member.name}
                                    equippedFrame={eqFrame}
                                    sizeClass="w-7 h-7"
                                    initialsSizeClass="text-[8px]"
                                    borderClass="border border-white/5 bg-slate-800"
                                  />
                                );
                              })()}

                              <div className="flex flex-col min-w-0 text-left">
                                <Link
                                  href={`/profile/${member.user_id}`}
                                  className="text-xs font-bold text-slate-300 group-hover/member:text-white hover:underline truncate"
                                >
                                  {member.name}
                                </Link>
                                <span className="text-[8px] sm:text-[9px] font-semibold text-slate-500 truncate">
                                  @{member.user_id}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {FLAGS[member.team] && (
                                <span
                                  className={`fi fi-${FLAGS[member.team]} rounded-sm shadow-sm border border-white/10`}
                                  style={{ width: "14px", height: "10.5px" }}
                                  title={member.team}
                                />
                              )}

                              <div className="flex items-center gap-0.5 min-w-[50px] justify-end">
                                <span className="text-xs font-extrabold text-[#06B6D4]">
                                  {member.mu_points}
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                                  pts
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic py-2 text-center">No members registered in this college.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 mx-2 sm:mx-3 text-center text-slate-500 text-xs font-bold border border-white/5 rounded-lg bg-white/[0.005]">
            No colleges match your search query.
          </div>
        )}
      </div>
    </>
  );
}
