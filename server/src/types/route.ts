import { Location } from './common';

export type TransportMode = 'walking' | 'driving' | 'transit' | 'cycling';

export interface RoutePoint {
  location: Location;
  name: string;
  type: 'start' | 'end' | 'waypoint';
  arrivalTime?: string;
  departureTime?: string;
  duration?: number;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  road?: string;
  action?: string;
  polyline?: string;
}

export interface RouteLeg {
  start: RoutePoint;
  end: RoutePoint;
  distance: number;
  duration: number;
  steps: RouteStep[];
  toll?: number;
  trafficLightCount?: number;
}

export interface Route {
  id: string;
  mode: TransportMode;
  distance: number;
  duration: number;
  legs: RouteLeg[];
  polyline?: string;
  toll?: number;
  cost?: number;
  taxiCost?: number;
}

export interface RoutePlanResult {
  routes: Route[];
  origin: Location;
  destination: Location;
  waypoints?: Location[];
}

export interface RouteQueryParams {
  origin: string | Location;
  destination: string | Location;
  waypoints?: (string | Location)[];
  mode: TransportMode;
  avoidToll?: boolean;
  avoidHighway?: boolean;
  avoidFerry?: boolean;
}

export interface DistanceMatrix {
  origins: Location[];
  destinations: Location[];
  distances: number[][];
  durations: number[][];
}

export interface RouteOptimization {
  originalOrder: number[];
  optimizedOrder: number[];
  originalDistance: number;
  optimizedDistance: number;
  savedDistance: number;
  savedTime: number;
}

export interface TrafficInfo {
  status: 'smooth' | 'slow' | 'jam';
  description: string;
  evaluation: string;
}

export interface RouteWithTraffic extends Route {
  traffic: TrafficInfo[];
  estimatedTimeWithTraffic: number;
}
