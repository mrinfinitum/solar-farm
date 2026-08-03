export interface GeocodingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  provider: string;
  confidence?: number;
}

export interface GeocodingProvider {
  key: string;
  geocode(address: GeocodingAddress): Promise<GeocodingResult | null>;
}

/** No-key fallback: coordinates remain manual and no address is sent externally. */
export class ManualGeocodingProvider implements GeocodingProvider {
  key = "manual";
  async geocode() {
    return null;
  }
}
