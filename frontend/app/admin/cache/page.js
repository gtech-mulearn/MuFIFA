"use client";

import React, { useState, useEffect, useCallback } from "react";
import { THEME } from "../layout";

export default function CacheManagerPage() {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchCacheStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/cache");
      const data = await res.json();
      if (data.success) {
        setCacheStatus(data.cache);
      } else {
        setError(data.error?.message || "Failed to load cache status.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch cache status due to a network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCacheStatus();
  }, [fetchCacheStatus]);

  const handleClearCache = async () => {
    setClearing(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/v1/admin/cache", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message || "Cache cleared successfully.");
        await fetchCacheStatus();
      } else {
        setError(data.error?.message || "Failed to clear cache.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to clear cache due to a network error.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
            Cache Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage in-memory cache standings for individual mappers and team standings to force data freshness.
          </p>
        </div>
        <button
          onClick={fetchCacheStatus}
          disabled={loading || clearing}
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
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Refresh Status
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="bg-emerald-55 text-emerald-800 border border-emerald-200 text-xs py-3.5 px-5 rounded-xl flex items-center gap-2 shadow-sm font-semibold">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {message}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs py-3.5 px-5 rounded-xl flex items-center gap-2 shadow-sm font-semibold">
          <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Warning Notice Card */}
      <div className="bg-amber-50/50 border border-amber-250/70 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
          Important Notice
        </span>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Kuzhiundo individuals and squad leaderboards are cached for **1 hour** in-memory to prevent rate-limiting and performance bottlenecks. Clearing the cache will instantly invalidate current cache files. The next user to visit the `/kuzhiundo` page will trigger a fresh fetch from the Supabase registrations database.
        </p>
      </div>

      {/* Cache Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Individuals Cache Status */}
        <div className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Individual Mappers Cache
            </h2>
            {loading ? (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-350 animate-pulse" />
            ) : cacheStatus?.individuals?.cached ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-550 border border-slate-200">
                Empty
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Cached Records:</span>
              <span className="font-mono font-bold text-slate-800">
                {loading ? "..." : cacheStatus?.individuals?.count || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Last Cached:</span>
              <span className="font-mono text-slate-700 text-right max-w-[180px] break-words">
                {loading
                  ? "..."
                  : cacheStatus?.individuals?.timestamp
                  ? new Date(cacheStatus.individuals.timestamp).toLocaleString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Teams Cache Status */}
        <div className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Team Squads Cache
            </h2>
            {loading ? (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-350 animate-pulse" />
            ) : cacheStatus?.teams?.cached ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-550 border border-slate-200">
                Empty
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Cached Records:</span>
              <span className="font-mono font-bold text-slate-800">
                {loading ? "..." : cacheStatus?.teams?.count || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Last Cached:</span>
              <span className="font-mono text-slate-700 text-right max-w-[180px] break-words">
                {loading
                  ? "..."
                  : cacheStatus?.teams?.timestamp
                  ? new Date(cacheStatus.teams.timestamp).toLocaleString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Panel */}
      <div className={`${THEME.panel} rounded-2xl p-6 flex items-center justify-between gap-4 mt-2`}>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800">
            Clear Cached Standings
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Invalidate cache instantly. This will affect both individuals and squads standings.
          </span>
        </div>
        <button
          onClick={handleClearCache}
          disabled={clearing}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/10 active:scale-95"
        >
          {clearing ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
          Clear Kuzhiundo Cache
        </button>
      </div>
    </div>
  );
}
