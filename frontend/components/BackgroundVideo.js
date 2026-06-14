import React, { useRef, useEffect, memo } from "react";

const BackgroundVideo = memo(() => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.loop = false;
      videoRef.current.play().catch((err) => {
        console.log("Autoplay prevented:", err);
      });
    }
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-[100vh] z-0 opacity-90 pointer-events-none overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-center"
      >
        <source
          src="/mobile_bg.mp4"
          type="video/mp4"
          media="(max-width: 1023px)"
        />
        <source src="/desktop_bg.mp4" type="video/mp4" />
      </video>
    </div>
  );
});
BackgroundVideo.displayName = "BackgroundVideo";

export default BackgroundVideo;
