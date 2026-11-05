"use client";
import { useEffect } from "react";
export function EmbedMarker() {
  useEffect(() => {
    document.documentElement.dataset.embed = "true";
    return () => {
      delete document.documentElement.dataset.embed;
    };
  }, []);
  return null;
}
