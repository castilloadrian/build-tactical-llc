'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]}>
      <meshBasicMaterial
        color="#3b82f6"
        wireframe
        transparent
        opacity={0.15}
      />
    </Sphere>
  );
}

export default function AnimatedGlobe() {
  return (
    <div className="absolute inset-0 w-full h-full bg-transparent pointer-events-none -z-10">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
        className="bg-transparent"
        gl={{
          alpha: true,
          antialias: true,
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Globe />
      </Canvas>
    </div>
  );
} 