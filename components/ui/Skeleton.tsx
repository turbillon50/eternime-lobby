type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
};

export function Skeleton({ className = "", width, height = "1rem" }: SkeletonProps) {
  return <div className={`et-skeleton ${className}`} style={{ width, height }} aria-hidden />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="et-card grid gap-3 p-5">
      <Skeleton width="40%" height="1.1rem" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${90 - i * 12}%`} />
      ))}
    </div>
  );
}
