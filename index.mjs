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

function isUserAuthenticated(req, res, next) {
    if (req.session.userAuthenticated) {
        return next();
    } else {
        res.redirect('/');
    }
}

app.listen(3000, () => {
    console.log("Express server running on port 3000")
})