import { Request, Response } from 'express';
import { itineraryAgent } from '../agent/itinerary-agent';
import { ItineraryCreateParams } from '../types/itinerary';
import { PrismaClient } from '@prisma/client';
import { transformItinerary } from '../lib/itinerary-transform';

const prisma = new PrismaClient();

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

    const itinerary = await itineraryAgent.generateItinerary(params);

    const savedItinerary = await prisma.itinerary.create({
      data: {
        userId: itinerary.userId,
        title: itinerary.title,
        destination: itinerary.destination,
        startDate: new Date(itinerary.startDate),
        endDate: new Date(itinerary.endDate),
        description: itinerary.description,
        totalBudget: itinerary.budget?.total,
        status: itinerary.status,
      },
    });

    for (const dayPlan of itinerary.days) {
      const savedDay = await prisma.itineraryDay.create({
        data: {
          itineraryId: savedItinerary.id,
          dayNumber: dayPlan.dayNumber,
          date: new Date(dayPlan.date),
          summary: dayPlan.summary,
        },
      });

      for (const activity of dayPlan.activities) {
        await prisma.activity.create({
          data: {
            itineraryDayId: savedDay.id,
            name: activity.name,
            description: activity.description,
            location: activity.location.address,
            latitude: activity.location.lat,
            longitude: activity.location.lng,
            startTime: activity.startTime,
            endTime: activity.endTime,
            estimatedCost: activity.estimatedCost,
            category: activity.type,
            rating: activity.rating,
            imageUrl: activity.imageUrl,
          },
        });
      }

      for (const meal of dayPlan.meals) {
        await prisma.meal.create({
          data: {
            itineraryDayId: savedDay.id,
            name: meal.name,
            type: meal.type,
            location: meal.location.address,
            latitude: meal.location.lat,
            longitude: meal.location.lng,
            estimatedCost: meal.estimatedCost,
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...savedItinerary,
        days: itinerary.days,
        budget: itinerary.budget,
      },
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

    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            activities: true,
            meals: true,
            accommodation: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
        flights: true,
        hotels: true,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        error: 'Itinerary not found',
      });
    }

    res.json({
      success: true,
      data: transformItinerary(itinerary),
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

    const where: any = {};
    if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    const itineraries = await prisma.itinerary.findMany({
      where,
      include: {
        days: {
          include: {
            activities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: itineraries.map(transformItinerary),
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

    const itinerary = await prisma.itinerary.update({
      where: { id },
      data: {
        title,
        description,
        status,
        updatedAt: new Date(),
      },
    });

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

    await prisma.itinerary.delete({
      where: { id },
    });

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
