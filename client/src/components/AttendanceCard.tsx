import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

interface TodayAttendance {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  location: string | null;
}

export default function AttendanceCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<string>("");

  const { data: todayAttendance, isLoading } = useQuery<TodayAttendance>({
    queryKey: ["/api/attendance/today"],
  });

  const checkInMutation = useMutation({
    mutationFn: async (location: string) => {
      await apiRequest("POST", "/api/attendance/check-in", { location });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checked in successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/attendance/check-out", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checked out successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation(locationStr);
          checkInMutation.mutate(locationStr);
        },
        (error) => {
          console.error("Error getting location:", error);
          checkInMutation.mutate("Location not available");
        }
      );
    } else {
      checkInMutation.mutate("Geolocation not supported");
    }
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-neutral-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const hasCheckedIn = todayAttendance?.checkIn;
  const hasCheckedOut = todayAttendance?.checkOut;
  const currentTime = new Date().toLocaleTimeString();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Today's Attendance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">{currentTime}</div>
            {hasCheckedIn && (
              <Badge className="badge-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Checked In
              </Badge>
            )}
            {hasCheckedOut && (
              <Badge className="badge-primary">
                <XCircle className="h-3 w-3 mr-1" />
                Checked Out
              </Badge>
            )}
          </div>
        </div>

        {/* Attendance Details */}
        {hasCheckedIn && (
          <div className="space-y-2 text-sm text-neutral-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Check-in: {new Date(todayAttendance.checkIn!).toLocaleTimeString()}</span>
            </div>
            {todayAttendance.checkOut && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Check-out: {new Date(todayAttendance.checkOut).toLocaleTimeString()}</span>
              </div>
            )}
            {todayAttendance.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location: Office</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!hasCheckedIn ? (
            <Button 
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending}
              className="flex-1"
            >
              {checkInMutation.isPending ? "Checking In..." : "Check In"}
            </Button>
          ) : !hasCheckedOut ? (
            <Button 
              onClick={handleCheckOut}
              disabled={checkOutMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {checkOutMutation.isPending ? "Checking Out..." : "Check Out"}
            </Button>
          ) : (
            <div className="flex-1 text-center py-2 text-sm text-success-600 font-medium">
              ✓ Attendance completed for today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
