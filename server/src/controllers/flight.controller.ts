import { Request, Response } from 'express';
import { flightApi } from '../lib/api/flight';
import { FlightSearchParams } from '../types/flight';

export const searchFlights = async (req: Request, res: Response) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      class: flightClass,
      adults,
      children,
      infants,
      directOnly,
      maxStops,
      minPrice,
      maxPrice,
      preferredAirlines,
      sortBy,
      sortOrder,
      page,
      pageSize,
    } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: origin, destination, departureDate',
      });
    }

    const params: FlightSearchParams = {
      origin: origin as string,
      destination: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string,
      passengers: passengers ? parseInt(passengers as string) : undefined,
      class: flightClass as any,
      adults: adults ? parseInt(adults as string) : undefined,
      children: children ? parseInt(children as string) : undefined,
      infants: infants ? parseInt(infants as string) : undefined,
      directOnly: directOnly === 'true',
      maxStops: maxStops ? parseInt(maxStops as string) : undefined,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      preferredAirlines: preferredAirlines ? (preferredAirlines as string).split(',') : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
    };

    const result = await flightApi.searchFlights(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Search flights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search flights',
    });
  }
};

export const getFlightDetail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const flight = await flightApi.getFlightDetail(id);

    if (!flight) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found',
      });
    }

    res.json({
      success: true,
      data: flight,
    });
  } catch (error) {
    console.error('Get flight detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get flight detail',
    });
  }
};

export const getFlightPriceComparison = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const comparison = await flightApi.getPriceComparison(id);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        error: 'Price comparison not found',
      });
    }

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Get price comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get price comparison',
    });
  }
};

export const getAirlines = async (req: Request, res: Response) => {
  try {
    const airlines = await flightApi.getAirlines();

    res.json({
      success: true,
      data: airlines,
    });
  } catch (error) {
    console.error('Get airlines error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get airlines',
    });
  }
};

export const getAirports = async (req: Request, res: Response) => {
  try {
    const airports = await flightApi.getAirports();

    res.json({
      success: true,
      data: airports,
    });
  } catch (error) {
    console.error('Get airports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get airports',
    });
  }
};
