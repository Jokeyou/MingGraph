// 明朝关键地点坐标
// 用于地图层标记，对应 GraphNode 中的 place 节点

import type { PlaceCoord } from '@/types';

export const PLACE_COORDS: PlaceCoord[] = [
  // ── 都城 ──
  { id: '北京', name: '北京（京师）', lat: 39.9158, lng: 116.3908, year_start: 1421, year_end: 1644 },
  { id: '南京', name: '南京（应天府）', lat: 32.0603, lng: 118.7969, year_start: 1368, year_end: 1644 },
  { id: '中都', name: '凤阳（中都）', lat: 32.8760, lng: 117.5540, year_start: 1369, year_end: 1375 },

  // ── 战役地点 ──
  { id: '土木堡', name: '土木堡', lat: 40.3833, lng: 115.6000, year_start: 1449, year_end: 1449 },
  { id: '萨尔浒', name: '萨尔浒', lat: 41.8811, lng: 123.9569, year_start: 1619, year_end: 1619 },
  { id: '宁远', name: '宁远卫', lat: 40.6170, lng: 120.7170, year_start: 1626, year_end: 1626 },
  { id: '山海关', name: '山海关', lat: 40.0094, lng: 119.7536, year_start: 1381, year_end: 1644 },

  // ── 九边重镇 ──
  { id: '宣府', name: '宣府镇', lat: 40.6100, lng: 115.0500, year_start: 1368, year_end: 1644 },
  { id: '大同', name: '大同镇', lat: 40.0936, lng: 113.2914, year_start: 1368, year_end: 1644 },
  { id: '辽东', name: '辽东镇', lat: 41.2719, lng: 123.1736, year_start: 1368, year_end: 1644 },
  { id: '蓟州', name: '蓟州镇', lat: 40.0450, lng: 117.4080, year_start: 1368, year_end: 1644 },
  { id: '登州', name: '登州卫', lat: 37.8160, lng: 120.7580, year_start: 1368, year_end: 1644 },

  // ── 重要城市 ──
  { id: '兰州', name: '兰州', lat: 36.0611, lng: 103.8343, year_start: 1368, year_end: 1644 },
  { id: '濠州', name: '濠州（凤阳）', lat: 32.8760, lng: 117.5540, year_start: 1368, year_end: 1400 },
  { id: '江州', name: '江州（九江）', lat: 29.7050, lng: 116.0020, year_start: 1368, year_end: 1644 },
  { id: '苏州', name: '苏州府', lat: 31.2990, lng: 120.5853, year_start: 1368, year_end: 1644 },
  { id: '杭州', name: '杭州府', lat: 30.2741, lng: 120.1551, year_start: 1368, year_end: 1644 },
  { id: '西安', name: '西安府', lat: 34.3416, lng: 108.9398, year_start: 1368, year_end: 1644 },
  { id: '成都', name: '成都府', lat: 30.5728, lng: 104.0668, year_start: 1368, year_end: 1644 },
  { id: '广州', name: '广州府', lat: 23.1291, lng: 113.2644, year_start: 1368, year_end: 1644 },
  { id: '昆明', name: '云南府', lat: 25.0389, lng: 102.7183, year_start: 1382, year_end: 1644 },

  // ── 邻国/藩属 ──
  { id: '朝鲜', name: '朝鲜', lat: 37.5665, lng: 126.9780, year_start: 1392, year_end: 1644 },
  { id: '安南', name: '安南（交趾）', lat: 21.0278, lng: 105.8342, year_start: 1407, year_end: 1427 },
  { id: '蒙古', name: '鞑靼/瓦剌', lat: 47.0000, lng: 104.0000, year_start: 1368, year_end: 1644 },
];

// name → 坐标快速查找
export const PLACE_MAP: Map<string, PlaceCoord> = new Map(
  PLACE_COORDS.map((p) => [p.name, p])
);

// 只匹配 name 包含关键词的坐标
export function findPlaceCoord(nodeName: string): PlaceCoord | undefined {
  // 精确匹配
  if (PLACE_MAP.has(nodeName)) return PLACE_MAP.get(nodeName);
  // 模糊匹配（节点名包含地名关键词）
  for (const pc of PLACE_COORDS) {
    if (nodeName.includes(pc.id)) return pc;
  }
  return undefined;
}
