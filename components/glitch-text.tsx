"use client";

import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: string;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlitchText({
  children,
  className,
  intensity = "medium",
}: GlitchTextProps) {
  const intensityClasses = {
    low: "animate-glitch-slow",
    medium: "animate-glitch",
    high: "animate-glitch-fast",
  };

  return (
    <span
      className={cn(
        "relative inline-block",
        intensityClasses[intensity],
        className
      )}
      data-text={children}
    >
      {/* Main text */}
      <span className="relative z-10">{children}</span>

      {/* Glitch layer 1 - Cyan */}
      <span
        className="absolute top-0 left-0 text-[oklch(0.65_0.20_200)] opacity-70 pointer-events-none"
        style={{
          clipPath: "inset(0 0 95% 0)",
          animation: "glitch-top 2s infinite",
        }}
        aria-hidden="true"
      >
        {children}
      </span>

      {/* Glitch layer 2 - Purple */}
      <span
        className="absolute top-0 left-0 text-[oklch(0.50_0.25_300)] opacity-70 pointer-events-none"
        style={{
          clipPath: "inset(95% 0 0 0)",
          animation: "glitch-bottom 2.5s infinite",
        }}
        aria-hidden="true"
      >
        {children}
      </span>
    </span>
  );
}
