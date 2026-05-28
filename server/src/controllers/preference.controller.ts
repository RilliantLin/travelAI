import { Request, Response } from "express";
import { z } from "zod";
import {
  deletePreferenceByUserId,
  getPreferenceByUserId,
  getPreferenceForRecommendation as getPreferenceForRecommendationService,
  upsertPreference,
} from "../services/preference.service";

const getParam = (param: string | string[] | undefined): string | undefined => {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
};

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

    const preference = await getPreferenceByUserId(userId);

    if (!preference) {
      return res.json({
        success: true,
        message: "用户偏好未设置，返回默认值",
        data: null,
      });
    }
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
    const preference = await upsertPreference(userId, req.body);

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
        data: null,
      });
    }

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

    const deleted = await deletePreferenceByUserId(userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "用户偏好不存在",
        data: null,
      });
    }

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
  return getPreferenceForRecommendationService(userId);
};
