import { Request, Response } from 'express';
import { ItineraryCreateParams } from '../types/itinerary';
import {
  createGeneratedItinerary,
  deleteItineraryById,
  getItineraryById,
  listItineraries,
  updateItineraryMeta,
} from '../services/itinerary.service';

export const createItinerary = async (req: Request, res: Response) => {
  try {
    const { destination, startDate, endDate, title, description, preferences } = req.body;
    const userId = req.body.userId || 'default-user';

    if (!destination || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Destination, start date, and end date are required',
      });
    }

    const params: ItineraryCreateParams = {
      destination,
      startDate,
      endDate,
      userId,
      title,
      description,
      preferences,
    };

    const itinerary = await createGeneratedItinerary(params);

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
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
    const { title, description, status } = req.body;

    const itinerary = await updateItineraryMeta(id, { title, description, status });

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
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
    console.error('Delete itinerary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete itinerary',
    });
  }
};
