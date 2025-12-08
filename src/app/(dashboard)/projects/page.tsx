'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { Navbar } from '@/components/layout/Navbar';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { FolderOpen, Loader2 } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getAll({});
        const data = response.data?.data?.projects || response.data?.data || [];
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Track your active and completed projects</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">
                Projects are created when you accept a bid on one of your jobs.
              </p>
              <Link href="/jobs/new">
                <Button>Post a Job</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{project.job?.title || 'Project'}</h3>
                      <p className="text-gray-600 text-sm mt-1">{project.job?.description}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Started {formatRelativeTime(project.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge>{project.status}</Badge>
                      <p className="text-xl font-bold mt-2">{formatCurrency(project.agreedPrice)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
