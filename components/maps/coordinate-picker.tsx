"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

export function CoordinatePicker({ latitude, longitude, styleUrl }: { latitude: number | null; longitude: number | null; styleUrl?: string }) {
  const container = useRef<HTMLDivElement>(null); const [lat, setLat] = useState(latitude == null ? "" : String(latitude)); const [lon, setLon] = useState(longitude == null ? "" : String(longitude));
  useEffect(() => {
    if (!styleUrl || !container.current) return; let disposed = false; let map: { remove(): void } | undefined;
    (async () => {
      const maplibre = await import("maplibre-gl"); if (disposed || !container.current) return;
      const initial: [number, number] = longitude != null && latitude != null ? [longitude, latitude] : [-96.2, 35.5];
      const instance = new maplibre.Map({ container: container.current, style: styleUrl, center: initial, zoom: longitude != null ? 13 : 6 }); map = instance;
      const marker = new maplibre.Marker({ draggable: true }).setLngLat(initial).addTo(instance);
      const update = ({ lng, lat: nextLat }: { lng: number; lat: number }) => { setLon(lng.toFixed(7)); setLat(nextLat.toFixed(7)); marker.setLngLat([lng, nextLat]); };
      instance.on("click", (event) => update(event.lngLat)); marker.on("dragend", () => update(marker.getLngLat()));
    })(); return () => { disposed = true; map?.remove(); };
  }, [styleUrl, latitude, longitude]);
  return <div className="coordinate-picker"><div className="finder-form-grid"><label><span>Latitude</span><input className="finder-field" name="latitude" type="number" step="any" value={lat} onChange={(event) => setLat(event.target.value)}/></label><label><span>Longitude</span><input className="finder-field" name="longitude" type="number" step="any" value={lon} onChange={(event) => setLon(event.target.value)}/></label></div>{styleUrl ? <><div ref={container} className="coordinate-picker-map" aria-label="Map pin coordinate selector"/><small><MapPin size={12}/>Click the map or drag the pin, then save to confirm coordinates.</small></> : <small><MapPin size={12}/>Map pin selection requires NEXT_PUBLIC_MAP_STYLE_URL. Manual coordinates remain available.</small>}</div>;
}
