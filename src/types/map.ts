export interface MapConfig {
  apiKey: string;
  version?: string;
  plugins?: string[];
}

export interface MapOptions {
  zoom?: number;
  center?: [number, number];
  mapStyle?: string;
  viewMode?: '2D' | '3D';
  pitch?: number;
  rotation?: number;
  features?: string[];
}

export interface MarkerData {
  id: string;
  position: [number, number];
  type: 'attraction' | 'restaurant' | 'hotel' | 'start' | 'end' | 'waypoint';
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  data?: Record<string, unknown>;
}

export interface PolylineData {
  id: string;
  path: [number, number][];
  color?: string;
  weight?: number;
  opacity?: number;
  style?: 'solid' | 'dashed';
}

export interface RouteData {
  id: string;
  origin: [number, number];
  destination: [number, number];
  waypoints?: [number, number][];
  mode: 'driving' | 'walking' | 'transit' | 'bicycling';
  polyline?: PolylineData;
  distance?: number;
  duration?: number;
  steps?: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  road?: string;
  distance: number;
  duration: number;
  polyline?: [number, number][];
}

export interface MapBounds {
  southWest: [number, number];
  northEast: [number, number];
}

export interface MapEvent {
  type: 'click' | 'dblclick' | 'rightclick' | 'mousemove' | 'zoomchange' | 'dragend';
  lnglat?: [number, number];
  zoom?: number;
  bounds?: MapBounds;
}

export type MarkerClusterOptions = {
  gridSize?: number;
  minClusterSize?: number;
  maxZoom?: number;
  styles?: ClusterStyle[];
}

export interface ClusterStyle {
  url: string;
  size: [number, number];
  offset?: [number, number];
  textColor?: string;
  textSize?: number;
}

export interface InfoWindowData {
  id: string;
  position: [number, number];
  content: string;
  offset?: [number, number];
}

export interface MapContextValue {
  map: any;
  isLoaded: boolean;
  error: Error | null;
  registerMap: (map: any) => void;
  setCenter: (lnglat: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: MapBounds) => void;
  addMarker: (marker: MarkerData) => void;
  removeMarker: (id: string) => void;
  addPolyline: (polyline: PolylineData) => void;
  removePolyline: (id: string) => void;
  clearAll: () => void;
  fitView: (markers?: MarkerData[]) => void;
}
