'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, PresentationControls, ContactShadows, Html } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

function MachineModel({ isOpen }: { isOpen: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const door = useRef<THREE.Group>(null!);

  useFrame(() => {
    // Door opening animation only, no idle rotation
    if (door.current) {
      const targetRotation = isOpen ? -Math.PI / 2.5 : 0;
      door.current.rotation.y = THREE.MathUtils.lerp(door.current.rotation.y, targetRotation, 0.1);
    }
  });

  return (
    <group ref={group} dispose={null}>
      {/* Main Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 2, 0.8]} />
        <meshStandardMaterial color="#1a1a1b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Internal Shelves */}
      {[0.5, 0, -0.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.9, 0.6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}

      {/* Vending Door (Glass & Frame) */}
      <group ref={door} position={[0.5, 0, 0.4]}>
        <group position={[-0.5, 0, 0]}>
          {/* Glass */}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[0.9, 1.8, 0.05]} />
            <meshStandardMaterial color="#2E75B6" transparent opacity={0.3} metalness={1} roughness={0} />
          </mesh>
          {/* Frame */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1.9, 0.05]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </group>
      </group>

      {/* Screen / Keypad Area */}
      <mesh position={[0.4, 0.2, 0.41]}>
        <planeGeometry args={[0.2, 0.3]} />
        <meshStandardMaterial color="#2E75B6" emissive="#2E75B6" emissiveIntensity={2} />
      </mesh>

      <ContactShadows position={[0, -1.1, 0]} opacity={0.4} scale={5} blur={2.4} far={0.8} />
    </group>
  );
}

export default function Vending3D() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="w-full h-[400px] md:h-[500px] cursor-pointer"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          //snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <MachineModel isOpen={hovered} />
        </PresentationControls>
      </Canvas>
    </div>
  );
}
