'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface Job {
  id: string;
  title: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  startingBid: number;
  category: string;
}

interface JobsMapProps {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
}

export default function JobsMap({ jobs, onJobClick }: JobsMapProps) {
  const [hoveredJob, setHoveredJob] = useState<Job | null>(null);
  const jobsWithCoords = jobs.filter(job => job.latitude && job.longitude);

  const addJitter = (coord: number) => {
    return coord + (Math.random() - 0.5) * 0.1;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Jobs Near You</h2>
      <div className="relative" style={{ height: '400px' }}>
        <ComposableMap projection="geoAlbersUsa" style={{ width: '100%', height: '100%' }}>
          <ZoomableGroup center={[-96, 38]} zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E8F4FD"
                    stroke="#93C5FD"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#DBEAFE', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>
            {jobsWithCoords.map((job) => (
              <Marker
                key={job.id}
                coordinates={[addJitter(job.longitude!), addJitter(job.latitude!)]}
                onMouseEnter={() => setHoveredJob(job)}
                onMouseLeave={() => setHoveredJob(null)}
                onClick={() => onJobClick?.(job)}
                style={{ cursor: 'pointer' }}
              >
                <circle r={6} fill="#2563EB" stroke="#fff" strokeWidth={2} />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {hoveredJob && (
          <div className="absolute bg-white shadow-lg rounded-lg p-3 border z-10 pointer-events-none"
            style={{ top: '10px', right: '10px', maxWidth: '200px' }}>
            <p className="font-semibold text-gray-800">{hoveredJob.title}</p>
            <p className="text-sm text-gray-600">{hoveredJob.city}, {hoveredJob.state}</p>
            <p className="text-sm text-green-600 font-bold">${hoveredJob.startingBid}</p>
            <p className="text-xs text-gray-500">{hoveredJob.category}</p>
          </div>
        )}

        {jobsWithCoords.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">No jobs with location data</p>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">Click a pin to view job details</p>
    </div>
  );
}