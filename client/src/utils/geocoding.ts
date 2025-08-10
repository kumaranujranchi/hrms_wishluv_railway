// Utility functions for reverse geocoding (converting lat/long to location names)

export interface LocationDetails {
  name: string;
  address: string;
  city: string;
  country: string;
}

// Free reverse geocoding using OpenStreetMap Nominatim API
export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&extratags=1&namedetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    // Extract meaningful location information
    const address = data.address || {};
    const displayName = data.display_name || '';
    
    // Build a friendly location name
    const locationParts = [];
    
    // Add building/amenity name if available
    if (data.name && data.name !== data.display_name) {
      locationParts.push(data.name);
    }
    
    // Add road/street if available
    if (address.road) {
      locationParts.push(address.road);
    } else if (address.pedestrian) {
      locationParts.push(address.pedestrian);
    }
    
    // Add area information
    if (address.suburb) {
      locationParts.push(address.suburb);
    } else if (address.neighbourhood) {
      locationParts.push(address.neighbourhood);
    } else if (address.hamlet) {
      locationParts.push(address.hamlet);
    }
    
    // Add city information
    if (address.city) {
      locationParts.push(address.city);
    } else if (address.town) {
      locationParts.push(address.town);
    } else if (address.village) {
      locationParts.push(address.village);
    }
    
    // Construct the friendly name
    const name = locationParts.length > 0 
      ? locationParts.slice(0, 3).join(', ') // Limit to first 3 parts to avoid being too long
      : displayName.split(',').slice(0, 2).join(', '); // Fallback to first parts of display name
    
    return {
      name: name || 'Unknown Location',
      address: displayName,
      city: address.city || address.town || address.village || 'Unknown City',
      country: address.country || 'Unknown Country'
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
    const locationDetails = await reverseGeocode(latitude, longitude);
    return locationDetails.name;
  } catch (error) {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

// Helper to format coordinates for display
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}