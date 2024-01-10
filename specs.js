const assert = chai.assert;

describe('APIClient', function(){
	let client, registry;
	before(async function(){
		try{
			registry = (await import('./registry.js')).registry;
			client = (await import('./APIClient.js')).APIClient(registry);
		}catch(e){
			console.error(e);
		}
	});
	after(function(){});
	it('should build from registry', function(){
		Object.keys(registry).forEach((entry) => {
			assert(client[entry] !== undefined, `Client should contain ${entry}`);
		});
	});
	it('should GET', function(){});
	it('should POST', function(){
		client.postEndpoint({
			username: 'bogus',
			password: 'password',
			success: (result) => {
				console.log(result);
			},
			failure: (err) => {
				console.error(err);
				throw new Error(err);
			}
		});
	});
	it('should PUT', function(){});
	it('should DELETE', function(){});
	it('should use Fetch API', function(){});
	it('should use custom ChartIQ', function(){});
	it('should return Promise', async function(){
		try{
			const result = await client.getEndpoint({
				param: "blah",
				token: "357"
			});
			console.log(result);
		}catch(e){
			console.error(e);
			throw new Error(e);
		}
	});
	it('should support timeout', function(){});
	it('should support rate limiting', function(){});
});
