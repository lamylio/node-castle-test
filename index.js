const http = require('http');
const fs = require('fs');
const path = require('path');

const proxy = http.createServer((req, res) => {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
        if(err) res.end('ERROR');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
    });
});

proxy.listen(5050);