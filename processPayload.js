// const FormData = require('form-data');
let Logger;
if(typeof window === 'undefined'){
	Logger = require('log-ng');
}else{
	Logger = require('log-ng').default;
}
const interpolate = require('./interpolator.js');

const logger = new Logger('processPayload.js');

function processPayload(entry, config){
	const interpolated = interpolate(entry, config);
	const contentTypeKey = Object.keys(interpolated.headers ?? {}).find(k => k.toLowerCase() === 'content-type');
	const contentType = interpolated.headers?.[contentTypeKey];
	logger.debug(`contentType: ${contentType}`);
	logger.debug(`body: ${JSON.stringify(interpolated.body)}`);
	let payload;

	if(typeof interpolated.body === 'string'){
		payload = interpolated.body;
	}else if(interpolated.body !== undefined){
		switch(contentType){
			case 'application/json':
				payload = JSON.stringify(interpolated.body);
				break;
			case 'application/x-www-form-urlencoded':
				payload = Object.entries(interpolated.body).map(([k, v]) => {
					return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
				}).join('&');
				break;
			case 'multipart/form-data': {
				logger.warn('multipart/form-data not implemented');
				// const form = new FormData();
				// for(const [key, value] of Object.entries(interpolated.body)){
				// 	form.append(key, value);
				// }
				// // form.getHeaders()['content-type'];
				// payload = form;
				break;
			}
			case 'text/plain':
			default:
				if(Array.isArray(interpolated.body)){
					payload = interpolated.body.join('\n');
				}else if(typeof interpolated.body === 'object'){
					logger.warn(`Unexpected object for content-type "${contentType}", coercing with JSON.stringify`);
					payload = JSON.stringify(interpolated.body);
				}else{
					// assuming primitive
					payload = String(interpolated.body);
				}
		}
	}
	logger.debug(`payload: ${payload}`);
	return payload;
}

module.exports = processPayload;
