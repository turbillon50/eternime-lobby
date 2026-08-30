const VIDEO_1080 =
  "https://xj6ni4rkwfqszcpa.public.blob.vercel-storage.com/eternime/oficial/eternime-hogar-1080p.mp4";
const VIDEO_720 =
  "https://xj6ni4rkwfqszcpa.public.blob.vercel-storage.com/eternime/oficial/eternime-hogar-720p.mp4";

type OfficialVideoProps = {
  className?: string;
};

export function OfficialVideo({ className = "" }: OfficialVideoProps) {
  return (
    <div className={`official-video-frame ${className}`.trim()}>
      <video
        className="official-video-frame__media"
        controls
        playsInline
        preload="metadata"
        poster="/media/eternime-hogar-poster.webp"
        aria-label="Video institucional de Eternime: Tu hogar de memoria"
      >
        <source src={VIDEO_720} media="(max-width: 760px)" type="video/mp4" />
        <source src={VIDEO_1080} type="video/mp4" />
        Tu navegador no puede reproducir este video.
      </video>
    </div>
  );
}
