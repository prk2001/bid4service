'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { jobsApi } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Navbar } from '@/components/layout/Navbar';
import { SERVICE_CATEGORIES, US_STATES, cn, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Camera,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';

const jobSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.string().min(1, 'Please select a category'),
  address: z.string().min(5, 'Please enter a valid address'),
  city: z.string().min(2, 'Please enter a city'),
  state: z.string().min(2, 'Please select a state'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  startingBid: z.number().min(1, 'Starting bid must be at least $1'),
  maxBudget: z.number().optional().nullable(),
  desiredStartDate: z.string().optional(),
  urgency: z.enum(['FLEXIBLE', 'STANDARD', 'URGENT', 'EMERGENCY']),
  requiresLicense: z.boolean(),
  requiresInsurance: z.boolean(),
  requiresBackground: z.boolean(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface UploadedImage {
  file: File;
  preview: string;
}

// Budget estimates by category (low, mid, high)
const BUDGET_ESTIMATES: Record<string, { low: number; mid: number; high: number; unit: string }> = {
  plumbing: { low: 150, mid: 350, high: 800, unit: 'per job' },
  electrical: { low: 200, mid: 450, high: 1200, unit: 'per job' },
  hvac: { low: 300, mid: 800, high: 3000, unit: 'per job' },
  roofing: { low: 500, mid: 2500, high: 10000, unit: 'per job' },
  painting: { low: 200, mid: 600, high: 2000, unit: 'per room/area' },
  landscaping: { low: 100, mid: 400, high: 1500, unit: 'per job' },
  cleaning: { low: 80, mid: 200, high: 500, unit: 'per visit' },
  handyman: { low: 75, mid: 200, high: 500, unit: 'per job' },
  flooring: { low: 500, mid: 2000, high: 6000, unit: 'per room' },
  carpentry: { low: 200, mid: 600, high: 2000, unit: 'per job' },
  moving: { low: 200, mid: 600, high: 2000, unit: 'per move' },
  appliance_repair: { low: 100, mid: 250, high: 500, unit: 'per appliance' },
  pest_control: { low: 100, mid: 250, high: 600, unit: 'per treatment' },
  window_installation: { low: 300, mid: 800, high: 2000, unit: 'per window' },
  garage_door: { low: 200, mid: 500, high: 1500, unit: 'per door' },
  fencing: { low: 500, mid: 2000, high: 6000, unit: 'per project' },
  concrete: { low: 500, mid: 2000, high: 8000, unit: 'per project' },
  pool_spa: { low: 200, mid: 500, high: 2000, unit: 'per service' },
  security: { low: 200, mid: 600, high: 2000, unit: 'per system' },
  other: { low: 100, mid: 300, high: 1000, unit: 'per job' },
};

const steps = [
  { id: 1, name: 'Service Type', icon: FileText },
  { id: 2, name: 'Location', icon: MapPin },
  { id: 3, name: 'Budget & Timeline', icon: DollarSign },
  { id: 4, name: 'Review', icon: CheckCircle },
];

export default function NewJobPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [suggestedBudget, setSuggestedBudget] = useState<{ low: number; mid: number; high: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      urgency: 'STANDARD',
      requiresLicense: false,
      requiresInsurance: false,
      requiresBackground: false,
    },
  });

  const formValues = watch();

  // Generate AI budget suggestion based on category, description, and complexity indicators
  const generateBudgetSuggestion = () => {
    const category = formValues.category;
    const description = formValues.description?.toLowerCase() || '';
    
    if (!category || !BUDGET_ESTIMATES[category]) {
      return null;
    }

    const base = BUDGET_ESTIMATES[category];
    let multiplier = 1;

    // Analyze description for complexity indicators
    const complexityIndicators = {
      high: ['emergency', 'urgent', 'asap', 'major', 'complete', 'full', 'replace all', 'entire', 'whole house', 'multiple'],
      medium: ['repair', 'fix', 'install', 'replace', 'upgrade', 'several'],
      low: ['small', 'minor', 'simple', 'quick', 'single', 'one'],
    };

    // Check for high complexity
    if (complexityIndicators.high.some(word => description.includes(word))) {
      multiplier = 1.5;
    } else if (complexityIndicators.low.some(word => description.includes(word))) {
      multiplier = 0.7;
    }

    // Adjust for urgency
    if (formValues.urgency === 'EMERGENCY') {
      multiplier *= 1.5;
    } else if (formValues.urgency === 'URGENT') {
      multiplier *= 1.25;
    }

    // Add premium for images (shows homeowner is serious)
    if (images.length > 0) {
      multiplier *= 1.1;
    }

    return {
      low: Math.round(base.low * multiplier),
      mid: Math.round(base.mid * multiplier),
      high: Math.round(base.high * multiplier),
    };
  };

  const handleAnalyzeBudget = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis delay
    setTimeout(() => {
      const suggestion = generateBudgetSuggestion();
      setSuggestedBudget(suggestion);
      if (suggestion) {
        setValue('startingBid', suggestion.mid);
      }
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') && images.length + newImages.length < 5) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    });

    setImages([...images, ...newImages]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(['title', 'description', 'category']);
      case 2:
        return await trigger(['address', 'city', 'state', 'zipCode']);
      case 3:
        return await trigger(['startingBid', 'urgency']);
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Clean up the data - remove NaN values
      const cleanData = {
        ...data,
        maxBudget: data.maxBudget && !isNaN(data.maxBudget) ? data.maxBudget : undefined,
        startingBid: data.startingBid || 0,
      };

      console.log('Submitting job:', cleanData);
      const response = await jobsApi.create(cleanData);
      console.log('Create response:', response);
      
      const jobId = response.data?.data?.id || response.data?.id;
      
      // Try to publish the job
      if (jobId) {
        try {
          await jobsApi.publish(jobId);
        } catch (publishErr) {
          console.log('Publish error (may be expected):', publishErr);
        }
        router.push(`/jobs/${jobId}?created=true`);
      } else {
        router.push('/my-jobs');
      }
    } catch (err: any) {
      console.error('Job creation error:', err);
      setError(err.response?.data?.message || 'Failed to create job. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectedCategory = SERVICE_CATEGORIES.find(c => c.value === formValues.category);

  // Format budget display safely
  const formatBudgetDisplay = () => {
    const starting = formValues.startingBid;
    const max = formValues.maxBudget;
    
    if (!starting || isNaN(starting)) return 'Not set';
    
    let display = formatCurrency(starting);
    if (max && !isNaN(max) && max > starting) {
      display += ` - ${formatCurrency(max)}`;
    }
    return display;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <nav className="mb-8">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <li key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'ml-2 text-sm font-medium hidden sm:block',
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    )}
                  >
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-12 sm:w-24 h-0.5 mx-2 sm:mx-4',
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Service Type */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>What service do you need?</CardTitle>
                <CardDescription>
                  Tell us about your project so providers can give you accurate bids
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Service Category *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SERVICE_CATEGORIES.slice(0, 12).map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setValue('category', category.value)}
                        className={cn(
                          'flex flex-col items-center p-4 border-2 rounded-xl transition-all',
                          formValues.category === category.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="text-2xl mb-1">{category.icon}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {category.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {errors.category && (
                    <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                {/* Title */}
                <Input
                  label="Job Title *"
                  placeholder="e.g., Fix leaking kitchen faucet"
                  error={errors.title?.message}
                  {...register('title')}
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    )}
                    rows={5}
                    placeholder="Describe your project in detail. Include what needs to be done, any issues you've noticed, and any preferences you have..."
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {formValues.description?.length || 0}/50 characters minimum
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (optional but recommended)
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Add photos to help contractors better understand your project and provide more accurate bids.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative w-24 h-24">
                        <img
                          src={img.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {images.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <Camera className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Add Photo</span>
                      </button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-400 mt-2">Up to 5 photos, max 5MB each</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Where is the job located?</CardTitle>
                <CardDescription>
                  This helps us find providers in your area
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Street Address *"
                  placeholder="123 Main Street"
                  leftIcon={<MapPin className="w-5 h-5" />}
                  error={errors.address?.message}
                  {...register('address')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City *"
                    placeholder="City"
                    error={errors.city?.message}
                    {...register('city')}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <select
                      className={cn(
                        'w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      )}
                      {...register('state')}
                    >
                      <option value="">Select state</option>
                      {US_STATES.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                <Input
                  label="ZIP Code *"
                  placeholder="12345"
                  error={errors.zipCode?.message}
                  {...register('zipCode')}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Budget & Timeline */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Budget & Timeline</CardTitle>
                <CardDescription>
                  Set your budget expectations and when you need the work done
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Budget Suggestion */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="font-medium text-purple-900">AI Budget Suggestion</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeBudget}
                      disabled={!formValues.category || !formValues.description || isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1" />
                          Get Suggestion
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {suggestedBudget ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Based on your {selectedCategory?.label?.toLowerCase()} project:
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('startingBid', suggestedBudget.low)}
                          className={cn(
                            'p-3 rounded-lg border-2 text-center transition-all',
                            formValues.startingBid === suggestedBudget.low
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <span className="block text-xs text-gray-500">Budget</span>
                          <span className="block font-bold text-gray-900">{formatCurrency(suggestedBudget.low)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('startingBid', suggestedBudget.mid)}
                          className={cn(
                            'p-3 rounded-lg border-2 text-center transition-all',
                            formValues.startingBid === suggestedBudget.mid
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <span className="block text-xs text-gray-500">Recommended</span>
                          <span className="block font-bold text-blue-600">{formatCurrency(suggestedBudget.mid)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('startingBid', suggestedBudget.high)}
                          className={cn(
                            'p-3 rounded-lg border-2 text-center transition-all',
                            formValues.startingBid === suggestedBudget.high
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <span className="block text-xs text-gray-500">Premium</span>
                          <span className="block font-bold text-gray-900">{formatCurrency(suggestedBudget.high)}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Click "Get Suggestion" to get an AI-powered budget estimate based on your project details.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Budget *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        className={cn(
                          'w-full h-10 pl-8 pr-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                          errors.startingBid ? 'border-red-500' : 'border-gray-300'
                        )}
                        placeholder="500"
                        {...register('startingBid', { valueAsNumber: true })}
                      />
                    </div>
                    {errors.startingBid && (
                      <p className="mt-1 text-sm text-red-600">{errors.startingBid.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Budget (optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        className="w-full h-10 pl-8 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                        {...register('maxBudget', { 
                          setValueAs: (v) => v === '' ? undefined : Number(v)
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desired Start Date (optional)
                  </label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('desiredStartDate')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How urgent is this job? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'FLEXIBLE', label: 'Flexible', desc: 'No rush' },
                      { value: 'STANDARD', label: 'Standard', desc: '1-2 weeks' },
                      { value: 'URGENT', label: 'Urgent', desc: 'Within days' },
                      { value: 'EMERGENCY', label: 'Emergency', desc: 'ASAP' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue('urgency', option.value as any)}
                        className={cn(
                          'p-3 border-2 rounded-xl text-center transition-all',
                          formValues.urgency === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="block font-medium text-gray-900">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Provider Requirements (optional)
                  </label>
                  <div className="space-y-3">
                    {[
                      { name: 'requiresLicense', label: 'Must be licensed' },
                      { name: 'requiresInsurance', label: 'Must have insurance' },
                      { name: 'requiresBackground', label: 'Background check required' },
                    ].map((req) => (
                      <label key={req.name} className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          {...register(req.name as any)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{req.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Job</CardTitle>
                <CardDescription>
                  Make sure everything looks correct before posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Category</span>
                    <p className="font-medium flex items-center">
                      <span className="mr-2">{selectedCategory?.icon}</span>
                      {selectedCategory?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Title</span>
                    <p className="font-medium">{formValues.title}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Description</span>
                    <p className="text-gray-700">{formValues.description}</p>
                  </div>
                  
                  {/* Display uploaded images */}
                  {images.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Photos</span>
                      <div className="flex gap-2 mt-2">
                        {images.map((img, index) => (
                          <img
                            key={index}
                            src={img.preview}
                            alt={`Photo ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm text-gray-500">Location</span>
                    <p className="font-medium">
                      {formValues.address}, {formValues.city}, {formValues.state} {formValues.zipCode}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Budget</span>
                      <p className="font-medium">{formatBudgetDisplay()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Urgency</span>
                      <p className="font-medium capitalize">{formValues.urgency?.toLowerCase()}</p>
                    </div>
                  </div>
                  {(formValues.requiresLicense || formValues.requiresInsurance || formValues.requiresBackground) && (
                    <div>
                      <span className="text-sm text-gray-500">Requirements</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formValues.requiresLicense && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Licensed</span>
                        )}
                        {formValues.requiresInsurance && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Insured</span>
                        )}
                        {formValues.requiresBackground && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Background Check</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => router.back() : prevStep}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                isLoading={isSubmitting}
                rightIcon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              >
                Post Job
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
