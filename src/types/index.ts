// 图谱节点/边类型定义

export interface GraphNode {
  id: string;
  name: string;
  type: 'person' | 'event' | 'place' | 'institution';
  importance: number; // 1-5
  birth_year?: number;
  death_year?: number;
  emperor_period?: string;
  bio_short?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  original_text?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface StoryCard {
  id: string;
  title: string;
  year: number;
  emperor: string;
  summary: string;
  tags: string[]; // 关联人物/事件名
  category: 'betrayal' | 'loyalty' | 'rise_fall' | 'mystery';
}

export interface TimelineEvent {
  id: string;
  title: string;
  year: number;
  type: 'war' | 'political' | 'cultural' | 'institutional';
}

export interface EmperorPeriod {
  name: string;       // 年号
  emperor: string;    // 皇帝名
  start: number;
  end: number;
}

// 地图相关类型
export interface PlaceCoord {
  id: string;          // 对应 GraphNode.id
  name: string;
  lat: number;
  lng: number;
  year_start?: number;
  year_end?: number;
}

export interface MapRoute {
  id: string;
  name: string;
  path: [number, number][];  // [lat, lng][]
  eventId?: string;
  year?: number;
}

export type ViewMode = 'graph' | 'map';
