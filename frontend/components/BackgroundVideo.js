import React, { useRef, useEffect, memo } from "react";

const BackgroundVideo = memo(() => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.loop = false;
      video.play().catch((err) => {
        console.log("Autoplay prevented:", err);
      });

      const handleTimeUpdate = () => {
        if (
          video.duration &&
          !isNaN(video.duration) &&
          video.currentTime >= video.duration - 0.1
        ) {
          video.pause();
          video.currentTime = video.duration - 0.1;
          video.removeEventListener("timeupdate", handleTimeUpdate);
        }
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-[100vh] z-0 opacity-90 pointer-events-none overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="none"
        tabIndex="-1"
        aria-hidden="true"
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
