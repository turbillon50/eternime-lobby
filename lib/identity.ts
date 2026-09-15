export const IDENTITY_POSES = [
  { id: "front", label: "Frente · expresión neutra" },
  { id: "three_left", label: "Tres cuartos izquierdo" },
  { id: "left", label: "Perfil izquierdo" },
  { id: "three_right", label: "Tres cuartos derecho" },
  { id: "right", label: "Perfil derecho" },
  { id: "smile", label: "Sonrisa natural" },
] as const;
export function completedIdentityPoses(assets: { pose: string }[]) {
  return new Set(assets.filter(asset => IDENTITY_POSES.some(pose => pose.id === asset.pose)).map(asset => asset.pose));
}
