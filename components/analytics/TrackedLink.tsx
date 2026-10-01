"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import {
  captureEvent,
  type ClientEvent,
  type EventProperties,
} from "@/lib/posthog-client";

type Props = {
  href: string;
  event: ClientEvent;
  properties?: EventProperties;
  className?: string;
  children: ReactNode;
};

export function TrackedLink({
  href,
  event,
  properties,
  className,
  children,
}: Props) {
  const handleClick = () => {
    captureEvent(event, properties);
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
