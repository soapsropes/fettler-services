'use strict';

const express = require('express');
const _ = require('lodash');
const { api } = require('../../lib/wrapper');
const { putProfile } = require('../../lib/data/profiles');

const router = express.Router({ mergeParams: true });

const flags = [
	'enabled',
	'autoAccept',
	'autoMarkReadUnsolicited',
	'autoMarkReadUnsolicitedFromMaleOnly',
];

const updateProfile = api((req, res) => {
	const profile = _.cloneDeep(res.locals.profile);

	flags.forEach((flag) => {
		if (_.has(req.body, flag)) {
			profile[flag] = !!req.body[flag];
		}
	});

	if (profile.enabled) {
		profile.token = _.cloneDeep(res.locals.token);
	} else if (_.has(profile, 'token')) {
		delete profile.token;
	}

	profile.updatedAt = new Date().toISOString();

	return putProfile(profile)
		.then(() => _.pickBy(profile, (v, k) => k !== 'token'));
});

// this route's methods
router.post('/', updateProfile);

module.exports = router;
