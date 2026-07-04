'use client';

import { useGraphStore } from '@/store';

export default function SearchBar() {
  const {
    searchQuery, setSearchQuery,
    filterEmperor, setFilterEmperor,
    filterType, setFilterType,
    zoomToNode, nodes,
    viewMode, setViewMode,
    showStarfield, showParticles, showRipple,
    toggleStarfield, toggleParticles, toggleRipple,
  } = useGraphStore();

  const EMPEROR_OPTIONS = [
    '洪武', '建文', '永乐', '洪熙', '宣德',
    '正统', '景泰', '天顺', '成化', '弘治',
    '正德', '嘉靖', '隆庆', '万历', '泰昌',
    '天启', '崇祯',
  ];

  const TYPE_OPTIONS = [
    { value: '', label: '全部类型' },
    { value: 'person', label: '人物' },
    { value: 'event', label: '事件' },
    { value: 'place', label: '地点' },
    { value: 'institution', label: '机构' },
  ];

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q && zoomToNode) {
      const node = nodes.find((n) => n.name.includes(q));
      if (node) zoomToNode(node.id);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {/* 搜索框 */}
      <div className="flex items-center bg-[#080C19]/90 backdrop-blur-md rounded-lg
        border border-[#6080A0]/25 px-3 py-2 shadow-lg">
        <svg className="w-4 h-4 text-[#8899BB] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索人物、事件…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent text-[#E8E4F0] placeholder-[#556688] outline-none
            text-sm w-44"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[#556688] hover:text-white ml-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* 筛选按钮 */}
      <div className="flex gap-2 flex-wrap">
        {/* 全景 */}
        <button
          onClick={() => useGraphStore.getState().fitToView?.()}
          className="bg-[#080C19]/90 backdrop-blur-md text-[#8899BB] text-xs
            border border-[#6080A0]/25 rounded-lg px-2 py-1.5 outline-none
            cursor-pointer hover:text-[#FFD740] hover:border-[#FFD740]/40 transition-colors"
          title="查看全景"
        >
          ⊞ 全景
        </button>
        {/* 类型筛选 */}
        <select
          value={filterType || ''}
          onChange={(e) => setFilterType(e.target.value || null)}
          className="bg-[#080C19]/90 backdrop-blur-md text-[#8899BB] text-xs
            border border-[#6080A0]/25 rounded-lg px-2 py-1.5 outline-none
            cursor-pointer"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* 皇帝筛选 */}
        <select
          value={filterEmperor || ''}
          onChange={(e) => setFilterEmperor(e.target.value || null)}
          className="bg-[#080C19]/90 backdrop-blur-md text-[#8899BB] text-xs
            border border-[#6080A0]/25 rounded-lg px-2 py-1.5 outline-none
            cursor-pointer max-w-[100px]"
        >
          <option value="">全部年号</option>
          {EMPEROR_OPTIONS.map((ep) => (
            <option key={ep} value={ep}>{ep}</option>
          ))}
        </select>

        {/* 清除筛选 */}
        {(filterType || filterEmperor) && (
          <button
            onClick={() => { setFilterType(null); setFilterEmperor(null); }}
            className="text-xs text-[#FFE082] hover:text-amber-200 px-2 py-1.5"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 视图切换 + 特效开关 */}
      <div className="flex gap-2 flex-wrap">
        {/* 视图切换 */}
        <div className="flex rounded-lg overflow-hidden border border-[#6080A0]/25">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-[#FFD740] text-[#080C14]'
                : 'bg-[#080C19]/80 text-[#8899BB] hover:bg-[#1A2030]'
            }`}
          >
            🌌 图谱
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-[#FFD740] text-[#080C14]'
                : 'bg-[#080C19]/80 text-[#8899BB] hover:bg-[#1A2030]'
            }`}
          >
            🗺️ 地图
          </button>
        </div>

        {/* 特效开关 */}
        <div className="flex rounded-lg overflow-hidden border border-[#6080A0]/25">
          <button
            onClick={toggleStarfield}
            title="星空背景"
            className={`px-2 py-1 text-xs transition-colors ${
              showStarfield
                ? 'bg-[#080C19]/80 text-[#FFE082] hover:bg-[#1A2030]'
                : 'bg-[#3a2020]/80 text-[#886666]'
            }`}
          >
            🌟
          </button>
          <button
            onClick={toggleParticles}
            title="连线粒子"
            className={`px-2 py-1 text-xs transition-colors border-l border-[#6080A0]/20 ${
              showParticles
                ? 'bg-[#080C19]/80 text-[#FFE082] hover:bg-[#1A2030]'
                : 'bg-[#3a2020]/80 text-[#886666]'
            }`}
          >
            ✨
          </button>
          <button
            onClick={toggleRipple}
            title="点击涟漪"
            className={`px-2 py-1 text-xs transition-colors border-l border-[#6080A0]/20 ${
              showRipple
                ? 'bg-[#080C19]/80 text-[#FFE082] hover:bg-[#1A2030]'
                : 'bg-[#3a2020]/80 text-[#886666]'
            }`}
          >
            🌊
          </button>
        </div>
      </div>
    </div>
  );
}
