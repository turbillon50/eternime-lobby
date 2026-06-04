import type { HTMLAttributes, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & { padded?: boolean }>;

export function Card({ children, padded = true, className = "", ...props }: CardProps) {
  return (
    <div className={`et-card ${padded ? "p-5 sm:p-6" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <h3 className={`et-serif text-lg text-[var(--et-text)] ${className}`}>{children}</h3>
  );
}

export function CardDescription({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <p className={`text-sm text-[var(--et-text-muted)] ${className}`}>{children}</p>;
}
