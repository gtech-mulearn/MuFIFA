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

export function getCountryCode(teamName) {
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

export function StatusBadge({ status }) {
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

export function TeamFlag({ teamName }) {
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

export default function MatchCard({ match, player, onPredictionSaved, compact, isSelected, onClick }) {
  const [oddsData, setOddsData] = useState(null);
  const [oddsLoading, setOddsLoading] = useState(true);
  const [oddsError, setOddsError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isTimeWindowOpen, setIsTimeWindowOpen] = useState(false);

  useEffect(() => {
    function checkTimeWindow() {
      const now = new Date();
      const istTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istDate = new Date(istTimeStr);
      const istHour = istDate.getHours();
      const istMinute = istDate.getMinutes();
      setIsTimeWindowOpen(istHour >= 10 && (istHour < 22 || (istHour === 22 && istMinute <= 30)));
    }
    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000);
    return () => clearInterval(interval);
  }, []);

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
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchOdds();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchOdds]);

  const handlePredictionSaved = async (prediction) => {
    setShowForm(false);
    await fetchOdds();
    if (onPredictionSaved) {
      onPredictionSaved(prediction);
    }
  };

  const getPredictionBadge = () => {
    if (!oddsData?.myPrediction) return null;
    if (!score?.fullTime) return null;
    const actualHome = score.fullTime.home;
    const actualAway = score.fullTime.away;
    if (actualHome === null || actualHome === undefined || actualAway === null || actualAway === undefined) return null;

    const predHome = Number(oddsData.myPrediction.predicted_home_goals);
    const predAway = Number(oddsData.myPrediction.predicted_away_goals);
    const predOutcome = oddsData.myPrediction.predicted_outcome;

    let actualOutcome = "draw";
    if (actualHome > actualAway) actualOutcome = "home_win";
    else if (actualAway > actualHome) actualOutcome = "away_win";

    const isExactScore = (predHome === actualHome && predAway === actualAway);
    const isCorrectOutcome = (predOutcome === actualOutcome);

    if (isExactScore) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase bg-emerald-500/10 border-emerald-500/30 text-[#00E676] ml-2">
          Exact Score (+50 pts)
        </span>
      );
    } else if (isCorrectOutcome) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase bg-sky-500/10 border-sky-500/30 text-sky-400 ml-2">
          Correct Outcome
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase bg-rose-500/10 border-rose-500/30 text-rose-400 ml-2">
          Incorrect
        </span>
      );
    }
  };

  const { homeTeam, awayTeam, status, score, competition, utcDate } = match;
  const isScheduled = status === "SCHEDULED" || status === "TIMED";
  const isLive = status === "IN_PLAY" || status === "PAUSED";
  const isFinished = status === "FINISHED";
  // Predictions only open before kick-off; no editing once the match has started
  const isPredictionOpen = isScheduled;

  const homeDisplayName = compact ? (homeTeam?.shortName || homeTeam?.name) : homeTeam?.name;
  const awayDisplayName = compact ? (awayTeam?.shortName || awayTeam?.name) : awayTeam?.name;

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border rounded-2xl backdrop-blur-md shadow-xl transition-all flex flex-col group ${
        compact || isFinished ? "cursor-pointer" : ""
      } ${
        compact
          ? "p-3 hover:border-white/20 gap-2"
          : "p-4 hover:border-white/15 gap-3"
      } ${
        isFinished ? "hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]" : ""
      } ${
        compact && isSelected
          ? "border-[#4f46e5]/80 shadow-[0_0_15px_rgba(79,70,229,0.25)] bg-[#131927]/100"
          : "border-white/10"
      }`}
    >
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
            {homeDisplayName}
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
        <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0 font-medium">
          <span className="text-sm font-bold text-white truncate text-right">
            {awayDisplayName}
          </span>
          <TeamFlag teamName={awayTeam?.name} />
        </div>
      </div>

      {/* Date/time */}
      <div className="text-[10px] text-slate-400">
        {formatMatchDate(utcDate)}
      </div>

      {/* Divider */}
      {!compact && <div className="border-t border-white/5" />}

      {/* Odds section */}
      {!compact && (
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
      )}

      {/* Prediction section */}
      {!compact && (
        <div>
          {/* Logged-in player, match is open for predictions (before kick-off only) */}
          {player !== null && isPredictionOpen && (
            <>
              {!showForm ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {oddsData?.myPrediction ? (
                      <>
                        <span className="text-[9px] text-slate-400 bg-slate-700/30 border border-slate-600/30 px-2 py-1 rounded">
                          Your pick: {oddsData.myPrediction.predicted_home_goals} – {oddsData.myPrediction.predicted_away_goals}
                        </span>
                        {isTimeWindowOpen ? (
                          Number(player?.mu_points || 0) < 0 ? (
                            <span className="text-[9px] text-red-400 font-semibold italic bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">
                              Editing locked (negative points)
                            </span>
                          ) : (
                            <button
                              onClick={() => setShowForm(true)}
                              className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-white text-[9px] font-bold px-2.5 py-1 rounded transition-colors"
                            >
                              Edit
                            </button>
                          )
                        ) : (
                          <span className="text-[9px] text-slate-500 italic">
                            (Editing locked)
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {isTimeWindowOpen ? (
                          Number(player?.mu_points || 0) < 0 ? (
                            <span className="text-[10px] text-red-400 font-semibold italic bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-xl">
                              Predictions locked (insufficient points)
                            </span>
                          ) : (
                            <button
                              onClick={() => setShowForm(true)}
                              className="cursor-pointer bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                            >
                              Predict
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium italic">
                            Predictions closed for today
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {!isTimeWindowOpen && (
                    <span className="text-[9px] text-slate-500 font-mono">
                      Open 10:00 AM – 10:30 PM IST only.
                    </span>
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] text-slate-500">
                    Your pick: {oddsData.myPrediction.predicted_home_goals} – {oddsData.myPrediction.predicted_away_goals}
                  </span>
                  {isFinished && getPredictionBadge()}
                </div>
              )}
            </div>
          )}

          {/* Not logged in */}
          {player === null && isPredictionOpen && (
            <Link
              href="/login"
              className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors"
            >
              Login to predict
            </Link>
          )}
        </div>
      )}

      {/* Compact layout prediction status indicator */}
      {compact && oddsData?.myPrediction && (
        <div className="text-[9px] text-[#06B6D4] font-bold flex items-center gap-1 mt-0.5 justify-center bg-[#06B6D4]/5 border border-[#06B6D4]/10 py-1.5 rounded-xl">
          <span>Predicted: {oddsData.myPrediction.predicted_home_goals} – {oddsData.myPrediction.predicted_away_goals}</span>
        </div>
      )}
      {compact && !oddsData?.myPrediction && isPredictionOpen && isTimeWindowOpen && (
        <div className="text-[9px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5 justify-center bg-white/5 border border-dashed border-white/10 py-1.5 rounded-xl group-hover:border-[#4F46E5]/40 transition-colors">
          <span>Click to Predict</span>
        </div>
      )}
      {compact && !oddsData?.myPrediction && isPredictionOpen && !isTimeWindowOpen && (
        <div className="text-[9px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 justify-center bg-white/[0.02] border border-white/5 py-1.5 rounded-xl">
          <span>Predict at 10:00 AM</span>
        </div>
      )}
      {compact && !isPredictionOpen && (
        <div className="text-[9px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 justify-center bg-white/[0.02] border border-white/5 py-1.5 rounded-xl">
          <span>Prediction Closed</span>
        </div>
      )}

      {/* Finished Match: Correct Predictions Indicator */}
      {!compact && isFinished && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[9px] group-hover:text-cyan-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Correct Predictions
          </span>
          <span className="text-[9px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors">
            Tap to view winners
          </span>
        </div>
      )}
    </div>
  );
}
