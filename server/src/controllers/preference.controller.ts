import { Request, Response } from "express";
import prisma from "../config/database";
import { getCached, setCache, deleteCache, CACHE_KEYS, CACHE_TTL } from "../config/redis";
import { z } from "zod";

const getParam = (param: string | string[] | undefined): string | undefined => {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
};

const preferenceSchema = z.object({
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  currency: z.string().default("CNY"),
  travelerCount: z.number().int().min(1).max(20).default(1),
  travelStyle: z.enum(["relaxed", "moderate", "intensive"]).optional(),
  dietaryRestrictions: z.array(z.string()).default([]),
  preferredActivities: z.array(z.string()).default([]),
  transportPreference: z.enum(["plane", "train", "car", "bus"]).optional(),
  accommodationType: z.enum(["hotel", "hostel", "apartment", "resort"]).optional(),
  accessibilityNeeds: z.boolean().default(false),
});

export const getPreference = async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "缺少用户ID",
        data: null,
      });
    }

    const cacheKey = `${CACHE_KEYS.USER_PREFERENCES}:${userId}`;
    const cachedPreference = await getCached(cacheKey);

    if (cachedPreference) {
      return res.json({
        success: true,
        message: "获取用户偏好成功 (缓存)",
        data: cachedPreference,
      });
    }

    const preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      return res.json({
        success: true,
        message: "用户偏好未设置，返回默认值",
        data: null,
      });
    }

    await setCache(cacheKey, preference, CACHE_TTL.USER_PREFERENCES);

    return res.json({
      success: true,
      message: "获取用户偏好成功",
      data: preference,
    });
  } catch (error) {
    console.error("获取用户偏好失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
};

export const createOrUpdatePreference = async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "缺少用户ID",
        data: null,
      });
    }
    const validatedData = preferenceSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
        data: null,
      });
    }

    const preference = await prisma.userPreference.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        ...validatedData,
      },
    });

    const cacheKey = `${CACHE_KEYS.USER_PREFERENCES}:${userId}`;
    await setCache(cacheKey, preference, CACHE_TTL.USER_PREFERENCES);

    return res.json({
      success: true,
      message: "保存用户偏好成功",
      data: preference,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "数据验证失败",
        errors: error.issues,
        data: null,
      });
    }
    console.error("保存用户偏好失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
};

export const deletePreference = async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "缺少用户ID",
        data: null,
      });
    }

    const preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: "用户偏好不存在",
        data: null,
      });
    }

    await prisma.userPreference.delete({
      where: { userId },
    });

    const cacheKey = `${CACHE_KEYS.USER_PREFERENCES}:${userId}`;
    await deleteCache(cacheKey);

    return res.json({
      success: true,
      message: "删除用户偏好成功",
      data: null,
    });
  } catch (error) {
    console.error("删除用户偏好失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
};

export const getPreferenceForRecommendation = async (userId: string) => {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    return null;
  }

  return {
    budgetRange: {
      min: preference.budgetMin ?? 0,
      max: preference.budgetMax ?? Infinity,
      currency: preference.currency,
    },
    travelerCount: preference.travelerCount,
    travelStyle: preference.travelStyle ?? "moderate",
    dietaryRestrictions: preference.dietaryRestrictions,
    preferredActivities: preference.preferredActivities,
    transportPreference: preference.transportPreference ?? "plane",
    accommodationType: preference.accommodationType ?? "hotel",
    accessibilityNeeds: preference.accessibilityNeeds,
  };
};
