'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { Button, Card, CardContent, Badge, Input } from '@/components/ui';
import { Navbar } from '@/components/layout/Navbar';
import { 
  formatCurrency, 
  formatRelativeTime, 
  getStatusColor, 
  getUrgencyColor,
  formatStatus,
  SERVICE_CATEGORIES 
} from '@/lib/utils';
import { Job } from '@/types';
import {
  Search,
  MapPin,
  Clock,
  Users,
  Filter,
  ChevronDown,
  Loader2,
  Map,
  List,
  Navigation,
  Target,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const JobSearchMap = dynamic(() => import('@/components/JobSearchMap'), { ssr: false });

type SearchMode = 'select' | 'myArea' | 'custom' | 'map';

export default function JobsPage() {
  const searchParams = useSearchParams();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState('25');
  const [minBudget, setMinBudget] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [userZip, setUserZip] = useState('');
  const [userRadius, setUserRadius] = useState('25');

  // Load user's saved location from profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('https://web-production-3651c.up.railway.app/api/v1/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const profile = data.data?.providerProfile || data.data?.customerProfile;
          if (profile?.zipCode) {
            setUserZip(profile.zipCode);
            setUserRadius(profile.serviceRadius?.toString() || '25');
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadUserProfile();
  }, []);

  // Fetch all jobs once
  const fetchAllJobs = async () => {
    setLoading(true);
    try {
      const response = await jobsApi.getAll({
        status: 'OPEN',
      });
      const jobs = response.data.data?.jobs || response.data.data?.items || [];
      setAllJobs(jobs);
      return jobs;
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on criteria
  const filterJobs = (jobs: Job[], zip?: string, rad?: string, minBud?: string, category?: string, query?: string) => {
    let result = [...jobs];
    
    // Filter by zip code prefix (simple matching)
    if (zip) {
      const zipPrefix = zip.substring(0, 3);
      result = result.filter(job => job.zipCode?.startsWith(zipPrefix));
    }
    
    // Filter by minimum budget
    if (minBud && parseFloat(minBud) > 0) {
      const minAmount = parseFloat(minBud);
      result = result.filter(job => job.startingBid >= minAmount);
    }
    
    // Filter by category
    if (category) {
      result = result.filter(job => job.category === category);
    }
    
    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(q) || 
        job.description?.toLowerCase().includes(q) ||
        job.city?.toLowerCase().includes(q)
      );
    }
    
    return result;
  };

  const handleSearchMyArea = async () => {
    setSearchMode('myArea');
    setZipCode(userZip);
    setRadius(userRadius);
    const jobs = allJobs.length > 0 ? allJobs : await fetchAllJobs();
    const filtered = filterJobs(jobs, userZip, userRadius);
    setFilteredJobs(filtered);
  };

  const handleCustomSearch = () => {
    setSearchMode('custom');
  };

  const handleCustomSearchSubmit = async () => {
    setLoading(true);
    const jobs = allJobs.length > 0 ? allJobs : await fetchAllJobs();
    const filtered = filterJobs(jobs, zipCode, radius, minBudget);
    setFilteredJobs(filtered);
    setLoading(false);
  };

  const handleMapView = async () => {
    setSearchMode('map');
    if (allJobs.length === 0) {
      const jobs = await fetchAllJobs();
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(allJobs);
    }
  };

  const handleBackToSelect = () => {
    setSearchMode('select');
    setFilteredJobs([]);
  };

  // Re-filter when category or search query changes
  useEffect(() => {
    if (searchMode !== 'select' && allJobs.length > 0) {
      const filtered = filterJobs(allJobs, zipCode, radius, minBudget, selectedCategory, searchQuery);
      setFilteredJobs(filtered);
    }
  }, [selectedCategory, searchQuery]);

  // Search mode selection screen
  if (searchMode === 'select') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
            <p className="text-gray-600 mt-2">Choose how you want to search for jobs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Search My Area */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={handleSearchMyArea}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search My Area</h3>
                <p className="text-gray-600 text-sm">
                  Find jobs within your saved service area
                </p>
                {userZip && (
                  <p className="text-blue-600 text-sm mt-2 font-medium">
                    {userZip} • {userRadius} miles
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Custom Search */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
              onClick={handleCustomSearch}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Search</h3>
                <p className="text-gray-600 text-sm">
                  Enter any zip code and radius to search
                </p>
              </CardContent>
            </Card>

            {/* Browse Map */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
              onClick={handleMapView}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Map className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Map</h3>
                <p className="text-gray-600 text-sm">
                  Explore jobs visually on an interactive map
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Custom search form
  if (searchMode === 'custom' && filteredJobs.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button onClick={handleBackToSelect} className="text-blue-600 hover:text-blue-800 mb-6 flex items-center">
            ← Back to search options
          </button>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Custom Job Search</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                  <Input
                    placeholder="Enter zip code (e.g. 31601)"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    leftIcon={<MapPin className="w-5 h-5" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Radius</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="10">10 miles</option>
                    <option value="25">25 miles</option>
                    <option value="50">50 miles</option>
                    <option value="100">100 miles</option>
                    <option value="250">250 miles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Budget (optional)</label>
                  <Input
                    placeholder="e.g. 500"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    leftIcon={<span className="text-gray-500">$</span>}
                  />
                  <p className="text-xs text-gray-500 mt-1">Set higher for jobs worth traveling for</p>
                </div>

                <Button onClick={handleCustomSearchSubmit} className="w-full" disabled={!zipCode}>
                  <Search className="w-4 h-4 mr-2" />
                  Search Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button onClick={handleBackToSelect} className="text-blue-600 hover:text-blue-800 mb-2 flex items-center text-sm">
              ← Change search method
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {searchMode === 'myArea' && `Jobs near ${userZip}`}
              {searchMode === 'custom' && `Jobs near ${zipCode}`}
              {searchMode === 'map' && 'Browse Jobs on Map'}
            </h1>
          </div>
          
          {/* View toggle for non-map modes */}
          {searchMode !== 'map' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSearchMode('map'); setFilteredJobs(allJobs); }}>
                <Map className="w-4 h-4 mr-1" /> Map
              </Button>
            </div>
          )}
        </div>

        {/* Map View */}
        {searchMode === 'map' && (
          <div className="mb-6">
            <JobSearchMap 
              jobs={filteredJobs} 
              onJobClick={(job) => window.location.href = `/jobs/${job.id}`}
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search jobs..."
                leftIcon={<Search className="w-5 h-5" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
              rightIcon={<ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      !selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {SERVICE_CATEGORIES.slice(0, 8).map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === cat.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500">Try expanding your search radius or changing filters</p>
              <Button onClick={handleBackToSelect} className="mt-4" variant="outline">
                Try a different search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{filteredJobs.length} jobs found</p>
            
            {filteredJobs.map((job) => {
              const category = SERVICE_CATEGORIES.find(c => c.value === job.category);
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{category?.icon || '📋'}</span>
                            <Badge variant="secondary">{category?.label || job.category}</Badge>
                            <Badge className={getUrgencyColor(job.urgency)}>{job.urgency}</Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.city}, {job.state}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatRelativeTime(job.createdAt)}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {job._count?.bids || 0} bids
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{formatCurrency(job.startingBid)}</div>
                          {job.maxBudget && (
                            <p className="text-sm text-gray-500">up to {formatCurrency(job.maxBudget)}</p>
                          )}
                          <Badge className={`mt-2 ${getStatusColor(job.status)}`}>{formatStatus(job.status)}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}