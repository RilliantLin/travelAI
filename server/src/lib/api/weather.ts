import axios from 'axios';
import { WeatherInfo, WeatherDaily, WeatherForecast } from '../../types/weather';
import redis from '../../config/redis';
import { config } from '../../config';

function getQWeatherBaseUrl(): string | null {
  const host = config.apis.qweather.apiHost;
  if (!host) return null;
  return `https://${host}`;
}

interface QWeatherNowResponse {
  code: string;
  now: {
    temp: string;
    feelsLike: string;
    text: string;
    icon: string;
    wind360: string;
    windDir: string;
    windScale: string;
    windSpeed: string;
    humidity: string;
    precip: string;
    pressure: string;
    visibility: string;
    cloud: string;
  };
}

interface QWeatherDailyResponse {
  code: string;
  daily: Array<{
    fxDate: string;
    week: string;
    date: string;
    tempMax: string;
    tempMin: string;
    textDay: string;
    textNight: string;
    iconDay: string;
    iconNight: string;
    humidity: string;
    windDirDay: string;
    windScaleDay: string;
    windSpeedDay: string;
    sunrise: string;
    sunset: string;
    uvIndex: string;
  }>;
}

export class WeatherApi {
  private async getCachedData(key: string): Promise<string | null> {
    try {
      if (!redis) return null;
      return await redis.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  private async setCachedData(key: string, value: string, ttl: number = 10800): Promise<void> {
    try {
      if (!redis) return;
      await redis.setex(key, ttl, value);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async getLocationId(location: string): Promise<string> {
    const baseUrl = getQWeatherBaseUrl();
    if (!baseUrl) return location;

    const cacheKey = `location_id:${location}`;
    const cached = await this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const geoUrl = `${baseUrl}/geo/v2/city/lookup`;
      const response = await axios.get(geoUrl, {
        params: {
          location,
          key: config.apis.qweather.apiKey,
        },
      });

      if (response.data.code === '200' && response.data.location?.length > 0) {
        const locationId = response.data.location[0].id;
        await this.setCachedData(cacheKey, locationId, 86400);
        return locationId;
      }

      return location;
    } catch (error: any) {
      console.error('Get location ID error:', error?.message || error);
      return location;
    }
  }

  async getCurrentWeather(location: string): Promise<WeatherInfo | null> {
    const baseUrl = getQWeatherBaseUrl();
    if (!baseUrl) return null;

    const locationId = await this.getLocationId(location);
    const cacheKey = `weather:current:${locationId}`;
    const cached = await this.getCachedData(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await axios.get<QWeatherNowResponse>(`${baseUrl}/v7/weather/now`, {
        params: {
          location: locationId,
          key: config.apis.qweather.apiKey,
        },
      });

      if (response.data.code !== '200') {
        throw new Error(`Weather API error: ${response.data.code}`);
      }

      const weatherInfo: WeatherInfo = {
        date: new Date().toISOString().split('T')[0],
        location: {
          lat: 0,
          lng: 0,
          address: location,
        },
        condition: {
          code: response.data.now.icon,
          text: response.data.now.text,
          icon: response.data.now.icon,
        },
        temperature: {
          value: parseFloat(response.data.now.temp),
          unit: '°C',
          min: parseFloat(response.data.now.temp),
          max: parseFloat(response.data.now.temp),
        },
        humidity: response.data.now.humidity,
        wind: {
          speed: response.data.now.windSpeed,
          direction: response.data.now.windDir,
          scale: response.data.now.windScale,
        },
        visibility: response.data.now.visibility,
        pressure: response.data.now.pressure,
      };

      await this.setCachedData(cacheKey, JSON.stringify(weatherInfo), 10800);
      return weatherInfo;
    } catch (error) {
      console.error('Get current weather error:', error);
      return null;
    }
  }

  async getWeatherForecast(location: string, days: number = 7): Promise<WeatherForecast | null> {
    const baseUrl = getQWeatherBaseUrl();
    if (!baseUrl) return null;

    const locationId = await this.getLocationId(location);
    const cacheKey = `weather:forecast:${locationId}:${days}`;
    const cached = await this.getCachedData(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const endpoint = days <= 3 ? '3d' : days <= 7 ? '7d' : '15d';
      const forecastUrl = `${baseUrl}/v7/weather/${endpoint}`;
      const response = await axios.get<QWeatherDailyResponse>(
        forecastUrl,
        {
          params: {
            location: locationId,
            key: config.apis.qweather.apiKey,
          },
        }
      );

      if (response.data.code !== '200') {
        throw new Error(`Weather API error: ${response.data.code}`);
      }

      const forecast: WeatherDaily[] = response.data.daily.slice(0, days).map((day: any) => ({
        date: day.fxDate,
        week: day.week,
        conditionDay: {
          code: day.iconDay,
          text: day.textDay,
          icon: day.iconDay,
        },
        conditionNight: {
          code: day.iconNight,
          text: day.textNight,
          icon: day.iconNight,
        },
        temperature: {
          min: parseFloat(day.tempMin),
          max: parseFloat(day.tempMax),
          unit: '°C',
        },
        humidity: day.humidity,
        wind: {
          speed: day.windSpeedDay,
          direction: day.windDirDay,
          scale: day.windScaleDay,
        },
        sunrise: day.sunrise,
        sunset: day.sunset,
        uvIndex: day.uvIndex,
      }));

      const result: WeatherForecast = {
        location: {
          lat: 0,
          lng: 0,
          address: location,
        },
        forecast,
        updateTime: new Date().toISOString(),
      };

      await this.setCachedData(cacheKey, JSON.stringify(result), 10800);
      return result;
    } catch (error: any) {
      console.error('Get weather forecast error:', error?.message || error);
      return null;
    }
  }
}

export const weatherApi = new WeatherApi();
