import { Request, Response } from 'express';
import { weatherApi } from '../lib/api/weather';

export const getCurrentWeather = async (req: Request, res: Response) => {
  try {
    const { location } = req.query;

    if (!location || typeof location !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Location is required',
      });
    }

    const weather = await weatherApi.getCurrentWeather(location);

    if (!weather) {
      return res.status(404).json({
        success: false,
        error: 'Weather data not found',
      });
    }

    res.json({
      success: true,
      data: weather,
    });
  } catch (error) {
    console.error('Get current weather error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather data',
    });
  }
};

export const getWeatherForecast = async (req: Request, res: Response) => {
  try {
    const location = typeof req.query.location === 'string' ? req.query.location : '';
    const days = typeof req.query.days === 'string' ? req.query.days : '7';

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required',
      });
    }

    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 15) {
      return res.status(400).json({
        success: false,
        error: 'Days must be between 1 and 15',
      });
    }

    const forecast = await weatherApi.getWeatherForecast(location, daysNum);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'Weather forecast not found',
      });
    }

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error('Get weather forecast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather forecast',
    });
  }
};

export const getWeatherByDate = async (req: Request, res: Response) => {
  try {
    const location = typeof req.params.location === 'string' ? req.params.location : '';
    const date = typeof req.params.date === 'string' ? req.params.date : '';

    if (!location || !date) {
      return res.status(400).json({
        success: false,
        error: 'Location and date are required',
      });
    }

    const forecast = await weatherApi.getWeatherForecast(location, 7);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'Weather forecast not found',
      });
    }

    const weatherForDate = forecast.forecast.find((d: any) => d.date === date);

    if (!weatherForDate) {
      return res.status(404).json({
        success: false,
        error: 'Weather data for specified date not found',
      });
    }

    res.json({
      success: true,
      data: weatherForDate,
    });
  } catch (error) {
    console.error('Get weather by date error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather data',
    });
  }
};
