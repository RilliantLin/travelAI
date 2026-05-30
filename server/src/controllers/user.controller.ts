import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../contracts/errors";
import {
  createUser as createUserService,
  deleteUser as deleteUserService,
  getUser as getUserService,
  updateUser as updateUserService,
} from "../services/user.service";

const getParam = (param: string | string[] | undefined): string | undefined => {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await createUserService(req.body);

    return res.status(201).json({
      success: true,
      message: "用户创建成功",
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        data: null,
      });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "数据验证失败",
        errors: error.issues,
        data: null,
      });
    }
    console.error("创建用户失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "缺少用户ID",
        data: null,
      });
    }

    const user = await getUserService(userId);

    return res.json({
      success: true,
      message: "获取用户成功",
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        data: null,
      });
    }

    console.error("获取用户失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "缺少用户ID",
        data: null,
      });
    }

    const user = await updateUserService(userId, req.body);

    return res.json({
      success: true,
      message: "用户更新成功",
      data: user,
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

    console.error("更新用户失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "缺少用户ID",
        data: null,
      });
    }

    await deleteUserService(userId);

    return res.json({
      success: true,
      message: "用户删除成功",
      data: null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        data: null,
      });
    }

    console.error("删除用户失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
};
