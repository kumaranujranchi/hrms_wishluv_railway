
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Navigation
} from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeofencingConfig {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  name: string;
  isEnabled: boolean;
  isRequired: boolean;
}

interface GeoFencingProps {
  onLocationVerified: (location: Location, isWithinBounds: boolean) => void;
  config?: GeofencingConfig;
}

const DEFAULT_OFFICE_CONFIG: GeofencingConfig = {
  centerLat: 25.6146835780726,
  centerLng: 85.1126174983296,
  radiusMeters: 50,
  name: "Office Location",
  isEnabled: true,
  isRequired: true
};

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export default function GeoFencing({ onLocationVerified, config = DEFAULT_OFFICE_CONFIG }: GeoFencingProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [isWithinBounds, setIsWithinBounds] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);

  const checkGeolocation = async () => {
    if (!config.isEnabled) {
      onLocationVerified({ latitude: 0, longitude: 0, accuracy: 0 }, true);
      return;
    }

    setLocationStatus('checking');
    setErrorMessage('');

    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by this browser.');
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        setCurrentLocation(location);

        // Calculate distance from office
        const distanceFromOffice = calculateDistance(
          location.latitude,
          location.longitude,
          config.centerLat,
          config.centerLng
        );

        setDistance(distanceFromOffice);

        const withinBounds = distanceFromOffice <= config.radiusMeters;
        setIsWithinBounds(withinBounds);
        setLocationStatus('success');

        // Notify parent component
        onLocationVerified(location, withinBounds);
      },
      (error) => {
        let errorMsg = 'Unable to retrieve your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        
        setErrorMessage(errorMsg);
        setLocationStatus('error');
        
        // For non-required geofencing, allow attendance with warning
        if (!config.isRequired) {
          onLocationVerified({ latitude: 0, longitude: 0, accuracy: 0 }, false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  useEffect(() => {
    checkGeolocation();
  }, []);

  const getStatusIcon = () => {
    switch (locationStatus) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return isWithinBounds ? 
          <CheckCircle className="h-5 w-5 text-green-500" /> : 
          <XCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Navigation className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (locationStatus) {
      case 'checking':
        return 'Checking location...';
      case 'success':
        return isWithinBounds ? 
          `Within office bounds (${distance.toFixed(0)}m away)` : 
          `Outside office bounds (${distance.toFixed(0)}m away)`;
      case 'error':
        return errorMessage;
      default:
        return 'Location not checked';
    }
  };

  const getStatusBadge = () => {
    if (locationStatus === 'success') {
      return isWithinBounds ? 
        <Badge className="bg-green-100 text-green-800">Within Bounds</Badge> :
        <Badge className="bg-red-100 text-red-800">Outside Bounds</Badge>;
    } else if (locationStatus === 'error') {
      return <Badge className="bg-orange-100 text-orange-800">Location Error</Badge>;
    } else if (locationStatus === 'checking') {
      return <Badge className="bg-blue-100 text-blue-800">Checking...</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  if (!config.isEnabled) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-blue-600" />
          Location Verification
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          {getStatusBadge()}
        </div>

        {currentLocation && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 space-y-1">
              <div>Current: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</div>
              <div>Office: {config.centerLat.toFixed(6)}, {config.centerLng.toFixed(6)}</div>
              <div>Accuracy: ±{currentLocation.accuracy.toFixed(0)}m</div>
            </div>
          </div>
        )}

        {locationStatus === 'success' && !isWithinBounds && config.isRequired && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Outside Office Area</span>
            </div>
            <p className="text-sm text-orange-700">
              You are {distance.toFixed(0)} meters away from the office. 
              You need to be within {config.radiusMeters} meters to mark attendance.
            </p>
          </div>
        )}

        {locationStatus === 'success' && !isWithinBounds && !config.isRequired && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You are currently outside the office boundaries. 
              Attendance will be marked with a location exception.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={checkGeolocation}
            disabled={locationStatus === 'checking'}
            size="sm"
          >
            {locationStatus === 'checking' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Refresh Location
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500">
            Office: {config.name} (±{config.radiusMeters}m radius)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
