import Link from "next/link";
import Image from "next/image";

export default function Rewards() {
  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white">
            CHALLENGE REWARDS
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
            Complete challenges to earn μPoints and redeem them
          </p>
        </div>
        <Link
          href="/rewards"
          className="self-start sm:self-center px-4 py-2 border border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 hover:text-violet-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(139,92,246,0.15)] hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] shrink-0"
        >
          <span>Rewards Marketplace</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch mt-2">
        {/* REWARD 1: μPoints */}
        <div className="md:col-span-4 bg-[#110e20]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <Image
            src="/mupoints.webp"
            alt="μPoints"
            width={48}
            height={48}
            className="object-contain shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xl font-black text-white leading-none">
              250+
            </span>
            <span className="text-[9px] font-black tracking-wider text-slate-500 mt-1">
              μPoints Available
            </span>
          </div>
        </div>

        {/* REWARD 2: Arena Ticket */}
        <div className="md:col-span-4 bg-[#110e20]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.15)] shrink-0">
            <svg
              className="w-6 h-6 text-violet-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18M3 6h18M3 18h18M3 6.75A1.75 1.75 0 014.75 5h14.5A1.75 1.75 0 0121 6.75v10.5a1.75 1.75 0 01-1.75 1.75H4.75A1.75 1.75 0 013 17.25V6.75z"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-white leading-none">
              1
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1">
              Arena Pass Ticket
            </span>
          </div>
        </div>

        {/* REWARD 3: Marketplace Link */}
        <Link href="/rewards" className="md:col-span-4 bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-slate-900/50 border border-violet-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 top-0 w-24 bg-[radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.15)_0%,_transparent_70%)] pointer-events-none" />
          <div className="flex flex-col gap-1.5 z-10">
            <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest leading-none">
              μFIFA Store
            </span>
            <span className="text-[9px] font-black text-white uppercase tracking-wide leading-tight mt-1 max-w-[150px]">
              Redeem jerseys, tickets, and elite goodies!
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)] shrink-0 z-10 group-hover:scale-105 transition-transform duration-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
