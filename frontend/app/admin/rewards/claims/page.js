"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdmin, THEME } from "../../layout";

const STATUS_OPTIONS = [
  "Status pending",
  "order confirmed",
  "Out for delivery",
  "Shipped",
  "Delivered"
];

const STATUS_BADGE_COLORS = {
  "Status pending": "bg-slate-100 text-slate-700 border-slate-200",
  "order confirmed": "bg-sky-50 text-sky-700 border-sky-200",
  "Out for delivery": "bg-amber-50 text-amber-700 border-amber-200",
  "Shipped": "bg-violet-50 text-violet-700 border-violet-200",
  "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-200"
};

export default function MerchClaimsPage() {
  const admin = useAdmin();
  const isViewer = admin?.role === "viewer";

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClaims, setTotalClaims] = useState(0);

  // Debounced/Triggered search value
  const [triggerSearch, setTriggerSearch] = useState("");

  // Status updating states
  const [updatingId, setUpdatingId] = useState(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: triggerSearch,
        status: statusFilter,
      });

      const res = await fetch(`/api/v1/admin/rewards/claims?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setClaims(data.claims || []);
        setTotalClaims(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError(data.error?.message || "Failed to fetch merchandise claims.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred while loading claims.");
    } finally {
      setLoading(false);
    }
  }, [page, triggerSearch, statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setTriggerSearch(search);
  };

  const handleStatusFilterChange = (e) => {
    setPage(1);
    setStatusFilter(e.target.value);
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  const handleStatusChange = async (claimId, newStatus) => {
    setUpdatingId(claimId);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/rewards/claims", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: claimId, status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess(`Claim status updated to "${newStatus}"`);
        // Refresh local state without a full reload
        setClaims((prevClaims) =>
          prevClaims.map((c) => (c.id === claimId ? { ...c, status: newStatus } : c))
        );
      } else {
        setError(data.error?.message || "Failed to update claim status.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred while updating status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
            Merchandise Claims Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track player redemptions, verify criteria, and update delivery status.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs py-2.5 px-4 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-900 font-bold hover:opacity-80">×</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs py-2.5 px-4 rounded-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-950 font-bold hover:opacity-80">×</button>
        </div>
      )}

      {/* Filters & Search Panel */}
      <div className={`${THEME.panel} rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4`}>
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player name, email, or reward title..."
            className={`flex-1 rounded-xl px-4 py-2 text-xs focus:outline-none ${THEME.input}`}
          />
          <button
            type="submit"
            className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-5 rounded-xl text-xs tracking-wider uppercase transition-all"
          >
            Search
          </button>
        </form>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className={`rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer focus:outline-none ${THEME.input}`}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Claims List Table */}
      <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
            <span className="text-xs">No claims or redemptions matched your query.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-500 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">Player Info</th>
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">Merchandise Reward</th>
                  <th className="text-center px-5 py-3 font-bold uppercase tracking-wider">Requirements Met</th>
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">Claimed At</th>
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider w-56">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => {
                  const merch = claim.merch_items || {};
                  const user = claim.user || {};
                  const hasRequiredLvl = (user.mu_points ?? 0) >= (merch.min_points ?? 0); // basic check display

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Player Info */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{user.name || "Unknown Player"}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{user.email || "-"}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Phone: {user.phone || "-"}</div>
                      </td>

                      {/* Merchandise Reward */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {merch.image_url ? (
                            <img
                              src={merch.image_url.split(",")[0].trim()}
                              alt={merch.title}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-50"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{merch.title || "Deleted Merchandise"}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">ID: {claim.merch_id || "-"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Requirements Met */}
                      <td className="px-5 py-4 text-center font-mono">
                        <div className="text-[10px] text-slate-700">Req: {merch.min_points || 0} μPts</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">User: {user.mu_points || 0} μPts</div>
                      </td>

                      {/* Claimed At */}
                      <td className="px-5 py-4 text-slate-600 font-mono whitespace-nowrap">
                        {claim.claimed_at ? new Date(claim.claimed_at).toLocaleString() : "-"}
                      </td>

                      {/* Status / Select Dropdown */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {isViewer ? (
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                STATUS_BADGE_COLORS[claim.status] || "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {claim.status || "Status pending"}
                            </span>
                          ) : (
                            <div className="relative flex-1">
                              <select
                                value={claim.status || "Status pending"}
                                disabled={updatingId === claim.id}
                                onChange={(e) => handleStatusChange(claim.id, e.target.value)}
                                className={`w-full rounded-xl px-3 py-1.5 text-xs transition-colors cursor-pointer focus:outline-none appearance-none border border-slate-300 pr-8 bg-white font-medium text-slate-700`}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                              </div>
                            </div>
                          )}
                          {updatingId === claim.id && (
                            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
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

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/90 px-6 py-4 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{claims.length}</span> claims of{" "}
              <span className="font-semibold text-slate-800">{totalClaims}</span> total
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                Prev
              </button>
              <span className="text-xs font-medium text-slate-600 px-2 select-none">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
