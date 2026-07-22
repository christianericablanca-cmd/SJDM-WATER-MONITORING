"use client";

import { useEffect } from "react";

export function AutoResolveTrigger() {
  useEffect(() => {
    fetch("/api/maintenance/auto-resolve").catch(() => {});
  }, []);

  return null;
}
