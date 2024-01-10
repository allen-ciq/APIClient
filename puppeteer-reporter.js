const Base = Mocha.reporters.Base;
const {
	EVENT_RUN_BEGIN,
	EVENT_RUN_END,
	EVENT_TEST_BEGIN,
	EVENT_TEST_FAIL,
	EVENT_TEST_PASS,
	EVENT_SUITE_BEGIN,
	EVENT_SUITE_END
} = Mocha.Runner.constants;

class PuppeteerReporter extends Base{
	constructor(runner){
		super(runner);
		runner
			.on(EVENT_RUN_BEGIN, () => console.log('Testing started'))
			.on(EVENT_SUITE_BEGIN, (suite) => console.log(`Suite: ${suite.title}`))
			.on(EVENT_TEST_BEGIN, (test) => console.log(` Test: ${test.title}`))
			.on(EVENT_TEST_PASS, (test) => console.log(`  ✔ ${test.title}`))
			.on(EVENT_TEST_FAIL, (test, err) => {
				console.log(`  ✖ ${test.title}`);
				console.error(err);
			})
			.on(EVENT_SUITE_END, (suite) => console.log(`Suite End: ${suite.title}`))
			.on(EVENT_RUN_END, () => {
				console.log('Testing ended');
				window.__mochaResults = this.stats;  // save test results on window object
			});
	}
}

// module.exports = PuppeteerReporter;
export default PuppeteerReporter
