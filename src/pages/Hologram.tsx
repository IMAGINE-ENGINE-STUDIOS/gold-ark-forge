import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Boxes, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { PipelineProvider } from '@/components/pipeline/PipelineProvider';
import { HoloDrift, HoloDust, HoloFloor, HoloRings } from '@/components/hologram/HoloRig';
import HoloSwap from '@/components/hologram/HoloSwap';

const useHoloScale = () => {
  const [scale, setScale] = useState(0.011);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setScale(w < 700 ? 0.0055 : w < 1200 ? 0.0085 : 0.011);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return scale;
};

export default function Hologram() {
  const scale = useHoloScale();

  return (
    <div className="min-h-screen bg-[#02080f]">
      <Header />
      <main className="relative">
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
          <Sparkles className="h-4 w-4 text-gold-light" />
          <h1 className="font-display text-sm tracking-[0.3em] text-gold-light sm:text-lg">HOLO SWAP</h1>
          <span className="rounded-full border border-gold/30 px-2 py-0.5 font-mono text-[8px] tracking-[0.2em] text-cyan-200/70">
            ALIEN TECHNOLOGY PROJECTION · WEBGL
          </span>
          <div className="pointer-events-auto ml-auto flex gap-2">
            <Link
              to="/trading-bridge"
              className="flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-gold-light hover:border-gold/70"
            >
              <ArrowLeftRight className="h-3 w-3" /> SWAP
            </Link>
            <Link
              to="/pipeline"
              className="flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-gold-light hover:border-gold/70"
            >
              <Boxes className="h-3 w-3" /> PIPELINE
            </Link>
          </div>
        </div>

        <div className="h-[calc(100vh-64px)] w-full">
          <Canvas
            camera={{ position: [0, 0.6, 11], fov: 48 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false }}
          >
            <color attach="background" args={['#02080f']} />
            <fog attach="fog" args={['#02080f', 14, 34]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[0, 4, 6]} intensity={40} color="#d4af37" />
            <pointLight position={[-8, -3, 4]} intensity={20} color="#38bdf8" />

            <Stars radius={70} depth={40} count={2500} factor={3} saturation={0} fade speed={0.6} />
            <HoloDust />
            <HoloRings />
            <HoloFloor />

            <Suspense fallback={null}>
              <HoloDrift>
                <Html
                  transform
                  scale={scale * 100}
                  position={[0, 0.2, 0]}
                  distanceFactor={undefined}
                  className="select-none"
                >
                  <PipelineProvider seedTickers={['XAUUSD', 'BTCUSD']}>
                    <div className="holo-projection">
                      <HoloSwap />
                    </div>
                  </PipelineProvider>
                </Html>
              </HoloDrift>
            </Suspense>

            <OrbitControls
              enablePan={false}
              enableZoom
              minDistance={7}
              maxDistance={16}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.8}
              maxAzimuthAngle={0.5}
              minAzimuthAngle={-0.5}
              enableDamping
            />
          </Canvas>
        </div>

        <p className="pointer-events-none absolute bottom-3 left-0 right-0 z-20 text-center font-mono text-[8px] tracking-[0.24em] text-cyan-200/40">
          DRAG TO ORBIT THE PROJECTION · SCROLL TO ZOOM · LIVE FEEDS ONLY
        </p>
      </main>
    </div>
  );
}