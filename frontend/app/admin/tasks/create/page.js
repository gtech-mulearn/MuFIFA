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
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

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
    category: "",
    logo_url: "",
    compulsory: false,
    verificationType: "none",
    discordHashtag: "",
    parent_id: "",
    visibility: "preview",
  });

  // Progression Levels System State
  const [hasLevels, setHasLevels] = useState(false);
  const [activeAdminLvlTab, setActiveAdminLvlTab] = useState(1);
  const [adminLevels, setAdminLevels] = useState([
    {
      level: 1,
      id: "",
      title: "Level 1: Initiation",
      description: "",
      entries: "",
      mupoint: 0,
      xp_creativity: 0,
      xp_branding: 0,
      xp_innovation: 0,
      xp_teamwork: 0,
      xp_execution: 0,
      verificationType: "none",
      discordHashtag: "",
      action_label: "View Details",
      action_url: "#",
    }
  ]);

  const resetLevels = () => {
    setHasLevels(false);
    setAdminLevels([
      {
        level: 1,
        id: "",
        title: "Level 1: Initiation",
        description: "",
        entries: "",
        mupoint: 0,
        xp_creativity: 0,
        xp_branding: 0,
        xp_innovation: 0,
        xp_teamwork: 0,
        xp_execution: 0,
        verificationType: "none",
        discordHashtag: "",
        action_label: "View Details",
        action_url: "#",
      }
    ]);
    setActiveAdminLvlTab(1);
  };

  const handleAddLevel = () => {
    const nextLevelNum = adminLevels.length + 1;
    setAdminLevels([
      ...adminLevels,
      {
        level: nextLevelNum,
        id: "",
        title: `Level ${nextLevelNum}: Title`,
        description: "",
        entries: "",
        mupoint: 0,
        xp_creativity: 0,
        xp_branding: 0,
        xp_innovation: 0,
        xp_teamwork: 0,
        xp_execution: 0,
        verificationType: "none",
        discordHashtag: "",
        action_label: "View Details",
        action_url: "#",
      }
    ]);
    setActiveAdminLvlTab(nextLevelNum);
  };

  const handleRemoveLevel = (levelIndex) => {
    if (adminLevels.length <= 1) return;
    const updated = adminLevels.filter((_, idx) => idx !== levelIndex).map((lvl, index) => ({
      ...lvl,
      level: index + 1,
    }));
    setAdminLevels(updated);
    setActiveAdminLvlTab(Math.max(1, levelIndex));
  };

  const updateActiveLevelField = (field, value) => {
    setAdminLevels(prev => prev.map((lvl, idx) => {
      if (idx === activeAdminLvlTab - 1) {
        return { ...lvl, [field]: value };
      }
      return lvl;
    }));
  };

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
      const res = await fetch("/api/v1/tasks?flat=true&preview=true");
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
      // 1. Save Parent Task first (with empty guidelines and verification 'none' if levels system is active)
      let parentVerification = taskForm.verificationType;
      if (taskForm.verificationType === "discord api") {
        parentVerification = `discord_api:${taskForm.discordHashtag || ""}`;
      }

      const parentPayload = {
        ...taskForm,
        guidelines: hasLevels ? "" : taskForm.guidelines,
        verification: hasLevels ? "none" : parentVerification,
        parent_id: taskForm.parent_id ? parseInt(taskForm.parent_id, 10) : null,
      };
      delete parentPayload.verificationType;
      delete parentPayload.discordHashtag;

      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentPayload),
      });
      const data = await res.json();

      if (!data.success) {
        setTaskError(data.error || "Failed to save parent task.");
        setCreatingTask(false);
        return;
      }

      // 2. If Levels System is active, save each sub-level task in the database
      if (hasLevels) {
        for (const lvl of adminLevels) {
          const subTaskId = lvl.id ? parseInt(lvl.id, 10) : (parseInt(taskForm.id, 10) * 100 + lvl.level);
          
          let verificationValue = lvl.verificationType;
          if (lvl.verificationType === "discord api") {
            verificationValue = `discord_api:${lvl.discordHashtag || ""}`;
          }

          const subTaskPayload = {
            id: subTaskId,
            title: lvl.title || `Level ${lvl.level}`,
            description: lvl.description || "",
            short_desc: lvl.description || "",
            guidelines: lvl.entries || "",
            action_label: lvl.action_label || "View Details",
            action_url: lvl.action_url || "#",
            mupoint: parseInt(lvl.mupoint || 0, 10),
            xp_creativity: parseInt(lvl.xp_creativity || 0, 10),
            xp_branding: parseInt(lvl.xp_branding || 0, 10),
            xp_innovation: parseInt(lvl.xp_innovation || 0, 10),
            xp_teamwork: parseInt(lvl.xp_teamwork || 0, 10),
            xp_execution: parseInt(lvl.xp_execution || 0, 10),
            category: taskForm.category || "",
            logo_url: taskForm.logo_url || null,
            compulsory: false,
            verification: verificationValue,
            parent_id: parseInt(taskForm.id, 10),
            visibility: taskForm.visibility || "preview",
          };

          const subRes = await fetch("/api/v1/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subTaskPayload),
          });
          if (!subRes.ok) {
            throw new Error(`Failed to save sub-level ${lvl.level}: ${await subRes.text()}`);
          }
        }
      }

      setTaskSuccess(isEditing ? `Task and levels successfully updated!` : `Task and levels successfully saved!`);
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
        category: "",
        logo_url: "",
        compulsory: false,
        verificationType: "none",
        discordHashtag: "",
        parent_id: "",
        visibility: "preview",
      });
      resetLevels();
      setIsEditing(false);
      setEditingTaskId(null);
      fetchTasks();
    } catch (err) {
      console.error(err);
      setTaskError(err.message || "Network error. Failed to save task.");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleEditClick = (task) => {
    setTaskError("");
    setTaskSuccess("");
    setIsEditing(true);
    setEditingTaskId(task.id);

    let vType = "none";
    let hashtag = "";
    if (task.verification) {
      if (task.verification.startsWith("discord_api:")) {
        vType = "discord api";
        hashtag = task.verification.substring("discord_api:".length);
      } else if (task.verification === "custom") {
        vType = "custom";
      } else {
        vType = task.verification;
      }
    }

    // Try to load dynamic levels from database first
    const childTasks = tasks.filter((t) => t.parent_id === task.id).sort((a, b) => a.id - b.id);
    let hasLvlJson = false;
    let loadedLevels = [];

    if (childTasks.length > 0) {
      hasLvlJson = true;
      loadedLevels = childTasks.map((ct, idx) => {
        let cvType = "none";
        let chashtag = "";
        if (ct.verification) {
          if (ct.verification.startsWith("discord_api:")) {
            cvType = "discord api";
            chashtag = ct.verification.substring("discord_api:".length);
          } else if (ct.verification === "custom") {
            cvType = "custom";
          } else {
            cvType = ct.verification;
          }
        }
        return {
          level: idx + 1,
          id: ct.id.toString(),
          title: ct.title || "",
          description: ct.description || "",
          entries: ct.guidelines || "",
          mupoint: ct.mupoint || 0,
          xp_creativity: ct.xp_creativity || 0,
          xp_branding: ct.xp_branding || 0,
          xp_innovation: ct.xp_innovation || 0,
          xp_teamwork: ct.xp_teamwork || 0,
          xp_execution: ct.xp_execution || 0,
          verificationType: cvType,
          discordHashtag: chashtag,
          action_label: ct.action_label || "View Details",
          action_url: ct.action_url || "#",
        };
      });
    } else if (task.guidelines && task.guidelines.trim().startsWith("{\"levels\":")) {
      // Legacy JSON fallback
      try {
        const parsed = JSON.parse(task.guidelines);
        if (parsed && Array.isArray(parsed.levels)) {
          hasLvlJson = true;
          loadedLevels = parsed.levels.map((lvl, idx) => ({
            level: idx + 1,
            id: "",
            title: lvl.title || `Level ${idx + 1}`,
            description: lvl.description || "",
            entries: Array.isArray(lvl.entries) ? lvl.entries.join("\n") : "",
            mupoint: lvl.muPointsReward || 0,
            xp_creativity: lvl.xpReward || 0,
            xp_branding: 0,
            xp_innovation: 0,
            xp_teamwork: 0,
            xp_execution: 0,
            verificationType: "none",
            discordHashtag: "",
            action_label: "View Details",
            action_url: "#",
          }));
        }
      } catch (e) {
        console.error("Error parsing guidelines levels during edit click:", e);
      }
    }

    if (loadedLevels.length === 0) {
      loadedLevels = [
        {
          level: 1,
          id: "",
          title: "Level 1: Initiation",
          description: "",
          entries: "",
          mupoint: 0,
          xp_creativity: 0,
          xp_branding: 0,
          xp_innovation: 0,
          xp_teamwork: 0,
          xp_execution: 0,
          verificationType: "none",
          discordHashtag: "",
          action_label: "View Details",
          action_url: "#",
        }
      ];
    }

    setHasLevels(hasLvlJson);
    setAdminLevels(loadedLevels);

    setTaskForm({
      id: task.id.toString(),
      title: task.title || "",
      description: task.description || "",
      short_desc: task.short_desc || "",
      // Keep guidelines clean if it is level JSON so it doesn't print raw json in html guidelines text box
      guidelines: hasLvlJson ? "" : (task.guidelines || ""),
      action_label: task.action_label || "View Details",
      action_url: task.action_url || "#",
      mupoint: task.mupoint || 0,
      xp_creativity: task.xp_creativity || 0,
      xp_branding: task.xp_branding || 0,
      xp_innovation: task.xp_innovation || 0,
      xp_teamwork: task.xp_teamwork || 0,
      xp_execution: task.xp_execution || 0,
      category: task.category || "",
      logo_url: task.logo_url || "",
      compulsory: task.compulsory || false,
      verificationType: vType,
      discordHashtag: hashtag,
      parent_id: task.parent_id ? task.parent_id.toString() : "",
      visibility: task.visibility || "preview",
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
      category: "",
      logo_url: "",
      compulsory: false,
      verificationType: "none",
      discordHashtag: "",
      parent_id: "",
      visibility: "preview",
    });
    resetLevels();
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
          <div id="task-form-panel" className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-5`}>
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  {isEditing ? "Update Arena Progression Task" : "Create New Arena Progression Task"}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isEditing ? `Modifying Task ID: ${editingTaskId}` : "Add a new task definition to the database"}
                </p>
              </div>
              {isEditing && (
                <span className="bg-sky-100 text-sky-800 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Edit Mode
                </span>
              )}
            </div>

            {taskError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs py-2 px-3 rounded-xl font-medium">
                {taskError}
              </div>
            )}
            {taskSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs py-2 px-3 rounded-xl font-medium">
                {taskSuccess}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="flex flex-col gap-5 text-xs">
              {/* SECTION 1: BASIC DETAILS */}
              <div className="border border-slate-200/80 bg-slate-50/50 p-4 rounded-xl flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 border-b border-slate-200/50 pb-1.5 block">
                  1. Basic Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Task ID (Unique)
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

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
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
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Parent Challenge / Task (Optional)
                  </label>
                  <select
                    value={taskForm.parent_id}
                    onChange={(e) => setTaskForm({ ...taskForm, parent_id: e.target.value })}
                    className={`rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none ${THEME.input}`}
                  >
                    <option value="">None (This is a standalone Challenge / Parent Task)</option>
                    {tasks
                      .filter((t) => t.parent_id === null || t.parent_id === undefined)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Challenge {t.id} - {t.title}
                        </option>
                      ))}
                  </select>
                  <p className="text-[9px] text-slate-400 italic pl-1">
                    Select a parent if this task is a specific sub-level (e.g. Level 1, Level 2) of a main challenge.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Task Logo (Optional Upload)
                  </label>
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                    {taskForm.logo_url && (
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm flex items-center justify-center">
                        <img src={taskForm.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className={`w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 ${uploadingLogo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      />
                      {uploadingLogo && <span className="text-[9px] text-sky-500 font-bold">Uploading logo...</span>}
                      {logoError && <span className="text-[9px] text-rose-500 font-bold">{logoError}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Short Description
                    </label>
                    <textarea
                      value={taskForm.short_desc}
                      onChange={(e) => setTaskForm({ ...taskForm, short_desc: e.target.value })}
                      rows={2}
                      placeholder="Summarized challenge card statement..."
                      className={`rounded-xl px-4 py-2.5 resize-none focus:outline-none ${THEME.input}`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Categories (Select Multiple)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className={`rounded-xl px-4 py-2.5 flex items-center justify-between text-left focus:outline-none cursor-pointer border ${THEME.input}`}
                  >
                    <span className="truncate">
                      {(() => {
                        const selected = !taskForm.category ? [] : taskForm.category.split(",").map(c => c.trim()).filter(Boolean);
                        return selected.length > 0 ? selected.join(", ") : "Select Categories...";
                      })()}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {categoryDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setCategoryDropdownOpen(false)}
                      />
                      <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-20 flex flex-col gap-2 max-h-60 overflow-y-auto">
                        {["Coder", "Social", "Creative", "Maker", "Strategist"].map((cat) => {
                          const selected = !taskForm.category ? [] : taskForm.category.split(",").map(c => c.trim()).filter(Boolean);
                          const isSelected = selected.includes(cat);
                          return (
                            <label
                              key={cat}
                              className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-semibold text-slate-700 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const current = !taskForm.category ? [] : taskForm.category.split(",").map(c => c.trim()).filter(Boolean);
                                  const updated = current.includes(cat)
                                    ? current.filter(c => c !== cat)
                                    : [...current, cat];
                                  setTaskForm({ ...taskForm, category: updated.join(", ") });
                                }}
                                className="w-4 h-4 rounded text-sky-500 border-slate-300 focus:ring-sky-500 cursor-pointer"
                              />
                              <span>{cat}</span>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 bg-sky-50/50 p-2.5 rounded-xl border border-sky-100 mt-1">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskForm.compulsory}
                      onChange={(e) => setTaskForm({ ...taskForm, compulsory: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                    Mark as Compulsory Task
                  </label>
                  <p className="text-[9px] text-slate-500 pl-6">
                    If ticked, players must complete this task before they can unlock tasks with a higher ID.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Visibility & Approval
                  </label>
                  <select
                    value={taskForm.visibility}
                    onChange={(e) => setTaskForm({ ...taskForm, visibility: e.target.value })}
                    className={`rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none ${THEME.input}`}
                  >
                    <option value="preview">Preview / Under Review (Hidden from Users)</option>
                    <option value="public">Public / Approved (Visible to Users)</option>
                    <option value="disabled">Disabled / Deadline Over (Visible but Unactionable)</option>
                  </select>
                  <p className="text-[9px] text-slate-400 italic pl-1">
                    Select &quot;Public&quot; to make this challenge live for all users, &quot;Preview&quot; to keep it hidden, or &quot;Disabled&quot; to mark it as deadline over.
                  </p>
                </div>
              </div>

              {/* SECTION 2: VERIFICATION & ACTIONS */}
              <div className="border border-slate-200/80 bg-slate-50/50 p-4 rounded-xl flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 border-b border-slate-200/50 pb-1.5 block">
                  2. Verification & Action Buttons
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Verification Method
                    </label>
                    <select
                      value={taskForm.verificationType}
                      onChange={(e) => setTaskForm({ ...taskForm, verificationType: e.target.value })}
                      className={`rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none ${THEME.input}`}
                    >
                      <option value="none">Manual Admin Review (Standard)</option>
                      <option value="referral">Referral Check (At least 1 referral)</option>
                      <option value="profile">Profile Completion & Prediction Check</option>
                      <option value="kuzhiundo">Kuzhiyundo Pothole Mapping Check</option>
                      <option value="points">Squad Synergy Points Check (Accumulate 20+ points)</option>
                      <option value="discord api">Discord API (Automated Hashtag check)</option>
                      <option value="custom">Legacy Custom Fallback</option>
                    </select>
                  </div>

                  {taskForm.verificationType === "discord api" ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Discord Hashtag (Required)
                      </label>
                      <input
                        type="text"
                        value={taskForm.discordHashtag}
                        onChange={(e) => setTaskForm({ ...taskForm, discordHashtag: e.target.value })}
                        placeholder="e.g. #hackathon"
                        className={`rounded-xl px-4 py-2.5 focus:outline-none ${THEME.input}`}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col justify-end text-[10px] text-slate-400 italic pl-1 pb-1">
                      Verification requires admin review or custom event logs triggers.
                    </div>
                  )}
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
                      Action URL / Link
                    </label>
                    <input
                      type="text"
                      value={taskForm.action_url}
                      onChange={(e) => setTaskForm({ ...taskForm, action_url: e.target.value })}
                      className={`rounded-xl px-4 py-2.5 focus:outline-none ${THEME.input}`}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROGRESSION LEVELS SYSTEM */}
              <div className="border border-slate-200/80 bg-slate-50/50 p-4 rounded-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 block">
                    3. Level Progression & Rewards
                  </span>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-lg hover:bg-violet-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={hasLevels}
                      onChange={(e) => setHasLevels(e.target.checked)}
                      className="w-3.5 h-3.5 text-violet-600 border-violet-300 rounded focus:ring-violet-500 cursor-pointer"
                    />
                    Enable Levels System
                  </label>
                </div>

                {!hasLevels ? (
                  /* Standard Mode Fields */
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Guidelines (HTML Format, optional)
                        </label>
                        <span className="text-[9px] text-slate-400 italic">Supports tags like &lt;ul&gt;, &lt;li&gt;, etc.</span>
                      </div>
                      <textarea
                        value={taskForm.guidelines}
                        onChange={(e) => setTaskForm({ ...taskForm, guidelines: e.target.value })}
                        rows={3}
                        placeholder='<ul class="flex flex-col gap-2.5 list-none pl-0"><li>• Complete step 1 details</li></ul>'
                        className={`rounded-xl px-4 py-2.5 font-mono resize-none focus:outline-none ${THEME.input}`}
                      />
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 block">Default Points & XP Setup</span>
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
                  </div>
                ) : (                   /* Levels Editor Mode */
                  <div className="flex flex-col gap-4">
                    <div className="bg-violet-50/50 border border-violet-200 text-violet-800 text-[11px] p-3 rounded-xl">
                      <strong>Progression System Active:</strong> Guidelines field is managed through levels configuration below. Each level will be stored in the database as a separate task linked to this challenge.
                    </div>

                    {/* Level Selector Tabs */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                      {adminLevels.map((lvl, index) => (
                        <div key={lvl.level} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveAdminLvlTab(lvl.level)}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all text-xs cursor-pointer ${
                              activeAdminLvlTab === lvl.level
                                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                                : "bg-slate-100 text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Level {lvl.level}
                          </button>
                          {adminLevels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLevel(index)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer font-bold"
                              title="Delete Level"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddLevel}
                        className="px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 border border-dashed border-sky-300 font-bold rounded-lg text-xs cursor-pointer ml-auto"
                      >
                        + Add Level
                      </button>
                    </div>

                    {/* Active Level Form Fields */}
                    {(() => {
                      const activeLvl = adminLevels[activeAdminLvlTab - 1] || adminLevels[0] || {};
                      return (
                        <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-inner text-left">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-[10px] uppercase font-black text-violet-600">
                              Level {activeLvl.level} Configuration
                            </span>
                            {activeLvl.id && (
                              <span className="text-[9px] font-mono text-slate-400">
                                DB Task ID: {activeLvl.id}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-slate-500">Level Title</label>
                              <input
                                type="text"
                                value={activeLvl.title || ""}
                                onChange={(e) => updateActiveLevelField("title", e.target.value)}
                                className={`rounded-lg px-3 py-2 ${THEME.input}`}
                                placeholder={`e.g. Level ${activeLvl.level}: Initiation`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-slate-500">Level Description</label>
                              <input
                                type="text"
                                value={activeLvl.description || ""}
                                onChange={(e) => updateActiveLevelField("description", e.target.value)}
                                className={`rounded-lg px-3 py-2 ${THEME.input}`}
                                placeholder="e.g. Complete basic task setup."
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <label className="text-[9px] uppercase font-bold text-slate-500">Milestones/Checks (one per line)</label>
                              <span className="text-[8px] text-slate-400">Checkbox items for this level</span>
                            </div>
                            <textarea
                              value={activeLvl.entries || ""}
                              onChange={(e) => updateActiveLevelField("entries", e.target.value)}
                              rows={2}
                              className={`rounded-lg px-3 py-2 ${THEME.input}`}
                              placeholder="e.g. Checkbox item 1&#10;Checkbox item 2"
                            />
                          </div>

                          {/* Verification mechanism per level */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-slate-500">Verification Method</label>
                              <select
                                value={activeLvl.verificationType || "none"}
                                onChange={(e) => updateActiveLevelField("verificationType", e.target.value)}
                                className={`rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none ${THEME.input}`}
                              >
                                <option value="none">Manual Admin Review (Standard)</option>
                                <option value="referral">Referral Check (At least 1 referral)</option>
                                <option value="profile">Profile Completion & Prediction Check</option>
                                <option value="kuzhiundo">Kuzhiyundo Pothole Mapping Check</option>
                                <option value="points">Squad Synergy Points Check (Accumulate 20+ points)</option>
                                <option value="discord api">Discord API (Automated Hashtag check)</option>
                                <option value="custom">Legacy Custom Fallback</option>
                              </select>
                            </div>
                            {activeLvl.verificationType === "discord api" ? (
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold text-slate-500">Discord Hashtag (Required)</label>
                                <input
                                  type="text"
                                  value={activeLvl.discordHashtag || ""}
                                  onChange={(e) => updateActiveLevelField("discordHashtag", e.target.value)}
                                  placeholder="e.g. #hackathon"
                                  className={`rounded-lg px-2.5 py-1.5 focus:outline-none ${THEME.input}`}
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col justify-end text-[9px] text-slate-400 italic pb-1">
                                Verification requires admin review or custom event log triggers.
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-slate-500">Action Button Label</label>
                              <input
                                type="text"
                                value={activeLvl.action_label || "View Details"}
                                onChange={(e) => updateActiveLevelField("action_label", e.target.value)}
                                className={`rounded-lg px-3 py-2 ${THEME.input}`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-slate-500">Action URL / Link</label>
                              <input
                                type="text"
                                value={activeLvl.action_url || "#"}
                                onChange={(e) => updateActiveLevelField("action_url", e.target.value)}
                                className={`rounded-lg px-3 py-2 ${THEME.input}`}
                              />
                            </div>
                          </div>

                          {/* Level rewards - MuPoints and all XP options */}
                          <div className="border-t border-dashed border-slate-200 pt-3">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 block">Level Points & XP Setup</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold uppercase text-slate-500">MuPoints</label>
                                <input
                                  type="number"
                                  value={activeLvl.mupoint || 0}
                                  onChange={(e) => updateActiveLevelField("mupoint", parseInt(e.target.value, 10) || 0)}
                                  className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Creativity XP</label>
                                <input
                                  type="number"
                                  value={activeLvl.xp_creativity || 0}
                                  onChange={(e) => updateActiveLevelField("xp_creativity", parseInt(e.target.value, 10) || 0)}
                                  className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Branding XP</label>
                                <input
                                  type="number"
                                  value={activeLvl.xp_branding || 0}
                                  onChange={(e) => updateActiveLevelField("xp_branding", parseInt(e.target.value, 10) || 0)}
                                  className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Innovation XP</label>
                                <input
                                  type="number"
                                  value={activeLvl.xp_innovation || 0}
                                  onChange={(e) => updateActiveLevelField("xp_innovation", parseInt(e.target.value, 10) || 0)}
                                  className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Teamwork XP</label>
                                <input
                                  type="number"
                                  value={activeLvl.xp_teamwork || 0}
                                  onChange={(e) => updateActiveLevelField("xp_teamwork", parseInt(e.target.value, 10) || 0)}
                                  className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Execution XP</label>
                                <input
                                  type="number"
                                  value={activeLvl.xp_execution || 0}
                                  onChange={(e) => updateActiveLevelField("xp_execution", parseInt(e.target.value, 10) || 0)}
                                  className={`rounded-lg px-2.5 py-1.5 font-mono ${THEME.input}`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}</div>
                )}
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
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">MuPoints</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">XP Breakdown</th>
                      <th className="px-4 py-3 font-bold text-center uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.filter((t) => t.parent_id === null || t.parent_id === undefined).map((task) => (
                      <tr key={task.id} className="border-b border-slate-200/50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{task.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {task.logo_url && (
                              <img src={task.logo_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            )}
                            <div className="font-semibold text-slate-800">{task.title}</div>
                            {task.compulsory && <span className="bg-rose-100 text-rose-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase w-max">Compulsory</span>}
                            {task.visibility === "public" ? (
                              <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase w-max">Public</span>
                            ) : task.visibility === "disabled" ? (
                              <span className="bg-rose-100 text-rose-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase w-max">Disabled</span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase w-max">Preview</span>
                            )}
                            {task.guidelines && task.guidelines.trim().startsWith("{\"levels\":") && (
                              <span className="bg-violet-100 text-violet-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase w-max">Levels</span>
                            )}
                            {task.parent_id && (
                              <span className="bg-slate-100 text-slate-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase w-max">
                                Sub-level of #{task.parent_id}
                              </span>
                            )}
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
