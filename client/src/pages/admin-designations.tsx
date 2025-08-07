import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Plus, Pencil, Building, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Designation, InsertDesignation, Department } from "@shared/schema";
import { insertDesignationSchema } from "@shared/schema";

export default function AdminDesignationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);

  const form = useForm<InsertDesignation>({
    resolver: zodResolver(insertDesignationSchema),
    defaultValues: {
      name: "",
      description: "",
      departmentId: "",
    },
  });

  const { data: designations, isLoading } = useQuery<(Designation & { department?: Department })[]>({
    queryKey: ["/api/designations"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDesignation) => {
      return await apiRequest("/api/designations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Designation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/designations"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create designation",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertDesignation & { id: string }) => {
      return await apiRequest(`/api/designations/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Designation updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/designations"] });
      setIsDialogOpen(false);
      setEditingDesignation(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update designation",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/designations/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Designation deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/designations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete designation",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertDesignation) => {
    if (editingDesignation) {
      updateMutation.mutate({ ...data, id: editingDesignation.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (designation: Designation) => {
    setEditingDesignation(designation);
    form.setValue("name", designation.name);
    form.setValue("description", designation.description || "");
    form.setValue("departmentId", designation.departmentId || "");
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this designation?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingDesignation(null);
    form.reset();
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-neutral-600 mt-2">Only admins can manage designations.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary-500" />
              Designation Management
            </h1>
            <p className="text-neutral-600 mt-1">
              Create and manage job designations within departments
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Designation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingDesignation ? "Edit Designation" : "Create New Designation"}
                </DialogTitle>
                <DialogDescription>
                  {editingDesignation 
                    ? "Update the designation information below."
                    : "Add a new job designation to assign to employees."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Software Engineer, HR Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {!departments?.length && "Create departments first to assign designations"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the role and responsibilities"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description to help define the designation's scope
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending || !departments?.length}
                    >
                      {createMutation.isPending || updateMutation.isPending ? "Saving..." : 
                       editingDesignation ? "Update Designation" : "Create Designation"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {!departments?.length ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Departments Available</h3>
              <p className="text-neutral-600 mb-4">
                You need to create departments first before adding designations.
              </p>
              <Button onClick={() => window.location.href = '/admin/departments'}>
                <Building className="h-4 w-4 mr-2" />
                Go to Departments
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-neutral-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-neutral-100 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-neutral-100 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-neutral-100 rounded animate-pulse w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : designations && designations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designations.map((designation) => (
              <Card key={designation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{designation.name}</CardTitle>
                      <CardDescription className="text-sm text-neutral-500 flex items-center mt-1">
                        <Building className="h-3 w-3 mr-1" />
                        {designation.department?.name || "No Department"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Role
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-700 text-sm mb-4">
                    {designation.description || "No description provided"}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <div className="flex items-center text-xs text-neutral-500">
                      <Users className="h-3 w-3 mr-1" />
                      <span>Active</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(designation)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(designation.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Designations Yet</h3>
              <p className="text-neutral-600 mb-4">
                Create job designations to define specific roles within your departments.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Designation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}