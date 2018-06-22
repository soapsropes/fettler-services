'use strict';

process.env.AWS_REGION = 'us-east-1';
process.env.DynamoTableProfiles = 'Fettler-Dev-Profiles';

const { handler } = require('../index');

handler({}, {}, (err, data) => {
	if (err) {
		console.error(`Error: ${err}`);
	} else {
		console.log(`Data: ${JSON.stringify(data, null, 2)}`);
	}
});
