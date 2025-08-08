import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ObjectUploader } from "@/components/ObjectUploader";
import { 
  Receipt, 
  DollarSign, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  FileText,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface ExpenseClaim {
  id: string;
  title: string;
  amount: string;
  category: string;
  description: string;
  receiptUrl: string | null;
  status: string;
  submissionDate: string;
  approvalDate: string | null;
  reimbursementDate: string | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    receiptUrl: ''
  });

  const { data: myExpenses, isLoading: myExpensesLoading } = useQuery<ExpenseClaim[]>({
    queryKey: ["/api/expenses/my"],
  });

  const { data: pendingExpenses, isLoading: pendingExpensesLoading } = useQuery<ExpenseClaim[]>({
    queryKey: ["/api/expenses/pending"],
    enabled: user?.role === 'manager' || user?.role === 'admin',
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense claim submitted successfully!",
      });
      setIsDialogOpen(false);
      setFormData({ title: '', amount: '', category: '', description: '', receiptUrl: '' });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/my"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateExpenseStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      await apiRequest("PUT", `/api/expenses/${id}/status`, { status, notes });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/pending"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate(formData);
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      setFormData({ ...formData, receiptUrl: uploadURL });
      toast({
        title: "Success",
        description: "Receipt uploaded successfully!",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="badge-success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'reimbursed':
        return <Badge className="badge-primary"><DollarSign className="h-3 w-3 mr-1" />Reimbursed</Badge>;
      default:
        return <Badge className="badge-warning"><AlertCircle className="h-3 w-3 mr-1" />Submitted</Badge>;
    }
  };

  const expenseCategories = [
    { value: 'travel', label: 'Travel & Transportation' },
    { value: 'meals', label: 'Meals & Entertainment' },
    { value: 'office', label: 'Office Supplies' },
    { value: 'training', label: 'Training & Development' },
    { value: 'communication', label: 'Communication' },
    { value: 'equipment', label: 'Equipment & Software' },
    { value: 'other', label: 'Other' },
  ];

  const calculateTotalExpenses = (expenses: ExpenseClaim[], status?: string) => {
    return expenses
      ?.filter(expense => !status || expense.status === status)
      ?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Expense Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Submitted</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${calculateTotalExpenses(myExpenses || []).toFixed(2)}
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Approved</p>
                  <p className="text-2xl font-bold text-success-600">
                    ${calculateTotalExpenses(myExpenses || [], 'approved').toFixed(2)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Pending</p>
                  <p className="text-2xl font-bold text-warning-600">
                    ${calculateTotalExpenses(myExpenses || [], 'submitted').toFixed(2)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-warning-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Reimbursed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${calculateTotalExpenses(myExpenses || [], 'reimbursed').toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Expense Claims - hidden for admin users */}
        {user?.role !== 'admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Expense Claims</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Submit Expense Claim</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Expense Title</Label>
                          <Input
                            id="title"
                            placeholder="e.g., Business lunch with client"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="amount">Amount ($)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense category" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map(category => (
                              <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Provide details about the expense"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Receipt</Label>
                        <div className="flex items-center space-x-2">
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleUploadComplete}
                            buttonClassName="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {formData.receiptUrl ? "Receipt Uploaded ✓" : "Upload Receipt"}
                          </ObjectUploader>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Upload a photo or scan of your receipt (Max 5MB)
                        </p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createExpenseMutation.isPending}>
                          {createExpenseMutation.isPending ? "Submitting..." : "Submit Claim"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myExpensesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-neutral-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : myExpenses?.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600">No expense claims found</p>
                    <p className="text-sm text-neutral-500">Click "Submit Expense" to create your first claim</p>
                  </div>
                ) : (
                  myExpenses?.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Receipt className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-neutral-900">{expense.title}</h3>
                            {getStatusBadge(expense.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-neutral-600">
                            <span className="font-medium">${parseFloat(expense.amount).toFixed(2)}</span>
                            <span className="capitalize">{expense.category}</span>
                            <span>{format(new Date(expense.submissionDate), 'MMM dd, yyyy')}</span>
                            {expense.receiptUrl && (
                              <div className="flex items-center space-x-1">
                                <FileText className="h-3 w-3" />
                                <span>Receipt</span>
                              </div>
                            )}
                          </div>
                          {expense.description && (
                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{expense.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {expense.reimbursementDate && (
                          <p className="text-xs text-success-600">
                            Reimbursed {format(new Date(expense.reimbursementDate), 'MMM dd')}
                          </p>
                        )}
                        {expense.approvalDate && !expense.reimbursementDate && (
                          <p className="text-xs text-primary-600">
                            Approved {format(new Date(expense.approvalDate), 'MMM dd')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Approvals (Managers/Admins only) */}
        {(user?.role === 'manager' || user?.role === 'admin') && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingExpensesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-24 bg-neutral-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : pendingExpenses?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-4" />
                    <p className="text-neutral-600">No pending approvals</p>
                    <p className="text-sm text-neutral-500">All expense claims have been processed</p>
                  </div>
                ) : (
                  pendingExpenses?.map((expense) => (
                    <div key={expense.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {expense.user?.firstName} {expense.user?.lastName}
                            </p>
                            <p className="text-xs text-neutral-600">{expense.user?.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-neutral-900">${parseFloat(expense.amount).toFixed(2)}</p>
                          <p className="text-xs text-neutral-600 capitalize">{expense.category}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-neutral-900 mb-1">{expense.title}</h4>
                        {expense.description && (
                          <p className="text-xs text-neutral-600">{expense.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-neutral-500 mt-2">
                          <span>{format(new Date(expense.submissionDate), 'MMM dd, yyyy')}</span>
                          {expense.receiptUrl && (
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>Receipt attached</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateExpenseStatusMutation.mutate({ id: expense.id, status: 'rejected' })}
                          disabled={updateExpenseStatusMutation.isPending}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateExpenseStatusMutation.mutate({ id: expense.id, status: 'approved' })}
                          disabled={updateExpenseStatusMutation.isPending}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
