const {default: Logger} = require('log-ng');
const interpolate = require('./interpolator');
const processPayload = require('./processPayload');

const logger = new Logger('APIClient.js');

/*
 *	Governor rate limits calls to a given key
 *
 *	Can be configured to throttle calls to a maximum per second, minute, hour, or day.
 *	Return value is boolean indicating if the call is allowed
 *
 *	TODO:
 *	- allow throttling to total requests per period
 */
function Governor(key, rate, period = "second"){
	const throttleInterval = (() => {
		let interval;
		switch(period){
			case "minute":
				interval = 60000;
				break;
			case "hour":
				interval = 3600000;
				break;
			case "day":
				interval = 86400000;
				break;
			case "second":
			default:
				interval = 1000;
		}
		return Math.round(interval / rate);
	})();

	Object.defineProperty(Governor, key, {
		get: function cache(){
			const now = Date.now();
			const elapsed = now - (cache.last || 0);
			logger.debug(`now: ${now} last: ${cache.last} elapsed: ${elapsed}`)
			logger.debug(`Elapsed: ${elapsed} Throttle: ${throttleInterval}`);

			const open = elapsed >= throttleInterval;
			if(open){
				cache.last = now;
			}
			return open;
		}
	});
}

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


	function httpHandler(entry, config){
		try{
			const req = new XMLHttpRequest();
			const timeout = config.timeout || entry.timeout || 0;
			req.open(entry.method, interpolate(entry.url, config));
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
						acc[k] = v;
						return acc;
					}, {}),
					body: processPayload(entry, config)
				});
				config.success(response);
			}catch(e){
				logger.error(e);
				config.failure(e);
			}
		},
		custom: function(entry, config){
			logger.debug('custom call');
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
}

export const APIClient = APIClientFactory;
