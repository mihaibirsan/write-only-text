const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../index.html');
const githubRefName = process.env.GITHUB_REF_NAME || 'unknown';
const [prNumber] = githubRefName.match(/\d+/) || [];

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading index.html:', err);
    process.exit(1);
  }

  const modifiedHTML = data.replace(
    /<div id="badge".+/,
    prNumber
      ? `<div id="badge"><span class="key">Preview </span><span class="value"><a href="https://github.com/mihaibirsan/write-only-text/pull/${prNumber}">PR #${prNumber}</a></span></div>`
      : `<div id="badge"><span class="key">Preview </span><span class="value"><a href="https://github.com/mihaibirsan/write-only-text/tree/${githubRefName}">${githubRefName}</a></span></div>`
  );

  fs.writeFile(filePath, modifiedHTML, 'utf8', (err) => {
    if (err) {
      console.error('Error writing index.html:', err);
      process.exit(1);
    }
    console.log('index.html has been updated with the GITHUB_REF_NAME.');
  });
});
