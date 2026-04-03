import { Router } from 'express';
import { searchRestaurants, getRestaurantDetail, getRestaurantsByLocation } from '../controllers/restaurant.controller';

const router = Router();

router.get('/search', searchRestaurants);
router.get('/location', getRestaurantsByLocation);
router.get('/:id', getRestaurantDetail);

export default router;
