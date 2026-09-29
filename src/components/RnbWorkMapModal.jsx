import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import * as esri from 'esri-leaflet';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import RnbLoader from './RnbLoader';
import {
  fetchWorkDataForMap,
  parseWorkMapGeometry,
} from '../services/mapWork';
import { BHARAT_MAPS_TOKEN, BHARAT_MAPS_URL } from '../config/api.config';
import './RnbWorkMapModal.css';

// Keep Leaflet CSS out of the login/shell entry — load with this chunk only.
import('leaflet/dist/leaflet.css');

/**
 * Leaflet + Bharat Maps / NIC — SoI-aligned (gov-safe vs OSM).
 * Loads only nearby admin features around the work coordinates.
 */
export const DEFAULT_BHARAT_MAPS_URL =
  'https://mapservice.gov.in/mapserviceserv176/rest/services/Panchayat/AdminGPHierarchy/MapServer';

const GUJARAT_STCODE = '24';

const GUJARAT_BOUNDS = L.latLngBounds(
  [20.05, 68.05],
  [24.75, 74.55],
);

/** Padding for district/block AOI (~8–12 km). */
const LOCAL_PAD_DEG = 0.1;
/** Tighter padding for villages/GPs (~4–5 km). */
const VILLAGE_PAD_DEG = 0.05;
/** Cap nearby villages so the map stays readable. */
const MAX_NEARBY_VILLAGES = 20;

const startIcon = L.divIcon({
  className: 'rnb-map-marker rnb-map-marker--start',
  html: '<span></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const endIcon = L.divIcon({
  className: 'rnb-map-marker rnb-map-marker--end',
  html: '<span></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const FEATURE_STYLES = {
  0: { color: '#075985', weight: 2.4, fillColor: '#0ea5e9', fillOpacity: 0.08 },
  1: { color: '#0369a1', weight: 1.8, fillColor: '#38bdf8', fillOpacity: 0.28 },
  2: { color: '#0c4a6e', weight: 1.2, fillColor: '#7dd3fc', fillOpacity: 0.22 },
  3: { color: '#334155', weight: 0.8, fillColor: '#bae6fd', fillOpacity: 0.16 },
};

function boundsFromRoad(roadData, padDeg) {
  const south =
    Math.min(roadData.StartLatitude, roadData.EndLatitude) - padDeg;
  const north =
    Math.max(roadData.StartLatitude, roadData.EndLatitude) + padDeg;
  const west =
    Math.min(roadData.StartLongitude, roadData.EndLongitude) - padDeg;
  const east =
    Math.max(roadData.StartLongitude, roadData.EndLongitude) + padDeg;
  return L.latLngBounds([south, west], [north, east]);
}

function workMidpoint(roadData) {
  return L.latLng(
    (roadData.StartLatitude + roadData.EndLatitude) / 2,
    (roadData.StartLongitude + roadData.EndLongitude) / 2,
  );
}

/** Keep only the N features whose centroids are closest to the work point. */
function nearestFeatures(featureCollection, center, maxN) {
  const features = featureCollection?.features || [];
  if (features.length <= maxN) return featureCollection;
  const ranked = features
    .map((feature) => {
      const layer = L.geoJSON(feature);
      const c = layer.getBounds().getCenter();
      return { feature, dist: center.distanceTo(c) };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxN)
    .map((row) => row.feature);
  return { type: 'FeatureCollection', features: ranked };
}

function featureLabel(props, layerName) {
  if (!props) return layerName;
  if (layerName === 'State') {
    return props.STNAME || props.stname || 'Gujarat';
  }
  if (layerName === 'District') {
    return props.dtname || props.DTNAME || props.D_Pan_Name || 'District';
  }
  if (layerName === 'Block') {
    return props.block_name || props.blkname || props.SDTNAME || props.B_Pan_Name || 'Block';
  }
  // Village / GP — prefer census village name
  return (
    props.VILNAME11 ||
    props.GPNAME ||
    props.SDTNAME ||
    props.DTNAME ||
    'Village'
  );
}

function labelClassFor(layerName) {
  if (layerName === 'State') return 'rnb-map-label rnb-map-label--state';
  if (layerName === 'District') return 'rnb-map-label rnb-map-label--district';
  if (layerName === 'Block') return 'rnb-map-label rnb-map-label--block';
  return 'rnb-map-label rnb-map-label--village';
}

function bindNameLabel(layer, label, layerName) {
  if (!label) return;
  layer.bindTooltip(label, {
    permanent: true,
    direction: 'center',
    className: labelClassFor(layerName),
    opacity: 0.95,
  });
  layer.bindPopup(
    `<div class="rnb-map-popup"><strong>${label}</strong><div class="rnb-map-popup-kind">${layerName}</div></div>`,
  );
}

function FitLocalBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds?.isValid()) return;
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
  }, [map, bounds]);
  return null;
}

function GujaratViewportLock() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(GUJARAT_BOUNDS.pad(0.02));
    map.options.maxBoundsViscosity = 0.8;
  }, [map]);
  return null;
}

function queryLayer({ baseUrl, layerId, token, where, bounds, onDone }) {
  const q = esri.query({ url: `${baseUrl}/${layerId}` });
  if (token) q.token(token);
  q.where(where).intersects(bounds).precision(5).run(onDone);
}

/**
 * Nearby State / District / Block / Village only, with permanent name labels.
 */
function LocalBharatMapsLayers({ serviceUrl, token, roadData, aoiBounds }) {
  const map = useMap();

  useEffect(() => {
    if (!serviceUrl || !roadData || !aoiBounds?.isValid()) return undefined;
    const baseUrl = serviceUrl.replace(/\/$/, '');
    const group = L.layerGroup().addTo(map);
    const mid = workMidpoint(roadData);
    const villageBounds = boundsFromRoad(roadData, VILLAGE_PAD_DEG);
    let cancelled = false;

    const addCollection = (featureCollection, layerId, layerName) => {
      if (cancelled || !featureCollection?.features?.length) return;
      L.geoJSON(featureCollection, {
        style: () => ({ ...FEATURE_STYLES[layerId] }),
        onEachFeature: (feature, layer) => {
          const label = featureLabel(feature.properties, layerName);
          bindNameLabel(layer, label, layerName);
        },
      }).addTo(group);
    };

    queryLayer({
      baseUrl,
      layerId: 0,
      token,
      where: `STCODE11='${GUJARAT_STCODE}'`,
      bounds: aoiBounds,
      onDone: (error, fc) => {
        if (cancelled || error) return;
        addCollection(fc, 0, 'State');
      },
    });

    queryLayer({
      baseUrl,
      layerId: 1,
      token,
      where: `stcode11='${GUJARAT_STCODE}'`,
      bounds: aoiBounds,
      onDone: (error, fc) => {
        if (cancelled || error) return;
        addCollection(fc, 1, 'District');
      },
    });

    queryLayer({
      baseUrl,
      layerId: 2,
      token,
      where: `stcode11='${GUJARAT_STCODE}'`,
      bounds: aoiBounds,
      onDone: (error, fc) => {
        if (cancelled || error) return;
        addCollection(fc, 2, 'Block');
      },
    });

    queryLayer({
      baseUrl,
      layerId: 3,
      token,
      where: `stcode11='${GUJARAT_STCODE}'`,
      bounds: villageBounds,
      onDone: (error, fc) => {
        if (cancelled || error) return;
        addCollection(nearestFeatures(fc, mid, MAX_NEARBY_VILLAGES), 3, 'Village');
      },
    });

    return () => {
      cancelled = true;
      map.removeLayer(group);
    };
  }, [map, serviceUrl, token, roadData, aoiBounds]);

  return null;
}

export default function RnbWorkMapModal({ open, workID, source, onClose }) {
  const [loading, setLoading] = useState(false);
  const [roadData, setRoadData] = useState(null);

  const serviceUrl = (BHARAT_MAPS_URL || DEFAULT_BHARAT_MAPS_URL).trim();
  const token = (BHARAT_MAPS_TOKEN || '').trim();

  useEffect(() => {
    if (!open || !workID) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setRoadData(null);
      try {
        const record = await fetchWorkDataForMap({ workId: workID, source });
        const parsed = parseWorkMapGeometry(record);
        if (!parsed) {
          toast.error('Map coordinates are invalid or missing');
          return;
        }
        if (!cancelled) setRoadData(parsed);
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

  const linePositions = useMemo(() => {
    if (!roadData) return null;
    return [
      [roadData.StartLatitude, roadData.StartLongitude],
      [roadData.EndLatitude, roadData.EndLongitude],
    ];
  }, [roadData]);

  const aoiBounds = useMemo(
    () => (roadData ? boundsFromRoad(roadData, LOCAL_PAD_DEG) : null),
    [roadData],
  );

  const mapCenter = useMemo(() => {
    if (!roadData) return GUJARAT_BOUNDS.getCenter();
    return [
      (roadData.StartLatitude + roadData.EndLatitude) / 2,
      (roadData.StartLongitude + roadData.EndLongitude) / 2,
    ];
  }, [roadData]);

  if (!open) return null;

  let body;
  if (loading) {
    body = <RnbLoader variant="inline" message="Loading map…" />;
  } else if (roadData && linePositions && aoiBounds) {
    body = (
      <MapContainer
        center={mapCenter}
        zoom={12}
        minZoom={8}
        maxZoom={16}
        maxBounds={GUJARAT_BOUNDS.pad(0.02)}
        maxBoundsViscosity={0.8}
        scrollWheelZoom
        className="rnb-work-map-leaflet"
      >
        <GujaratViewportLock />
        <FitLocalBounds bounds={aoiBounds} />
        <LocalBharatMapsLayers
          serviceUrl={serviceUrl}
          token={token || undefined}
          roadData={roadData}
          aoiBounds={aoiBounds}
        />
        <Polyline
          positions={linePositions}
          pathOptions={{ color: '#0284c7', weight: 4, opacity: 0.9 }}
        />
        <Marker
          position={[roadData.StartLatitude, roadData.StartLongitude]}
          icon={startIcon}
        >
          <Popup>
            <strong>Start Point</strong>
            <div>{roadData.Description || `Work ${roadData.WorkID}`}</div>
          </Popup>
        </Marker>
        <Marker
          position={[roadData.EndLatitude, roadData.EndLongitude]}
          icon={endIcon}
        >
          <Popup>
            <strong>End Point</strong>
            <div>{roadData.RoadCat || roadData.Description || 'Road segment'}</div>
          </Popup>
        </Marker>
      </MapContainer>
    );
  } else {
    body = (
      <p className="rnb-work-map-empty">
        Map cannot be displayed because required data is unavailable.
      </p>
    );
  }

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
        <div className="rnb-work-map-body">{body}</div>
        <footer className="rnb-work-map-footer">
          <button type="button" className="rnb-work-map-footer-close" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
