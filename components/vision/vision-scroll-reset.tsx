"use client";

import { useLayoutEffect } from "react";

export function VisionScrollReset() {
  useLayoutEffect(() => {
    const reset = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    reset();

    const frame = window.requestAnimationFrame(reset);
    const settle = window.setTimeout(reset, 180);
    window.addEventListener("pageshow", reset);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("pageshow", reset);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  return null;
}
