'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface Job {
  id: string;
  title: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  startingBid: number;
  category: string;
}

interface JobSearchMapProps {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
  center?: [number, number];
  zoom?: number;
}

// Simple zip code to coordinates lookup for demo (covers major areas)
const zipToCoords: { [key: string]: [number, number] } = {
  '31601': [30.8327, -83.2785], // Valdosta, GA
  '31602': [30.8671, -83.2790],
  '31605': [30.8910, -83.3190],
  '30301': [33.7490, -84.3880], // Atlanta, GA
  '30302': [33.7550, -84.3900],
  '32801': [28.5383, -81.3792], // Orlando, FL
  '33101': [25.7617, -80.1918], // Miami, FL
  '10001': [40.7484, -73.9967], // New York, NY
  '90001': [33.9425, -118.2551], // Los Angeles, CA
  '60601': [41.8819, -87.6278], // Chicago, IL
  '77001': [29.7604, -95.3698], // Houston, TX
  '85001': [33.4484, -112.0740], // Phoenix, AZ
};

// Get coordinates from zip code or city/state
const getJobCoordinates = (job: Job): [number, number] | null => {
  // If job already has coordinates, use them
  if (job.latitude && job.longitude) {
    return [job.latitude, job.longitude];
  }
  
  // Try to look up by zip code
  if (job.zipCode && zipToCoords[job.zipCode]) {
    return zipToCoords[job.zipCode];
  }
  
  // Try partial zip match (first 3 digits)
  if (job.zipCode) {
    const prefix = job.zipCode.substring(0, 3);
    for (const [zip, coords] of Object.entries(zipToCoords)) {
      if (zip.startsWith(prefix)) {
        return coords;
      }
    }
  }
  
  // Fallback based on state
  const stateCoords: { [key: string]: [number, number] } = {
    'GA': [32.1656, -82.9001],
    'FL': [27.6648, -81.5158],
    'NY': [42.1657, -74.9481],
    'CA': [36.7783, -119.4179],
    'TX': [31.9686, -99.9018],
    'IL': [40.6331, -89.3985],
    'AZ': [34.0489, -111.0937],
  };
  
  if (job.state && stateCoords[job.state]) {
    return stateCoords[job.state];
  }
  
  return null;
};

export default function JobSearchMap({ jobs, onJobClick, center = [39.8283, -98.5795], zoom = 4 }: JobSearchMapProps) {
  const [mounted, setMounted] = useState(false);
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((L) => {
      setCustomIcon(
        new L.Icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );
    });
  }, []);

  // Process jobs to add coordinates
  const jobsWithCoords = jobs
    .map(job => {
      const coords = getJobCoordinates(job);
      if (coords) {
        return { ...job, latitude: coords[0], longitude: coords[1] };
      }
      return null;
    })
    .filter(Boolean) as Job[];

  // Add small random offset so pins don't stack exactly
  const addJitter = (coord: number) => coord + (Math.random() - 0.5) * 0.02;

  if (!mounted) {
    return (
      <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '500px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {customIcon && jobsWithCoords.map((job) => (
          <Marker
            key={job.id}
            position={[addJitter(job.latitude!), addJitter(job.longitude!)]}
            icon={customIcon}
            eventHandlers={{
              click: () => onJobClick?.(job),
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-semibold text-gray-800">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.city}, {job.state}</p>
                <p className="text-green-600 font-bold">${job.startingBid}</p>
                <button
                  onClick={() => onJobClick?.(job)}
                  className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  View Job
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600">
        {jobsWithCoords.length} jobs shown on map • Click pins for details
      </div>
    </div>
  );
}