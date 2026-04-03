import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
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
