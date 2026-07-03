'use client';

import { useGraphStore } from '@/store';
import { NODE_TYPE_LABELS, RELATION_LABELS } from '@/lib/labels';

export default function NodeDetail() {
  const { selectedNode, edges, nodes, selectNode } = useGraphStore();
  if (!selectedNode) return null;

  // 找到所有关联
  const relatedEdges = edges.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id
  );
  const relatedNodeIds = new Set(
    relatedEdges.map((e) => (e.source === selectedNode.id ? e.target : e.source))
  );
  const relatedNodes = nodes.filter((n) => relatedNodeIds.has(n.id));

  return (
    <div className="absolute top-14 right-4 w-64 max-h-[55vh] overflow-y-auto
      bg-[#080C19]/95 backdrop-blur-md rounded-xl shadow-2xl border border-[#6080A0]/25
      text-[#E8E4F0] p-5 z-10 animate-in slide-in-from-right">
      {/* 关闭按钮 */}
      <button
        onClick={() => selectNode(null)}
        className="absolute top-3 right-3 text-[#6688AA] hover:text-white text-lg"
      >
        ✕
      </button>

      {/* 标题 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: getColor(selectedNode.type) }}
          />
          <span className="text-xs text-[#8899BB] uppercase tracking-wider">
            {NODE_TYPE_LABELS[selectedNode.type] || selectedNode.type}
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#FFD740]">{selectedNode.name}</h2>
      </div>

      {/* 重要性 */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < selectedNode.importance ? 'text-[#FFD740]' : 'text-[#334466]'}>
            ★
          </span>
        ))}
      </div>

      {/* 关联关系 */}
      {relatedEdges.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#8899BB] mb-2">
            关联关系 ({relatedEdges.length})
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {relatedEdges.slice(0, 20).map((e, i) => {
              const otherName = e.source === selectedNode.id ? e.target : e.source;
              return (
                <button
                  key={i}
                  onClick={() => {
                    const node = nodes.find((n) => n.id === otherName);
                    if (node) selectNode(node);
                  }}
                  className="block w-full text-left text-sm px-2 py-1 rounded
                    hover:bg-[#6080A0]/20 transition-colors"
                >
                  <span className="text-[#E8E4F0]">{otherName}</span>
                  <span className="text-[#8899BB] ml-2 text-xs">
                    {RELATION_LABELS[e.relation] || e.relation}
                  </span>
                </button>
              );
            })}
            {relatedEdges.length > 20 && (
              <p className="text-xs text-[#556688]">
                …还有 {relatedEdges.length - 20} 条关联
              </p>
            )}
          </div>
        </div>
      )}

      {/* 相关人物 */}
      {relatedNodes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#8899BB] mb-2">
            相关 ({relatedNodes.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {relatedNodes.slice(0, 15).map((n) => (
              <button
                key={n.id}
                onClick={() => selectNode(n)}
                className="text-xs px-2 py-1 rounded-full border border-[#6080A0]/30
                  text-[#E8E4F0] hover:bg-[#6080A0]/30 transition-colors"
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getColor(type: string): string {
  const colors: Record<string, string> = {
    person: '#FFE082',
    event: '#FFD740',
    place: '#40C4FF',
    institution: '#69F0AE',
  };
  return colors[type] || '#8899BB';
}
