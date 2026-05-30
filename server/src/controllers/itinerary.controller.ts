import { Request, Response } from 'express';
import { AppError } from '../contracts/errors';
import {
  createItinerary as createItineraryService,
  deleteItineraryById,
  getItineraryById,
  listItineraries,
  updateItinerary as updateItineraryService,
} from '../services/itinerary.service';

export const createItinerary = async (req: Request, res: Response) => {
  try {
    const itinerary = await createItineraryService(req.body);

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }

    console.error('Create itinerary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create itinerary',
    });
  }
};

export const getItinerary = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';

    const itinerary = await getItineraryById(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        error: 'Itinerary not found',
      });
    }

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get itinerary',
    });
  }
};

export const getUserItineraries = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const itineraries = await listItineraries(typeof userId === 'string' ? userId : undefined);

    res.json({
      success: true,
      data: itineraries,
    });
  } catch (error) {
    console.error('Get user itineraries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get itineraries',
    });
  }
};

export const updateItinerary = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';

    const itinerary = await updateItineraryService(id, req.body);

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }

    console.error('Update itinerary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update itinerary',
    });
  }
};

export const deleteItinerary = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';

    await deleteItineraryById(id);

    res.json({
      success: true,
      message: 'Itinerary deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    console.error('Delete itinerary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete itinerary',
    });
  }
};
