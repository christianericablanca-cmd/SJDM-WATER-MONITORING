"use client";

import dynamic from "next/dynamic";

const WaterMapInner = dynamic(() => import("./water-map").then((m) => m.WaterMap), { ssr: false });

interface WaterMapWrapperProps {
  reports: import("@/lib/types").WaterReport[];
  businesses: import("@/lib/types").Business[];
}

export function WaterMapWrapper({ reports, businesses }: WaterMapWrapperProps) {
  return <WaterMapInner reports={reports} businesses={businesses} />;
}
