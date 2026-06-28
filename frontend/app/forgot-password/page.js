"use client";

import React, { useState } from "react";
import Link from "next/link";
import BackgroundVideo from "@/components/BackgroundVideo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your registered Email address.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your registered Phone Number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.error?.message || "Verification failed. Mismatch in details."
        );
        return;
      }

      setSuccess(
        data.message || "A new 8-digit password has been successfully sent to your registered email address!"
      );
      setEmail("");
      setPhone("");
    } catch (err) {
      console.error("Forgot password submit error:", err);
      setError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#090A0F] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12">
      {/* Background Stadium Video */}
      <div className="no-print">
        <BackgroundVideo />
      </div>

      {/* Decorative glows */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_25%,#090A0F_95%)] opacity-85 pointer-events-none no-print" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[rgba(148,163,184,0.05)] via-transparent to-[rgba(6,182,212,0.03)] pointer-events-none no-print" />
      <div className="absolute top-[30%] right-[10%] w-[45vw] h-[45vw] indigo-accent-glow pointer-events-none rounded-full opacity-20 no-print" />
      <div className="absolute bottom-[20%] left-[-15%] w-[45vw] h-[45vw] cyan-accent-glow pointer-events-none rounded-full opacity-20 no-print" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 flex-1 flex flex-col justify-center items-center">
        {/* CARD CONTAINER */}
        <div className="w-full max-w-lg bg-glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-5 sm:gap-6 bg-[linear-gradient(115deg,rgba(255,255,255,0.02),rgba(79,70,229,0.015))]">
          <div className="text-center flex flex-col gap-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase">
              Recover Access Password
            </h1>
            <p className="text-xs text-slate-400">
              Enter your registered Email and Phone Number below. Your new password will be sent to your email (<strong>please check your spam/junk folder</strong> if not found).
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

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-[#00E676] text-xs py-3 px-4 rounded-xl font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00E676] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="recover-email"
                className="text-[10px] font-black uppercase tracking-wider text-slate-300"
              >
                Registered Email
              </label>
              <input
                id="recover-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. player@gmail.com"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="recover-phone"
                className="text-[10px] font-black uppercase tracking-wider text-slate-300"
              >
                Phone Number
              </label>
              <input
                id="recover-phone"
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
                  RECOVERING PASSWORD...
                </>
              ) : (
                "RECOVER PASSWORD"
              )}
            </button>
          </form>

          <div className="text-center mt-2">
            <span className="text-xs text-slate-500">
              Remember your details?{" "}
              <Link
                href="/login"
                className="underline text-[#06B6D4] hover:text-[#4F46E5] font-semibold transition-colors"
              >
                Back to Login
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
