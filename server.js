const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = 3000;
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVaDIfMZP7kILdXbVsmf7pOxD3Z-6gtQCX7-LJQP7aZF6QjEhIWsrnMOlNTiEBxPRgR2ZA7LBIuHHf/pub?gid=0&single=true&output=csv';

function fetchCSV(url, redirects) {
  redirects = redirects || 0;
  return new Promise(function(resolve, reject) {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function(res) {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        return resolve(fetchCSV(res.headers.location, redirects + 1));
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      var data = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) { data += chunk; });
      res.on('end',  function() { resolve(data); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

var server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.url === '/' || req.url === '/index.html') {
    var file = path.join(__dirname, 'index.html');
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end('index.html not found next to server.js');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(res);
    return;
  }

  if (req.url === '/cards') {
    fetchCSV(CSV_URL).then(function(csv) {
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8' });
      res.end(csv);
    }).catch(function(err) {
      console.error('Sheet fetch error:', err.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Could not fetch sheet: ' + err.message);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, function() {
  console.log('');
  console.log('  Sejong Flashcard server running');
  console.log('  Open http://localhost:' + PORT + ' in your browser');
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
