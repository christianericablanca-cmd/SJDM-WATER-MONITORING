"use client";

const STORAGE_KEY = "ww_cf"; // canvas fingerprint

function hashString(raw: string): string {
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";

    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(100, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.font = "11pt Arial";
    ctx.fillText("WaterWatch SJDM", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.font = "18pt Arial";
    ctx.fillText("canvas", 4, 45);

    const data = canvas.toDataURL();
    return hashString(data);
  } catch {
    return "error";
  }
}

export function initCanvasFingerprint(): void {
  if (typeof document === "undefined") return;
  try {
    // Only compute once per session (already in cookie)
    if (document.cookie.includes(`${STORAGE_KEY}=`)) return;
    const fp = getCanvasFingerprint();
    document.cookie = `${STORAGE_KEY}=${fp};path=/;max-age=86400;samesite=lax`;
  } catch {
    // silently ignore
  }
}
