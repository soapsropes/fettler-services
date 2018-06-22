'use strict';

const AWS = require('aws-sdk');
const Boom = require('boom');

const TableName = process.env.DynamoTableProfiles;

const dynamo = new AWS.DynamoDB.DocumentClient();

const getProfile = (userId) => {
	const params = {
		TableName,
		Key: { userId },
	};

	return dynamo.get(params)
		.promise()
		.catch((error) => {
			throw Boom.badImplementation(`Error: ${error}; GET FAILED: ${JSON.stringify(params)}`);
		})
		.then(response => response.Item);
};

const putProfile = (profile) => {
	const params = {
		TableName,
		Item: profile,
	};

	return dynamo.put(params)
		.promise()
		.catch((error) => {
			throw Boom.badImplementation(`Error: ${error}; PUT FAILED: ${JSON.stringify(params)}`);
		})
		.then(() => profile);
};

module.exports = {
	getProfile,
	putProfile,
};
