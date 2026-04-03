import { Router, Request, Response } from "express";
import {
  getUserPreferenceForRecommendation,
  calculateAttractionMatchScore,
} from "../services/recommendation.service";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Attraction API",
    endpoints: {
      "GET /": "API info",
      "GET /search": "Search attractions by location",
      "GET /recommendations/:userId": "Get personalized recommendations",
      "GET /:id": "Get attraction details",
    },
  });
});

router.get("/search", (req: Request, res: Response) => {
  const { city, lat, lon, radius, category } = req.query;
  res.json({
    message: "Search attractions",
    params: { city, lat, lon, radius, category },
    data: [],
  });
});

router.get("/recommendations/:userId", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const { destination, days } = req.query as { destination?: string; days?: string };

    const preference = await getUserPreferenceForRecommendation(userId);

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: "用户偏好未设置，请先设置旅行偏好",
        data: null,
      });
    }

    const mockAttractions = [
      {
        id: "1",
        name: "故宫博物院",
        location: "北京市东城区",
        category: "历史文化",
        estimatedCost: 60,
        rating: 4.8,
        duration: 180,
      },
      {
        id: "2",
        name: "颐和园",
        location: "北京市海淀区",
        category: "自然风光",
        estimatedCost: 30,
        rating: 4.6,
        duration: 150,
      },
      {
        id: "3",
        name: "天坛公园",
        location: "北京市东城区",
        category: "历史文化",
        estimatedCost: 15,
        rating: 4.5,
        duration: 120,
      },
    ];

    const recommendations = mockAttractions.map((attraction) => {
      const { score, reasons } = calculateAttractionMatchScore(attraction, preference);
      return {
        ...attraction,
        matchScore: score,
        matchReasons: reasons,
      };
    });

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      message: "获取个性化景点推荐成功",
      data: {
        preference: {
          budgetRange: preference.budgetRange,
          preferredActivities: preference.preferredActivities,
          travelStyle: preference.travelStyle,
        },
        recommendations,
      },
    });
  } catch (error) {
    console.error("获取景点推荐失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  res.json({ message: `Get attraction ${req.params.id}`, data: null });
});

export default router;
