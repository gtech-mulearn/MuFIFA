"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { THEME } from "../../layout";

export default function SyncTaskPointsPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [targetUserId, setTargetUserId] = useState("all");
  
  // Editable points state
  const [editValues, setEditValues] = useState({
    mupoint: 0,
    xp_creativity: 0,
    xp_branding: 0,
    xp_innovation: 0,
    xp_teamwork: 0,
    xp_execution: 0,
  });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/v1/tasks?limit=1000&flat=true");
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSync = async () => {
    if (!selectedTaskId) {
      alert("Please select a task to sync.");
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/v1/admin/tasks/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTaskId,
          targetUserId: targetUserId === "all" ? "all" : targetUserId.trim(),
          points: editValues
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setSyncResult({ success: true, message: data.message });
      } else {
        setSyncResult({ success: false, message: data.error || "Failed to sync points." });
      }
    } catch (err) {
      console.error("Sync error:", err);
      setSyncResult({ success: false, message: "Network error occurred." });
    } finally {
      setIsSyncing(false);
    }
  };

  // Update edit values when task selection changes
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id.toString() === selectedTaskId.toString());
      if (task) {
        setEditValues({
          mupoint: task.mupoint || 0,
          xp_creativity: task.xp_creativity || 0,
          xp_branding: task.xp_branding || 0,
          xp_innovation: task.xp_innovation || 0,
          xp_teamwork: task.xp_teamwork || 0,
          xp_execution: task.xp_execution || 0,
        });
      }
    } else {
      setEditValues({
        mupoint: 0, xp_creativity: 0, xp_branding: 0, xp_innovation: 0, xp_teamwork: 0, xp_execution: 0
      });
    }
  }, [selectedTaskId, tasks]);

  const selectedTask = tasks.find(t => t.id.toString() === selectedTaskId.toString());

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
            Retroactive Point Sync
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            If you modify a task's points or XP breakdown, users who already completed it will keep their old scores. 
            Use this tool to retroactively calculate the point difference and correctly update their individual and squad scores to match the new task values.
          </p>
        </div>
        <Link href="/admin/tasks" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-slate-300 transition-colors">
          Back to Tasks
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
        
        {loadingTasks ? (
          <div className="text-center py-10 text-slate-400 text-sm animate-pulse">Loading Tasks...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Select Task to Sync
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className={`rounded-xl px-4 py-3 focus:outline-none appearance-none ${THEME.input}`}
                >
                  <option value="">-- Choose a Task --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      Task {t.id}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target User */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Target User
                </label>
                <select
                  value={targetUserId === "all" ? "all" : "custom"}
                  onChange={(e) => setTargetUserId(e.target.value === "all" ? "all" : "")}
                  className={`rounded-xl px-4 py-3 focus:outline-none appearance-none ${THEME.input}`}
                >
                  <option value="all">All Users Who Completed It</option>
                  <option value="custom">Specific User (by user_id)</option>
                </select>
                
                {targetUserId !== "all" && (
                  <input 
                    type="text" 
                    placeholder="Enter player user_id..."
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className={`mt-2 rounded-xl px-4 py-3 focus:outline-none ${THEME.input}`}
                  />
                )}
              </div>
            </div>

            {/* Editable Task Stats */}
            {selectedTask && (
              <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                <h3 className="text-sm font-semibold text-sky-400 mb-3">Edit Points Before Syncing:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">μPoints</span>
                    <input 
                      type="number" 
                      value={editValues.mupoint}
                      onChange={(e) => setEditValues({...editValues, mupoint: parseInt(e.target.value) || 0})}
                      className="w-full bg-transparent border-b border-white/10 text-lg font-mono text-white focus:outline-none focus:border-sky-500 pb-1"
                    />
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Creativity</span>
                    <input 
                      type="number" 
                      value={editValues.xp_creativity}
                      onChange={(e) => setEditValues({...editValues, xp_creativity: parseInt(e.target.value) || 0})}
                      className="w-full bg-transparent border-b border-white/10 text-lg font-mono text-emerald-400 focus:outline-none focus:border-sky-500 pb-1"
                    />
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Branding</span>
                    <input 
                      type="number" 
                      value={editValues.xp_branding}
                      onChange={(e) => setEditValues({...editValues, xp_branding: parseInt(e.target.value) || 0})}
                      className="w-full bg-transparent border-b border-white/10 text-lg font-mono text-purple-400 focus:outline-none focus:border-sky-500 pb-1"
                    />
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Innovation</span>
                    <input 
                      type="number" 
                      value={editValues.xp_innovation}
                      onChange={(e) => setEditValues({...editValues, xp_innovation: parseInt(e.target.value) || 0})}
                      className="w-full bg-transparent border-b border-white/10 text-lg font-mono text-amber-400 focus:outline-none focus:border-sky-500 pb-1"
                    />
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Teamwork</span>
                    <input 
                      type="number" 
                      value={editValues.xp_teamwork}
                      onChange={(e) => setEditValues({...editValues, xp_teamwork: parseInt(e.target.value) || 0})}
                      className="w-full bg-transparent border-b border-white/10 text-lg font-mono text-sky-400 focus:outline-none focus:border-sky-500 pb-1"
                    />
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Execution</span>
                    <input 
                      type="number" 
                      value={editValues.xp_execution}
                      onChange={(e) => setEditValues({...editValues, xp_execution: parseInt(e.target.value) || 0})}
                      className="w-full bg-transparent border-b border-white/10 text-lg font-mono text-rose-400 focus:outline-none focus:border-sky-500 pb-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {syncResult && (
              <div className={`p-4 rounded-xl border ${syncResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                <div className="flex items-center gap-3">
                  {syncResult.success ? (
                     <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                     <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  )}
                  <span className="text-sm font-medium">{syncResult.message}</span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={handleSync}
                disabled={isSyncing || !selectedTaskId}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-xl transition-all ${
                  isSyncing || !selectedTaskId 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-gradient-to-r from-rose-600 to-orange-500 text-white hover:from-rose-500 hover:to-orange-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                }`}
              >
                {isSyncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Points Now
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
