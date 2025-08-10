import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Loader2,
  Zap,
  Sunrise,
  Sunset
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AttendanceStatus {
  isCheckedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  todayStatus?: string;
}

export default function AttendanceCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get current attendance status
  const { data: attendanceStatus, isLoading: statusLoading } = useQuery<AttendanceStatus>({
    queryKey: ["/api/attendance/status"],
    retry: false,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; locationName: string }) => {
      return apiRequest("POST", "/api/attendance/check-in", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/my"] });
      toast({
        title: "Check-in successful!",
        description: "Welcome to work! Have a productive day.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; locationName: string }) => {
      return apiRequest("POST", "/api/attendance/check-out", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/my"] });
      toast({
        title: "Check-out successful!",
        description: "Thank you for your hard work today!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Check-out failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number; name: string }> => {
    setIsLoadingLocation(true);
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Get location name using reverse geocoding
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
            );
            const data = await response.json();
            const locationName = data.results[0]?.formatted || "Unknown Location";
            
            resolve({ latitude, longitude, name: locationName });
          } catch (error) {
            // Fallback to coordinates if geocoding fails
            resolve({ latitude, longitude, name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          }
        },
        (error) => {
          reject(new Error("Unable to retrieve your location."));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  const handleCheckIn = async () => {
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      await checkInMutation.mutateAsync({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationName: locationData.name
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Unable to get your location. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      await checkOutMutation.mutateAsync({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationName: locationData.name
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Unable to get your location. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getWorkingHours = () => {
    if (!attendanceStatus?.checkInTime) return "00:00:00";
    
    const checkIn = new Date(attendanceStatus.checkInTime);
    const now = new Date();
    const diff = now.getTime() - checkIn.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWorkingHours = () => {
    const hour = currentTime.getHours();
    return hour >= 9 && hour <= 18; // 9 AM to 6 PM
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="stat-card overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="h-5 w-5 text-green-600" />
              </motion.div>
              Today's Attendance
            </CardTitle>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Badge 
                variant={attendanceStatus?.isCheckedIn ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {attendanceStatus?.isCheckedIn ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Checked In
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Not Checked In
                  </>
                )}
              </Badge>
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Time Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-3xl font-bold gradient-text-primary mb-2">
              {formatTime(currentTime)}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </motion.div>

          {/* Working Hours Timer */}
          {attendanceStatus?.isCheckedIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Working Time</span>
              </div>
              <div className="text-2xl font-mono font-bold text-green-600">
                {getWorkingHours()}
              </div>
            </motion.div>
          )}

          {/* Check-in/Check-out Times */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center p-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Sunrise className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Check In</span>
              </div>
              <div className="text-sm font-mono font-semibold text-orange-600">
                {attendanceStatus?.checkInTime 
                  ? formatTime(new Date(attendanceStatus.checkInTime))
                  : "Not yet"
                }
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Sunset className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Check Out</span>
              </div>
              <div className="text-sm font-mono font-semibold text-purple-600">
                {attendanceStatus?.checkOutTime 
                  ? formatTime(new Date(attendanceStatus.checkOutTime))
                  : "Not yet"
                }
              </div>
            </motion.div>
          </div>

          {/* Location Display */}
          {location && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
            >
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700 truncate">{location.name}</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!attendanceStatus?.isCheckedIn ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="flex-1"
              >
                <Button
                  onClick={handleCheckIn}
                  disabled={checkInMutation.isPending || isLoadingLocation}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {checkInMutation.isPending || isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Check In
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="flex-1"
              >
                <Button
                  onClick={handleCheckOut}
                  disabled={checkOutMutation.isPending || isLoadingLocation}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  {checkOutMutation.isPending || isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Check Out
                </Button>
              </motion.div>
            )}
          </div>

          {/* Working Hours Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <Badge 
              variant={isWorkingHours() ? "default" : "secondary"}
              className="text-xs"
            >
              {isWorkingHours() ? "🟢 Working Hours" : "🔴 Outside Working Hours"}
            </Badge>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
