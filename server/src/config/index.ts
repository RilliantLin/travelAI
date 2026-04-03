export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    qweather: {
      apiKey: process.env.QWEATHER_API_KEY,
    },
    amap: {
      apiKey: process.env.AMAP_API_KEY,
    },
  },
} as const;
