import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import session from 'express-session';
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using the POST method
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
//setting up database connection pool, replace values in red
const pool = mysql.createPool({
    host: "x71wqc4m22j8e3ql.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "raf75r08n7zd5356",
    password: "zjcnac7j466tft93", //put into env file
    database: "aim59v409g7thmo2",
    connectionLimit: 10,
    waitForConnections: true
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

//routes
app.get('/', (req, res) => {
    res.render('home.ejs');
});

app.get('/search', (req, res) => {
    res.render('search.ejs', {games: []});
});

app.post('/search', async (req, res) => {
    const gameName = req.body.gameName;

    const response = await fetch(`https://api.igdb.com/v4/games`, {
        method: "POST",
        headers: {
            "Client-ID": process.env.CLIENT_ID,
            "Authorization": `Bearer ${process.env.ACCESS_TOKEN}`,
            "Content-Type": "text/plain"
        },
        body: `search "${gameName}"; fields name,cover.url; limit 10;`
    });

    const games = await response.json();
    console.log(games);
    res.render('search.ejs', { games });
});

app.get('/wishlist', async (req, res) => {
    const userID = req.session.userID;

    if (!userID) {
        return res.redirect('/login');
    }

    const sql = `SELECT g.gameID, g.title, g.genre, g.likes
                 FROM mistwishlist w
                 JOIN mistgames g ON w.gameID = g.gameID
                 WHERE w.userID = ?`;

    const [wishlist] = await pool.query(sql, [userID]);
    res.render('wishlist.ejs', { wishlist });
});



app.get('/signUp', (req, res) => {
    res.render('signUp.ejs');
});

app.post('/signUp', async (req, res) => {
    const { username, password, firstName, lastName } = req.body;
    
    const sql = `INSERT INTO mistusers (username, password, firstName, lastName)
                 VALUES (?, ?, ?, ?)`;

    await pool.query(sql, [username, password, firstName, lastName]);
    res.redirect('/login');
});

app.get('/addFriends', async (req, res) => {
    const userID = req.session.userID;

    const sql = `SELECT userID, username, firstName, lastName
                 FROM mistusers
                 WHERE userID != ?`;

    const [users] = await pool.query(sql, [userID]);
    res.render('addFriends.ejs', { users });
});

app.post('/addFriends', async (req, res) => {
    const userID = req.session.userID;
    const friendUserID = req.body.friendUserID;

    const sql = `INSERT INTO mistfriends (userID, friendUserID, status) 
                 VALUES (?, ?, 'accepted')`;
    await pool.query(sql, [userID, friendUserID]);

    res.redirect('/friends');  
});

app.get('/friends', async (req, res) => {
    const userID = req.session.userID;

    const sql = `SELECT u.userID, u.username, u.firstName, u.lastName
                 FROM mistfriends f
                 JOIN mistusers u ON f.friendUserID = u.userID
                 WHERE f.userID = ?`;

    const [friends] = await pool.query(sql, [userID]);
    res.render('friends.ejs', { friends });
});

app.get('/addGame', (req, res) => {
    res.render('addGame.ejs');
});

app.post('/addToWishlist', async (req, res) => {
    const userID = req.session.userID;

    if(!userID) {
        return res.redirect('/login');
    }

    const { gameID, title, genre } = req.body;

    const sqlGame = `INSERT INTO mistgames (gameID, title, genre, likes)
                     VALUES (?, ?, 'Unknown', 0)
                     ON DUPLICATE KEY UPDATE title = VALUES(title)`;
    
    await pool.query(sqlGame, [gameID, title]);

    const sqlWishlist = `INSERT INTO mistwishlist (userID, gameID)
                         VALUES (?, ?)`;

    await pool.query(sqlWishlist, [userID, gameID]);

    res.redirect('/wishlist');
});

app.get('/friendsWishlist/:friendUserID', async (req, res) => {
    const friendUserID = req.params.friendUserID;
    
const sql = `SELECT g.gameID, g.title, g.genre, g.likes
             FROM mistwishlist w
             JOIN mistgames g ON w.gameID = g.gameID
             WHERE w.userID = ?`;

const [wishlist] = await pool.query(sql, [friendUserID]);
    res.render('friendsWishlist.ejs', { friendUserID, wishlist });
});

app.get('/aISearch', (req, res) => {
    res.render('aISearch.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT *
                 FROM mistusers
                 WHERE username = ? AND password = ?`;

    const [users] = await pool.query(sql, [username, password]);

    if (users.length > 0) {
        req.session.userID = users[0].userID;
        req.session.username = users[0].username;
        res.redirect('/profile');
    } else {
        res.render('login.ejs', { error: "Invalid username or password" });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
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

app.listen(3010, () => {
    console.log("Express server running on port 3010")
})