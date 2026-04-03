import { Location } from './common';

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
  refundPolicy?: string;
  changePolicy?: string;
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
  location?: Location;
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
  excludedAirlines?: string[];
  departureTimeRange?: TimeRange;
  arrivalTimeRange?: TimeRange;
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'duration' | 'departure' | 'arrival';
  sortOrder?: 'asc' | 'desc';
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface FlightDetail extends Flight {
  fareRules?: FareRule[];
  seatMap?: SeatMap;
  amenities?: string[];
  layoverInfo?: LayoverInfo[];
}

export interface FareRule {
  type: 'refund' | 'change' | 'cancel' | 'noshow';
  description: string;
  fee?: number;
  deadline?: string;
}

export interface SeatMap {
  available: number;
  total: number;
  seatSelectionFee?: number;
}

export interface LayoverInfo {
  airport: Airport;
  duration: number;
  terminalChange?: boolean;
  hotelProvided?: boolean;
}

export interface FlightPriceComparison {
  flightId: string;
  prices: {
    source: string;
    price: FlightPrice;
    url?: string;
    lastUpdated: string;
  }[];
  priceHistory?: {
    date: string;
    price: number;
  }[];
  priceAlert?: {
    currentPrice: number;
    targetPrice: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface FlightFilter {
  airlines?: string[];
  stops?: number[];
  priceRange?: [number, number];
  durationRange?: [number, number];
  departureTimeRanges?: TimeRange[];
  arrivalTimeRanges?: TimeRange[];
  classes?: FlightClass[];
  amenities?: string[];
}

export interface FlightRecommendation {
  flight: Flight;
  score: number;
  reasons: string[];
  matchLevel: 'high' | 'medium' | 'low';
  alternativeDates?: {
    date: string;
    price: number;
    saving: number;
  }[];
}
