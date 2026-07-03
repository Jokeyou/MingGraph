'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGraphStore } from '@/store';
import SearchBar from '@/components/SearchBar';
import NodeDetail from '@/components/NodeDetail';
import StoryPanel from '@/components/StoryPanel';
import Timeline from '@/components/Timeline';
import Starfield from '@/components/Starfield';

// D3 依赖浏览器 API，禁用 SSR
const ForceGraph = dynamic(() => import('@/components/ForceGraph'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#080C14' }}>
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🏯</div>
        <p className="text-[#556688] text-lg">加载图谱中…</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const { setData, setStories, selectedNode, edges, nodes } = useGraphStore();
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  // 加载数据
  useEffect(() => {
    fetch('/data.json')
      .then((r) => r.json())
      .then((data) => {
        setData(data.nodes, data.edges);
        setLoading(false);
      });
  }, [setData]);

  // 3秒后自动关闭首屏
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setShowIntro(false), 3000);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // 统计
  const personCount = nodes.filter((n) => n.type === 'person').length;
  const connectionCount = edges.length;
  const topPeople = nodes
    .filter((n) => n.type === 'person')
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
    .map((n) => n.name);

  // 随机探索
  const randomExplore = useCallback(() => {
    const people = nodes.filter((n) => n.type === 'person');
    if (people.length > 0) {
      const random = people[Math.floor(Math.random() * people.length)];
      useGraphStore.getState().selectNode(random);
      setShowIntro(false);
    }
  }, [nodes]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#080C14' }}>
        <div className="text-center">
          <div className="text-6xl mb-6">🏯</div>
          <h1 className="text-2xl font-bold text-[#E8E4F0] mb-2">MingGraph</h1>
          <p className="text-[#556688]">正在加载明朝三百年…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col relative" style={{ background: '#080C14' }}>
      {/* 首屏引导 */}
      {showIntro && !selectedNode && (
        <div className="absolute inset-0 z-20 flex items-center justify-center
          bg-[#080C14]/80 backdrop-blur-sm animate-in">
          <div className="text-center p-8 max-w-lg">
            <div className="text-7xl mb-6">🏯</div>
            <h1 className="text-3xl font-bold text-[#FFD740] mb-3">MingGraph</h1>
            <p className="text-[#E8E4F0] text-lg mb-2 leading-relaxed">
              从朱元璋到崇祯，<strong>276年</strong>大明王朝
            </p>
            <p className="text-[#8899BB] text-sm mb-8 leading-relaxed">
              {personCount}+ 人物 · {connectionCount}+ 关联关系<br />
              拖一拖，点一点——<strong>历史比小说更好看。</strong>
            </p>

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => setShowIntro(false)}
                className="px-6 py-3 bg-[#FFE082] text-[#080C14] rounded-xl font-bold
                  hover:bg-[#FFD54F] transition-colors shadow-lg"
              >
                🎯 从人物开始
              </button>
              <button
                onClick={() => setShowIntro(false)}
                className="px-6 py-3 bg-[#3B7A9E] text-white rounded-xl font-bold
                  hover:bg-[#2D5F7A] transition-colors shadow-lg"
              >
                📖 从故事开始
              </button>
              <button
                onClick={randomExplore}
                className="px-6 py-3 bg-[#FFD740] text-[#080C14] rounded-xl font-bold
                  hover:bg-[#B8860B] transition-colors shadow-lg"
              >
                🎲 随机探索
              </button>
            </div>

            <p className="text-[#556688] text-xs mt-6">
              热门人物：{topPeople.join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* 图谱区域 */}
      <div className="flex-1 relative overflow-hidden">
        <Starfield />
        <ForceGraph />
        <SearchBar />
        <NodeDetail />
        <StoryPanel />

        {/* 图例 — 右上角，详情面板上方 */}
        <div className="absolute top-4 right-4 w-64 flex gap-3 text-xs
          bg-[#080C19]/80 backdrop-blur-md rounded-lg px-3 py-2 z-20
          border border-[#C8B896]/30 shadow-lg">
          <span className="text-[#FFD740]">● 人物</span>
          <span className="text-[#FFD740]">◆ 事件</span>
          <span className="text-[#FFD740]">■ 地点</span>
          <span className="text-[#FFD740]">▲ 机构</span>
        </div>
      </div>

      {/* 时间线 */}
      <div className="h-16 flex-shrink-0">
        <Timeline />
      </div>
    </div>
  );
}
