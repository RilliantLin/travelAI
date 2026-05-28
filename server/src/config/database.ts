import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development" && process.env.TRAVEL_CLI !== "true"
      ? ["query", "error", "warn"]
      : ["error"],
});

export default prisma;
