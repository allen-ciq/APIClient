// TODO: figure out why this is not working in required files
// const Logger = require('log-ng');
// const path = require('path');

const debug = false;
const logger = { debug: debug ? console.log.bind(console) : ()=>{} };

function interpolator(template = "", model = {}){
	logger.debug(`Interpolating template: ${template} with model: ${JSON.stringify(model)}`);
	if(template instanceof Object){
		const interpolated = Array.isArray(template) ? [] : {};
		for(const o in template){
			const val = interpolator(template[o], model);
			logger.debug(`Interpolating ${o} with value:`, val);
			try{
				if(Array.isArray(val)){
					interpolated[o] = val.map((v) => {
						try{
							return JSON.parse(v);
						}catch(_e){
							return v;
						}
					});
					continue;
				}
				interpolated[o] = JSON.parse(val);
			}catch(_e){
				if(val !== undefined && val !== ''){
					interpolated[o] = val;
				}
			}
		}
		return interpolated;
	}

	if(typeof template === 'string'){
		const matches = template.matchAll(/\{\{(.+?)\}\}/g);
		for(const match of matches){
			logger.debug(`Processing match: ${match}`);
			const modelValue = model[match[1]];
			logger.debug(`Found match: ${match[1]} with value: ${JSON.stringify(modelValue)}`);
			if(Array.isArray(modelValue) || modelValue instanceof Object){
				logger.debug(`Replacing match: ${match[1]} with value: ${JSON.stringify(modelValue)}`);
				return interpolator(modelValue, model);
			}
			return template.replace(/\{\{(.+?)\}\}/g, function(_match, br){
				logger.debug(`Interpolating match: ${br} with value: ${JSON.stringify(model[br])}`);
				const val = model[br] || "";
				if(val instanceof Object){
					return JSON.stringify(val);
				}
				return val;
			});
		}
	}
	logger.debug(`Returning template without changes: ${template}`);
	return template;
};

module.exports = interpolator;
