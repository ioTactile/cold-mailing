export interface GoogleGeocodeLocation {
  lat: number;
  lng: number;
}

export interface GoogleGeocodeGeometry {
  location?: GoogleGeocodeLocation;
}

export interface GoogleGeocodeResult {
  formatted_address?: string;
  geometry?: GoogleGeocodeGeometry;
}

export interface GoogleGeocodeResponse {
  status?: string;
  results?: GoogleGeocodeResult[];
}
