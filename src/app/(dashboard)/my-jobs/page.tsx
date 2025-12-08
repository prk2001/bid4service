'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { jobsApi } from '@/lib/api';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { Navbar } from '@/components/layout/Navbar';
import { formatCurrency, formatRelativeTime, getStatusColor, formatStatus, SERVICE_CATEGORIES } from '@/lib/utils';
import { Job } from '@/types';
import { Plus, Briefcase, MapPin, Clock, Users, Loader2 } from 'lucide-react';

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobsApi.getMyJobs({});
        // API returns { success: true, data: { jobs: [...], pagination: {...} } }
        const jobsData = response.data?.data?.jobs || response.data?.jobs || [];
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-gray-600 mt-1">Manage your posted jobs</p>
          </div>
          <Link href="/jobs/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Post a Job</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
              <p className="text-gray-500 mb-6">Post your first job to start receiving bids.</p>
              <Link href="/jobs/new">
                <Button leftIcon={<Plus className="w-4 h-4" />}>Post a Job</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const category = SERVICE_CATEGORIES.find(c => c.value === job.category);
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer mb-4">
                    <CardContent className="p-6">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{category?.icon || '📋'}</span>
                            <Badge variant="secondary">{category?.label || job.category}</Badge>
                            <Badge className={getStatusColor(job.status)}>{formatStatus(job.status)}</Badge>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{job.city}, {job.state}</span>
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1" />{formatRelativeTime(job.createdAt)}</span>
                            <span className="flex items-center"><Users className="w-4 h-4 mr-1" />{job._count?.bids || 0} bids</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold">{formatCurrency(job.startingBid)}</div>
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
