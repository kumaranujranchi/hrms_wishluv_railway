import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  MessageSquare, 
  Users, 
  CalendarDays, 
  PlusCircle,
  Filter,
  Search
} from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

const leaveAssignmentSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  year: z.number().min(2024, "Year is required"),
  annualLeave: z.number().min(0, "Annual leave must be 0 or more"),
  sickLeave: z.number().min(0, "Sick leave must be 0 or more"),
  casualLeave: z.number().min(0, "Casual leave must be 0 or more"),
  maternityLeave: z.number().min(0, "Maternity leave must be 0 or more"),
  paternityLeave: z.number().min(0, "Paternity leave must be 0 or more"),
});

const leaveResponseSchema = z.object({
  status: z.enum(['approved', 'declined', 'clarification_needed']),
  notes: z.string().optional(),
});

type LeaveAssignment = z.infer<typeof leaveAssignmentSchema>;
type LeaveResponse = z.infer<typeof leaveResponseSchema>;

export default function AdminLeaveManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Fetch leave requests
  const { data: leaveRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/admin/leave-requests'],
  });

  // Fetch employees for leave assignment
  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch leave assignments
  const { data: leaveAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/admin/leave-assignments'],
  });

  // Leave assignment form
  const assignForm = useForm<LeaveAssignment>({
    resolver: zodResolver(leaveAssignmentSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      annualLeave: 21,
      sickLeave: 7,
      casualLeave: 7,
      maternityLeave: 84,
      paternityLeave: 15,
    }
  });

  // Leave response form
  const responseForm = useForm<LeaveResponse>({
    resolver: zodResolver(leaveResponseSchema),
    defaultValues: {
      status: 'approved',
      notes: '',
    }
  });

  // Create leave assignment mutation
  const assignLeavesMutation = useMutation({
    mutationFn: async (data: LeaveAssignment) => {
      const response = await fetch('/api/admin/leave-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create leave assignment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave allocation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leave-assignments'] });
      setAssignDialogOpen(false);
      assignForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create leave allocation",
        variant: "destructive",
      });
    },
  });

  // Respond to leave request mutation
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string, data: LeaveResponse }) => {
      const response = await fetch(`/api/admin/leave-requests/${requestId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to respond to leave request');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leave-requests'] });
      setResponseDialogOpen(false);
      responseForm.reset();
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update leave request",
        variant: "destructive",
      });
    },
  });

  const handleAssignLeaves = (data: LeaveAssignment) => {
    assignLeavesMutation.mutate(data);
  };

  const handleRespondToRequest = (data: LeaveResponse) => {
    if (!selectedRequest) return;
    respondToRequestMutation.mutate({
      requestId: selectedRequest.id,
      data,
    });
  };

  const openResponseDialog = (request: any, status: 'approved' | 'declined' | 'clarification_needed') => {
    setSelectedRequest(request);
    responseForm.setValue('status', status);
    setResponseDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      clarification_needed: "bg-blue-100 text-blue-800",
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredRequests = (leaveRequests as any[])?.filter((request: any) => {
    const matchesTab = selectedTab === "all" || request.status === selectedTab;
    const matchesFilter = filterStatus === "all" || request.status === filterStatus;
    const matchesSearch = searchQuery === "" || 
      request.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesFilter && matchesSearch;
  }) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Leave Management</h1>
            <p className="text-neutral-600">Manage employee leave requests and allocations</p>
          </div>
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Assign Leaves
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Leave Allocation</DialogTitle>
                <DialogDescription>
                  Set annual leave allocation for an employee
                </DialogDescription>
              </DialogHeader>
              <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(handleAssignLeaves)} className="space-y-4">
                  <FormField
                    control={assignForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(employees as any[])?.map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={assignForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={assignForm.control}
                      name="annualLeave"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Leave</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={assignForm.control}
                      name="sickLeave"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sick Leave</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={assignForm.control}
                      name="casualLeave"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Casual Leave</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={assignForm.control}
                      name="maternityLeave"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maternity Leave</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setAssignDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={assignLeavesMutation.isPending}
                    >
                      {assignLeavesMutation.isPending ? "Assigning..." : "Assign Leaves"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pending">Pending Requests</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="declined">Declined</TabsTrigger>
              <TabsTrigger value="assignments">Leave Assignments</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Leave Requests</CardTitle>
                <CardDescription>
                  Review and approve or decline employee leave requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-neutral-500 mt-2">Loading requests...</p>
                  </div>
                ) : filteredRequests.filter((req: any) => req.status === 'pending').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500">No pending leave requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.filter((req: any) => req.status === 'pending').map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={request.user?.profileImage || "https://imagizer.imageshack.com/img924/9256/E2qQnT.png"} />
                              <AvatarFallback>
                                {request.user?.firstName?.[0]}{request.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-neutral-900">
                                {request.user?.firstName} {request.user?.lastName}
                              </p>
                              <p className="text-sm text-neutral-500">
                                {request.user?.department} • {request.user?.position}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-neutral-500">Type</p>
                            <p className="font-medium capitalize">{request.type?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Start Date</p>
                            <p className="font-medium">
                              {new Date(request.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500">End Date</p>
                            <p className="font-medium">
                              {new Date(request.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Duration</p>
                            <p className="font-medium">{request.days} days</p>
                          </div>
                        </div>

                        {request.reason && (
                          <div>
                            <p className="text-sm text-neutral-500 mb-1">Reason</p>
                            <p className="text-sm bg-neutral-50 p-2 rounded">{request.reason}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openResponseDialog(request, 'clarification_needed')}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Ask Clarification
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openResponseDialog(request, 'declined')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => openResponseDialog(request, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Approved Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Approved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.filter((req: any) => req.status === 'approved').map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {request.user?.firstName?.[0]}{request.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{request.user?.firstName} {request.user?.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{request.type?.replace('_', ' ')}</TableCell>
                        <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{request.days} days</TableCell>
                        <TableCell>{request.approver?.firstName} {request.approver?.lastName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="declined" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Declined Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.filter((req: any) => req.status === 'declined').map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {request.user?.firstName?.[0]}{request.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{request.user?.firstName} {request.user?.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{request.type?.replace('_', ' ')}</TableCell>
                        <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{request.days} days</TableCell>
                        <TableCell>{request.approverNotes || 'No reason provided'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Assignments</CardTitle>
                <CardDescription>
                  View and manage employee leave allocations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignmentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-neutral-500 mt-2">Loading assignments...</p>
                  </div>
                ) : !(leaveAssignments as any[])?.length ? (
                  <div className="text-center py-8">
                    <CalendarDays className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500">No leave assignments found</p>
                    <p className="text-sm text-neutral-400">Click "Assign Leaves" to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Annual</TableHead>
                        <TableHead>Sick</TableHead>
                        <TableHead>Casual</TableHead>
                        <TableHead>Maternity</TableHead>
                        <TableHead>Paternity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(leaveAssignments as any[])?.map((assignment: any) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {assignment.user?.firstName?.[0]}{assignment.user?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>{assignment.user?.firstName} {assignment.user?.lastName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{assignment.year}</TableCell>
                          <TableCell>
                            <span className="text-green-600">{assignment.annualLeave}</span>
                            <span className="text-neutral-400">/{assignment.annualUsed || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600">{assignment.sickLeave}</span>
                            <span className="text-neutral-400">/{assignment.sickUsed || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600">{assignment.casualLeave}</span>
                            <span className="text-neutral-400">/{assignment.casualUsed || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600">{assignment.maternityLeave}</span>
                            <span className="text-neutral-400">/{assignment.maternityUsed || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600">{assignment.paternityLeave}</span>
                            <span className="text-neutral-400">/{assignment.paternityUsed || 0}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Response Dialog */}
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {responseForm.watch('status') === 'approved' ? 'Approve' : 
                 responseForm.watch('status') === 'declined' ? 'Decline' : 'Request Clarification'}
                Leave Request
              </DialogTitle>
              <DialogDescription>
                {selectedRequest && (
                  <>
                    {selectedRequest.user?.firstName} {selectedRequest.user?.lastName} - 
                    {selectedRequest.type?.replace('_', ' ')} leave for {selectedRequest.days} days
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <Form {...responseForm}>
              <form onSubmit={responseForm.handleSubmit(handleRespondToRequest)} className="space-y-4">
                <FormField
                  control={responseForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {responseForm.watch('status') === 'clarification_needed' 
                          ? 'What clarification is needed?' 
                          : 'Notes (optional)'}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder={
                            responseForm.watch('status') === 'approved' 
                              ? 'Add any approval notes...' 
                              : responseForm.watch('status') === 'declined'
                              ? 'Please explain why this request was declined...'
                              : 'What additional information do you need?'
                          }
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setResponseDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={respondToRequestMutation.isPending}
                    className={
                      responseForm.watch('status') === 'approved' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : responseForm.watch('status') === 'declined'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }
                  >
                    {respondToRequestMutation.isPending 
                      ? "Processing..." 
                      : responseForm.watch('status') === 'approved' 
                      ? 'Approve Request'
                      : responseForm.watch('status') === 'declined'
                      ? 'Decline Request' 
                      : 'Request Clarification'
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}