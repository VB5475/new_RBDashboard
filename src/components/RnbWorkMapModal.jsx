import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import RnbLoader from './RnbLoader';
import {
  fetchWorkDataForMap,
  parseWorkMapGeometry,
} from '../services/mapWork';
import 'leaflet/dist/leaflet.css';
import './RnbWorkMapModal.css';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds?.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    }
  }, [map, bounds]);
  return null;
}

export default function RnbWorkMapModal({ open, workID, source, onClose }) {
  const [loading, setLoading] = useState(false);
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    if (!open || !workID) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setGeometry(null);
      try {
        const record = await fetchWorkDataForMap({ workId: workID, source });
        const parsed = parseWorkMapGeometry(record);
        if (!parsed) {
          toast.error('Map coordinates are invalid or missing');
          return;
        }
        if (!cancelled) setGeometry(parsed);
      } catch (err) {
        toast.error(err?.message || 'Failed to load map data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, workID, source]);

  const bounds = useMemo(() => {
    if (!geometry) return null;
    return L.latLngBounds([geometry.start, geometry.end]);
  }, [geometry]);

  if (!open) return null;

  return (
    <div className="rnb-work-map-root">
      <button
        type="button"
        className="rnb-work-map-backdrop"
        onClick={onClose}
        aria-label="Close map"
      />
      <div className="rnb-work-map-dialog" role="dialog" aria-modal="true">
        <header className="rnb-work-map-header">
          <h2>Road map view</h2>
          <button type="button" className="rnb-work-map-close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="rnb-work-map-body">
          {loading ? (
            <RnbLoader variant="inline" message="Loading map…" />
          ) : geometry && bounds ? (
            <MapContainer
              center={bounds.getCenter()}
              zoom={10}
              scrollWheelZoom
              className="rnb-work-map-leaflet"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds bounds={bounds} />
              <Polyline
                positions={[geometry.start, geometry.end]}
                pathOptions={{ color: '#1976d2', weight: 4 }}
              />
              <Marker position={geometry.start} icon={markerIcon}>
                <Popup>Start — {geometry.description || `Work ${geometry.workId}`}</Popup>
              </Marker>
              <Marker position={geometry.end} icon={markerIcon}>
                <Popup>End — {geometry.roadCat || 'Road segment'}</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <p className="rnb-work-map-empty">
              Map cannot be displayed because required data is unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
