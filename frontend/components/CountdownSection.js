"use client";

import React, { useState, useEffect } from "react";

export function CountdownSkeleton() {
  return (
    <div className="relative z-20 w-full lg:w-auto my-4 lg:my-0 flex flex-col items-center justify-center lg:items-end text-center lg:text-right">
      <span className="text-[10px] tracking-widest text-[#4F46E5] font-bold uppercase mb-3 animate-pulse">
        LOADING ARENA TIMER...
      </span>
      <div className="flex gap-4 sm:gap-6 justify-center lg:justify-end">
        {["DD", "HH", "MM", "SS"].map((label, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="w-14 sm:w-16 h-12 sm:h-14 bg-white/5 rounded-lg animate-pulse" />
            <span className="text-[9px] text-slate-500 font-bold uppercase mt-1.5">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CountdownSection() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);

    // Target Date: June 17, 2026, 4:00 PM IST (UTC+5:30)
    // Using UTC timestamp 1781692200000 to prevent WebKit / mobile Safari timezone parsing crashes
    const targetDate = new Date(1781692200000);

    const updateCountdown = () => {
      const difference = targetDate.getTime() - Date.now();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format numbers to always be 2 digits (custom helper to avoid padStart compatibility issues on mobile WebKit)
  const formatNum = (num) => {
    const val = Math.max(0, Math.floor(num || 0));
    return val < 10 ? `0${val}` : `${val}`;
  };

  if (!mounted) {
    return <CountdownSkeleton />;
  }

  return (
    <div
      role="timer"
      aria-live="polite"
      className="relative z-20 w-full lg:w-auto my-4 lg:my-0 flex flex-col items-center justify-center lg:items-end text-center lg:text-right"
    >
      <span className="sr-only">
        Time remaining: {timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes} minutes, and {timeLeft.seconds} seconds
      </span>
      <div className="flex items-center gap-2.5 sm:gap-4 justify-center lg:justify-end" aria-hidden="true">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" },
        ].map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx > 0 && (
              <div className="text-xl sm:text-2xl font-black text-slate-600 animate-pulse pb-5">
                :
              </div>
            )}
            <div className="flex flex-col items-center">
              <div className="relative overflow-hidden w-14 sm:w-16 h-12 sm:h-14 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl shadow-inner">
                <div className="absolute top-0 inset-x-0 h-[50%] bg-white/[0.03] border-b border-white/[0.03]" />
                <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 font-mono tracking-wider">
                  {formatNum(item.value)}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                {item.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
