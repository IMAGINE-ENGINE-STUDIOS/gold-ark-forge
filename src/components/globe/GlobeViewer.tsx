import { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { ALL_MARKERS, GlobeMarker } from '@/data/globeLocations';

// Cesium Ion token — stored as VITE_ env var via secret
const ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined;

interface Props {
  onMarkerClick: (marker: GlobeMarker) => void;
  visibleCategories: Set<string>;
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
};

const GlobeViewer = ({ onMarkerClick, visibleCategories }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const spinRef = useRef<number | null>(null);

  // Build entities once, toggling show later
  const addMarkers = useCallback((viewer: Cesium.Viewer) => {
    ALL_MARKERS.forEach((m) => {
      const pointColor =
        m.category === 'chokepoint' && m.riskLevel
          ? RISK_COLORS[m.riskLevel] ?? CATEGORY_COLORS.chokepoint
          : CATEGORY_COLORS[m.category] ?? Cesium.Color.WHITE;

      const pixelSize = m.category === 'chokepoint' ? 14 : m.category === 'venezuela' ? 16 : 10;

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
        properties: { marker: m } as any,
        show: visibleCategories.has(m.category),
      });
    });
  }, []);

  // Sync visibility
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.entities.values.forEach((e) => {
      const marker = (e.properties as any)?.marker;
      if (marker) e.show = visibleCategories.has(marker.category);
    });
  }, [visibleCategories]);

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
      creditContainer: document.createElement('div'), // hide credits
    });

    // Dark atmosphere
    viewer.scene.skyAtmosphere.hueShift = -0.05;
    viewer.scene.skyAtmosphere.saturationShift = -0.2;
    viewer.scene.skyAtmosphere.brightnessShift = -0.3;
    viewer.scene.fog.enabled = true;
    viewer.scene.globe.enableLighting = true;

    // Slow spin
    const startSpin = () => {
      spinRef.current = window.setInterval(() => {
        viewer.scene.camera.rotateRight(0.002);
      }, 50);
    };
    startSpin();

    // Stop spin on interaction
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(() => {
      if (spinRef.current) { clearInterval(spinRef.current); spinRef.current = null; }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Click handler
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id) {
        const entity = picked.id as Cesium.Entity;
        const marker = (entity.properties as any)?.marker as GlobeMarker | undefined;
        if (marker) {
          onMarkerClick(marker);
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(marker.lng, marker.lat, 2_500_000),
            duration: 1.5,
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    addMarkers(viewer);
    viewerRef.current = viewer;

    // Initial camera
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(40, 25, 20_000_000),
      duration: 0,
    });

    return () => {
      if (spinRef.current) clearInterval(spinRef.current);
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [addMarkers, onMarkerClick]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

export default GlobeViewer;
