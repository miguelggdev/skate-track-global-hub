import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface MapLocation {
  name: string;
  lat: number;
  lng: number;
  country: string;
  medals?: number;
  year?: number;
}

interface CompetitionMapProps {
  locations?: MapLocation[];
  title?: string;
  description?: string;
  height?: number;
}

const DEFAULT_LOCATIONS: MapLocation[] = [
  { name: 'Campeonato Sudamericano', lat: 4.711, lng: -74.0721, country: 'Colombia', medals: 5, year: 2025 },
  { name: 'Copa Argentina', lat: -34.6037, lng: -58.3816, country: 'Argentina', medals: 3, year: 2025 },
  { name: 'Panamericanos', lat: -12.0464, lng: -77.0428, country: 'Peru', medals: 2, year: 2024 },
  { name: 'Mundial Speed', lat: 40.4168, lng: -3.7038, country: 'España', medals: 1, year: 2024 },
  { name: 'Copa Chile', lat: -33.4489, lng: -70.6693, country: 'Chile', medals: 4, year: 2025 },
];

export const CompetitionMap: React.FC<CompetitionMapProps> = ({
  locations = DEFAULT_LOCATIONS,
  title = 'Competencias Internacionales',
  description = 'Mapa de participaciones del club en el mundo',
  height = 360,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    let L: typeof import('leaflet');
    let map: ReturnType<typeof import('leaflet')['map']>;

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      L = await import('leaflet');

      // Fix default marker icon paths broken by webpack/vite
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([0, -60], 2);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(map);

      const orangeIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:linear-gradient(135deg,#f97316,#fb923c);
          border:2px solid rgba(249,115,22,0.5);
          box-shadow:0 0 12px rgba(249,115,22,0.5);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:11px;font-weight:700;
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      locations.forEach(loc => {
        const popup = `
          <div style="min-width:140px;font-family:Inter,sans-serif">
            <b style="color:#f97316">${loc.country}</b><br/>
            <span style="font-size:12px">${loc.name}</span><br/>
            ${loc.medals !== undefined ? `<span style="font-size:11px;color:#94a3b8">🏅 ${loc.medals} medallas</span>` : ''}
            ${loc.year ? `<span style="font-size:11px;color:#94a3b8"> · ${loc.year}</span>` : ''}
          </div>
        `;
        L.marker([loc.lat, loc.lng], { icon: orangeIcon })
          .addTo(map)
          .bindPopup(popup);
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <MapPin className="h-4 w-4 text-orange-500" />
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-b-xl z-0" />
      </CardContent>
    </Card>
  );
};
