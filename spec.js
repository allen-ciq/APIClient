const chai = require('chai');
const {assert, expect} = chai;

describe('APIClient', function(){
	let client, registry;
	before(async function(){
		try{
			registry = (await import('./registry')).registry;
			client = (await import('./APIClient')).APIClient(registry);
		}catch(e){
			console.error(e);
		}
	});
	after(function(){
	});
	it('should build from registry', function(){
		Object.keys(registry).forEach((entry) => {
			assert(client[entry] !== undefined, `Client should contain ${entry}`);
		});
	});
	it('should return Promise', async function(){
		try{
			const response = await client.getEndpoint({search: 'term'});
			const result = JSON.parse(response);
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'GET');
			expect(result.query.term).exist;
		}catch(e){
			if(e instanceof chai.AssertionError){
				throw e;
			}
			console.error(e);
		}
	});
	it('should GET', function(done){
		client.getEndpoint({
			search: 'term',
			success: (res) => {
				const result = JSON.parse(res);
				// console.log(JSON.stringify(result, null, 2));
				assert.equal(result.method, 'GET');
				expect(result.query.term).exist;
				done();
			},
			failure: (err) => {
				assert(false, err);
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
				// console.log(JSON.stringify(result, null, 2));
				assert.equal(result.method, 'POST');
				assert.equal(result.body.username, username);
				assert.equal(result.body.password, password);
				done();
			},
			failure: (err) => {
				assert(false, err);
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
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'PUT');
			assert.equal(result.path, `/path/elem/${id}`);
		}catch(e){
			if(e instanceof chai.AssertionError){
				throw e;
			}
			console.error(e);
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
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'DELETE');
			expect(result.query.term).exist;
			assert.equal(result.headers.not_a_cookie, `SESSIONID=${token}`);
		}catch(e){
			if(e instanceof chai.AssertionError){
				throw e;
			}
			console.error(e);
		}
	});
	it('should use Fetch API', async function(){
		const path = 'category';
		const payload = {
			test: true
		};
		try{
			const response = await client.fetchTest({
				type: path,
				payload
			});
			const result = await response.json();
			// console.log('result: ', JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			assert.equal(result.path, `/${path}/resource`);
			expect(result.body).deep.equal(payload);
		}catch(e){
			if(e instanceof chai.AssertionError){
				throw e;
			}
			console.error(e);
		}
	});
	it('should use custom', function(done){
		const slot = 100;
		const uuid = 'QWxsZW4gd2FzIGhlcmUK';
		client.customTest({
			slot,
			uuid,
			success: (response) => {
				const result = JSON.parse(response);
				// console.log(JSON.stringify(result, null, 2));
				assert.equal(result.method, 'POST');
				assert.equal(result.path, '/metrics');
				expect(result.body).deep.equal({slot: `${slot}`, uuid: `${uuid}`});
				done();
			},
			failure: (err) => {
				assert(false, err);
			}
		});
	});
	it('should support rate limiting', async function(){
		let shouldThrottle = false;
		try{
			let response = await client.throttleTest({});
			const result = await response.json();
			// console.log('result: ', JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			shouldThrottle = true;
			response = await client.throttleTest({});
		}catch(e){
			// console.error('Caught: ', JSON.stringify(e, null, 2));
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
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			assert.equal(result.path, '/timeout');
			shouldTimeout = true;
			response = await client.timeoutTest({delay: 3000});
		}catch(e){
			// console.error('Caught: ', JSON.stringify(e, null, 2));
			if(e instanceof chai.AssertionError){
				throw e;
			}
			assert(shouldTimeout, 'should not have timed out');
		}
	});
});
