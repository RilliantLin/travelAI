import { Router } from 'express';
import { searchAttractions, getAttractionDetail, getAttractionsByLocation } from '../controllers/attraction.controller';

const router = Router();

router.get('/search', searchAttractions);
router.get('/location', getAttractionsByLocation);
router.get('/:id', getAttractionDetail);

export default router;
