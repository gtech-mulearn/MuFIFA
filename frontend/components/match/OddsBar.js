"use client";

export default function OddsBar({ odds, total, homeTeam, awayTeam, myPrediction, oddsError }) {
  // Render a muted placeholder when odds data failed to load
  if (oddsError) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-7 rounded-lg bg-slate-800 flex items-center justify-center">
          <span className="text-slate-500 text-sm">—</span>
        </div>
      </div>
    );
  }

  const isZero = total === 0;
  // Guard against null/undefined odds when total > 0
  const safeOdds = odds ?? { home_win: 33.3, draw: 33.3, away_win: 33.3 };
  const displayOdds = isZero
    ? { home_win: 33.3, draw: 33.3, away_win: 33.3 }
    : safeOdds;

  const segments = [
    { key: "home_win", label: homeTeam, pct: displayOdds.home_win, color: "bg-[#4F46E5]", textColor: "text-[#818CF8]", borderColor: "border-[#4F46E5]/50" },
    { key: "draw", label: "Draw", pct: displayOdds.draw, color: "bg-slate-600", textColor: "text-slate-400", borderColor: "border-slate-500/50" },
    { key: "away_win", label: awayTeam, pct: displayOdds.away_win, color: "bg-[#06B6D4]", textColor: "text-[#06B6D4]", borderColor: "border-[#06B6D4]/50" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Labels row */}
      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
        {segments.map(seg => (
          <span
            key={seg.key}
            className={`${seg.textColor} flex items-center gap-1 ${seg.key === "draw" ? "text-center" : ""}`}
          >
            {myPrediction === seg.key && (
              <span className="text-[#00E676]">✓</span>
            )}
            <span className="truncate max-w-[80px]">{seg.label}</span>
          </span>
        ))}
      </div>

      {/* Bar */}
      <div className="flex h-7 rounded-lg overflow-hidden w-full gap-px">
        {segments.map(seg => (
          <div
            key={seg.key}
            style={{ width: `${seg.pct}%` }}
            className={`${seg.color} flex items-center justify-center transition-all duration-500 ${
              myPrediction === seg.key
                ? "ring-1 ring-white/40 brightness-110"
                : "opacity-80"
            } ${seg.pct < 5 ? "min-w-[4px]" : ""}`}
          >
            {seg.pct >= 12 && (
              <span className="text-[9px] font-black text-white/90 tabular-nums">
                {seg.pct}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Percentage row below bar for small segments */}
      <div className="flex justify-between text-[9px] font-bold tabular-nums">
        {segments.map(seg => (
          <span key={seg.key} className={`${seg.textColor}`}>
            {seg.pct}%
          </span>
        ))}
      </div>

      {/* Total count */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 tabular-nums">
          {total} prediction{total !== 1 ? "s" : ""}
        </span>
        {isZero && (
          <span className="text-[10px] text-slate-500 italic">· No predictions yet</span>
        )}
      </div>
    </div>
  );
}
