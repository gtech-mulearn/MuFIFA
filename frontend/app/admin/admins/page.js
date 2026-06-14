"use client";

import React, { useState, useEffect } from "react";
import { ROLE_COLORS, THEME } from "../layout";

const VALID_ROLES = ["superadmin", "admin", "viewer"];

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "viewer" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/admins");
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins);
      } else {
        setError(data.error?.message || data.error || "Failed to fetch admins.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setCreateError("All fields are required.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/v1/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setShowCreate(false);
        setForm({ username: "", email: "", password: "", role: "viewer" });
        fetchAdmins();
      } else {
        setCreateError(data.error?.message || data.error || "Failed to create admin.");
      }
    } catch {
      setCreateError("Network error.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
            Admin Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrator access and roles
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="cursor-pointer bg-sky-500/12 hover:bg-sky-500/18 border border-sky-500/25 text-sky-900 font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-[0_14px_30px_rgba(14,165,233,0.10)] w-full sm:w-auto text-center"
        >
          {showCreate ? "Close Form" : "Create Admin"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-4`}
        >
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            New Administrator
          </h3>

          {createError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-2 px-3 rounded-xl">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Username
              </label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="john_doe"
                className={`rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@mulearn.org"
                className={`rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className={`rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={`rounded-xl px-4 py-2.5 text-xs transition-colors cursor-pointer appearance-none focus:outline-none ${THEME.input}`}
              >
                {VALID_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="cursor-pointer bg-slate-100 text-slate-900 font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed self-start hover:bg-white"
          >
            {creating ? "Creating" : "Create Admin"}
          </button>
        </form>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-2.5 px-4 rounded-xl">
          {error}
        </div>
      )}

      <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-500">
            No admin accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                  <tr className="border-b border-slate-200/90 text-slate-500">
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Username</th>
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Email</th>
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Role</th>
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Created</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-slate-200/70 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-slate-800 font-semibold whitespace-nowrap">{a.username}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{a.email}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          ROLE_COLORS[a.role] || ROLE_COLORS.viewer
                        }`}
                      >
                        {a.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
