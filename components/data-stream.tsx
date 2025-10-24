"use client";
import { useEffect, useRef } from "react";

export function DataStream({ side = "left" }: { side?: "left" | "right" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chars =
      "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン$¥€£@#%";
    const streams: HTMLDivElement[] = [];

    for (let i = 0; i < 10; i++) {
      const stream = document.createElement("div");
      stream.className = "absolute font-mono text-xs opacity-20";
      stream.style[side] = `${i * 10 + 5}%`;
      stream.style.whiteSpace = "pre";

      container.appendChild(stream);
      streams.push(stream);
    }

    const animate = () => {
      streams.forEach((stream, i) => {
        let data = "";
        for (let j = 0; j < 20; j++) {
          data += chars[Math.floor(Math.random() * chars.length)] + "\n";
        }
        stream.textContent = data;

        const offset =
          (Date.now() * 0.05 + i * 100) %
          (container.offsetHeight || window.innerHeight);
        stream.style.top = `${offset}px`;

        if (Math.random() < 0.1) {
          stream.style.color = ["#9333ea", "#06b6d4", "#22c55e"][
            Math.floor(Math.random() * 3)
          ];
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      streams.forEach((s) => s.remove());
    };
  }, [side]);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 bottom-0 w-24 pointer-events-none z-0 overflow-hidden"
      style={{ [side]: 0 }}
    />
  );
}
