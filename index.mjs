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
})