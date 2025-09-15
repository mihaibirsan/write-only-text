const fs = require('fs');
const path = require('path');

const START_PATH = '/write-only-text/';

// Middleware to modify HTML response
function modifyHTML(req, res, next) {
  // redirect to start path
  if (req.url === '/') {
    res.writeHead(302, {
      Location: START_PATH,
    });
    res.end();
    return;
  }

  // rewrite HTML under start path
  if (!req.url.startsWith(START_PATH)) {
    next();
    return;
  }
  const observedPath = req.url.replace(START_PATH, '/');
  if (observedPath === '/' || observedPath.endsWith('.html')) {
    let filePath = path.join(
      __dirname,
      '../',
      observedPath === '/' ? 'index.html' : observedPath,
    );
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        next(err);
        return;
      }
      const gitBranch = require('child_process')
        .execSync('git branch --show-current')
        .toString()
        .trim();
      let modifiedHTML = data.replace(
        /<div id="badge".+/,
        `<div id="badge"><span class="key">Development </span><span class="value"><a>${gitBranch}</a></span></div>`,
      );
      res.setHeader('Content-Type', 'text/html');
      res.end(modifiedHTML);
    });
  } else {
    next();
  }
}

module.exports = {
  middleware: [modifyHTML],
  startPath: START_PATH,
  server: {
    baseDir: '-',
    routes: {
      [START_PATH]: '.',
    },
  },
};
