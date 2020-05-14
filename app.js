/* Environnement .env */
const dotenv = require("dotenv");
dotenv.config();

/* Useful constants */
module.exports.PORT = process.env.PORT || 5000;
const ERROR_404 = "./public/static/errors/404.html";
const ERROR_500 = "./public/static/errors/500.html";

/* Modules init */
module.exports.express = require('express');
const hbs = require('express-handlebars');

const fs = require('fs');
module.exports.path = require('path');
module.exports.sanitize = require('sanitize-html');

module.exports.app = this.express();
module.exports.server = require('http').Server(this.app);
module.exports.io = require('socket.io')(this.server);

this.server.listen(this.PORT, () => console.log(`[―――――START:${this.PORT}―――――]`));

/* App setup */
this.app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'main' }));
this.app.set('views', "./views");
this.app.set('view engine', 'hbs');

this.app.use('/public', this.express.static('public'));

let manulex = fs.readFileSync(this.path.join(__dirname, "src", "manulex_combined.json")).toString().split(',');

module.exports.manulex = manulex;

/* Routes */
require('./src/express.js');
/* Socket */
require('./src/socket.js');