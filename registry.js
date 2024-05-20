export const registry = Object.freeze({
	getEndpoint: {
		url: 'http://localhost:3000/path/elem?{{search}}',
		method: 'get',
	},
	postEndpoint: {
		url: 'http://localhost:3000/login',
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: {
			'username': '{{username}}',
			'password': '{{password}}'
		}
	},
	putEndpoint: {
		url: 'http://localhost:3000/path/elem/{{id}}',
		method: 'put',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: '{{payload}}'
	},
	deleteEndpoint: {
		url: 'http://localhost:3000/path/elem?{{search}}',
		method: 'delete',
		headers: {
			not_a_cookie: 'SESSIONID={{token}}'
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
	customTest: {
		url: 'http://localhost:3000/metrics',
		method: 'custom',
		customMethod: 'post',
		headers: {
			accept: 'application/json',
			'content-type': 'application/json'
		},
		body: {
			slot: '{{slot}}',
			uuid: '{{uuid}}'
		}
	},
	timeoutTest: {
		url: 'http://localhost:3000/timeout',
		method: 'custom',
		customMethod: 'post',
		headers: {
			'x-delay': '{{delay}}'
		},
		timeout: 2000
	},
	throttleTest: {
		url: 'http://localhost:3000/',
		method: 'fetch',
		fetchMethod: 'post',
		rate: 1,
		period: 'minute'
	}
});
