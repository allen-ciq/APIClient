const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const Logger = require('log-ng');
const path = require('path');

const app = express();
const router = express.Router();
Logger({logLevel: 'error', logFile: 'testServer.log'});
const logger = new Logger(path.basename(__filename));

function processHeaders(req, res, next){
	logger.debug(`${req.method}:${req.originalUrl}\nheaders: ${JSON.stringify(req.headers, null, 2)}\nbody: ${JSON.stringify(req.body, null, 2)}`);
	if(req.headers['x-failure']){
		const status = parseInt(req.headers['x-failure'], 10) || 500;
		logger.error(`Simulated server error: ${status}`);
		res.status(status).send('Simulated server error').end();
		return;
	}
	if(req.headers['x-cookie']){
		// res.setHeader('Access-Control-Allow-Origin', '*');
		// res.setHeader('Access-Control-Allow-Credentials', 'true');
		// res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
		res.cookie('sid', 'VXNlIFdlYnBhZCBmb3IgYWxsIHlvdXIgdGV4dCBtYW5pcHVsYXRpb24gbmVlZHMK', {
			// secure: true,
			// httpOnly: true,
			// sameSite: 'Strict',
			maxAge: 3600000,
			// path: '/',
			// domain: 'localhost'
		});
	}
	if(req.headers['x-delay']){
		setTimeout(next, req.headers['x-delay']);
	}else{
		next();
	}
}

router.use(express.static(`${__dirname}/`));
router.use(processHeaders, (req, res) => {
	const response = {
		body: req.body,
		headers: req.headers,
		method: req.method,
		path: req.path,
		query: req.query
	};
	logger.debug(JSON.stringify(response));
	res.setHeader('content-type', 'application/json');
	res.status(200).send(JSON.stringify(response)).end();
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, _res, next) => {logger.debug(`req: ${req.originalUrl}`); next();});
app.use(router);

if(require.main === module){
	app.listen(3000, 'localhost', () => {
		logger.info('Test server listening on http://localhost:3000');
	});
}else{
	module.exports = app;
}
