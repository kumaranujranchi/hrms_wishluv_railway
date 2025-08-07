import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import AttendanceCard from "@/components/AttendanceCard";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  MapPin, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Filter
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  location: string | null;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });

  const { data: attendanceRecords, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance/my", dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    retry: false,
  });

  useEffect(() => {
    const checkError = async () => {
      try {
        // This will trigger the error handling if unauthorized
      } catch (error) {
        if (isUnauthorizedError(error as Error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
          return;
        }
      }
    };
    checkError();
  }, [toast]);

  const getStatusBadge = (status: string, checkIn: string | null, checkOut: string | null) => {
    if (status === 'present') {
      if (checkOut) {
        return <Badge className="badge-success"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>;
      } else if (checkIn) {
        return <Badge className="badge-primary"><Clock className="h-3 w-3 mr-1" />Checked In</Badge>;
      }
    } else if (status === 'late') {
      return <Badge className="badge-warning"><AlertCircle className="h-3 w-3 mr-1" />Late</Badge>;
    } else if (status === 'absent') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const calculateWorkingHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return "N/A";
    
    const inTime = new Date(checkIn);
    const outTime = new Date(checkOut);
    const diffMs = outTime.getTime() - inTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-32 bg-neutral-200 rounded-lg mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-neutral-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Today's Attendance Card */}
        <AttendanceCard />

        {/* Attendance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Days</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {attendanceRecords?.length || 0}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Present</p>
                  <p className="text-2xl font-bold text-success-600">
                    {attendanceRecords?.filter(r => r.status === 'present').length || 0}
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
                  <p className="text-sm font-medium text-neutral-600">Late</p>
                  <p className="text-2xl font-bold text-warning-600">
                    {attendanceRecords?.filter(r => r.status === 'late').length || 0}
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
                  <p className="text-sm font-medium text-neutral-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {attendanceRecords?.filter(r => r.status === 'absent').length || 0}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance History</CardTitle>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceRecords?.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No attendance records found</p>
                  <p className="text-sm text-neutral-500">Start by checking in to track your attendance</p>
                </div>
              ) : (
                attendanceRecords?.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-900">
                          {format(new Date(record.date), 'MMM dd')}
                        </p>
                        <p className="text-xs text-neutral-600">
                          {format(new Date(record.date), 'yyyy')}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusBadge(record.status, record.checkIn, record.checkOut)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          {record.checkIn && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>In: {format(new Date(record.checkIn), 'HH:mm')}</span>
                            </div>
                          )}
                          {record.checkOut && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Out: {format(new Date(record.checkOut), 'HH:mm')}</span>
                            </div>
                          )}
                          {record.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>Office</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900">
                        {calculateWorkingHours(record.checkIn, record.checkOut)}
                      </p>
                      <p className="text-xs text-neutral-600">Working Hours</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
