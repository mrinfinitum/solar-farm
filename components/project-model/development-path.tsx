"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import type { ProjectModelPhase } from "@/lib/project-model-data";

export function DevelopmentPath({ phases }: { phases: readonly ProjectModelPhase[] }) {
  const reduceMotion = useReducedMotion();
  const [autoPhase, setAutoPhase] = useState(1);
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null);
  const activePhase = hoveredPhase ?? autoPhase;

  useEffect(() => {
    if (reduceMotion || hoveredPhase !== null || phases.length < 2) return;

    const interval = window.setInterval(() => {
      setAutoPhase((current) => (current + 1) % phases.length);
    }, 2400);

    return () => window.clearInterval(interval);
  }, [hoveredPhase, phases.length, reduceMotion]);

  return (
    <motion.div
      className="pm-card pm-path-card"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pm-card-header pm-path-header">
        <div><p>Representative sequence</p><h3>Typical development path</h3></div>
        <span>6 phases</span>
      </div>
      <div className="pm-path-list">
        <motion.i
          className="pm-path-line"
          initial={reduceMotion ? false : { scaleY: 0 }}
          whileInView={reduceMotion ? undefined : { scaleY: 1 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />
        {phases.map((phase, index) => (
          <div
            aria-label={`${phase.number}. ${phase.title}: ${phase.description}`}
            className={index === activePhase ? "pm-phase pm-phase--active" : "pm-phase"}
            key={phase.number}
            onBlur={() => setHoveredPhase(null)}
            onFocus={() => setHoveredPhase(index)}
            onMouseEnter={() => setHoveredPhase(index)}
            onMouseLeave={() => setHoveredPhase(null)}
            tabIndex={0}
          >
            <span className="pm-phase-node">{phase.number}</span>
            <div>
              <div className="pm-phase-topline"><strong>{phase.title}</strong><span>{phase.status}</span></div>
              <p>{phase.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
