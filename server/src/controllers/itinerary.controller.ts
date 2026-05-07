import { Request, Response } from 'express';
import { itineraryAgent } from '../agent/itinerary-agent';
import { ItineraryCreateParams, Itinerary, DayPlan, Activity, MealPlan, AccommodationPlan } from '../types/itinerary';
import { PrismaClient } from '@prisma/client';
import { timeToMinutes } from '../lib/utils/time';

/** Transform raw Prisma itinerary record into the frontend Itinerary type */
function transformItinerary(raw: any): Itinerary {
  const days: DayPlan[] = (raw.days || []).map((day: any) => {
    const activities: Activity[] = (day.activities || []).map((act: any) => {
      const startMin = act.startTime ? timeToMinutes(act.startTime) : 0;
      const endMin = act.endTime ? timeToMinutes(act.endTime) : startMin + 120;
      return {
        id: act.id,
        type: act.category || 'attraction',
        name: act.name,
        location: {
          lat: act.latitude ?? 0,
          lng: act.longitude ?? 0,
          address: typeof act.location === 'string' ? act.location : (act.location?.address || ''),
        },
        description: act.description ?? undefined,
        startTime: act.startTime ?? '',
        endTime: act.endTime ?? '',
        duration: endMin - startMin || 120,
        estimatedCost: act.estimatedCost ?? 0,
        bookingRequired: false,
        rating: act.rating ?? undefined,
        imageUrl: act.imageUrl ?? undefined,
      } as Activity;
    });

    const meals: MealPlan[] = (day.meals || []).map((meal: any) => ({
      id: meal.id,
      type: meal.type || 'lunch',
      name: meal.name,
      location: {
        lat: meal.latitude ?? 0,
        lng: meal.longitude ?? 0,
        address: typeof meal.location === 'string' ? meal.location : (meal.location?.address || ''),
      },
      time: meal.time ?? '',
      duration: 60,
      estimatedCost: meal.estimatedCost ?? 0,
    } as MealPlan));

    let accommodation: AccommodationPlan | undefined;
    if (day.accommodation) {
      const acc = Array.isArray(day.accommodation) ? day.accommodation[0] : day.accommodation;
      if (acc) {
        accommodation = {
          id: acc.id,
          name: acc.name,
          location: {
            lat: acc.latitude ?? 0,
            lng: acc.longitude ?? 0,
            address: typeof acc.location === 'string' ? acc.location : (acc.location?.address || ''),
          },
          type: acc.type || '酒店',
          checkIn: acc.checkIn ?? '14:00',
          checkOut: acc.checkOut ?? '12:00',
          estimatedCost: acc.estimatedCost ?? 0,
          rating: acc.rating ?? undefined,
        } as AccommodationPlan;
      }
    }

    return {
      dayNumber: day.dayNumber,
      date: day.date instanceof Date ? day.date.toISOString().split('T')[0] : String(day.date).split('T')[0],
      activities,
      meals,
      accommodation,
      summary: day.summary ?? undefined,
    } as DayPlan;
  });

  return {
    id: raw.id,
    userId: raw.userId,
    title: raw.title,
    destination: raw.destination,
    startDate: raw.startDate instanceof Date ? raw.startDate.toISOString().split('T')[0] : String(raw.startDate).split('T')[0],
    endDate: raw.endDate instanceof Date ? raw.endDate.toISOString().split('T')[0] : String(raw.endDate).split('T')[0],
    totalDays: days.length || 1,
    days,
    budget: raw.totalBudget ? { total: raw.totalBudget, transportation: 0, accommodation: 0, food: 0, attractions: 0, shopping: 0, entertainment: 0, insurance: 0, visa: 0, communication: 0, miscellaneous: 0, currency: 'CNY' } : undefined,
    status: raw.status || 'draft',
    description: raw.description ?? undefined,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
  };
}

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
