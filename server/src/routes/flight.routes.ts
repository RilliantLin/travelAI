import { Router } from 'express';
import {
  searchFlights,
  getFlightDetail,
  getFlightPriceComparison,
  getAirlines,
  getAirports,
} from '../controllers/flight.controller';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Flight API',
    endpoints: {
      'GET /': 'API info',
      'GET /search': 'Search flights',
      'GET /airlines': 'Get airlines list',
      'GET /airports': 'Get airports list',
      'GET /:id': 'Get flight detail',
      'GET /:id/compare': 'Get price comparison',
    },
  });
});

router.get('/search', searchFlights);
router.get('/airlines', getAirlines);
router.get('/airports', getAirports);
router.get('/:id/compare', getFlightPriceComparison);
router.get('/:id', getFlightDetail);

export default router;
