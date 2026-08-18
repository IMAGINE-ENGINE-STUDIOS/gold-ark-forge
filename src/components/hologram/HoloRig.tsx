import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Slowly rotating alien torus rings that frame the hologram. */
export const HoloRings = () => {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const c = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (a.current) a.current.rotation.z += dt * 0.08;
    if (b.current) { b.current.rotation.x += dt * 0.05; b.current.rotation.y -= dt * 0.06; }
    if (c.current) c.current.rotation.y += dt * 0.12;
  });

  const gold = '#d4af37';
  return (
    <group position={[0, 0, -2]}>
      <group ref={a}>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[6.4, 0.015, 8, 160]} />
          <meshBasicMaterial color={gold} transparent opacity={0.55} />
        </mesh>
      </group>
      <group ref={b}>
        <mesh>
          <torusGeometry args={[7.6, 0.008, 8, 160]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.35} />
        </mesh>
      </group>
      <group ref={c}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[9, 0.02, 8, 200]} />
          <meshBasicMaterial color={gold} transparent opacity={0.2} />
        </mesh>
      </group>
    </group>
  );
};

/** Drifting particulate field — the "alien atmosphere". */
export const HoloDust = ({ count = 900 }: { count?: number }) => {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 34;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 24 - 4;
    }
    return arr;
  }, [count]);

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.015;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.3;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#d4af37" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
};

/** Projection floor grid with a scanning emitter beam. */
export const HoloFloor = () => {
  const beam = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.06 + Math.abs(Math.sin(state.clock.elapsedTime * 1.2)) * 0.08;
    }
  });
  return (
    <group position={[0, -4.2, -2]}>
      <gridHelper args={[46, 46, '#d4af37', '#1f3a5f']} />
      <mesh ref={beam} position={[0, 3.6, 0]}>
        <cylinderGeometry args={[7.2, 0.6, 7.2, 48, 1, true]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
};

/** Gentle float + parallax applied to the hologram content group. */
export const HoloDrift = ({ children }: { children: React.ReactNode }) => {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!g.current) return;
    const t = state.clock.elapsedTime;
    g.current.position.y = Math.sin(t * 0.6) * 0.12;
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, state.pointer.x * 0.16, 0.05);
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, -state.pointer.y * 0.1, 0.05);
  });
  return <group ref={g}>{children}</group>;
};