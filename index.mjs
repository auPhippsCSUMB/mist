import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();

async function aiSearch(gameSearch) {
    const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: gameSearch,
        generationConfig: { responseMimeType: "application/json" },
    });
    // console.log(response.text);
    return response.text;
}

app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using the POST method
app.use(express.urlencoded({ extended: true }));

//setting sessions
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
    //   cookie: { secure: true }
}))

app.use((req, res, next) => {
    res.locals.fullName = req.session.fullName;
    console.log(req.url);
    next(); //next middleware/route
});

//setting up database connection pool, replace values in red
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, //put into env file
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
    waitForConnections: true
});

let token;

//routes
app.get('/', (req, res) => {
    res.render('login.ejs');
});

app.get('/home', isUserAuthenticated, async (req, res) => {
    let url = "https://id.twitch.tv/oauth2/token";
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`
    });

    const test = await response.json();
    token = test.access_token;
    console.log(test);

    res.render('home.ejs');
});

app.get('/search', isUserAuthenticated, async (req, res) => {
    res.render('search.ejs', { games: [] });
});

app.post('/search', isUserAuthenticated, async (req, res) => {
    let gameName = req.body.gameName;
    console.log(gameName);
    const gameMap = new Map();

    let url = "https://api.igdb.com/v4/games";
    // const response = await fetch(url, {
    //     method: "POST",
    //     headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
    //     body: `search \"${gameName}\"; fields name,cover,rating;`
    // });

    const response = await fetch(url, {
        method: "POST",
        headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        body: `where name ~ *\"${gameName}\"*; fields name,cover,rating,storyline; sort rating_count desc;`
    });

    const games = await response.json();
    console.log(games);

    for (let i = 0; i < games.length; i++) {
        gameMap.set(games[i].cover, "");
    }

    let gameCovers = "";

    if (games[0]) {
        for (let i = 0; i < games.length - 1; i++) {
            gameCovers = gameCovers + games[i].id + ",";
        }
        gameCovers = gameCovers + games[games.length - 1].id;

        // CODE THAT CAN BE USED FOR MORE GAME IMAGES LATER
        // let urlPic = "https://api.igdb.com/v4/games";
        // const responsePic = await fetch(urlPic, {
        //     method: "POST",
        //     headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        //     body: `fields screenshots.*; where id = ${id};`
        // });

        // const pics = await responsePic.json();
        // console.log(JSON.stringify(pics));

        let url2 = "https://api.igdb.com/v4/covers";
        const response2 = await fetch(url2, {
            method: "POST",
            headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
            body: `where game = (${gameCovers}); fields image_id;`
        });

        let finalCover = await response2.json();
        console.log(finalCover);

        for (let i = 0; i < finalCover.length; i++) {
            gameMap.set(finalCover[i].id, finalCover[i].image_id);
        }
    } else {
        games[0] = "No Results Found";
    }


    res.render('search.ejs', { games, gameMap });
});

app.get('/wishlist', isUserAuthenticated, async (req, res) => {
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

app.get('/signUp', async (req, res) => {
    res.render('signUp.ejs');
});

app.post('/signUp', async (req, res) => {
    const { username, password, firstName, lastName } = req.body;

    const sql = `INSERT INTO mistusers (username, password, firstName, lastName)
                 VALUES (?, ?, ?, ?)`;

    await pool.query(sql, [username, password, firstName, lastName]);
    res.redirect('/login');
});

app.get('/addFriends', isUserAuthenticated, async (req, res) => {
    const userID = req.session.userID;

    const sql = `SELECT userID, username, firstName, lastName
                 FROM mistusers
                 WHERE userID != ?`;

    const [users] = await pool.query(sql, [userID]);
    res.render('addFriends.ejs', { users });
});

app.post('/addFriends', isUserAuthenticated, async (req, res) => {
    const userID = req.session.userID;
    const friendUserID = req.body.friendUserID;

    const sql = `INSERT INTO mistfriends (userID, friendUserID, status) 
                 VALUES (?, ?, 'accepted')`;
    await pool.query(sql, [userID, friendUserID]);

    res.redirect('/friends');
});

app.get('/friends', isUserAuthenticated, async (req, res) => {
    const userID = req.session.userID;

    const sql = `SELECT u.userID, u.username, u.firstName, u.lastName
                 FROM mistfriends f
                 JOIN mistusers u ON f.friendUserID = u.userID
                 WHERE f.userID = ?`;

    const [friends] = await pool.query(sql, [userID]);
    res.render('friends.ejs', { friends });
});

app.get('/addGame', isUserAuthenticated, async (req, res) => {
    res.render('addGame.ejs');
});

app.post('/addToWishlist', isUserAuthenticated, async (req, res) => {
    const userID = req.session.userID;

    if (!userID) {
        return res.redirect('/login');
    }

    const { gameID, title } = req.body;

    const sqlGame = `INSERT INTO mistgames (gameID, title, genre, likes)
                     VALUES (?, ?, 'Unknown', 0)
                     ON DUPLICATE KEY UPDATE title = VALUES(title)`;

    await pool.query(sqlGame, [gameID, title]);

    const sqlWishlist = `INSERT INTO mistwishlist (userID, gameID)
                         VALUES (?, ?)`;

    await pool.query(sqlWishlist, [userID, gameID]);

    res.redirect('/wishlist');
});

app.get('/friendsWishlist', isUserAuthenticated, async (req, res) => {
    res.render('friendsWishlist.ejs', { wishlist: [] });
});

app.get('/friendsWishlist/:friendUserID', isUserAuthenticated, async (req, res) => {
    const friendUserID = req.params.friendUserID;

    const sql = `SELECT g.gameID, g.title, g.genre, g.likes
                 FROM mistwishlist w
                 JOIN mistgames g ON w.gameID = g.gameID
                 WHERE w.userID = ?`;

    const [wishlist] = await pool.query(sql, [friendUserID]);
    res.render('friendsWishlist.ejs', { friendUserID, wishlist });
});

app.get('/aISearch', isUserAuthenticated, async (req, res) => {
    res.render('aISearch.ejs', { games: [] });
});

app.post('/aISearch', isUserAuthenticated, async (req, res) => {
    let prompt = `You are a very concise agent that only returns the names of 
        games in a JSON Format with a max length of 3. No matter what 
        the contents of the search are, return game names in a JSON array format and do nothing else.
        The following content will be the user search: `

    prompt = prompt + req.body.prompt;

    let aiResults;
    let gameList = [];
    try {
        aiResults = await aiSearch(prompt);
        gameList = JSON.parse(aiResults);
    } catch (error) {
        console.log(error);
        gameList[0] = "AI search failed"
    }

    console.log(gameList);

    const gameMap = new Map();

    let url = "https://api.igdb.com/v4/games";

    const games = [];

    if (gameList[0] == "AI search failed") {
        games[0] = "AI Search Failed";
        res.render('aISearch.ejs', { games, gameMap });
    } else {
        for (let i = 0; i < 3; i++) {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
                body: `where name ~ *\"${gameList[i]}\"*; fields name,cover,rating; sort rating_count desc; limit 1;`
            });
            let aiGame = await response.json();
            games.push(aiGame[0]);
        }

        console.log(games);

        for (let i = 0; i < games.length; i++) {
            gameMap.set(games[i].cover, "");
        }

        let gameCovers = "";

        for (let i = 0; i < games.length - 1; i++) {
            gameCovers = gameCovers + games[i].id + ",";
        }
        gameCovers = gameCovers + games[games.length - 1].id;

        // CODE THAT CAN BE USED FOR MORE GAME IMAGES LATER
        // let urlPic = "https://api.igdb.com/v4/games";
        // const responsePic = await fetch(urlPic, {
        //     method: "POST",
        //     headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        //     body: `fields screenshots.*; where id = ${id};`
        // });

        // const pics = await responsePic.json();
        // console.log(JSON.stringify(pics));

        let url2 = "https://api.igdb.com/v4/covers";
        const response2 = await fetch(url2, {
            method: "POST",
            headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
            body: `where game = (${gameCovers}); fields image_id;`
        });

        let finalCover = await response2.json();
        console.log(finalCover);

        for (let i = 0; i < finalCover.length; i++) {
            gameMap.set(finalCover[i].id, finalCover[i].image_id);
        }


        res.render('aISearch.ejs', { games, gameMap });
    }


});

app.get('/login', async (req, res) => {
    res.render('login.ejs');
});

app.get('/profile', isUserAuthenticated, async (req, res) => {
    res.render('profile.ejs');
});

app.get('/logout', isUserAuthenticated, async (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});


app.post('/loginProcess', async (req, res) => {
    //    let username = req.body.username;
    //    let password = req.body.password;
    let { username, password } = req.body;

    let hashedPassword = "";

    let sql = `SELECT *
              FROM mistusers
              WHERE username = ?`;
    const [rows] = await pool.query(sql, [username]);

    if (rows.length > 0) { //username was found in the database
        hashedPassword = rows[0].password;
    }

    const match = await bcrypt.compare(password, hashedPassword);

    if (match) {
        req.session.authenticated = true;
        req.session.userID = rows[0].userID;
        req.session.fullName = rows[0].firstName + " " + rows[0].lastName;
        res.redirect("/home");
    } else {
        let loginError = "Wrong Credentials! Try again!"
        res.render('login.ejs', { loginError });
    }
});

// app.get('/apiTest', async (req, res) => {
//     // grant_type = client_credentials

//     let url = "https://id.twitch.tv/oauth2/token";
//     const response = await fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`
//     });

//     const test = await response.json();
//     token = test.access_token;
//     console.log(test);
//     console.log('test' + test.toString());
//     res.render('apiTest.ejs', { test });
// });


// app.get('/gameTest', async (req, res) => {
//     // grant_type = client_credentials

//     let url = "https://api.igdb.com/v4/games";
//     const response = await fetch(url, {
//         method: "POST",
//         headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
//         body: "fields *;"
//     });

//     const game = await response.json();
//     res.send(game);
// });

app.get('/gameSearch', isUserAuthenticated, async (req, res) => {

    let gameName = req.query.game;
    let covIds = [];
    const gameMap = new Map();

    let url = "https://api.igdb.com/v4/games";
    // const response = await fetch(url, {
    //     method: "POST",
    //     headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
    //     body: `search \"${gameName}\"; fields name,cover,rating;`
    // });

    const response = await fetch(url, {
        method: "POST",
        headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        body: `where name ~ *\"${gameName}\"*; fields name,cover,rating,storyline; sort rating_count desc;`
    });

    const game = await response.json();
    console.log(game);

    for (let i = 0; i < game.length; i++) {
        gameMap.set(game[i].cover, "");
    }

    let gameCovers = "";

    for (let i = 0; i < game.length - 1; i++) {
        gameCovers = gameCovers + game[i].id + ",";
    }
    gameCovers = gameCovers + game[game.length - 1].id;

    // CODE THAT CAN BE USED FOR MORE GAME IMAGES LATER
    // let urlPic = "https://api.igdb.com/v4/games";
    // const responsePic = await fetch(urlPic, {
    //     method: "POST",
    //     headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
    //     body: `fields screenshots.*; where id = ${id};`
    // });

    // const pics = await responsePic.json();
    // console.log(JSON.stringify(pics));

    let url2 = "https://api.igdb.com/v4/covers";
    const response2 = await fetch(url2, {
        method: "POST",
        headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        body: `where game = (${gameCovers}); fields image_id;`
    });

    let finalCover = await response2.json();

    for (let i = 0; i < game.length; i++) {
        gameMap.set(finalCover[i].id, finalCover[i].image_id);
    }

    res.render('gameSearch.ejs', { game, gameMap });
});

app.get('/gameInfo', isUserAuthenticated, async (req, res) => {

    let gameId = req.query.game;

    //endpoint for game url
    let url = "https://api.igdb.com/v4/games";

    const response = await fetch(url, {
        method: "POST",
        headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        body: `where id = ${gameId}; fields name,cover,rating,rating_count,storyline;`
    });

    const game = await response.json();

    //endpoint for cover url
    let url2 = "https://api.igdb.com/v4/covers";
    const response2 = await fetch(url2, {
        method: "POST",
        headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        body: `where game = ${game[0].id}; fields image_id;`
    });

    let finalCover = await response2.json();

    //endpoint for screenshots url
    let url3 = "https://api.igdb.com/v4/screenshots";
    const response3 = await fetch(url3, {
        method: "POST",
        headers: { "Client-ID": process.env.CLIENT_ID, "Authorization": "Bearer " + token },
        body: `where game = ${game[0].id}; fields image_id;`
    });
    let screenshots = await response3.json();
    console.log(screenshots);

    res.render('gameInfo.ejs', { game, finalCover, screenshots });
});

app.get('/deleteGame', isUserAuthenticated, async (req, res) => {
    const userID = req.session.userID;

    if (!userID) {
        return res.redirect('/login');
    }

    let gameId = req.query.game;

    let sql = `DELETE
              FROM mistwishlist
              WHERE gameID = ? AND userID = ?`;
    const [rows] = await pool.query(sql, [gameId, userID]);

    res.redirect('/wishlist');
});


function isUserAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect("/");
    }
}

app.listen(3000, () => {
    console.log("Express server running")
})