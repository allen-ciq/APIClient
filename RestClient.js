var http = require('https');

/*
 *    Create a client that is bound to a registry of REST endpoints
 */
module.exports = function APIClient(host, registry){
	if(!(this instanceof APIClient)){
		return new APIClient(registry);
	}
	var client = {};

	this.get = (function(container){
		return function(entry, config, cb){
			var options = {
				method: 'get',
				host: host,
				path: container.interpolate(entry.path, config),
				headers: container.interpolate(entry.headers, config)
				// auth: username+':'+password
			};
			var req = http.request(options, function(res){
				var response = '';
				res.on('data', function(chunk){
					response += chunk;
				}).on('end', function(){
					cb(response);
				}).on('error', function(err){
					console.log('HTTP GET error: %s', err);
				});
			});
			req.end();
		};
	})(this);
	this.post = (function(container){
		return function(entry, config, cb){
			var options = {
				method: 'post',
				host: host,
				path: container.interpolate(entry.path, config),
				headers: container.interpolate(entry.headers, config)
			};
			var req = http.request(options, function(res){
				var response = '';
				res.on('data', function(chunk){
					response += chunk;
				}).on('end', function(){
					cb(response);
				}).on('error', function(err){
					console.log('HTTP POST error: %s', err);
				});
			});
			req.write(JSON.stringify(container.interpolate(entry.body, config)));
			req.end();
		};
	})(this);
	this.put = function(entry, config){     // TODO
		console.log('put called for: '+entry.url);
	};
	this._delete = (function(container){
		return function(entry, config, cb){
			var options = {
				method: 'delete'
			};
		};
	})(this);

	this.interpolate = function interpolator(template, model){
		if(template instanceof Object){
			var interpolated = {};
			for(var o in template){
				interpolated[o] = interpolator(template[o], model);
			}
			return interpolated;
		}
		else{
			return template.replace(/\{\{(.+?)\}\}/g, function(match, br){
				return encodeURI(model[br] || '');
			});
		}
	};

	for(var key in registry){
		Object.defineProperty(client, key, {
			enumerable: true,
			value: (function(container, entry){
				return function(config, cb){
					container[entry.method].call(client, entry, config, cb);
				};
			})(this, registry[key])
		});
	}

	return client;
};
