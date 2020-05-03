const http = require('http');
const fs = require('fs');
const path = require('path');

const proxy = http.createServer((req, res) => {
    if(req.url == "/"){
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, "Hello");
    }    
});

proxy.listen(80);