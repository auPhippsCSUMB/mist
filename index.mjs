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
app.listen(3002, () => {
    console.log("Express server running")
})import express from 'express';
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
    res.render('home.ejs');
});

app.get('/search', (req, res) => {
    res.render('search.ejs');
});

app.get('/signUp', (req, res) => {
    res.render('signUp.ejs');
});

app.get('/addFriends', (req, res) => {
    res.render('addFriends.ejs');
});

app.get('/addGame', (req, res) => {
    res.render('addGame.ejs');
});

app.get('/friendsWishlist', (req, res) => {
    res.render('friendsWishlist.ejs');
});

app.get('/aISearch', (req, res) => {
    res.render('aISearch.ejs');
});
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/profile', (req, res) => {
    res.render('profile.ejs');
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
    console.log("Express server running on port 3000")
})