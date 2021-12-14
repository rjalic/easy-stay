import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Accommodation from '../models/accommodationModel.js';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const {
    accommodation,
    paymentMethod,
    totalPrice,
    paymentResult,
    bookedFrom,
    bookedTo,
  } = req.body;

  if (!accommodation) {
    res.status(400);
    throw new Error('Specify accommodation');
  } else {
    const booking = new Booking({
      user: req.user._id,
      accommodation,
      paymentMethod,
      totalPrice,
      paymentResult,
      bookedFrom,
      bookedTo,
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
  }
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email')
    .populate('accommodation');

  if (booking) {
    res.json(booking);
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

// @desc    Update booking to paid
// @route   PUT /api/bookings/:id/pay
// @access  Private
const updateBookingToPaid = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (booking) {
    booking.isPaid = true;
    booking.paidAt = new Date().toISOString();
    booking.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

// @desc    Get current user's bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).populate(
    'accommodation',
    'name'
  );

  res.json(bookings);
});

// @desc    Get current user's bookings
// @route   GET /api/bookings
// @access  Private/admin
const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate('user', 'id name email')
    .populate('accommodation', 'id name');

  res.json(bookings);
});

// @desc    Create new review
// @route   POST /api/bookings/:id/review
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(
    'accommodation',
    '_id'
  );
  const accommodation = await Accommodation.findById(booking.accommodation._id);

  if (booking && accommodation) {
    if (!booking.isReviewed) {
      const { rating, comment } = req.body;

      const review = {
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      accommodation.reviews.push(review);
      accommodation.numReviews = accommodation.reviews.length;
      accommodation.rating = (
        accommodation.reviews.reduce((acc, item) => item.rating + acc, 0) /
        accommodation.reviews.length
      ).toFixed(1);
      booking.isReviewed = true;

      await accommodation.save();
      await booking.save();
      res.status(201).json({ message: 'Review added' });
    }
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

// @desc    Get bookings for the owner's accommodations
// @route   GET /api/bookings/owner
// @access  Private
const getOwnerBookings = asyncHandler(async (req, res) => {
  console.log(req.user._id);
  const obj = mongoose.Types.ObjectId(req.user.id);
  const accommodations = await Accommodation.find({ host: obj });
  const bookings = await Booking.find({
    accommodation: { $in: accommodations },
  })
    .populate('accommodation', 'name')
    .populate('user', 'name email');
  res.json(bookings);
});

export {
  createBooking,
  getBookingById,
  updateBookingToPaid,
  getMyBookings,
  getBookings,
  createReview,
  getOwnerBookings,
};
