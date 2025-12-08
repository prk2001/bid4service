'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { jobsApi, bidsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Avatar } from '@/components/ui';
import { Navbar } from '@/components/layout/Navbar';
import { 
  formatCurrency, 
  formatDate, 
  formatRelativeTime,
  getStatusColor,
  getUrgencyColor,
  formatStatus,
  SERVICE_CATEGORIES,
  cn
} from '@/lib/utils';
import { Job, Bid } from '@/types';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  FileText,
  Users,
  Star,
  CheckCircle,
  ArrowLeft,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const jobId = params.id as string;
  const justCreated = searchParams.get('created') === 'true';
  
  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState(false);

  const isProvider = user?.role === 'PROVIDER';
  const isOwner = job?.customerId === user?.id;
  const hasBid = Array.isArray(bids) && bids.some(bid => bid.providerId === user?.id);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const [jobRes, bidsRes] = await Promise.all([
          jobsApi.getById(jobId),
          bidsApi.getByJob(jobId).catch(() => ({ data: { data: [] } })),
        ]);
        setJob(jobRes.data.data.job || jobRes.data.data);
        setBids(bidsRes.data.data.bids || bidsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    setSubmittingBid(true);

    try {
      await bidsApi.create(jobId, {
        amount: parseFloat(bidAmount),
        proposal: bidProposal,
      });
      setBidSuccess(true);
      setShowBidForm(false);
      // Refresh bids
      const bidsRes = await bidsApi.getByJob(jobId);
      setBids(bidsRes.data.data.bids || bidsRes.data.data || []);
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to submit bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      await bidsApi.accept(bidId);
      // Refresh data
      const [jobRes, bidsRes] = await Promise.all([
        jobsApi.getById(jobId),
        bidsApi.getByJob(jobId),
      ]);
      setJob(jobRes.data.data.job || jobRes.data.data);
      setBids(bidsRes.data.data.bids || bidsRes.data.data || []);
    } catch (error) {
      console.error('Failed to accept bid:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
          <p className="text-gray-600 mb-6">This job may have been removed or doesn't exist.</p>
          <Link href="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = SERVICE_CATEGORIES.find(c => c.value === job.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href={isOwner ? '/my-jobs' : '/jobs'}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {isOwner ? 'My Jobs' : 'Jobs'}
        </Link>

        {/* Success message for just created job */}
        {justCreated && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Job posted successfully!</p>
              <p className="text-green-700 text-sm">Providers can now see your job and submit bids.</p>
            </div>
          </div>
        )}

        {/* Bid success message */}
        {bidSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Bid submitted successfully!</p>
              <p className="text-green-700 text-sm">The homeowner will review your bid and get back to you.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{category?.icon || '📋'}</span>
                  <Badge variant="secondary">{category?.label || job.category}</Badge>
                  <Badge className={getUrgencyColor(job.urgency)}>{job.urgency}</Badge>
                  <Badge className={getStatusColor(job.status)}>{formatStatus(job.status)}</Badge>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">{job.title}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {job.city}, {job.state} {job.zipCode}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Posted {formatRelativeTime(job.createdAt)}
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1.5" />
                    {job._count?.bids || 0} bids
                  </span>
                </div>

                <div className="prose prose-gray max-w-none">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {(job.requiresLicense || job.requiresInsurance || job.requiresBackground) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                    Provider Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {job.requiresLicense && (
                      <div className="flex items-center px-3 py-2 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Licensed</span>
                      </div>
                    )}
                    {job.requiresInsurance && (
                      <div className="flex items-center px-3 py-2 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Insured</span>
                      </div>
                    )}
                    {job.requiresBackground && (
                      <div className="flex items-center px-3 py-2 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Background Check</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bids Section */}
            {(isOwner || isProvider) && (
              <Card>
                <CardHeader>
                  <CardTitle>Bids ({bids.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {bids.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No bids yet</p>
                      {isProvider && !hasBid && job.status === 'OPEN' && (
                        <Button className="mt-4" onClick={() => setShowBidForm(true)}>
                          Be the first to bid
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bids.map((bid) => (
                        <div
                          key={bid.id}
                          className={cn(
                            'p-4 rounded-lg border',
                            bid.status === 'ACCEPTED'
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <Avatar
                                src={bid.provider.profileImage}
                                firstName={bid.provider.firstName}
                                lastName={bid.provider.lastName}
                                size="md"
                              />
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {bid.provider.firstName} {bid.provider.lastName}
                                </p>
                                {bid.provider.providerProfile?.averageRating && (
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                                    {bid.provider.providerProfile.averageRating.toFixed(1)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(bid.amount)}
                              </p>
                              <Badge className={getStatusColor(bid.status)}>
                                {formatStatus(bid.status)}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="mt-3 text-gray-700">{bid.proposal}</p>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(bid.createdAt)}
                            </span>
                            
                            {isOwner && bid.status === 'PENDING' && job.status === 'OPEN' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Message
                                </Button>
                                <Button size="sm" onClick={() => handleAcceptBid(bid.id)}>
                                  Accept Bid
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-1">Budget</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(job.startingBid)}
                  </p>
                  {job.maxBudget && (
                    <p className="text-sm text-gray-500">
                      up to {formatCurrency(job.maxBudget)}
                    </p>
                  )}
                </div>

                {job.desiredStartDate && (
                  <div className="flex items-center justify-between py-3 border-t">
                    <span className="text-sm text-gray-500">Start Date</span>
                    <span className="font-medium">{formatDate(job.desiredStartDate)}</span>
                  </div>
                )}

                {/* Action buttons */}
                {isProvider && !isOwner && job.status === 'OPEN' && (
                  <>
                    {hasBid ? (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                        <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-blue-800">You've already bid on this job</p>
                      </div>
                    ) : (
                      <Button className="w-full mt-4" onClick={() => setShowBidForm(true)}>
                        Submit a Bid
                      </Button>
                    )}
                  </>
                )}

                {!user && (
                  <Link href="/login">
                    <Button className="w-full mt-4">Sign in to Bid</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Posted by</h3>
                <div className="flex items-center">
                  <Avatar
                    src={job?.customer?.profileImage}
                    firstName={job?.customer?.firstName}
                    lastName={job?.customer?.lastName}
                    size="lg"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      {job?.customer?.firstName} {job?.customer?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Homeowner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bid Form Modal */}
        {showBidForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Submit Your Bid</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitBid} className="space-y-4">
                  {bidError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      {bidError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Bid Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        required
                        className="w-full h-10 pl-8 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Customer budget: {formatCurrency(job.startingBid)}
                      {job.maxBudget && ` - ${formatCurrency(job.maxBudget)}`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposal *
                    </label>
                    <textarea
                      required
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe how you would complete this job, your experience, timeline, etc."
                      value={bidProposal}
                      onChange={(e) => setBidProposal(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowBidForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      isLoading={submittingBid}
                    >
                      Submit Bid
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
