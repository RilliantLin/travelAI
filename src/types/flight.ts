export interface Flight {
  id: string;
  flightNumber: string;
  airline: Airline;
  departure: FlightPoint;
  arrival: FlightPoint;
  duration: number;
  price: FlightPrice;
  seatsAvailable?: number;
  aircraft?: string;
  class: FlightClass;
  stops: number;
  stopCities?: string[];
  baggage?: BaggageInfo;
  meal?: boolean;
  wifi?: boolean;
  powerOutlet?: boolean;
  entertainment?: boolean;
}

export interface Airline {
  code: string;
  name: string;
  logo?: string;
  alliance?: string;
}

export interface FlightPoint {
  airport: Airport;
  time: string;
  terminal?: string;
  gate?: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface FlightPrice {
  amount: number;
  currency: string;
  taxIncluded: boolean;
  originalPrice?: number;
  discount?: number;
}

export interface BaggageInfo {
  carryOn: {
    weight: number;
    unit: string;
    pieces: number;
  };
  checked: {
    weight: number;
    unit: string;
    pieces: number;
  };
}

export type FlightClass = 'economy' | 'premium_economy' | 'business' | 'first';

export interface FlightSearchResult {
  flights: Flight[];
  total: number;
  hasMore: boolean;
  cheapestPrice?: number;
  fastestDuration?: number;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  class?: FlightClass;
  adults?: number;
  children?: number;
  infants?: number;
  directOnly?: boolean;
  maxStops?: number;
  minPrice?: number;
  maxPrice?: number;
  preferredAirlines?: string[];
  sortBy?: 'price' | 'duration' | 'departure' | 'arrival';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
