"use client";

import { motion } from "framer-motion";
import { type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ConspiracyButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export function ConspiracyButton({
  children,
  variant = "primary",
  size = "md",
  glow = false,
  className,
  disabled,
  onClick,
  type,
}: ConspiracyButtonProps) {
  const variants = {
    primary: "bg-[oklch(0.50_0.25_300)] hover:bg-[oklch(0.55_0.25_300)] text-white border border-[oklch(0.60_0.25_300)]",
    secondary: "bg-[oklch(0.65_0.20_200)] hover:bg-[oklch(0.70_0.20_200)] text-black border border-[oklch(0.75_0.20_200)]",
    ghost: "bg-transparent hover:bg-white/5 text-[oklch(0.65_0.20_200)] border border-[oklch(0.65_0.20_200)]/30 hover:border-[oklch(0.65_0.20_200)]/50",
    danger: "bg-[oklch(0.55_0.25_25)] hover:bg-[oklch(0.60_0.25_25)] text-white border border-[oklch(0.65_0.25_25)]",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const glowStyles = glow ? {
    boxShadow: variant === "primary"
      ? "0 0 20px oklch(0.70 0.30 300 / 0.3), 0 0 40px oklch(0.70 0.30 300 / 0.2)"
      : "0 0 20px oklch(0.80 0.25 200 / 0.3), 0 0 40px oklch(0.80 0.25 200 / 0.2)",
  } : {};

  return (
    <motion.button
      className={cn(
        "relative rounded-lg font-semibold font-display uppercase tracking-wide transition-all duration-300 overflow-hidden",
        variants[variant],
        sizes[size],
        className
      )}
      style={glowStyles}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {/* Subtle gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
