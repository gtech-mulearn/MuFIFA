"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import OddsBar from "@/components/match/OddsBar";
import PredictionForm from "@/components/match/PredictionForm";

// Country code lookup for flag-icons (fi fi-{code})
const COUNTRY_CODES = {
  Brazil: "br",
  Argentina: "ar",
  France: "fr",
  Germany: "de",
  England: "gb-eng",
  Spain: "es",
  Portugal: "pt",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
  Mexico: "mx",
  USA: "us",
  "United States": "us",
  Canada: "ca",
  Italy: "it",
  Switzerland: "ch",
  Denmark: "dk",
  Poland: "pl",
  Sweden: "se",
  Norway: "no",
  Serbia: "rs",
  Morocco: "ma",
  Senegal: "sn",
  Ghana: "gh",
  Cameroon: "cm",
  "South Korea": "kr",
  Korea: "kr",
  Australia: "au",
  Iran: "ir",
  Saudi: "sa",
  "Saudi Arabia": "sa",
  Qatar: "qa",
  Ecuador: "ec",
  Wales: "gb-wls",
  Tunisia: "tn",
  Czechia: "cz",
  "Czech Republic": "cz",
  Hungary: "hu",
  Romania: "ro",
  Slovakia: "sk",
  Slovenia: "si",
  Austria: "at",
  Ukraine: "ua",
  Turkey: "tr",
  "Costa Rica": "cr",
  Panama: "pa",
  Chile: "cl",
  Colombia: "co",
  Peru: "pe",
  Bolivia: "bo",
  Paraguay: "py",
  Venezuela: "ve",
  Honduras: "hn",
  Guatemala: "gt",
  Cuba: "cu",
  Jamaica: "jm",
  "New Zealand": "nz",
  Algeria: "dz",
  Egypt: "eg",
  Nigeria: "ng",
  "Ivory Coast": "ci",
  "Cote d'Ivoire": "ci",
  Mali: "ml",
  "South Africa": "za",
  Zambia: "zm",
  Zimbabwe: "zw",
  Greece: "gr",
  Finland: "fi",
  Scotland: "gb-sct",
  Ireland: "ie",
  "Northern Ireland": "gb-nir",
};

function getCountryCode(teamName) {
  if (!teamName) return null;
  // Try exact match first
  if (COUNTRY_CODES[teamName]) return COUNTRY_CODES[teamName];
  // Try partial match
  const key = Object.keys(COUNTRY_CODES).find((k) =>
    teamName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(teamName.toLowerCase())
  );
  return key ? COUNTRY_CODES[key] : null;
}

function StatusBadge({ status }) {
  if (status === "SCHEDULED" || status === "TIMED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
        UPCOMING
      </span>
    );
  }
  if (status === "IN_PLAY" || status === "PAUSED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-[#00E676]/10 border-[#00E676]/30 text-[#00E676]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse inline-block" />
        LIVE
      </span>
    );
  }
  if (status === "FINISHED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-slate-700/30 border-slate-600/30 text-slate-400">
        FT
      </span>
    );
  }
  return null;
}

function TeamFlag({ teamName }) {
  const code = getCountryCode(teamName);
  if (!code) return null;
  return <span className={`fi fi-${code}`} />;
}

function formatMatchDate(utcDate) {
  if (!utcDate) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(utcDate));
  } catch {
    return utcDate;
  }
}

export default function MatchCard({ match, player, onPredictionSaved }) {
  const [oddsData, setOddsData] = useState(null);
  const [oddsLoading, setOddsLoading] = useState(true);
  const [oddsError, setOddsError] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchOdds = useCallback(async () => {
    setOddsLoading(true);
    setOddsError(false);
    try {
      const res = await fetch(`/api/v1/predictions/${match.id}`);
      if (!res.ok) throw new Error("Failed to fetch odds");
      const data = await res.json();
      if (data.success) {
        setOddsData(data.data);
      } else {
        setOddsError(true);
      }
    } catch {
      setOddsError(true);
    } finally {
      setOddsLoading(false);
    }
  }, [match.id]);

  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);

  const handlePredictionSaved = async (prediction) => {
    setShowForm(false);
    await fetchOdds();
    if (onPredictionSaved) {
      onPredictionSaved(prediction);
    }
  };

  const { homeTeam, awayTeam, status, score, competition, utcDate } = match;
  const isScheduled = status === "SCHEDULED" || status === "TIMED";
  const isLive = status === "IN_PLAY" || status === "PAUSED";
  const isFinished = status === "FINISHED";
  // Predictions only open before kick-off; no editing once the match has started
  const isPredictionOpen = isScheduled;

  return (
    <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl hover:border-white/15 transition-all flex flex-col gap-3">
      {/* Header row: competition name + status badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500 font-semibold truncate uppercase tracking-wider">
          {competition?.name || "World Cup"}
        </span>
        <StatusBadge status={status} />
      </div>

      {/* Teams row */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TeamFlag teamName={homeTeam?.name} />
          <span className="text-sm font-bold text-white truncate">
            {homeTeam?.name}
          </span>
        </div>

        {/* Score / vs */}
        <div className="shrink-0 px-2 text-center">
          {isFinished && (
            <span className="text-2xl font-extrabold text-white tabular-nums">
              {score?.fullTime?.home ?? 0} : {score?.fullTime?.away ?? 0}
            </span>
          )}
          {isLive && (
            <span className="text-xl font-extrabold text-[#00E676] tabular-nums">
              {score?.fullTime?.home ?? 0} : {score?.fullTime?.away ?? 0}
            </span>
          )}
          {isScheduled && (
            <span className="text-slate-500 font-semibold text-sm">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
          <span className="text-sm font-bold text-white truncate text-right">
            {awayTeam?.name}
          </span>
          <TeamFlag teamName={awayTeam?.name} />
        </div>
      </div>

      {/* Date/time */}
      <div className="text-[10px] text-slate-400">
        {formatMatchDate(utcDate)}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Odds section */}
      <div>
        {oddsLoading && (
          <div className="bg-white/5 h-7 rounded-lg animate-pulse" />
        )}
        {!oddsLoading && oddsError && (
          <span className="text-[10px] text-slate-600 italic">—</span>
        )}
        {!oddsLoading && !oddsError && oddsData && (
          <OddsBar
            odds={oddsData.odds}
            total={oddsData.total}
            homeTeam={homeTeam?.name}
            awayTeam={awayTeam?.name}
            myPrediction={oddsData.myPrediction?.predicted_outcome ?? null}
          />
        )}
      </div>

      {/* Prediction section */}
      <div>
        {/* Logged-in player, match is open for predictions (before kick-off only) */}
        {player !== null && isPredictionOpen && (
          <>
            {!showForm ? (
              <div className="flex items-center gap-2">
                {oddsData?.myPrediction ? (
                  // Already predicted — show their pick, no edit button
                  <span className="text-[9px] text-slate-400 bg-slate-700/30 border border-slate-600/30 px-2 py-1 rounded">
                    Your pick: {oddsData.myPrediction.predicted_home_goals} – {oddsData.myPrediction.predicted_away_goals}
                  </span>
                ) : (
                  <button
                    onClick={() => setShowForm(true)}
                    className="cursor-pointer bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    Predict
                  </button>
                )}
              </div>
            ) : (
              <PredictionForm
                matchId={String(match.id)}
                homeTeam={homeTeam?.name}
                awayTeam={awayTeam?.name}
                existingPrediction={oddsData?.myPrediction ?? null}
                onSave={handlePredictionSaved}
                onCancel={() => setShowForm(false)}
              />
            )}
          </>
        )}

        {/* Logged-in player, match has started or finished — locked */}
        {player !== null && !isPredictionOpen && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-slate-700/30 border border-slate-600/30 text-slate-500 text-[9px] font-bold uppercase px-2 py-1 rounded">
              {isFinished ? "Match ended" : "Match started"}
            </span>
            {oddsData?.myPrediction && (
              <span className="text-[9px] text-slate-500">
                Your pick: {oddsData.myPrediction.predicted_home_goals} – {oddsData.myPrediction.predicted_away_goals}
              </span>
            )}
          </div>
        )}

        {/* Not logged in */}
        {player === null && (
          <Link
            href="/login"
            className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors"
          >
            Login to predict
          </Link>
        )}
      </div>
    </div>
  );
}
