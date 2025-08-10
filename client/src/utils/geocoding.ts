// Utility functions for reverse geocoding (converting lat/long to location names)

export interface LocationDetails {
  name: string;
  address: string;
  city: string;
  country: string;
}

// Reverse geocoding using our server endpoint
export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails> {
  try {
    const response = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    return {
      name: data.name || 'Unknown Location',
      address: data.address || `Latitude: ${latitude}, Longitude: ${longitude}`,
      city: data.city || 'Unknown City',
      country: data.country || 'Unknown Country'
    };
    
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    // Return a fallback location based on coordinates
    return {
      name: `Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
      address: `Latitude: ${latitude}, Longitude: ${longitude}`,
      city: 'Unknown City',
      country: 'Unknown Country'
    };
  }
}

// Simplified version that just returns a location name
export async function getLocationName(latitude: number, longitude: number): Promise<string> {
  try {
    // Use our server endpoint to avoid CORS issues
    const response = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    return data.name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Failed to get location name:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

// Helper to format coordinates for display
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}