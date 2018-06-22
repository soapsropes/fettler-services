'use strict';

const AWS = require('aws-sdk');
const Boom = require('boom');

const TableName = process.env.DynamoTableProfiles;

const dynamo = new AWS.DynamoDB.DocumentClient();

const getProfiles = () => {
	const params = {
		TableName,
		FilterExpression: '#enabled = :true',
		ExpressionAttributeNames: {
			'#enabled': 'enabled',
		},
		ExpressionAttributeValues: {
			':true': true,
		},
	};

	return dynamo.scan(params)
		.promise()
		.catch((error) => {
			throw Boom.badImplementation(`Error: ${error}; SCAN FAILED: ${JSON.stringify(params)}`);
		})
		.then((response) => {
			if (response.LastEvaluatedKey) {
				console.error(`WARNING: reached scan page limit on ${TableName}`);
			}
			return response.Items;
		});
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
	getProfiles,
	putProfile,
};
