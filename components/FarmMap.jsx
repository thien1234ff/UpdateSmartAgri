"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function FarmMap({ farm }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([16.4637, 107.5909], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    if (farm && mapInstance.current) {
      const lat = farm.latitude;
      const lon = farm.longitude;

      if (lat && lon) {
        mapInstance.current.setView([lat, lon], 13);
        L.marker([lat, lon], { icon: customIcon })
          .addTo(mapInstance.current)
          .bindPopup(farm.name)
          .openPopup();
      }
    }
  }, [farm]);

  return <div id="map" ref={mapRef} style={{ height: "400px", width: "100%" }}></div>;
}