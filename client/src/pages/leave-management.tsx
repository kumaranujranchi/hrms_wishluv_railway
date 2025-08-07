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
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
}

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const { data: myLeaves, isLoading: myLeavesLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leaves/my"],
  });

  const { data: pendingLeaves, isLoading: pendingLeavesLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leaves/pending"],
    enabled: user?.role === 'manager' || user?.role === 'admin',
  });

  const createLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      await apiRequest("POST", "/api/leaves", {
        ...data,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request submitted successfully!",
      });
      setIsDialogOpen(false);
      setFormData({ type: '', startDate: '', endDate: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ["/api/leaves/my"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      await apiRequest("PUT", `/api/leaves/${id}/status`, { status, notes });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leaves/pending"] });
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
    createLeaveMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="badge-success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="badge-warning"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Leave</p>
                  <p className="text-2xl font-bold text-neutral-900">24</p>
                </div>
                <Calendar className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Used</p>
                  <p className="text-2xl font-bold text-warning-600">
                    {myLeaves?.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0) || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Remaining</p>
                  <p className="text-2xl font-bold text-success-600">
                    {24 - (myLeaves?.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0) || 0)}
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
                  <p className="text-2xl font-bold text-blue-600">
                    {myLeaves?.filter(l => l.status === 'pending').length || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Leave Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Leave Requests</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Leave
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="type">Leave Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {leaveTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reason">Reason</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please provide a reason for your leave request"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createLeaveMutation.isPending}>
                        {createLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myLeavesLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-neutral-200 rounded-lg"></div>
                  ))}
                </div>
              ) : myLeaves?.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No leave requests found</p>
                  <p className="text-sm text-neutral-500">Click "Request Leave" to create your first request</p>
                </div>
              ) : (
                myLeaves?.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-900 capitalize">{leave.type}</p>
                        <p className="text-xs text-neutral-600">{leave.days} days</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusBadge(leave.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <span>{format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}</span>
                        </div>
                        {leave.reason && (
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{leave.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">
                        Requested {format(new Date(leave.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals (Managers/Admins only) */}
        {(user?.role === 'manager' || user?.role === 'admin') && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingLeavesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 bg-neutral-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : pendingLeaves?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-4" />
                    <p className="text-neutral-600">No pending approvals</p>
                    <p className="text-sm text-neutral-500">All leave requests have been processed</p>
                  </div>
                ) : (
                  pendingLeaves?.map((leave) => (
                    <div key={leave.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {leave.user?.firstName} {leave.user?.lastName}
                            </p>
                            <p className="text-xs text-neutral-600">{leave.user?.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-neutral-900 capitalize">{leave.type}</p>
                          <p className="text-xs text-neutral-600">{leave.days} days</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-neutral-600">
                            {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                          </p>
                          {leave.reason && (
                            <p className="text-xs text-neutral-500 mt-1">{leave.reason}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateLeaveStatusMutation.mutate({ id: leave.id, status: 'rejected' })}
                            disabled={updateLeaveStatusMutation.isPending}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateLeaveStatusMutation.mutate({ id: leave.id, status: 'approved' })}
                            disabled={updateLeaveStatusMutation.isPending}
                          >
                            Approve
                          </Button>
                        </div>
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
