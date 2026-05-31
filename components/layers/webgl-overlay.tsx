"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Line, Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Points as ThreePoints } from "three";
import * as THREE from "three";

export function WebGLOverlay({ intensity, lowPower }: { intensity: number; lowPower: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      <Canvas
        camera={{ position: [0, 0, 5.7], fov: 44 }}
        dpr={lowPower ? [1, 1.2] : [1, 1.7]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.8} />
        <ParticleField count={lowPower ? 95 : 180} intensity={intensity} />
        <NeuralLines lowPower={lowPower} />
      </Canvas>
    </div>
  );
}

function ParticleField({ count, intensity }: { count: number; intensity: number }) {
  const points = useRef<ThreePoints>(null);
  const { pointer } = useThree();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const seed = seededUnit(index + count);
      const secondSeed = seededUnit(index * 17 + count);
      const thirdSeed = seededUnit(index * 37 + count);
      const radius = 1.65 + seed * 2.05;
      const angle = secondSeed * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.74 + (thirdSeed - 0.5) * 1.2;
      positions[index * 3 + 2] = (seededUnit(index * 53 + count) - 0.5) * 2.1;
    }
    return positions;
  }, [count]);

  useFrame(({ clock }) => {
    if (!points.current) return;
    points.current.rotation.z = clock.elapsedTime * 0.022 * intensity;
    points.current.rotation.x = pointer.y * 0.035;
    points.current.rotation.y = pointer.x * 0.055;
  });

  return (
    <Points ref={points} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.018} sizeAttenuation depthWrite={false} opacity={0.62} />
    </Points>
  );
}

function seededUnit(value: number) {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function NeuralLines({ lowPower }: { lowPower: boolean }) {
  const lines = useMemo(() => {
    const total = lowPower ? 10 : 18;
    return Array.from({ length: total }, (_, index) => {
      const angle = (index / total) * Math.PI * 2;
      const radius = 1.65 + (index % 4) * 0.22;
      return [
        new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7, -0.2),
        new THREE.Vector3(Math.cos(angle + 0.42) * (radius + 0.55), Math.sin(angle + 0.42) * 0.78, 0.1),
      ];
    });
  }, [lowPower]);

  return (
    <Float speed={0.55} rotationIntensity={0.05} floatIntensity={0.25}>
      {lines.map((line, index) => (
        <Line key={index} points={line} color="#ffffff" transparent opacity={0.13} lineWidth={1} />
      ))}
    </Float>
  );
}
