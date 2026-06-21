export default function ComingSoonCard({ category }) {
  const displayCategory = category && category !== "All" ? `${category} ` : "";
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-[#110e24]/80 border border-white/5 rounded-2xl backdrop-blur-md shadow-2xl max-w-md mx-auto w-full text-center relative overflow-hidden animate-fade-in">
      <div className="absolute top-[10%] left-[5%] w-[30vw] h-[30vw] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      
      <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white border border-white/20 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-[0_1px_3px_rgba(0,0,0,0.3)] leading-none select-none mb-4">
        {category && category !== "All" ? `${category} ARENA` : "COMING SOON"}
      </span>
      
      <h2 className="text-base font-black text-white uppercase tracking-widest mb-3">
        CHALLENGES COMING SOON
      </h2>
      
      <div className="w-16 h-16 flex items-center justify-center bg-white/5 border border-white/10 rounded-full mb-5 shadow-[0_0_15px_rgba(255,255,255,0.02)] text-slate-400">
        <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs">
        {displayCategory}tasks will be added later. Get ready to level up your favorite team with progression challenges!
      </p>
    </div>
  );
}
