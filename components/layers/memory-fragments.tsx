"use client";

import { motion } from "framer-motion";

const fragments = [
  { top: "18%", left: "12%", width: 92, delay: 0 },
  { top: "26%", left: "78%", width: 118, delay: 0.2 },
  { top: "68%", left: "16%", width: 128, delay: 0.34 },
  { top: "72%", left: "74%", width: 84, delay: 0.48 },
  { top: "42%", left: "8%", width: 66, delay: 0.62 },
  { top: "46%", left: "86%", width: 76, delay: 0.76 },
];

export function MemoryFragments({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {fragments.map((fragment, index) => (
        <motion.div
          className="memory-fragment"
          key={`${fragment.left}-${fragment.top}`}
          style={{
            top: fragment.top,
            left: fragment.left,
            width: fragment.width,
          }}
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{
            opacity: active ? 1 : 0,
            y: active ? [0, -10, 0] : 12,
            scale: active ? 1 : 0.94,
          }}
          transition={{
            opacity: { duration: 1.2, delay: fragment.delay },
            y: { duration: 7 + index, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 1 },
          }}
        />
      ))}
    </div>
  );
}
