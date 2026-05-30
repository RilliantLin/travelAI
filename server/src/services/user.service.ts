import { z } from "zod";
import { AppError } from "../contracts/errors";
import {
  createUserRecord,
  deleteUserRecord,
  getUserByEmail,
  getUserById,
  updateUserRecord,
} from "../repositories/user.repository";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().url().nullable().optional(),
});

export type UserCreateInput = z.infer<typeof createUserSchema>;
export type UserUpdateInput = z.infer<typeof updateUserSchema>;

export async function createUser(input: unknown) {
  const data = createUserSchema.parse(input);
  const existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    throw new AppError("INVALID_ARGUMENT", "该邮箱已被注册", 2, 400);
  }

  return createUserRecord(data);
}

export async function getUser(id: string) {
  const user = await getUserById(id);

  if (!user) {
    throw new AppError("USER_NOT_FOUND", "用户不存在", 2, 404);
  }

  return user;
}

export async function updateUser(id: string, input: unknown) {
  const data = updateUserSchema.parse(input);
  return updateUserRecord(id, data);
}

export async function deleteUser(id: string): Promise<void> {
  await deleteUserRecord(id);
}

