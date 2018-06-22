'use strict';

const _ = require('lodash');
const Boom = require('boom');

const middleware = fn =>
	(req, res, next) => Promise.resolve()
		.then(() => fn(req, res))
		.then(() => next())
		.catch(next);

const api = fn =>
	(req, res, next) => Promise.resolve()
		.then(() => fn(req, res))
		.then((reply) => {
			if (reply === undefined) {
				throw Boom.badImplementation('API method returned nothing');
			}
			if (_.isObject(reply) && _.has(reply, 'data')) {
				res.json(reply);
			} else {
				res.json({ data: reply });
			}
		})
		.catch(next);

module.exports = {
	middleware,
	api,
};
