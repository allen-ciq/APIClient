const http = require('http');
const https = require('https');

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

	const interpolate = function interpolator(template = "", model){
		if(template instanceof Object){
			const interpolated = template instanceof Array ? [] : {};
			for(const o in template){
				interpolated[o] = interpolator(template[o], model);
			}
			return interpolated;
		}
		if(typeof template !== 'string'){
			return template;
		}
		return template.replace(/\{\{(.+?)\}\}/g, function(_match, br){
			const val = model[br] || "";
			if(val instanceof Object){
				return JSON.stringify(val);
			}
			return encodeURI(val);
		});
	};

	function httpHandler(entry, config){
		const options = {
			...entry,
			...config,
			host: interpolate(entry.host, config),
			path: interpolate(entry.path, config),
			headers: interpolate(entry.headers, config)
		};
		const client = getClient(entry.protocol);
		return client.request(options, (res) => {
			let response = '';
			res.on('data', (chunk) => {response += chunk})
				.on('end', () => {config.success(response)})
				.on('error', config.failure)
				.on('timeout', config.failure);
		});
	}

	const client = {
		get: function(entry, config){
			const req = httpHandler(entry, config);
			req.end();
		},
		post: function(entry, config){
			const req = httpHandler(entry, config);
			req.write(JSON.stringify(interpolate(entry.body, config)));
			req.end();
		},
		put: function(entry, config){
			const req = httpHandler(entry, config);
			req.end();
		},
		delete: function(entry, config){
			const req = httpHandler(entry, config);
			req.end();
		},
		fetch: async function(entry, config){
			try{
				// const response = await fetch(interpolate(`${entry.protocol}//${entry.host}:${entry.port ? entry.port : 80}${entry.path}`, config), {
				const response = await fetch(interpolate(entry.url, config), {
					method: entry.fetchMethod,
					headers: Object.entries(entry.headers).reduce((acc, [k, v]) => {
						acc[k] = v;
						return acc;
					}, {}),
					body: interpolate(entry.body, config)
				});
				config.success(response);
			}catch(e){
				config.failure(e);
			}
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
						// console.log(msg);
						config.failure(msg);
						return;
					}
					// console.log(`Call to ${key} not throttled`);
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
