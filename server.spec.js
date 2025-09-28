const chai = require('chai');
const { assert, expect } = chai;
const Logger = require('log-ng');
const path = require('path');
const interpolate = require('./interpolator.js');
const processPayload = require('./processPayload.js');
const registry= require('./registry_node.js');

Logger({logLevel: 'debug', logFile: 'APIClient.log'});
const logger = new Logger(path.basename(__filename));
const client = require('./APIClient_node.js')(registry);

describe('Interpolator', function(){
	it('should interpolate simple strings', function(){
		const template = 'Hello, {{name}}!';
		const model = { name: 'Alice' };
		const result = interpolate(template, model);
		expect(result).to.equal('Hello, Alice!');
	});

	it('should replace full value with array when template is "{{key}}"', function(){
		const template = '{{items}}';
		const model = { items: [1, 2, 3] };
		const result = interpolate(template, model);
		expect(result).to.deep.equal([1, 2, 3]);
	});

	it('should replace full value with object when template is "{{key}}"', function(){
		const template = '{{settings}}';
		const model = { settings: { dark: true } };
		const result = interpolate(template, model);
		expect(result).to.deep.equal({ dark: true });
	});

	it('should interpolate values inside a nested object', function(){
		const template = {
			user: {
				name: '{{name}}',
				age: '{{age}}'
			}
		};
		const model = { name: 'Bob', age: 30 };
		const result = interpolate(template, model);
		expect(result).to.deep.equal({
			user: {
				name: 'Bob',
				age: 30
			}
		});
	});

	it('should interpolate values inside an array of strings', function(){
		const template = ['{{a}}', '{{b}}'];
		const model = { a: 'x', b: 'y' };
		const result = interpolate(template, model);
		expect(result).to.deep.equal(['x', 'y']);
	});

	it('should preserve raw arrays in object fields', function(){
		const template = {
			list: '{{arr}}'
		};
		const model = {
			arr: [10, 20]
		};
		const result = interpolate(template, model);
		expect(result).to.deep.equal({
			list: [10, 20]
		});
	});

	it('should return empty string for missing keys in string interpolation', function(){
		const template = 'Hello, {{missing}}!';
		const model = {};
		const result = interpolate(template, model);
		expect(result).to.equal('Hello, !');
	});

	it('should remove undefined keys in object interpolation', function(){
		const template = {
			name: '{{name}}',
			age: '{{age}}'
		};
		const model = { name: 'Charlie' };
		const result = interpolate(template, model);
		expect(result).to.deep.equal({ name: 'Charlie' });
	});

	it('should handle non-string template values without change', function(){
		expect(interpolate(42, {})).to.equal(42);
		expect(interpolate(true, {})).to.equal(true);
		expect(interpolate(null, {})).to.equal(null);
	});
});

describe('processPayload', function(){
	it('should handle missing Content-Type', function(){
		const entry = {
			body: { key: 'value' }
		};
		const config = {};
		const result = processPayload(entry, config);
		expect(result).to.equal(JSON.stringify({ key: 'value' }));
	});
	it('should handle undefined body', function(){
		const entry = {
			headers: { 'Content-Type': 'application/json' }
		};
		const config = {};
		const result = processPayload(entry, config);
		expect(result).to.equal(undefined);
	});
	it('should handle string body', function(){
		const entry = {
			body: 'raw string'
		};
		const config = {};
		const result = processPayload(entry, config);
		expect(result).to.equal('raw string');
	});
	it('should handle JSON body', function(){
		const entry = {
			body: { key: 'value' },
			headers: { 'Content-Type': 'application/json' }
		};
		const config = {};
		const result = processPayload(entry, config);
		expect(result).to.equal(JSON.stringify({ key: 'value' }));
	});
	it('should handle URL-encoded body', function(){
		const entry = {
			body: { key: 'value', foo: 'bar baz' },
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		};
		const config = {};
		const result = processPayload(entry, config);
		expect(result).to.equal('key=value&foo=bar%20baz');
	});
	it('should handle text/plain body with array', function(){
		const entry = {
			body: ['line1', 'line2'],
			headers: { 'Content-Type': 'text/plain' }
		};
		const config = {};
		const result = processPayload(entry, config);
		expect(result).to.equal('line1\nline2');
	});
	it('should handle text/plain body with object', function(){
		const entry = {
			body: { key: 'value' },
			headers: { 'Content-Type': 'text/plain' }
		};
		const config = {};
		const result = processPayload(entry, config);
		expect(result).to.equal(JSON.stringify({ key: 'value' }));
	});
});

describe('APIClient (node)', function(){
	it('should build from registry', function(){
		Object.keys(registry).forEach((entry) => {
			assert(client[entry] !== undefined, `Client should contain ${entry}`);
		});
	});
	it('should return Promise', async function(){
		try{
			const response = await client.getEndpoint({ search: 'term' });
			const result = JSON.parse(response);
			logger.debug(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'GET');
			expect(result.query.term).exist;
		}catch(e){
			if(e instanceof chai.AssertionError){
				throw e;
			}
			logger.error(e);
			assert(false, e);
		}
	});
	it('should GET', function(done){
		client.getEndpoint({
			search: 'term',
			success: (res) => {
				const result = JSON.parse(res);
				logger.debug(JSON.stringify(result, null, 2));
				assert.equal(result.method, 'GET');
				expect(result.query.term).exist;
				done();
			},
			failure: () => {
				assert(false, e);
			}
		});
	});
	it('should POST', function(done){
		const username = 'bogus';
		const password = 'password';
		client.postEndpoint({
			username,
			password,
			success: (res) => {
				const result = JSON.parse(res);
				logger.debug(JSON.stringify(result, null, 2));
				assert.equal(result.method, 'POST');
				assert.equal(result.body.username, username);
				assert.equal(result.body.password, password);
				done();
			},
			failure: (e) => {
				assert(false, e);
			}
		});
	});
	it('should PUT', async function(){
		const id = 'bogus';
		try{
			const response = await client.putEndpoint({
				id,
				payload: 'test=thing'
			});
			const result = JSON.parse(response);
			logger.debug(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'PUT');
			assert.equal(result.path, `/path/elem/${id}`);
			assert.deepEqual(result.body, {test: 'thing'});
		}catch(e){
			if (e instanceof chai.AssertionError) {
				throw e;
			}
			logger.error(e);
			assert(false, e);
		}
	});
	it('should DELETE', async function(){
		const token = 'bWlnaHR5IG5vc2V5IGFyZW4ndCB3ZT8K';
		try{
			const response = await client.deleteEndpoint({
				search: 'term',
				token
			});
			const result = JSON.parse(response);
			logger.debug(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'DELETE');
			expect(result.query.term).exist;
			assert.equal(result.headers.not_a_cookie, `JSESSIONID=${token}`);
		}catch(e){
			if (e instanceof chai.AssertionError) {
				throw e;
			}
			logger.error(e);
			assert(false, e);
		}
	});
	it('should use Fetch API', async function(){
		const slot = 100;
		const uuid = 'QWxsZW4gd2FzIGhlcmUK';
		try{
			const result = await client.fetchTest({
				slot,
				uuid,
			});
			logger.debug(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			assert.equal(result.path, '/metrics');
			expect(result.body).deep.equal({slot: `${slot}`, uuid: `${uuid}`});
		}catch(e){
			if(e instanceof chai.AssertionError){
				throw e;
			}
			logger.error(e);
			assert(false, e);
		}
	});
	it('should use custom XHR', function(done){
		const slot = 100;
		const uuid = 'QWxsZW4gd2FzIGhlcmUK';
		client.customXHRTest({
			slot,
			uuid,
			success: (response) => {
				const result = JSON.parse(response);
				logger.debug(JSON.stringify(result, null, 2));
				assert.equal(result.method, registry.customXHRTest.customMethod);
				assert.equal(result.path, '/metrics');
				expect(result.body).deep.equal({slot: `${slot}`, uuid: `${uuid}`});
				done();
			},
			failure: (e) => {
				assert(false, e);
			}
		});
	});
	it('should use custom Fetch', async function(){
		const path = 'category';
		const payload = {
			test: true
		};
		try{
			const response = await client.customFetchTest({
				type: path,
				payload
			});
			const result = await response.json();
			logger.debug(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			assert.equal(result.path, `/${path}/resource`);
			assert.equal(response.status, 200);
			expect(result.body).deep.equal(payload);
		}catch(e){
			if (e instanceof chai.AssertionError) {
				throw e;
			}
			logger.error(e);
			assert(false, e);
		}
	});
	it('should support rate limiting', async function(){
		let shouldThrottle = false;
		try{
			let response = await client.throttleTest({});
			logger.debug(response);
			const result = JSON.parse(response);
			assert.equal(result.method, 'GET');
			shouldThrottle = true;
			response = await client.throttleTest({});
		}catch(e){
			logger.debug(`Caught: ${JSON.stringify(e, null, 2)}`);
			if(e instanceof chai.AssertionError){
				throw e;
			}
			assert(shouldThrottle, 'should not have throttled');
		}
	});
	it('should support timeout', async function(){
		this.timeout(5000);
		let shouldTimeout = false;
		try{
			let response = await client.timeoutTest({});
			const result = JSON.parse(response);
			logger.debug(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			assert.equal(result.path, '/timeout');
			shouldTimeout = true;
			response = await client.timeoutTest({ delay: 3000 });
		}catch(e){
			logger.debug(`Caught: ${JSON.stringify(e, null, 2)}`);
			if(e instanceof chai.AssertionError){
				throw e;
			}
			assert(shouldTimeout, 'should not have timed out');
		}

		await new Promise((resolve) => setTimeout(resolve, 1001)); // wait for server to finish
	});
	it('should handle request failure', function(done){
		client.failureTest({
			success: () => {
				assert(false, 'should not have succeeded');
			},
			failure: (err) => {
				logger.debug(`failure: ${JSON.stringify(err, null, 2)}`);
				assert(err.code === 'ENOTFOUND', 'should have ENOTFOUND error code');
				done();
			}
		});
	});
	it('should handle server failure (Fetch)', async function(){
		try{
			const response = await client.failureTestFetch({});
			logger.error(`response: ${response.status}`);
			assert(false, 'should not have succeeded');
		}catch(err){
			logger.debug(`failure: ${JSON.stringify(err, null, 2)}`);
			assert(err.status === registry.failureTestFetch.headers['x-failure'], 'should have failed with correct status');
			assert(err.statusText === 'Internal Server Error', 'should have correct status text');
			assert(err.response === 'Simulated server error', 'should have correct error message');
		}
	});
	it('should handle server failure (XHR)', function(done){
		client.failureTestXHR({
			success: (res) => {
				logger.error(`response: ${res.status}`);
				assert(false, 'should not have succeeded');
			},
			failure: (err) => {
				logger.debug(`failure: ${JSON.stringify(err, null, 2)}`);
				assert(err.status === registry.failureTestXHR.headers['x-failure'], 'should have failed with correct status');
				assert(err.statusText === 'Not Implemented', 'should have correct status text');
				assert(err.response === 'Simulated server error', 'should have correct error message');
				done();
			}
		});
	});
});
