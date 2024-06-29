require('chromedriver');
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

// Parse jsunit html report, exit(1) if there are any failures.
const testHtml = function(htmlString) {
  const regex = /[\d]+\spassed,\s([\d]+)\sfailed./i;
  const numOfFailure = regex.exec(htmlString)[1];
  const regex2 = /Unit Tests for .*]/;
  const testStatus = regex2.exec(htmlString)[0];
  console.log("============Unit Test Summary=================");
  console.log(testStatus);
  const regex3 = /\d+ passed,\s\d+ failed/;
  const detail = regex3.exec(htmlString)[0];
  console.log(detail);
  console.log("============Unit Test Summary=================");
  if (parseInt(numOfFailure) !== 0) {
    console.log(htmlString);
    throw `${numOfFailure} test(s) failed`;
  }
};

const url = 'localhost:' + (process.env.PORT || 8071);

const runTests = async function() {
  try {
    await browser.get("http://" + url + "/tests/jsunit/vertical_tests.html");
    await browser.sleep(1000);
    const element = await browser.findElement({id: "closureTestRunnerLog"});
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
