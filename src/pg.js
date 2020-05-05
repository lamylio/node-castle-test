const {Pool} = require('pg');

module.exports.db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    sslmode: "require"
});


this.db.connect().then(console.log("Database connected.")).catch(e => console.error(e.stack));

this.db.query(
`
    CREATE TABLE IF NOT EXISTS messages 
    (
        id integer PRIMARY KEY AUTOINCREMENT,
        channel string,
        date int(4) DEFAULT (datetime('now', 'localtime')),
        username string DEFAULT "Inconnu",
        content string,
        event string NOT NULL
    )
`).then().catch(e => console.error(e.stack));

this.db.insertMessage = (username, channel, content, event) => {
    return this.db.query(
        "INSERT INTO messages ('username', 'channel', 'date', 'content', 'event') VALUES ($1, $2, $3, $4, $5)", 
        [username, channel, new Date().toLocaleString(), content, event]
    ).then(res => console.log(res.rows[0])).catch(e => console.error(e.stack));
} 

this.db.getLastMessages = (channel, limit, callback) => {
    this.db.query("SELECT * FROM messages WHERE channel = $1 LIMIT $2", [channel, limit], callback);
}