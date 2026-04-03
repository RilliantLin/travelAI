import { Flight, FlightSearchResult, FlightSearchParams, Airline, Airport } from '@/types/flight';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
  const queryParams = new URLSearchParams();
  
  queryParams.append('origin', params.origin);
  queryParams.append('destination', params.destination);
  queryParams.append('departureDate', params.departureDate);
  
  if (params.returnDate) queryParams.append('returnDate', params.returnDate);
  if (params.passengers) queryParams.append('passengers', params.passengers.toString());
  if (params.class) queryParams.append('class', params.class);
  if (params.adults) queryParams.append('adults', params.adults.toString());
  if (params.children) queryParams.append('children', params.children.toString());
  if (params.infants) queryParams.append('infants', params.infants.toString());
  if (params.directOnly) queryParams.append('directOnly', 'true');
  if (params.maxStops !== undefined) queryParams.append('maxStops', params.maxStops.toString());
  if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.preferredAirlines) queryParams.append('preferredAirlines', params.preferredAirlines.join(','));
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

  const response = await fetch(`${API_BASE_URL}/flights/search?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to search flights');
  }
  
  const data = await response.json();
  return data.data;
}

export async function getFlightDetail(id: string): Promise<Flight | null> {
  const response = await fetch(`${API_BASE_URL}/flights/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to get flight detail');
  }
  
  const data = await response.json();
  return data.data;
}

export async function getAirlines(): Promise<Airline[]> {
  const response = await fetch(`${API_BASE_URL}/flights/airlines`);
  
  if (!response.ok) {
    throw new Error('Failed to get airlines');
  }
  
  const data = await response.json();
  return data.data;
}

export async function getAirports(): Promise<Airport[]> {
  const response = await fetch(`${API_BASE_URL}/flights/airports`);
  
  if (!response.ok) {
    throw new Error('Failed to get airports');
  }
  
  const data = await response.json();
  return data.data;
}
