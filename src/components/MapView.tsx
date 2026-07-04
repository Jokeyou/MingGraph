'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useGraphStore } from '@/store';
import { PLACE_COORDS, findPlaceCoord } from '@/data/places';
import { HISTORIC_ROUTES } from '@/data/routes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSON = any;

// 配色：古地图质感
const WATER_COLOR = '#1A2A3C';       // 海洋：深蓝灰
const LAND_FILL = '#243447';         // 陆地：藏蓝
const LAND_STROKE = '#3A5068';       // 省界：灰蓝
const GRATICULE_COLOR = '#2D4050';   // 经纬网
const MARKER_COLOR = '#FFB74D';      // 地点：暖橙（更醒目）
const MARKER_ACTIVE = '#FFD740';     // 选中：金星
const ROUTE_COLOR = '#E8A820';       // 路线：琥珀金
const LABEL_COLOR = '#BCC8D8';       // 标签：浅灰蓝

// 省份色阶（按地理分区给不同颜色）
const PROVINCE_COLORS = [
  '#243447', '#283D50', '#2C4258', '#2F4760',
  '#334C68', '#375170', '#3B5678', '#3F5B80',
  '#324E62', '#2E4760', '#2A415E',
];

export default function MapView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const geoDataRef = useRef<GeoJSON | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [loaded, setLoaded] = useState(false);

  const {
    timeRange, searchQuery, selectedNode,
    selectNode, nodes, edges, setFitToView,
  } = useGraphStore();

  // 加载省份 GeoJSON
  useEffect(() => {
    fetch('https://unpkg.com/cn-atlas/provinces.json')
      .then((r) => r.json())
      .then((data) => {
        setGeoData(data);
        setLoaded(true);
      })
      .catch(() => {
        console.warn('省份数据加载失败，使用纯标记模式');
        setLoaded(true);
      });
  }, []);

  // ── 全景函数（直接操作 zoom）──
  const resetView = () => {
    const svgEl = svgRef.current;
    const zoom = zoomRef.current;
    const proj = projectionRef.current;
    const geo = geoDataRef.current;
    if (!svgEl || !zoom || !proj || !geo) return;

    const w = svgEl.clientWidth;
    const h = svgEl.clientHeight;
    const path = d3.geoPath(proj);
    const bounds = path.bounds(geo);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    if (dx <= 0 || dy <= 0) return;

    const cx = (bounds[0][0] + bounds[1][0]) / 2;
    const cy = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = 0.85 / Math.max(dx / w, dy / h);
    const tx = w / 2 - scale * cx;
    const ty = h / 2 - scale * cy;

    d3.select(svgEl)
      .transition().duration(800)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  };

  // 注册全景函数
  useEffect(() => {
    if (loaded) {
      setFitToView(resetView);
    }
    return () => {
      setFitToView(null);
    };
  }, [loaded, setFitToView]);

  // ── 主渲染 ──
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    const w = svgEl.clientWidth || 1200;
    const h = svgEl.clientHeight || 700;

    svg.selectAll('*').remove();

    // 投影
    const projection = d3.geoMercator().center([108, 35]).scale(w * 1.5).translate([w / 2, h / 2]);
    if (geoData) {
      try { projection.fitSize([w * 0.92, h * 0.9], geoData); } catch { /* 默认 */ }
    }
    projectionRef.current = projection;
    geoDataRef.current = geoData;
    const geoPath = d3.geoPath(projection);

    // 缩放
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    const g = svg.append('g');
    gRef.current = g;

    // ── defs ──
    const defs = g.append('defs');

    // 发光滤镜
    const glow = defs.append('filter').attr('id', 'mapGlow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur');
    glow.append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic']).join('feMergeNode').attr('in', (d: string) => d);

    // 海洋渐变
    const oceanGrad = defs.append('radialGradient').attr('id', 'oceanGrad')
      .attr('cx', '50%').attr('cy', '40%').attr('r', '60%');
    oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1E3045');
    oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0F1A28');

    // ── 海洋背景 ──
    g.append('rect').attr('width', w).attr('height', h).attr('fill', 'url(#oceanGrad)');

    // ── 经纬网 ──
    const graticule = d3.geoGraticule().step([5, 5]);
    g.append('path').datum(graticule).attr('d', (d: any) => geoPath(d))
      .attr('fill', 'none').attr('stroke', GRATICULE_COLOR)
      .attr('stroke-width', 0.4).attr('stroke-dasharray', '2,4')
      .attr('pointer-events', 'none');

    // ── 省份 ──
    if (geoData && geoData.features) {
      const provinces = g.append('g').attr('class', 'provinces');
      provinces.selectAll('path')
        .data(geoData.features)
        .join('path')
        .attr('d', (d: any) => geoPath(d))
        .attr('fill', (d: any, i: number) =>
          // 台湾特殊标注
          d.properties?.name === '台湾省' ? '#2A4A5E' :
          PROVINCE_COLORS[i % PROVINCE_COLORS.length]
        )
        .attr('stroke', LAND_STROKE)
        .attr('stroke-width', 0.6)
        .attr('pointer-events', 'none');

      // 省份名标注（大省份）
      provinces.selectAll('text')
        .data(geoData.features.filter((f: any) => {
          const name = f.properties?.name || '';
          return ['新疆', '西藏', '内蒙古', '青海', '四川', '云南', '黑龙江', '广东'].includes(name);
        }))
        .join('text')
        .attr('x', (d: any) => geoPath.centroid(d)[0])
        .attr('y', (d: any) => geoPath.centroid(d)[1])
        .attr('text-anchor', 'middle')
        .attr('fill', '#4A6078')
        .attr('font-size', 10)
        .attr('font-family', 'system-ui, sans-serif')
        .attr('opacity', 0.5)
        .attr('pointer-events', 'none')
        .text((d: any) => d.properties?.name || '');
    }

    // ── 路线 ──
    const routeGroup = g.append('g').attr('class', 'routes');
    HISTORIC_ROUTES.forEach((route) => {
      const coords = route.path.map(([lat, lng]) => [lng, lat] as [number, number]);
      const lineData = { type: 'LineString', coordinates: coords };

      // 路线底色（粗、半透明）
      routeGroup.append('path').datum(lineData).attr('d', (d: any) => geoPath(d))
        .attr('fill', 'none').attr('stroke', ROUTE_COLOR)
        .attr('stroke-width', 2.5).attr('stroke-dasharray', '6,4')
        .attr('opacity', 0.25).attr('pointer-events', 'none');

      // 路线主线
      routeGroup.append('path').datum(lineData).attr('d', (d: any) => geoPath(d))
        .attr('fill', 'none').attr('stroke', ROUTE_COLOR)
        .attr('stroke-width', 1.2).attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.6).attr('pointer-events', 'none');

      // 路线标签
      if (coords.length >= 2) {
        const mid = Math.floor(coords.length / 2);
        const [mx, my] = projection(coords[mid]) || [0, 0];
        routeGroup.append('text')
          .attr('x', mx).attr('y', my - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', ROUTE_COLOR).attr('font-size', 11)
          .attr('font-weight', '500')
          .attr('font-family', 'system-ui, sans-serif')
          .attr('opacity', 0.8).attr('pointer-events', 'none')
          .text(route.name);

        // 起止点小圆
        [coords[0], coords[coords.length - 1]].forEach(([lx, ly]) => {
          const [px, py] = projection([lx, ly]) || [0, 0];
          routeGroup.append('circle')
            .attr('cx', px).attr('cy', py).attr('r', 3)
            .attr('fill', ROUTE_COLOR).attr('opacity', 0.8)
            .attr('pointer-events', 'none');
        });
      }
    });

    // ── 地点标记 ──
    const activeRange = timeRange[0] > 1368 || timeRange[1] < 1644;
    const filteredPlaces = PLACE_COORDS.filter((p) => {
      if (searchQuery) {
        return p.name.includes(searchQuery) || p.id.includes(searchQuery);
      }
      if (activeRange) {
        if (p.year_start && p.year_end) {
          return p.year_start <= timeRange[1] && p.year_end >= timeRange[0];
        }
        return true;
      }
      return true;
    });

    const markerGroup = g.append('g').attr('class', 'markers');

    // 标记背景圆（大一圈）
    filteredPlaces.forEach((place) => {
      const proj = projection([place.lng, place.lat]);
      if (!proj) return;
      const [px, py] = proj;

      markerGroup.append('circle')
        .attr('cx', px).attr('cy', py)
        .attr('r', 8).attr('fill', '#0A1620')
        .attr('stroke', MARKER_COLOR).attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .attr('filter', 'url(#mapGlow)')
        .attr('data-place-id', place.id)
        .on('click', () => {
          const matched = nodes.find((n) =>
            n.type === 'place' &&
            (n.name === place.name || n.name === place.id || n.name.includes(place.id))
          );
          if (matched) selectNode(matched);
        })
        .on('mouseenter', function () {
          d3.select(this).attr('r', 10).attr('stroke', MARKER_ACTIVE).attr('stroke-width', 3);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('r', 8).attr('stroke', MARKER_COLOR).attr('stroke-width', 2);
        });

      // 标签
      const label = place.id.length > 4 ? place.id.slice(0, 4) : place.id;
      markerGroup.append('text')
        .attr('x', px + 10).attr('y', py + 4)
        .text(label)
        .attr('fill', LABEL_COLOR).attr('font-size', 10)
        .attr('font-family', 'system-ui, sans-serif')
        .attr('pointer-events', 'none');
    });

    // 存储引用
    (svgEl as any)._markerGroup = markerGroup;
    (svgEl as any)._filteredPlaces = filteredPlaces;

    // 首屏自动全景
    setTimeout(() => resetView(), 300);
  }, [geoData, timeRange, searchQuery, nodes, selectNode]);

  // ── 选中高亮 ──
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const markerGroup = (svgEl as any)._markerGroup;
    if (!markerGroup) return;

    if (selectedNode && selectedNode.type === 'place') {
      const matchedPlace = findPlaceCoord(selectedNode.name);
      const matchId = matchedPlace?.id || selectedNode.name;

      markerGroup.selectAll('circle').each(function (this: SVGCircleElement) {
        const placeId = d3.select(this).attr('data-place-id');
        if (placeId === matchId) {
          d3.select(this).attr('r', 10).attr('stroke', MARKER_ACTIVE).attr('stroke-width', 3);
        } else {
          d3.select(this).attr('opacity', 0.25);
        }
      });
      markerGroup.selectAll('text').attr('opacity', 0.25);
    } else {
      markerGroup.selectAll('circle').attr('opacity', 1)
        .attr('r', 8).attr('stroke', MARKER_COLOR).attr('stroke-width', 2);
      markerGroup.selectAll('text').attr('opacity', 1);
    }
  }, [selectedNode]);

  return (
    <div className="w-full h-full relative" style={{ background: WATER_COLOR }}>
      <svg ref={svgRef} className="w-full h-full" />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0F1A28]/90 z-10">
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">🗺️</div>
            <p className="text-[#556688] text-sm">加载地图数据…</p>
          </div>
        </div>
      )}

      {/* 路线图例 — 左下角 */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5
        bg-[#141E2C]/80 backdrop-blur-md rounded-lg px-3 py-2
        border border-[#3A5068]/30 text-xs">
        {HISTORIC_ROUTES.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="w-4 h-0 border-t border-dashed" style={{ borderColor: ROUTE_COLOR }} />
            <span style={{ color: LABEL_COLOR }}>{r.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
