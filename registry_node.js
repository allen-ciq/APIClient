module.exports = Object.freeze({
	getEndpoint: {
		method: 'get',
		protocol: 'http:',
		host: 'localhost',
		port: 3000,
		path: '/path/elem?{{search}}'
	},
	postEndpoint: {
		method: 'post',
		protocol: 'http:',
		host: 'localhost',
		port: 3000,
		path: '/login',
		headers: {
			'Content-Type': 'application/json'
		},
		body: {
			'username': '{{username}}',
			'password': '{{password}}'
		}
	},
	putEndpoint: {
		method: 'put',
		protocol: 'http:',
		host: 'localhost',
		port: 3000,
		path: '/path/elem/{{id}}',
	},
	deleteEndpoint: {
		method: 'delete',
		protocol: 'http:',
		host: 'localhost',
		port: 3000,
		path: '/path/elem?{{search}}',
		headers: {
			not_a_cookie: 'JSESSIONID={{token}}'
		}
	},
	fetchTest: {
		url: 'http://localhost:3000/{{type}}/resource',
		method: 'fetch',
		fetchMethod: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: '{{payload}}'
	},
	timeoutTest: {
		method: 'post',
		protocol: 'http:',
		host: 'localhost',
		port: 3000,
		path: '/timeout',
		headers: {
			'x-delay': '{{delay}}'
		},
		timeout: 2000
	},
	throttleTest: {
		method: 'get',
		protocol: 'http:',
		host: 'localhost',
		port: 3000,
		path: '/',
		rate: 1,
		period: 'minute'
	}
});
