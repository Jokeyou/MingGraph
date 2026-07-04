// Zustand 全局状态管理

import { create } from 'zustand';
import type { GraphNode, GraphEdge, StoryCard, ViewMode } from '@/types';

interface GraphState {
  // 数据
  nodes: GraphNode[];
  edges: GraphEdge[];
  stories: StoryCard[];

  // 选中状态
  selectedNode: GraphNode | null;
  selectedStory: StoryCard | null;
  hoveredNode: string | null;

  // 视图状态
  viewMode: ViewMode;
  focusedNodeId: string | null;     // 双击聚焦
  searchQuery: string;
  filterEmperor: string | null;      // 按皇帝年号筛选
  filterType: string | null;         // 按节点类型筛选
  timeRange: [number, number];       // 时间线范围

  // 性能开关
  showStarfield: boolean;
  showParticles: boolean;
  showRipple: boolean;
  toggleStarfield: () => void;
  toggleParticles: () => void;
  toggleRipple: () => void;

  // 图谱引用（用于外部控制）
  zoomToNode: ((id: string) => void) | null;
  setZoomToNode: (fn: ((id: string) => void) | null) => void;
  fitToView: (() => void) | null;
  setFitToView: (fn: (() => void) | null) => void;

  // Actions
  setData: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  setStories: (stories: StoryCard[]) => void;
  selectNode: (node: GraphNode | null) => void;
  selectStory: (story: StoryCard | null) => void;
  setHoveredNode: (id: string | null) => void;
  focusNode: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setFilterEmperor: (e: string | null) => void;
  setFilterType: (t: string | null) => void;
  setTimeRange: (range: [number, number]) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  stories: [],
  selectedNode: null,
  selectedStory: null,
  hoveredNode: null,
  focusedNodeId: null,
  searchQuery: '',
  filterEmperor: null,
  filterType: null,
  timeRange: [1368, 1644],
  viewMode: 'map',
  showStarfield: false,
  showParticles: false,
  showRipple: false,
  toggleStarfield: () => set((s) => ({ showStarfield: !s.showStarfield })),
  toggleParticles: () => set((s) => ({ showParticles: !s.showParticles })),
  toggleRipple: () => set((s) => ({ showRipple: !s.showRipple })),
  zoomToNode: null,
  setZoomToNode: (fn) => set({ zoomToNode: fn }),
  fitToView: null,
  setFitToView: (fn) => set({ fitToView: fn }),

  setData: (nodes, edges) => set({ nodes, edges }),
  setStories: (stories) => set({ stories }),
  selectNode: (node) => set({ selectedNode: node, selectedStory: null }),
  selectStory: (story) => set({ selectedStory: story, selectedNode: null }),
  setHoveredNode: (id) => set({ hoveredNode: id }),
  focusNode: (id) => set({ focusedNodeId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterEmperor: (e) => set({ filterEmperor: e }),
  setFilterType: (t) => set({ filterType: t }),
  setTimeRange: (range) => set({ timeRange: range }),
  setViewMode: (mode) => set({ viewMode: mode, selectedNode: null, selectedStory: null }),
}));
