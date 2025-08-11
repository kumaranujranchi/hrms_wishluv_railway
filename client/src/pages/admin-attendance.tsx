import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  TrendingUp, 
  Download,
  MapPin,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { isUnauthorizedError } from "@/lib/authUtils";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  location: string | null;
  locationName: string | null;
  latitude: string | null;
  longitude: string | null;
  reason: string | null;
  checkOutReason: string | null;
  userName: string;
  userEmail: string;
  userId: string;
  isOutOfOffice?: boolean;
  isOutOfOfficeCheckOut?: boolean;
  distanceFromOffice?: string | number;
  checkOutDistanceFromOffice?: string | number;
  workingHours?: number;
}

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  averageWorkingHours: number;
}

export default function AdminAttendancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [activeTab, setActiveTab] = useState("today");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Redirect non-admin users
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "This page is only accessible to administrators.",
        variant: "destructive",
      });
      window.location.href = '/dashboard';
    }
  }, [user, toast]);

  // Today's attendance data
  const { data: todayAttendance, isLoading: loadingToday } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/admin/attendance/today"],
    retry: false,
    enabled: !!user && user.role === 'admin'
  });

  // Date range attendance data  
  const { data: rangeAttendance, isLoading: loadingRange } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/admin/attendance/range", dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    retry: false,
    enabled: !!user && user.role === 'admin' && activeTab === "range"
  });

  // Attendance statistics
  const { data: attendanceStats, isLoading: loadingStats } = useQuery<AttendanceStats>({
    queryKey: ["/api/admin/attendance/stats"],
    retry: false,
    enabled: !!user && user.role === 'admin'
  });

  const getStatusBadge = (status: string, checkIn: string | null, checkOut: string | null, isOutOfOffice?: boolean, isOutOfOfficeCheckOut?: boolean) => {
    if (status === 'present' || status === 'out_of_office') {
      if (checkOut) {
        if (isOutOfOfficeCheckOut) {
          return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300"><MapPin className="h-3 w-3 mr-1" />Complete (Out of Office)</Badge>;
        }
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>;
      } else if (checkIn) {
        if (isOutOfOffice) {
          return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300"><MapPin className="h-3 w-3 mr-1" />Checked In (Out of Office)</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"><Clock className="h-3 w-3 mr-1" />Checked In</Badge>;
      }
    } else if (status === 'late') {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"><AlertCircle className="h-3 w-3 mr-1" />Late</Badge>;
    } else if (status === 'absent') {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    return format(new Date(timeString), "hh:mm a");
  };

  const formatWorkingHours = (hours: number | undefined) => {
    if (!hours) return "N/A";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const toggleRowExpansion = (recordId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  // Location Display Component
  const LocationDisplay = ({ record }: { record: AttendanceRecord }) => {
    const [locationName, setLocationName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      const fetchLocationName = async () => {
        if (record.locationName) {
          setLocationName(record.locationName);
          return;
        }

        if (record.latitude && record.longitude) {
          setIsLoading(true);
          try {
            const response = await fetch(`/api/reverse-geocode?lat=${record.latitude}&lon=${record.longitude}`);
            const data = await response.json();
            setLocationName(data.name || data.address || 'Unknown Location');
          } catch (error) {
            console.error('Failed to fetch location:', error);
            setLocationName('Unknown Location');
          } finally {
            setIsLoading(false);
          }
        } else {
          setLocationName(record.location || 'Unknown Location');
        }
      };

      fetchLocationName();
    }, [record.latitude, record.longitude, record.location, record.locationName]);

    if (isLoading) {
      return <span className="text-xs text-gray-500">Loading...</span>;
    }

    return (
      <div className="text-sm max-w-xs">
        {record.isOutOfOffice ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            <MapPin className="h-3 w-3 mr-1" />
            {locationName}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <MapPin className="h-3 w-3 mr-1" />
            {locationName}
          </Badge>
        )}
      </div>
    );
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Attendance Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor and manage employee attendance across your organization
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {attendanceStats?.totalEmployees || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {attendanceStats?.presentToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {attendanceStats?.lateToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {attendanceStats?.absentToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Working Hours</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatWorkingHours(attendanceStats?.averageWorkingHours)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Data Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="today">Today's Attendance</TabsTrigger>
                <TabsTrigger value="range">Date Range</TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Working Hours</TableHead>
                        <TableHead>Check-in Location</TableHead>
                        <TableHead>Check-out Location</TableHead>
                        <TableHead>Check-in Reason</TableHead>
                        <TableHead>Check-out Reason</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingToday ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8">
                            Loading attendance data...
                          </TableCell>
                        </TableRow>
                      ) : todayAttendance && todayAttendance.length > 0 ? (
                        todayAttendance.map((record) => (
                          <React.Fragment key={record.id}>
                            <TableRow>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{record.userName}</p>
                                  <p className="text-sm text-gray-500">{record.userEmail}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(record.status, record.checkIn, record.checkOut, record.isOutOfOffice, record.isOutOfOfficeCheckOut)}
                              </TableCell>
                              <TableCell>{formatTime(record.checkIn)}</TableCell>
                              <TableCell>{formatTime(record.checkOut)}</TableCell>
                              <TableCell>{formatWorkingHours(record.workingHours)}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {record.isOutOfOffice ? (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      Out of Office
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      In Office
                                    </Badge>
                                  )}
                                  {record.isOutOfOffice && record.distanceFromOffice && (
                                    <div className="text-xs text-amber-600">
                                      {Math.round(Number(record.distanceFromOffice))}m from office
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {record.checkOut ? (
                                  <div className="space-y-1">
                                    {record.isOutOfOfficeCheckOut ? (
                                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        Out of Office
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        In Office
                                      </Badge>
                                    )}
                                    {record.isOutOfOfficeCheckOut && record.checkOutDistanceFromOffice && (
                                      <div className="text-xs text-orange-600">
                                        {Math.round(Number(record.checkOutDistanceFromOffice))}m from office
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.reason ? (
                                  <div className="text-xs p-2 bg-amber-50 rounded border border-amber-200 max-w-xs">
                                    <div className="font-medium text-amber-800 mb-1">Reason:</div>
                                    <div className="text-amber-700">{record.reason}</div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.checkOutReason ? (
                                  <div className="text-xs p-2 bg-orange-50 rounded border border-orange-200 max-w-xs">
                                    <div className="font-medium text-orange-800 mb-1">Reason:</div>
                                    <div className="text-orange-700">{record.checkOutReason}</div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpansion(record.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {expandedRows[record.id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedRows[record.id] && (
                              <TableRow>
                                <TableCell colSpan={10} className="bg-gray-50 dark:bg-gray-900">
                                  <div className="p-4 space-y-4">
                                    <h4 className="font-semibold text-sm">Location Details</h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <h5 className="font-medium text-xs text-gray-600">Check-in Location</h5>
                                        <div className="text-sm">
                                          <LocationDisplay record={record} />
                                        </div>
                                        {record.latitude && record.longitude && (
                                          <div className="text-xs text-gray-500 font-mono">
                                            <div>Lat: {parseFloat(record.latitude).toFixed(6)}</div>
                                            <div>Lng: {parseFloat(record.longitude).toFixed(6)}</div>
                                          </div>
                                        )}
                                      </div>
                                      {record.checkOut && (
                                        <div className="space-y-2">
                                          <h5 className="font-medium text-xs text-gray-600">Check-out Location</h5>
                                          <div className="text-sm">
                                            {record.isOutOfOfficeCheckOut ? (
                                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                Out of Office Location
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                Office Location
                                              </Badge>
                                            )}
                                          </div>
                                          {record.latitude && record.longitude && (
                                            <div className="text-xs text-gray-500 font-mono">
                                              <div>Checkout Coordinates Available</div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                            No attendance records found for today
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="range" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Date Range:</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          {format(dateRange.startDate, "MMM dd")} - {format(dateRange.endDate, "MMM dd, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={{
                            from: dateRange.startDate,
                            to: dateRange.endDate,
                          }}
                          onSelect={(range) => {
                            if (range?.from && range?.to) {
                              setDateRange({
                                startDate: range.from,
                                endDate: range.to
                              });
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Working Hours</TableHead>
                        <TableHead>Check-in Location</TableHead>
                        <TableHead>Check-out Location</TableHead>
                        <TableHead>Check-in Reason</TableHead>
                        <TableHead>Check-out Reason</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingRange ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8">
                            Loading attendance data...
                          </TableCell>
                        </TableRow>
                      ) : rangeAttendance && rangeAttendance.length > 0 ? (
                        rangeAttendance.map((record) => (
                          <React.Fragment key={record.id}>
                            <TableRow>
                              <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{record.userName}</p>
                                  <p className="text-sm text-gray-500">{record.userEmail}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(record.status, record.checkIn, record.checkOut, record.isOutOfOffice, record.isOutOfOfficeCheckOut)}
                              </TableCell>
                              <TableCell>{formatTime(record.checkIn)}</TableCell>
                              <TableCell>{formatTime(record.checkOut)}</TableCell>
                              <TableCell>{formatWorkingHours(record.workingHours)}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {record.isOutOfOffice ? (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      Out of Office
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      In Office
                                    </Badge>
                                  )}
                                  {record.isOutOfOffice && record.distanceFromOffice && (
                                    <div className="text-xs text-amber-600">
                                      {Math.round(Number(record.distanceFromOffice))}m from office
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {record.checkOut ? (
                                  <div className="space-y-1">
                                    {record.isOutOfOfficeCheckOut ? (
                                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        Out of Office
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        In Office
                                      </Badge>
                                    )}
                                    {record.isOutOfOfficeCheckOut && record.checkOutDistanceFromOffice && (
                                      <div className="text-xs text-orange-600">
                                        {Math.round(Number(record.checkOutDistanceFromOffice))}m from office
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.reason ? (
                                  <div className="text-xs p-2 bg-amber-50 rounded border border-amber-200 max-w-xs">
                                    <div className="font-medium text-amber-800 mb-1">Reason:</div>
                                    <div className="text-amber-700">{record.reason}</div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.checkOutReason ? (
                                  <div className="text-xs p-2 bg-orange-50 rounded border border-orange-200 max-w-xs">
                                    <div className="font-medium text-orange-800 mb-1">Reason:</div>
                                    <div className="text-orange-700">{record.checkOutReason}</div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpansion(record.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {expandedRows[record.id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedRows[record.id] && (
                              <TableRow>
                                <TableCell colSpan={11} className="bg-gray-50 dark:bg-gray-900">
                                  <div className="p-4 space-y-4">
                                    <h4 className="font-semibold text-sm">Location Details</h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <h5 className="font-medium text-xs text-gray-600">Check-in Location</h5>
                                        <div className="text-sm">
                                          <LocationDisplay record={record} />
                                        </div>
                                        {record.latitude && record.longitude && (
                                          <div className="text-xs text-gray-500 font-mono">
                                            <div>Lat: {parseFloat(record.latitude).toFixed(6)}</div>
                                            <div>Lng: {parseFloat(record.longitude).toFixed(6)}</div>
                                          </div>
                                        )}
                                      </div>
                                      {record.checkOut && (
                                        <div className="space-y-2">
                                          <h5 className="font-medium text-xs text-gray-600">Check-out Location</h5>
                                          <div className="text-sm">
                                            {record.isOutOfOfficeCheckOut ? (
                                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                Out of Office Location
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                Office Location
                                              </Badge>
                                            )}
                                          </div>
                                          {record.latitude && record.longitude && (
                                            <div className="text-xs text-gray-500 font-mono">
                                              <div>Checkout Coordinates Available</div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                            No attendance records found for the selected date range
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}