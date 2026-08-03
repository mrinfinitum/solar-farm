"use client";

import type { ComponentProps } from "react";

import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

type Props = ComponentProps<"a"> & {
  event: AnalyticsEvent;
  eventContext?: string;
};

export function TrackedLink({ event, eventContext, onClick, ...props }: Props) {
  return (
    <a
      {...props}
      onClick={(clickEvent) => {
        trackEvent(event, { context: eventContext, href: props.href });
        onClick?.(clickEvent);
      }}
    />
  );
}
