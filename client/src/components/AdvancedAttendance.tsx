import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import GeoFencing from './GeoFencing';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  Timer, 
  CheckCircle, 
  XCircle,
  BarChart3,
  TrendingUp
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  checkIn: string;
  checkOut?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  workingHours?: number;
  status: 'present' | 'late' | 'absent' | 'partial';
  notes?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  averageHours: number;
  attendanceRate: number;
}

export default function AdvancedAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGeoVerificationRequired, setIsGeoVerificationRequired] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: todayAttendance } = useQuery<AttendanceRecord>({
    queryKey: ['/api/attendance/today'],
  });

  const { data: attendanceStats } = useQuery<AttendanceStats>({
    queryKey: ['/api/attendance/stats'],
  });

  const checkInMutation = useMutation({
    mutationFn: async (locationData: any) => {
      return apiRequest('POST', '/api/attendance/check-in', {
        timestamp: new Date().toISOString(),
        location: locationData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/stats'] });
      toast({
        title: "Checked In Successfully",
        description: `Welcome back! Your attendance has been recorded.`,
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (locationData: any) => {
      return apiRequest('POST', '/api/attendance/check-out', {
        timestamp: new Date().toISOString(),
        location: locationData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/stats'] });
      toast({
        title: "Checked Out Successfully",
        description: "Have a great day! Your work hours have been recorded.",
      });
    },
  });

  const handleCheckIn = () => {
    setIsGeoVerificationRequired(true);
  };

  const handleCheckOut = () => {
    if (userLocation) {
      checkOutMutation.mutate(userLocation);
    } else {
      setIsGeoVerificationRequired(true);
    }
  };

  const handleLocationVerified = (location: any, isWithinBounds: boolean) => {
    setUserLocation(location);
    
    if (!todayAttendance?.checkIn) {
      checkInMutation.mutate({ ...location, withinBounds: isWithinBounds });
    } else if (todayAttendance.checkIn && !todayAttendance.checkOut) {
      checkOutMutation.mutate({ ...location, withinBounds: isWithinBounds });
    }
    
    setIsGeoVerificationRequired(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800">Late</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateWorkingHours = () => {
    if (!todayAttendance?.checkIn) return 0;
    
    const checkInTime = new Date(todayAttendance.checkIn);
    const checkOutTime = todayAttendance.checkOut 
      ? new Date(todayAttendance.checkOut)
      : currentTime;
    
    return Math.max(0, (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
  };

  const workingHours = calculateWorkingHours();

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Attendance Status</span>
            </div>
            {todayAttendance && getStatusBadge(todayAttendance.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Time */}
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-900">
                {formatTime(currentTime)}
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Check-in/Check-out Status */}
            <div className="text-center">
              {!todayAttendance?.checkIn ? (
                <Button 
                  onClick={handleCheckIn}
                  disabled={checkInMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {checkInMutation.isPending ? 'Checking In...' : 'Check In'}
                </Button>
              ) : !todayAttendance.checkOut ? (
                <Button 
                  onClick={handleCheckOut}
                  disabled={checkOutMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out'}
                </Button>
              ) : (
                <div>
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-600 font-medium">Day Complete</p>
                </div>
              )}
            </div>

            {/* Working Hours */}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {workingHours.toFixed(1)}h
              </div>
              <p className="text-sm text-neutral-600">Working Hours Today</p>
              <Progress 
                value={Math.min((workingHours / 8) * 100, 100)} 
                className="mt-2 h-2" 
              />
            </div>
          </div>

          {/* Today's Timeline */}
          {todayAttendance && (
            <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
              <h4 className="font-medium mb-3">Today's Timeline</h4>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Check-in: {new Date(todayAttendance.checkIn).toLocaleTimeString()}</span>
                </div>
                {todayAttendance.checkOut && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Check-out: {new Date(todayAttendance.checkOut).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geo-fencing Component */}
      {isGeoVerificationRequired && (
        <GeoFencing 
          onLocationVerified={handleLocationVerified}
          isRequired={true}
        />
      )}

      {/* Attendance Statistics */}
      {attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {attendanceStats.attendanceRate}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Present Days</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {attendanceStats.presentDays}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Late Days</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {attendanceStats.lateDays}
                  </p>
                </div>
                <Timer className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Avg Hours</p>
                  <p className="text-2xl font-bold text-warning-600">
                    {attendanceStats.averageHours.toFixed(1)}h
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-warning-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}