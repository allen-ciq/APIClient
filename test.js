const karma = require('karma');
const Mocha = require('mocha');
const app = require('./testServer');

const mocha = new Mocha();

const server = app.listen(3000, 'localhost', async () => {
	console.log('Test server started');
	try{
		mocha.addFile('./spec_node.js');
		mocha.run((err) => {
			console.error(err);
		});
		const config = karma.config.parseConfig(__dirname + '/karma.conf.js', {});
		const server = new karma.Server(config);
		server.start();
		await new Promise(resolve => server.on('run_complete', resolve));
		console.log('Karma tests completed successfully');
	}catch(error){
		console.error('Error running Karma tests:', error);
	}finally{
		server.close(() => {
			console.log('Test server closed');
		});
	}
});
