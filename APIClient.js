const {default: Logger} = require('log-ng');
const Governor = require('./Governor.js');
const interpolate = require('./interpolator.js');
const processPayload = require('./processPayload.js');

const logger = new Logger('APIClient.js');

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

	function httpHandler(entry, config){
		try{
			const req = new XMLHttpRequest();
			const timeout = config.timeout || entry.timeout || 0;
			req.open(entry.method, interpolate(entry.url, config));
			Object.entries(entry.headers || {}).forEach(([header, value]) => {
				req.setRequestHeader(header, interpolate(value, config));
			});
			req.onload = function(){
				logger.debug(`Response received: ${req.status} ${req.statusText}`);
				if(req.status >= 400){
					logger.error(`Error: ${req.status} ${req.statusText}`);
					const error = new Error(`HTTP Error: ${req.status}`);
					error.status = req.status;
					error.statusText = req.statusText;
					error.response = req.response;
					config.failure(error);
					return;
				}

				config.success(req.response);
			};
			req.onerror = function(e){
				logger.error(`Error: ${JSON.stringify(e)}`);
				config.failure({
					status: req.status,
					statusText: req.statusText,
					response: req.response,
					error: e
				});
			};
			if(timeout > 0){
				req.timeout = timeout;
				req.ontimeout = function(e){
					logger.debug('timeout: ', timeout);
					config.failure(e);
				};
			}
			if(entry.body !== undefined){
				req.body = interpolate(entry.body, config);
			}
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
			req.send();
		},
		post: function(entry, config){
			logger.debug('post call');
			logger.debug(`entry: ${JSON.stringify(entry, null, 2)}`);
			const req = httpHandler(entry, config);
			const payload = processPayload(entry, config);
			req.send(payload);
		},
		put: function(entry, config){
			logger.debug('put call');
			const req = httpHandler(entry, config);
			const payload = processPayload(entry, config);
			req.send(payload);
		},
		delete: function(entry, config){
			logger.debug('delete call');
			const req = httpHandler(entry, config);
			req.send();
		},
		fetch: async function(entry, config){
			logger.debug('fetch call');
			try{
				const response = await fetch(interpolate(entry.url, config), {
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
					config.success(responseContent);
				}else{
					logger.error(`Error: ${response.status} ${response.statusText}`);
					const error = new Error("Request failed with status ${response.status}");
					error.status = response.status;
					error.statusText = response.statusText;
					error.response = responseContent;
					config.failure(error);
				}
			}catch(e){
				logger.error(e);
				config.failure(e);
			}
		},
		xhr: function(entry, config){
			logger.debug('custom XHR call');
			const timeout = config.timeout || entry.timeout || 0;
			const req = new XMLHttpRequest();
			req.open(entry.customMethod, interpolate(entry.url, config), timeout > 0);
			Object.entries(entry.headers || {}).forEach(([header, value]) => {
				req.setRequestHeader(header, interpolate(value, config));
			});
			req.onload = function(){
				config.success(req.response);
			};
			req.onerror = function(e){
				config.failure(e);
			};
			if(timeout > 0){
				req.timeout = timeout;
				req.ontimeout = function(e){
					logger.debug('timeout: ', timeout);
					config.failure(e);
				};
			}
			const payload = processPayload(entry, config);
			req.send(payload);
		},
		customFetch: function(entry, config){
			logger.debug('custom fetch call');
			try{
				const response = fetch(interpolate(entry.url, config), {
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
}

export const APIClient = APIClientFactory;
