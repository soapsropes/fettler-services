'use strict';

const express = require('express');
const { eventContext } = require('aws-serverless-express/middleware');
const logger = require('morgan');
const {
	gatherTokenFromBody,
	gatherUserFromToken,
	gatherProfileFromUser,
	notFound,
} = require('./lib/middleware');
const { boomErrorHandler } = require('./lib/handler');

const rootRouter = require('./routes');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(eventContext());

// FetLife authorization
app.use(
	'/',
	gatherTokenFromBody,
	gatherUserFromToken,
	gatherProfileFromUser,
);

// API Routes
app.use('/', rootRouter);

// Catch-all not found
app.use(notFound);

// Boom error handler
app.use(boomErrorHandler);

module.exports = app;
