import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import GeoFencing from "./GeoFencing";
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Sunrise,
  Sunset,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface AttendanceStatus {
  isCheckedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  todayStatus?: string;
}

const OFFICE_GEOFENCING_CONFIG = {
  centerLat: 25.6146835780726,
  centerLng: 85.1126174983296,
  radiusMeters: 50,
  name: "Office Location",
  isEnabled: true,
  isRequired: true
};

export default function AttendanceCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number; locationName: string } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isWithinOfficeArea, setIsWithinOfficeArea] = useState<boolean>(false);
  const [locationVerified, setLocationVerified] = useState<boolean>(false);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [pendingAction, setPendingAction] = useState<'checkin' | 'checkout' | null>(null);

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

  // Debug logging
  console.log('Attendance Status:', attendanceStatus);
  console.log('Is Checked In:', attendanceStatus?.isCheckedIn);
  console.log('Check In Time:', attendanceStatus?.checkInTime);
  console.log('Check Out Time:', attendanceStatus?.checkOutTime);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; locationName: string; reason?: string }) => {
      return apiRequest("POST", "/api/attendance/check-in", data);
    },
    onSuccess: (data) => {
      console.log('Check-in successful:', data);
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
    mutationFn: async (data: { latitude: number; longitude: number; locationName: string; reason?: string }) => {
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

  const handleLocationVerified = (location: any, isWithinBounds: boolean) => {
    setIsWithinOfficeArea(isWithinBounds);
    setLocationVerified(true);
    if (location.latitude && location.longitude) {
      setLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        locationName: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
      });
    }
  };

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number; locationName: string }> => {
    setIsLoadingLocation(true);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('GPS coordinates obtained:', { latitude, longitude });

          try {
            // Get location name using our server endpoint
            const response = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);

            if (!response.ok) {
              console.warn('Geocoding service failed, using coordinates as fallback');
              resolve({ latitude, longitude, locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
              return;
            }

            const data = await response.json();
            const locationName = data.name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            console.log('Location name obtained:', locationName);

            resolve({ latitude, longitude, locationName });
          } catch (error) {
            console.warn('Geocoding error, using coordinates as fallback:', error);
            // Fallback to coordinates if geocoding fails
            resolve({ latitude, longitude, locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = "Unable to retrieve your location.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location services in your browser.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please try again.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "Unable to retrieve your location. Please try again.";
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout to 15 seconds
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  const handleCheckIn = async () => {
    if (!locationVerified) {
      toast({
        title: "स्थान सत्यापन आवश्यक",
        description: "कृपया चेक-इन करने से पहले अपना स्थान सत्यापित करें।",
        variant: "destructive",
      });
      return;
    }

    const isOutsideOffice = OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea;

    if (isOutsideOffice) {
      setPendingAction('checkin');
      setShowReasonDialog(true);
    } else {
      await performAttendanceAction('checkin');
    }
  };

  const handleCheckOut = async () => {
    if (!locationVerified) {
      toast({
        title: "स्थान सत्यापन आवश्यक",
        description: "कृपया चेक-आउट करने से पहले अपना स्थान सत्यापित करें।",
        variant: "destructive",
      });
      return;
    }

    const isOutsideOffice = OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea;

    if (isOutsideOffice) {
      setPendingAction('checkout');
      setShowReasonDialog(true);
    } else {
      await performAttendanceAction('checkout');
    }
  };

  const calculateDistanceFromOffice = (lat: number, lng: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat * Math.PI) / 180;
    const φ2 = (OFFICE_GEOFENCING_CONFIG.centerLat * Math.PI) / 180;
    const Δφ = ((OFFICE_GEOFENCING_CONFIG.centerLat - lat) * Math.PI) / 180;
    const Δλ = ((OFFICE_GEOFENCING_CONFIG.centerLng - lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const getWorkingHours = () => {
    if (!attendanceStatus?.checkInTime) return "00:00:00";

    const checkIn = new Date(attendanceStatus.checkInTime);

    // If user has checked out, calculate time between check-in and check-out
    if (attendanceStatus?.checkOutTime) {
      const checkOut = new Date(attendanceStatus.checkOutTime);
      const diff = checkOut.getTime() - checkIn.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // If user is still checked in, calculate time from check-in to now
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

  const performAttendanceAction = async (action: 'checkin' | 'checkout', reason?: string) => {
    setIsLoadingLocation(true); // Start loading before getting location
    try {
      const locationData = await getCurrentLocation();

      // Double check geofencing before API call, especially if outside
      const distance = calculateDistanceFromOffice(locationData.latitude, locationData.longitude);
      const isOutsideOffice = OFFICE_GEOFENCING_CONFIG.isRequired && distance > OFFICE_GEOFENCING_CONFIG.radiusMeters;

      if (isOutsideOffice && !reason) {
        // This case should ideally be handled by the dialog, but as a safeguard:
        toast({
          title: "कारण आवश्यक",
          description: "आप ऑफिस के बाहर हैं और चेक-इन/चेक-आउट करने के लिए कारण बताना होगा।",
          variant: "destructive",
        });
        return;
      }

      if (action === 'checkin') {
        await checkInMutation.mutateAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          locationName: locationData.locationName,
          reason: reason
        });
      } else {
        await checkOutMutation.mutateAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          locationName: locationData.locationName,
          reason: reason
        });
      }
    } catch (error) {
      console.error(`${action} error:`, error);

      // Handle geocoding fallback if initial location acquisition failed partially
      if (error instanceof Error && error.message.includes('geocoding')) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000,
            });
          });
          const { latitude, longitude } = position.coords;
          const fallbackLocationData = {
            latitude,
            longitude,
            locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          };

          // Re-evaluate geofencing with fallback coordinates
          const distance = calculateDistanceFromOffice(latitude, longitude);
          const isOutsideOffice = OFFICE_GEOFENCING_CONFIG.isRequired && distance > OFFICE_GEOFENCING_CONFIG.radiusMeters;

          if (isOutsideOffice && !reason) {
            toast({
              title: "कारण आवश्यक",
              description: "आप ऑफिस के बाहर हैं और चेक-इन/चेक-आउट करने के लिए कारण बताना होगा।",
              variant: "destructive",
            });
            return;
          }

          if (action === 'checkin') {
            await checkInMutation.mutateAsync({...fallbackLocationData, reason});
          } else {
            await checkOutMutation.mutateAsync({...fallbackLocationData, reason});
          }
          toast({
            title: "चेक-इन/चेक-आउट सफल",
            description: "स्थान निर्देशांकों के साथ पूर्ण (जियोकोडिंग सेवा अनुपलब्ध)।",
            variant: "default",
          });
          return;
        } catch (fallbackError) {
          console.error('Fallback action also failed:', fallbackError);
        }
      }

      toast({
        title: "स्थान त्रुटि",
        description: error instanceof Error ? error.message : "आपका स्थान प्राप्त करने में असमर्थ। कृपया स्थान सेवाएं सक्षम करें।",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleReasonSubmit = () => {
    if (!reasonText.trim()) {
      toast({
        title: "कारण आवश्यक",
        description: "कृपया ऑफिस के बाहर से चेक-इन/चेक-आउट करने का कारण बताएं।",
        variant: "destructive",
      });
      return;
    }

    if (pendingAction) {
      performAttendanceAction(pendingAction, reasonText);
    }

    setShowReasonDialog(false);
    setReasonText("");
    setPendingAction(null);
  };

  const handleReasonCancel = () => {
    setShowReasonDialog(false);
    setReasonText("");
    setPendingAction(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
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
          {/* Geofencing Component */}
          <GeoFencing
            onLocationVerified={handleLocationVerified}
            config={OFFICE_GEOFENCING_CONFIG}
          />

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
              <span className="text-sm text-gray-700 truncate">{location.locationName}</span>
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
                  disabled={checkInMutation.isPending || isLoadingLocation || (OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea && !location)}
                  className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                    OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea && !location
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                  }`}
                >
                  {checkInMutation.isPending || isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea && !location ? (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea && !location ? 'ऑफिस क्षेत्र के बाहर' : 'चेक इन'}
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
                  disabled={checkOutMutation.isPending || isLoadingLocation || (OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea && !location)}
                  variant="outline"
                  className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 ${
                    OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea && !location
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                  }`}
                >
                  {checkOutMutation.isPending || isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea && !location ? (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {OFFICE_GEOFENCING_CONFIG.isRequired && !isWithinOfficeArea && !location ? 'ऑफिस क्षेत्र के बाहर' : 'चेक आउट'}
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

      {/* Reason Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>कृपया कारण बताएं</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="reason" className="text-right font-medium">
                कारण
              </label>
              <Textarea
                id="reason"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="आप ऑफिस के बाहर से क्यों चेक-इन/चेक-आउट कर रहे हैं, कृपया बताएं..."
                className="col-span-3 h-24 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={handleReasonCancel}>
                रद्द करें
              </Button>
            </DialogClose>
            <Button onClick={handleReasonSubmit} disabled={!reasonText.trim()}>
              सबमिट करें
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}