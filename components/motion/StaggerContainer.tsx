"use client";

import { motion, type Variants } from "framer-motion";
import type { PropsWithChildren } from "react";

const containerVariants: Variants = {
  hidden: {},
  visible: (stagger: number) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.1 },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

type StaggerContainerProps = PropsWithChildren<{
  /** Segundos entre cada hijo. */
  stagger?: number;
  className?: string;
}>;

/** Contenedor que anima a sus StaggerItem hijos en cascada al entrar al viewport. */
export function StaggerContainer({ children, stagger = 0.08, className }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      custom={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
