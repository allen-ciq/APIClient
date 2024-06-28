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

module.exports = Governor;
