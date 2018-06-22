'use strict';

const FetLife = require('fetlife');

const getFetLifeUser = (accessToken) => {
	const fetlife = new FetLife({ accessToken });
	return fetlife.getMe();
};

module.exports = {
	getFetLifeUser,
};
