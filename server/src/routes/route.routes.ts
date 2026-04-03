import { Router } from 'express';
import { planRoute, getDistance, geocode } from '../controllers/route.controller';

const router = Router();

router.get('/plan', planRoute);
router.get('/distance', getDistance);
router.get('/geocode', geocode);

export default router;
