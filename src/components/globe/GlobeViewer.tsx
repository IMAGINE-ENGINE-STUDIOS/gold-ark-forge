import { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { ALL_MARKERS, GlobeMarker } from '@/data/globeLocations';

const ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined;

interface Props {
  onMarkerClick: (marker: GlobeMarker) => void;
  visibleCategories: Set<string>;
  showHeatmap?: boolean;
}

const RISK_COLORS: Record<string, Cesium.Color> = {
  critical: Cesium.Color.fromCssColorString('#ef4444'),
  high: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.85),
  elevated: Cesium.Color.fromCssColorString('#f97316'),
  moderate: Cesium.Color.fromCssColorString('#eab308'),
  low: Cesium.Color.fromCssColorString('#22c55e'),
};

const CATEGORY_COLORS: Record<string, Cesium.Color> = {
  chokepoint: Cesium.Color.fromCssColorString('#f97316'),
  producer: Cesium.Color.fromCssColorString('#3b82f6'),
  exchange: Cesium.Color.fromCssColorString('#eab308'),
  venezuela: Cesium.Color.fromCssColorString('#a855f7'),
  organization: Cesium.Color.fromCssColorString('#10b981'),
};

// GDP-based heatmap color
const getHeatColor = (gdpGrowth?: number): Cesium.Color => {
  if (gdpGrowth == null) return Cesium.Color.GRAY.withAlpha(0.15);
  if (gdpGrowth > 4) return Cesium.Color.fromCssColorString('#22c55e').withAlpha(0.25);
  if (gdpGrowth > 2) return Cesium.Color.fromCssColorString('#84cc16').withAlpha(0.20);
  if (gdpGrowth > 0) return Cesium.Color.fromCssColorString('#eab308').withAlpha(0.18);
  return Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.22);
};

const GlobeViewer = ({ onMarkerClick, visibleCategories, showHeatmap = false }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const spinRef = useRef<number | null>(null);
  const markerMapRef = useRef<Map<string, GlobeMarker>>(new Map());
  const pulseRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const addMarkers = useCallback((viewer: Cesium.Viewer) => {
    ALL_MARKERS.forEach((m) => {
      markerMapRef.current.set(m.id, m);

      const pointColor =
        m.category === 'chokepoint' && m.riskLevel
          ? RISK_COLORS[m.riskLevel] ?? CATEGORY_COLORS.chokepoint
          : CATEGORY_COLORS[m.category] ?? Cesium.Color.WHITE;

      const pixelSize = m.category === 'chokepoint' ? 14
        : m.category === 'venezuela' ? 16
        : m.category === 'organization' ? 12
        : 10;

      viewer.entities.add({
        id: m.id,
        name: m.name,
        position: Cesium.Cartesian3.fromDegrees(m.lng, m.lat),
        point: {
          pixelSize,
          color: pointColor,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.6),
          outlineWidth: 1.5,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.8, 1.5e7, 0.6),
        },
        label: {
          text: m.name,
          font: '12px "Cinzel", serif',
          fillColor: Cesium.Color.fromCssColorString('#f5f0e8'),
          outlineColor: Cesium.Color.BLACK.withAlpha(0.7),
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -22),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1, 8e6, 0.4),
          translucencyByDistance: new Cesium.NearFarScalar(1.5e6, 1, 1.2e7, 0),
        },
        show: visibleCategories.has(m.category),
      });

      // Glowing pulse ring for high-risk chokepoints
      if (m.category === 'chokepoint' && (m.riskLevel === 'critical' || m.riskLevel === 'high')) {
        const baseRadius = m.riskLevel === 'critical' ? 180000 : 140000;
        viewer.entities.add({
          id: `pulse-${m.id}`,
          position: Cesium.Cartesian3.fromDegrees(m.lng, m.lat),
          ellipse: {
            semiMajorAxis: new Cesium.CallbackProperty(() => {
              const t = (Date.now() % 2400) / 2400;
              return baseRadius * (1 + t * 1.4);
            }, false) as any,
            semiMinorAxis: new Cesium.CallbackProperty(() => {
              const t = (Date.now() % 2400) / 2400;
              return baseRadius * (1 + t * 1.4);
            }, false) as any,
            material: new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const t = (Date.now() % 2400) / 2400;
                return pointColor.withAlpha(0.45 * (1 - t));
              }, false) as any
            ),
            height: 0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          show: visibleCategories.has(m.category),
        });
      }

      // Economic heatmap circle
      if (m.economicData?.gdp) {
        const radius = Math.sqrt(m.economicData.gdp) * 8000;
        viewer.entities.add({
          id: `heatmap-${m.id}`,
          position: Cesium.Cartesian3.fromDegrees(m.lng, m.lat),
          ellipse: {
            semiMinorAxis: radius,
            semiMajorAxis: radius,
            material: getHeatColor(m.economicData.gdpGrowth),
            height: 0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          show: showHeatmap,
        });
      }
    });
  }, []);

  // Sync visibility
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.entities.values.forEach((e) => {
      const id = typeof e.id === 'string' ? e.id : '';
      if (id.startsWith('heatmap-')) {
        e.show = showHeatmap;
      } else if (id.startsWith('pulse-')) {
        const realId = id.replace('pulse-', '');
        const marker = markerMapRef.current.get(realId);
        if (marker) e.show = visibleCategories.has(marker.category);
      } else {
        const marker = markerMapRef.current.get(id);
        if (marker) e.show = visibleCategories.has(marker.category);
      }
    });
    viewer.scene.requestRender();
  }, [visibleCategories, showHeatmap]);

  // Init viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    if (ION_TOKEN) Cesium.Ion.defaultAccessToken = ION_TOKEN;

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shadows: false,
      shouldAnimate: true,
      msaaSamples: 4,
      contextOptions: { webgl: { alpha: true, antialias: true, powerPreference: 'high-performance' } } as any,
      creditContainer: document.createElement('div'),
    });

    // Load Google Photorealistic 3D Tiles (Atlas-style world), OSM Buildings fallback
    (async () => {
      try {
        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(2275207, {
          maximumScreenSpaceError: 8,
          preloadWhenHidden: true,
        });
        // Subtle golden tint for brand cohesion
        tileset.style = new Cesium.Cesium3DTileStyle({
          color: "color('#fff7e6', 1.0)",
        });
        viewer.scene.primitives.add(tileset);
        viewer.scene.requestRender();
      } catch {
        try {
          const osm = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
          viewer.scene.primitives.add(osm);
        } catch (e) {
          console.warn('3D buildings unavailable:', e);
        }
      }
    })();

    // Cinematic atmosphere — warm golden cast, deep navy sky
    const scene = viewer.scene;
    scene.skyAtmosphere.hueShift = -0.02;
    scene.skyAtmosphere.saturationShift = -0.1;
    scene.skyAtmosphere.brightnessShift = -0.15;
    scene.skyAtmosphere.atmosphereLightIntensity = 12;
    scene.fog.enabled = true;
    scene.fog.density = 0.0001;
    scene.globe.enableLighting = true;
    scene.globe.dynamicAtmosphereLighting = true;
    scene.globe.atmosphereBrightnessShift = -0.05;
    scene.globe.showGroundAtmosphere = true;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0e1a');
    scene.backgroundColor = Cesium.Color.fromCssColorString('#000000');

    // High-DPI rendering for crisp imagery
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2);
    scene.postProcessStages.fxaa.enabled = true;

    // Slow spin
    const startSpin = () => {
      if (spinRef.current) return;
      spinRef.current = window.setInterval(() => {
        viewer.scene.camera.rotateRight(0.0008);
        viewer.scene.requestRender();
      }, 50);
    };
    const stopSpin = () => {
      if (spinRef.current) { clearInterval(spinRef.current); spinRef.current = null; }
    };
    const scheduleResumeSpin = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => startSpin(), 8000);
    };
    startSpin();

    // Pulse re-render loop (CallbackProperty needs continuous rendering)
    pulseRef.current = window.setInterval(() => viewer.scene.requestRender(), 80);

    // Stop spin on interaction
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(() => {
      stopSpin();
      scheduleResumeSpin();
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(() => { stopSpin(); scheduleResumeSpin(); }, Cesium.ScreenSpaceEventType.WHEEL);
    handler.setInputAction(() => { stopSpin(); scheduleResumeSpin(); }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);

    // Click handler — uses markerMap for reliable lookup
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id) {
        const entity = picked.id as Cesium.Entity;
        let entityId = typeof entity.id === 'string' ? entity.id : '';
        if (entityId.startsWith('pulse-')) entityId = entityId.replace('pulse-', '');
        if (entityId.startsWith('heatmap-')) entityId = entityId.replace('heatmap-', '');
        const marker = markerMapRef.current.get(entityId);
        if (marker) {
          onMarkerClick(marker);
          stopSpin();
          scheduleResumeSpin();
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(marker.lng, marker.lat, 1_200_000),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-55), roll: 0 },
            duration: 1.8,
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    addMarkers(viewer);
    viewerRef.current = viewer;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(20, 20, 22_000_000),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
      duration: 0,
    });

    return () => {
      stopSpin();
      if (pulseRef.current) clearInterval(pulseRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [addMarkers, onMarkerClick]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      {/* Vignette overlay for cinematic depth */}
      <div className="pointer-events-none absolute inset-0 z-10" style={{
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
      }} />
    </>
  );
};

export default GlobeViewer;
