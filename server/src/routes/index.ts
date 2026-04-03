import { Router } from "express";
import userRoutes from "./user.routes";
import itineraryRoutes from "./itinerary.routes";
import weatherRoutes from "./weather.routes";
import attractionRoutes from "./attraction.routes";
import restaurantRoutes from "./restaurant.routes";
import flightRoutes from "./flight.routes";
import hotelRoutes from "./hotel.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/itineraries", itineraryRoutes);
router.use("/weather", weatherRoutes);
router.use("/attractions", attractionRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/flights", flightRoutes);
router.use("/hotels", hotelRoutes);

export default router;
