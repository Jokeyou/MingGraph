'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useGraphStore } from '@/store';
import type { GraphNode, GraphEdge } from '@/types';
import { computeLayout } from '@/lib/layout';

// 星空主题节点颜色
const NODE_COLORS: Record<string, string> = {
  person: '#FFE082',       // 星光琥珀
  event: '#FFD740',         // 金星
  place: '#40C4FF',         // 蓝星
  institution: '#69F0AE',   // 绿星
};

const NODE_RADIUS = [8, 14, 18, 24, 30]; // importance 1-5

// 节点形状生成器
function getNodeShape(node: GraphNode, r: number) {
  switch (node.type) {
    case 'event':
      // 菱形
      return `M 0 ${-r} L ${r * 0.7} 0 L 0 ${r} L ${-r * 0.7} 0 Z`;
    case 'place':
      // 方形
      return `M ${-r * 0.7} ${-r * 0.7} L ${r * 0.7} ${-r * 0.7} L ${r * 0.7} ${r * 0.7} L ${-r * 0.7} ${r * 0.7} Z`;
    case 'institution':
      // 三角形
      return `M 0 ${-r} L ${r * 0.8} ${r * 0.6} L ${-r * 0.8} ${r * 0.6} Z`;
    default:
      return null; // circle via <circle>
  }
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  importance: number;
  radius: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relation: string;
}

export default function ForceGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const {
    nodes, edges, selectedNode, hoveredNode,
    selectNode, setHoveredNode, setZoomToNode, setFitToView,
    searchQuery, filterEmperor, filterType, timeRange,
  } = useGraphStore();

  // 过滤节点
  const filteredNodes = (() => {
    let result = nodes;

    // 类型筛选
    if (filterType) {
      result = result.filter((n) => n.type === filterType);
    }

    // 时间线筛选：只显示生存期与时间范围有交集的节点
    if (timeRange[0] > 1368 || timeRange[1] < 1644) {
      result = result.filter((n) => {
        // 无年份数据 → 始终显示
        if (!n.birth_year && !n.death_year) return true;
        const b = n.birth_year || n.death_year || 1500;
        const d = n.death_year || n.birth_year || 1500;
        // 生存期与时间范围有交集
        return b <= timeRange[1] && d >= timeRange[0];
      });
    }

    // 搜索：显示匹配节点 + 其直接关联节点（保留连线）
    if (searchQuery) {
      const matchedIds = new Set(
        result.filter((n) => n.name.includes(searchQuery)).map((n) => n.id)
      );
      if (matchedIds.size > 0) {
        // 找出关联节点
        const connectedIds = new Set<string>();
        edges.forEach((e) => {
          if (matchedIds.has(e.source)) connectedIds.add(e.target);
          if (matchedIds.has(e.target)) connectedIds.add(e.source);
        });
        result = result.filter((n) => matchedIds.has(n.id) || connectedIds.has(n.id));
      }
    }

    return result;
  })();

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // 对外暴露 zoomToNode
  const zoomToNodeFn = useCallback((id: string) => {
    const simNode = nodesRef.current.find((n) => n.id === id);
    if (!simNode || !svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const w = svgRef.current.clientWidth;
    const h = svgRef.current.clientHeight;
    svg.transition().duration(600).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(w / 2 - simNode.x! * 2, h / 2 - simNode.y! * 2).scale(2)
    );
  }, []);

  // 全景：计算所有节点的包围盒并缩放适配
  const fitToView = useCallback(() => {
    if (!svgRef.current || !zoomRef.current || nodesRef.current.length === 0) return;
    const svg = d3.select(svgRef.current);
    const w = svgRef.current.clientWidth;
    const h = svgRef.current.clientHeight;
    const pad = 40;
    const xs = nodesRef.current.map((n) => n.x!).filter(Boolean);
    const ys = nodesRef.current.map((n) => n.y!).filter(Boolean);
    if (xs.length === 0) return;
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const bw = xMax - xMin || 1, bh = yMax - yMin || 1;
    const scale = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh, 1.5);
    const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
    svg.transition().duration(800).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(w / 2 - cx * scale, h / 2 - cy * scale).scale(scale)
    );
  }, []);

  // 首次加载自动适配全景
  useEffect(() => {
    if (simRef.current && nodesRef.current.length > 0 && !searchQuery) {
      simRef.current.on('end', () => {
        setTimeout(fitToView, 200);
      });
    }
  }, [filteredNodes.length]);

  useEffect(() => {
    setZoomToNode(zoomToNodeFn);
    setFitToView(fitToView);
  }, [zoomToNodeFn, fitToView, setZoomToNode, setFitToView]);

  // 主渲染
  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const w = svgRef.current.clientWidth || 1200;
    const h = svgRef.current.clientHeight || 700;

    svg.selectAll('*').remove();

    // 缩放
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.06, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    const g = svg.append('g');

    // defs: 发光滤镜 + 箭头
    const defs = g.append('defs');

    // 发光滤镜
    const glow = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
    glow.append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .join('feMergeNode')
      .attr('in', (d: string) => d);

    // 箭头
    defs.selectAll('marker')
      .data(['arrow'])
      .join('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0,-3 L 8,0 L 0,3')
      .attr('fill', '#A0C8F0');

    // 力模拟
    const simNodes: SimNode[] = filteredNodes.map((n) => ({
      ...n,
      radius: NODE_RADIUS[n.importance - 1] || 8,
    }));

    // 🏯 环形布局初始位置
    const layout = computeLayout(
      filteredNodes,
      filteredEdges,
      w, h
    );
    for (const sn of simNodes) {
      const pos = layout.get(sn.id);
      if (pos) {
        sn.x = pos.x;
        sn.y = pos.y;
        // 皇帝节点钉住，非皇帝节点松一点
        const isEmperor = sn.importance >= 4 && sn.type === 'person';
        sn.fx = isEmperor ? pos.x : null;
        sn.fy = isEmperor ? pos.y : null;
      }
    }

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks: SimLink[] = filteredEdges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        relation: e.relation,
      }));

    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(100)
        .strength(0.3))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide<SimNode>().radius((d) => d.radius + 10));

    simRef.current = simulation;
    nodesRef.current = simNodes;

    // 连线
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', '#A0C8F0')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1.2)
      .attr('marker-end', 'url(#arrow)');

    // 节点组
    const nodeGroup = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(drag(simulation) as any);

    // 圆形节点（默认人物）
    nodeGroup.filter((d) => d.type === 'person' || !getNodeShape(d as any, 1))
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => NODE_COLORS[d.type] || NODE_COLORS.person)
      .attr('stroke', '#080C14')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');

    // 特殊形状节点
    for (const shapeType of ['event', 'place', 'institution']) {
      nodeGroup.filter((d) => d.type === shapeType)
        .append('path')
        .attr('d', (d) => getNodeShape(d as any, d.radius) || '')
        .attr('fill', NODE_COLORS[shapeType])
        .attr('stroke', '#080C14')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#glow)');
    }

    // 标签（只显示 importance >= 4 的节点）
    nodeGroup.filter((d) => d.importance >= 4)
      .append('text')
      .text((d) => d.name.length > 4 ? d.name.slice(0, 4) + '…' : d.name)
      .attr('dy', (d) => d.radius + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#BCC8E0')
      .attr('font-size', 11)
      .attr('font-family', 'system-ui, sans-serif');

    // 交互
    nodeGroup
      .on('click', (_event, d) => {
        const orig = nodes.find((n) => n.id === d.id);
        selectNode(orig || null);
      })
      .on('mouseenter', (_event, d) => {
        setHoveredNode(d.id);
        // 高亮关联
        const linkedIds = new Set<string>();
        simLinks.forEach((l) => {
          const src = (l.source as SimNode).id;
          const tgt = (l.target as SimNode).id;
          if (src === d.id) linkedIds.add(tgt);
          if (tgt === d.id) linkedIds.add(src);
        });
        nodeGroup.attr('opacity', (n) =>
          n.id === d.id || linkedIds.has(n.id) ? 1 : 0.2
        );
        link.attr('stroke-opacity', (l) =>
          (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? 0.9 : 0.05
        );
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        nodeGroup.attr('opacity', 1);
        link.attr('stroke-opacity', 0.4);
      })
      .on('dblclick', (_event, d) => {
        // 双击聚焦
        const svgEl = svgRef.current!;
        const w2 = svgEl.clientWidth;
        const h2 = svgEl.clientHeight;
        svg.transition().duration(600).call(
          zoom.transform,
          d3.zoomIdentity.translate(w2 / 2 - d.x! * 2.5, h2 / 2 - d.y! * 2.5).scale(2.5)
        );
      });

    // 连线流光粒子
    const particleGroup = g.append('g').attr('class', 'particles');
    const particleCount = Math.min(simLinks.length * 2, 300);
    const particles: { link: SimLink; t: number; speed: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        link: simLinks[Math.floor(Math.random() * simLinks.length)],
        t: Math.random(),
        speed: 0.002 + Math.random() * 0.005,
      });
    }
    const particleCircles = particleGroup.selectAll('circle')
      .data(particles)
      .join('circle')
      .attr('r', 1.2)
      .attr('fill', '#FFE8C0')
      .attr('opacity', 0.7);

    // 粒子动画 loop（独立于 force tick）
    let particleFrame: number;
    const animateParticles = () => {
      particleCircles.each((d) => {
        d.t += d.speed;
        if (d.t > 1) d.t = 0;
      });
      particleCircles
        .attr('cx', (d) => {
          const src = d.link.source as SimNode;
          const tgt = d.link.target as SimNode;
          return (src.x || 0) + ((tgt.x || 0) - (src.x || 0)) * d.t;
        })
        .attr('cy', (d) => {
          const src = d.link.source as SimNode;
          const tgt = d.link.target as SimNode;
          return (src.y || 0) + ((tgt.y || 0) - (src.y || 0)) * d.t;
        });
      particleFrame = requestAnimationFrame(animateParticles);
    };
    animateParticles();

    // 模拟 tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x!)
        .attr('y1', (d) => (d.source as SimNode).y!)
        .attr('x2', (d) => (d.target as SimNode).x!)
        .attr('y2', (d) => (d.target as SimNode).y!);

      nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // 模拟稳定后释放非皇帝节点的固定位置
    simulation.on('end', () => {
      simNodes.forEach((n) => {
        // 只释放非皇帝节点
        if (n.importance < 4 || n.type !== 'person') {
          n.fx = null;
          n.fy = null;
        }
      });
    });

    // 搜索自动聚焦：等模拟稳定后 zoom 到匹配节点
    if (searchQuery) {
      simulation.on('end', () => {
        const target = simNodes.find((n) => n.name.includes(searchQuery));
        if (target && svgRef.current) {
          const sw = svgRef.current.clientWidth;
          const sh = svgRef.current.clientHeight;
          svg.transition().duration(500).call(
            zoom.transform,
            d3.zoomIdentity.translate(sw / 2 - target.x! * 2.5, sh / 2 - target.y! * 2.5).scale(2.5)
          );
          // 自动选中
          const orig = nodes.find((n) => n.id === target.id);
          if (orig) selectNode(orig);
        }
      });
    }

    return () => {
      simulation.stop();
      cancelAnimationFrame(particleFrame);
    };
  }, [filteredNodes.length, filteredEdges.length, nodes.length, edges.length, filterType, searchQuery, timeRange[0], timeRange[1]]);

  // 选中高亮（独立 effect，不重建模拟）
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const nodeGroup = svg.selectAll('.nodes g');
    const link = svg.selectAll('.links line');

    if (selectedNode) {
      const nodeData = nodesRef.current;
      nodeGroup.attr('opacity', function () {
        const d = d3.select(this).datum() as SimNode;
        if (d.id === selectedNode.id) return 1;
        const linked = edges.some(
          (e) => (e.source === selectedNode.id && e.target === d.id) ||
                 (e.target === selectedNode.id && e.source === d.id)
        );
        return linked ? 0.8 : 0.15;
      });
      link.attr('stroke-opacity', (d: any) => {
        const src = (d.source as SimNode).id;
        const tgt = (d.target as SimNode).id;
        return (src === selectedNode.id || tgt === selectedNode.id) ? 0.9 : 0.05;
      });
    } else {
      nodeGroup.attr('opacity', 1);
      link.attr('stroke-opacity', 0.3);
    }
  }, [selectedNode?.id, edges]);

  // 拖拽
  function drag(simulation: d3.Simulation<SimNode, SimLink>) {
    function dragstarted(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3.drag<SVGGElement, SimNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }


  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: '#080C14' }}>
      <svg ref={svgRef} className="w-full h-full" />
      {filteredNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[#556688]">
          <p className="text-lg">没有匹配的节点，试试调整筛选条件</p>
        </div>
      )}
    </div>
  );
}
