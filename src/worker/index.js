'use strict';

const { lambda } = require('nice-lambda');
const Boom = require('boom');
const _ = require('lodash');
const FetLife = require('fetlife');
const {
	getProfiles,
	putProfile,
} = require('./profiles');

const getStats = results =>
	_.reduce(
		results,
		(s, v) => {
			s[v ? 'success' : 'failure'] += 1;
			return s;
		},
		{ success: 0, failure: 0 },
	);

const acceptFriendRequests = async (profile, fetlife) => {
	console.log(`[${profile.nickname}] Auto-accept friend requests enabled`);

	const friendRequests = await fetlife.getFriendRequests();
	console.log(`[${profile.nickname}] Received ${friendRequests.length} friend request(s)`);

	const results = await Promise.all(friendRequests.map((friendRequest) => {
		console.log(`[${profile.nickname}] Accepting friend request ${friendRequest.id} from ${friendRequest.member.nickname}`);
		return fetlife.acceptFriendRequest(friendRequest.id)
			.then((resp) => {
				console.log(`[${profile.nickname}] Accepted friend request from ${resp.member.nickname}`);
				return true;
			})
			.catch((error) => {
				console.error(`[${profile.nickname}] Failed to accept friend request ${friendRequest.id}: ${error}`);
				return false;
			});
	}));

	const stats = getStats(results);

	console.log(`[${profile.nickname}] Accepted ${stats.success} friend request(s)`);

	if (stats.failure > 0) {
		console.error(`[${profile.nickname}] Failed to accept ${stats.failure} friend request(s)`);
	}
};

const processProfile = async (profile) => {
	console.log(`Process profile for user id ${profile.userId} (${profile.nickname})`);

	let processed = false;

	try {
		if (!profile.token) {
			throw Boom.unauthorized(`Profile for user id ${profile.userId} has no token`);
		}

		const fetlife = new FetLife({
			accessToken: profile.token,
			onTokenRefresh: (newToken) => {
				newToken.expires_at = newToken.expires_at.toISOString();
				console.log(`Refreshed access token for user id ${profile.userId}`);
				console.log(`Old expiration: ${profile.token.expires_at}`);
				console.log(`New expiration: ${newToken.expires_at}`);
				profile.token = newToken;
			},
		});

		const me = await fetlife.getMe();

		if (me.nickname !== profile.nickname) {
			console.log(`Updating nickname for user id ${profile.userId} from ${profile.nickname} to ${me.nickname}`);
			profile.nickname = me.nickname;
		}

		if (profile.autoAccept) {
			await acceptFriendRequests(profile, fetlife);
		}

		processed = true;
	} catch (error) {
		console.error(`Failed to process profile for user id ${profile.userId} (${profile.nickname}): ${error}`);

		if (Boom.isBoom(error) && error.output.statusCode === 401) {
			if (_.has(profile, 'token')) {
				console.log(`Removing token for user id ${profile.userId}`);
				delete profile.token;
			}

			console.log(`Disabling profile for user id ${profile.userId}`);
			profile.enabled = false;
			profile.autoDisabledAt = new Date().toISOString();
		}
	}

	profile.lastProcessedAt = new Date().toISOString();

	return putProfile(profile)
		.then(() => processed)
		.catch((error) => {
			console.error(`Failed to update profile for user id ${profile.userId}: ${error}`);
			return false;
		});
};

exports.handler = lambda(() => getProfiles()
	.then(profiles => Promise.all(profiles.map(processProfile)))
	.then(getStats)
	.then((stats) => {
		console.log(`Processed ${stats.success} profile(s)`);
		if (stats.failure > 0) {
			console.error(`Failed to process ${stats.failure} profile(s)`);
		}
		return stats;
	}));
