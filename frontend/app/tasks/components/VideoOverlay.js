export default function VideoOverlay({ showVideo, showCloseBtn, completeUnlock }) {
  if (!showVideo) return null;

  return (
    <div className="challenge-modal-fixed-wrapper z-[9999] bg-black flex items-center justify-center">
      <video
        src="/tier2_unlock_video.mp4"
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {showCloseBtn && (
        <button
          onClick={completeUnlock}
          className="absolute top-6 right-6 z-[10000] px-6 py-3 bg-black/60 hover:bg-[#10b981] border border-white/20 hover:border-[#10b981] backdrop-blur-md rounded-full text-white font-black text-xs tracking-widest uppercase flex items-center gap-2 transition-all cursor-pointer shadow-2xl animate-fade-in"
        >
          <span>Complete Unlock</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
