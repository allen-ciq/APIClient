// module.exports = Object.freeze({
export const registry = Object.freeze({
	getEndpoint: {
		url: 'http://localhost:3000/path/elem?{{param}}',
		method: 'get',
		headers: {
			cookie: 'JSESSIONID={{token}}'
		}
	},
	postEndpoint: {
		url: 'http://localhost:3000/path/elem',
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
		url: 'http://localhost:3000/path/elem',
		method: '_delete'
	},
	test: {
		url: 'http://localhost:3000/{{param}}',
		method: 'custom',
		customMethod: 'get',
		headers: {
			accept: 'application/json'
		}
	},
	fetchTest: {
		url: 'http://localhost:3000/{{param}}',
		method: 'fetch',
		fetchMethod: 'post',
		headers: {
			'content-type': 'application/json'
		},
		rate: 5,
		period: 'minute'
	}
});
