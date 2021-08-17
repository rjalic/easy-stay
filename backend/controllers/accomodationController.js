import asyncHandler from 'express-async-handler';
import Accomodation from '../models/accomodationModel.js';
import mongoose from 'mongoose';

// @desc    Fetch all accomodations
// @route   GET /api/accomodations
// @access  Public
const getAccomodations = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const capacity = Number(req.query.capacity) || 1;
  const minPrice = Number(req.query.minPrice) || 0;
  const maxPrice = Number(req.query.maxPrice) || 100000000;
  const city = req.query.city || '';
  const country = req.query.country || '';
  const rating = Number(req.query.rating) || 0;

  console.log(req.query);
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const count = await Accomodation.countDocuments({
    name: { $regex: req.query.keyword ? req.query.keyword : '', $options: 'i' },
    capacity: { $gte: capacity },
    price: { $gte: minPrice, $lt: maxPrice },
    'location.city': { $regex: city, $options: 'i' },
    'location.country': { $regex: country, $options: 'i' },
    rating: { $gte: rating },
  });

  const accomodations = await Accomodation.find({ ...keyword })
    .where('capacity')
    .gte(capacity)
    .where('price')
    .gte(minPrice)
    .lt(maxPrice)
    .where({
      'location.city': { $regex: city, $options: 'i' },
    })
    .where({
      'location.country': { $regex: country, $options: 'i' },
    })
    .where('rating')
    .gte(rating)
    .populate('host', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ accomodations, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Get current user's accomodations
// @route   GET /api/accomodations/myaccomodations
// @access  Private
const getMyAccomodations = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const obj = mongoose.Types.ObjectId(req.user.id);
  const accomodations = await Accomodation.find({ host: obj });

  const count = await Accomodation.countDocuments({ host: obj });

  res.json({ accomodations, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single accomodation
// @route   GET /api/accomodations/:id
// @access  Public
const getAccomodationById = asyncHandler(async (req, res) => {
  const populateAmenities =
    req.query.populateAmenities === 'true' ? true : false;

  let accomodation = await Accomodation.findById(req.params.id).populate(
    'reviews.user',
    'name'
  );

  if (accomodation) {
    if (populateAmenities) {
      accomodation = await Accomodation.findById(req.params.id)
        .populate('reviews.user', 'name')
        .populate('amenities');
    }
    res.json(accomodation);
  } else {
    res.status(404);
    throw new Error('Accomodation not found');
  }
});

// @desc    Delete accomodation
// @route   DELETE /api/accomodations/:id
// @access  Private/admin
const deleteAccomodation = asyncHandler(async (req, res) => {
  const accomodation = await Accomodation.findById(req.params.id);

  if (accomodation) {
    if (accomodation.host.toString() !== req.user.id && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to delete this accommodation.');
    }
    await accomodation.remove();
    res.json({ message: 'Accomodation deleted' });
  } else {
    res.status(404);
    throw new Error('Accomodation not found');
  }
});

// @desc    Create accomodation
// @route   POST /api/accomodations
// @access  Private/admin
const createAccomodation = asyncHandler(async (req, res) => {
  const accomodation = new Accomodation({
    name: 'Sample name',
    price: 0,
    host: req.user._id,
    image: '/images/placeholder.png',
    description: 'Sample description',
    location: {
      city: 'Sample city',
      country: 'Sample country',
    },
    reviews: [],
    rating: 0,
    numReviews: 0,
    capacity: 1,
    amenities: [],
  });

  const createdAccomodation = await accomodation.save();
  res.status(201).json(createdAccomodation);
});

// @desc    Update accomodation
// @route   PUT /api/accomodations/:id
// @access  Private
const updateAccomodation = asyncHandler(async (req, res) => {
  const accomodation = await Accomodation.findById(req.params.id);

  if (accomodation) {
    console.log(accomodation.host.toString(), req.user.id);

    if (accomodation.host.toString() !== req.user.id && !req.user.isAdmin) {
      console.log('here');
      res.status(401);
      throw new Error('No authorized to update this accommodation.');
    }

    const { name, price, image, description, location, capacity, amenities } =
      req.body;

    accomodation.name = name;
    accomodation.price = price;
    accomodation.image = image;
    accomodation.description = description;
    accomodation.location.city = location.city;
    accomodation.location.country = location.country;
    accomodation.capacity = capacity;
    accomodation.amenities = amenities;

    const updatedAccomodation = await accomodation
      .save()
      .catch((err) => console.error(err));
    res.status(201).json(updatedAccomodation);
  } else {
    res.status(404);
    throw new Error('Accomodation not found');
  }
});

// @desc    Create new review
// @route   POST /api/accomodations/:id/reviews
// @access  Private
const createAccomodationReview = asyncHandler(async (req, res) => {
  const accomodation = await Accomodation.findById(req.params.id);

  if (accomodation) {
    const { rating, comment } = req.body;

    const alreadyReviewed = accomodation.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Accomodation already reviewed');
    }

    const review = {
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    accomodation.reviews.push(review);

    accomodation.numReviews = accomodation.reviews.length;
    accomodation.rating = (
      accomodation.reviews.reduce((acc, item) => item.rating + acc, 0) /
      accomodation.reviews.length
    ).toFixed(1);

    await accomodation.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Accomodation not found');
  }
});

export {
  getAccomodations,
  getAccomodationById,
  deleteAccomodation,
  createAccomodation,
  updateAccomodation,
  createAccomodationReview,
  getMyAccomodations,
};
