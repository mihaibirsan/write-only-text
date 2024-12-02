const fs = require('fs');
const path = require('path');

// Middleware to modify HTML response
function modifyHTML(req, res, next) {
  if (req.url === '/' || req.url.endsWith('.html')) {
    let filePath = path.join(__dirname, '../', req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        next(err);
        return;
      }
      const gitBranch = require('child_process').execSync('git branch --show-current').toString().trim();
      let modifiedHTML = data.replace(
        /<div id="badge".+/,
        `<div id="badge"><span class="key">Development </span><span class="value"><a>${gitBranch}</a></span></div>`
      );
      res.setHeader('Content-Type', 'text/html');
      res.end(modifiedHTML);
    });
  } else {
    next();
  }
}

module.exports = {
    "files": "*.*",
    "middleware": [modifyHTML],
};
