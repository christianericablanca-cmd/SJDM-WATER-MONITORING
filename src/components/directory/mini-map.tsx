"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const icon = L.divIcon({
  className: "w-6 h-6",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" stroke="white" stroke-width="2" width="24" height="24"><circle cx="12" cy="12" r="10"/></svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

export default function MiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return (
    <div className="h-48 w-full rounded-md overflow-hidden border">
      <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>{name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
