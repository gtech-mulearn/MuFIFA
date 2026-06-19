"use client";

import React, { useState } from "react";
import { THEME } from "../layout";

export default function ApiTestPage() {
  const defaultApiKey = "mufifa_search_ext_a62e30f1d0b5e4071869e5d4cb";
  const [endpoint, setEndpoint] = useState("/api/v1/kuzhiundo");
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Performance and response metadata
  const [meta, setMeta] = useState({
    status: null,
    latency: null,
    cacheControl: null,
  });

  const handleSearch = async (queryOverride = null, keyOverride = null) => {
    const activeQuery = queryOverride !== null ? queryOverride : searchQuery;
    const activeKey = keyOverride !== null ? keyOverride : apiKey;

    setLoading(true);
    setError(null);
    setResults(null);
    setMeta({ status: null, latency: null, cacheControl: null });

    const startTime = performance.now();
    try {
      const url = `${endpoint}?q=${encodeURIComponent(activeQuery)}&limit=${limit}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": activeKey,
        },
      });

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      const cacheControl = res.headers.get("Cache-Control");

      const body = await res.json();
      
      setMeta({
        status: res.status,
        latency,
        cacheControl: cacheControl || "None",
      });

      if (res.ok && body.success) {
        setResults(body.data);
      } else {
        setError(body.error || { message: "Failed to fetch results" });
      }
    } catch (err) {
      const endTime = performance.now();
      setMeta({
        status: "Network Error",
        latency: Math.round(endTime - startTime),
        cacheControl: "N/A",
      });
      setError({ message: err.message || "An unexpected network error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestion = (q, useInvalidKey = false) => {
    setSearchQuery(q);
    const key = useInvalidKey ? "wrong_api_key_123" : defaultApiKey;
    if (useInvalidKey) {
      setApiKey(key);
    } else {
      setApiKey(defaultApiKey);
    }
    handleSearch(q, key);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
          API Search Test
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Interactive developer tool to test and audit the secure, optimized user search endpoint
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Request Configuration */}
        <div className={`${THEME.panel} rounded-2xl p-5 flex flex-col gap-4 lg:col-span-1`}>
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700 border-b pb-2">
            Request Settings
          </h3>

          {/* Endpoint Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              API Endpoint
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-xs outline-none ${THEME.input}`}
            />
          </div>

          {/* API Key Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              API Key (x-api-key)
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter search API key..."
                className={`w-full rounded-xl px-3 py-2 text-xs outline-none font-mono ${THEME.input}`}
              />
              {apiKey !== defaultApiKey && (
                <button
                  onClick={() => setApiKey(defaultApiKey)}
                  className="absolute right-2 top-1.5 text-[9px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 hover:bg-sky-100 transition-colors"
                  title="Reset to default API key"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Search Term Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Search Term (q)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. nivedh, girioff, etc."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={`w-full rounded-xl px-3 py-2 text-xs outline-none ${THEME.input}`}
            />
          </div>

          {/* Result Limit Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Max Results</span>
              <span className="font-mono text-slate-700">{limit}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md shadow-sky-600/10 hover:shadow-sky-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                </svg>
                <span>Send Request</span>
              </>
            )}
          </button>

          {/* Quick Verification Presets */}
          <div className="flex flex-col gap-2 border-t pt-3 mt-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Quick Test Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => loadSuggestion("nivedh")}
                className="text-left text-[10px] text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-1.5 transition-colors truncate"
              >
                🔍 Search "nivedh"
              </button>
              <button
                onClick={() => loadSuggestion("girioff")}
                className="text-left text-[10px] text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-1.5 transition-colors truncate"
              >
                🔍 Search "girioff"
              </button>
              <button
                onClick={() => loadSuggestion("ab")}
                className="text-left text-[10px] text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-1.5 transition-colors truncate"
              >
                ❌ Query too short (Zod)
              </button>
              <button
                onClick={() => loadSuggestion("nivedh", true)}
                className="text-left text-[10px] text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-1.5 transition-colors truncate"
              >
                ❌ Invalid Key (401)
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Response & Results */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* Latency card */}
            <div className={`${THEME.panelSoft} rounded-2xl p-4 flex flex-col gap-1`}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Latency
              </span>
              <span className={`text-xl font-bold font-mono ${
                meta.latency === null 
                  ? "text-slate-300" 
                  : meta.latency < 100 
                  ? "text-emerald-600" 
                  : meta.latency < 300 
                  ? "text-amber-500" 
                  : "text-rose-500"
              }`}>
                {meta.latency !== null ? `${meta.latency} ms` : "--"}
              </span>
            </div>

            {/* HTTP Status Code Card */}
            <div className={`${THEME.panelSoft} rounded-2xl p-4 flex flex-col gap-1`}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Status
              </span>
              <span className={`text-xl font-bold font-mono ${
                meta.status === null
                  ? "text-slate-300"
                  : meta.status === 200
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}>
                {meta.status !== null ? meta.status : "--"}
              </span>
            </div>

            {/* Cache Control Card */}
            <div className={`${THEME.panelSoft} rounded-2xl p-4 flex flex-col gap-1`}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Cache Control
              </span>
              <span className="text-xs font-semibold text-slate-700 truncate font-mono mt-1">
                {meta.cacheControl !== null ? meta.cacheControl : "--"}
              </span>
            </div>
          </div>

          {/* Results display panel */}
          <div className={`${THEME.panel} rounded-2xl p-5 flex flex-col gap-4 min-h-[250px] relative`}>
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700 border-b pb-2">
              Response Output
            </h3>

            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-sky-600/70 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 tracking-wider">Fetching optimized data...</span>
                </div>
              </div>
            )}

            {!results && !error && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                <svg className="w-8 h-8 stroke-slate-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-xs">No request sent yet. Modify settings and click "Send Request".</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-xl flex flex-col gap-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="text-rose-600 text-sm">⚠️</span> Error: {error.code || "UNKNOWN_ERROR"}
                </div>
                <div className="text-rose-700 font-mono mt-0.5">{error.message}</div>
                {error.details && (
                  <pre className="bg-rose-100/50 p-2.5 rounded-lg font-mono text-[10px] text-rose-900 border border-rose-200 mt-2 overflow-x-auto max-w-full">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {results && results.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-8">
                <p className="text-xs font-semibold">No records found matching query.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Try searching for "nivedh" or "girioff".</p>
              </div>
            )}

            {results && results.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-2 text-[10px] w-8"></th>
                        <th className="px-4 py-2 text-[10px]">Name</th>
                        <th className="px-4 py-2 text-[10px]">User ID</th>
                        <th className="px-4 py-2 text-[10px]">Email</th>
                        <th className="px-4 py-2 text-[10px]">Squad</th>
                        <th className="px-4 py-2 text-[10px] w-40">ID (UUID)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200">
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{user.name}</td>
                          <td className="px-4 py-2.5 font-mono text-sky-700">{user.user_id}</td>
                          <td className="px-4 py-2.5 text-slate-600">{user.email}</td>
                          <td className="px-4 py-2.5">
                            {user.squad ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-100">
                                ⚽ {user.squad}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-400 text-[10px] select-all truncate max-w-[100px]" title={user.id}>{user.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] text-slate-400 font-mono text-right">
                  Query returned {results.length} record(s)
                </div>
              </div>
            )}

            {/* Raw JSON viewer */}
            {(results || error) && (
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Raw JSON Payload
                </label>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[10.5px] overflow-x-auto max-h-[220px] max-w-full border border-slate-900 shadow-inner">
                  {JSON.stringify(results ? { success: true, data: results } : { success: false, error }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
