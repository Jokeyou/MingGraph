'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number; y: number; r: number;
  opacity: number; speed: number; phase: number;
  color: string;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      const w = canvas.width, h = canvas.height;
      const count = Math.floor((w * h) / 1800); // ~400 stars on 1200x700
      const colors = ['#FFFFFF', '#FFE8C0', '#C0D8FF', '#FFD740', '#C0FFE0'];
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.008 + 0.002,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of starsRef.current) {
        // 闪烁
        const twinkle = Math.sin(frame * star.speed + star.phase);
        const alpha = star.opacity + twinkle * 0.3;
        const clamped = Math.max(0.05, Math.min(1, alpha));

        // 绘制星光（带光晕）
        ctx.save();
        ctx.globalAlpha = clamped;
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.r * 4;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();

        // 十字光芒（大星星）
        if (star.r > 1.2) {
          ctx.shadowBlur = star.r * 2;
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.3;
          ctx.beginPath();
          ctx.moveTo(star.x - star.r * 3, star.y);
          ctx.lineTo(star.x + star.r * 3, star.y);
          ctx.moveTo(star.x, star.y - star.r * 3);
          ctx.lineTo(star.x, star.y + star.r * 3);
          ctx.stroke();
        }
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
