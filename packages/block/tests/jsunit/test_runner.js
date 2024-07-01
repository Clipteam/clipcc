require('chromedriver');
const path = require('path');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const builder = new webdriver.Builder().forBrowser('chrome');

if (process.env.CI) {
  const options = new chrome.Options().headless();
  if (process.platform === 'linux') {
    options.addArguments('no-sandbox');
  }
  builder.setChromeOptions(options);
}

const browser = builder.build();

const url = 'http://localhost:' + (process.env.PORT || 8071);

// Parse jsunit html report, exit(1) if there are any failures.
const testHtml = function(htmlString) {
  const regex = /[\d]+\spassed,\s([\d]+)\sfailed./i;
  const numOfFailure = regex.exec(htmlString)[1];
  console.log("============Unit Test Summary=================");
  const regex3 = /\d+ passed,\s\d+ failed/;
  const detail = regex3.exec(htmlString)[0];
  console.log(detail);
  console.log("============Unit Test Summary=================");
  if (parseInt(numOfFailure) !== 0) {
    // replace to file path for debugging
    const outputString = htmlString.replaceAll(url, path.join(__dirname, '../..').replace(/\\/g, '/'))
        .replace(/(core\/.*?):/g, '$1.js:');
    console.log(outputString);
    throw `${numOfFailure} test(s) failed`;
  }
};

const runTests = async function() {
  try {
    await browser.get(url + "/tests/jsunit/vertical_tests.html");
    await browser.sleep(1000);
    const element = await browser.findElement({id: "test-report"});
    const text = await element.getText();
    testHtml(text);
  } finally {
    await browser.quit();
  }
};

module.exports = {runTests};

if (require.main === module) {
  runTests().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
