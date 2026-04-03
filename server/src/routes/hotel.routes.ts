import { Router } from 'express';
import {
  searchHotels,
  getHotelDetail,
  getHotelPriceComparison,
} from '../controllers/hotel.controller';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Hotel API',
    endpoints: {
      'GET /': 'API info',
      'GET /search': 'Search hotels by location',
      'GET /:id': 'Get hotel details',
      'GET /:id/compare': 'Get price comparison',
    },
  });
});

router.get('/search', searchHotels);
router.get('/:id/compare', getHotelPriceComparison);
router.get('/:id', getHotelDetail);

export default router;
