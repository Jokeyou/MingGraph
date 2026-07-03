'use client';

import { useEffect, useState } from 'react';
import { useGraphStore } from '@/store';
import type { StoryCard } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  betrayal: '背叛与清洗',
  loyalty: '忠臣与奸臣',
  rise_fall: '逆袭与陨落',
  mystery: '谜团与争议',
  political: '权谋博弈',
};

export default function StoryPanel() {
  const { stories, setStories, selectStory, selectedStory, zoomToNode, nodes } = useGraphStore();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/stories.json')
      .then((r) => r.json())
      .then((data) => setStories(data));
  }, [setStories]);

  const displayedStories = showAll ? stories : stories.slice(0, 5);

  const handleTagClick = (tag: string) => {
    const node = nodes.find((n) => n.name === tag);
    if (node) {
      useGraphStore.getState().selectNode(node);
      if (zoomToNode) zoomToNode(node.id);
    }
  };

  return (
    <div className="absolute bottom-1 left-4 right-4 z-10">
      {/* 横向滚动故事卡片 */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {displayedStories.map((story) => (
          <button
            key={story.id}
            onClick={() => selectStory(selectedStory?.id === story.id ? null : story)}
            className={`flex-shrink-0 w-64 text-left p-4 rounded-xl border transition-all
              ${selectedStory?.id === story.id
                ? 'bg-[#080C19]/95 border-[#FFD740] shadow-xl scale-105'
                : 'bg-[#080C19]/75 border-[#6080A0]/20 hover:border-[#6080A0]/50 hover:bg-[#080C19]/85'
              } backdrop-blur-md shadow-lg`}
          >
            {/* 年份 + 分类 */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#FFD740] font-mono">{story.year}</span>
              <span className="text-[10px] text-[#556688] uppercase tracking-wider">
                {CATEGORY_LABELS[story.category] || story.category}
              </span>
            </div>

            {/* 标题 */}
            <h3 className="text-sm font-bold text-[#E8E4F0] mb-2 leading-tight">
              {story.title}
            </h3>

            {/* 简述（展开时显示） */}
            {selectedStory?.id === story.id && (
              <div className="animate-in">
                <p className="text-xs text-[#8899BB] leading-relaxed mb-3">
                  {story.summary}
                </p>
                {/* 关联人物标签 */}
                <div className="flex flex-wrap gap-1">
                  {story.tags.map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => { e.stopPropagation(); handleTagClick(tag); }}
                      className="text-[10px] px-2 py-0.5 rounded-full
                        bg-[#FFE082]/15 text-[#E8E4F0] border border-[#FFE082]/30
                        hover:bg-[#FFE082]/25 cursor-pointer transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 收起时显示摘要片段 */}
            {selectedStory?.id !== story.id && (
              <p className="text-xs text-[#8899BB]/70 leading-relaxed line-clamp-2">
                {story.summary.slice(0, 80)}…
              </p>
            )}
          </button>
        ))}

        {/* 查看更多 */}
        {stories.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex-shrink-0 w-20 flex items-center justify-center
              bg-[#080C19]/50 border border-[#6080A0]/20 rounded-xl
              text-[#8899BB] text-xs hover:bg-[#080C19]/75 transition-colors"
          >
            {showAll ? '收起' : `+${stories.length - 5} 更多`}
          </button>
        )}
      </div>
    </div>
  );
}
