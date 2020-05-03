const http = require('http');
const fs = require('fs');
const path = require('path');

const proxy = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
    let ext = path.extname(filePath);

    let contentType = 'text/html';

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