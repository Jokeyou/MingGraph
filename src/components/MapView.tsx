'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGraphStore } from '@/store';
import { PLACE_COORDS, findPlaceCoord } from '@/data/places';
import { HISTORIC_ROUTES } from '@/data/routes';

// Leaflet CSS（dynamic import 下才能用）
import 'leaflet/dist/leaflet.css';

// 暗色瓦片（CartoDB Dark Matter，免费无需 key）
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://carto.com/">CARTO</a>';

// 默认图标
const defaultIcon = L.divIcon({
  className: 'map-marker',
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#FFB74D;border:2px solid #0A1620;box-shadow:0 0 8px #FFB74D;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const activeIcon = L.divIcon({
  className: 'map-marker-active',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#FFD740;border:3px solid #FFE082;box-shadow:0 0 12px #FFD740;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ── 子组件：地图全景控制器 ──
function FitBoundsControl({ onReady }: { onReady: (fn: () => void) => void }) {
  const map = useMap();

  useEffect(() => {
    const fitToChina = () => {
      // 中国大致边界
      map.fitBounds([
        [18, 73],   // 西南角（云南/新疆南）
        [53.5, 135], // 东北角（黑龙江）
      ], { padding: [20, 20], animate: true, duration: 0.8 });
    };
    onReady(fitToChina);
  }, [map, onReady]);

  return null;
}

// ── 子组件：地点标记列表 ──
function PlaceMarkers() {
  const { timeRange, searchQuery, selectNode, nodes } = useGraphStore();

  const activeRange = timeRange[0] > 1368 || timeRange[1] < 1644;
  const filtered = PLACE_COORDS.filter((p) => {
    if (searchQuery) return p.name.includes(searchQuery) || p.id.includes(searchQuery);
    if (activeRange) {
      if (p.year_start && p.year_end) return p.year_start <= timeRange[1] && p.year_end >= timeRange[0];
      return true;
    }
    return true;
  });

  return (
    <>
      {filtered.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={defaultIcon}
          eventHandlers={{
            click: () => {
              const matched = nodes.find((n) =>
                n.type === 'place' &&
                (n.name === place.name || n.name === place.id || n.name.includes(place.id))
              );
              if (matched) selectNode(matched);
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
            <span style={{ fontSize: 12, fontFamily: 'system-ui' }}>{place.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

// ── 子组件：历史路线 ──
function RouteLines() {
  return (
    <>
      {HISTORIC_ROUTES.map((route) => {
        const positions: [number, number][] = route.path.map(
          ([lat, lng]) => [lat, lng]
        );
        return (
          <Polyline
            key={route.id}
            positions={positions}
            pathOptions={{
              color: '#E8A820',
              weight: 2,
              dashArray: '8 5',
              opacity: 0.6,
            }}
          >
            <Tooltip sticky>
              <span style={{ fontSize: 11, fontFamily: 'system-ui' }}>
                {route.name} {route.year ? `(${route.year})` : ''}
              </span>
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}

// ── 主组件 ──
export default function MapView() {
  const { setFitToView } = useGraphStore();
  const [mapReady, setMapReady] = useState(false);

  const handleFitReady = useCallback((fn: () => void) => {
    setFitToView(fn);
    setMapReady(true);
  }, [setFitToView]);

  useEffect(() => {
    return () => { setFitToView(null); };
  }, [setFitToView]);

  // 修复 Leaflet 默认图标在 bundler 中的路径问题
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="w-full h-full relative" style={{ background: '#0F1A28' }}>
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0F1A28]/90 z-[1000]">
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">🗺️</div>
            <p className="text-[#556688] text-sm">加载地图…</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[35, 108]}
        zoom={4}
        minZoom={3}
        maxZoom={10}
        className="w-full h-full"
        zoomControl={true}
        style={{ background: '#0F1A28' }}
      >
        {/* 暗色瓦片 */}
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />

        {/* 地点标记 */}
        <PlaceMarkers />

        {/* 历史路线 */}
        <RouteLines />

        {/* 全景控制器 */}
        <FitBoundsControl onReady={handleFitReady} />
      </MapContainer>

      {/* 路线图例 — 左下角 */}
      <div className="absolute bottom-4 left-4 z-[500] flex flex-col gap-1.5
        bg-[#141E2C]/85 backdrop-blur-md rounded-lg px-3 py-2
        border border-[#3A5068]/30 text-xs pointer-events-none">
        {HISTORIC_ROUTES.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="w-4 h-0 border-t" style={{ borderColor: '#E8A820', borderStyle: 'dashed' }} />
            <span style={{ color: '#BCC8D8' }}>{r.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
