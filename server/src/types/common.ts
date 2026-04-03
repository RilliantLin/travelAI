export interface Location {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  province?: string;
  country?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  fullAddress: string;
  city: string;
  province?: string;
  district?: string;
  street?: string;
  postalCode?: string;
}

export interface Price {
  amount: number;
  currency: string;
  originalAmount?: number;
  discount?: number;
}

export interface Rating {
  score: number;
  count: number;
  source?: string;
}

export interface OpeningHours {
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  note?: string;
}

export interface Image {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface Contact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
}

export type TransportMode = 'walking' | 'driving' | 'transit' | 'cycling';

export type ActivityType = 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'free_time';

export type TravelStyle = 'relaxed' | 'moderate' | 'intensive';

export type Currency = 'CNY' | 'USD' | 'EUR' | 'JPY' | 'KRW' | 'THB';
