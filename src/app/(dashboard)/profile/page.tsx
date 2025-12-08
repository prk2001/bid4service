'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { MapPin, Save, User, Briefcase, Phone, Mail } from 'lucide-react';
import api from '@/lib/api';

const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 75, 100];

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    // Provider specific
    businessName: '',
    zipCode: '',
    serviceRadius: 25,
    address: '',
    city: '',
    state: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      const data = response.data.data;
      setProfile({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        businessName: data.providerProfile?.businessName || '',
        zipCode: data.providerProfile?.zipCode || '',
        serviceRadius: data.providerProfile?.serviceRadius || 25,
        address: data.providerProfile?.address || '',
        city: data.providerProfile?.city || '',
        state: data.providerProfile?.state || '',
        bio: data.providerProfile?.bio || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/users/profile', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        // Provider fields (API expects flat structure)
        ...(user?.role === 'PROVIDER' ? {
          businessName: profile.businessName,
          zipCode: profile.zipCode,
          serviceRadius: profile.serviceRadius,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          bio: profile.bio,
        } : {}),
      });
      setMessage('Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      setMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  const isProvider = user?.role === 'PROVIDER';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">
            {isProvider ? 'Manage your business profile and service area' : 'Manage your account settings'}
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Basic Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            />
            <Input
              label="Email"
              value={user?.email || ''}
              disabled
              leftIcon={<Mail className="w-5 h-5" />}
            />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              leftIcon={<Phone className="w-5 h-5" />}
            />
          </div>
        </Card>

        {/* Provider-specific: Service Area */}
        {isProvider && (
          <>
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  placeholder="Your business name"
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell customers about your experience and services..."
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 mb-6 border-2 border-blue-200 bg-blue-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Service Area
              </h2>
              <p className="text-gray-600 mb-4">
                Set your location and how far you're willing to travel for jobs. Only jobs within your service area will be shown.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Your Zip Code *"
                  value={profile.zipCode}
                  onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                  placeholder="Enter your zip code"
                  leftIcon={<MapPin className="w-5 h-5" />}
                  maxLength={10}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Radius *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={profile.serviceRadius}
                    onChange={(e) => setProfile({ ...profile, serviceRadius: parseInt(e.target.value) })}
                  >
                    {RADIUS_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r} miles</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Street Address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="123 Main St"
                />
                <Input
                  label="City"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="City"
                />
                <Input
                  label="State"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="GA"
                  maxLength={2}
                />
              </div>

              {!profile.zipCode && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
                  ⚠️ Please set your zip code to see jobs in your area.
                </div>
              )}
            </Card>
          </>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            leftIcon={<Save className="w-5 h-5" />}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}
