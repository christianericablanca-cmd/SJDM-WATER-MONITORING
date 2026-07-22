import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateReportId(sequence: number): string {
  const padded = String(sequence).padStart(5, "0");
  return `SJDM-WATER-${padded}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeSince(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);

  if (diffHrs > 24) {
    const days = Math.floor(diffHrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (diffHrs > 0) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  return "Just now";
}

export function getConfidenceLevel(reports: number, confirmed: number): {
  level: string;
  color: string;
} {
  if (reports === 0) return { level: "No Data", color: "gray" };
  const ratio = confirmed / reports;
  if (ratio >= 0.7) return { level: "High", color: "green" };
  if (ratio >= 0.4) return { level: "Medium", color: "yellow" };
  return { level: "Low", color: "red" };
}

export function roundCoordinates(lat: number, lng: number, decimals = 3): { lat: number; lng: number } {
  const factor = Math.pow(10, decimals);
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
}
