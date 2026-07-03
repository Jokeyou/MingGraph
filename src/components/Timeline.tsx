'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useGraphStore } from '@/store';
import { EMPERORS } from '@/lib/labels';

export default function Timeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { timeRange, setTimeRange, setFilterEmperor } = useGraphStore();
  const totalStart = 1368, totalEnd = 1644;
  const totalYears = totalEnd - totalStart;

  // 根据时间范围匹配皇帝年号
  const getMatchingEmperors = useCallback((start: number, end: number) => {
    return EMPERORS.filter((ep) => ep.start <= end && ep.end >= start);
  }, []);

  // 时间范围变化时更新筛选
  useEffect(() => {
    const matched = getMatchingEmperors(timeRange[0], timeRange[1]);
    if (matched.length === 0) return;
    // 全选范围不筛选
    if (timeRange[0] <= 1368 && timeRange[1] >= 1644) {
      setFilterEmperor(null);
      return;
    }
    // 取匹配最多的年号
    if (matched.length <= 3) {
      setFilterEmperor(matched[0].name);
    }
  }, [timeRange, setFilterEmperor, getMatchingEmperors]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;

    // 背景
    ctx.fillStyle = '#0C1018';
    ctx.fillRect(0, 0, cw, ch);

    const topPad = 10;
    const barH = ch - 30;
    const barY = topPad + 8;

    // 皇帝分区
    EMPERORS.forEach((ep, i) => {
      const x1 = ((ep.start - totalStart) / totalYears) * cw;
      const x2 = ((ep.end - totalStart) / totalYears) * cw;
      const w = Math.max(x2 - x1, 2);

      // 冷暖色交替
      const colors = [
        '#FFE082', '#E6C870', '#CCB060', '#B39850',
        '#7D5F45', '#6E674A', '#606F50', '#517855',
        '#43805A', '#348860', '#2E8A62', '#348A5E',
        '#438A58', '#518A52', '#608A4C', '#6D8A48',
        '#7D8A42',
      ];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x1, barY, Math.max(w, 1), barH);

      // 年号标签（只标空间够的）
      if (w > 30) {
        ctx.fillStyle = '#F5F0E8';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(ep.name, x1 + w / 2, barY + barH / 2 + 4);
      }
    });

    // 当前时间范围高亮
    const rx1 = ((timeRange[0] - totalStart) / totalYears) * cw;
    const rx2 = ((timeRange[1] - totalStart) / totalYears) * cw;
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx1, barY - 2, rx2 - rx1, barH + 4);

    // 拖动把手
    [rx1, rx2].forEach((rx) => {
      ctx.fillStyle = '#D4A017';
      ctx.fillRect(rx - 4, barY - 4, 8, barH + 8);
    });

    // 年份标签
    ctx.fillStyle = '#C8B896';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${timeRange[0]}`, rx1, barY - 8);
    ctx.fillText(`${timeRange[1]}`, rx2, barY - 8);

    // 起始/结束年份
    ctx.fillStyle = '#8B7B6B';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('1368', 2, ch - 2);
    ctx.textAlign = 'right';
    ctx.fillText('1644', cw - 2, ch - 2);
  }, [timeRange]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 拖动处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width;
    const x = e.clientX - rect.left;

    const rx1 = ((timeRange[0] - totalStart) / totalYears) * cw;
    const rx2 = ((timeRange[1] - totalStart) / totalYears) * cw;

    // 判断拖哪个把手
    const dist1 = Math.abs(x - rx1);
    const dist2 = Math.abs(x - rx2);
    const handle = dist1 < dist2 ? 'left' : 'right';

    const onMove = (ev: MouseEvent) => {
      const mx = ev.clientX - rect.left;
      const year = Math.round((mx / cw) * totalYears + totalStart);
      const clamped = Math.max(totalStart, Math.min(totalEnd, year));

      if (handle === 'left') {
        setTimeRange([Math.min(clamped, timeRange[1] - 1), timeRange[1]]);
      } else {
        setTimeRange([timeRange[0], Math.max(clamped, timeRange[0] + 1)]);
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [timeRange, setTimeRange]);

  return (
    <div className="w-full bg-[#0C1018] border-t border-[#6080A0]/15 px-2 py-1">
      <canvas
        ref={canvasRef}
        className="w-full h-14 cursor-pointer"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
