"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function PrimaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <button className={`primary-button ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

export function QuietButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <button className={`quiet-button ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}
