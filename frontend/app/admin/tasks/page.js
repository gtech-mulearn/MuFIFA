"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdmin, THEME } from "../layout";

export default function AdminTasksPage() {
  const admin = useAdmin();
  const isViewer = admin?.role === "viewer";

  // State for Tasks list
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // State for Completions list
  const [completions, setCompletions] = useState([]);
  const [loadingCompletions, setLoadingCompletions] = useState(true);

  // General messages
  const [creditError, setCreditError] = useState("");
  const [creditSuccess, setCreditSuccess] = useState("");

  // Form: Credit Task
  const [playerSearch, setPlayerSearch] = useState("");
  const [searchedPlayers, setSearchedPlayers] = useState([]);
  const [searchingPlayers, setSearchingPlayers] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [creditForm, setCreditForm] = useState({
    points_awarded: 0,
    xp_creativity: 0,
    xp_branding: 0,
    xp_innovation: 0,
    xp_teamwork: 0,
    xp_execution: 0,
  });
  const [creditingTask, setCreditingTask] = useState(false);

  // Fetch all tasks from DB
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/v1/tasks");
      const data = await res.json();
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch {
      console.error("Failed to fetch tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // Fetch completions
  const fetchCompletions = useCallback(async () => {
    setLoadingCompletions(true);
    try {
      const res = await fetch("/api/v1/admin/tasks/completions");
      const data = await res.json();
      if (data.success) {
        setCompletions(data.data || []);
      }
    } catch (err) {
      console.error("Completions error:", err);
    } finally {
      setLoadingCompletions(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchCompletions();
  }, [fetchTasks, fetchCompletions]);

  // Search players as admin types
  useEffect(() => {
    if (!playerSearch.trim()) {
      setSearchedPlayers([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchingPlayers(true);
      try {
        const params = new URLSearchParams({ search: playerSearch, limit: "15" });
        const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setSearchedPlayers(data.users || []);
        }
      } catch (err) {
        console.error("Player search failed:", err);
      } finally {
        setSearchingPlayers(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [playerSearch]);

  // Autofill points & XP when admin changes selected task in credit form
  const handleCreditTaskChange = (taskId) => {
    setSelectedTaskId(taskId);
    if (!taskId) return;

    const matchedTask = tasks.find((t) => t.id === parseInt(taskId, 10));
    if (matchedTask) {
      setCreditForm({
        points_awarded: matchedTask.mupoint || 0,
        xp_creativity: matchedTask.xp_creativity || 0,
        xp_branding: matchedTask.xp_branding || 0,
        xp_innovation: matchedTask.xp_innovation || 0,
        xp_teamwork: matchedTask.xp_teamwork || 0,
        xp_execution: matchedTask.xp_execution || 0,
      });
    }
  };

  // Submit Credit Points / Completion
  const handleCreditTaskSubmit = async (e) => {
    e.preventDefault();
    if (isViewer) return;
    setCreditError("");
    setCreditSuccess("");

    if (!selectedPlayerId || !selectedTaskId) {
      setCreditError("Please select a player and a task.");
      return;
    }

    setCreditingTask(true);
    try {
      const payload = {
        user_id: selectedPlayerId,
        task_id: parseInt(selectedTaskId, 10),
        ...creditForm,
      };

      const res = await fetch("/api/v1/admin/tasks/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setCreditSuccess(data.message || "Task points credited successfully!");
        setSelectedPlayerId("");
        setSelectedTaskId("");
        setPlayerSearch("");
        setCreditForm({
          points_awarded: 0,
          xp_creativity: 0,
          xp_branding: 0,
          xp_innovation: 0,
          xp_teamwork: 0,
          xp_execution: 0,
        });
        fetchCompletions();
      } else {
        setCreditError(data.error || "Failed to credit task points.");
      }
    } catch {
      setCreditError("Network error. Failed to credit task points.");
    } finally {
      setCreditingTask(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
          Progression Task Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Add new arena tasks, credit player completions, and audit progression history
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: FORMS */}
        <div className="flex flex-col gap-6">
          {/* Form 1: Credit Task Progression */}
          <div className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-4`}>
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Credit Task / Award Progression points
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mark a challenge as done for a user and credit points & XP category points
              </p>
            </div>

            {creditError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs py-2 px-3 rounded-xl">
                {creditError}
              </div>
            )}
            {creditSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs py-2 px-3 rounded-xl">
                {creditSuccess}
              </div>
            )}

            <form onSubmit={handleCreditTaskSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  1. Search Player
                </label>
                <input
                  type="text"
                  placeholder="Type player name, email, or MUID..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className={`rounded-xl px-4 py-2.5 transition-colors focus:outline-none ${THEME.input}`}
                />
              </div>

              {/* Player selection dropdown based on search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  2. Select Player {searchingPlayers && <span className="text-sky-500 animate-pulse font-normal lowercase">(searching...)</span>}
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className={`rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none ${THEME.input}`}
                >
                  <option value="">-- Choose Player --</option>
                  {searchedPlayers.map((p) => (
                    <option key={p.id} value={p.user_id}>
                      {p.name} ({p.user_id}) - {p.team} - {p.mu_points} pts
                    </option>
                  ))}
                  {playerSearch.trim() && searchedPlayers.length === 0 && !searchingPlayers && (
                    <option disabled>No players match search</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  3. Select Task
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => handleCreditTaskChange(e.target.value)}
                  className={`rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none ${THEME.input}`}
                >
                  <option value="">-- Choose Task --</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      Task {t.id}: {t.title} (Tier {t.tier})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic point adjustment values */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-3.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Reward Allocation & XP Breakdown</span>
                  <span className="text-[9px] font-normal lowercase text-slate-400 italic">(auto-filled, editable)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">MuPoints</label>
                    <input
                      type="number"
                      value={creditForm.points_awarded}
                      onChange={(e) => setCreditForm({ ...creditForm, points_awarded: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Creativity XP</label>
                    <input
                      type="number"
                      value={creditForm.xp_creativity}
                      onChange={(e) => setCreditForm({ ...creditForm, xp_creativity: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Branding XP</label>
                    <input
                      type="number"
                      value={creditForm.xp_branding}
                      onChange={(e) => setCreditForm({ ...creditForm, xp_branding: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Innovation XP</label>
                    <input
                      type="number"
                      value={creditForm.xp_innovation}
                      onChange={(e) => setCreditForm({ ...creditForm, xp_innovation: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Teamwork XP</label>
                    <input
                      type="number"
                      value={creditForm.xp_teamwork}
                      onChange={(e) => setCreditForm({ ...creditForm, xp_teamwork: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Execution XP</label>
                    <input
                      type="number"
                      value={creditForm.xp_execution}
                      onChange={(e) => setCreditForm({ ...creditForm, xp_execution: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={creditingTask || isViewer}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creditingTask ? "Crediting Points..." : "Credit Task & Award Points"}
                </button>
              </div>
            </form>
          </div>

          {/* Section: Existing Tasks (Read-only quick lookup) */}
          <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Active Arena Tasks
              </h2>
              <Link
                href="/admin/tasks/create"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-1 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              >
                Manage Tasks
              </Link>
            </div>
            {loadingTasks ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-5 h-5 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No tasks defined in DB.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200/90 text-slate-500">
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Tier</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">MuPoints</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">XP Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-slate-200/50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{task.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{task.title}</div>
                          <div className="text-[10px] text-slate-400 max-w-xs truncate">{task.description}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">Tier {task.tier}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-sky-700">+{task.mupoint}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                          C:{task.xp_creativity} | B:{task.xp_branding} | I:{task.xp_innovation} | T:{task.xp_teamwork} | E:{task.xp_execution}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Progression History completions */}
          <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Progression Completion Audits
              </h2>
            </div>
            {loadingCompletions ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-5 h-5 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : completions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No completions recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200/90 text-slate-500">
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Player</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Task ID</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Earned</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completions.map((comp) => (
                      <tr key={comp.id} className="border-b border-slate-200/50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{comp.name}</div>
                          <div className="text-[10px] text-slate-400">MUID: {comp.user_id} ({comp.team})</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">Task {comp.task_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono text-sky-700 font-bold">+{comp.points_awarded} uPts</div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            XP: C:{comp.xp?.creativity} B:{comp.xp?.branding} I:{comp.xp?.innovation} T:{comp.xp?.teamwork} E:{comp.xp?.execution}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 text-[10px] whitespace-nowrap">
                          {comp.completed_at ? new Date(comp.completed_at).toLocaleDateString() : "-"}
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
    </div>
  );
}
