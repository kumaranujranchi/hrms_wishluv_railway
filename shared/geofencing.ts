
export interface GeofencingConfig {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  name: string;
  isEnabled: boolean;
  isRequired: boolean;
}

export const OFFICE_GEOFENCING_CONFIG: GeofencingConfig = {
  centerLat: 25.6146835780726,
  centerLng: 85.1126174983296,
  radiusMeters: 50,
  name: "Office Location",
  isEnabled: true,
  isRequired: true
};

export function calculateDistance(
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

export function isWithinGeofence(
  currentLat: number,
  currentLng: number,
  config: GeofencingConfig
): boolean {
  const distance = calculateDistance(
    currentLat,
    currentLng,
    config.centerLat,
    config.centerLng
  );
  return distance <= config.radiusMeters;
}
