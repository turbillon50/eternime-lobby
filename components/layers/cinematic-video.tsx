export function CinematicVideo() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <video
        aria-hidden="true"
        className="h-full w-full object-cover opacity-64"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/video-poster.svg"
      >
        <source src="/videos/eternime-lobby.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/42" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.7),transparent_32%,rgba(0,0,0,0.72))]" />
    </div>
  );
}
