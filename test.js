const chai = require('chai');
const Mocha = require('mocha');
const puppeteer = require('puppeteer');
const app = require('./testServer');

const server = app.listen(3000, 'localhost', async () => {
	const browser = await puppeteer.launch({
		args: ['--enable-experimental-web-platform-features'],
		headless: true,
		dumpio: false
	});
	const page = await browser.newPage();
	// page.on('console', msg => console.log(msg.text()));

	try{
		await page.goto('http://localhost:3000/fixture.html');
		// await page.waitForSelector('#mocha-report > li.suite');
		// await page.screenshot({ path: 'testResults.png' });

		// wait for Mocha test results to be available
		await page.waitForFunction(
			() => window.__mochaResults !== undefined,
			{ timeout: 5000 }
		);
		const testResults = await page.evaluate(() => window.__mochaResults);

		// Log the results to the console:
		// console.log(testResults);

		const mocha = new Mocha();

		mocha.suite.emit('pre-require', global, 'solution', mocha);

		describe('Browser Tests', function() {
			it(`should have run ${testResults.tests} tests`, function() {
				chai.assert.equal(testResults.tests, testResults.passes + testResults.failures);
			});
			it(`should have ${testResults.passes} passing tests`, function() {
				chai.assert.equal(testResults.passes, testResults.passes);
			});
			if(testResults.failures > 0) {
				it(`should have ${testResults.failures} failing tests`, function() {
					chai.assert.fail(null, null, `${testResults.failures} tests failed`);
				});
			}
		});

		mocha.run(function(failures) {
			process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
		});
	}catch(e){
		console.error(e);
	}

	await browser.close();
	server.close();
});
