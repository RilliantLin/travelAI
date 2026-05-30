import prisma from "../config/database";

export interface UserCreateData {
  id?: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface UserUpdateData {
  name?: string;
  avatar?: string | null;
}

export function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { preferences: true },
  });
}

export function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export function createUserRecord(data: UserCreateData) {
  return prisma.user.create({ data });
}

export function upsertUserRecord(id: string, data: Omit<UserCreateData, "id">) {
  return prisma.user.upsert({
    where: { id },
    update: {
      name: data.name,
      avatar: data.avatar,
    },
    create: {
      id,
      ...data,
    },
  });
}

export function updateUserRecord(id: string, data: UserUpdateData) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUserRecord(id: string): Promise<void> {
  await prisma.user.delete({
    where: { id },
  });
}
