'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { jobsApi, bidsApi, projectsApi, messagesApi } from '@/lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatCurrency, formatRelativeTime, getStatusColor, formatStatus } from '@/lib/utils';
import { Job, Bid, Project, Conversation } from '@/types';
import {
  Plus,
  Briefcase,
  FolderOpen,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Search,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingBids: 0,
    activeProjects: 0,
    unreadMessages: 0,
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const isProvider = user?.role === 'PROVIDER';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isProvider) {
          // Provider dashboard data
          const [bidsRes, projectsRes, messagesRes] = await Promise.all([
            bidsApi.getMyBids({ limit: 5 }),
            projectsApi.getAll({ limit: 5 }),
            messagesApi.getConversations(),
          ]);

          setRecentBids(bidsRes.data.data?.bids || bidsRes.data.data?.items || []);
          
          const messagesData = messagesRes.data.data?.conversations || messagesRes.data.data || [];
          const unreadCount = Array.isArray(messagesData) ? messagesData.reduce(
            (acc: number, conv: Conversation) => acc + (conv.unreadCount || 0),
            0
          ) : 0;

          setStats({
            activeJobs: 0,
            pendingBids: bidsRes.data.data?.bids || bidsRes.data.data?.items?.filter((b: Bid) => b.status === 'PENDING').length || 0,
            activeProjects: projectsRes.data.data?.projects || projectsRes.data.data?.items?.filter((p: Project) => p.status === 'IN_PROGRESS').length || 0,
            unreadMessages: unreadCount,
          });
        } else {
          // Customer dashboard data
          let jobsRes = { data: { data: { jobs: [] } } };
        let projectsRes = { data: { data: { projects: [] } } };
        let messagesRes = { data: { data: [] } };
        
        try { jobsRes = await jobsApi.getMyJobs({ limit: 5 }); } catch (e) { console.log('Jobs API error:', e); }
        try { projectsRes = await projectsApi.getAll({ limit: 5 }); } catch (e) { console.log('Projects API error:', e); }
        try { messagesRes = await messagesApi.getConversations(); } catch (e) { console.log('Messages API error:', e); }

          console.log('Jobs API response:', jobsRes);
          setRecentJobs(jobsRes.data.data?.jobs || jobsRes.data.data?.items || []);
          
          const messagesData = messagesRes.data.data?.conversations || messagesRes.data.data || [];
          const unreadCount = Array.isArray(messagesData) ? messagesData.reduce(
            (acc: number, conv: Conversation) => acc + (conv.unreadCount || 0),
            0
          ) : 0;

          setStats({
            activeJobs: (() => {
              const jobs = jobsRes.data.data?.jobs || jobsRes.data.data?.items || [];
              console.log('All jobs for activeJobs:', jobs);
              const active = jobs.filter((j: Job) => j.status === 'OPEN' || j.status === 'IN_BIDDING');
              console.log('Filtered active jobs:', active.length);
              return active.length;
            })(),
            pendingBids: 0,
            activeProjects: projectsRes.data.data?.projects || projectsRes.data.data?.items?.filter((p: Project) => p.status === 'IN_PROGRESS').length || 0,
            unreadMessages: unreadCount,
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isProvider]);

  const customerStats = [
    {
      name: 'Active Jobs',
      value: stats.activeJobs,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/my-jobs',
    },
    {
      name: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/projects',
    },
    {
      name: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/messages',
    },
    {
      name: 'Total Spent',
      value: formatCurrency(user?.customerProfile?.totalSpent || 0),
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/projects',
    },
  ];

  const providerStats = [
    {
      name: 'Pending Bids',
      value: stats.pendingBids,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/my-bids',
    },
    {
      name: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/projects',
    },
    {
      name: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/messages',
    },
    {
      name: 'Total Earned',
      value: formatCurrency(user?.providerProfile?.totalEarned || 0),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/projects',
    },
  ];

  const displayStats = isProvider ? providerStats : customerStats;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="mt-1 text-gray-600">
            {isProvider
              ? "Here's an overview of your bidding activity"
              : "Here's what's happening with your projects"}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {isProvider ? (
            <Link href="/jobs">
              <Button leftIcon={<Search className="w-4 h-4" />}>
                Browse Jobs
              </Button>
            </Link>
          ) : (
            <Link href="/jobs/new">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Post a Job
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Jobs/Bids */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {isProvider ? 'Recent Bids' : 'Recent Jobs'}
            </CardTitle>
            <Link
              href={isProvider ? '/my-bids' : '/my-jobs'}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : isProvider ? (
              recentBids.length > 0 ? (
                <div className="space-y-4">
                  {recentBids.map((bid) => (
                    <Link
                      key={bid.id}
                      href={`/jobs/${bid.jobId}`}
                      className="block p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {bid.job?.title || 'Job'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Bid: {formatCurrency(bid.amount)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(bid.status)}>
                          {formatStatus(bid.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatRelativeTime(bid.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bids yet</p>
                  <Link href="/jobs" className="text-blue-600 hover:underline text-sm">
                    Browse available jobs
                  </Link>
                </div>
              )
            ) : recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{job.title}</h4>
                        <p className="text-sm text-gray-500">
                          {job._count?.bids || 0} bids · Budget: {formatCurrency(job.startingBid)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {formatStatus(job.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatRelativeTime(job.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No jobs posted yet</p>
                <Link href="/jobs/new" className="text-blue-600 hover:underline text-sm">
                  Post your first job
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {isProvider ? (
                <>
                  <Link
                    href="/jobs"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <Search className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Browse Jobs</span>
                  </Link>
                  <Link
                    href="/my-bids"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <Briefcase className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">My Bids</span>
                  </Link>
                  <Link
                    href="/projects"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <FolderOpen className="w-8 h-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Projects</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Profile</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/jobs/new"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <Plus className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Post a Job</span>
                  </Link>
                  <Link
                    href="/my-jobs"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <Briefcase className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">My Jobs</span>
                  </Link>
                  <Link
                    href="/projects"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <FolderOpen className="w-8 h-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Projects</span>
                  </Link>
                  <Link
                    href="/messages"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <MessageSquare className="w-8 h-8 text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Messages</span>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
