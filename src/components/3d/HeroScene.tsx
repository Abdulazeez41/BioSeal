"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

function SealedPackageModel({ isScanning = true }: { isScanning?: boolean }) {
  const scanBeamRef = useRef<THREE.Mesh>(null);
  const dataFlowRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (scanBeamRef.current) {
      // Oscillate scanning beam over indicator strip
      scanBeamRef.current.position.y = 0.2 + Math.sin(t * 2) * 0.45;
      scanBeamRef.current.rotation.z = Math.sin(t) * 0.05;
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* 1. Minimal Cream/Bone Container */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 1.8, 1.4]} />
        <meshStandardMaterial
          color="#FAF7F1"
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      {/* Container Lid Bevel */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[2.46, 0.12, 1.46]} />
        <meshStandardMaterial
          color="#F0EBE2"
          roughness={0.3}
          metalness={0.08}
        />
      </mesh>

      {/* 2. Physical Indicator Strip Attached to Container Face */}
      <mesh position={[0, 0.2, 0.71]}>
        <boxGeometry args={[1.2, 0.7, 0.02]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Active Chemical Indicator Zones (Teal baseline / Magenta threshold) */}
      <mesh position={[-0.3, 0.2, 0.725]}>
        <cylinderGeometry args={[0.14, 0.14, 0.01, 32]} />
        <meshStandardMaterial
          color="#0F766E"
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0.3, 0.2, 0.725]}>
        <cylinderGeometry args={[0.14, 0.14, 0.01, 32]} />
        <meshStandardMaterial
          color="#15803D"
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      {/* Optical Matrix Reference Bar */}
      <mesh position={[0, -0.05, 0.725]}>
        <boxGeometry args={[0.9, 0.08, 0.01]} />
        <meshStandardMaterial color="#D4CCBF" roughness={0.5} />
      </mesh>

      {/* 3. Scanning Laser Beam passing over the strip */}
      {isScanning && (
        <mesh ref={scanBeamRef} position={[0, 0.2, 0.74]}>
          <planeGeometry args={[1.35, 0.03]} />
          <meshBasicMaterial
            color="#0F766E"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 4. Subtle Data Nodes (Private Compute Enclave Node) */}
      <group position={[2.2, 0.5, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color="#0F766E"
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
          />
        </mesh>
      </group>

      {/* 5. NEAR Settlement Consensus Node */}
      <group position={[3.6, 0.8, -0.2]}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial
            color="#161513"
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      </group>
    </group>
  );
}

export const Hero3DScene: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasWebGlError, setHasWebGlError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (!mounted || hasWebGlError || prefersReducedMotion) {
    // Graceful static fallback
    return (
      <div className="relative flex h-[360px] w-full items-center justify-center rounded-card border border-border bg-surface p-6 overflow-hidden">
        <div className="text-center space-y-2 z-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-primary text-white">
            <span className="font-mono text-xs font-semibold">TEE</span>
          </div>
          <h4 className="font-semibold text-ink-primary font-heading text-small">
            Sealed Container · Hardware Attestation Node
          </h4>
          <p className="max-w-xs text-xs text-ink-secondary leading-normal">
            Physical indicators inspected inside confidential enclaves on NEAR.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[380px] w-full rounded-card border border-border bg-surface overflow-hidden cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        camera={{ position: [3.2, 1.8, 4.2], fov: 42 }}
        onError={() => setHasWebGlError(true)}
      >
        <color attach="background" args={["#FAF7F1"]} />
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-4, 2, -2]} intensity={0.3} color="#E6F4F2" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <SealedPackageModel isScanning={true} />
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minPolarAngle={Math.PI / 4}
          rotateSpeed={0.6}
        />
      </Canvas>

      {/* Floating Interactive Micro-Notice */}
      <div className="absolute bottom-3 right-4 pointer-events-none rounded-full bg-surface/90 backdrop-blur-sm px-3 py-1 border border-border text-[11px] font-mono text-ink-muted">
        Drag to rotate container · Intel SGX2 Enclave
      </div>
    </div>
  );
};
