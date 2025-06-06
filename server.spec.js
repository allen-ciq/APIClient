const chai = require('chai');
const { assert, expect } = chai;
const Logger = require('log-ng');
const path = require('path');
const registry= require('./registry_node.js');

Logger({logLevel: 'error', logFile: 'APIClient.log'});
const logger = new Logger(path.basename(__filename));
const client = require('./APIClient_node.js')(registry);

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
