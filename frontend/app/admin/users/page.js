"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TEAM_FLAGS, THEME } from "../layout";

const DOMAINS = ["Maker", "Creative", "Coder", "Strategist"];
const TEAMS = Object.keys(TEAM_FLAGS);

function TeamBadge({ team }) {
  const code = TEAM_FLAGS[team];
  return code ? (
    <span className={`fi fi-${code} rounded-sm shadow-sm border border-slate-200 shrink-0`} style={{ width: '16px', height: '12px' }} title={team} role="img" aria-label={`${team} flag`} />
  ) : (
    <span className="inline-flex min-w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
      {team.slice(0, 2)}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");

  // Debounce search input to avoid parallel race condition requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (teamFilter) params.set("team", teamFilter);
      if (domainFilter) params.set("domain", domainFilter);

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        setError(data.error?.message || data.error || "Failed to fetch users.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, teamFilter, domainFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
          Registered Users
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {pagination.total} total registrations
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone"
          className={`flex-1 min-w-[200px] rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
        />

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className={`rounded-xl px-3 py-2.5 text-xs transition-colors cursor-pointer appearance-none focus:outline-none ${THEME.input}`}
        >
          <option value="">All Teams</option>
          {TEAMS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className={`rounded-xl px-3 py-2.5 text-xs transition-colors cursor-pointer appearance-none focus:outline-none ${THEME.input}`}
        >
          <option value="">All Domains</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-2.5 px-4 rounded-xl">
          {error}
        </div>
      )}

      <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-500">
                  <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">Domain</th>
                  <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">Team</th>
                  <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">Points</th>
                  <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-200/70 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-800 font-semibold whitespace-nowrap">{user.name}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{user.email}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">{user.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{user.domain}</td>
                    <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                      <span className="mr-3 inline-flex align-middle">
                        <TeamBadge team={user.team} />
                      </span>
                      {user.team}
                    </td>
                    <td className="px-4 py-3 text-right text-sky-700 font-mono font-bold">{user.mu_points}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-slate-700 hover:text-slate-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-slate-300 hover:border-slate-400 hover:bg-slate-100 transition-all"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchUsers(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchUsers(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
