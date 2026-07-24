import type { Barangay, IssueType, BusinessCategory, EmergencyCategory, WaterProvider } from "./types";

export const BARANGAYS: Barangay[] = [
  "Assumption", "Bagong Buhay", "Citrus", "Ciudad Real", "Dulong Bayan",
  "Fatima", "Francisco Homes-Guijo", "Francisco Homes-Mulawin",
  "Francisco Homes-Narra", "Francisco Homes-Yakal", "Gaya-gaya",
  "Graceville", "Gumaoc Central", "Gumaoc East", "Gumaoc West",
  "Kaybanban", "Kaypian", "Lawang Pari", "Maharlika", "Minuyan",
  "Minuyan II", "Minuyan III", "Minuyan IV", "Minuyan V", "Muzon",
  "Muzon East", "Muzon South", "Muzon West", "Paradise III", "Poblacion",
  "Poblacion I", "St. Martin de Porres", "Sapang Palay", "Santo Cristo",
  "San Isidro", "San Manuel", "San Martin", "San Pedro", "San Rafael",
  "San Roque", "Sta. Cruz", "Sto. Niño", "Sto. Niño II",
  "Tungkong Mangga",
];

export const ISSUE_TYPES: { value: IssueType; label: string; emoji: string }[] = [
  { value: "no_water", label: "No Water Supply", emoji: "🚰" },
  { value: "low_pressure", label: "Low Water Pressure", emoji: "🚿" },
  { value: "dirty_water", label: "Dirty/Brown Water", emoji: "🟤" },
  { value: "water_leak", label: "Water Leak", emoji: "💧" },
  { value: "pipe_infrastructure", label: "Pipe/Infrastructure Issue", emoji: "🔧" },
  { value: "other", label: "Other", emoji: "📋" },
];

export const ISSUE_EMOJI: Record<IssueType, string> = {
  no_water: "🔴",
  low_pressure: "🟠",
  dirty_water: "🟤",
  water_leak: "💧",
  pipe_infrastructure: "🔧",
  other: "📋",
};

export const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
  resolved: "Resolved",
  stale: "Inactive",
};

export const WATER_PROVIDER_LABELS: Record<WaterProvider, string> = {
  primewater: "PrimeWater",
  metro_pacific: "Metro Pacific Water",
};

export const STATUS_DOTS: Record<string, string> = {
  submitted: "🟡",
  under_review: "🟡",
  approved: "🟢",
  denied: "🔴",
  resolved: "🟢",
  stale: "⚪",
};

export const WATER_PROVIDERS: { value: WaterProvider; label: string; description: string }[] = [
  { value: "primewater", label: "PrimeWater", description: "PrimeWater Infrastructure Corp." },
  { value: "metro_pacific", label: "Metro Pacific Water", description: "Metro Pacific Bulacan Water" },
];

export const PROVIDER_CODE: Record<WaterProvider, string> = {
  primewater: "PRIME",
  metro_pacific: "MPBW",
};

export const BUSINESS_CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: "water_refilling", label: "Water Refilling & Delivery" },
  { value: "water_tanker", label: "Private Water Tanker Services" },
  { value: "water_storage", label: "Water Storages" },
  { value: "laundry_services", label: "Laundry Services" },
];

export const EMERGENCY_CATEGORIES: { value: EmergencyCategory; label: string }[] = [
  { value: "water_provider", label: "Water Provider" },
  { value: "government", label: "Government" },
  { value: "emergency", label: "Emergency Services" },
];

export const SJDM_CENTER = { lat: 14.8136, lng: 121.0453 } as const;

export const BOUNDARIES_SJDM = {
  south: 14.72,
  west: 120.93,
  north: 14.90,
  east: 121.15,
} as const;

/** Approximate center coordinates for each SJDM barangay.
 *  Used as a fallback when GPS is unavailable. */
export const BARANGAY_COORDS: Record<Barangay, { lat: number; lng: number }> = {
  "Assumption":         { lat: 14.8654, lng: 121.0633 },
  "Bagong Buhay":       { lat: 14.8531, lng: 121.0583 },
  "Citrus":             { lat: 14.8509, lng: 121.0666 },
  "Ciudad Real":        { lat: 14.7928, lng: 121.1217 },
  "Dulong Bayan":       { lat: 14.8322, lng: 121.0374 },
  "Fatima":             { lat: 14.8468, lng: 121.0450 },
  "Francisco Homes-Guijo":   { lat: 14.8117, lng: 121.0635 },
  "Francisco Homes-Mulawin": { lat: 14.8067, lng: 121.0624 },
  "Francisco Homes-Narra":   { lat: 14.8089, lng: 121.0581 },
  "Francisco Homes-Yakal":   { lat: 14.8080, lng: 121.0551 },
  "Gaya-gaya":          { lat: 14.7960, lng: 121.0513 },
  "Graceville":         { lat: 14.7897, lng: 121.0643 },
  "Gumaoc Central":     { lat: 14.7990, lng: 121.0645 },
  "Gumaoc East":        { lat: 14.7988, lng: 121.0673 },
  "Gumaoc West":        { lat: 14.8006, lng: 121.0593 },
  "Kaybanban":          { lat: 14.8253, lng: 121.0944 },
  "Kaypian":            { lat: 14.8222, lng: 121.0590 },
  "Lawang Pari":        { lat: 14.8564, lng: 121.0697 },
  "Maharlika":          { lat: 14.7928, lng: 121.0713 },
  "Minuyan":            { lat: 14.8510, lng: 121.0778 },
  "Minuyan II":         { lat: 14.8471, lng: 121.0732 },
  "Minuyan III":        { lat: 14.8489, lng: 121.0734 },
  "Minuyan IV":         { lat: 14.8473, lng: 121.0752 },
  "Minuyan V":          { lat: 14.8487, lng: 121.0743 },
  "Muzon":              { lat: 14.7995, lng: 121.0318 },
  "Muzon East":         { lat: 14.8127, lng: 121.0337 },
  "Muzon South":        { lat: 14.7913, lng: 121.0327 },
  "Muzon West":         { lat: 14.8083, lng: 121.0244 },
  "Paradise III":       { lat: 14.8361, lng: 121.1096 },
  "Poblacion":          { lat: 14.8175, lng: 121.0408 },
  "Poblacion I":        { lat: 14.8075, lng: 121.0467 },
  "St. Martin de Porres": { lat: 14.8593, lng: 121.0668 },
  "Sapang Palay":       { lat: 14.8443, lng: 121.0421 },
  "Santo Cristo":       { lat: 14.8209, lng: 121.0775 },
  "San Isidro":         { lat: 14.8247, lng: 121.1479 },
  "San Manuel":         { lat: 14.7801, lng: 121.0718 },
  "San Martin":         { lat: 14.8609, lng: 121.0575 },
  "San Pedro":          { lat: 14.8494, lng: 121.0553 },
  "San Rafael":         { lat: 14.8483, lng: 121.0457 },
  "San Roque":          { lat: 14.8260, lng: 121.1046 },
  "Sta. Cruz":          { lat: 14.8518, lng: 121.0514 },
  "Sto. Niño":          { lat: 14.8599, lng: 121.0644 },
  "Sto. Niño II":       { lat: 14.8618, lng: 121.0681 },
  "Tungkong Mangga":    { lat: 14.7973, lng: 121.0975 },
};
