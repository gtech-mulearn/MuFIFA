"use client";

import { useState } from "react";

/**
 * Derives the predicted_outcome from goal values.
 * @param {number} home - Home goals
 * @param {number} away - Away goals
 * @returns {"home_win"|"draw"|"away_win"}
 */
function deriveOutcome(home, away) {
  if (home > away) return "home_win";
  if (home === away) return "draw";
  return "away_win";
}

/**
 * Returns display config for the current outcome.
 */
function outcomeDisplay(outcome) {
  switch (outcome) {
    case "home_win":
      return { label: "Home Win", className: "text-[#818CF8]" };
    case "draw":
      return { label: "Draw", className: "text-slate-400" };
    case "away_win":
      return { label: "Away Win", className: "text-[#06B6D4]" };
    default:
      return { label: "—", className: "text-slate-500" };
  }
}

/**
 * Validates that a goal value is an integer in range 0–20.
 * @param {*} val
 * @returns {string|null} Error message or null if valid
 */
function validateGoals(val) {
  const n = Number(val);
  if (!Number.isInteger(n)) return "Must be a whole number";
  if (n < 0) return "Must be 0 or more";
  if (n > 20) return "Must be 20 or less";
  return null;
}

/**
 * PredictionForm — lets an authenticated player submit or update a match prediction.
 *
 * Props:
 *   matchId           {string}        — football-data.org match ID
 *   homeTeam          {string}        — Home team display name
 *   awayTeam          {string}        — Away team display name
 *   existingPrediction {object|null}  — Existing prediction row (or null)
 *   onSave            {function}      — Called with saved prediction data on success
 *   onCancel          {function}      — Called when user cancels
 */
export default function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  existingPrediction,
  onSave,
  onCancel,
}) {
  const [homeGoals, setHomeGoals] = useState(
    existingPrediction?.predicted_home_goals ?? 0
  );
  const [awayGoals, setAwayGoals] = useState(
    existingPrediction?.predicted_away_goals ?? 0
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const outcome = deriveOutcome(Number(homeGoals), Number(awayGoals));
  const { label: outcomeLabel, className: outcomeClass } = outcomeDisplay(outcome);

  const isEditing = existingPrediction !== null && existingPrediction !== undefined;

  async function handleSubmit(e) {
    e.preventDefault();

    // Client-side validation
    const homeErr = validateGoals(homeGoals);
    const awayErr = validateGoals(awayGoals);
    if (homeErr || awayErr) {
      setFieldErrors({
        ...(homeErr ? { home: homeErr } : {}),
        ...(awayErr ? { away: awayErr } : {}),
      });
      return;
    }
    setFieldErrors({});
    setError(null);
    setSubmitting(true);

    try {
      // Time-window check: Predictions are only allowed between 10:00 AM and 6:00 PM IST
      const now = new Date();
      const istTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istDate = new Date(istTimeStr);
      const istHour = istDate.getHours();

      const isOpen = (istHour >= 10 && istHour < 18);

      if (!isOpen) {
        setError("Predictions and editing are only allowed between 10:00 AM and 6:00 PM IST.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/v1/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          predicted_outcome: outcome,
          predicted_home_goals: Number(homeGoals),
          predicted_away_goals: Number(awayGoals),
        }),
      });

      const data = await res.json();

      if (res.status === 200 || res.status === 201) {
        onSave(data.data);
        return;
      }

      if (res.status === 400) {
        const msg = data?.error?.message ?? "";
        if (msg.includes("Score is inconsistent")) {
          setError(msg);
        } else {
          // Try to map Zod field errors to fieldErrors
          const details = data?.error?.details;
          if (details && typeof details === "object") {
            const mapped = {};
            if (details.predicted_home_goals) mapped.home = details.predicted_home_goals;
            if (details.predicted_away_goals) mapped.away = details.predicted_away_goals;
            if (Object.keys(mapped).length > 0) {
              setFieldErrors(mapped);
            } else {
              setError(msg || "Invalid prediction data");
            }
          } else {
            setError(msg || "Invalid prediction data");
          }
        }
        return;
      }

      if (res.status === 401) {
        setError("Please log in to predict");
        return;
      }

      if (res.status === 422) {
        setError("Predictions are closed for this match");
        return;
      }

      // All other errors
      setError(data?.error?.message || "Failed to submit prediction");
    } catch {
      setError("Failed to submit prediction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-4"
    >
      {/* Title */}
      <p className="text-xs font-black uppercase tracking-wider text-slate-300">
        Your Prediction
      </p>

      {/* Goal inputs */}
      <div className="flex items-start gap-3">
        {/* Home goals */}
        <div className="flex-1 flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {homeTeam}
          </label>
          <input
            type="number"
            min="0"
            max="20"
            step="1"
            value={homeGoals}
            onChange={(e) => {
              setHomeGoals(e.target.value);
              if (fieldErrors.home) setFieldErrors((prev) => ({ ...prev, home: null }));
            }}
            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-center text-2xl font-extrabold text-white focus:outline-none focus:border-[#4F46E5] transition-colors"
          />
          {fieldErrors.home && (
            <span className="text-[10px] text-red-400 mt-1">{fieldErrors.home}</span>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center pt-6 px-1">
          <span className="text-slate-500 font-bold text-lg">:</span>
        </div>

        {/* Away goals */}
        <div className="flex-1 flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {awayTeam}
          </label>
          <input
            type="number"
            min="0"
            max="20"
            step="1"
            value={awayGoals}
            onChange={(e) => {
              setAwayGoals(e.target.value);
              if (fieldErrors.away) setFieldErrors((prev) => ({ ...prev, away: null }));
            }}
            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-center text-2xl font-extrabold text-white focus:outline-none focus:border-[#4F46E5] transition-colors"
          />
          {fieldErrors.away && (
            <span className="text-[10px] text-red-400 mt-1">{fieldErrors.away}</span>
          )}
        </div>
      </div>

      {/* Live outcome indicator */}
      <p className={`text-xs font-bold text-center ${outcomeClass}`}>
        → {outcomeLabel}
      </p>

      {/* Global error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
        >
          {submitting && (
            <svg
              className="animate-spin h-3 w-3 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {isEditing ? "Update Prediction" : "Submit Prediction"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer px-2 py-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
