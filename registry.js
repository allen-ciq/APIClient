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
		url: 'http://localhost:3000/path/elem/{{id}}/{{id}}',
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
		url: 'http://localhost:3000/metrics',
		method: 'fetch',
		fetchMethod: 'post',
		headers: {
			accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: {
			slot: '{{slot}}',
			uuid: '{{uuid}}'
		}
	},
	customXHRTest: {
		url: 'http://localhost:3000/metrics',
		method: 'xhr',
		customMethod: 'PATCH',
		headers: {
			accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: {
			slot: '{{slot}}',
			uuid: '{{uuid}}'
		}
	},
	customFetchTest: {
		url: 'http://localhost:3000/{{type}}/resource',
		method: 'customFetch',
		fetchMethod: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-cookie': true
		},
		body: '{{payload}}'
	},
	timeoutTest: {
		url: 'http://localhost:3000/timeout',
		method: 'post',
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
	},
	failureTestFetch: {
		url: 'http://localhost:3000/failure',
		method: 'fetch',
		fetchMethod: 'get',
		headers: {
			'x-failure': 500
		}
	},
	failureTestXHR: {
		url: 'http://localhost:3000/failure',
		method: 'get',
		headers: {
			'x-failure': 501
		}
	}
});
