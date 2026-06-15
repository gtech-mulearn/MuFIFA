"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin, TEAM_FLAGS, THEME } from "../../layout";

const DOMAINS = ["Maker", "Creative", "Coder", "Strategist"];
const TEAMS = Object.keys(TEAM_FLAGS);

export default function AdminUserEditPage({ params }) {
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

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/v1/admin/users/${id}`);
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
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
    }
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
    <div className="flex flex-col gap-6 max-w-2xl">
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

      <div>
        <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
          {isViewer ? "View User" : "Edit User"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ID: <span className="font-mono text-slate-400">{user?.id}</span>
        </p>
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
              disabled={isViewer}
              className={`rounded-xl px-4 py-2.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${THEME.input}`}
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
              disabled={isViewer}
              className={`rounded-xl px-4 py-2.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${THEME.input}`}
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
              disabled={isViewer}
              className={`rounded-xl px-4 py-2.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${THEME.input}`}
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
              disabled={isViewer}
              className={`rounded-xl px-4 py-2.5 text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${THEME.input}`}
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
              disabled={isViewer}
              className={`rounded-xl px-4 py-2.5 text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none focus:outline-none ${THEME.input}`}
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
              disabled={isViewer}
              className={`rounded-xl px-4 py-2.5 text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none focus:outline-none ${THEME.input}`}
            >
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[10px] text-slate-500 pt-2 border-t border-slate-200/90">
          <span>
            User ID:{" "}
            <span className="font-mono text-slate-500">{user?.user_id}</span>
          </span>
          <span>
            Registered:{" "}
            <span className="text-slate-500">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "-"}
            </span>
          </span>
        </div>

        {!isViewer && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/users")}
              className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
