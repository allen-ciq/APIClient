const interpolate = require('./interpolator');
let Logger;
if(typeof window === 'undefined'){
	Logger = require('log-ng');
}else{
	Logger = require('log-ng').default;
}

const logger = new Logger('processPayload.js');

function processPayload(entry, config){
	const interpolated = interpolate(entry, config);
	const contentType = interpolated.headers?.['Content-Type'] || interpolated.headers?.['content-type'];
	logger.debug(`contentType: ${contentType}`);
	logger.debug(`body: ${interpolated.body}`);
	let payload;

	switch(contentType){
		case 'application/json':
			payload = JSON.stringify(interpolated.body);
			break;
		case 'application/x-www-form-urlencoded':
			if(typeof interpolated.body === 'string'){
				payload = interpolated.body;
			}else{
				payload = Object.entries(interpolated.body).map(([k, v]) => {
						return `${k}=${v}`;
						}).join('&');
			}
			break;
		case 'multipart/form-data':
			logger.warn('multipart/form-data not implemented');
			// payload = new FormData();
			break;
		default:
			payload = interpolated.body;
	}
	logger.debug(`payload: ${JSON.stringify(payload, null, 2)}`);
	return payload;
}

module.exports = processPayload;
