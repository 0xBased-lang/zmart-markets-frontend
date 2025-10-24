"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConspiracyCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  glow?: boolean;
  borderBeam?: boolean;
  onClick?: () => void;
}

export function ConspiracyCard({
  children,
  className,
  animate = true,
  glow = false,
  borderBeam = false,
  onClick,
}: ConspiracyCardProps) {
  const Component = animate ? motion.div : "div";

  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    whileHover: { scale: 1.02, y: -4 },
    transition: { duration: 0.2 },
  } : {};

  const glowStyles = glow ? {
    boxShadow: "0 0 30px oklch(0.70 0.30 300 / 0.2), 0 0 60px oklch(0.80 0.25 200 / 0.1)",
  } : {};

  return (
    <Component
      className={cn(
        "group relative rounded-xl overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...(animationProps as any)}
    >
      {/* Border Beam Effect (optional) */}
      {borderBeam && (
        <div className="absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] pointer-events-none">
          <motion.div
            className="absolute w-20 aspect-square bg-gradient-to-l from-[oklch(0.50_0.25_300)] via-[oklch(0.65_0.20_200)] to-transparent"
            style={{
              offsetPath: "rect(0 auto auto 0 round 16px)",
            }}
            animate={{
              offsetDistance: ["0%", "100%"],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      )}

      {/* Card Background */}
      <div
        className="relative bg-[oklch(0.12_0.02_270)] border border-[oklch(1_0_0/0.08)] transition-all duration-300 group-hover:border-[oklch(1_0_0/0.15)]"
        style={glowStyles}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.50_0.25_300)]/5 via-transparent to-[oklch(0.65_0.20_200)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(oklch(1 0 0 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.03) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </Component>
  );
}
