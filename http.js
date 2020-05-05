/* Server requirements */
const http = require('http');
const path = require('path');
const fs = require('fs');

/* Useful constants */
const PORT = process.env.PORT || 5000;
const ERROR_404 = "./public/static/errors/404.html";
const ERROR_500 = "./public/static/errors/500.html";

/* HTTP */
const proxy = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'public');
    let ext = path.extname(req.url);
    let contentType;

    switch (ext) {
        case '.css':
            contentType = "text/css";
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpeg';
            break;
        case '.js':
            contentType = "text/javascript";
            break;
        case '.json':
            contentType = "application/json";
            break;
        case '.ico':
            contentType = "image/x-icon";
            break;
        default:
            filePath = path.join(filePath, "static");
            contentType = "text/html";
            break;
    }

    filePath = path.join(filePath, req.url === '/' ? 'index.html' : (req.url + (ext == "" ? ".html" : "")));

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code == 'ENOENT') {
                res.writeHead(404);
                fs.readFile(ERROR_404, (err, content) => {
                    res.end(content, 'utf8');
                })
            } else {
                res.writeHead(500);
                fs.readFile(ERROR_500, (err, content) => {
                    res.end(content);
                })
            }
        }else{
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

proxy.listen(PORT, () => console.log(`Server running on ${PORT}`));

module.exports = {proxy, PORT}