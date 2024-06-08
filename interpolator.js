function interpolator(template = "", model = {}){
	if(template instanceof Object){
		const interpolated = Array.isArray(template) ? [] : {};
		for(const o in template){
			const val = interpolator(template[o], model);
			try{
				interpolated[o] = JSON.parse(val);
			}catch(_e){
				if(val !== undefined && val !== ''){
					interpolated[o] = val;
				}
			}
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
		return val;
	});
};

module.exports = interpolator;
