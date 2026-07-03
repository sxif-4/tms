import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { LOCATION_TYPE_COLORS, LOCATION_TYPE_LABELS } from "../constants";
import type { LocationType, MapLocation } from "../types";

type Props = {
  locations: MapLocation[];
  center: [number, number];
  onMapClick: (lat: number, lng: number) => void;
  onMarkerDragEnd: (id: number, lat: number, lng: number) => void;
  onMarkerClick: (location: MapLocation) => void;
};

const iconCache = new Map<LocationType, L.DivIcon>();

/** A small coloured dot marker per location type (no image assets needed). */
function iconFor(type: LocationType): L.DivIcon {
  let icon = iconCache.get(type);
  if (!icon) {
    icon = L.divIcon({
      className: "location-pin",
      html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${LOCATION_TYPE_COLORS[type]};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    iconCache.set(type, icon);
  }
  return icon;
}

/** Fires the map-click handler with the clicked coordinates. */
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationsMap({
  locations,
  center,
  onMapClick,
  onMarkerDragEnd,
  onMarkerClick,
}: Props) {
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onMapClick} />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[Number(loc.latitude), Number(loc.longitude)]}
          icon={iconFor(loc.type)}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = (e.target as L.Marker).getLatLng();
              onMarkerDragEnd(loc.id, lat, lng);
            },
            click: () => onMarkerClick(loc),
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{loc.name}</strong>
              <br />
              {LOCATION_TYPE_LABELS[loc.type]}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
