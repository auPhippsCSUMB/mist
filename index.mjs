import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using the POST method
app.use(express.urlencoded({ extended: true }));
//setting up database connection pool, replace values in red
const pool = mysql.createPool({
    host: "your_hostname",
    user: "your_username",
    password: "your_password",
    database: "your_database",
    connectionLimit: 10,
    waitForConnections: true
});
//routes
app.get('/', (req, res) => {
    res.send('Hello Express app!')
});

app.get('/apiTest', async (req, res) => {
    let client_id = "3zzzpcewhkvs4yvk9v2117i0xqqviq";
    let client_secret = "nks9vjjfiq7g0ql2gyf6wjf4r29sry";
    // grant_type = client_credentials

    let url = "https://id.twitch.tv/oauth2/token";
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`
    });

    const test = await response.json();
    console.log(test);
    res.render('apiTest.ejs', { test });
});

app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});//dbTest
app.listen(3000, () => {
    console.log("Express server running")
})