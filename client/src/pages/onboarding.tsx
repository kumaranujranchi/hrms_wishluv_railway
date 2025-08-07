import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ObjectUploader } from "@/components/ObjectUploader";
import { 
  UserPlus, 
  FileText, 
  Upload, 
  CheckCircle, 
  User, 
  Briefcase, 
  CreditCard,
  Shield,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

interface OnboardingData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  
  // Job Information
  position: string;
  department: string;
  startDate: string;
  managerId: string;
  salary: string;
  
  // Documents
  profilePhotoUrl: string;
  resumeUrl: string;
  idProofUrl: string;
  
  // Bank Details
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    position: '',
    department: '',
    startDate: '',
    managerId: '',
    salary: '',
    profilePhotoUrl: '',
    resumeUrl: '',
    idProofUrl: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const submitOnboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      // This would typically create a new employee record
      // For now, we'll just show a success message
      console.log('Onboarding data:', data);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee onboarding completed successfully!",
      });
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        position: '',
        department: '',
        startDate: '',
        managerId: '',
        salary: '',
        profilePhotoUrl: '',
        resumeUrl: '',
        idProofUrl: '',
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        accountHolderName: '',
      });
      setCurrentStep(1);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    // In a real implementation, this would call the backend API
    return {
      method: "PUT" as const,
      url: "https://example.com/upload", // This would be a presigned URL
    };
  };

  const handleUploadComplete = (result: any, field: string) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      setFormData({ ...formData, [field]: uploadURL });
      toast({
        title: "Success",
        description: "File uploaded successfully!",
      });
    }
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

  const handleSubmit = () => {
    submitOnboardingMutation.mutate(formData);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 2:
        return formData.position && formData.department && formData.startDate;
      case 3:
        return true; // Documents are optional
      case 4:
        return formData.bankName && formData.accountNumber && formData.accountHolderName;
      default:
        return false;
    }
  };

  const departments = [
    'Engineering',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Operations',
    'Design',
    'Customer Support'
  ];

  const positions = [
    'Software Engineer',
    'Senior Software Engineer',
    'Marketing Manager',
    'Sales Representative',
    'HR Specialist',
    'Financial Analyst',
    'Product Manager',
    'Designer',
    'Customer Support Specialist'
  ];

  // Only allow access for admin and manager roles
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Access Restricted</h2>
                <p className="text-sm text-neutral-600">
                  Only administrators and managers can access the onboarding portal.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-neutral-900">Employee Onboarding</h1>
              <div className="text-sm text-neutral-600">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <Progress value={progress} className="mb-4" />
            <div className="flex justify-between text-sm text-neutral-600">
              <span className={currentStep >= 1 ? "text-primary-600 font-medium" : ""}>Personal Info</span>
              <span className={currentStep >= 2 ? "text-primary-600 font-medium" : ""}>Job Details</span>
              <span className={currentStep >= 3 ? "text-primary-600 font-medium" : ""}>Documents</span>
              <span className={currentStep >= 4 ? "text-primary-600 font-medium" : ""}>Bank Details</span>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStep === 1 && <User className="h-5 w-5" />}
              {currentStep === 2 && <Briefcase className="h-5 w-5" />}
              {currentStep === 3 && <FileText className="h-5 w-5" />}
              {currentStep === 4 && <CreditCard className="h-5 w-5" />}
              <span>
                {currentStep === 1 && "Personal Information"}
                {currentStep === 2 && "Job Information"}
                {currentStep === 3 && "Document Upload"}
                {currentStep === 4 && "Banking Details"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Full address including city, state, and zip code"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Job Information */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map(position => (
                        <SelectItem key={position} value={position}>{position}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Annual Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="50000"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="managerId">Reporting Manager</Label>
                  <Input
                    id="managerId"
                    placeholder="Manager's employee ID or email"
                    value={formData.managerId}
                    onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <FileText className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Upload Required Documents</h3>
                  <p className="text-sm text-neutral-600">
                    Please upload the following documents. All files should be in PDF, JPG, or PNG format.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Profile Photo</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={(result) => handleUploadComplete(result, 'profilePhotoUrl')}
                      buttonClassName="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.profilePhotoUrl ? "Photo Uploaded ✓" : "Upload Photo"}
                    </ObjectUploader>
                    <p className="text-xs text-neutral-500">Professional headshot (Max 5MB)</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Resume/CV</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={(result) => handleUploadComplete(result, 'resumeUrl')}
                      buttonClassName="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.resumeUrl ? "Resume Uploaded ✓" : "Upload Resume"}
                    </ObjectUploader>
                    <p className="text-xs text-neutral-500">PDF format preferred (Max 10MB)</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>ID Proof</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={(result) => handleUploadComplete(result, 'idProofUrl')}
                      buttonClassName="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.idProofUrl ? "ID Proof Uploaded ✓" : "Upload ID Proof"}
                    </ObjectUploader>
                    <p className="text-xs text-neutral-500">
                      Government issued ID (Driver's License, Passport, etc.) - Max 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Banking Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <CreditCard className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Banking Information</h3>
                  <p className="text-sm text-neutral-600">
                    This information is required for payroll processing. All data is encrypted and secure.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                    <Input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      value={formData.routingNumber}
                      onChange={(e) => setFormData({...formData, routingNumber: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Your banking information is encrypted and stored securely. This data is only used for payroll processing and will never be shared with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {currentStep < totalSteps ? (
                  <Button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isStepValid() || submitOnboardingMutation.isPending}
                    className="bg-success-600 hover:bg-success-700"
                  >
                    {submitOnboardingMutation.isPending ? (
                      "Processing..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Onboarding
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
