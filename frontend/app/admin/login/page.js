"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { THEME } from "../layout";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || data.error || "Login failed.");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setForgotSuccess("");

    if (!forgotIdentifier.trim()) {
      setError("Please enter your username or email.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/v1/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || data.error || "Request failed.");
        return;
      }

      setForgotSuccess(data.message || "A temporary password has been sent to your registered email address.");
      setForgotIdentifier("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(226,232,240,0.9),_transparent_32%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="mt-4 text-2xl font-bold tracking-[0.22em] text-slate-900 uppercase">
            Admin Panel
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            µFifa'26 control dashboard
          </p>
        </div>

        <form
          onSubmit={forgotMode ? handleForgotPasswordSubmit : handleSubmit}
          className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-5 shadow-[0_24px_70px_rgba(2,6,23,0.48)]`}
        >
          {forgotMode ? (
            <>
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-2.5 px-4 rounded-xl font-medium">
                  {error}
                </div>
              )}
              {forgotSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs py-2.5 px-4 rounded-xl font-medium">
                  {forgotSuccess}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="forgot-identifier"
                  className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                >
                  Username or Email
                </label>
                <input
                  id="forgot-identifier"
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  className={`rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none ${THEME.input}`}
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs tracking-[0.18em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forgotLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    Sending Email
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError("");
                  setForgotSuccess("");
                }}
                className="w-full cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-3 rounded-xl text-xs tracking-[0.18em] uppercase transition-all"
              >
                Back To Login
              </button>
            </>
          ) : (
            <>
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-2.5 px-4 rounded-xl font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-username"
                  className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                >
                  Username
                </label>
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className={`rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none ${THEME.input}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-password"
                  className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className={`rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none ${THEME.input}`}
                />
              </div>

              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError("");
                    setForgotSuccess("");
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs tracking-[0.18em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    Authenticating
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-3 rounded-xl text-xs tracking-[0.18em] uppercase transition-all"
              >
                Back To Home
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
