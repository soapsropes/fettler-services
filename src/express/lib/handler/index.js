'use strict';

const _ = require('lodash');
const Boom = require('boom');

// Express requires error handlers to have four arguments, but eslint
// complains because we don't use `next`, being the last in the chain:
// eslint-disable-next-line no-unused-vars
const boomErrorHandler = (err, req, res, next) => {
	let boom;

	if (Boom.isBoom(err)) {
		boom = err;
	} else {
		console.error('Unexpected non-Boom error:');
		const message = _.get(err, 'message');
		console.error(message || err);
		boom = Boom.badImplementation(message || 'Internal server error');
	}

	console.error(`Boom: ${boom.message}`);
	console.error(boom.output);

	res.status(boom.output.statusCode)
		.json(boom.output.payload);
};

module.exports = {
	boomErrorHandler,
};
