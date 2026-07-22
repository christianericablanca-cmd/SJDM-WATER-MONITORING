import type { Barangay, IssueType, BusinessCategory, EmergencyCategory, WaterProvider } from "./types";

export const BARANGAYS: Barangay[] = [
  "Bagong Buhay", "Bagong Pag-Asa", "Bagong Silang", "Bagong Yaman",
  "Buenavista", "City Proper", "Dulong Bayan", "Fatima", "Graceville",
  "Gumaoc Central", "Gumaoc East", "Gumaoc West", "Kaypian", "Lawang Pari",
  "Mabolo", "Maharlika", "Minuyan", "Minuyan II", "Minuyan III",
  "Minuyan IV", "Minuyan V", "Muzon", "Muzon East", "Muzon West",
  "Poblacion", "Sapang Palay", "Santo Cristo", "San Isidro", "San Manuel",
  "San Martin", "San Pedro", "San Rafael", "San Roque", "Sta. Cruz",
  "Sta. Monica", "Sta. Rita", "Sto. Niño", "Sto. Niño II",
  "Tungkong Mangga", "Tumana",
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
  community_confirmed: "Community Confirmed",
  resolved: "Resolved",
  stale: "Inactive",
};

export const WATER_PROVIDER_LABELS: Record<WaterProvider, string> = {
  primewater: "PrimeWater",
  metro_pacific: "Metro Pacific Water",
};

export const STATUS_DOTS: Record<string, string> = {
  submitted: "🟡",
  under_review: "🔵",
  approved: "🟢",
  denied: "🔴",
  community_confirmed: "🟠",
  resolved: "🟢",
  stale: "⚪",
};

export const WATER_PROVIDERS: { value: WaterProvider; label: string; description: string }[] = [
  { value: "primewater", label: "PrimeWater", description: "PrimeWater Infrastructure Corp." },
  { value: "metro_pacific", label: "Metro Pacific Water", description: "Metro Pacific Bulacan Water" },
];

export const BUSINESS_CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: "water_refilling", label: "Water Refilling Stations" },
  { value: "mineral_water_delivery", label: "Mineral Water Delivery" },
  { value: "water_tanker", label: "Private Water Tanker Services" },
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
  "Bagong Buhay":       { lat: 14.8138, lng: 121.0453 },
  "Bagong Pag-Asa":     { lat: 14.8200, lng: 121.0500 },
  "Bagong Silang":      { lat: 14.8050, lng: 121.0380 },
  "Bagong Yaman":       { lat: 14.8250, lng: 121.0550 },
  "Buenavista":         { lat: 14.8180, lng: 121.0480 },
  "City Proper":        { lat: 14.8136, lng: 121.0453 },
  "Dulong Bayan":       { lat: 14.8080, lng: 121.0420 },
  "Fatima":             { lat: 14.8300, lng: 121.0600 },
  "Graceville":         { lat: 14.8000, lng: 121.0350 },
  "Gumaoc Central":     { lat: 14.8100, lng: 121.0300 },
  "Gumaoc East":        { lat: 14.8080, lng: 121.0350 },
  "Gumaoc West":        { lat: 14.8100, lng: 121.0250 },
  "Kaypian":            { lat: 14.7950, lng: 121.0380 },
  "Lawang Pari":        { lat: 14.8200, lng: 121.0420 },
  "Mabolo":             { lat: 14.8350, lng: 121.0580 },
  "Maharlika":          { lat: 14.8150, lng: 121.0400 },
  "Minuyan":            { lat: 14.7900, lng: 121.0550 },
  "Minuyan II":         { lat: 14.7880, lng: 121.0580 },
  "Minuyan III":        { lat: 14.7850, lng: 121.0600 },
  "Minuyan IV":         { lat: 14.7920, lng: 121.0520 },
  "Minuyan V":          { lat: 14.7950, lng: 121.0580 },
  "Muzon":              { lat: 14.8000, lng: 121.0480 },
  "Muzon East":         { lat: 14.8020, lng: 121.0520 },
  "Muzon West":         { lat: 14.7980, lng: 121.0440 },
  "Poblacion":          { lat: 14.8136, lng: 121.0453 },
  "Sapang Palay":       { lat: 14.7700, lng: 121.0450 },
  "Santo Cristo":       { lat: 14.8080, lng: 121.0380 },
  "San Isidro":         { lat: 14.8250, lng: 121.0480 },
  "San Manuel":         { lat: 14.7900, lng: 121.0420 },
  "San Martin":         { lat: 14.8180, lng: 121.0550 },
  "San Pedro":          { lat: 14.8350, lng: 121.0450 },
  "San Rafael":         { lat: 14.8050, lng: 121.0500 },
  "San Roque":          { lat: 14.8220, lng: 121.0580 },
  "Sta. Cruz":          { lat: 14.8100, lng: 121.0420 },
  "Sta. Monica":        { lat: 14.8300, lng: 121.0500 },
  "Sta. Rita":          { lat: 14.8150, lng: 121.0520 },
  "Sto. Niño":          { lat: 14.8280, lng: 121.0550 },
  "Sto. Niño II":       { lat: 14.8300, lng: 121.0580 },
  "Tungkong Mangga":    { lat: 14.7850, lng: 121.0350 },
  "Tumana":             { lat: 14.8400, lng: 121.0650 },
};
