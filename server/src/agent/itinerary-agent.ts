import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { getChatModel, getStreamingChatModel } from "./llm";
import { weatherApi } from "../lib/api/weather";
import { amapApi } from "../lib/api/amap";
import { ItineraryCreateParams, Itinerary, DayPlan, Activity, MealPlan } from "../types/itinerary";
import { calculateDistance } from "../lib/utils/distance";
import { formatDate, getDaysBetween, timeToMinutes, minutesToTime } from "../lib/utils/time";
import { estimateBudget } from "../lib/utils/budget";

const ITINERARY_SYSTEM_PROMPT = `你是一个专业的旅游规划助手，擅长为用户制定详细、合理的旅行行程。

你的职责是：
1. 根据用户的目的地、时间和偏好，生成完整的旅行行程
2. 合理安排每日的活动、景点、餐厅和休息时间
3. 考虑景点之间的距离和交通时间
4. 根据天气情况给出建议
5. 控制在用户预算范围内

行程规划原则：
- 每天安排3-5个主要景点，避免过于紧凑
- 合理安排用餐时间和地点
- 考虑景点开放时间和最佳游览时间
- 预留适当的休息和自由活动时间
- 根据天气调整室内外活动安排

输出格式：
请以JSON格式输出完整的行程规划，包含每日的活动安排、时间、地点、费用等信息。`;

export class ItineraryAgent {
  async generateItinerary(params: ItineraryCreateParams): Promise<Itinerary> {
    const { destination, startDate, endDate, userId, title, description, preferences } = params;

    const totalDays = getDaysBetween(startDate, endDate) + 1;

    const weatherForecast = await weatherApi.getWeatherForecast(destination, totalDays);

    const attractionsResult = await amapApi.searchPOI(
      '景点',
      '',
      '110000|110100|110200|110300',
      undefined,
      1,
      50
    );

    const restaurantsResult = await amapApi.searchPOI(
      '餐厅',
      '',
      '050000',
      undefined,
      1,
      30
    );

    const days: DayPlan[] = [];

    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      const weather = weatherForecast?.forecast[day];

      const dayPlan = await this.generateDayPlan(
        day + 1,
        currentDate,
        destination,
        attractionsResult?.pois || [],
        restaurantsResult?.pois || [],
        weather,
        preferences
      );

      days.push(dayPlan);
    }

    const budgetStyle = preferences?.travelStyle === 'relaxed' ? 'moderate' : 
                        preferences?.travelStyle === 'intensive' ? 'luxury' : 
                        (preferences?.travelStyle as 'budget' | 'moderate' | 'luxury') || 'moderate';

    const budget = estimateBudget(
      destination,
      totalDays,
      preferences?.travelStyle === 'relaxed' ? 1 : 2,
      budgetStyle
    );

    const itinerary: Itinerary = {
      id: '',
      userId,
      title: title || `${destination}${totalDays}日游`,
      destination,
      startDate,
      endDate,
      totalDays,
      days,
      budget,
      status: 'draft',
      description: description || `为您定制的${destination}${totalDays}天行程`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return itinerary;
  }

  private async generateDayPlan(
    dayNumber: number,
    date: Date,
    destination: string,
    attractions: any[],
    restaurants: any[],
    weather: any,
    preferences?: any
  ): Promise<DayPlan> {
    const activities: Activity[] = [];
    const meals: MealPlan[] = [];

    const wakeUpTime = preferences?.wakeUpTime || '08:00';
    const sleepTime = preferences?.sleepTime || '22:00';

    let currentTime = timeToMinutes(wakeUpTime);

    const breakfast: MealPlan = {
      id: `meal-${dayNumber}-breakfast`,
      type: 'breakfast',
      name: restaurants[0]?.name || '早餐',
      location: {
        lat: 0,
        lng: 0,
        address: destination,
      },
      time: minutesToTime(currentTime),
      duration: 60,
      estimatedCost: 50,
    };
    meals.push(breakfast);
    currentTime += 60;

    const morningAttractions = this.selectAttractions(attractions, 2, currentTime, 720);
    for (const attraction of morningAttractions) {
      const activity = this.createActivity(attraction, dayNumber, currentTime);
      activities.push(activity);
      currentTime += activity.duration + 30;
    }

    const lunch: MealPlan = {
      id: `meal-${dayNumber}-lunch`,
      type: 'lunch',
      name: restaurants[1]?.name || '午餐',
      location: {
        lat: 0,
        lng: 0,
        address: destination,
      },
      time: minutesToTime(currentTime),
      duration: 90,
      estimatedCost: 100,
    };
    meals.push(lunch);
    currentTime += 90;

    const afternoonAttractions = this.selectAttractions(attractions, 2, currentTime, 1080);
    for (const attraction of afternoonAttractions) {
      const activity = this.createActivity(attraction, dayNumber, currentTime);
      activities.push(activity);
      currentTime += activity.duration + 30;
    }

    const dinner: MealPlan = {
      id: `meal-${dayNumber}-dinner`,
      type: 'dinner',
      name: restaurants[2]?.name || '晚餐',
      location: {
        lat: 0,
        lng: 0,
        address: destination,
      },
      time: minutesToTime(currentTime),
      duration: 90,
      estimatedCost: 150,
    };
    meals.push(dinner);

    const tips = this.generateDayTips(weather, activities);

    return {
      dayNumber,
      date: formatDate(date),
      activities,
      meals,
      weather,
      tips,
      summary: `第${dayNumber}天：游览${activities.length}个景点`,
    };
  }

  private selectAttractions(
    attractions: any[],
    count: number,
    startTime: number,
    endTime: number
  ): any[] {
    const availableTime = endTime - startTime;
    const avgDuration = 120;
    const maxCount = Math.min(count, Math.floor(availableTime / avgDuration));

    return attractions.slice(0, maxCount);
  }

  private createActivity(attraction: any, dayNumber: number, startTime: number): Activity {
    const duration = 120;

    return {
      id: `activity-${dayNumber}-${Date.now()}`,
      type: 'attraction',
      name: attraction.name,
      location: {
        lat: parseFloat(attraction.location?.split(',')[1] || '0'),
        lng: parseFloat(attraction.location?.split(',')[0] || '0'),
        address: attraction.address || '',
      },
      startTime: minutesToTime(startTime),
      endTime: minutesToTime(startTime + duration),
      duration,
      estimatedCost: parseFloat(attraction.cost || '0'),
      bookingRequired: false,
      rating: parseFloat(attraction.rating || '0'),
      imageUrl: attraction.photos?.[0]?.url,
    };
  }

  private generateDayTips(weather: any, activities: Activity[]): string {
    const tips: string[] = [];

    if (weather) {
      if (weather.conditionDay?.text?.includes('雨')) {
        tips.push('今天有雨，建议携带雨具，可考虑增加室内活动');
      }
      if (weather.temperature?.max > 30) {
        tips.push('今天天气炎热，注意防晒和补水');
      }
    }

    if (activities.length > 4) {
      tips.push('今天行程较满，建议穿舒适的鞋子');
    }

    return tips.join('；');
  }

  async *generateItineraryStream(
    params: ItineraryCreateParams
  ): AsyncGenerator<string, void, unknown> {
    const itinerary = await this.generateItinerary(params);
    yield JSON.stringify(itinerary);
  }
}

export const itineraryAgent = new ItineraryAgent();
