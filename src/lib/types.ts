export type Barangay =
  | "Assumption"
  | "Bagong Buhay"
  | "Citrus"
  | "Ciudad Real"
  | "Dulong Bayan"
  | "Fatima"
  | "Francisco Homes-Guijo"
  | "Francisco Homes-Mulawin"
  | "Francisco Homes-Narra"
  | "Francisco Homes-Yakal"
  | "Gaya-gaya"
  | "Graceville"
  | "Gumaoc Central"
  | "Gumaoc East"
  | "Gumaoc West"
  | "Kaybanban"
  | "Kaypian"
  | "Lawang Pari"
  | "Maharlika"
  | "Minuyan"
  | "Minuyan II"
  | "Minuyan III"
  | "Minuyan IV"
  | "Minuyan V"
  | "Muzon"
  | "Muzon East"
  | "Muzon South"
  | "Muzon West"
  | "Paradise III"
  | "Poblacion"
  | "Poblacion I"
  | "St. Martin de Porres"
  | "Sapang Palay"
  | "Santo Cristo"
  | "San Isidro"
  | "San Manuel"
  | "San Martin"
  | "San Pedro"
  | "San Rafael"
  | "San Roque"
  | "Sta. Cruz"
  | "Sto. Niño"
  | "Sto. Niño II"
  | "Tungkong Mangga";

export type IssueType =
  | "no_water"
  | "low_pressure"
  | "dirty_water"
  | "water_leak"
  | "pipe_infrastructure"
  | "other";

export type ReportStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "denied"
  | "resolved"
  | "stale";

export type WaterProvider = "primewater" | "metro_pacific";

export interface WaterReport {
  id: string;
  barangay: Barangay;
  latitude: number;
  longitude: number;
  issue_type: IssueType;
  description: string | null;
  photo_url: string | null;
  street_sitio: string | null;
  status: ReportStatus;
  report_id_display: string;
  started_at: string;
  created_at: string;
  resolved_at: string | null;
  confirmation_count?: number;
  water_provider: WaterProvider;
  verified: boolean;
  denied: boolean;
}

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  address: string;
  barangay: Barangay;
  contact: string | null;
  facebook: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  disabled: boolean;
  last_verified: string | null;
  delivery_available: boolean | null;
  operating_hours: string | null;
  coverage_area: string | null;
  delivery_schedule: string | null;
  payment_options: string | null;
  estimated_fee: string | null;
  photo_url: string | null;
  created_at: string;
}

export type BusinessCategory =
  | "water_refilling"
  | "mineral_water_delivery"
  | "water_tanker"
  | "laundry_services";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  source: string;
  is_official: boolean;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  category: EmergencyCategory;
  phone: string | null;
  address: string | null;
  website: string | null;
  messenger: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export type EmergencyCategory =
  | "water_provider"
  | "government"
  | "emergency";
