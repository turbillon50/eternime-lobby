export const motionTokens = {
  instant: 0.09,
  fast: 0.16,
  standard: 0.28,
  cinematic: 0.56,
  entrance: 0.42,
  exit: 0.22,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  spring: { type: "spring" as const, stiffness: 360, damping: 30, mass: 0.72 },
};
