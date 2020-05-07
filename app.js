console.log("[―――――START―――――]");

/* Environnement .env */
const dotenv = require("dotenv");
dotenv.config();

/* Useful constants */
module.exports.PORT = process.env.PORT || 5000;
const ERROR_404 = "./public/static/errors/404.html";
const ERROR_500 = "./public/static/errors/500.html";

/* Modules init */
const express = require('express');
const hbs = require('express-handlebars');

module.exports.path = require('path');
module.exports.sanitize = require('sanitize-html');

module.exports.app = express();
module.exports.server = require('http').Server(this.app);
module.exports.io = require('socket.io')(this.server);

this.server.listen(this.PORT, () => console.log(`Server listening on ${this.PORT}`));

/* App setup */
this.app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'main' }));
this.app.set('views', "./views");
this.app.set('view engine', 'hbs');

this.app.use('/public', express.static('public'));


/* Routes */
require('./src/express.js');
/* Socket */
require('./src/socket.js');