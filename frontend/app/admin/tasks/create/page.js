"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdmin, THEME } from "../../layout";

export default function AdminCreateTaskPage() {
  const admin = useAdmin();
  const isViewer = admin?.role === "viewer";

  // State for Tasks list
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [taskSuccess, setTaskSuccess] = useState("");

  // Form: Create Task
  const [taskForm, setTaskForm] = useState({
    id: "",
    title: "",
    description: "",
    short_desc: "",
    guidelines: "",
    action_label: "View Details",
    action_url: "#",
    mupoint: 0,
    xp_creativity: 0,
    xp_branding: 0,
    xp_innovation: 0,
    xp_teamwork: 0,
    xp_execution: 0,
    tier: 1,
    category: "",
    logo_url: "",
    compulsory: false,
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setLogoError("");

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch("/api/v1/tasks/upload-logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTaskForm((prev) => ({ ...prev, logo_url: data.logo_url }));
      } else {
        setLogoError(data.error || "Upload failed");
      }
    } catch (err) {
      setLogoError("Network error. Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  // Fetch all tasks from DB
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    setTaskError("");
    try {
      const res = await fetch("/api/v1/tasks");
      const data = await res.json();
      if (data.success) {
        setTasks(data.data || []);
      } else {
        setTaskError(data.error || "Failed to fetch tasks.");
      }
    } catch {
      setTaskError("Failed to connect to server.");
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Submit Create / Update Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (isViewer) return;
    setTaskError("");
    setTaskSuccess("");

    if (!taskForm.id || !taskForm.title || !taskForm.description) {
      setTaskError("Task ID, Title, and Description are required.");
      return;
    }

    setCreatingTask(true);
    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });
      const data = await res.json();

      if (data.success) {
        setTaskSuccess(isEditing ? `Task "${data.data.title}" successfully updated!` : `Task "${data.data.title}" successfully saved!`);
        setTaskForm({
          id: "",
          title: "",
          description: "",
          short_desc: "",
          guidelines: "",
          action_label: "View Details",
          action_url: "#",
          mupoint: 0,
          xp_creativity: 0,
          xp_branding: 0,
          xp_innovation: 0,
          xp_teamwork: 0,
          xp_execution: 0,
          tier: 1,
          category: "",
          logo_url: "",
          compulsory: false,
        });
        setIsEditing(false);
        setEditingTaskId(null);
        fetchTasks();
      } else {
        setTaskError(data.error || "Failed to save task.");
      }
    } catch {
      setTaskError("Network error. Failed to save task.");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleEditClick = (task) => {
    setTaskError("");
    setTaskSuccess("");
    setIsEditing(true);
    setEditingTaskId(task.id);
    setTaskForm({
      id: task.id.toString(),
      title: task.title || "",
      description: task.description || "",
      short_desc: task.short_desc || "",
      guidelines: task.guidelines || "",
      action_label: task.action_label || "View Details",
      action_url: task.action_url || "#",
      mupoint: task.mupoint || 0,
      xp_creativity: task.xp_creativity || 0,
      xp_branding: task.xp_branding || 0,
      xp_innovation: task.xp_innovation || 0,
      xp_teamwork: task.xp_teamwork || 0,
      xp_execution: task.xp_execution || 0,
      tier: task.tier || 1,
      category: task.category || "",
      logo_url: task.logo_url || "",
      compulsory: task.compulsory || false,
    });
    
    // Smooth scroll to form
    const formElement = document.getElementById("task-form-panel");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTaskId(null);
    setTaskError("");
    setTaskSuccess("");
    setTaskForm({
      id: "",
      title: "",
      description: "",
      short_desc: "",
      guidelines: "",
      action_label: "View Details",
      action_url: "#",
      mupoint: 0,
      xp_creativity: 0,
      xp_branding: 0,
      xp_innovation: 0,
      xp_teamwork: 0,
      xp_execution: 0,
      tier: 1,
      category: "",
      logo_url: "",
      compulsory: false,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
          Create & Update Progression Tasks
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Create new challenges for the player progression pitch or edit existing tasks
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: CREATE/UPDATE FORM */}
        <div className="flex flex-col gap-6">
          <div id="task-form-panel" className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-4`}>
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                {isEditing ? "Update Arena Progression Task" : "Create New Arena Progression Task"}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isEditing ? `Modifying Task ID: ${editingTaskId}` : "Add a new task definition to the database and sync it on the challenges page"}
              </p>
            </div>

            {taskError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs py-2 px-3 rounded-xl">
                {taskError}
              </div>
            )}
            {taskSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs py-2 px-3 rounded-xl">
                {taskSuccess}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Task ID (Number, unique)
                  </label>
                  <input
                    type="number"
                    value={taskForm.id}
                    onChange={(e) => setTaskForm({ ...taskForm, id: e.target.value })}
                    placeholder="e.g. 7"
                    disabled={isEditing}
                    readOnly={isEditing}
                    className={`rounded-xl px-4 py-2.5 focus:outline-none ${isEditing ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : THEME.input}`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Tier Level (1 or 2)
                  </label>
                  <select
                    value={taskForm.tier}
                    onChange={(e) => setTaskForm({ ...taskForm, tier: parseInt(e.target.value, 10) || 1 })}
                    className={`rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none ${THEME.input}`}
                  >
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Community Hackathon"
                  className={`rounded-xl px-4 py-2.5 focus:outline-none ${THEME.input}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Task Logo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {taskForm.logo_url && (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-slate-200 shrink-0">
                      <img src={taskForm.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className={`w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 ${uploadingLogo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    />
                    {uploadingLogo && <span className="text-[9px] text-sky-500 font-bold">Uploading logo...</span>}
                    {logoError && <span className="text-[9px] text-rose-500 font-bold">{logoError}</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                  placeholder="Detailed description of the task..."
                  className={`rounded-xl px-4 py-2.5 resize-none focus:outline-none ${THEME.input}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Short Description (optional)
                </label>
                <input
                  type="text"
                  value={taskForm.short_desc}
                  onChange={(e) => setTaskForm({ ...taskForm, short_desc: e.target.value })}
                  placeholder="Summarized challenge card statement..."
                  className={`rounded-xl px-4 py-2.5 focus:outline-none ${THEME.input}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Categories (comma-separated, e.g. UI/UX, Cyber, GitHub)
                </label>
                <input
                  type="text"
                  value={taskForm.category}
                  onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  placeholder="e.g. UI/UX, Cyber"
                  className={`rounded-xl px-4 py-2.5 focus:outline-none ${THEME.input}`}
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskForm.compulsory}
                    onChange={(e) => setTaskForm({ ...taskForm, compulsory: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                  Mark as Compulsory Task
                </label>
                <p className="text-[9px] text-slate-400 pl-6">
                  If ticked, players cannot access tasks with a higher ID until this one is completed.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Guidelines (HTML format, optional)
                  </label>
                  <span className="text-[9px] text-slate-400 italic">Supports HTML &lt;ul&gt; list tags</span>
                </div>
                <textarea
                  value={taskForm.guidelines}
                  onChange={(e) => setTaskForm({ ...taskForm, guidelines: e.target.value })}
                  rows={3}
                  placeholder='<ul class="flex flex-col gap-2.5 list-none pl-0"><li>• Step 1 details</li></ul>'
                  className={`rounded-xl px-4 py-2.5 font-mono resize-none focus:outline-none ${THEME.input}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Action Button Label
                  </label>
                  <input
                    type="text"
                    value={taskForm.action_label}
                    onChange={(e) => setTaskForm({ ...taskForm, action_label: e.target.value })}
                    className={`rounded-xl px-4 py-2.5 focus:outline-none ${THEME.input}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Action URL
                  </label>
                  <input
                    type="text"
                    value={taskForm.action_url}
                    onChange={(e) => setTaskForm({ ...taskForm, action_url: e.target.value })}
                    className={`rounded-xl px-4 py-2.5 focus:outline-none ${THEME.input}`}
                  />
                </div>
              </div>

              {/* Task Rewards Setup */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Default Points & XP Setup</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">MuPoints</label>
                    <input
                      type="number"
                      value={taskForm.mupoint}
                      onChange={(e) => setTaskForm({ ...taskForm, mupoint: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Creativity XP</label>
                    <input
                      type="number"
                      value={taskForm.xp_creativity}
                      onChange={(e) => setTaskForm({ ...taskForm, xp_creativity: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Branding XP</label>
                    <input
                      type="number"
                      value={taskForm.xp_branding}
                      onChange={(e) => setTaskForm({ ...taskForm, xp_branding: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Innovation XP</label>
                    <input
                      type="number"
                      value={taskForm.xp_innovation}
                      onChange={(e) => setTaskForm({ ...taskForm, xp_innovation: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Teamwork XP</label>
                    <input
                      type="number"
                      value={taskForm.xp_teamwork}
                      onChange={(e) => setTaskForm({ ...taskForm, xp_teamwork: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Execution XP</label>
                    <input
                      type="number"
                      value={taskForm.xp_execution}
                      onChange={(e) => setTaskForm({ ...taskForm, xp_execution: parseInt(e.target.value, 10) || 0 })}
                      className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={creatingTask || isViewer}
                  className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creatingTask ? (isEditing ? "Updating Task..." : "Creating Task...") : (isEditing ? "Update & Save Task" : "Create & Save Task")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE PROGRESSION TASKS */}
        <div className="flex flex-col gap-6">
          <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Active Arena Tasks
              </h2>
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
                      <th className="px-4 py-3 font-bold text-center uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-slate-200/50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{task.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {task.logo_url && (
                              <img src={task.logo_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            )}
                            <div className="font-semibold text-slate-800">{task.title}</div>
                          </div>
                          <div className="text-[10px] text-slate-400 max-w-xs truncate">{task.description}</div>
                          {task.category && (
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {task.category.split(",").map((c) => (
                                <span key={c} className="bg-sky-100 text-sky-800 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                                  {c.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          Tier {task.tier}
                          {task.compulsory && <span className="ml-2 bg-rose-100 text-rose-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase block mt-1 w-max">Compulsory</span>}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-sky-700">+{task.mupoint}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                          C:{task.xp_creativity} | B:{task.xp_branding} | I:{task.xp_innovation} | T:{task.xp_teamwork} | E:{task.xp_execution}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEditClick(task)}
                            disabled={isViewer}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 font-bold py-1 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Edit
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
    </div>
  );
}
