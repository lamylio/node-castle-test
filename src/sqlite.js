const sqlite = require('sqlite3');

module.exports.db = new sqlite.Database(process.env.SQL_DATABASE, (err) => {
    if(err) console.log(err.stack);
    else console.log('Database connected');
});

/* Sync operations */
this.db.serialize();

if(process.env.DROP_TABLE)
    this.db.run('DROP TABLE IF EXISTS messages');

this.db.run(
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
`, (err) => { if (err) console.log(err)});

this.db.insertMessage = (username, channel, content, event) => {
    let stmt = this.db.prepare("INSERT INTO messages ('username', 'channel', 'date', 'content', 'event') VALUES (?, ?, ?, ?, ?)");
    stmt.run(username, channel, new Date().toLocaleString(), content, event);
    stmt.finalize();
} 

this.db.getLastMessages = (channel, limit, callback) => {
    this.db.all("SELECT * FROM messages WHERE channel = ? LIMIT ?", [channel, limit], callback);
}