'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useGraphStore } from '@/store';
import { PLACE_COORDS, findPlaceCoord } from '@/data/places';
import { HISTORIC_ROUTES } from '@/data/routes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSON = any;

// 星空地图配色
const MARKER_COLOR = '#40C4FF';   // 地点：蓝星
const MARKER_ACTIVE = '#FFD740';  // 选中：金星
const ROUTE_COLOR = '#D4A017';    // 路线：暗金

export default function MapView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [loaded, setLoaded] = useState(false);

  const {
    timeRange, searchQuery, selectedNode,
    selectNode, nodes, edges,
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

  // ── 主渲染：底图 + 路线 + 标记 ──
  const renderMap = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    const w = svgEl.clientWidth || 1200;
    const h = svgEl.clientHeight || 700;

    svg.selectAll('*').remove();

    // 投影：Mercator 居中中国
    const projection = d3.geoMercator().center([108, 35]).scale(w * 1.5).translate([w / 2, h / 2]);
    if (geoData) {
      try {
        projection.fitSize([w * 0.92, h * 0.9], geoData);
      } catch { /* 使用默认投影 */ }
    }
    projectionRef.current = projection;
    const geoPath = d3.geoPath(projection);

    // 缩放（与 ForceGraph 一致的 d3.zoom）
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    const g = svg.append('g');

    // ── defs: 发光滤镜 ──
    const defs = g.append('defs');
    const glow = defs.append('filter').attr('id', 'mapGlow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur');
    glow.append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .join('feMergeNode')
      .attr('in', (d: string) => d);

    // ── 背景 ──
    g.append('rect').attr('width', w).attr('height', h).attr('fill', '#0A0E17');

    // ── 省份边界 ──
    if (geoData && geoData.features) {
      g.append('g').attr('class', 'provinces')
        .selectAll('path')
        .data(geoData.features)
        .join('path')
        .attr('d', (d: any) => geoPath(d))
        .attr('fill', '#111827')
        .attr('stroke', '#1E293B')
        .attr('stroke-width', 0.5)
        .attr('pointer-events', 'none');
    }

    // ── 经纬网 ──
    const graticule = d3.geoGraticule().step([5, 5]);
    g.append('path').datum(graticule).attr('d', (d: any) => geoPath(d))
      .attr('fill', 'none').attr('stroke', '#1a2540')
      .attr('stroke-width', 0.3).attr('stroke-dasharray', '2,3')
      .attr('pointer-events', 'none');

    // ── 海域（简化：绘制一个覆盖海洋的 rect 在省份后面做不到，跳过）──

    // ── 路线 ──
    const routeGroup = g.append('g').attr('class', 'routes');
    HISTORIC_ROUTES.forEach((route) => {
      const coords = route.path.map(([lat, lng]) => [lng, lat] as [number, number]);
      const lineData = { type: 'LineString', coordinates: coords };

      // 虚线底层
      routeGroup.append('path').datum(lineData).attr('d', (d: any) => geoPath(d))
        .attr('fill', 'none').attr('stroke', ROUTE_COLOR)
        .attr('stroke-width', 1.2).attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.4).attr('pointer-events', 'none');

      // 路线标签（在路径中点）
      if (coords.length >= 2) {
        const mid = Math.floor(coords.length / 2);
        const [mx, my] = projection(coords[mid]) || [0, 0];
        routeGroup.append('text')
          .attr('x', mx).attr('y', my - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', '#D4A017').attr('font-size', 10)
          .attr('font-family', 'system-ui, sans-serif')
          .attr('opacity', 0.7).attr('pointer-events', 'none')
          .text(route.name);
      }
    });

    // ── 地点标记 ──
    // 时间筛选
    const activeRange = timeRange[0] > 1368 || timeRange[1] < 1644;
    const filteredPlaces = PLACE_COORDS.filter((p) => {
      if (searchQuery) {
        return p.name.includes(searchQuery) || p.id.includes(searchQuery);
      }
      if (activeRange) {
        if (p.year_start && p.year_end) {
          return p.year_start <= timeRange[1] && p.year_end >= timeRange[0];
        }
        // 无年份信息的地点始终显示
        return true;
      }
      return true;
    });

    const markerGroup = g.append('g').attr('class', 'markers');

    filteredPlaces.forEach((place) => {
      const proj = projection([place.lng, place.lat]);
      if (!proj) return;
      const [px, py] = proj;

      // 标记点
      markerGroup.append('circle')
        .attr('cx', px).attr('cy', py)
        .attr('r', 5).attr('fill', MARKER_COLOR)
        .attr('stroke', '#0A0E17').attr('stroke-width', 1.5)
        .attr('cursor', 'pointer').attr('filter', 'url(#mapGlow)')
        .attr('data-place-id', place.id)
        .on('click', () => {
          // 匹配 store 中的节点
          const matched = nodes.find((n) =>
            n.type === 'place' &&
            (n.name === place.name || n.name === place.id || n.name.includes(place.id))
          );
          if (matched) selectNode(matched);
        })
        .on('mouseenter', function () {
          d3.select(this).attr('r', 7).attr('fill', MARKER_ACTIVE);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('r', 5).attr('fill', MARKER_COLOR);
        });

      // 标签（只在地图缩放足够大时显示 → 用 marker 大小判断；简单起见始终显示短标签）
      const label = place.id.length > 4 ? place.id.slice(0, 4) : place.id;
      markerGroup.append('text')
        .attr('x', px + 8).attr('y', py + 4)
        .text(label)
        .attr('fill', '#8899BB').attr('font-size', 10)
        .attr('font-family', 'system-ui, sans-serif')
        .attr('pointer-events', 'none');
    });

    // 存储 marker 引用以便高亮 effect 使用
    (svgEl as any)._markerGroup = markerGroup;
    (svgEl as any)._filteredPlaces = filteredPlaces;
  }, [geoData, timeRange, searchQuery, nodes, selectNode]);

  useEffect(() => {
    renderMap();
  }, [renderMap]);

  // ── 选中高亮（独立 effect）──
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const markerGroup = (svgEl as any)._markerGroup;
    const filteredPlaces = (svgEl as any)._filteredPlaces;
    if (!markerGroup || !filteredPlaces) return;

    if (selectedNode && selectedNode.type === 'place') {
      // 找到匹配的 place
      const matchedPlace = findPlaceCoord(selectedNode.name);
      const matchId = matchedPlace?.id || selectedNode.name;

      markerGroup.selectAll('circle').each(function (this: SVGCircleElement) {
        const placeId = d3.select(this).attr('data-place-id');
        if (placeId === matchId) {
          d3.select(this).attr('r', 8).attr('fill', MARKER_ACTIVE)
            .attr('stroke', '#FFE082').attr('stroke-width', 2.5);
        } else {
          d3.select(this).attr('opacity', 0.3);
        }
      });
      markerGroup.selectAll('text').attr('opacity', 0.3);

      // 高亮关联节点（地点 + 与其关联的人物）
      const linkedIds = new Set<string>();
      edges.forEach((e) => {
        if (e.source === selectedNode.id) linkedIds.add(e.target);
        if (e.target === selectedNode.id) linkedIds.add(e.source);
      });
    } else {
      // 恢复所有标记
      markerGroup.selectAll('circle').attr('opacity', 1)
        .attr('r', 5).attr('fill', MARKER_COLOR)
        .attr('stroke', '#0A0E17').attr('stroke-width', 1.5);
      markerGroup.selectAll('text').attr('opacity', 1);
    }
  }, [selectedNode, edges]);

  return (
    <div className="w-full h-full relative" style={{ background: '#0A0E17' }}>
      <svg ref={svgRef} className="w-full h-full" />

      {/* 加载遮罩 */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0E17]/90 z-10">
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">🗺️</div>
            <p className="text-[#556688] text-sm">加载地图数据…</p>
          </div>
        </div>
      )}

      {/* 路线图例 — 左下角 */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5
        bg-[#080C19]/80 backdrop-blur-md rounded-lg px-3 py-2
        border border-[#C8B896]/20 text-xs">
        {HISTORIC_ROUTES.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="w-4 h-0 border-t border-dashed border-[#D4A017]" />
            <span className="text-[#8899BB]">{r.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
