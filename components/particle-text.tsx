"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface ParticleTextProps {
  text: string;
  className?: string;
  particleCount?: number;
  particleColor?: string;
  aggressiveness?: number;
}

export function ParticleText({
  text,
  className = "",
  particleCount = 80,
  particleColor = "#06b6d4",
  aggressiveness = 7,
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "absolute rounded-full pointer-events-none";

      const size = Math.random() * 3 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = particleColor;
      particle.style.opacity = (Math.random() * 0.7 + 0.3).toString();

      const x = Math.random() * container.offsetWidth;
      const y = Math.random() * container.offsetHeight;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;

      particle.style.boxShadow = `0 0 ${size * 3}px ${particleColor}`;

      container.appendChild(particle);
      particles.push(particle);
    }

    const animateParticles = () => {
      const time = Date.now() * 0.001;

      particles.forEach((particle, index) => {
        const t = time + index;
        const speed = aggressiveness * 0.2;

        const x =
          Math.sin(t * speed * 0.5) * 30 +
          Math.cos(t * speed * 0.3) * 50 +
          Math.sin(t * speed * 0.7) * 20;
        const y =
          Math.cos(t * speed * 0.4) * 25 +
          Math.sin(t * speed * 0.6) * 40 +
          Math.cos(t * speed * 0.8) * 15;

        particle.style.transform = `translate(${x}px, ${y}px)`;

        const opacity = Math.sin(t * speed * 3 + index) * 0.4 + 0.5;
        particle.style.opacity = opacity.toString();
      });

      requestAnimationFrame(animateParticles);
    };

    animateParticles();

    return () => {
      particles.forEach((particle) => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, [particleCount, particleColor, aggressiveness]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 font-display font-bold"
        style={{
          textShadow: `0 0 20px ${particleColor}60, 0 0 40px ${particleColor}40, 0 0 60px ${particleColor}20`,
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}
