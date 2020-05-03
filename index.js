const http = require('http');
const path = require('path');
const fs = require('fs');

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
            contentType = "text/html";
            break;
    }

    filePath = path.join(filePath, req.url === '/' ? 'index.html' : (req.url + (ext == "" ? ".html" : "")));

    console.log(filePath);

    fs.readFile(filePath, (err, content) => {
        if(err){
            if(err.code == 'ENOENT'){
                res.end('NOT FOUND');
            }else{
                res.end('SERVER ERROR');
            }
        }

        res.writeHead(200, {'Content-Type': contentType });
        res.end(content, 'utf8');
    });
});

const PORT = process.env.PORT || 5000;
proxy.listen(PORT, () => console.log(`Server running on ${PORT}`));