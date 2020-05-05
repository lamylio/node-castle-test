console.log("--------");

/* Environnement .env */
const dotenv = require("dotenv");
dotenv.config();
/* HTTP Init */
module.exports.http = require('./http.js');
/* Database Init */
module.exports.sqlite = require('./sqlite.js');
/* Socket Init */
module.exports.socket = require('./socket.js');