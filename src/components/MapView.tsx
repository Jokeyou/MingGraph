'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useGraphStore } from '@/store';
import { PLACE_COORDS, findPlaceCoord } from '@/data/places';
import { HISTORIC_ROUTES } from '@/data/routes';

type GeoJSON = any;

// ── 配色：古地图/地图集风格 ──
const WATER = '#D4CFC4';          // 海洋：暖灰（纸本色）
const LAND = '#F2EDE4';           // 陆地：米白
const COAST = '#B8A99A';          // 海岸线
const BORDER = '#C4B5A5';         // 省界
const GRATICULE = '#D9D0C0';      // 经纬网
const MARKER = '#C0392B';         // 标记：朱砂红
const MARKER_HL = '#E74C3C';      // 高亮：亮红
const ROUTE_COLOR = '#8B4513';    // 路线：古铜
const LABEL_LAND = '#6B5B4F';     // 省名：深棕
const LABEL_CITY = '#3C2415';     // 城市名：浓棕
const TITLE_COLOR = '#4A3728';    // 标题：古铜
const VIGNETTE = '#3C2F1F';       // 暗角

// 省份配色（按大地域分区，仿古地图淡彩）
const REGION_COLORS: Record<string, string> = {
  '华北': '#F5ECD7', '东北': '#EEE4CC', '华东': '#F7F0E0',
  '华中': '#F3EBD8', '华南': '#F0E6D0', '西南': '#EDE0C8',
  '西北': '#F4E8D4', '青藏': '#E8DCC0',
};
const REGION_MAP: Record<string, string> = {
  '北京市':'华北','天津市':'华北','河北省':'华北','山西省':'华北','内蒙古自治区':'华北',
  '辽宁省':'东北','吉林省':'东北','黑龙江省':'东北',
  '上海市':'华东','江苏省':'华东','浙江省':'华东','安徽省':'华东','福建省':'华东','江西省':'华东','山东省':'华东',
  '河南省':'华中','湖北省':'华中','湖南省':'华中',
  '广东省':'华南','广西壮族自治区':'华南','海南省':'华南',
  '重庆市':'西南','四川省':'西南','贵州省':'西南','云南省':'西南','西藏自治区':'青藏',
  '陕西省':'西北','甘肃省':'西北','青海省':'青藏','宁夏回族自治区':'西北','新疆维吾尔自治区':'西北',
  '台湾省':'华东','香港特别行政区':'华南','澳门特别行政区':'华南',
};

function regionColor(name: string): string {
  const region = REGION_MAP[name] || '华中';
  return REGION_COLORS[region] || LAND;
}

export default function MapView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const geoDataRef = useRef<GeoJSON | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [loaded, setLoaded] = useState(false);

  const { timeRange, searchQuery, selectedNode, selectNode, nodes, setFitToView } = useGraphStore();

  // 加载省份
  useEffect(() => {
    fetch('https://unpkg.com/cn-atlas/provinces.json')
      .then(r => r.json()).then(d => { setGeoData(d); setLoaded(true); })
      .catch(() => setLoaded(true)); // 纯标记模式
  }, []);

  // 全景
  const resetView = () => {
    const svgEl = svgRef.current;
    const zoom = zoomRef.current;
    const proj = projectionRef.current;
    const geo = geoDataRef.current;
    if (!svgEl || !zoom || !proj || !geo) return;
    const w = svgEl.clientWidth, h = svgEl.clientHeight;
    const bounds = d3.geoPath(proj).bounds(geo);
    const dx = bounds[1][0] - bounds[0][0], dy = bounds[1][1] - bounds[0][1];
    if (dx <= 0 || dy <= 0) return;
    const cx = (bounds[0][0] + bounds[1][0]) / 2, cy = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = 0.88 / Math.max(dx / w, dy / h);
    const t = d3.select(svgEl).transition().duration(800) as any;
    t.call(zoom.transform, d3.zoomIdentity.translate(w / 2 - scale * cx, h / 2 - scale * cy).scale(scale));
  };

  useEffect(() => { setFitToView(resetView); return () => { setFitToView(null); }; }, [loaded]);

  // ── 主渲染 ──
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const w = svgEl.clientWidth || 1200, h = svgEl.clientHeight || 700;
    svg.selectAll('*').remove();

    // 投影
    const projection = d3.geoMercator().center([108, 35]).scale(w * 1.5).translate([w / 2, h / 2]);
    if (geoData) try { projection.fitSize([w * 0.9, h * 0.88], geoData); } catch {}
    projectionRef.current = projection;
    geoDataRef.current = geoData;
    const path = d3.geoPath(projection);

    // 缩放
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.6, 8])
      .on('zoom', ev => g.attr('transform', ev.transform));
    svg.call(zoom);
    zoomRef.current = zoom;
    const g = svg.append('g');

    // ── defs ──
    const defs = g.append('defs');

    // 海洋纹理
    const oceanPattern = defs.append('pattern').attr('id', 'ocean')
      .attr('width', 40).attr('height', 40).attr('patternUnits', 'userSpaceOnUse');
    oceanPattern.append('rect').attr('width', 40).attr('height', 40).attr('fill', WATER);
    oceanPattern.append('circle').attr('cx', 20).attr('cy', 20).attr('r', 0.3).attr('fill', '#C8C0B4').attr('opacity', 0.5);

    // 发光
    const glow = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '1.5').attr('result', 'blur');
    glow.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).join('feMergeNode').attr('in', (d: string) => d);

    // 暗角渐变
    const vignette = defs.append('radialGradient').attr('id', 'vignette').attr('cx', '50%').attr('cy', '50%').attr('r', '70%');
    vignette.append('stop').attr('offset', '60%').attr('stop-color', 'transparent');
    vignette.append('stop').attr('offset', '100%').attr('stop-color', VIGNETTE).attr('stop-opacity', 0.4);

    // ── 海洋 ──
    g.append('rect').attr('width', w).attr('height', h).attr('fill', 'url(#ocean)');

    // ── 经纬网 ──
    g.append('path').datum(d3.geoGraticule().step([5, 5])).attr('d', (d: any) => path(d))
      .attr('fill', 'none').attr('stroke', GRATICULE).attr('stroke-width', 0.3).attr('pointer-events', 'none');

    // ── 省份 ──
    if (geoData?.features) {
      const pg = g.append('g').attr('class', 'provinces');
      // 填充
      pg.selectAll('.land').data(geoData.features).join('path')
        .attr('d', (d: any) => path(d))
        .attr('fill', (d: any) => regionColor(d.properties?.name || ''))
        .attr('stroke', BORDER).attr('stroke-width', 0.4)
        .attr('pointer-events', 'none');
      // 海岸线（加粗）
      pg.selectAll('.coast').data(geoData.features).join('path')
        .attr('d', (d: any) => path(d))
        .attr('fill', 'none').attr('stroke', COAST).attr('stroke-width', 1.2).attr('pointer-events', 'none');
      // 省名
      pg.selectAll('.label').data(geoData.features).join('text')
        .attr('x', (d: any) => path.centroid(d)[0])
        .attr('y', (d: any) => path.centroid(d)[1])
        .attr('text-anchor', 'middle').attr('fill', LABEL_LAND)
        .attr('font-size', 9).attr('font-family', '"PingFang SC","Microsoft YaHei",system-ui')
        .attr('opacity', 0.7).attr('pointer-events', 'none')
        .text((d: any) => {
          const n = d.properties?.name || '';
          return n.replace(/省|市|自治区|特别行政区|维吾尔|壮族|回族/g, '');
        });
    }

    // ── 路线 ──
    HISTORIC_ROUTES.forEach(route => {
      const coords = route.path.map(([lat, lng]) => [lng, lat] as [number, number]);
      const ld = { type: 'LineString', coordinates: coords };
      g.append('path').datum(ld).attr('d', (d: any) => path(d))
        .attr('fill', 'none').attr('stroke', ROUTE_COLOR)
        .attr('stroke-width', 1.8).attr('stroke-dasharray', '6,3')
        .attr('opacity', 0.55).attr('pointer-events', 'none');
      if (coords.length >= 2) {
        const mid = Math.floor(coords.length / 2);
        const [mx, my] = projection(coords[mid]) || [0, 0];
        g.append('text').attr('x', mx).attr('y', my - 9)
          .attr('text-anchor', 'middle').attr('fill', ROUTE_COLOR)
          .attr('font-size', 10).attr('font-weight', '500')
          .attr('font-family', '"PingFang SC","Microsoft YaHei",system-ui')
          .attr('opacity', 0.7).attr('pointer-events', 'none').text(route.name);
      }
    });

    // ── 地点标记 ──
    const activeRange = timeRange[0] > 1368 || timeRange[1] < 1644;
    const filtered = PLACE_COORDS.filter(p => {
      if (searchQuery) return p.name.includes(searchQuery) || p.id.includes(searchQuery);
      if (activeRange && p.year_start && p.year_end) return p.year_start <= timeRange[1] && p.year_end >= timeRange[0];
      return true;
    });

    const mg = g.append('g').attr('class', 'markers');
    filtered.forEach(place => {
      const proj = projection([place.lng, place.lat]);
      if (!proj) return;
      const [px, py] = proj;

      // 外圈
      mg.append('circle').attr('cx', px).attr('cy', py).attr('r', 7)
        .attr('fill', '#FFF').attr('stroke', MARKER).attr('stroke-width', 3)
        .attr('cursor', 'pointer').attr('filter', 'url(#glow)')
        .attr('data-pid', place.id)
        .on('click', () => {
          const m = nodes.find(n => n.type === 'place' && (n.name === place.name || n.name === place.id || n.name.includes(place.id)));
          if (m) selectNode(m);
        })
        .on('mouseenter', function () { d3.select(this).attr('r', 9).attr('stroke', MARKER_HL).attr('stroke-width', 4); })
        .on('mouseleave', function () { d3.select(this).attr('r', 7).attr('stroke', MARKER).attr('stroke-width', 3); });
      // 内点
      mg.append('circle').attr('cx', px).attr('cy', py).attr('r', 2.5).attr('fill', MARKER).attr('pointer-events', 'none');

      // 标签
      mg.append('text').attr('x', px + 9).attr('y', py + 4)
        .text(place.id.length > 5 ? place.id.slice(0, 5) : place.id)
        .attr('fill', LABEL_CITY).attr('font-size', 10).attr('font-weight', '500')
        .attr('font-family', '"PingFang SC","Microsoft YaHei",system-ui')
        .attr('pointer-events', 'none');
    });

    (svgEl as any)._markerGroup = mg;
    (svgEl as any)._filteredPlaces = filtered;

    // 暗角
    g.append('rect').attr('width', w).attr('height', h).attr('fill', 'url(#vignette)').attr('pointer-events', 'none');

    // 标题
    g.append('text').attr('x', 24).attr('y', 36)
      .text('大明舆图 · 1368–1644')
      .attr('fill', TITLE_COLOR).attr('font-size', 16).attr('font-weight', 'bold')
      .attr('font-family', '"PingFang SC","Songti SC","KaiTi","Microsoft YaHei",serif')
      .attr('opacity', 0.8).attr('pointer-events', 'none');

    setTimeout(() => resetView(), 400);
  }, [geoData, timeRange, searchQuery, nodes, selectNode]);

  // ── 选中高亮 ──
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const mg = (svgEl as any)._markerGroup;
    if (!mg) return;
    if (selectedNode?.type === 'place') {
      const mp = findPlaceCoord(selectedNode.name);
      const mid = mp?.id || selectedNode.name;
      mg.selectAll('circle').each(function (this: SVGCircleElement) {
        const pid = d3.select(this).attr('data-pid');
        if (pid === mid) d3.select(this).attr('r', 10).attr('stroke', MARKER_HL).attr('stroke-width', 4);
        else d3.select(this).attr('opacity', 0.2);
      });
      mg.selectAll('text').attr('opacity', 0.2);
    } else {
      mg.selectAll('circle').attr('opacity', 1).attr('r', 7).attr('stroke', MARKER).attr('stroke-width', 3);
      mg.selectAll('text').attr('opacity', 1);
    }
  }, [selectedNode]);

  return (
    <div className="w-full h-full relative" style={{ background: WATER }}>
      <svg ref={svgRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: WATER }}>
          <p style={{ color: LABEL_LAND }}>绘制地图…</p>
        </div>
      )}
      {/* 图例 */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 text-xs"
        style={{ color: LABEL_LAND, fontFamily: '"PingFang SC","Microsoft YaHei",system-ui' }}>
        {HISTORIC_ROUTES.map(r => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="w-3 h-0 border-t" style={{ borderColor: ROUTE_COLOR, borderStyle: 'dashed' }} />
            {r.name}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full" style={{ background: MARKER, border: '2px solid #FFF' }} />
          地点 · {PLACE_COORDS.length} 处
        </div>
      </div>
    </div>
  );
}
