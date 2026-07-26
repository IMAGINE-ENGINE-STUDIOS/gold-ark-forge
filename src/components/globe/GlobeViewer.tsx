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
  const errorRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);

  // Exponential backoff retry helper — recovers from transient network/WebGL hiccups.
  const retryWithBackoff = useCallback(
    async <T,>(
      task: () => Promise<T>,
      label: string,
      maxAttempts = 5,
      baseDelayMs = 800,
    ): Promise<T | null> => {
      let attempt = 0;
      let lastErr: unknown;
      while (attempt < maxAttempts) {
        if (cancelledRef.current) return null;
        try {
          return await task();
        } catch (e) {
          lastErr = e;
          attempt += 1;
          if (attempt >= maxAttempts) break;
          const jitter = Math.random() * 250;
          const delay = Math.min(baseDelayMs * 2 ** (attempt - 1) + jitter, 15000);
          console.warn(
            `[Globe] ${label} attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`,
            e,
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      console.warn(`[Globe] ${label} gave up after ${maxAttempts} attempts`, lastErr);
      return null;
    },
    [],
  );

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
      } else {
        const marker = markerMapRef.current.get(id);
        if (marker) e.show = visibleCategories.has(marker.category);
      }
    });
  }, [visibleCategories, showHeatmap]);

  // Init viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    if (ION_TOKEN) Cesium.Ion.defaultAccessToken = ION_TOKEN;

    let viewer: Cesium.Viewer;
    try {
      viewer = new Cesium.Viewer(containerRef.current, {
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
      creditContainer: document.createElement('div'),
      });
    } catch (e) {
      console.error('Cesium viewer init failed:', e);
      if (errorRef.current) {
        errorRef.current.style.display = 'flex';
        errorRef.current.textContent = 'Globe failed to initialize. WebGL may be disabled in your browser.';
      }
      return;
    }

    // Attach world terrain asynchronously so a token/network failure doesn't block the viewer
    (async () => {
      if (!ION_TOKEN) return;
      const terrain = await retryWithBackoff(
        () => Cesium.CesiumTerrainProvider.fromIonAssetId(1),
        'world terrain',
      );
      if (terrain && !viewer.isDestroyed()) {
        viewer.terrainProvider = terrain;
      }
    })();

    // Load 3D buildings — Google Photorealistic first, OSM Buildings fallback
    (async () => {
      if (!ION_TOKEN) return;
      const google = await retryWithBackoff(
        () => Cesium.Cesium3DTileset.fromIonAssetId(2275207),
        'google photorealistic tiles',
        4,
      );
      if (google && !viewer.isDestroyed()) {
        viewer.scene.primitives.add(google);
        return;
      }
      const osm = await retryWithBackoff(
        () => Cesium.Cesium3DTileset.fromIonAssetId(96188),
        'osm buildings tiles',
        4,
      );
      if (osm && !viewer.isDestroyed()) {
        viewer.scene.primitives.add(osm);
      }
    })();

    // Retry individual tile request failures with backoff (transient network hiccups)
    const tileRetries = new Map<string, number>();
    const tileFailedRemover = viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
      /* noop — subscription keeps engine responsive during retries */
    });
    const imageryErrorRemovers: Array<() => void> = [];
    const attachImageryRetry = (layer: Cesium.ImageryLayer) => {
      const provider = layer.imageryProvider;
      const evt = provider.errorEvent;
      if (!evt) return;
      const remover = evt.addEventListener((tileErr: Cesium.TileProviderError) => {
        const key = `${tileErr.x}:${tileErr.y}:${tileErr.level}`;
        const n = (tileRetries.get(key) ?? 0) + 1;
        tileRetries.set(key, n);
        if (n <= 4) {
          tileErr.retry = true;
          tileErr.timesRetried = n;
          const delay = Math.min(500 * 2 ** (n - 1), 8000);
          console.warn(`[Globe] imagery tile ${key} retry ${n} in ${delay}ms`);
          // Cesium honours tileErr.retry immediately; delay is informational
        }
      });
      imageryErrorRemovers.push(remover);
    };
    for (let i = 0; i < viewer.imageryLayers.length; i++) {
      attachImageryRetry(viewer.imageryLayers.get(i));
    }
    const layerAddRemover = viewer.imageryLayers.layerAdded.addEventListener(attachImageryRetry);

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

    // Click handler — uses markerMap for reliable lookup
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id) {
        const entity = picked.id as Cesium.Entity;
        const entityId = typeof entity.id === 'string' ? entity.id : '';
        const marker = markerMapRef.current.get(entityId);
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

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(40, 25, 20_000_000),
      duration: 0,
    });

    return () => {
      cancelledRef.current = true;
      if (spinRef.current) clearInterval(spinRef.current);
      tileFailedRemover();
      layerAddRemover();
      imageryErrorRemovers.forEach((r) => r());
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [addMarkers, onMarkerClick, retryWithBackoff]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      <div
        ref={errorRef}
        style={{ display: 'none' }}
        className="absolute inset-0 items-center justify-center bg-navy text-gold text-sm font-display tracking-wider p-8 text-center z-10"
      />
    </>
  );
};

export default GlobeViewer;
