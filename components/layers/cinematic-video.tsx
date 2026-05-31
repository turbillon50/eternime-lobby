export function CinematicVideo() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <video
        aria-hidden="true"
        className="h-full w-full object-cover opacity-78"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/video-poster.svg"
      >
        <source src="/videos/eternime-lobby.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/28" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.78),transparent_30%,rgba(0,0,0,0.8))]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.5),transparent_22%,transparent_78%,rgba(0,0,0,0.52))]" />
    </div>
  );
}
