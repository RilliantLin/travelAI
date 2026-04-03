import { Request, Response } from 'express';
import { amapApi } from '../lib/api/amap';
import { Route, RoutePlanResult, TransportMode } from '../types/route';

export const planRoute = async (req: Request, res: Response) => {
  try {
    const { origin, destination, mode = 'driving' } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination are required',
      });
    }

    const result = await amapApi.getRoute(
      origin as string,
      destination as string,
      mode as 'driving' | 'walking' | 'transit' | 'bicycling'
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    }

    const routes: Route[] = result.route.paths.map((path, index) => ({
      id: `route-${index}`,
      mode: mode as TransportMode,
      distance: parseFloat(path.distance),
      duration: parseFloat(path.duration),
      legs: [{
        start: {
          location: { lat: 0, lng: 0, address: '' },
          name: '起点',
          type: 'start',
        },
        end: {
          location: { lat: 0, lng: 0, address: '' },
          name: '终点',
          type: 'end',
        },
        distance: parseFloat(path.distance),
        duration: parseFloat(path.duration),
        steps: path.steps.map(step => ({
          instruction: step.instruction,
          distance: parseFloat(step.distance),
          duration: parseFloat(step.duration),
          road: step.road,
          polyline: step.polyline,
        })),
      }],
    }));

    const planResult: RoutePlanResult = {
      routes,
      origin: { lat: 0, lng: 0, address: '' },
      destination: { lat: 0, lng: 0, address: '' },
    };

    res.json({
      success: true,
      data: planResult,
    });
  } catch (error) {
    console.error('Plan route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to plan route',
    });
  }
};

export const getDistance = async (req: Request, res: Response) => {
  try {
    const { origins, destination, type = '0' } = req.query;

    if (!origins || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origins and destination are required',
      });
    }

    const result = await amapApi.getDistance(
      origins as string,
      destination as string,
      type as '0' | '1' | '3'
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Distance not found',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get distance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get distance',
    });
  }
};

export const geocode = async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const result = await amapApi.geocode(address);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to geocode address',
    });
  }
};
