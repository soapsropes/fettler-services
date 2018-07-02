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
		results.filter(v => v !== null),
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

const markReadUnsolicited = async (profile, fetlife) => {
	const fromMenOnly = profile.autoMarkReadUnsolicitedFromMenOnly;
	console.log(`[${profile.nickname}] Auto-mark read unsolicited messages enabled${fromMenOnly ? ' (from men only)' : ''}`);

	const conversations = await fetlife.getConversations();
	console.log(`[${profile.nickname}] Reviewing ${conversations.length} conversation(s)`);

	const results = Promise.all(conversations.map(async (conversation) => {
		if (!conversation.has_new_messages) {
			return null;
		}

		const member = await fetlife.getMember(conversation.member.id);

		if (member.relation_with_me === 'friend' || member.relation_with_me === 'following') {
			return null;
		}

		if (fromMenOnly && member.gender.name !== 'Male') {
			return null;
		}

		const messages = await fetlife.getConversationMessages(conversation.id);

		const anyFromMe = _.find(messages, message => message.member.id === profile.id);

		if (anyFromMe) {
			return null;
		}

		const unreadIds = messages.filter(message => message.is_new)
			.map(message => message.id);

		if (unreadIds.length === 0) {
			return null;
		}

		console.log(`[${profile.nickname}] Mark ${unreadIds.length} message(s) read in conversation id ${conversation.id} from ${conversation.member.nickname} (${conversation.member.meta_line})`);

		return fetlife.markConversationMessagesRead(conversation.id, unreadIds)
			.then(() => {
				console.log(`[${profile.nickname}] Marked ${unreadIds.length} message(s) read from ${conversation.member.nickname} (${conversation.member.meta_line})`);
				return true;
			})
			.catch((error) => {
				console.error(`[${profile.nickname}] Failed to mark ${unreadIds.length} message(s) read from ${conversation.member.nickname} (${conversation.member.meta_line}): ${error}`);
				return false;
			});
	}));

	const stats = getStats(results);

	console.log(`[${profile.nickname}] Marked ${stats.success} unsolicited conversation(s) read`);

	if (stats.failure > 0) {
		console.error(`[${profile.nickname}] Failed to mark ${stats.failure} unsolicited conversation(s) read`);
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
				profile.lastRefreshedAt = new Date().toISOString();
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

		if (profile.autoMarkReadUnsolicited) {
			await markReadUnsolicited(profile, fetlife);
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
