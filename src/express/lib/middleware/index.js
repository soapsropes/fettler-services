'use strict';

const _ = require('lodash');
const Boom = require('boom');
const { middleware } = require('../wrapper');
const {
	getProfile,
	putProfile,
} = require('../data/profiles');
const { getFetLifeUser } = require('../data/fetlife');

const tokenFields = [
	'access_token',
	'token_type',
	'expires_in',
	'refresh_token',
	'created_at',
	'expires_at',
];

const notFound = middleware(() => {
	throw Boom.notFound();
});

const gatherTokenFromBody = middleware((req, res) => {
	const token = _.get(req, 'body.token');

	if (!token) {
		throw Boom.badRequest('No token provided');
	}

	if (!_.isPlainObject(token)) {
		throw Boom.badRequest('Token must be an object');
	}

	const missing = tokenFields.filter(field => !_.has(token, field));

	if (missing.length > 0) {
		throw Boom.badRequest(`Token is missing field(s): ${missing.join(', ')}`);
	}

	res.locals.token = token;
});

const gatherUserFromToken = middleware((req, res) =>
	getFetLifeUser(res.locals.token)
		.then((user) => {
			res.locals.user = user;
		}));

const gatherProfileFromUser = middleware((req, res) =>
	getProfile(res.locals.user.id)
		.then(profile => profile
			|| putProfile({
				userId: res.locals.user.id,
				nickname: res.locals.user.nickname,
				createdAt: new Date().toISOString(),
				enabled: false,
			}))
		.then((profile) => {
			res.locals.profile = profile;
		}));

module.exports = {
	notFound,
	gatherTokenFromBody,
	gatherUserFromToken,
	gatherProfileFromUser,
};
