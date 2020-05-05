console.log("--------");

/* Environnement .env */
const dotenv = require("dotenv");
dotenv.config();
/* HTTP Init */
module.exports.http = require('./src/http.js');
/* Database Init */
module.exports.postgres = require('./src/pg.js');
/* Socket Init */
module.exports.socket = require('./src/socket.js');