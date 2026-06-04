"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = PropsWithChildren<
  Omit<HTMLMotionProps<"button">, "children"> & {
    variant?: Variant;
    loading?: boolean;
  }
>;

const variantClass: Record<Variant, string> = {
  primary: "et-btn et-btn-primary",
  secondary: "et-btn et-btn-secondary",
  ghost: "et-btn et-btn-ghost",
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      className={`${variantClass[variant]} ${className}`}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      {...props}
    >
      {loading ? (
        <motion.span
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            display: "inline-block",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      ) : null}
      {children}
    </motion.button>
  );
}
