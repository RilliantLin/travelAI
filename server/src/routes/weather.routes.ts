import { Router } from 'express';
import { getCurrentWeather, getWeatherForecast, getWeatherByDate } from '../controllers/weather.controller';

const router = Router();

router.get('/current', getCurrentWeather);
router.get('/forecast', getWeatherForecast);
router.get('/:location/:date', getWeatherByDate);

export default router;
