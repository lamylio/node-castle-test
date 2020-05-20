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

module.exports.manulex = require(this.path.join(__dirname, "src", "manulex_combined.json")).words;
let game_stats = require(this.path.join(__dirname, "src", "game_stats.json"));
module.exports.game_stats = game_stats;
module.exports.saveStats = () => {fs.writeFile(this.path.join(__dirname, "src", "game_stats.json"), JSON.stringify(this.game_stats), () => {})}

/* Routes */
require('./src/express.js');
/* Socket */
require('./src/socket.js');

module.exports.throttle = function(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
        var time = new Date().getTime();

        if ((time - previousCall) >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
}