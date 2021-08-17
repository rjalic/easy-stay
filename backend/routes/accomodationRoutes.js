import express from 'express';
import {
  getAccomodationById,
  getAccomodations,
  deleteAccomodation,
  createAccomodation,
  updateAccomodation,
  createAccomodationReview,
  getMyAccomodations,
} from '../controllers/accomodationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getAccomodations).post(protect, createAccomodation);

router.route('/myaccomodations').get(protect, getMyAccomodations);

router.route('/:id/reviews').post(protect, createAccomodationReview);

router
  .route('/:id')
  .get(getAccomodationById)
  .delete(protect, deleteAccomodation)
  .put(protect, updateAccomodation);

export default router;
