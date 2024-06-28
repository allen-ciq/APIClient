const http = require('http');
const https = require('https');
const Logger = require('log-ng');
const path = require('path');
const Governor = require('./Governor');
const interpolate = require('./interpolator');
const processPayload = require('./processPayload');

const logger = new Logger(path.basename(__filename));

/*
 * A client object that is bound to a set of endpoints
 *
 * TODO:
 * - cache busting
 */
function APIClientFactory(registry){
	if(!new.target){
		return new APIClientFactory(...arguments);
	}
	if(APIClientFactory.instance !== undefined){
		return APIClientFactory.instance;
	}

	function getClient(protocol){
		let client;
		switch(protocol){
			case 'http:':
				client = http;
				break;
			case 'https:':
			default:
				client = https;
		}
		return client;
	}

	function httpHandler(entry, config){
		try{
			const options = {
				...entry,
				...config,
				host: interpolate(entry.host, config),
				path: interpolate(entry.path, config),
				headers: interpolate(entry.headers, config)
			};
			logger.debug(JSON.stringify(options, null, 2));
			const client = getClient(options.protocol);
			return client.request(options, (res) => {
				let response = '';
				res.on('data', (chunk) => {response += chunk})
					.on('end', () => {config.success(response)})
					.on('error', config.failure)
					.on('timeout', config.failure);
			});
		}catch(e){
			logger.error(e);
			config.failure(e);
		}
	}

	const client = {
		get: function(entry, config){
			logger.debug('get call');
			const req = httpHandler(entry, config);
			req.end();
		},
		post: function(entry, config){
			logger.debug('post call');
			const req = httpHandler(entry, config);
			const payload = processPayload(entry, config);
			if(payload !== undefined){
				req.write(payload);
			}
			req.end();
		},
		put: function(entry, config){
			logger.debug('put call');
			const req = httpHandler(entry, config);
			const payload = processPayload(entry, config);
			if(payload !== undefined){
				req.write(payload);
			}
			req.end();
		},
		delete: function(entry, config){
			logger.debug('delete call');
			const req = httpHandler(entry, config);
			req.end();
		},
		fetch: async function(entry, config){
			logger.debug('fetch call');
			const url = `${entry.protocol}//${entry.host}:${entry.port || '80'}${entry.path}`;
			logger.debug(url);
			try{
				const response = await fetch(interpolate(url, config), {
					method: entry.fetchMethod,
					headers: Object.entries(entry.headers || {}).reduce((acc, [k, v]) => {
						acc[k] = v;
						return acc;
					}, {}),
					body: processPayload(entry, config)
				});
				config.success(response);
			}catch(e){
				logger.error(e);
				logger.error(url);
				config.failure(e);
			}
		},
		custom: function(entry, config){
			logger.debug('custom call');
			const options = {
				...entry,
				...config,
				method: entry.customMethod,
				host: interpolate(entry.host, config),
				path: interpolate(entry.path, config),
				headers: interpolate(entry.headers, config)
			};
			const client = getClient(entry.protocol);
			const req = client.request(options, (res) => {
				let response = '';
				res.on('data', (chunk) => {response += chunk})
					.on('end', () => {config.success(response)})
					.on('error', config.failure)
					.on('timeout', config.failure);
			});
			const payload = processPayload(entry, config);
			if(payload !== undefined){
				req.write(payload);
			}
			req.end();
		}
	};

	Object.keys(registry).forEach((key) => {
		const entry = registry[key];
		if(entry.rate){
			Governor(key, entry.rate, entry.period);
		}
		Object.defineProperty(this, key, {
			enumerable: true,
			value: function(config){
				return new Promise((res, rej) => {
					if(config.success === undefined){
						config.success = (resp) => {
							res(resp);
						};
						config.failure = (err) => {
							rej(err);
						};
					}else{
						res("Using provided callback");
					}
					if(Governor[key] === false){
						const msg = `Call to ${key} throttled`;
						logger.debug(msg);
						config.failure(msg);
						return;
					}
					logger.debug(`Call to ${key} not throttled`);
					client[entry.method].call(this, entry, config);
				});
			}
		});
	});

	Object.defineProperty(APIClientFactory, "instance", {
		value: this
	});
};

module.exports = APIClientFactory;
