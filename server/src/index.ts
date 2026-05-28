import "./config/env";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://travel-ai-navy.vercel.app",
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin denied: ${origin}`));
    },
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api", (req, res) => {
  res.json({
    message: "旅游规划 AI Agent API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      itineraries: "/api/itineraries",
      weather: "/api/weather",
      attractions: "/api/attractions",
      restaurants: "/api/restaurants",
      flights: "/api/flights",
      hotels: "/api/hotels",
      agent: "/api/agent",
    },
  });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api`);
});

export default app;
