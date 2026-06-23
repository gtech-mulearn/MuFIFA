"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin, TEAM_FLAGS, THEME } from "../../layout";

const DOMAINS = ["Maker", "Creative", "Coder", "Strategist"];
const TEAMS = Object.keys(TEAM_FLAGS);

function TeamBadge({ team }) {
  const code = TEAM_FLAGS[team];
  return code ? (
    <span
      className={`fi fi-${code} rounded-sm shadow-sm border border-slate-200 shrink-0 inline-block`}
      style={{ width: "16px", height: "12px" }}
      title={team}
      role="img"
      aria-label={`${team} flag`}
    />
  ) : (
    <span className="inline-flex min-w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
      {team ? team.slice(0, 2) : "UN"}
    </span>
  );
}

function getBanBadge(banned) {
  if (!banned) return null;
  if (banned === "red" || banned === "permanent") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-black text-rose-700 border border-rose-200 uppercase tracking-wider select-none shrink-0" title="Permanently Banned">
        <span className="w-1.5 h-2.5 bg-rose-600 rounded-[1px] inline-block shadow-sm" />
        Red Card
      </span>
    );
  }
  if (banned.startsWith("yellow:")) {
    const expiry = Number(banned.split(":")[1]);
    if (!isNaN(expiry)) {
      if (expiry > Date.now()) {
        return (
          <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700 border border-amber-200 uppercase tracking-wider select-none shrink-0" title={`Banned until ${new Date(expiry).toLocaleString()}`}>
            <span className="w-1.5 h-2.5 bg-amber-500 rounded-[1px] inline-block shadow-sm" />
            Yellow Card
          </span>
        );
      } else {
        return (
          <span className="ml-2 inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-black text-slate-500 border border-slate-200 uppercase tracking-wider select-none shrink-0" title="Previous yellow card ban (Expired)">
            <span className="w-1.5 h-2.5 bg-amber-500/40 rounded-[1px] inline-block shadow-sm" />
            Yellow (Expired)
          </span>
        );
      }
    }
  }
  return null;
}

function getDetailedBanStatus(banned) {
  if (!banned) return null;
  if (banned === "red" || banned === "permanent") {
    return (
      <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5 select-none">
        <span className="w-2.5 h-4 bg-rose-600 rounded-[1px] inline-block shadow-sm" />
        Banned: Red Card (Permanent)
      </span>
    );
  }
  if (banned.startsWith("yellow:")) {
    const expiry = Number(banned.split(":")[1]);
    if (!isNaN(expiry)) {
      if (expiry > Date.now()) {
        return (
          <div className="flex flex-col gap-0.5 select-none animate-fadeIn">
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
              <span className="w-2.5 h-4 bg-amber-500 rounded-[1px] inline-block shadow-sm" />
              Banned: Yellow Card (1 Week Ban)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Expires: {new Date(expiry).toLocaleString()}
            </span>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col gap-0.5 select-none opacity-80">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span className="w-2.5 h-4 bg-amber-500/40 rounded-[1px] inline-block shadow-sm" />
              Inactive: Yellow Card (Expired)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Expired on: {new Date(expiry).toLocaleString()}
            </span>
          </div>
        );
      }
    }
  }
  return null;
}

export default function AdminUserDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const admin = useAdmin();
  const isViewer = admin?.role === "viewer";

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Relational data states
  const [predictions, setPredictions] = useState([]);
  const [predictionsPage, setPredictionsPage] = useState(1);
  const [referrals, setReferrals] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdResetting, setPwdResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [banError, setBanError] = useState("");
  const [banSuccess, setBanSuccess] = useState("");
  const [banUpdating, setBanUpdating] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setPredictions(data.predictions || []);
        setPredictionsPage(1);
        setReferrals(data.referrals || []);
        setCompletedTasks(data.completedTasks || []);
        setForm({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          domain: data.user.domain || "",
          team: data.user.team || "",
          mu_points: data.user.mu_points || 0,
        });
      } else {
        setError(data.error?.message || data.error || "User not found.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "mu_points" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setSuccess("User updated successfully.");
        setIsEditing(false);
        fetchUser(); // reload full details
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error?.message || data.error || "Update failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.trim().length < 6) {
      setPwdError("Password must be at least 6 characters long.");
      return;
    }

    setPwdResetting(true);
    setPwdError("");
    setPwdSuccess("");

    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPwdSuccess(newPassword);
        setNewPassword("");
      } else {
        setPwdError(
          data.error?.message || data.error || "Failed to reset password.",
        );
      }
    } catch {
      setPwdError("Network error.");
    } finally {
      setPwdResetting(false);
    }
  };

  const handleApplyBan = async (type) => {
    setBanUpdating(true);
    setBanError("");
    setBanSuccess("");
    let value = "";
    if (type === "red") {
      value = "red";
    } else if (type === "yellow") {
      value = "yellow:" + (Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: value }),
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setBanSuccess(
          type === "none"
            ? "Ban status cleared."
            : `User has been issued a ${type === "red" ? "Red" : "Yellow"} Card.`
        );
        setTimeout(() => setBanSuccess(""), 4000);
      } else {
        setBanError(data.error?.message || data.error || "Failed to update ban status.");
      }
    } catch {
      setBanError("Network error.");
    } finally {
      setBanUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDelete(false);
        router.push("/admin/users");
      } else {
        alert(data.error?.message || data.error || "Delete failed.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeleting(false);
    }
  };

  const totalPredictionsPages = Math.ceil(predictions.length / 10);
  const displayedPredictions = predictions.slice(
    (predictionsPage - 1) * 10,
    predictionsPage * 10,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-3 px-4 rounded-xl">
          {error}
        </div>
        <Link
          href="/admin/users"
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/users"
          className="hover:text-slate-900 transition-colors"
        >
          Users
        </Link>
        <span>/</span>
        <span className="text-slate-700">{user?.name}</span>
      </div>

      {/* Header Info & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-lg select-none">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wide text-slate-900 uppercase">
                {user?.name}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                {user?.user_id}
              </span>
              {getBanBadge(user?.banned)}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>{user?.domain}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <TeamBadge team={user?.team} /> {user?.team}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isViewer && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="cursor-pointer text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              {isEditing ? "View Profile" : "Edit Profile"}
            </button>
          )}

          {admin?.role === "superadmin" && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="cursor-pointer text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Delete User
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-2.5 px-4 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs py-2.5 px-4 rounded-xl">
          {success}
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200/90 gap-6">
        <button
          onClick={() => {
            setActiveTab("overview");
            setIsEditing(false);
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "overview"
              ? "border-sky-500 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => {
            setActiveTab("predictions");
            setIsEditing(false);
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "predictions"
              ? "border-sky-500 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Predictions ({predictions.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("referrals");
            setIsEditing(false);
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "referrals"
              ? "border-sky-500 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Referrals ({referrals.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("tasks");
            setIsEditing(false);
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "tasks"
              ? "border-sky-500 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Task History ({completedTasks.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {!isEditing ? (
              // READ ONLY PROFILE DETAILS
              <div
                className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-6`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Full Name
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {user?.name}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Email Address
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {user?.email}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Phone Number
                    </span>
                    <span className="text-sm font-mono font-semibold text-slate-800">
                      {user?.phone}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Squad Domain
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {user?.domain}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      FIFA Squad Team
                    </span>
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <TeamBadge team={user?.team} />
                      {user?.team}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black tracking-wider text-slate-400">
                      μPoints (Total Score)
                    </span>
                    <span className="text-sm font-mono font-bold text-sky-700">
                      {user?.mu_points}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      User Database ID
                    </span>
                    <span className="text-sm font-mono font-semibold text-slate-500">
                      {user?.id}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Player referral code
                    </span>
                    <span className="text-sm font-mono font-bold text-sky-700">
                      {user?.referal_id}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Registration Date
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                  <span>
                    Referred by user ID:{" "}
                    <span className="font-mono">
                      {user?.referred_by || "Direct / None"}
                    </span>
                  </span>
                  <span>
                    Ticket Pass:{" "}
                    {user?.ticket_url ? (
                      <a
                        href={user.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 underline font-bold"
                      >
                        View Ticket Pass
                      </a>
                    ) : (
                      "Not generated"
                    )}
                  </span>
                </div>
              </div>
            ) : (
              // EDITABLE PROFILE FORM
              <form
                onSubmit={handleSave}
                className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-5`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Name
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={`rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Email
                    </label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className={`rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-500">
                      μPoints
                    </label>
                    <input
                      name="mu_points"
                      type="number"
                      value={form.mu_points}
                      onChange={handleChange}
                      className={`rounded-xl px-4 py-2.5 text-xs font-mono transition-colors focus:outline-none ${THEME.input}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Domain
                    </label>
                    <select
                      name="domain"
                      value={form.domain}
                      onChange={handleChange}
                      className={`rounded-xl px-4 py-2.5 text-xs transition-colors cursor-pointer appearance-none focus:outline-none ${THEME.input}`}
                    >
                      {DOMAINS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      FIFA Team
                    </label>
                    <select
                      name="team"
                      value={form.team}
                      onChange={handleChange}
                      className={`rounded-xl px-4 py-2.5 text-xs transition-colors cursor-pointer appearance-none focus:outline-none ${THEME.input}`}
                    >
                      {TEAMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="cursor-pointer bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* PASSWORD RESET MODULE */}
            {!isViewer && (
              <div
                className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-4`}
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Reset Player Password
                  </h3>
                </div>

                <p className="text-xs text-slate-500">
                  Change the player's password. Once updated, the player will
                  have to log in using the new password.
                </p>

                {pwdError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs py-2 px-3 rounded-xl">
                    {pwdError}
                  </div>
                )}

                {pwdSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs py-3 px-4 rounded-xl flex flex-col gap-2">
                    <div className="font-semibold flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Password reset successfully!
                    </div>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5 mt-1">
                      <span className="font-mono text-sm text-slate-800 tracking-wider font-semibold">
                        {pwdSuccess}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(pwdSuccess);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="cursor-pointer text-[10px] uppercase font-bold text-sky-600 hover:text-sky-500 transition-colors flex items-center gap-1"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      New Password
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className={`rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-colors h-[38px] flex items-center justify-center"
                    >
                      Auto-generate
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={
                        pwdResetting ||
                        !newPassword ||
                        newPassword.trim().length < 6
                      }
                      className="cursor-pointer bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed h-[38px] flex items-center justify-center"
                    >
                      {pwdResetting ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CARD & BAN MANAGEMENT MODULE */}
            {!isViewer && (
              <div
                className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-4`}
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Card & Ban Management
                  </h3>
                </div>

                <p className="text-xs text-slate-500">
                  Issue disciplinary cards to this player. A Yellow Card bans the user for 1 week. A Red Card permanently bans the user.
                </p>

                {banError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs py-2 px-3 rounded-xl">
                    {banError}
                  </div>
                )}

                {banSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs py-2 px-3 rounded-xl">
                    {banSuccess}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 border border-slate-200/50 rounded-xl p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Current Status
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {user?.banned ? (
                        getDetailedBanStatus(user.banned)
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping shrink-0" style={{ animationDuration: "3s" }} />
                          Active (No Cards)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyBan("yellow")}
                      disabled={banUpdating}
                      className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-white font-bold py-2 px-4 rounded-xl text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="w-2.5 h-4 bg-amber-200 rounded-[1px] inline-block shadow-sm" />
                      Yellow Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBan("red")}
                      disabled={banUpdating}
                      className="cursor-pointer bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-xl text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="w-2.5 h-4 bg-rose-300 rounded-[1px] inline-block shadow-sm" />
                      Red Card
                    </button>
                    {user?.banned && (
                      <button
                        type="button"
                        onClick={() => handleApplyBan("none")}
                        disabled={banUpdating}
                        className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        Lift Ban
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PREDICTIONS TAB */}
        {activeTab === "predictions" && (
          <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
            {predictions.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-xs text-slate-500">
                No predictions made by this user yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/90 text-slate-500">
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        Match
                      </th>
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        Predicted Winner
                      </th>
                      <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">
                        Predicted Score
                      </th>

                      <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">
                        Status Outcome
                      </th>
                      <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">
                        Points
                      </th>
                      <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedPredictions.map((p) => {
                      let outcomeBadge = (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                          Pending
                        </span>
                      );
                      let ptsVal = 0;

                      if (p.outcome === "exact") {
                        outcomeBadge = (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Exact Score
                          </span>
                        );
                        ptsVal = 25;
                      } else if (p.outcome === "correct_outcome") {
                        outcomeBadge = (
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                            Correct Outcome
                          </span>
                        );
                        ptsVal = 2;
                      } else if (p.outcome === "incorrect") {
                        outcomeBadge = (
                          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                            Incorrect
                          </span>
                        );
                        ptsVal = -1;
                      }

                      return (
                        <tr
                          key={p.id}
                          className="border-b border-slate-200/70 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                            {p.match_title}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap capitalize">
                            {p.predicted_outcome === "home"
                              ? "Home Win"
                              : p.predicted_outcome === "away"
                                ? "Away Win"
                                : p.predicted_outcome}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                            {p.predicted_home_goals} - {p.predicted_away_goals}
                          </td>

                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {outcomeBadge}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-bold ${
                              ptsVal > 0
                                ? "text-emerald-600"
                                : ptsVal < 0
                                  ? "text-rose-600"
                                  : "text-slate-400"
                            }`}
                          >
                            {ptsVal > 0 ? `+${ptsVal}` : ptsVal} XP
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                            {new Date(p.updated_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {totalPredictionsPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-3 border-t border-slate-200/50 bg-white">
                <button
                  type="button"
                  onClick={() => setPredictionsPage(predictionsPage - 1)}
                  disabled={predictionsPage <= 1}
                  className="px-2.5 py-1 text-[11px] text-slate-500 border border-slate-300 rounded-lg hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Previous
                </button>
                <span className="text-[11px] text-slate-500 select-none">
                  Page {predictionsPage} of {totalPredictionsPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPredictionsPage(predictionsPage + 1)}
                  disabled={predictionsPage >= totalPredictionsPages}
                  className="px-2.5 py-1 text-[11px] text-slate-500 border border-slate-300 rounded-lg hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* REFERRALS TAB */}
        {activeTab === "referrals" && (
          <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
            {referrals.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-xs text-slate-500">
                No users registered with this player's referral code yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/90 text-slate-500">
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        Email Address
                      </th>
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">
                        Joined Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-slate-200/70 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {r.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono font-semibold">
                          {r.user_id}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{r.email}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          {r.phone}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TASK HISTORY TAB */}
        {activeTab === "tasks" && (
          <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
            {completedTasks.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-xs text-slate-500">
                No tasks completed by this user yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/90 text-slate-500">
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        Task Title
                      </th>
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        Task ID
                      </th>
                      <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">
                        Points Awarded
                      </th>
                      <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">
                        XP Breakdown
                      </th>
                      <th className="text-right px-4 py-3 font-bold uppercase tracking-wider">
                        Completed Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTasks.map((t) => {
                      const xpBreakdown = [];
                      if (t.xp_creativity > 0)
                        xpBreakdown.push(`Creativity: +${t.xp_creativity}`);
                      if (t.xp_branding > 0)
                        xpBreakdown.push(`Branding: +${t.xp_branding}`);
                      if (t.xp_innovation > 0)
                        xpBreakdown.push(`Innovation: +${t.xp_innovation}`);
                      if (t.xp_teamwork > 0)
                        xpBreakdown.push(`Teamwork: +${t.xp_teamwork}`);
                      if (t.xp_execution > 0)
                        xpBreakdown.push(`Execution: +${t.xp_execution}`);

                      return (
                        <tr
                          key={t.id}
                          className="border-b border-slate-200/70 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                            {t.tasks?.title || `Task #${t.task_id}`}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono font-semibold">
                            {t.task_id}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-sky-700">
                            +{t.points_awarded || 0} XP
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {xpBreakdown.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {xpBreakdown.map((xp, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200"
                                  >
                                    {xp}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">
                                Standard Task XP
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                            {new Date(t.completed_at).toLocaleString()}
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
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-md">
          <div
            className={`${THEME.panelSoft} rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl`}
          >
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-900">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">{user?.name}</strong> (
              {user?.email})? This action will permanently remove the player,
              their predictions, and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 cursor-pointer bg-rose-500/15 hover:bg-rose-500/20 border border-rose-500/35 text-rose-600 font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
