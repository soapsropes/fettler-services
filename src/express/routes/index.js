'use strict';

const express = require('express');
const profileRouter = require('./profile');

const router = express.Router({ mergeParams: true });

// child routes
router.use('/profile', profileRouter);

module.exports = router;
