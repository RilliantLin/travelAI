import { Location } from './common';

export interface WeatherCondition {
  code: string;
  text: string;
  icon: string;
}

export interface Temperature {
  value: number;
  unit: string;
  min?: number;
  max?: number;
}

export interface Wind {
  speed: string;
  direction: string;
  scale: string;
}

export interface WeatherInfo {
  date: string;
  location: Location;
  condition: WeatherCondition;
  temperature: Temperature;
  humidity: string;
  wind: Wind;
  visibility: string;
  pressure: string;
  uvIndex?: string;
  comfortIndex?: string;
 穿衣建议?: string;
}

export interface WeatherForecast {
  location: Location;
  forecast: WeatherDaily[];
  updateTime: string;
}

export interface WeatherDaily {
  date: string;
  week: string;
  conditionDay: WeatherCondition;
  conditionNight: WeatherCondition;
  temperature: {
    min: number;
    max: number;
    unit: string;
  };
  humidity: string;
  wind: Wind;
  sunrise: string;
  sunset: string;
  uvIndex?: string;
  comfortIndex?: string;
  tips?: string;
}

export interface WeatherHourly {
  time: string;
  condition: WeatherCondition;
  temperature: number;
  humidity: string;
  wind: Wind;
  precipitation: string;
}

export interface WeatherAlert {
  id: string;
  type: string;
  level: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface WeatherQueryParams {
  location: string;
  days?: number;
  lang?: string;
}

export interface WeatherApiResponse {
  code: string;
  message: string;
  now?: WeatherInfo;
  daily?: WeatherDaily[];
  hourly?: WeatherHourly[];
  alert?: WeatherAlert[];
}
