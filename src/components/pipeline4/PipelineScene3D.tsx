import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { KIND_COLOR, describeStep } from '@/lib/pipelineBlocks';
import type { PipeGraph, PipeStep } from '@/lib/pipelineGraph';

const STEP_GAP = 2.9;
const LANE_GAP = 2.4;

interface SceneProps {
  graph: PipeGraph;
  selectedStepId: string | null;
  activeStepIds: string[];
  errorStepIds: string[];
  onSelectStep: (laneId: string, stepId: string) => void;
  onSelectLane: (laneId: string) => void;
  selectedLaneId: string | null;
}

function StepCard({
  step, position, color, selected, active, errored, onClick,
}: {
  step: PipeStep; position: [number, number, number]; color: string;
  selected: boolean; active: boolean; errored: boolean; onClick: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    mesh.current.position.y = position[1] + (active ? Math.sin(t * 3) * 0.09 : Math.sin(t + position[0]) * 0.03);
    const s = selected ? 1.06 : 1;
    mesh.current.scale.setScalar(THREE.MathUtils.lerp(mesh.current.scale.x, s, 0.15));
  });

  const tone = errored ? '#f43f5e' : color;

  return (
    <group position={position}>
      <mesh ref={mesh} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <boxGeometry args={[2.3, 0.95, 0.14]} />
        <meshStandardMaterial
          color={tone}
          emissive={tone}
          emissiveIntensity={active ? 0.85 : selected ? 0.5 : 0.22}
          transparent
          opacity={0.28}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>
      <Html center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          className="w-[190px] select-none rounded-md border px-2 py-1 text-center backdrop-blur-sm"
          style={{
            borderColor: `${tone}88`,
            background: 'rgba(8,10,16,0.72)',
            boxShadow: selected || active ? `0 0 22px ${tone}66` : 'none',
          }}
        >
          <div className="truncate text-[14px] font-semibold leading-tight" style={{ color: tone }}>
            {step.label}
          </div>
          <div className="truncate text-[12px] leading-tight text-white/70">
            {describeStep(step.kind, step.config) || '—'}
          </div>
        </div>
      </Html>
    </group>
  );
}

function LaneRail({
  z, length, tint, name, selected, onSelect, index,
}: {
  z: number; length: number; tint: string; name: string;
  selected: boolean; onSelect: () => void; index: number;
}) {
  return (
    <group position={[0, 0, z]}>
      <mesh
        position={[length / 2 - 1.4, -0.62, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <planeGeometry args={[Math.max(length, 4), 1.9]} />
        <meshBasicMaterial color={tint} transparent opacity={selected ? 0.14 : 0.05} />
      </mesh>
      <Line
        points={[[-1.9, -0.6, 0], [Math.max(length, 4) - 1.4, -0.6, 0]]}
        color={tint}
        lineWidth={selected ? 2.4 : 1.1}
        transparent
        opacity={selected ? 0.9 : 0.35}
      />
      <Text
        position={[-2.4, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.34}
        anchorX="center"
        color={tint}
        outlineWidth={0}
      >
        {`${index + 1}. ${name}`}
      </Text>
    </group>
  );
}

function GraphScene(props: SceneProps) {
  const { graph, selectedStepId, activeStepIds, errorStepIds, onSelectStep, onSelectLane, selectedLaneId } = props;
  const active = useMemo(() => new Set(activeStepIds), [activeStepIds]);
  const errored = useMemo(() => new Set(errorStepIds), [errorStepIds]);
  const laneZ = (i: number) => (i - (graph.lanes.length - 1) / 2) * LANE_GAP;

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[6, 8, 8]} intensity={90} color="#d4af37" />
      <pointLight position={[-8, 4, -6]} intensity={50} color="#38bdf8" />
      <gridHelper args={[80, 40, '#d4af3722', '#243044']} position={[8, -1.5, 0]} />
      <fog attach="fog" args={['#05070d', 16, 46]} />

      {!graph.lanes.some((l) => l.steps.length) && (
        <Text position={[3, 0.6, 0]} fontSize={0.36} color="#d4af37" anchorX="center">
          Add a step from the left, or ask Genius to build it
        </Text>
      )}

      {graph.lanes.map((lane, li) => {
        const z = laneZ(li);
        const tint = KIND_COLOR[lane.steps[0]?.kind ?? 'asset'] ?? '#d4af37';
        return (
          <group key={lane.id}>
            <LaneRail
              z={z}
              index={li}
              length={Math.max(lane.steps.length, 1) * STEP_GAP}
              tint={lane.consensus ? '#f59e0b' : tint}
              name={lane.consensus ? `${lane.name} (consensus)` : lane.name}
              selected={selectedLaneId === lane.id}
              onSelect={() => onSelectLane(lane.id)}
            />
            {lane.steps.map((step, si) => {
              const x = si * STEP_GAP;
              const color = KIND_COLOR[step.kind] ?? '#d4af37';
              return (
                <group key={step.id}>
                  {si > 0 && (
                    <Line
                      points={[[x - STEP_GAP + 1.2, 0, z], [x - 1.2, 0, z]]}
                      color={color}
                      lineWidth={1.6}
                      transparent
                      opacity={0.7}
                    />
                  )}
                  <StepCard
                    step={step}
                    position={[x, 0, z]}
                    color={color}
                    selected={selectedStepId === step.id}
                    active={active.has(step.id)}
                    errored={errored.has(step.id)}
                    onClick={() => onSelectStep(lane.id, step.id)}
                  />
                </group>
              );
            })}
          </group>
        );
      })}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.05}
        target={[3, 0, 0]}
      />
    </>
  );
}

export default function PipelineScene3D(props: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [-2.5, 4.5, 9.5], fov: 46 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <GraphScene {...props} />
      </Suspense>
    </Canvas>
  );
}