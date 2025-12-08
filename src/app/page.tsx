'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Navbar } from '@/components/layout/Navbar';
import { SERVICE_CATEGORIES } from '@/lib/utils';
import {
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Clock,
  Users,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2 fill-blue-500" />
              Trusted by 10,000+ homeowners
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Get the Best Price for Your{' '}
              <span className="text-blue-600">Home Services</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Post your project and let qualified professionals compete for your
              business. Compare bids, reviews, and choose the perfect match.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/jobs/new">
                <Button size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Post a Job Free
                </Button>
              </Link>
              <Link href="/register?role=provider">
                <Button size="xl" variant="outline">
                  Join as Provider
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>Free to post</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-500 mr-2" />
                <span>Verified providers</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-orange-500 mr-2" />
                <span>Get bids in hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating notification */}
        <div className="absolute right-8 top-1/2 hidden xl:block">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 animate-bounce">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New bid received!</p>
                <p className="text-sm text-gray-500">$450 for plumbing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What service do you need?
            </h2>
            <p className="text-lg text-gray-600">
              Browse our most popular categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SERVICE_CATEGORIES.slice(0, 10).map((category) => (
              <Link
                key={category.value}
                href={`/jobs?category=${category.value}`}
                className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <span className="text-3xl mb-3">{category.icon}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  {category.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/jobs">
              <Button variant="outline">
                View All Categories
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Bid4Service Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your project done in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Post Your Job',
                description:
                  'Describe your project, set your budget, and post it for free. It only takes a few minutes.',
                icon: '📝',
              },
              {
                step: '2',
                title: 'Receive Bids',
                description:
                  'Qualified professionals will compete for your job. Compare their bids, reviews, and credentials.',
                icon: '💰',
              },
              {
                step: '3',
                title: 'Hire & Get It Done',
                description:
                  'Choose the best provider, communicate directly, and get your project completed with confidence.',
                icon: '✅',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl text-3xl mb-6">
                  {item.icon}
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '50K+', label: 'Jobs Completed' },
              { value: '10K+', label: 'Verified Providers' },
              { value: '4.8', label: 'Average Rating' },
              { value: '$5M+', label: 'Saved by Customers' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of homeowners who save time and money with Bid4Service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/jobs/new">
              <Button size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Post Your First Job
              </Button>
            </Link>
            <Link href="/register?role=provider">
              <Button size="xl" variant="outline">
                Become a Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                  <span className="text-white font-bold text-lg">B4</span>
                </div>
                <span className="ml-2 text-xl font-bold text-white">
                  Bid4Service
                </span>
              </div>
              <p className="text-sm">
                Connecting homeowners with trusted service providers since 2024.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Homeowners</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/jobs/new" className="hover:text-white">Post a Job</Link></li>
                <li><Link href="/jobs" className="hover:text-white">Browse Services</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register?role=provider" className="hover:text-white">Join as Provider</Link></li>
                <li><Link href="/jobs" className="hover:text-white">Find Jobs</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © 2024 Bid4Service. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
