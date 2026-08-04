"use client";

import { useEffect } from "react";

export function VisionScrollReset() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}
