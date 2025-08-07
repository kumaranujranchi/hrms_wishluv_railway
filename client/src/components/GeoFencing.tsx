import React, { useEffect, useState } from 'react';
import { MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeoFenceConfig {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  name: string;
}

interface GeoFencingProps {
  onLocationVerified: (location: Location, isWithinBounds: boolean) => void;
  isRequired?: boolean;
  config?: GeoFenceConfig;
}

export default function GeoFencing({ 
  onLocationVerified, 
  isRequired = false,
  config = {
    centerLat: 40.7128,
    centerLng: -74.0060,
    radiusMeters: 200,
    name: "Office"
  }
}: GeoFencingProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isWithinBounds, setIsWithinBounds] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const { toast } = useToast();

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const checkGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationStatus('error');
      return;
    }

    setLocationStatus('checking');
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        setCurrentLocation(location);

        // Calculate distance from office
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          config.centerLat,
          config.centerLng
        );

        const withinBounds = distance <= config.radiusMeters;
        setIsWithinBounds(withinBounds);
        setLocationStatus('success');

        // Notify parent component
        onLocationVerified(location, withinBounds);

        // Show toast notification
        if (withinBounds) {
          toast({
            title: "Location Verified",
            description: `You are within ${config.name} boundaries`,
          });
        } else if (isRequired) {
          toast({
            title: "Location Outside Boundaries",
            description: `You are ${Math.round(distance - config.radiusMeters)}m away from ${config.name}`,
            variant: "destructive",
          });
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        setLocationError(errorMessage);
        setLocationStatus('error');
        onLocationVerified(null as any, false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  useEffect(() => {
    if (isRequired) {
      checkGeolocation();
    }
  }, [isRequired]);

  const getStatusIcon = () => {
    switch (locationStatus) {
      case 'checking':
        return <MapPin className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'success':
        return isWithinBounds 
          ? <CheckCircle className="h-5 w-5 text-green-500" />
          : <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    if (locationStatus === 'checking') {
      return <Badge className="bg-blue-100 text-blue-800">Checking Location</Badge>;
    }
    
    if (locationStatus === 'error') {
      return <Badge className="bg-red-100 text-red-800">Location Error</Badge>;
    }

    return isWithinBounds 
      ? <Badge className="bg-green-100 text-green-800">Within Boundaries</Badge>
      : <Badge className="bg-orange-100 text-orange-800">Outside Boundaries</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Location Verification</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {locationStatus === 'checking' && (
            <div className="text-center py-4">
              <p className="text-neutral-600">Checking your current location...</p>
            </div>
          )}

          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{locationError}</p>
              </div>
            </div>
          )}

          {currentLocation && locationStatus === 'success' && (
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Latitude:</span>
                  <span className="ml-2">{currentLocation.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="font-medium">Longitude:</span>
                  <span className="ml-2">{currentLocation.longitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="font-medium">Accuracy:</span>
                  <span className="ml-2">{Math.round(currentLocation.accuracy)}m</span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 font-medium ${
                    isWithinBounds ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isWithinBounds ? 'Inside Office' : 'Outside Office'}
                  </span>
                </div>
              </div>

              {!isWithinBounds && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-sm text-orange-800">
                    You are currently outside the office boundaries. 
                    {isRequired && ' Attendance may be marked with a location exception.'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={checkGeolocation}
              disabled={locationStatus === 'checking'}
            >
              {locationStatus === 'checking' ? 'Checking...' : 'Refresh Location'}
            </Button>

            <div className="text-xs text-neutral-500">
              Office: {config.name} (±{config.radiusMeters}m radius)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}