'use strict';

module.exports = {
	getEndpoint: {
		path: '/path/elem?{{param}}',
		method: 'get',
		headers: {
			Cookie: 'JSESSIONID={{token}}'
		}
	},
	postEndpoint: {
		path: 'path/elem',
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: {
			'username': '{{username}}',
			'password': '{{password}}'
		}
	},
	deleteEndpoint: {
		path: '/path/elem',
		method: '_delete'
	}
};
