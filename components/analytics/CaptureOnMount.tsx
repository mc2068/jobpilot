"use client";

import { useEffect } from "react";

import { captureEvent, type ClientEvent } from "@/lib/posthog-client";

type Props = {
  event: ClientEvent;
};

// Lets a Server Component report something it rendered (e.g. an error state)
// without becoming a Client Component itself.
export function CaptureOnMount({ event }: Props) {
  useEffect(() => {
    captureEvent(event);
  }, [event]);

  return null;
}
