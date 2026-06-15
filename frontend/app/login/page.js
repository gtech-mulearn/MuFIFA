"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackgroundVideo from "@/components/BackgroundVideo";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if player is already logged in
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
      setError("Please enter your registered Phone Number.");
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

      // Redirect directly to profile on success
      router.push(`/profile/${data.data.user_id}`);
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
      {/* Background Stadium Video */}
      <div className="no-print">
        <BackgroundVideo />
      </div>

      {/* Retro Theme Overlay and accent glows */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_25%,#090A0F_95%)] opacity-85 pointer-events-none no-print" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[rgba(148,163,184,0.05)] via-transparent to-[rgba(6,182,212,0.03)] pointer-events-none no-print" />
      <div className="absolute top-[30%] right-[10%] w-[45vw] h-[45vw] indigo-accent-glow pointer-events-none rounded-full opacity-20 no-print" />
      <div className="absolute bottom-[20%] left-[-15%] w-[45vw] h-[45vw] cyan-accent-glow pointer-events-none rounded-full opacity-20 no-print" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 flex-1 flex flex-col justify-center items-center">
        {/* LOGIN FORM CARD */}
        <div className="w-full max-w-lg bg-glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-5 sm:gap-6 bg-[linear-gradient(115deg,rgba(255,255,255,0.02),rgba(79,70,229,0.015))]">
          <div className="text-center flex flex-col gap-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase">
              Arena Access Pass
            </h1>
            <p className="text-xs text-slate-400">
              Log in with your Email/Player ID and Phone Number to access your
              pass.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-3 px-4 rounded-xl font-medium flex items-center gap-2">
              <span className="text-base">⚠️</span> {error}
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
              <label
                htmlFor="login-phone"
                className="text-[10px] font-black uppercase tracking-wider text-slate-300"
              >
                Phone Number
              </label>
              <input
                id="login-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your Phone Number"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors"
              />
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
