"use client";
import { RouteError } from "@/app/components/route-error";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <RouteError what="this genre" reset={reset} />;
}
