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
    host: "x71wqc4m22j8e3ql.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "raf75r08n7zd5356",
    password: "zjcnac7j466tft93", //put into env file
    database: "aim59v409g7thmo2",
    connectionLimit: 10,
    waitForConnections: true
});

let token;

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
    token = test.access_token;
    console.log(test);
    console.log('test' + test.toString());
    res.render('apiTest.ejs', { test });
});


app.get('/gameTest', async (req, res) => {
    let client_id = "3zzzpcewhkvs4yvk9v2117i0xqqviq";
    let client_secret = "nks9vjjfiq7g0ql2gyf6wjf4r29sry";
    // grant_type = client_credentials

    let url = "https://api.igdb.com/v4/games";
    const response = await fetch(url, {
        method: "POST",
        headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        body: "fields *;"
    });

    const game = await response.json();
    console.log(game);
    res.send(game);
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