const { Buffer } = require('node:buffer');
const Logger = require('log-ng');
const path = require('path');
const Governor = require('./Governor.js');
const interpolate = require('./interpolator.js');
const processPayload = require('./processPayload.js');

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

	function getClient(protocol){
		let client;
		switch(protocol){
			case 'http:':
				client = require('http');
				break;
			case 'https:':
			default:
				client = require('https');
		}
		return client;
	}

	function httpHandler(entry, config, payload){
		try{
			const options = {
				...entry,
				...config,
				host: interpolate(entry.host, config),
				path: interpolate(entry.path, config),
				headers: interpolate(entry.headers, config)
			};

			if(payload !== undefined && !options.headers['Content-Length'] && options.headers['Transfer-Encoding'] !== 'chunked'){
				options.headers['Content-Length'] = Buffer.byteLength(payload).toString();
			}

			logger.debug(JSON.stringify(options, null, 2));
			const client = getClient(options.protocol);
			const req = client.request(options, (res) => {
				let response = '';
				res.on('data', (chunk) => {response += chunk})
					.on('end', () => {
						logger.debug(`Response: ${response}`);
						if(res.statusCode >= 400){
							logger.error(`Error: ${res.statusCode} ${res.statusMessage}`);
							const error = new Error(`HTTP Error: ${res.statusCode}`);
							error.status = res.statusCode;
							error.statusText = res.statusMessage;
							error.response = response;
							config.failure(error);
							return;
						}
						config.success(response)
					})
					.on('error', config.failure)
					.on('timeout', config.failure);
			});
			req.on('error', (err) => {
				logger.error(err);
				req.destroy(err);
				config.failure(err);
			});
			req.on('timeout', () => {
				const error = new Error('Request timed out');
				error.status = 408; // Request Timeout
				logger.error(error);
				req.destroy(error);
				config.failure(error);
			});
			return req;
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
			const payload = processPayload(entry, config);
			const req = httpHandler(entry, config, payload);
			if(payload !== undefined){
				req.write(payload);
			}
			req.end();
		},
		put: function(entry, config){
			logger.debug('put call');
			const payload = processPayload(entry, config);
			const req = httpHandler(entry, config, payload);
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
			logger.debug(`URL: ${url}`);
			try{
				const response = await fetch(interpolate(url, config), {
					method: entry.fetchMethod,
					headers: Object.entries(entry.headers || {}).reduce((acc, [k, v]) => {
						acc[k] = interpolate(v, config);
						return acc;
					}, {}),
					body: processPayload(entry, config)
				});
				logger.debug(`Response headers: ${JSON.stringify(response.headers, null, 2)}`);

				const contentType = response.headers.get("content-type") || "";
				const responseContent = contentType.includes("application/json") ? await response.json() : await response.text();

				if(response.ok){
					logger.debug(`Response: ${response.status} ${response.statusText}`);
					config.success(responseContent);
				}else{
					logger.error(`Error: ${response.status} ${response.statusText}`);
					const error = new Error(`HTTP Error: ${response.status}`);
					error.status = response.status;
					error.statusText = response.statusText;
					error.response = responseContent;
					config.failure(error);
				}
			}catch(e){
				logger.error(e);
				logger.error(url);
				config.failure(e);
			}
		},
		xhr: function(entry, config){
			logger.debug('custom XHR call');
			const options = {
				...entry,
				...config,
				method: entry.customMethod,
				host: interpolate(entry.host, config),
				path: interpolate(entry.path, config),
				headers: interpolate(entry.headers, config)
			};
			const payload = processPayload(entry, config);
			if(payload !== undefined){
				options.headers['Content-Length'] = Buffer.byteLength(payload).toString();
			}
			const client = getClient(entry.protocol);
			const req = client.request(options, (res) => {
				let response = '';
				res.on('data', (chunk) => {response += chunk})
					.on('end', () => {config.success(response)})
					.on('error', config.failure)
					.on('timeout', config.failure);
			});
			req.on('error', (err) => {
				logger.error(err);
				req.destroy(err);
				config.failure(err);
			});
			req.on('timeout', () => {
				const error = new Error('Request timed out');
				error.status = 408; // Request Timeout
				logger.error(error);
				req.destroy(error);
				config.failure(error);
			});
			if(payload !== undefined){
				req.write(payload);
			}
			req.end();
		},
		customFetch: async function(entry, config){
			logger.debug('custom fetch call');
			const url = `${entry.protocol}//${entry.host}:${entry.port || '80'}${entry.path}`;
			logger.debug(`URL: ${url}`);
			try{
				const response = await fetch(interpolate(url, config), {
					method: entry.fetchMethod,
					headers: Object.entries(entry.headers || {}).reduce((acc, [k, v]) => {
						acc[k] = interpolate(v, config);
						return acc;
					}, {}),
					body: processPayload(entry, config)
				});
				config.success(response);
			}catch(e){
				logger.error(e);
				config.failure(e);
			}
		}
	};

	Object.entries(registry).forEach(([key, entry]) => {
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
					logger.debug(`Using entry:\n${JSON.stringify(entry, null, 2)}\nand config:\n${JSON.stringify(config, null, 2)}`);
					client[entry.method].call(this, entry, config);
				});
			}
		});
	});
};

module.exports = APIClientFactory;
