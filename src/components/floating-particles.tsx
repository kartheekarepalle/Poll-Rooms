"use client";

import { useEffect, useRef } from "react";

/**
 * Renders animated floating particles on the background.
 * Pure CSS animations — no canvas or heavy libraries.
 */
export function FloatingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];
    const colors = [
      "rgba(255, 255, 255, 0.6)",
      "rgba(255, 255, 255, 0.4)",
      "rgba(200, 200, 255, 0.5)",
      "rgba(255, 200, 255, 0.4)",
      "rgba(200, 255, 255, 0.3)",
    ];

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      const size = Math.random() * 6 + 2;
      const left = Math.random() * 100;
      const duration = Math.random() * 15 + 10;
      const delay = Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        background: ${color};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        box-shadow: 0 0 ${size * 2}px ${color};
      `;

      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return <div ref={containerRef} className="animated-bg" />;
}
