import { z } from "zod";

const statusSchema = z.enum(["draft", "confirmed", "completed", "cancelled"]);

const dateStringSchema = z.string().min(1).refine((value) => {
  const time = Date.parse(value);
  return Number.isFinite(time);
}, "必须是合法日期");

const locationSchema = z
  .object({
    lat: z.number().finite().optional(),
    lng: z.number().finite().optional(),
    address: z.string().optional(),
    name: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
  })
  .default({});

const activitySchema = z.object({
  id: z.string().optional(),
  type: z.string().default("attraction"),
  name: z.string().min(1),
  location: locationSchema,
  description: z.string().optional(),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
  duration: z.number().finite().nonnegative().optional(),
  estimatedCost: z.number().finite().nonnegative().optional(),
  bookingRequired: z.boolean().optional().default(false),
  bookingUrl: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().finite().optional(),
  imageUrl: z.string().optional(),
});

const mealSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("lunch"),
  name: z.string().min(1),
  location: locationSchema,
  time: z.string().optional().default(""),
  duration: z.number().finite().nonnegative().optional().default(60),
  estimatedCost: z.number().finite().nonnegative().optional().default(0),
  cuisine: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().finite().optional(),
  imageUrl: z.string().optional(),
});

const accommodationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  location: locationSchema,
  type: z.string().optional().default("酒店"),
  checkIn: z.string().optional().default("14:00"),
  checkOut: z.string().optional().default("12:00"),
  estimatedCost: z.number().finite().nonnegative().optional().default(0),
  rating: z.number().finite().optional(),
  amenities: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

const daySchema = z.object({
  dayNumber: z.number().int().positive().optional(),
  date: dateStringSchema.optional(),
  activities: z.array(activitySchema).optional().default([]),
  meals: z.array(mealSchema).optional().default([]),
  accommodation: accommodationSchema.optional(),
  tips: z.string().optional(),
  summary: z.string().optional(),
});

export const itineraryBudgetSchema = z
  .object({
    total: z.number().finite().nonnegative().optional(),
    totalBudget: z.number().finite().nonnegative().optional(),
    totalEstimated: z.number().finite().nonnegative().optional(),
    transportation: z.number().finite().nonnegative().optional(),
    accommodation: z.number().finite().nonnegative().optional(),
    food: z.number().finite().nonnegative().optional(),
    attractions: z.number().finite().nonnegative().optional(),
    shopping: z.number().finite().nonnegative().optional(),
    entertainment: z.number().finite().nonnegative().optional(),
    insurance: z.number().finite().nonnegative().optional(),
    visa: z.number().finite().nonnegative().optional(),
    communication: z.number().finite().nonnegative().optional(),
    miscellaneous: z.number().finite().nonnegative().optional(),
    currency: z.string().optional().default("CNY"),
  })
  .passthrough();

export const itineraryCreateSchema = z
  .object({
    userId: z.string().min(1),
    title: z.string().optional(),
    destination: z.string().min(1),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    description: z.string().optional(),
    status: statusSchema.optional().default("draft"),
    days: z.array(daySchema).optional().default([]),
    budget: itineraryBudgetSchema.optional(),
    totalBudget: z.number().finite().nonnegative().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => Date.parse(data.endDate) >= Date.parse(data.startDate), {
    message: "endDate 不能早于 startDate",
    path: ["endDate"],
  });

export const itineraryUpdateSchema = z
  .object({
    userId: z.string().min(1).optional(),
    title: z.string().optional(),
    destination: z.string().optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    description: z.string().nullable().optional(),
    status: statusSchema.optional(),
    days: z.array(daySchema).optional(),
    budget: itineraryBudgetSchema.optional(),
    totalBudget: z.number().finite().nonnegative().nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return Date.parse(data.endDate) >= Date.parse(data.startDate);
    },
    {
      message: "endDate 不能早于 startDate",
      path: ["endDate"],
    }
  );

export type ItineraryCreateInput = z.infer<typeof itineraryCreateSchema>;
export type ItineraryUpdateInput = z.infer<typeof itineraryUpdateSchema>;
export type ItineraryDayInput = z.infer<typeof daySchema>;
export type ItineraryBudgetInput = z.infer<typeof itineraryBudgetSchema>;

