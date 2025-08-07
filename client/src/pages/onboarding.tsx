import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  Upload, 
  User, 
  FileText, 
  CreditCard, 
  Phone, 
  CheckCircle,
  AlertCircle,
  Camera
} from 'lucide-react';

const onboardingSchema = z.object({
  // Personal Information
  fatherName: z.string().min(2, 'Father\'s name is required'),
  dateOfBirth: z.date({
    required_error: 'Date of birth is required',
  }),
  marriageAnniversary: z.date().optional(),
  personalMobile: z.string().min(10, 'Valid mobile number is required'),
  
  // Emergency Contact
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactNumber: z.string().min(10, 'Emergency contact number is required'),
  emergencyContactRelation: z.string().min(2, 'Relationship is required'),
  
  // Employment Details
  dateOfJoining: z.date({
    required_error: 'Date of joining is required',
  }),
  designation: z.string().min(2, 'Designation is required'),
  
  // Government IDs
  panNumber: z.string().min(10, 'Valid PAN number is required'),
  aadharNumber: z.string().min(12, 'Valid Aadhar number is required'),
  
  // Banking Details
  bankAccountNumber: z.string().min(8, 'Valid bank account number is required'),
  ifscCode: z.string().min(11, 'Valid IFSC code is required'),
  
  // PF Details
  uanNumber: z.string().min(12, 'Valid UAN number is required'),
  pfNumber: z.string().min(5, 'Valid PF number is required'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bankProofDocument, setBankProofDocument] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      personalMobile: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      emergencyContactRelation: '',
      designation: '',
      panNumber: '',
      aadharNumber: '',
      bankAccountNumber: '',
      ifscCode: '',
      uanNumber: '',
      pfNumber: '',
    },
  });

  const { data: employeeProfile, isLoading } = useQuery({
    queryKey: ['/api/employee/profile'],
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingFormData & { bankProofDocumentPath?: string }) => {
      const res = await apiRequest('POST', '/api/employee/onboarding', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee/profile'] });
      toast({
        title: 'Onboarding Complete!',
        description: 'Your information has been submitted for approval.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const handleBankProofUpload = async () => {
    try {
      const res = await apiRequest('POST', '/api/objects/upload', {});
      const response = await res.json();
      return {
        method: 'PUT' as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      setBankProofDocument(result.successful[0].uploadURL as string);
      toast({
        title: 'Document Uploaded',
        description: 'Bank proof document uploaded successfully.',
      });
    }
  };

  const onSubmit = (data: OnboardingFormData) => {
    const submitData = {
      ...data,
      bankProofDocumentPath: bankProofDocument,
    };
    onboardingMutation.mutate(submitData);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Personal Information';
      case 2: return 'Emergency Contact';
      case 3: return 'Employment Details';
      case 4: return 'Government IDs';
      case 5: return 'Banking & PF Details';
      default: return '';
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <User className="h-5 w-5" />;
      case 2: return <Phone className="h-5 w-5" />;
      case 3: return <FileText className="h-5 w-5" />;
      case 4: return <CreditCard className="h-5 w-5" />;
      case 5: return <Upload className="h-5 w-5" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // If onboarding is already completed, show status
  if (employeeProfile?.onboardingCompleted) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span>Onboarding Completed</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Your onboarding has been completed and approved by HR.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Approved on {employeeProfile.approvedAt ? format(new Date(employeeProfile.approvedAt), 'MMM dd, yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Employee Onboarding</h1>
          <p className="text-neutral-600">
            Complete your profile information to get started with the company.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-neutral-300 text-neutral-400'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    getStepIcon(step)
                  )}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-neutral-500">
              Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStepIcon(currentStep)}
                  <span>{getStepTitle(currentStep)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentStep === 1 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Email Address</Label>
                        <Input value={user?.email || ''} disabled className="bg-neutral-50" />
                        <p className="text-xs text-neutral-500 mt-1">
                          Using your Google account email
                        </p>
                      </div>
                      
                      <div>
                        <Label>Full Name</Label>
                        <Input 
                          value={`${user?.firstName || ''} ${user?.lastName || ''}`} 
                          disabled 
                          className="bg-neutral-50" 
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Father's Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter father's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of Birth *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={`w-full pl-3 text-left font-normal ${
                                      !field.value && 'text-muted-foreground'
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date('1900-01-01')
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="marriageAnniversary"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Marriage Anniversary (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={`w-full pl-3 text-left font-normal ${
                                      !field.value && 'text-muted-foreground'
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date('1900-01-01')
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="personalMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Mobile Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter 10-digit mobile number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter emergency contact name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter emergency contact number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship with Employee *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <FormField
                      control={form.control}
                      name="dateOfJoining"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Joining *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value && 'text-muted-foreground'
                                  }`}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designation *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your job title/designation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <FormField
                      control={form.control}
                      name="panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="ABCDE1234F" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aadhar Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="XXXX XXXX XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 5 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Account Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter account number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ifscCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IFSC Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="HDFC0001234" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Bank Account Proof *</Label>
                      <p className="text-xs text-neutral-500 mb-3">
                        Upload cancelled cheque or bank passbook copy
                      </p>
                      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6">
                        {bankProofDocument ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-sm text-green-700">Document uploaded successfully</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setBankProofDocument('')}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleBankProofUpload}
                            onComplete={handleUploadComplete}
                            buttonClassName="w-full"
                          >
                            <div className="flex flex-col items-center space-y-2">
                              <Upload className="h-8 w-8 text-neutral-400" />
                              <span>Upload Bank Proof Document</span>
                              <span className="text-xs text-neutral-500">PDF, JPG, PNG (Max 5MB)</span>
                            </div>
                          </ObjectUploader>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="uanNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UAN Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="123456789012" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pfNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PF Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="PF/12345/67890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={onboardingMutation.isPending || !bankProofDocument}
                >
                  {onboardingMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}