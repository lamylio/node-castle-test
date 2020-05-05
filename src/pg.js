const {Pool} = require('pg');

module.exports.db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


this.db.connect().then(console.log("Database connected.")).catch(e => console.error("DB CONNECT : %s",e.stack));

this.db.query(
`
    CREATE TABLE IF NOT EXISTS messages 
    (
        id SERIAL PRIMARY KEY,
        channel VARCHAR(15),
        date TIMESTAMPTZ DEFAULT LOCALTIMESTAMP,
        username VARCHAR(30) NOT NULL,
        content TEXT NOT NULL,
        event VARCHAR(15) NOT NULL
    )
`).then().catch(e => console.error("CREATE TABLE QUERY : %s", e.stack));

this.db.insertMessage = (username, channel, content, event) => {
    this.db.query(
        "INSERT INTO messages (username, channel, date, content, event) VALUES ($1, $2, $3, $4, $5)", 
        [username, channel, new Date().toLocaleString(), content, event]
    ).then().catch(e => console.error("INSERT MESSAGE QUERY : %s",e.stack));
} 

this.db.getLastMessages = (channel, limit, callback) => {
    this.db.query("SELECT * FROM messages WHERE channel = $1 ORDER BY id DESC LIMIT $2", [channel, limit], callback);
}