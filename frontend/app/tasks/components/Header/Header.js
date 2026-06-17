export default function Header({ 
  title = "ARENA", 
  highlightedTitle = "PROGRESSION", 
  subtitle = "Complete challenges, earn uPoints and climb the tiers." 
}) {
  return (
    <header className="w-full flex items-center justify-between border-b border-white/5 pb-6">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-white uppercase leading-none">
            {title} <span className="bg-gradient-to-r from-violet-500 to-indigo-400 bg-clip-text text-transparent">{highlightedTitle}</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative w-9 h-9 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer text-slate-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Notification bubble */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        </button>

        {/* Question Mark Help Icon */}
        <button className="w-9 h-9 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer text-slate-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
