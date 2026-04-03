import { Request, Response } from "express";
import prisma from "../config/database";
import { z } from "zod";

const getParam = (param: string | string[] | undefined): string | undefined => {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
};

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "该邮箱已被注册",
        data: null,
      });
    }

    const user = await prisma.user.create({
      data: validatedData,
    });

    return res.status(201).json({
      success: true,
      message: "用户创建成功",
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
        data: null,
      });
    }

    return res.json({
      success: true,
      message: "获取用户成功",
      data: user,
    });
  } catch (error) {
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

    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, avatar },
    });

    return res.json({
      success: true,
      message: "用户更新成功",
      data: user,
    });
  } catch (error) {
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

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({
      success: true,
      message: "用户删除成功",
      data: null,
    });
  } catch (error) {
    console.error("删除用户失败:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      data: null,
    });
  }
};
