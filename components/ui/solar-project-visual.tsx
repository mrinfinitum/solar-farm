"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

export function SolarProjectVisual() {
  const reduceMotion = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse" || !frame.current) return;
    const rect = frame.current.getBoundingClientRect();
    setTilt({
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -3,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 4,
    });
  }

  return (
    <motion.div
      ref={frame}
      className="project-visual"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      animate={reduceMotion ? undefined : { rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      aria-label="Illustration of the proposed solar array delivering energy to a commercial facility"
      role="img"
    >
      <div className="visual-grid" aria-hidden="true" />
      <div className="visual-topline">
        <span><i /> Project system</span>
        <code>NSO-IDB-01</code>
      </div>

      <div className="array-scene" aria-hidden="true">
        <div className="solar-field">
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} style={{ "--i": index } as React.CSSProperties} />
          ))}
        </div>
        <svg className="energy-route" viewBox="0 0 500 180" fill="none">
          <path d="M42 103C160 103 188 52 284 52s98 68 178 68" />
          {!reduceMotion && (
            <>
              <circle r="3"><animateMotion dur="2.8s" repeatCount="indefinite" path="M42 103C160 103 188 52 284 52s98 68 178 68" /></circle>
              <circle r="3"><animateMotion begin="-1.4s" dur="2.8s" repeatCount="indefinite" path="M42 103C160 103 188 52 284 52s98 68 178 68" /></circle>
            </>
          )}
        </svg>
        <div className="facility">
          <span className="facility-roof" />
          <span className="facility-body"><i /><i /><i /></span>
          <b>Commercial load</b>
        </div>
      </div>

      <div className="visual-metrics">
        <div className="visual-metric visual-metric--primary">
          <span>Est. annual output</span>
          <strong>2.25M <small>kWh</small></strong>
          <em>Year 1 estimate</em>
        </div>
        <div className="visual-metric">
          <span>Indicative PPA</span>
          <strong>$0.08075</strong>
          <em>vs. $0.0950 modeled baseline</em>
        </div>
        <div className="visual-status">
          <span><i /> Development active</span>
          <small>Interconnection pending</small>
        </div>
      </div>
    </motion.div>
  );
}
