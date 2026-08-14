"use client";

import React, { useState, useEffect } from "react";
import { THEME } from "../layout";
import { isPastDeadline } from "@/utils/ascendDeadline";

const DOMAINS = ["Coder", "Creative", "Management", "Maker"];

const DOMAIN_STYLES = {
  Coder: "bg-cyan-50 border-cyan-200 text-cyan-700",
  Creative: "bg-pink-50 border-pink-200 text-pink-700",
  Management: "bg-amber-50 border-amber-200 text-amber-700",
  Maker: "bg-indigo-50 border-indigo-200 text-indigo-700",
};

export default function AdminAscendPage() {
  const [activeTab, setActiveTab] = useState("registered_users"); // "registered_users" or "submissions" or "create_task" or "tasks_list"

  // Registered Users state
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [registeredUsersLoading, setRegisteredUsersLoading] = useState(true);
  const [ascendStats, setAscendStats] = useState(null);
  const [regSearchQuery, setRegSearchQuery] = useState("");
  const [regFilterDomain, setRegFilterDomain] = useState("All");

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyLogo, setEditCompanyLogo] = useState("");
  const [editDomain, setEditDomain] = useState("Coder");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editPerks, setEditPerks] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMsg, setEditMsg] = useState({ type: "", text: "" });

  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  // Create Task form state
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [domain, setDomain] = useState("Coder");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [perks, setPerks] = useState("");
  const [deadline, setDeadline] = useState("2026-08-18");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: "", text: "" });

  // Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [qualityScore, setQualityScore] = useState(5);
  const [innovationScore, setInnovationScore] = useState(5);
  const [gradingStatus, setGradingStatus] = useState("Graded");
  const [adminFeedback, setAdminFeedback] = useState("");
  const [gradeSubmitting, setGradeSubmitting] = useState(false);

  // Filters
  const [filterDomain, setFilterDomain] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchRegistrations = async () => {
    try {
      setRegisteredUsersLoading(true);
      const res = await fetch("/api/v1/admin/ascend/registrations");
      const data = await res.json();
      if (data.success) {
        setRegisteredUsers(data.registrations || []);
        setAscendStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to load ascend registrations:", err);
    } finally {
      setRegisteredUsersLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await fetch("/api/v1/admin/ascend/tasks");
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      const res = await fetch("/api/v1/admin/ascend/verify");
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchTasks();
    fetchSubmissions();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/v1/admin/ascend/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          company_logo: companyLogo,
          domain,
          title,
          description,
          requirements,
          perks,
          deadline: deadline || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormMsg({ type: "success", text: "Company task created successfully!" });
        setCompanyName("");
        setCompanyLogo("");
        setTitle("");
        setDescription("");
        setRequirements("");
        setPerks("");
        setDeadline("2026-08-18");
        fetchTasks();
      } else {
        setFormMsg({ type: "error", text: data.error || "Failed to create task" });
      }
    } catch (err) {
      setFormMsg({ type: "error", text: "Network request failed." });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenGradeModal = (sub) => {
    setSelectedSubmission(sub);
    setQualityScore(sub.quality_score || 5);
    setInnovationScore(sub.innovation_score || 5);
    setGradingStatus(sub.status || "Graded");
    setAdminFeedback(sub.admin_feedback || "");
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;
    setGradeSubmitting(true);

    try {
      const res = await fetch("/api/v1/admin/ascend/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: selectedSubmission.id,
          quality_score: qualityScore,
          innovation_score: innovationScore,
          status: gradingStatus,
          admin_feedback: adminFeedback,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedSubmission(null);
        fetchSubmissions();
      } else {
        alert(data.error || "Failed to submit grade");
      }
    } catch (err) {
      console.error("Grading failed:", err);
      alert("Error submitting grade");
    } finally {
      setGradeSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (subId) => {
    if (!confirm("Are you sure you want to delete this student submission?")) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/ascend/submissions?id=${subId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchSubmissions();
      } else {
        alert(data.error || "Failed to delete submission");
      }
    } catch (err) {
      console.error("Failed to delete submission:", err);
      alert("Error deleting submission");
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setDeletingTask(true);

    try {
      const res = await fetch(`/api/v1/admin/ascend/tasks?id=${taskToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setTaskToDelete(null);
        fetchTasks();
      } else {
        alert(data.error || "Failed to delete task.");
      }
    } catch (err) {
      console.error("Delete task error:", err);
      alert("Error deleting task.");
    } finally {
      setDeletingTask(false);
    }
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setEditCompanyName(task.company_name || "");
    setEditCompanyLogo(task.company_logo || "");
    setEditDomain(task.domain || "Coder");
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditRequirements(task.requirements || "");
    setEditPerks(task.perks || "");
    setEditDeadline(
      task.deadline ? new Date(task.deadline).toISOString().split("T")[0] : ""
    );
    setEditMsg({ type: "", text: "" });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setEditSubmitting(true);
    setEditMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/v1/admin/ascend/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask.id,
          company_name: editCompanyName,
          company_logo: editCompanyLogo,
          domain: editDomain,
          title: editTitle,
          description: editDescription,
          requirements: editRequirements,
          perks: editPerks,
          deadline: editDeadline || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditMsg({ type: "success", text: "Company task updated successfully!" });
        setTimeout(() => {
          setEditingTask(null);
          fetchTasks();
        }, 600);
      } else {
        setEditMsg({ type: "error", text: data.error || "Failed to update task." });
      }
    } catch (err) {
      console.error("Update task error:", err);
      setEditMsg({ type: "error", text: "Network request failed." });
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const taskDomain = sub.ascend_tasks?.domain || "";
    if (filterDomain !== "All" && taskDomain !== filterDomain) return false;
    if (filterStatus !== "All" && sub.status !== filterStatus) return false;
    return true;
  });

  const filteredRegistrations = registeredUsers.filter((reg) => {
    if (regFilterDomain !== "All" && reg.primary_domain !== regFilterDomain) return false;
    if (regSearchQuery.trim()) {
      const query = regSearchQuery.toLowerCase();
      const name = (reg.registrations?.name || "").toLowerCase();
      const userId = (reg.user_id || "").toLowerCase();
      const email = (reg.registrations?.email || "").toLowerCase();
      const skills = (reg.skills || "").toLowerCase();
      if (
        !name.includes(query) &&
        !userId.includes(query) &&
        !email.includes(query) &&
        !skills.includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
            Ascend Competition Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage company bounties, registered participants, and evaluate student submissions.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab("registered_users")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "registered_users"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Registered Users ({registeredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "submissions"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab("tasks_list")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "tasks_list"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("create_task")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "create_task"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            + New Company Task
          </button>
        </div>
      </div>

      {/* Minimal Ascend Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`${THEME.panel} rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Registered</span>
            <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {ascendStats?.totalRegistered ?? registeredUsers.length}
          </div>
        </div>

        <div className={`${THEME.panel} rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Registered Today</span>
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600">
            {ascendStats?.todayCount ?? 0}
          </div>
        </div>

        <div className={`${THEME.panel} rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Submissions</span>
            <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-sky-600">
            {ascendStats?.totalSubmissions ?? submissions.length}
          </div>
        </div>
      </div>

      {/* TAB: REGISTERED USERS */}
      {activeTab === "registered_users" && (
        <div className={`${THEME.panel} rounded-2xl overflow-hidden p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Ascend Registered Participants
            </h2>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <input
                type="text"
                placeholder="Search name, ID, email, skills..."
                value={regSearchQuery}
                onChange={(e) => setRegSearchQuery(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-violet-500 w-48 sm:w-60"
              />

              {/* Domain Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-semibold">Domain:</span>
                <select
                  value={regFilterDomain}
                  onChange={(e) => setRegFilterDomain(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none"
                >
                  <option value="All">All Domains</option>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {registeredUsersLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Loading Registered Users...</span>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No registered participants found matching the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Participant</th>
                    <th className="py-3 px-4">Primary Domain</th>
                    <th className="py-3 px-4">Portfolio & Socials</th>
                    <th className="py-3 px-4">Skills</th>
                    <th className="py-3 px-4 text-right">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.map((reg) => {
                    const studentName = reg.registrations?.name || reg.user_id;
                    const email = reg.registrations?.email || "";
                    const phone = reg.registrations?.phone || "";
                    const avatar = reg.registrations?.avatar_url || "";
                    const domainStyle = DOMAIN_STYLES[reg.primary_domain] || "bg-slate-100 text-slate-700";

                    return (
                      <tr key={reg.id || reg.user_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0 border border-violet-200 overflow-hidden text-xs">
                              {avatar ? (
                                <img src={avatar} alt={studentName} className="w-full h-full object-cover" />
                              ) : (
                                studentName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{studentName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                @{reg.user_id} {email && `• ${email}`} {phone && `• ${phone}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${domainStyle}`}>
                            {reg.primary_domain || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {reg.portfolio_url && (
                              <a
                                href={reg.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 font-semibold hover:underline text-[11px] inline-flex items-center gap-1"
                              >
                                <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                Portfolio ↗
                              </a>
                            )}
                            {reg.github_url && (
                              <a
                                href={reg.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-800 font-semibold hover:underline text-[11px] inline-flex items-center gap-1"
                              >
                                <svg className="w-3 h-3 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                                GitHub ↗
                              </a>
                            )}
                            {reg.linkedin_url && (
                              <a
                                href={reg.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 font-semibold hover:underline text-[11px] inline-flex items-center gap-1"
                              >
                                <svg className="w-3 h-3 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94z" />
                                </svg>
                                LinkedIn ↗
                              </a>
                            )}
                            {!reg.portfolio_url && !reg.github_url && !reg.linkedin_url && (
                              <span className="text-slate-400 italic text-[11px]">No links</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {reg.skills ? (
                            <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg line-clamp-2">
                              {reg.skills}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">None listed</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-[11px] text-slate-500 font-mono">
                          {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: SUBMISSIONS & GRADING */}
      {activeTab === "submissions" && (
        <div className={`${THEME.panel} rounded-2xl overflow-hidden p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Student Submissions
            </h2>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-semibold">Domain:</span>
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none"
                >
                  <option value="All">All Domains</option>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-semibold">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Graded">Graded</option>
                  <option value="Shortlisted">Shortlisted</option>
                </select>
              </div>
            </div>
          </div>

          {submissionsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Loading Submissions...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No submissions found matching the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Company & Task</th>
                    <th className="py-3 px-4">Domain</th>
                    <th className="py-3 px-4">Submission & Notes</th>
                    <th className="py-3 px-4 text-center">Submitted Time</th>
                    <th className="py-3 px-4 text-center">Score / 10</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => {
                    const studentName = sub.registrations?.name || sub.user_id;
                    const company = sub.ascend_tasks?.company_name || "Company";
                    const taskTitle = sub.ascend_tasks?.title || `Task #${sub.task_id}`;
                    const taskDomain = sub.ascend_tasks?.domain || "Coder";

                    const submittedDate = sub.submitted_at ? new Date(sub.submitted_at) : null;
                    const isLate = submittedDate
                      ? isPastDeadline(sub.submitted_at, sub.ascend_tasks?.deadline)
                      : false;
                    const formattedTime = submittedDate
                      ? submittedDate.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A";

                    return (
                      <tr
                        key={sub.id}
                        className={`transition-colors ${
                          isLate
                            ? "bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <div>{studentName}</div>
                          <span className="text-[10px] text-slate-400 font-normal">{sub.user_id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-indigo-700">{company}</div>
                          <div className="text-slate-600 truncate max-w-xs">{taskTitle}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                              DOMAIN_STYLES[taskDomain] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {taskDomain}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={sub.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 underline font-semibold hover:text-sky-800 max-w-xs truncate block"
                          >
                            View Submission ↗
                          </a>
                          {sub.notes && (
                            <div className="mt-1 text-[11px] text-slate-600 bg-slate-100 p-1.5 rounded-lg max-w-xs line-clamp-2 font-normal flex items-start gap-1">
                              <svg className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>{sub.notes}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLate ? (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-wider shadow-xs">
                                LATE SUBMISSION
                              </span>
                              <span className="text-[11px] font-mono text-rose-700 font-bold mt-0.5">
                                {formattedTime}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                              {formattedTime}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {sub.status === "Pending" ? (
                            <span className="text-slate-400 italic">Unrated</span>
                          ) : (
                            <div className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[11px]">
                              <span>★ {sub.total_rating || 0}/10</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              sub.status === "Shortlisted"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : sub.status === "Graded"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenGradeModal(sub)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                            >
                              Grade & Mark
                            </button>
                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Delete Submission"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TASKS LIST */}
      {activeTab === "tasks_list" && (
        <div className={`${THEME.panel} rounded-2xl p-6`}>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            Active Company Bounties
          </h2>

          {tasksLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No tasks created yet. Click "+ New Company Task" to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((t) => (
                <div key={t.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-slate-50/50 hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          {t.company_logo ? (
                            <img
                              src={t.company_logo}
                              alt={t.company_name}
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-slate-600 font-black text-xs">
                              {(t.company_name || "C")[0]}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-violet-800 text-sm">{t.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${DOMAIN_STYLES[t.domain] || ""}`}>
                          {t.domain}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer"
                          title="Edit Task"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskToDelete(t)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                          title="Delete Task"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">{t.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{t.description}</p>
                    {t.perks && (
                      <div className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg font-semibold flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 13C10.832 21 9 20.1 9 19c0-1.1 1.832-2 3-2s3 .9 3 2c0 1.1-1.832 2-3 2z" />
                        </svg>
                        <span>Perks: {t.perks}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center">
                    <span>Task #{t.id}</span>
                    <span>Deadline: {t.deadline ? new Date(t.deadline).toLocaleDateString() : "No deadline"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE TASK FORM */}
      {activeTab === "create_task" && (
        <div className={`${THEME.panel} rounded-2xl p-6 max-w-3xl mx-auto w-full`}>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
            Create Company Bounty / Internship Task
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Publish a task for students competing in Ascend.
          </p>

          {formMsg.text && (
            <div
              className={`p-3 rounded-xl text-xs mb-6 font-bold ${
                formMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {formMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Tech"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Logo URL</label>
                <input
                  type="url"
                  placeholder="https://logo.clearbit.com/google.com"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Domain *</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task / Bounty Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Build an AI-Powered Realtime Dashboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
              <textarea
                required
                rows={3}
                placeholder="Detailed explanation of the challenge..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Requirements</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, Tailwind, Deployed App link"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internship Perks / Offer</label>
                <input
                  type="text"
                  placeholder="e.g. ₹25,000/mo Stipend + Fast-track Interview"
                  value={perks}
                  onChange={(e) => setPerks(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={formSubmitting}
              className="mt-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {formSubmitting ? "Publishing Task..." : "Publish Ascend Task"}
            </button>
          </form>
        </div>
      )}

      {/* GRADING MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl relative animate-fadeIn">
            <h3 className="text-base font-extrabold text-slate-900">
              Grade & Mark Student Submission
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Score out of 10 stars based on Quality and Innovativeness.
            </p>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800">
                  {selectedSubmission.registrations?.name || selectedSubmission.user_id}
                </div>
                {selectedSubmission.submitted_at && (() => {
                  const isModalSubLate = isPastDeadline(
                    selectedSubmission.submitted_at,
                    selectedSubmission.ascend_tasks?.deadline
                  );
                  return (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isModalSubLate
                          ? "bg-rose-100 text-rose-700 border border-rose-300"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      }`}
                    >
                      {isModalSubLate ? "Submitted Late" : "Submitted On Time"}
                    </span>
                  );
                })()}
              </div>
              <div className="text-indigo-600 font-semibold">
                {selectedSubmission.ascend_tasks?.company_name} — {selectedSubmission.ascend_tasks?.title}
              </div>
              {selectedSubmission.submitted_at && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Submitted At:{" "}
                  <strong className="text-slate-800 font-bold">
                    {new Date(selectedSubmission.submitted_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </div>
              )}
              <a
                href={selectedSubmission.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:text-sky-700 underline text-[11px] font-semibold truncate block transition-colors"
              >
                {selectedSubmission.submission_url} ↗
              </a>

              {selectedSubmission.notes && (
                <div className="mt-1 p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                    <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Student Notes & Documentation:
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 font-normal">
                    {selectedSubmission.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4">
              {/* Quality Rating (1 to 5 Stars) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Quality Score (1 - 5 Stars): <span className="text-amber-600 font-black">{qualityScore} Stars</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setQualityScore(star)}
                      className={`flex-1 py-2 rounded-lg text-sm font-black border transition-all cursor-pointer ${
                        qualityScore >= star
                          ? "bg-amber-400 text-amber-950 border-amber-500 shadow-sm"
                          : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              {/* Innovativeness Rating (1 to 5 Stars) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Innovativeness Score (1 - 5 Stars): <span className="text-indigo-600 font-black">{innovationScore} Stars</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setInnovationScore(star)}
                      className={`flex-1 py-2 rounded-lg text-sm font-black border transition-all cursor-pointer ${
                        innovationScore >= star
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                          : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Rating Banner */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-md border border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Rating</span>
                <span className="text-xl font-black text-amber-400">
                  ★ {qualityScore + innovationScore} / 10 Stars
                </span>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Status</label>
                <select
                  value={gradingStatus}
                  onChange={(e) => setGradingStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 cursor-pointer"
                >
                  <option value="Graded">Graded</option>
                  <option value="Shortlisted">Shortlisted for Internship Interview</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Admin Feedback Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Feedback / Review Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes for student or internal hiring team..."
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitGrade}
                disabled={gradeSubmitting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {gradeSubmitting ? "Saving..." : "Save Grade & Mark"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE TASK CONFIRMATION MODAL */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl relative animate-fadeIn">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Delete Company Task?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{taskToDelete.company_name} — {taskToDelete.title}</strong>? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTask}
                disabled={deletingTask}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {deletingTask ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Company Bounty Task
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 font-bold ${
                  editMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateTask} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://logo.clearbit.com/google.com"
                    value={editCompanyLogo}
                    onChange={(e) => setEditCompanyLogo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Domain *</label>
                  <select
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task / Bounty Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build an AI-Powered Realtime Dashboard"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed explanation of the challenge..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Requirements</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js, Tailwind, Deployed App link"
                    value={editRequirements}
                    onChange={(e) => setEditRequirements(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Internship Perks / Offer</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹25,000/mo Stipend + Fast-track Interview"
                    value={editPerks}
                    onChange={(e) => setEditPerks(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {editSubmitting ? "Updating Task..." : "Save Task Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
