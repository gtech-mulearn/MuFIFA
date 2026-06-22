"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackgroundVideo from "@/components/BackgroundVideo";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  // The 'phone' state stores the password credentials, mapping to the backend schema's phone field authentication.
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Check if the user is already authenticated and redirect to dashboard.
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          router.push(`/dashboard`);
          return;
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your Email or Player ID.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.error?.message || "Login failed. Registration not found.",
        );
        return;
      }

      // Store player in localStorage for instant rendering
      if (typeof window !== "undefined") {
        localStorage.setItem("player", JSON.stringify(data.data));
      }
      // Redirect to dashboard on success
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login request error:", err);
      setError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#090A0F] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12">
      {/* Stadium backdrop video layout. */}
      <div className="no-print">
        <BackgroundVideo />
      </div>

      {/* Decorative ambient color spheres and overlay grids. */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_25%,#090A0F_95%)] opacity-85 pointer-events-none no-print" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[rgba(148,163,184,0.05)] via-transparent to-[rgba(6,182,212,0.03)] pointer-events-none no-print" />
      <div className="absolute top-[30%] right-[10%] w-[45vw] h-[45vw] indigo-accent-glow pointer-events-none rounded-full opacity-20 no-print" />
      <div className="absolute bottom-[20%] left-[-15%] w-[45vw] h-[45vw] cyan-accent-glow pointer-events-none rounded-full opacity-20 no-print" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 flex-1 flex flex-col justify-center items-center">
        {/* Access pass login card wrapper. */}
        <div className="w-full max-w-lg bg-glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-5 sm:gap-6 bg-[linear-gradient(115deg,rgba(255,255,255,0.02),rgba(79,70,229,0.015))]">
          <div className="text-center flex flex-col gap-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase">
              Arena Access Pass
            </h1>
            <p className="text-xs text-slate-400">
              Log in with your Email/Player ID and Password to access your
              pass.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-3 px-4 rounded-xl font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-identifier"
                className="text-[10px] font-black uppercase tracking-wider text-slate-300"
              >
                Email or Player ID
              </label>
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. player@gmail.com or player_id"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="login-phone"
                  className="text-[10px] font-black uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                <div className="group/tooltip relative inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/10 hover:bg-white/20 text-[9px] font-bold cursor-pointer text-slate-300 hover:text-white transition-all select-none">
                  i
                  <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-48 p-2 rounded-lg bg-black/95 border border-white/10 text-[10px] text-slate-300 font-medium normal-case tracking-normal text-center hidden group-hover/tooltip:block shadow-xl z-20 backdrop-blur-md pointer-events-none">
                    Check your email (including the <strong className="text-white">spam/junk folder</strong>) for your password.
                  </span>
                </div>
              </div>
              <div className="relative w-full">
                <input
                  id="login-phone"
                  type={showPassword ? "text" : "password"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your Password"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer select-none flex items-center justify-center"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full cursor-pointer bg-white border border-white hover:bg-white/90 text-black font-bold py-3 rounded-xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  LOGGING IN...
                </>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>

          <div className="text-center mt-2">
            <span className="text-xs text-slate-500">
              Don't have an Access Pass?{" "}
              <Link
                href="/register"
                className="underline text-[#06B6D4] hover:text-[#4F46E5] font-semibold transition-colors"
              >
                Register here
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
