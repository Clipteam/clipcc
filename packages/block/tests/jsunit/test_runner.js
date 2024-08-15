const path = require('path');
const webdriverio = require('webdriverio');

const options = {
  capabilities: {
    browserName: 'chrome',
  },
  logLevel: 'warn',
};

// Run in headless mode on Github Actions.
if (process.env.CI) {
  options.capabilities['goog:chromeOptions'] = {
    args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
  };
} else {
  // --disable-gpu is needed to prevent Chrome from hanging on Linux with
  // NVIDIA drivers older than v295.20. See
  // https://github.com/google/blockly/issues/5345 for details.
  options.capabilities['goog:chromeOptions'] = {
    args: ['--disable-gpu']
  };
}

const url = 'http://localhost:' + (process.env.PORT || 8071);

// Parse jsunit html report, exit(1) if there are any failures.
const testHtml = function(htmlString) {
  const regex = /[\d]+\spassed,\s([\d]+)\sfailed./i;
  const numOfFailure = regex.exec(htmlString)[1];
  const regex2 = /Unit Tests for .*]/;
  const testStatus = regex2.exec(htmlString)[0];
  console.log('============Unit Test Summary=================');
  console.log(testStatus);
  const regex3 = /\d+ passed,\s\d+ failed/;
  const detail = regex3.exec(htmlString)[0];
  console.log(detail);
  console.log('============Unit Test Summary=================');
  if (parseInt(numOfFailure) !== 0) {
    // replace to file path for debugging
    const outputString = htmlString.replaceAll(url, path.join(__dirname, '../..').replace(/\\/g, '/'))
        .replace(/(core\/.*?):/g, '$1.js:');
    console.log(outputString);
    throw `${numOfFailure} test(s) failed`;
  }
};

const runTest = async function(browser, file) {
  await browser.url(url + file);
  await browser.waitUntil(async function() {
    const element = await browser.$('#closureTestRunnerLog');
    if (!element.isExisting()) {
      return false;
    }
    const text = await element.getText();
    const regex = /[\d]+\spassed,\s([\d]+)\sfailed./i;
    return regex.test(text);
  }, {
    timeout: 100000,
  });
  const text = await (await browser.$('#closureTestRunnerLog')).getText();
  testHtml(text);
};

const runTests = async function() {
  console.log('Starting webdriverio...');
  const browser = await webdriverio.remote(options);
  try {
    await runTest(browser, '/tests/jsunit/vertical_tests.html');
    await runTest(browser, '/tests/workspace_svg/index.html');
    await runTest(browser, '/tests/blocks/index.html');
  } finally {
    await browser.deleteSession();
  }
};

module.exports = {runTests};

if (require.main === module) {
  runTests().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
