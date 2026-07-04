/**
 * 明朝图谱初始布局引擎
 * 皇帝环形排列 + 官员按朝代聚簇
 */

import { EMPERORS } from './labels';
import type { GraphNode, GraphEdge } from '@/types';

export interface LayoutPosition {
  x: number;
  y: number;
}

/**
 * 判断节点是否为皇帝
 */
function isEmperorNode(name: string): boolean {
  return EMPERORS.some((ep) => ep.emperor === name);
}

/**
 * 找到一个节点关联的皇帝（通过边）
 */
function findConnectedEmperors(
  nodeId: string,
  edges: GraphEdge[],
  emperorIds: Set<string>
): string[] {
  const connected: string[] = [];
  for (const e of edges) {
    if (e.source === nodeId && emperorIds.has(e.target)) {
      connected.push(e.target);
    }
    if (e.target === nodeId && emperorIds.has(e.source)) {
      connected.push(e.source);
    }
  }
  return connected;
}

/**
 * 计算皇帝环形 + 官员聚簇的初始位置
 */
export function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  const cx = width / 2;
  const cy = height / 2;

  // 1. 找到皇帝节点
  const emperorNodes = nodes.filter((n) => isEmperorNode(n.name));
  const emperorIds = new Set(emperorNodes.map((n) => n.id));

  // 按时间排序皇帝
  const emperorOrder = new Map<string, number>();
  for (const n of emperorNodes) {
    const ep = EMPERORS.find((e) => e.emperor === n.name);
    emperorOrder.set(n.id, ep ? ep.start : 1500);
  }
  const sortedEmperors = [...emperorNodes].sort(
    (a, b) => (emperorOrder.get(a.id) || 1500) - (emperorOrder.get(b.id) || 1500)
  );

  // 2. 皇帝环半径
  const ringRadius = Math.min(cx, cy) * 0.6;
  const emperorCount = sortedEmperors.length;

  sortedEmperors.forEach((emp, i) => {
    const angle = (i / emperorCount) * Math.PI * 2 - Math.PI / 2;
    positions.set(emp.id, {
      x: cx + Math.cos(angle) * ringRadius,
      y: cy + Math.sin(angle) * ringRadius,
    });
  });

  // 3. 非皇帝节点分配到最近的皇帝
  const nonEmperors = nodes.filter((n) => !emperorIds.has(n.id));

  // 按连接找皇帝归属
  const clusters = new Map<string, GraphNode[]>();
  const unassigned: GraphNode[] = [];

  for (const node of nonEmperors) {
    const connected = findConnectedEmperors(node.id, edges, emperorIds);
    if (connected.length > 0) {
      // 分配给第一个连接的皇帝
      const empId = connected[0];
      if (!clusters.has(empId)) clusters.set(empId, []);
      clusters.get(empId)!.push(node);
    } else {
      unassigned.push(node);
    }
  }

  // 4. 在每个皇帝周围布置聚簇
  const clusterRadius = ringRadius * 0.25;

  const clusterEntries = Array.from(clusters.entries());
  for (let ci = 0; ci < clusterEntries.length; ci++) {
    const [empId, clusterNodes] = clusterEntries[ci];
    const empPos = positions.get(empId);
    if (!empPos) continue;

    for (let i = 0; i < clusterNodes.length; i++) {
      const node = clusterNodes[i];
      // 螺旋排列
      const angle = (i * 0.8 + Math.random() * 0.4);
      const r = 30 + Math.sqrt(i + 1) * 22;
      const spreadRadius = Math.min(r, clusterRadius);
      positions.set(node.id, {
        x: empPos.x + Math.cos(angle) * spreadRadius + (Math.random() - 0.5) * 20,
        y: empPos.y + Math.sin(angle) * spreadRadius + (Math.random() - 0.5) * 20,
      });
    }
  }

  // 5. 未分配的节点散落在中心附近
  unassigned.forEach((node, i) => {
    const angle = (i / Math.max(unassigned.length, 1)) * Math.PI * 2;
    const r = ringRadius * 0.55;
    positions.set(node.id, {
      x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 80,
      y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 80,
    });
  });

  return positions;
}
