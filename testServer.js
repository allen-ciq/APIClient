const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();

router.use(express.static(`${__dirname}/`));
router.use((req, res) => {
	// console.log(`${req.method}:${req.originalUrl}\nheaders: ${JSON.stringify(req.headers, null, 2)}\nbody: ${JSON.stringify(req.body, null, 2)}`);
	res.send(`Test server: ${Math.random()}`).end();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use((req, _res, next) => {console.log(`req: ${req.originalUrl}`); next();});
app.use(router);

// app.listen(3000, 'localhost');
module.exports = app;
