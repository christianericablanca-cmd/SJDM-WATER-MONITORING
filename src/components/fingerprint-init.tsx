"use client";

import { useEffect } from "react";
import { initCanvasFingerprint } from "@/lib/client-fingerprint";

export function FingerprintInit() {
  useEffect(() => {
    initCanvasFingerprint();
  }, []);
  return null;
}
