import { Router } from "express";
import userRoutes from "./user.routes";
import preferenceRoutes from "./preference.routes";
import itineraryRoutes from "./itinerary.routes";
import weatherRoutes from "./weather.routes";
import attractionRoutes from "./attraction.routes";
import restaurantRoutes from "./restaurant.routes";
import flightRoutes from "./flight.routes";
import hotelRoutes from "./hotel.routes";
import agentRoutes from "./agent.routes";
import routeRoutes from "./route.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/preferences", preferenceRoutes);
router.use("/itineraries", itineraryRoutes);
router.use("/weather", weatherRoutes);
router.use("/attractions", attractionRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/flights", flightRoutes);
router.use("/hotels", hotelRoutes);
router.use("/routes", routeRoutes);
router.use("/agent", agentRoutes);

export default router;
