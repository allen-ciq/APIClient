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
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: '{{payload}}'
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
		method: 'fetch',
		fetchMethod: 'POST',
		protocol: 'http:',
		host: 'localhost',
		port: 3000,
		path: '/{{type}}/resource',
		headers: {
			'Content-Type': 'application/json',
			'x-cookie': true
		},
		body: '{{payload}}'
	},
	customTest: {
		method: 'custom',
		customMethod: 'patch',
		protocol: 'http:',
		host: 'localhost',
		port: 3000,
		path: '/metrics',
		headers: {
			accept: 'application/json',
			'content-type': 'application/x-www-form-urlencoded'
		},
		body: {
			slot: '{{slot}}',
			uuid: '{{uuid}}'
		}
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
