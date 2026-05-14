import { Router } from 'express';
import {
  createItinerary,
  getItinerary,
  getUserItineraries,
  updateItinerary,
  deleteItinerary,
} from '../controllers/itinerary.controller';
import {
  getItineraryChatMessages,
  saveItineraryChatMessages,
} from '../controllers/itinerary-chat.controller';

const router = Router();

router.post('/', createItinerary);
router.get('/', getUserItineraries);
router.get('/:id/chat-messages', getItineraryChatMessages);
router.put('/:id/chat-messages', saveItineraryChatMessages);
router.get('/:id', getItinerary);
router.put('/:id', updateItinerary);
router.delete('/:id', deleteItinerary);

export default router;
